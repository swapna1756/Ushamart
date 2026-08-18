import React, { createContext, useContext, useState, useEffect } from 'react';
import {
 onAuthStateChanged,
 createUserWithEmailAndPassword,
 signInWithEmailAndPassword,
 signOut,
 sendEmailVerification,
 sendPasswordResetEmail,
 updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
 const [user, setUser] = useState(null);
 const [profile, setProfile] = useState(null);
 const [loading, setLoading] = useState(true);
 const [tokenReady, setTokenReady] = useState(false); // true once backend JWT is stored
 const [bootstrapError, setBootstrapError] = useState('');
 const [bootstrapAttempt, setBootstrapAttempt] = useState(0);

 const toProfile = (backendUser) => backendUser ? ({
 ...backendUser,
 full_name: backendUser.name || '',
 mobile_number: backendUser.phone || '',
 profile_image: backendUser.profilePic || null,
 }) : null;

 const syncBackendCustomer = async (firebaseUser, profileHint = null) => {
 try {
 const idToken = await firebaseUser.getIdToken(/* forceRefresh */ false);
 const res = await authApi.firebaseLogin({
 idToken,
 name: profileHint?.full_name || firebaseUser.displayName || '',
 phone: profileHint?.mobile_number || '',
 });
 if (res?.token) {
 localStorage.setItem('ushamart_user_token', res.token);
 setTokenReady(true);
 console.log('[Auth] Backend token stored. Length:', res.token.length);
 }
 return toProfile(res?.user);
 } catch (err) {
 console.warn('[Auth] Backend customer session sync failed:', err.message);
 // If sync fails but we already have a stored token, keep using it.
 const existing = localStorage.getItem('ushamart_user_token');
 if (existing && existing !== 'undefined' && existing !== 'null') {
 setTokenReady(true);
 console.log('[Auth] Keeping existing backend token after sync failure.');
 }
 return null;
 }
 };

 useEffect(() => {
 let active = true;
 let settled = false;
 const finish = () => {
 if (active && !settled) {
 settled = true;
 setLoading(false);
 }
 };
 const timeout = window.setTimeout(() => {
 if (!active || settled) return;
 setBootstrapError('Unable to connect to UshaMart. Please try again.');
 finish();
 }, 10000);

 const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
 try {
 if (!currentUser) {
 setUser(null);
 setProfile(null);
 setTokenReady(false);
 localStorage.removeItem('ushamart_user_token');
 } else if (!currentUser.emailVerified) {
 // Never leave the app blocked while a sign-out request is pending.
 void signOut(auth).catch(() => {});
 setUser(null);
 setProfile(null);
 setTokenReady(false);
 localStorage.removeItem('ushamart_user_token');
 } else {
 // Store the real Firebase user object — NOT a plain spread copy.
 // Spreading loses prototype methods like getIdToken() which are
 // needed by ensureBackendToken() in CheckoutPage.
 setUser(currentUser);
 // If a token from a previous session already exists in localStorage,
 // mark it ready immediately so CartContext doesn't wait unnecessarily.
 const existingToken = localStorage.getItem('ushamart_user_token');
 if (existingToken && existingToken !== 'undefined' && existingToken !== 'null') {
 setTokenReady(true);
 }
 // Profile and backend-session sync are non-blocking. A failed remote query
 // must not prevent routing to a real authenticated Firebase session.
 void (async () => {
 try {
 const backendProfile = await syncBackendCustomer(currentUser);
 if (!active) return;
 setProfile(backendProfile);
 } catch (error) {
 console.error('User profile bootstrap failed:', error);
 }
 })();
 }
 setBootstrapError('');
 } catch (error) {
 console.error('Firebase authentication bootstrap failed:', error);
 setBootstrapError('Unable to connect to UshaMart. Please try again.');
 } finally {
 window.clearTimeout(timeout);
 finish();
 }
 }, () => {
 setUser(null);
 setProfile(null);
 setBootstrapError('Unable to connect to UshaMart. Please try again.');
 window.clearTimeout(timeout);
 finish();
 });

 return () => {
 active = false;
 window.clearTimeout(timeout);
 unsubscribe();
 };
 }, [bootstrapAttempt]);

 const retryBootstrap = () => {
 setBootstrapError('');
 setLoading(true);
 setBootstrapAttempt(value => value + 1);
 };

 const signUp = async (email, password, fullName) => {
 // 1. Create user in Firebase Authentication
 const userCredential = await createUserWithEmailAndPassword(auth, email, password);
 const firebaseUser = userCredential.user;

 // 2. Set Firebase Display Name
 if (fullName) {
 await updateProfile(firebaseUser, { displayName: fullName });
 }

 // 3. Send Verification Email
 await sendEmailVerification(firebaseUser);

 // 4. Sign out immediately so user must verify email before logging in.
 // The verified login creates/updates the customer through the backend API.
 await signOut(auth);
 setUser(null);
 setProfile(null);

 return firebaseUser;
 };

 const login = async (email, password) => {
 // 1. Authenticate credentials with Firebase
 const userCredential = await signInWithEmailAndPassword(auth, email, password);
 const firebaseUser = userCredential.user;

 // 2. Mandatory Email Verification check
 if (!firebaseUser.emailVerified) {
 await signOut(auth);
 setUser(null);
 setProfile(null);
 const unverifiedErr = new Error('Your email address is not verified yet. Please check your inbox and verify your email before logging in.');
 unverifiedErr.code = 'auth/email-not-verified';
 unverifiedErr.unverifiedUser = firebaseUser;
 throw unverifiedErr;
 }

 // 3. Establish the backend session and load the persisted customer profile.
 const dbProfile = await syncBackendCustomer(firebaseUser);
 
 // Store the real Firebase user object — NOT a plain spread copy.
 setUser(firebaseUser);
 setProfile(dbProfile);
 return firebaseUser;
 };

 const logout = async () => {
 await signOut(auth);
 localStorage.removeItem('ushamart_user_token');
 setUser(null);
 setProfile(null);
 setTokenReady(false);
 };

 const resetPassword = async (email) => {
 await sendPasswordResetEmail(auth, email);
 };

 const resendVerificationEmailForUnverified = async (email, password) => {
 try {
 const userCredential = await signInWithEmailAndPassword(auth, email, password);
 if (userCredential.user) {
 await sendEmailVerification(userCredential.user);
 await signOut(auth);
 }
 } catch (err) {
 console.error('Error resending verification email:', err);
 throw err;
 }
 };

 const updateProfileData = async (updates) => {
 if (!user) return;

 const backendId = profile?.id;
 if (!backendId) throw new Error('Your account session is not ready. Please try again.');
 const payload = {
 ...updates,
 name: updates.full_name ?? updates.name,
 profilePic: updates.profile_image ?? updates.profilePic,
 };
 delete payload.full_name;
 delete payload.profile_image;
 const response = await authApi.update(backendId, payload);
 setProfile(toProfile(response?.data));

 // Update Firebase Profile if full_name or profile_image provided
 const fbUpdates = {};
 if (updates.full_name) fbUpdates.displayName = updates.full_name;
 if (updates.profile_image) fbUpdates.photoURL = updates.profile_image;

 if (Object.keys(fbUpdates).length > 0 && auth.currentUser) {
 await updateProfile(auth.currentUser, fbUpdates);
 setUser({ ...auth.currentUser });
 }
 };

 return (
 <AuthContext.Provider
 value={{
 user,
 profile,
 loading,
 tokenReady,
 bootstrapError,
 retryBootstrap,
 signUp,
 login,
 logout,
 resetPassword,
 resendVerificationEmailForUnverified,
 updateProfileData,
 }}
 >
 {children}
 </AuthContext.Provider>
 );
}

export function useAuth() {
 return useContext(AuthContext);
}
