require('dotenv').config();
require('express-async-errors'); // Must be required before routes
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const logger = require('./utils/logger');
const routes = require('./routes');
const { aiWorker, interviewWorker } = require('./workers/aiWorker');
const { metricsMiddleware, getMetrics } = require('./middleware/metrics');
const { csrfProtection, generateCsrfToken } = require('./middleware/security');

const app = express();
app.set('trust proxy', 1); // Trust Ngrok proxy for rate limiting
const server = http.createServer(app);

// 1. SECURITY MIDDLEWARE
app.use(helmet({ 
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false // Disable CSP in dev for easier testing
}));

app.use(metricsMiddleware);

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow all origins for mobile debugging while supporting credentials
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'ngrok-skip-browser-warning', 'Bypass-Tunnel-Reminder'],
  exposedHeaders: ['x-csrf-token']
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security: CSRF
app.use(generateCsrfToken);
app.use('/api', csrfProtection);

// 2. RATE LIMITING
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000, // Significantly increased for mobile/ngrok testing
  message: { error: 'Too many requests, please try again later.' }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Increased AI quota for testing
  message: { error: 'AI quota reached for this hour. Please try again later.' }
});

app.use('/api/', apiLimiter);
app.use('/api/mock-interview', aiLimiter);
app.use('/api/questions/generate', aiLimiter);

// Performance Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn(`Slow Request: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
  });
  next();
});

// 3. ROUTES & STATIC FILES
const UPLOADS_DIR = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(UPLOADS_DIR, { 
  maxAge: '1d',
  setHeaders: (res) => res.set('Access-Control-Allow-Origin', '*') 
}));

app.use('/api', routes);

app.get('/health', (req, res) => res.json({ 
  status: 'UP', 
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV 
}));

app.get('/metrics', getMetrics);

// 4. ERROR HANDLING
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  logger.error({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });
  
  require('fs').appendFileSync(require('path').join(__dirname, '../backend_err.log'), `[${new Date().toISOString()}] ${req.method} ${req.path} - ${err.message}\n${err.stack}\n`);
  
  res.status(statusCode).json({ 
    error: statusCode === 500 ? 'Internal Server Error' : err.message,
    code: err.code || 'UNKNOWN_ERROR'
  });
});

// 5. SOCKET.IO (Real-time Layer)
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  }
});

// Attach io to app for use in controllers
app.set('io', io);
global.io = io;
const connectedUsers = new Map(); // userId -> Set of socketIds
app.set('connectedUsers', connectedUsers);

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId && userId !== 'undefined') {
    if (!connectedUsers.has(userId)) connectedUsers.set(userId, new Set());
    connectedUsers.get(userId).add(socket.id);
    logger.info(`User ${userId} connected (Socket: ${socket.id})`);
  } else {
    logger.info(`Anonymous socket connected: ${socket.id}`);
  }

  socket.on('disconnect', () => {
    if (userId && connectedUsers.has(userId)) {
      connectedUsers.get(userId).delete(socket.id);
      if (connectedUsers.get(userId).size === 0) connectedUsers.delete(userId);
    }
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// 6. STARTUP & GRACEFUL SHUTDOWN
const PORT = process.env.PORT || 5000;

async function startServer() {
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Smart Resume Verifier [${process.env.NODE_ENV}] running on port ${PORT}`);
  });
}

startServer();

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated.');
    process.exit(0);
  });
});

module.exports = { app, server };
