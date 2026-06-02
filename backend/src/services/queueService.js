const { USE_REDIS } = require('../utils/redis');
const logger = require('../utils/logger');

let addRankingJob, addAIJob, rankingQueue, aiQueue;

if (!USE_REDIS) {
  // --- LOCAL MOCK MODE (no Redis) ---
  const debounceMap = new Map();

  addRankingJob = async (groupId) => {
    const key = groupId || 'overall';
    
    // Clear existing timer for this key if it exists
    if (debounceMap.has(key)) {
      clearTimeout(debounceMap.get(key));
    }

    logger.info(`[Queue:Mock] Ranking job for ${key} queued (debounced)`);

    const timer = setTimeout(async () => {
      try {
        debounceMap.delete(key);
        const { recalculateGroupRanking, recalculateOverallRanking } = require('./rankingService');
        
        if (groupId) {
          logger.info(`[Queue:Mock] Executing: Group Ranking for ${groupId}`);
          await recalculateGroupRanking(groupId);
        } else {
          logger.info(`[Queue:Mock] Executing: Overall Ranking`);
          await recalculateOverallRanking();
        }
      } catch (e) { 
        logger.error('[Queue:Mock] Ranking failed:', e.message); 
      }
    }, 5000); // 5 second debounce

    debounceMap.set(key, timer);
  };

  addAIJob = async (data) => {
    const jobId = `mock-${Date.now()}`;
    logger.info(`[Queue:Mock] AI job ${jobId} queued`);
    // Import here to avoid circular deps
    const { generateBatches } = require('./ai/batchGenerator');
    const { query } = require('../config/database');
    setTimeout(async () => {
      try {
        const questions = await generateBatches(data.topic, data.count, data.difficulty);
        for (const q of questions) {
          await query(
            `INSERT INTO questions (created_by, category, difficulty, title, description, question_type, options, correct_answer)
             VALUES ($1, 'technical_mcq', $2, $3, $4, 'mcq', $5, $6)`,
            [data.userId, data.difficulty, q.question, q.question,
             JSON.stringify(q.options.map((opt, i) => ({ id: String.fromCharCode(65 + i), text: opt }))),
             (q.correctAnswer || 'A').toUpperCase()]
          );
        }
        logger.info(`[Queue:Mock] AI job ${jobId} complete: saved ${questions.length} questions`);
      } catch (err) {
        logger.error(`[Queue:Mock] AI job ${jobId} failed: ${err.message}`);
      }
    }, 100);
    return { id: jobId };
  };
} else {
  // --- PRODUCTION BULLMQ MODE (with Redis) ---
  const { Queue } = require('bullmq');
  const IORedis = require('ioredis');

  const { getRedisOptions, sanitizedUrl } = require('../utils/redis');
  const connection = new IORedis(sanitizedUrl, getRedisOptions());

  rankingQueue = new Queue('ranking-updates', { connection });
  aiQueue = new Queue('ai-generation', { connection });

  addRankingJob = async (groupId) => {
    const jobId = groupId ? `ranking-group-${groupId}` : 'ranking-overall';
    await rankingQueue.add('recalculate', { groupId }, {
      jobId,
      delay: 10000,
      removeOnComplete: true,
    });
  };

  addAIJob = async (data) => {
    return await aiQueue.add('generate', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
    });
  };
}

module.exports = { rankingQueue, addRankingJob, aiQueue, addAIJob };
