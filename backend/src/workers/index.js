const { USE_REDIS } = require('../utils/redis');
const logger = require('../utils/logger');

let aiWorker = null;
let processAIGeneration = null;

if (USE_REDIS) {
  const { Worker } = require('bullmq');
  const IORedis = require('ioredis');
  const { generateBatches } = require('../services/ai/batchGenerator');
  const { db, admin } = require('../config/firebase');

  const { getRedisOptions, sanitizedUrl } = require('../utils/redis');
  const connection = new IORedis(sanitizedUrl, getRedisOptions());

  processAIGeneration = async (job) => {
    const { topic, count, difficulty, userId } = job.data;
    logger.info(`[Worker:AI] Generating ${count} MCQs on topic: ${topic}`);
    const questions = await generateBatches(topic, count, difficulty);
    
    const batch = db.batch();
    for (const q of questions) {
      const docRef = db.collection('questions').doc();
      batch.set(docRef, {
        created_by: userId,
        category: 'technical_mcq',
        difficulty: difficulty,
        title: q.question || q.title,
        description: q.question || q.title,
        question_type: 'mcq',
        options: q.options.map((opt, i) => ({ id: String.fromCharCode(65 + i), text: opt.text || opt })),
        correct_answer: (q.correctAnswer || q.correct_answer || 'A').toUpperCase(),
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    await batch.commit();
    return { success: true, count: questions.length };
  };

  aiWorker = new Worker('ai-generation', processAIGeneration, { connection, concurrency: 2 });
  logger.info('🚀 BullMQ Workers started (Redis mode)');
} else {
  logger.info('📦 Workers skipped — running in Mock Queue mode');
}

module.exports = { aiWorker, processAIGeneration };
