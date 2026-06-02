const client = require('prom-client');
const logger = require('../utils/logger');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'smart-resume-verifier'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Custom Metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in microseconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const aiProcessingCounter = new client.Counter({
  name: 'ai_processing_total',
  help: 'Total number of AI processing requests',
  labelNames: ['type', 'status']
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(aiProcessingCounter);

const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    httpRequestDurationMicroseconds.labels(req.method, route, res.statusCode).observe(duration);
  });
  next();
};

const getMetrics = async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

module.exports = {
  metricsMiddleware,
  getMetrics,
  aiProcessingCounter
};
