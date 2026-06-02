const { Queue } = require('bullmq');
const Redis = require('ioredis');
const { getRedisOptions, USE_REDIS, sanitizedUrl } = require('../utils/redis');

if (USE_REDIS) {
  connection = new Redis(sanitizedUrl, getRedisOptions());

  // Define Queues
  parsingQueue = new Queue('resume-parsing', { connection });
  interviewQueue = new Queue('interview-evaluation', { connection });
  verificationQueue = new Queue('skill-verification', { connection });
} else {
  console.log('📦 Queues running in Mock Mode (No Redis)');
  // Provide mock objects to prevent crashes in other files
  const MockQueue = { add: async () => ({ id: 'mock' }) };
  parsingQueue = MockQueue;
  interviewQueue = MockQueue;
  verificationQueue = MockQueue;
}

module.exports = {
  parsingQueue,
  interviewQueue,
  verificationQueue,
  connection
};
