const { admin, db } = require('../config/firebase');
const { z } = require('zod');
const logger = require('../utils/logger');
const { setWithExpiry } = require('../utils/redis');

// In Firebase, registration and login happen on the client.
// The backend verifies the Firebase ID token and syncs the user profile to Firestore.

const SyncSchema = z.object({
  email: z.string().trim().email(),
  full_name: z.string().trim().min(1),
  role: z.enum(['candidate', 'mentor', 'teacher', 'hr']).optional(),
  photo_url: z.string().optional()
});

/**
 * POST /api/auth/register
 * Requires a valid Firebase ID token in Authorization header or cookie.
 * NEVER falls back to email-based UID derivation.
 */
const register = async (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing Firebase ID token' });
  }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (err) {
    logger.warn(`Token verification failed on register: ${err.message}`);
    return res.status(401).json({ error: 'Invalid or expired Firebase ID token' });
  }

  try {
    const validation = SyncSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Validation failed', details: validation.error.format() });
    }

    const { email, full_name, role = 'candidate', photo_url } = validation.data;

    // Verify the token email matches the supplied email (prevent email spoofing)
    if (decoded.email && decoded.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ error: 'Email mismatch with authenticated token' });
    }

    const userRef = db.collection('users').doc(decoded.uid);
    const doc = await userRef.get();

    if (doc.exists) {
      // Already registered — return login instead
      return login(req, res);
    }

    const userData = {
      email: email.toLowerCase(),
      full_name,
      role,
      photo_url: photo_url || '',
      is_active: true,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      last_login: admin.firestore.FieldValue.serverTimestamp()
    };

    await userRef.set(userData);

    // Profile initialization per role
    if (role === 'candidate') {
      await db.collection('profiles').doc(decoded.uid).set({ created_at: admin.firestore.FieldValue.serverTimestamp() });
      await db.collection('privacy_settings').doc(decoded.uid).set({ created_at: admin.firestore.FieldValue.serverTimestamp() });
    } else if (role === 'hr') {
      await db.collection('hr_profiles').doc(decoded.uid).set({ created_at: admin.firestore.FieldValue.serverTimestamp() });
    }

    logger.info(`Firebase user synced to Firestore: ${email} (${role})`);

    await setWithExpiry(`user_session:${decoded.uid}`, { id: decoded.uid, ...userData }, 300);

    // Use the verified Firebase token as the session cookie (never a mock token)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({ user: { id: decoded.uid, ...userData } });
  } catch (err) {
    logger.error('Register sync error:', err.message);
    res.status(500).json({ error: 'User sync failed' });
  }
};

/**
 * POST /api/auth/login
 * Requires a valid Firebase ID token. No email-only, no mock_token bypass.
 */
const login = async (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1] || req.body.token;

  if (!token) {
    return res.status(401).json({ error: 'Missing Firebase ID token' });
  }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (err) {
    logger.warn(`Token verification failed on login: ${err.message}`);
    return res.status(401).json({ error: 'Invalid or expired Firebase ID token' });
  }

  try {
    const userRef = db.collection('users').doc(decoded.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'User profile not found. Please register.' });
    }

    await userRef.update({ last_login: admin.firestore.FieldValue.serverTimestamp() });

    const userData = doc.data();
    if (userData.is_active === false) {
      return res.status(401).json({ error: 'Account inactive' });
    }

    // Set the real Firebase token as the session cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    logger.info(`User session verified: ${userData.email}`);
    res.json({ user: { id: decoded.uid, ...userData } });
  } catch (err) {
    logger.error('Login error:', err.message);
    res.status(401).json({ error: 'Authentication failed' });
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
