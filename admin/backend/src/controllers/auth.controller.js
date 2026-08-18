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
      return false;
    }
    firebaseReady = true;
    return true;
  } catch (err) {
    console.error('[firebase-admin init]', err.message);
    return false;
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

    if (!initFirebaseAdmin()) {
      return res.status(503).json({
        success: false,
        message: 'Secure sign-in is temporarily unavailable. Please try again later.',
      });
    }

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (e) {
      console.warn('[firebaseUserLogin] verifyIdToken failed:', e.message);
      return res.status(401).json({
        success: false,
        message: 'Your sign-in session is invalid or has expired. Please sign in again.',
      });
    }

    const now         = Date.now();
    const email       = decoded.email || '';
    const firebaseUid = decoded.uid;

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
