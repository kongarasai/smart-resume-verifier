const { initializeApp, cert, getApps, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');

// Initialize Firebase Admin SDK
let app;
if (getApps().length === 0) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'resumeverify-79302';
  let credential = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : process.env.FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      credential = cert(serviceAccount);
    } catch (e) {
      console.warn('FIREBASE_SERVICE_ACCOUNT parse skipped/failed:', e.message);
    }
  } else {
    const fs = require('fs');
    const path = require('path');
    const keyPath = path.join(__dirname, '../../serviceAccountKey.json');
    if (fs.existsSync(keyPath)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        credential = cert(serviceAccount);
        console.log('Firebase Admin loaded credential from serviceAccountKey.json');
      } catch (e) {
        console.warn('serviceAccountKey.json load failed:', e.message);
      }
    }
  }

  try {
    if (credential) {
      app = initializeApp({ credential, projectId });
    } else {
      // Try applicationDefault, fallback to bare projectId if no GCloud env is present
      try {
        app = initializeApp({ credential: applicationDefault(), projectId });
      } catch (e) {
        app = initializeApp({ projectId });
      }
    }
    console.log(`Firebase Admin initialized successfully (projectId: ${projectId})`);
  } catch (error) {
    console.warn('Firebase Admin primary init notice:', error.message);
    try {
      app = initializeApp({ projectId: 'resumeverify-79302' });
    } catch (e) {
      console.error('Firebase Admin fallback error:', e.message);
      app = getApps()[0];
    }
  }
} else {
  app = getApps()[0];
}

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Mock the global 'admin' object to preserve compatibility with existing code
const admin = {
  firestore: { FieldValue: require('firebase-admin/firestore').FieldValue },
  auth: () => auth,
  storage: () => storage
};

module.exports = {
  admin,
  db,
  auth,
  storage
};
