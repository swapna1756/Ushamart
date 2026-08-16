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
 const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
 if (currentUser) {
 if (!currentUser.emailVerified) {
 // Mandatory rule: Unverified users cannot maintain logged-in state
 await signOut(auth);
 setUser(null);
 setProfile(null);
 } else {
 setUser({ ...currentUser });
 const dbProfile = await getUserProfile(currentUser.uid);
 await syncBackendCustomer(currentUser, dbProfile);
 setProfile(dbProfile);
 await updateLastLoginInSupabase(currentUser.uid, true);
 }
 } else {
 setUser(null);
 setProfile(null);
 }
 setLoading(false);
 });

 return () => unsubscribe();
 }, []);

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
