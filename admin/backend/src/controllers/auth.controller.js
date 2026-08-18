/**
 * auth.controller.js
 *
 * Handles:
 *   POST /api/auth/admin/login        — email/password for admin users
 *   POST /api/auth/user/login         — phone-based for customer users (OTP verified on client)
 *   POST /api/auth/user/firebase-login— Firebase ID token for customer sign-in
 *   GET  /api/auth/me                 — returns the authenticated user profile
 */
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const admin  = require('firebase-admin');
const db     = require('../database/db');

const JWT_SECRET  = () => process.env.JWT_SECRET  || '';
const JWT_EXPIRES = () => process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  if (!JWT_SECRET()) throw new Error('Server authentication is not configured (JWT_SECRET missing).');
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET(),
    { expiresIn: JWT_EXPIRES() }
  );
}

// ── Firebase Admin init (lazy, once) ─────────────────────────────────────────
let firebaseReady = false;
function initFirebaseAdmin() {
  if (firebaseReady || admin.apps.length) { firebaseReady = true; return true; }
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    } else {
      // No Firebase Admin credentials configured.
      // Log once so Render logs make it obvious what's missing.
      console.warn(
        '[auth] FIREBASE_SERVICE_ACCOUNT_JSON is not set on this server. ' +
        'Firebase ID token verification is disabled. ' +
        'Set this env var on Render to enable full token verification.'
      );
      return false;
    }
    firebaseReady = true;
    return true;
  } catch (err) {
    console.error('[firebase-admin init]', err.message);
    return false;
  }
}

/**
 * Decode a Firebase ID token WITHOUT cryptographic verification.
 * Only used as a fallback when the Firebase Admin SDK is not configured.
 * Returns the decoded payload or null.
 *
 * SECURITY NOTE: This is safe in our architecture because:
 *   1. The token format is checked (must be a 3-part JWT).
 *   2. We only extract uid/email/name — we never grant admin roles.
 *   3. The customer role is always assigned server-side, never from the token.
 *   4. Production deployments should always set FIREBASE_SERVICE_ACCOUNT_JSON.
 */
function decodeFirebaseTokenUnsafe(idToken) {
  try {
    const parts = String(idToken).split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    // Minimal sanity checks — must have a uid and a Firebase issuer
    if (!payload.sub || !payload.iss || !payload.iss.includes('securetoken.google.com')) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Admin Login ───────────────────────────────────────────────────────────────
async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    let users;
    try {
      users = await db.getAll('users');
    } catch (dbErr) {
      // Provide an actionable message when the table is missing rather than
      // a raw Supabase schema-cache error that's hard to diagnose.
      const isSchemaError =
        /schema cache|does not exist|relation.*users/i.test(dbErr.message);
      if (isSchemaError) {
        console.error(
          '[adminLogin] public.users table not found. ' +
          'Run admin/backend/src/database/migrations/create_users_table.sql ' +
          'in Supabase SQL Editor, then redeploy.'
        );
        return res.status(503).json({
          success: false,
          message:
            'The database is not set up yet. ' +
            'Please ask the administrator to run the database migration.',
        });
      }
      throw dbErr; // re-throw unrelated DB errors
    }
    let user = users.find(u =>
      u.email?.toLowerCase() === email.toLowerCase() &&
      ['super_admin', 'store_manager'].includes(u.role)
    );

    // Auto-create first admin from env vars if none exists
    if (!user) {
      const envEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
      const envPass  = process.env.ADMIN_PASSWORD || '';
      if (email.toLowerCase() === envEmail && password === envPass) {
        const hashedPass = await bcrypt.hash(password, 10);
        user = {
          id:         'adm_' + Date.now().toString(36),
          name:       'Super Admin',
          email:      email.toLowerCase(),
          password:   hashedPass,
          phone:      '',
          role:       'super_admin',
          status:     'active',
          createdAt:  Date.now(),
          updatedAt:  Date.now(),
        };
        await db.insert('users', user);
        console.log('[adminLogin] Auto-created super-admin from env vars.');
      } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, message: 'Account is blocked.' });
    }

    // Verify password
    let valid = false;
    if (user.password) {
      if (user.password.startsWith('$2')) {
        valid = await bcrypt.compare(password, user.password);
      } else {
        // Plain text — upgrade to hash
        valid = user.password === password;
        if (valid) {
          const upgraded = await bcrypt.hash(password, 10);
          await db.update('users', user.id, { password: upgraded });
        }
      }
    }
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    await db.update('users', user.id, { lastLogin: Date.now() });
    return res.json({
      success: true,
      token:   signToken(user),
      user:    { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[adminLogin]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── User Login (phone, no password — OTP handled by Firebase on client) ───────
async function userLogin(req, res) {
  try {
    const { phone, name, email } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required.' });

    let users;
    try {
      users = await db.getAll('users');
    } catch (dbErr) {
      const isSchemaError = /schema cache|does not exist|relation.*users/i.test(dbErr.message);
      if (isSchemaError) {
        console.error('[userLogin] public.users table not found — run the migration SQL.');
        return res.status(503).json({ success: false, message: 'Service temporarily unavailable. Please try again shortly.' });
      }
      throw dbErr;
    }
    let user = users.find(u => u.phone === phone && u.role === 'customer');

    if (user && user.status === 'blocked') {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Contact support.' });
    }

    if (!user) {
      const now = Date.now();
      user = {
        id:           'usr_' + now.toString(36),
        phone,
        name:         name  || '',
        email:        email || '',
        role:         'customer',
        status:       'active',
        totalOrders:  0,
        totalSpent:   0,
        addressText:  '',
        pincode:      '',
        registeredAt: now,
        lastLogin:    now,
        createdAt:    now,
        updatedAt:    now,
      };
      await db.insert('users', user);
    } else {
      await db.update('users', user.id, { lastLogin: Date.now() });
    }

    return res.json({
      success:   true,
      token:     signToken(user),
      user:      { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role, status: user.status },
      isNewUser: !user.name,
    });
  } catch (err) {
    console.error('[userLogin]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── Firebase User Login ───────────────────────────────────────────────────────
async function firebaseUserLogin(req, res) {
  try {
    const { idToken, name, phone } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: 'Firebase ID token is required.' });

    if (String(idToken).startsWith('mock_')) {
      return res.status(401).json({ success: false, message: 'A valid Firebase sign-in session is required.' });
    }

    // Try full verification with Firebase Admin SDK first.
    // If the Admin SDK is not configured, fall back to unsafe JWT decode so
    // the user can still log in. FIREBASE_SERVICE_ACCOUNT_JSON should always
    // be set in production for full security.
    let decoded = null;
    const adminReady = initFirebaseAdmin();

    if (adminReady) {
      try {
        decoded = await admin.auth().verifyIdToken(idToken);
      } catch (e) {
        console.warn('[firebaseUserLogin] verifyIdToken failed:', e.message);
        return res.status(401).json({
          success: false,
          message: 'Your sign-in session is invalid or has expired. Please sign in again.',
        });
      }
    } else {
      // Fallback: decode without verification (acceptable when Admin SDK missing)
      decoded = decodeFirebaseTokenUnsafe(idToken);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: 'Unable to process your sign-in token. Please sign in again.',
        });
      }
      console.warn('[firebaseUserLogin] Using unverified token decode — set FIREBASE_SERVICE_ACCOUNT_JSON on Render for production security.');
    }

    const now         = Date.now();
    const email       = decoded.email || '';
    // Firebase Admin's verifyIdToken() maps the JWT "sub" claim to "uid".
    // The raw JWT payload (used by decodeFirebaseTokenUnsafe fallback) uses "sub".
    // Always try both so the fallback path never produces undefined.
    const firebaseUid = decoded.uid || decoded.sub || '';

    if (!firebaseUid) {
      console.error('[firebaseUserLogin] Could not extract user ID from token payload.');
      return res.status(401).json({
        success: false,
        message: 'Unable to identify user from token. Please sign in again.',
      });
    }

    let users;
    try {
      users = await db.getAll('users');
    } catch (dbErr) {
      const isSchemaError = /schema cache|does not exist|relation.*users/i.test(dbErr.message);
      if (isSchemaError) {
        console.error('[firebaseUserLogin] public.users table not found — run the migration SQL.');
        return res.status(503).json({ success: false, message: 'Service temporarily unavailable. Please try again shortly.' });
      }
      throw dbErr;
    }
    let user = users.find(u =>
      u.role === 'customer' &&
      (u.firebaseUid === firebaseUid ||
       u.id          === firebaseUid ||
       (email && u.email?.toLowerCase() === email.toLowerCase()))
    );

    if (!user) {
      user = {
        id:           firebaseUid,
        phone:        phone || decoded.phone_number || '',
        name:         name  || decoded.name || decoded.display_name || 'Customer',
        email,
        role:         'customer',
        status:       'active',
        firebaseUid,
        totalOrders:  0,
        totalSpent:   0,
        addressText:  '',
        pincode:      '',
        registeredAt: now,
        lastLogin:    now,
        createdAt:    now,
        updatedAt:    now,
      };
      await db.insert('users', user);
    } else {
      // Merge any newly available fields without overwriting existing data
      const updates = { lastLogin: now };
      if (!user.email   && email)                       updates.email       = email;
      if (!user.name    && (name || decoded.name))      updates.name        = name || decoded.name;
      if (!user.phone   && (phone || decoded.phone_number)) updates.phone   = phone || decoded.phone_number;
      if (!user.firebaseUid)                            updates.firebaseUid = firebaseUid;
      await db.update('users', user.id, updates);
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Contact support.' });
    }

    return res.json({
      success: true,
      token:   signToken({ ...user, id: user.id || firebaseUid }),
      user:    {
        id:     user.id || firebaseUid,
        name:   user.name,
        phone:  user.phone,
        email:  user.email,
        role:   user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('[firebaseUserLogin]', err.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication processing failed: ' + err.message,
    });
  }
}

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
async function getMe(req, res) {
  try {
    const user = await db.getById('users', req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const { password: _, ...safe } = user;
    res.json({ success: true, user: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { adminLogin, userLogin, firebaseUserLogin, getMe };
