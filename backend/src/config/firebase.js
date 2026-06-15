const { initializeApp, cert, getApps, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');

// Initialize Firebase Admin SDK
let app;
if (getApps().length === 0) {
  try {
    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
    } else {
      credential = applicationDefault();
    }
    app = initializeApp({ credential });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
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
