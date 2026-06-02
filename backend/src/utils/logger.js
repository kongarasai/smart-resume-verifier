const pino = require('pino');
const Sentry = require('@sentry/node');

// 1. Sentry Initialization
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
}

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

// Wrap logger.error to also send to Sentry
const originalError = logger.error.bind(logger);
logger.error = (obj, ...args) => {
  if (process.env.SENTRY_DSN) {
    if (obj instanceof Error) {
      Sentry.captureException(obj);
    } else if (typeof obj === 'string') {
      Sentry.captureMessage(obj);
    } else if (obj.error) {
      Sentry.captureException(new Error(obj.error));
    }
  }
  return originalError(obj, ...args);
};

module.exports = logger;
module.exports.Sentry = Sentry;
