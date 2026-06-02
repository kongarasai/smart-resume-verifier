const IORedis = require('ioredis');
const logger = require('./logger');
const RedisMock = require('./redisMock');

const getRedisOptions = () => {
  const options = {
    maxRetriesPerRequest: null,
    connectTimeout: 10000,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 500, 2000)),
  };

  if (process.env.REDIS_URL && process.env.REDIS_URL.includes('rediss://')) {
    options.tls = { rejectUnauthorized: false };
  }
  return options;
};

// Sanitize URL (Handle common mistakes like including 'redis-cli -u' in the string)
let sanitizedUrl = process.env.REDIS_URL || '';
if (sanitizedUrl.includes(' -u ')) {
  sanitizedUrl = sanitizedUrl.split(' -u ')[1].split(' ')[0];
} else if (sanitizedUrl.startsWith('redis-cli')) {
  const match = sanitizedUrl.match(/redis?s:\/\/[^\s]+/);
  if (match) sanitizedUrl = match[0];
}

const USE_REDIS = !!sanitizedUrl && 
                  sanitizedUrl !== 'mock' && 
                  !sanitizedUrl.includes('localhost') && 
                  !sanitizedUrl.includes('127.0.0.1');

let redis;

if (USE_REDIS) {
  const mainOptions = getRedisOptions();
  mainOptions.maxRetriesPerRequest = 1; 
  redis = new IORedis(sanitizedUrl, mainOptions);
  
  redis.on('connect', () => logger.info('📌 Connected to Upstash Redis (TLS)'));
  redis.on('error', (err) => {
    logger.warn(`Redis unavailable (${err.message}). Mock mode will be used.`);
  });
} else {
  redis = new RedisMock();
}

const setWithExpiry = async (key, value, seconds) => {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', seconds);
  } catch { /* fail silently */ }
};

const get = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

module.exports = { redis, setWithExpiry, get, USE_REDIS, getRedisOptions, sanitizedUrl };
