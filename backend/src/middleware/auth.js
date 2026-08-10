const { admin, db } = require('../config/firebase');
const logger = require('../utils/logger');
const { get, setWithExpiry } = require('../utils/redis');

// ── In-process session cache (fallback when Redis not available) ──────────────
const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes
const inMemoryCache = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of inMemoryCache) {
    if (val.expiresAt < now) inMemoryCache.delete(key);
  }
}, 2 * 60 * 1000);

const getCached = (token) => {
  const entry = inMemoryCache.get(token);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) { inMemoryCache.delete(token); return null; }
  return entry.user;
};

const setCached = (token, user) => {
  if (inMemoryCache.size > 500) {
    const firstKey = inMemoryCache.keys().next().value;
    inMemoryCache.delete(firstKey);
  }
  inMemoryCache.set(token, { user, expiresAt: Date.now() + SESSION_TTL_MS });
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Enterprise Auth Middleware.
 * Requires a valid Firebase ID token — NO mock_token fallback in any environment.
 * Supports Redis-based session caching for performance.
 */
const authenticate = async (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Explicitly reject predictable mock tokens
  if (token.startsWith('mock_token_')) {
    logger.warn(`Rejected mock token attempt from ${req.ip}`);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  // 1. Check fast in-process cache (avoids Firebase round-trip)
  const cachedUser = getCached(token);
  if (cachedUser) {
    req.user = cachedUser;
    return next();
  }

  try {
    // 2. Verify Firebase ID token — this validates signature, expiry, audience
    const decoded = await admin.auth().verifyIdToken(token);

    // 3. Check Redis cache to avoid Firestore DB hit
    const cacheKey = `user_session:${decoded.uid}`;
    let user = await get(cacheKey);

    if (!user) {
      // 4. Fetch user from Firestore
      const userDoc = await db.collection('users').doc(decoded.uid).get();

      if (!userDoc.exists) {
        return res.status(401).json({ error: 'Account not found' });
      }

      user = { id: userDoc.id, ...userDoc.data() };

      if (user.is_active === false) {
        return res.status(401).json({ error: 'Account inactive' });
      }

      // Cache in Redis (5 min)
      await setWithExpiry(cacheKey, user, 300);
    }

    // 5. Store in fast in-process cache for subsequent requests
    setCached(token, user);

    req.user = user;
    next();
  } catch (err) {
    logger.warn(`Auth failed from ${req.ip}: ${err.message}`);
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
