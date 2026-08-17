const { admin, db } = require('../config/firebase');
const { z } = require('zod');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

/**
 * Issue a signed JWT for the authenticated user.
 * This is what the frontend and mobile app store and use as Bearer token for subsequent API calls.
 */
const issueJWT = (user) => {
  const secret = process.env.JWT_SECRET || 'smart-resume-verifier-default-super-secret-jwt-key-2025';
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Resolves the canonical user record across Firebase Auth, Firestore, and legacy documents.
 */
const resolveCanonicalUser = async (email, incomingUid, defaultRole = 'candidate', photoUrl = '', name = '') => {
  const cleanEmail = (email || '').toLowerCase().trim();
  let canonicalUid = incomingUid;

  // 1. Try to find the canonical Firebase Auth UID
  if (cleanEmail) {
    try {
      const authUser = await admin.auth().getUserByEmail(cleanEmail);
      if (authUser?.uid) {
        canonicalUid = authUser.uid;
      }
    } catch (e) {
      // User may not exist in Firebase Auth yet
    }
  }

  // 2. Fetch or search for user document
  let targetDocRef = db.collection('users').doc(canonicalUid);
  let targetDoc = await targetDocRef.get();

  let resolvedRole = defaultRole;
  let resolvedName = name || cleanEmail.split('@')[0] || 'User';
  let resolvedPhoto = photoUrl;

  // 3. If target doc doesn't exist, check if a document exists by email
  if (!targetDoc.exists && cleanEmail) {
    const snap = await db.collection('users').where('email', '==', cleanEmail).get();
    if (!snap.empty) {
      const existingDoc = snap.docs[0];
      const exData = existingDoc.data();
      resolvedRole = exData.role || resolvedRole;
      resolvedName = exData.full_name || resolvedName;
      resolvedPhoto = exData.photo_url || resolvedPhoto;

      // Migrate from old doc to canonicalUid
      if (existingDoc.id !== canonicalUid) {
        logger.info(`Migrating user ${cleanEmail} from old doc ${existingDoc.id} to ${canonicalUid}`);
        
        // Workspaces
        const wsSnap = await db.collection('workspaces').where('mentor_id', '==', existingDoc.id).get();
        for (const w of wsSnap.docs) await w.ref.update({ mentor_id: canonicalUid });

        // Groups
        const gSnap = await db.collection('groups').where('mentor_id', '==', existingDoc.id).get();
        for (const g of gSnap.docs) await g.ref.update({ mentor_id: canonicalUid });

        // Group members
        const gmSnap = await db.collection('group_members').where('user_id', '==', existingDoc.id).get();
        for (const gm of gmSnap.docs) await gm.ref.update({ user_id: canonicalUid });

        // Subcollections
        for (const col of ['profiles', 'privacy_settings', 'confidence_scores', 'skills', 'projects', 'education', 'experience', 'certificates', 'hr_profiles']) {
          const cDoc = await db.collection(col).doc(existingDoc.id).get();
          if (cDoc.exists) {
            await db.collection(col).doc(canonicalUid).set(cDoc.data(), { merge: true });
            await cDoc.ref.delete();
          }
        }

        await existingDoc.ref.delete();
      }
    }
  }

  // Also check if incomingUid is different from canonicalUid and has dangling references
  if (incomingUid && incomingUid !== canonicalUid) {
    const incDoc = await db.collection('users').doc(incomingUid).get();
    if (incDoc.exists) {
      const incData = incDoc.data();
      if (incData.role) resolvedRole = incData.role;
      if (incData.full_name) resolvedName = incData.full_name;

      const wsSnap = await db.collection('workspaces').where('mentor_id', '==', incomingUid).get();
      for (const w of wsSnap.docs) await w.ref.update({ mentor_id: canonicalUid });

      const gSnap = await db.collection('groups').where('mentor_id', '==', incomingUid).get();
      for (const g of gSnap.docs) await g.ref.update({ mentor_id: canonicalUid });

      const gmSnap = await db.collection('group_members').where('user_id', '==', incomingUid).get();
      for (const gm of gmSnap.docs) await gm.ref.update({ user_id: canonicalUid });

      await incDoc.ref.delete();
    }
  }

  // 4. Create or update canonical user document
  const finalDoc = await targetDocRef.get();
  let userData;
  if (!finalDoc.exists) {
    userData = {
      email: cleanEmail,
      full_name: resolvedName,
      role: resolvedRole,
      photo_url: resolvedPhoto,
      is_active: true,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      last_login: admin.firestore.FieldValue.serverTimestamp()
    };
    await targetDocRef.set(userData);

    if (resolvedRole === 'candidate') {
      await db.collection('profiles').doc(canonicalUid).set({ created_at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      await db.collection('privacy_settings').doc(canonicalUid).set({ created_at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    } else if (resolvedRole === 'hr') {
      await db.collection('hr_profiles').doc(canonicalUid).set({ created_at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
  } else {
    userData = finalDoc.data();
    await targetDocRef.update({ last_login: admin.firestore.FieldValue.serverTimestamp() });
  }

  return { id: canonicalUid, ...userData };
};

// ── Validation Schemas ────────────────────────────────────────────────────────
const RegisterSchema = z.object({
  email:        z.string().trim().email('Invalid email').optional(),
  full_name:    z.string().trim().min(1, 'Full name required').optional(),
  role:         z.enum(['candidate', 'mentor', 'teacher', 'hr']).default('candidate'),
  photo_url:    z.string().optional(),
  invite_token: z.string().optional(),
});

/**
 * POST /api/auth/register
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
    try {
      const jwtDec = require('jsonwebtoken');
      decoded = jwtDec.decode(token);
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

  const { role = 'candidate', photo_url } = validation.data;
  const email = (decoded.email || validation.data.email || req.body.email || '').toLowerCase().trim();
  const fullName = decoded.name || validation.data.full_name || email?.split('@')[0] || 'User';

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await resolveCanonicalUser(email, decoded.uid, role, photo_url || decoded.picture || '', fullName);

    // If explicit role is provided during register and differs, update it
    if (role && role !== 'candidate' && user.role !== role) {
      await db.collection('users').doc(user.id).update({ role });
      user.role = role;
    }

    const sessionToken = issueJWT(user);
    logger.info(`User registered/resolved: ${email} (${user.role}) with UID: ${user.id}`);
    return res.status(201).json({ user, token: sessionToken });
  } catch (err) {
    logger.error('Register error:', err.message);
    return res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
};

/**
 * POST /api/auth/login
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
      const jwtDec = require('jsonwebtoken');
      decoded = jwtDec.decode(token);
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
    const cleanEmail = (decoded.email || req.body?.email || `${decoded.uid}@firebase.user`).toLowerCase().trim();
    const fullName = decoded.name || cleanEmail.split('@')[0] || 'User';

    const user = await resolveCanonicalUser(cleanEmail, decoded.uid, 'candidate', decoded.picture || '', fullName);

    if (user.is_active === false) {
      return res.status(401).json({ error: 'Account is inactive. Contact support.' });
    }

    const sessionToken = issueJWT(user);
    logger.info(`User logged in: ${user.email} (${user.role}) UID: ${user.id}`);
    return res.json({ user, token: sessionToken });
  } catch (err) {
    logger.error('Login error:', err.message);
    return res.status(500).json({ error: 'Login failed: ' + err.message });
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
