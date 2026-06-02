const logger = require('./logger');

/**
 * Enterprise Redis Mock.
 * Allows the application to run in 'Low Dependency' mode on machines without Redis.
 * Supports basic GET/SET with expiration for session caching and AI health.
 */
class RedisMock {
  constructor() {
    this.storage = new Map();
    this.expirations = new Map();
    logger.warn('⚠️ Redis not found. Running in "Low Dependency" Mock mode.');
  }

  async set(key, value, mode, seconds) {
    this.storage.set(key, value);
    if (mode === 'EX' && seconds) {
      setTimeout(() => this.storage.delete(key), seconds * 1000);
    }
    return 'OK';
  }

  async get(key) {
    return this.storage.get(key) || null;
  }

  async del(key) {
    return this.storage.delete(key);
  }

  on(event, callback) {
    if (event === 'connect') setTimeout(callback, 100);
  }
}

module.exports = RedisMock;
