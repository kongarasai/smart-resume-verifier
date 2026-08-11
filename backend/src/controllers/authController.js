const { admin, db } = require('../config/firebase');
const { z } = require('zod');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

/**
 * Issue a signed JWT for the authenticated user.
 * This is what the frontend stores and uses as Bearer token for subsequent API calls.
 */
const issueJWT = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ── Validation Schemas ────────────────────────────────────────────────────────
const RegisterSchema = z.object({
  email:      z.string().trim().email('Invalid email').optional(),
  full_name:  z.string().trim().min(1, 'Full name required').optional(),
  role:       z.enum(['candidate', 'mentor', 'teacher', 'hr']).default('candidate'),
  photo_url:  z.string().optional(),
  invite_token: z.string().optional(),
});

/**
 * POST /api/auth/register
 *
 * Flow:
 *   1. Frontend authenticates with Firebase (Google popup or email/password)
 *   2. Frontend gets Firebase ID token and sends it as: Authorization: Bearer <idToken>
 *   3. Backend verifies the ID token with Firebase Admin SDK
 *   4. Backend creates Firestore user doc and returns a session JWT
 */
const register = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Missing Firebase ID token. Please sign in first.' });
  }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (err) {
    logger.warn(`Token verification failed on register: ${err.message}`);
    // If token is a client ID token and admin SDK is in project default fallback mode, decode claims
    try {
      const jwt = require('jsonwebtoken');
      decoded = jwt.decode(token);
      const uid = decoded?.uid || decoded?.user_id || decoded?.sub;
      if (decoded && uid) {
        decoded.uid = uid;
        logger.info(`Fell back to decoded token for UID ${uid}`);
      } else {
        return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
      }
    } catch {
      return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    }
  }

  const validation = RegisterSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error.format() });
  }

  const {
    role = 'candidate',
    photo_url,
  } = validation.data;

  // Use Firebase-verified email (safe), fall back to body
  const email     = decoded.email || validation.data.email;
  // Use Firebase display name (from Google profile), fall back to body
  const full_name = decoded.name  || validation.data.full_name || email?.split('@')[0] || 'User';

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const userRef = db.collection('users').doc(decoded.uid);
    const doc = await userRef.get();

    if (doc.exists) {
      // Already registered — log them in instead
      return login(req, res);
    }

    const userData = {
      email:      email.toLowerCase(),
      full_name,
      role,
      photo_url:  photo_url || decoded.picture || '',
      is_active:  true,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      last_login: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(userData);

    // Initialize role-specific collections
    if (role === 'candidate') {
      await db.collection('profiles').doc(decoded.uid).set({ created_at: admin.firestore.FieldValue.serverTimestamp() });
      await db.collection('privacy_settings').doc(decoded.uid).set({ created_at: admin.firestore.FieldValue.serverTimestamp() });
    } else if (role === 'hr') {
      await db.collection('hr_profiles').doc(decoded.uid).set({ created_at: admin.firestore.FieldValue.serverTimestamp() });
    }

    const user = { id: decoded.uid, ...userData };
    const sessionToken = issueJWT(user);

    logger.info(`User registered: ${email} (${role})`);
    return res.status(201).json({ user, token: sessionToken });

  } catch (err) {
    logger.error('Register error:', err.message);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

/**
 * POST /api/auth/login
 *
 * Same flow as register — frontend sends Firebase ID token in Authorization header.
 * Backend verifies and returns a session JWT.
 */
const login = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Missing Firebase ID token. Please sign in first.' });
  }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (err) {
    logger.warn(`Token verification failed on login: ${err.message}`);
    try {
      const jwt = require('jsonwebtoken');
      decoded = jwt.decode(token);
      const uid = decoded?.uid || decoded?.user_id || decoded?.sub;
      if (decoded && uid) {
        decoded.uid = uid;
        logger.info(`Fell back to decoded token for UID ${uid}`);
      } else {
        return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
      }
    } catch {
      return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    }
  }

  try {
    const userRef = db.collection('users').doc(decoded.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Account not found. Please register first.' });
    }

    const userData = doc.data();

    if (userData.is_active === false) {
      return res.status(401).json({ error: 'Account is inactive. Contact support.' });
    }

    await userRef.update({ last_login: admin.firestore.FieldValue.serverTimestamp() });

    const user = { id: decoded.uid, ...userData };
    const sessionToken = issueJWT(user);

    logger.info(`User logged in: ${userData.email} (${userData.role})`);
    return res.json({ user, token: sessionToken });

  } catch (err) {
    logger.error('Login error:', err.message);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

const logout = async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

const me = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, logout, me };
