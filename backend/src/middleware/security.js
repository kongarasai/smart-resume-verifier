const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Enterprise CSRF Protection Middleware.
 * Implements Double Submit Cookie pattern.
 * ENABLED in development, staging, AND production.
 * Do NOT disable in non-production environments.
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for auth endpoints — they are rate-limited and CSRF-safe by design
  // (an attacker forcing a victim to log in as someone else gives no meaningful benefit)
  const AUTH_EXEMPT = ['/auth/login', '/auth/register', '/auth/refresh'];
  if (AUTH_EXEMPT.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Allow trusted frontend origins that use Authorization header bearer tokens
  // (Bearer-token based auth is CSRF-safe by design — no auto-sent credentials)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  const origin = req.headers.origin;
  const trustedFrontends = [
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'capacitor://localhost'
  ].filter(Boolean);

  if (origin) {
    const isTrusted = trustedFrontends.some(url => origin === url || origin.startsWith(url));
    const isLocalhost = origin.startsWith('http://localhost');
    const isCapacitor = origin === 'capacitor://localhost';

    if (isTrusted || isLocalhost || isCapacitor) {
      // Still validate CSRF token for cookie-based requests from trusted origins
      const csrfToken = req.headers['x-csrf-token'];
      const csrfCookie = req.cookies['csrf-token'];

      if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
        logger.warn(`CSRF validation failed for ${req.path} from ${req.ip} (trusted origin: ${origin})`);
        return res.status(403).json({ error: 'Invalid CSRF token' });
      }
      return next();
    }
  }

  // Unknown origin — strict CSRF check
  const csrfToken = req.headers['x-csrf-token'];
  const csrfCookie = req.cookies['csrf-token'];

  if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
    logger.warn(`CSRF attempt blocked for ${req.path} from ${req.ip}`);
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};

const generateCsrfToken = (req, res, next) => {
  if (!req.cookies['csrf-token']) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('csrf-token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });
  }
  next();
};

module.exports = {
  csrfProtection,
  generateCsrfToken
};
