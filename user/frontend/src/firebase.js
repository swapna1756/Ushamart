import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCu28CkdYM7CocnqFXXNRefC3o2_IkfM54",
  authDomain: "ushamart-wholesale.firebaseapp.com",
  projectId: "ushamart-wholesale",
  storageBucket: "ushamart-wholesale.firebasestorage.app",
  messagingSenderId: "584917547503",
  appId: "1:584917547503:web:a4e67c750c3c5d243e1e1a",
  measurementId: "G-2V7XR1G7P1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export default app;
