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
import {
 createUserProfile,
 getUserProfile,
 updateUserProfileInSupabase,
 updateLastLoginInSupabase
} from '../supabase';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
 const [user, setUser] = useState(null);
 const [profile, setProfile] = useState(null);
 const [loading, setLoading] = useState(true);
 const [bootstrapError, setBootstrapError] = useState('');
 const [bootstrapAttempt, setBootstrapAttempt] = useState(0);

 const syncBackendCustomer = async (firebaseUser, dbProfile) => {
 try {
 const idToken = await firebaseUser.getIdToken();
 const res = await authApi.firebaseLogin({
 idToken,
 name: dbProfile?.full_name || firebaseUser.displayName || '',
 phone: dbProfile?.mobile_number || '',
 });
 if (res?.token) localStorage.setItem('ushamart_user_token', res.token);
 } catch (err) {
 console.warn('Backend customer session sync failed:', err.message);
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
 } else if (!currentUser.emailVerified) {
 // Never leave the app blocked while a sign-out request is pending.
 void signOut(auth).catch(() => {});
 setUser(null);
 setProfile(null);
 } else {
 setUser({ ...currentUser });
 // Profile and backend-session sync are non-blocking. A failed remote query
 // must not prevent routing to a real authenticated Firebase session.
 void (async () => {
 try {
 const dbProfile = await getUserProfile(currentUser.uid);
 if (!active) return;
 setProfile(dbProfile);
 await syncBackendCustomer(currentUser, dbProfile);
 await updateLastLoginInSupabase(currentUser.uid, true);
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

 // 4. Create User Profile in Supabase
 await createUserProfile({
 firebaseUid: firebaseUser.uid,
 fullName: fullName,
 email: email,
 });

 // 5. Sign out immediately so user must verify email before logging in
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

 // 3. Update Supabase last login & fetch profile
 await updateLastLoginInSupabase(firebaseUser.uid, true);
 const dbProfile = await getUserProfile(firebaseUser.uid);
 await syncBackendCustomer(firebaseUser, dbProfile);
 
 setUser({ ...firebaseUser });
 setProfile(dbProfile);
 return firebaseUser;
 };

 const logout = async () => {
 await signOut(auth);
 localStorage.removeItem('ushamart_user_token');
 setUser(null);
 setProfile(null);
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

 // Update Supabase Database
 const updatedDbProfile = await updateUserProfileInSupabase(user.uid, updates);
 setProfile(updatedDbProfile);

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
