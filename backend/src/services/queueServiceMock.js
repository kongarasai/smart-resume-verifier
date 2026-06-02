const logger = require('../utils/logger');

/**
 * Enterprise Queue Mock.
 * Synchronously executes 'background' jobs for development environments without Redis.
 */
const addAIJob = async (data) => {
  logger.info('🧪 [Queue:Mock] Enqueuing AI job (Synchronous Fallback)');
  const { aiWorker } = require('../workers');
  
  // Simulate async behavior with a slight delay
  setTimeout(async () => {
    try {
      await aiWorker.process({ data, id: `mock-job-${Date.now()}`, getState: () => 'completed' });
    } catch (err) {
      logger.error('[Queue:Mock] Job execution failed:', err.message);
    }
  }, 1000);

  return { id: `mock-job-${Date.now()}` };
};

const addRankingJob = async (groupId) => {
  logger.info(`🧪 [Queue:Mock] Enqueuing Ranking job for ${groupId || 'Overall'}`);
  const { recalculateGroupRanking, recalculateOverallRanking } = require('./rankingService');
  setTimeout(async () => {
    if (groupId) await recalculateGroupRanking(groupId);
    await recalculateOverallRanking();
  }, 2000);
};

module.exports = { addAIJob, addRankingJob };
