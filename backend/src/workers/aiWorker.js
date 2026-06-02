const { USE_REDIS } = require('../utils/redis');
const logger = require('../utils/logger');

let aiWorker = null;
let interviewWorker = null;

if (USE_REDIS) {
  const { Worker } = require('bullmq');
  const IORedis = require('ioredis');
  const { pool } = require('../config/database');
  const { analyzeResumeWithAI, evaluateInterviewWithAI } = require('../utils/aiProviders');

  const { getRedisOptions, sanitizedUrl } = require('../utils/redis');
  const connection = new IORedis(sanitizedUrl, getRedisOptions());

  aiWorker = new Worker('resume-parsing', async job => {
    const { resumeText, userId } = job.data;
    logger.info(`[Worker:Parsing] Processing resume for user ${userId}`);
    
    try {
      const analysis = await analyzeResumeWithAI(resumeText);
      await pool.query(
        'INSERT INTO resume_feedback (user_id, score, feedback) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET score = $2, feedback = $3',
        [userId, analysis.score, JSON.stringify(analysis.tips)]
      );

      if (global.io) {
        global.io.to(`user_${userId}`).emit('RESUME_PARSED', { 
          score: analysis.score,
          tips: analysis.tips 
        });
      }
      return analysis;
    } catch (err) {
      logger.error(`[Worker:Parsing] Error: ${err.message}`);
      throw err;
    }
  }, { connection });

  interviewWorker = new Worker('interview-evaluation', async job => {
    const { sessionData, userId } = job.data;
    logger.info(`[Worker:Interview] Evaluating session for user ${userId}`);

    try {
      const evaluation = await evaluateInterviewWithAI(sessionData);
      await pool.query(
        'UPDATE mock_interview_sessions SET feedback = $1, overall_score = $2 WHERE id = $3',
        [JSON.stringify(evaluation.feedback), evaluation.overall_score, sessionData.sessionId]
      );

      if (global.io) {
        global.io.to(`user_${userId}`).emit('INTERVIEW_EVALUATED', { 
          score: evaluation.overall_score 
        });
      }
      return evaluation;
    } catch (err) {
      logger.error(`[Worker:Interview] Error: ${err.message}`);
      throw err;
    }
  }, { connection });

  aiWorker.on('completed', job => logger.info(`Job ${job.id} (parsing) completed`));
  aiWorker.on('failed', (job, err) => logger.error(`Job ${job.id} (parsing) failed: ${err.message}`));
  
  logger.info('🚀 Industry-Level Workers started (Redis mode)');
} else {
  logger.info('📦 Background Workers skipped — running in Mock mode (No Redis)');
}

module.exports = { aiWorker, interviewWorker };
