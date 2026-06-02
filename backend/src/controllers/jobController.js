const { aiQueue } = require('../services/queueService');
const logger = require('../utils/logger');

const getJobStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const job = await aiQueue.getJob(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const state = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;
    const reason = job.failedReason;

    res.json({
      id: job.id,
      state,
      progress,
      result,
      reason,
      isCompleted: state === 'completed',
      isFailed: state === 'failed'
    });
  } catch (err) {
    logger.error(`Failed to get job status: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
};

module.exports = { getJobStatus };
