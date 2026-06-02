const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Enterprise Security Middleware.
 * Implements Double Submit Cookie pattern for CSRF protection.
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF in development
  if (process.env.NODE_ENV !== 'production') return next();
  
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Allow trusted frontend origins to bypass strict CSRF check
  const origin = req.headers.origin;
  const trustedFrontends = [
    'https://smart-resume-verifier.vercel.app',
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL
  ].filter(Boolean);

  if (origin) {
    const isVercel = origin.endsWith('.vercel.app');
    const isTrusted = trustedFrontends.some(url => origin.startsWith(url) || url.startsWith(origin));
    const isLocalhost = origin.startsWith('http://localhost');
    
    if (isVercel || isTrusted || isLocalhost) {
      return next();
    }
  }

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
      secure: true,
      sameSite: 'none',
      partitioned: true,
      maxAge: 24 * 60 * 60 * 1000
    });
  }
  next();
};

module.exports = {
  csrfProtection,
  generateCsrfToken
};
