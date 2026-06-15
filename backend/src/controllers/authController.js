const { admin, db } = require('../config/firebase');
const { z } = require('zod');
const logger = require('../utils/logger');
const { setWithExpiry } = require('../utils/redis');

// In Firebase, registration and login happen on the client. 
// The backend's role is to verify the ID token and sync the user profile to Firestore.

const SyncSchema = z.object({
  email: z.string().trim().email(),
  full_name: z.string().trim().min(1),
  role: z.enum(['candidate', 'mentor', 'teacher', 'hr']).optional(),
  photo_url: z.string().optional()
});

const register = async (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  
  let decoded;
  try {
    if (token) {
      decoded = await admin.auth().verifyIdToken(token);
    } else {
      throw new Error('No token provided');
    }
  } catch (err) {
    // 🚀 TEMPORARY BYPASS FOR PHASE 2 TESTING: If no valid token, use email to fake a UID
    if (req.body.email) {
      const crypto = require('crypto');
      decoded = { 
        uid: crypto.createHash('md5').update(req.body.email.toLowerCase().trim()).digest('hex'), 
        email: req.body.email 
      };
      logger.warn(`Bypassed Firebase Auth. Faking UID for: ${req.body.email}`);
    } else {
      return res.status(401).json({ error: 'Missing Firebase ID token' });
    }
  }

  try {
    // Validate request body
    const validation = SyncSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Validation failed', details: validation.error.format() });
    }

    const { email, full_name, role = 'candidate', photo_url } = validation.data;
    
    const userRef = db.collection('users').doc(decoded.uid);
    const doc = await userRef.get();
    
    if (doc.exists) {
      // If they already exist in this mock mode, just log them in instead of 409
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

    // Profile initialization
    if (role === 'candidate') {
      await db.collection('profiles').doc(decoded.uid).set({ created_at: admin.firestore.FieldValue.serverTimestamp() });
      await db.collection('privacy_settings').doc(decoded.uid).set({ created_at: admin.firestore.FieldValue.serverTimestamp() });
    } else if (role === 'hr') {
      await db.collection('hr_profiles').doc(decoded.uid).set({ created_at: admin.firestore.FieldValue.serverTimestamp() });
    }

    logger.info(`Firebase user synced to Firestore: ${email} (${role})`);
    
    await setWithExpiry(`user_session:${decoded.uid}`, { id: decoded.uid, ...userData }, 300);

    // Create a fake token for frontend session tracking
    const fakeToken = "mock_token_" + decoded.uid;
    res.cookie('token', fakeToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(201).json({ user: { id: decoded.uid, ...userData }, token: fakeToken });
  } catch (err) {
    console.error('CRITICAL SYNC ERROR:', err);
    res.status(500).json({ error: 'User sync failed: ' + (err.message || JSON.stringify(err)) });
  }
};

const login = async (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1] || req.body.token;
  
  let decoded;
  try {
    if (token && !token.startsWith('mock_token_')) {
      decoded = await admin.auth().verifyIdToken(token);
    } else {
      throw new Error('No real token');
    }
  } catch (err) {
    // 🚀 TEMPORARY BYPASS
    if (req.body.email) {
      const crypto = require('crypto');
      decoded = { uid: crypto.createHash('md5').update(req.body.email.toLowerCase().trim()).digest('hex') };
    } else if (token && token.startsWith('mock_token_')) {
      decoded = { uid: token.replace('mock_token_', '') };
    } else {
      return res.status(400).json({ error: 'Missing Firebase ID token' });
    }
  }

  try {
    const userRef = db.collection('users').doc(decoded.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
       return res.status(404).json({ error: 'User profile not found in Firestore. Please register.' });
    }

    await userRef.update({ last_login: admin.firestore.FieldValue.serverTimestamp() });
    
    const userData = doc.data();
    if (userData.is_active === false) {
      return res.status(401).json({ error: 'Account inactive' });
    }

    const fakeToken = "mock_token_" + decoded.uid;
    res.cookie('token', fakeToken, {
      httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000
    });

    logger.info(`User session verified: ${userData.email}`);
    res.json({ user: { id: decoded.uid, ...userData }, token: fakeToken });
  } catch (err) {
    logger.error('Login verify error:', err);
    res.status(401).json({ error: 'Invalid token' });
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
