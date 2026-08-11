const { initializeApp, cert, getApps, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');

// Initialize Firebase Admin SDK
let app;
if (getApps().length === 0) {
  try {
    let credential;
    let projectId = process.env.GOOGLE_CLOUD_PROJECT || 'resumeverify-79302';
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        credential = cert(serviceAccount);
        if (serviceAccount.project_id) projectId = serviceAccount.project_id;
      } catch (e) {
        console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT, using default credentials');
      }
    }
    if (!credential) {
      credential = applicationDefault();
    }
    app = initializeApp({ credential, projectId });
    console.log(`Firebase Admin initialized successfully (projectId: ${projectId})`);
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    try {
      app = initializeApp({ projectId: 'resumeverify-79302' });
    } catch (e) {
      console.error('Firebase Admin fallback initialization error:', e);
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
