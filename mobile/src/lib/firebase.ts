import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, indexedDBLocalPersistence, browserLocalPersistence, initializeAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAmadOPOm5x8euauSa5sFoX8irC3MB1_rs',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'resumeverify-79302.firebaseapp.com',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'resumeverify-79302',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'resumeverify-79302.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '729822947547',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:729822947547:web:cd9a6a0a88725796db44fe',
};

// Check if we have a valid configuration (non-empty and not 'undefined')
const isConfigValid = !!(firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined' && firebaseConfig.apiKey.trim() !== '');

// Initialize Firebase only if config is valid
const app = isConfigValid
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0])
  : null;

// Use indexedDBLocalPersistence in WebView environments to avoid session reset issues
export const auth = app
  ? (typeof window !== 'undefined' && (!!(window as any).AndroidInterface || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
      ? initializeAuth(app, {
          persistence: [indexedDBLocalPersistence, browserLocalPersistence],
        })
      : getAuth(app))
  : ({} as any);
export const googleProvider = new GoogleAuthProvider();

if (app) {
  // Ask Google for email + profile info
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
}
