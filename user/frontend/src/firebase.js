/**
 * firebase.js — Firebase client initialisation.
 *
 * Config values are read from Vite env vars (VITE_FIREBASE_*) so different
 * Firebase projects can be used per deployment without code changes.
 * The defaults below are the existing ushamart-wholesale project and are safe
 * to ship in the browser bundle (Firebase web config is public by design).
 */
import { initializeApp } from 'firebase/app';
import { getAuth }       from 'firebase/auth';
import { getAnalytics }  from 'firebase/analytics';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyCu28CkdYM7CocnqFXXNRefC3o2_IkfM54',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'ushamart-wholesale.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'ushamart-wholesale',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'ushamart-wholesale.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '584917547503',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:584917547503:web:a4e67c750c3c5d243e1e1a',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || 'G-2V7XR1G7P1',
};

const app = initializeApp(firebaseConfig);
export const auth      = getAuth(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export default app;
