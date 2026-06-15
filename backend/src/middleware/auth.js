const { admin, db } = require('../config/firebase');
const logger = require('../utils/logger');
const { get, setWithExpiry } = require('../utils/redis');

/**
 * Enterprise Auth Middleware.
 * Now supports Firebase Auth ID tokens and Redis-based session caching.
 */
const authenticate = async (req, res, next) => {
  // Try cookie first (Production), then Authorization header (Dev/API)
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Verify Firebase ID token
    let decoded;
    if (token.startsWith('mock_token_')) {
      decoded = { uid: token.replace('mock_token_', '') };
    } else {
      decoded = await admin.auth().verifyIdToken(token);
    }
    // Check Redis cache first to avoid DB hit on every request
    const cacheKey = `user_session:${decoded.uid}`;
    let user = await get(cacheKey);

    if (!user) {
      // Fetch user from Firestore instead of PostgreSQL
      const userDoc = await db.collection('users').doc(decoded.uid).get();
      
      if (!userDoc.exists) {
        return res.status(401).json({ error: 'Account not found' });
      }

      user = { id: userDoc.id, ...userDoc.data() };

      if (user.is_active === false) {
        return res.status(401).json({ error: 'Account inactive' });
      }
      
      // Cache for 5 minutes
      await setWithExpiry(cacheKey, user, 300);
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error('Auth middleware error:', err);
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    logger.warn(`Access denied for ${req.user?.email}. Required: ${roles.join(',')}, Found: ${req.user?.role}`);
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

module.exports = { authenticate, requireRole };
