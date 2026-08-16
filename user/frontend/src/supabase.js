import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xkooguvxhhempfpcmrjd.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_dOX9o2ZPgnyzL07orLNbnA_f_KD4Aqx';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Generate a random UUID v4 string fallback
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Save / update local backup profile to ensure high availability
 */
function saveLocalBackup(firebaseUid, profileData) {
  try {
    const key = `ushamart_user_profile_${firebaseUid}`;
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    const updated = { ...existing, ...profileData, firebase_uid: firebaseUid };
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('LocalStorage backup write failed:', err);
    return profileData;
  }
}

function getLocalBackup(firebaseUid) {
  try {
    const key = `ushamart_user_profile_${firebaseUid}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Create a new user profile record in Supabase upon registration
 */
export async function createUserProfile({ firebaseUid, fullName, email }) {
  const profile = {
    id: generateUUID(),
    firebase_uid: firebaseUid,
    full_name: fullName,
    email: email,
    profile_image: null,
    mobile_number: null,
    default_address: null,
    pincode: null,
    city: null,
    state: null,
    account_status: 'Active',
    email_verified: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login: null,
  };

  saveLocalBackup(firebaseUid, profile);

  try {
    const { data, error } = await supabase.from('users').insert([profile]).select();
    if (error) {
      console.warn('Supabase profile insertion note:', error.message);
    }
    return data?.[0] || profile;
  } catch (err) {
    console.warn('Supabase connection note:', err.message);
    return profile;
  }
}

/**
 * Fetch a user profile from Supabase by Firebase UID
 */
export async function getUserProfile(firebaseUid) {
  const local = getLocalBackup(firebaseUid);

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', firebaseUid)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch note:', error.message);
      return local;
    }

    if (data) {
      saveLocalBackup(firebaseUid, data);
      return data;
    }
    return local;
  } catch (err) {
    console.warn('Supabase fetch exception:', err.message);
    return local;
  }
}

/**
 * Update user profile details in Supabase
 */
export async function updateUserProfileInSupabase(firebaseUid, updates) {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  saveLocalBackup(firebaseUid, payload);

  try {
    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('firebase_uid', firebaseUid)
      .select();

    if (error) {
      console.warn('Supabase update note:', error.message);
    }
    return data?.[0] || getLocalBackup(firebaseUid);
  } catch (err) {
    console.warn('Supabase update exception:', err.message);
    return getLocalBackup(firebaseUid);
  }
}

/**
 * Record last login timestamp and email verification status in Supabase
 */
export async function updateLastLoginInSupabase(firebaseUid, isVerified = true) {
  const payload = {
    email_verified: isVerified,
    last_login: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  saveLocalBackup(firebaseUid, payload);

  try {
    const { error } = await supabase
      .from('users')
      .update(payload)
      .eq('firebase_uid', firebaseUid);

    if (error) {
      console.warn('Supabase last_login update note:', error.message);
    }
  } catch (err) {
    console.warn('Supabase last_login update exception:', err.message);
  }
}
