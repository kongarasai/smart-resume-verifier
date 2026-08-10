require('dotenv').config();
require('express-async-errors');
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
const { authenticate } = require('./middleware/auth');

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// ── 1. SECURITY MIDDLEWARE ────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-origin' }, // Prevent cross-origin resource sharing
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));

app.use(metricsMiddleware);

// CORS — explicit allowlist only. Never reflect all origins with credentials.
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'capacitor://localhost',
  'http://localhost'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no origin header) e.g. mobile native or curl
    if (!origin) return callback(null, true);
    
    // In development, allow any local origin (localhost, 127.0.0.1, or local IP)
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    logger.warn(`CORS rejected origin: ${origin}`);
    return callback(new Error(`CORS policy: origin ${origin} not allowed`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'ngrok-skip-browser-warning'],
  exposedHeaders: ['x-csrf-token']
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CSRF
app.use(generateCsrfToken);
app.use('/api', csrfProtection);

// ── 2. RATE LIMITING ─────────────────────────────────────────────────────────
// Strict limits for auth endpoints — brute-force protection
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_AUTH || '20', 10), // 20 attempts/15min in production
  message: { error: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Moderate limit for general API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_API || '200', 10),
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Resource-aware limit for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_AI || '50', 10),
  message: { error: 'AI quota reached for this hour. Please try again later.' }
});

// File upload limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_UPLOAD || '30', 10),
  message: { error: 'Upload quota exceeded. Please try again later.' }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/', apiLimiter);
app.use('/api/mock-interview', aiLimiter);
app.use('/api/questions/generate', aiLimiter);
app.use('/api/profile/resume', uploadLimiter);
app.use('/api/profile/photo', uploadLimiter);

// Performance Logger
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

// ── 3. ROUTES & STATIC FILES ─────────────────────────────────────────────────
// Resume files require authentication — served via authenticated route, not static
// The /uploads path is NOT exposed publicly
app.use('/api', routes);

// Authenticated resume file serving — users can only access their own resumes
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const fs = require('fs');
app.get('/uploads/resumes/:filename', authenticate, (req, res) => {
  const filename = path.basename(req.params.filename); // Sanitize path traversal
  const ownerId = filename.split('-')[0]; // Files named: {userId}-{timestamp}-{random}.ext

  // Ownership check: only the file owner or privileged roles can access
  const allowedRoles = ['hr', 'mentor', 'teacher', 'admin'];
  if (req.user.id !== ownerId && !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied to this resume' });
  }

  const filePath = path.join(UPLOADS_DIR, 'resumes', filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.sendFile(filePath);
});

// Other upload types (photos, attachments) — still require auth, less strict ownership
app.use('/uploads/photos', authenticate, express.static(path.join(UPLOADS_DIR, 'photos'), { maxAge: '1d' }));
app.use('/uploads/attachments', authenticate, express.static(path.join(UPLOADS_DIR, 'attachments'), { maxAge: '1d' }));

app.get('/health', (req, res) => res.json({
  status: 'UP',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV
}));

app.get('/metrics', getMetrics);

// ── 4. ERROR HANDLING ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;

  // Never expose stack traces to the client in production
  if (process.env.NODE_ENV !== 'production') {
    logger.error({ message: err.message, stack: err.stack, path: req.path, method: req.method });
  } else {
    logger.error({ message: err.message, path: req.path, method: req.method });
  }

  // Log to secure file outside web root
  const logDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(
    path.join(logDir, 'backend_err.log'),
    `[${new Date().toISOString()}] ${req.method} ${req.path} - ${err.message}\n`
    // Stack trace only in dev log
    + (process.env.NODE_ENV !== 'production' ? err.stack + '\n' : '')
  );

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : err.message,
    code: err.code || 'UNKNOWN_ERROR'
  });
});

// ── 5. SOCKET.IO ──────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  }
});

app.set('io', io);
global.io = io;
const connectedUsers = new Map();
app.set('connectedUsers', connectedUsers);

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId && userId !== 'undefined') {
    if (!connectedUsers.has(userId)) connectedUsers.set(userId, new Set());
    connectedUsers.get(userId).add(socket.id);
    socket.join(`user:${userId}`);
  }

  socket.on('disconnect', () => {
    if (userId && connectedUsers.has(userId)) {
      connectedUsers.get(userId).delete(socket.id);
      if (connectedUsers.get(userId).size === 0) connectedUsers.delete(userId);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Smart Resume Verifier backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = { app, server };
