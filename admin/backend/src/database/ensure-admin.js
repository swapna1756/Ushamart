/**
 * ensure-admin.js
 *
 * Runs automatically at server startup.
 * Checks whether the super-admin user exists in public.users.
 * If not, creates it using ADMIN_EMAIL + ADMIN_PASSWORD from env vars.
 *
 * This means the admin account is ALWAYS present in the database after
 * every Render deploy, restart, or database migration — with zero manual steps.
 *
 * Security:
 *   • Password is bcrypt-hashed (cost 10) before being stored.
 *   • The plain-text password is NEVER logged or included in any response.
 *   • Credentials are read only from process.env — never hardcoded here.
 */

const bcrypt = require('bcryptjs');
const db     = require('./db');
const { isConfigured } = require('./supabase');

async function ensureAdminExists() {
  // Only run when Supabase is properly configured
  if (!isConfigured) {
    console.warn('⚠   ensure-admin: Supabase not configured — skipping admin bootstrap.');
    return;
  }

  const adminEmail = (process.env.ADMIN_EMAIL    || '').trim().toLowerCase();
  const adminPass  = (process.env.ADMIN_PASSWORD || '').trim();

  if (!adminEmail || !adminPass) {
    console.warn('⚠   ensure-admin: ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin bootstrap.');
    return;
  }

  try {
    // Fetch all users with admin roles
    let existingAdmins;
    try {
      existingAdmins = await db.find('users', u =>
        ['super_admin', 'store_manager'].includes(u.role) &&
        u.email?.toLowerCase() === adminEmail
      );
    } catch (findErr) {
      // Table may not exist yet (migration not run) — skip gracefully
      if (/schema cache|does not exist|relation.*users/i.test(findErr.message)) {
        console.warn('⚠   ensure-admin: public.users table not found yet — run the migration SQL first.');
        return;
      }
      throw findErr;
    }

    if (existingAdmins.length > 0) {
      // Admin already exists — ensure the password hash is up to date
      const admin = existingAdmins[0];
      let needsUpdate = false;

      // If stored password is plain text or was set with a different value, re-hash
      if (!admin.password || !admin.password.startsWith('$2')) {
        needsUpdate = true;
      } else {
        // Verify the current env password still matches the stored hash
        const matches = await bcrypt.compare(adminPass, admin.password);
        if (!matches) {
          needsUpdate = true;
          console.log('🔑  ensure-admin: Admin password changed in env — updating hash.');
        }
      }

      if (needsUpdate) {
        const newHash = await bcrypt.hash(adminPass, 10);
        await db.update('users', admin.id, {
          password:  newHash,
          email:     adminEmail,
          role:      'super_admin',
          status:    'active',
          updatedAt: Date.now(),
        });
        console.log('✅  ensure-admin: Admin password hash refreshed.');
      } else {
        console.log(`✅  ensure-admin: Admin user verified (${adminEmail}).`);
      }
      return;
    }

    // Admin does not exist — create it now
    const passwordHash = await bcrypt.hash(adminPass, 10);
    const now = Date.now();

    await db.insert('users', {
      id:        'adm_001',
      name:      'Admin',
      email:     adminEmail,
      password:  passwordHash,   // bcrypt hash — plain text NEVER stored
      phone:     '',
      role:      'super_admin',
      status:    'active',
      createdAt: now,
      updatedAt: now,
    });

    console.log(`✅  ensure-admin: Super-admin created (${adminEmail}).`);
  } catch (err) {
    // Non-fatal — server continues even if bootstrap fails.
    // The adminLogin auto-create fallback in auth.controller.js will
    // create the user on the first successful login attempt.
    console.error('⚠   ensure-admin: Bootstrap failed (non-fatal):', err.message);
  }
}

module.exports = ensureAdminExists;
