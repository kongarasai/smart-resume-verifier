const { USE_REDIS } = require('../utils/redis');
const logger = require('../utils/logger');

let aiWorker = null;
let processAIGeneration = null;

if (USE_REDIS) {
  const { Worker } = require('bullmq');
  const IORedis = require('ioredis');
  const { generateBatches } = require('../services/ai/batchGenerator');
  const { query } = require('../config/database');

  const { getRedisOptions, sanitizedUrl } = require('../utils/redis');
  const connection = new IORedis(sanitizedUrl, getRedisOptions());

  processAIGeneration = async (job) => {
    const { topic, count, difficulty, userId } = job.data;
    logger.info(`[Worker:AI] Generating ${count} MCQs on topic: ${topic}`);
    const questions = await generateBatches(topic, count, difficulty);
    for (const q of questions) {
      await query(
        `INSERT INTO questions (created_by, category, difficulty, title, description, question_type, options, correct_answer)
         VALUES ($1,'technical_mcq',$2,$3,$4,'mcq',$5,$6)`,
        [userId, difficulty, q.question, q.question,
         JSON.stringify(q.options.map((opt, i) => ({ id: String.fromCharCode(65 + i), text: opt }))),
         (q.correctAnswer || 'A').toUpperCase()]
      );
    }
    return { success: true, count: questions.length };
  };

  aiWorker = new Worker('ai-generation', processAIGeneration, { connection, concurrency: 2 });
  logger.info('🚀 BullMQ Workers started (Redis mode)');
} else {
  logger.info('📦 Workers skipped — running in Mock Queue mode');
}

module.exports = { aiWorker, processAIGeneration };
