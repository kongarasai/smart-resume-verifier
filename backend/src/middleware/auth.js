const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../utils/logger');
const { get, setWithExpiry } = require('../utils/redis');

/**
 * Enterprise Auth Middleware.
 * Now supports HttpOnly cookies and Redis-based session caching.
 */
const authenticate = async (req, res, next) => {
  // Try cookie first (Production), then Authorization header (Dev/API)
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check Redis cache first to avoid DB hit on every request
    const cacheKey = `user_session:${decoded.id}`;
    let user = await get(cacheKey);

    if (!user) {
      const result = await query('SELECT id, email, role, full_name, is_active FROM users WHERE id = $1', [decoded.id]);
      user = result.rows[0];
      
      if (!user || !user.is_active) {
        return res.status(401).json({ error: 'Account inactive or not found' });
      }
      
      // Cache for 5 minutes
      await setWithExpiry(cacheKey, user, 300);
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    logger.warn(`Access denied for ${req.user.email}. Required: ${roles.join(',')}, Found: ${req.user.role}`);
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

module.exports = { authenticate, requireRole };
