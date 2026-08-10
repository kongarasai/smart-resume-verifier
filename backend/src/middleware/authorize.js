/**
 * Authorization Helpers — IDOR Prevention
 * =========================================
 * Provides centralized ownership and role-based access checks
 * for all parameterized endpoints containing :userId or :candidateId.
 *
 * Usage:
 *   const { canAccessUser, privilegedRoles } = require('../middleware/authorize');
 *   if (!canAccessUser(req, targetUserId)) return res.status(403).json({ error: 'Forbidden' });
 */

// Roles that are allowed to read other users' data
const PRIVILEGED_READ_ROLES = ['hr', 'mentor', 'teacher', 'admin'];

// Roles that are allowed to write/modify other users' data
const PRIVILEGED_WRITE_ROLES = ['admin'];

/**
 * Returns true if the requesting user can READ the target user's data.
 * Candidates can only read their own data.
 * HR, Mentor, Teacher, Admin can read any candidate's data.
 */
const canReadUser = (req, targetUserId) => {
  if (!req.user) return false;
  if (req.user.id === targetUserId) return true;
  return PRIVILEGED_READ_ROLES.includes(req.user.role);
};

/**
 * Returns true if the requesting user can WRITE to the target user's data.
 * Only admins can write to other users' data.
 */
const canWriteUser = (req, targetUserId) => {
  if (!req.user) return false;
  if (req.user.id === targetUserId) return true;
  return PRIVILEGED_WRITE_ROLES.includes(req.user.role);
};

/**
 * Express middleware factory: checks ownership or privileged role for :userId param.
 * Use as route-level middleware for routes with :userId.
 *
 * Example:
 *   router.get('/score/:userId', authenticate, requireOwnerOrPrivileged(), handler);
 */
const requireOwnerOrPrivileged = (paramName = 'userId') => (req, res, next) => {
  const targetId = req.params[paramName];
  if (!targetId) return next(); // No param — let handler decide
  if (!canReadUser(req, targetId)) {
    return res.status(403).json({ error: 'Access denied: you can only access your own data' });
  }
  next();
};

/**
 * Express middleware factory: strict ownership check (no privileged role bypass).
 * Use for routes where even privileged roles should not access another user's private data.
 */
const requireStrictOwner = (paramName = 'userId') => (req, res, next) => {
  const targetId = req.params[paramName];
  if (!targetId) return next();
  if (req.user.id !== targetId) {
    return res.status(403).json({ error: 'Access denied: strict ownership required' });
  }
  next();
};

module.exports = {
  canReadUser,
  canWriteUser,
  requireOwnerOrPrivileged,
  requireStrictOwner,
  PRIVILEGED_READ_ROLES,
  PRIVILEGED_WRITE_ROLES
};
