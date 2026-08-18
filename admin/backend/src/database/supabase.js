/**
 * supabase.js — Supabase PostgreSQL client for the UshaMart backend.
 *
 * Configuration is supplied ONLY by backend runtime environment variables:
 *   SUPABASE_URL              — project URL, e.g. https://xyz.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — service-role key (bypasses RLS)
 *
 * NEVER expose the service-role key in any frontend code.
 * The frontend communicates only through this backend API.
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

// ── Validation ────────────────────────────────────────────────────────────────
const validUrl = SUPABASE_URL.startsWith('https://') && SUPABASE_URL.includes('.supabase.co');
const validKey = SUPABASE_KEY.length > 50;

const isConfigured = validUrl && validKey;

// Detect if the key is a real service-role key (not an anon key)
// Service-role keys start with eyJ… and have "role":"service_role" in the JWT payload
let hasServiceRole = false;
if (validKey && SUPABASE_KEY.startsWith('eyJ')) {
  try {
    const payload = JSON.parse(Buffer.from(SUPABASE_KEY.split('.')[1], 'base64').toString());
    hasServiceRole = payload.role === 'service_role';
  } catch {
    // JWT decode failed — assume it's not a service-role key
    hasServiceRole = false;
  }
}
// Also accept sb_secret_ format keys (future Supabase key format)
if (SUPABASE_KEY.startsWith('sb_secret_')) hasServiceRole = true;

let configurationError = '';
if (!validUrl) {
  configurationError = 'SUPABASE_URL is missing or invalid. It must be https://YOUR_PROJECT.supabase.co';
} else if (!validKey) {
  configurationError = 'SUPABASE_SERVICE_ROLE_KEY is missing or too short. Copy it from Supabase Dashboard → Project Settings → API.';
} else if (!hasServiceRole && process.env.NODE_ENV === 'production') {
  configurationError = 'SUPABASE_SERVICE_ROLE_KEY appears to be an anon key, not a service-role key. The backend requires the service-role key.';
}

let supabase = null;

if (isConfigured) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession:   false,
      autoRefreshToken: false,
    },
    db: { schema: 'public' },
    global: {
      headers: { 'x-client-info': 'ushamart-backend/2.0' },
    },
  });

  if (configurationError) {
    console.warn(`⚠   Supabase: ${configurationError}`);
  } else {
    console.log(`✅  Supabase connected → ${SUPABASE_URL}`);
    console.log(`    Service role key: ${hasServiceRole ? 'yes ✓' : 'no (anon key detected — writes may fail)'}`);
  }

  // Initialise storage buckets at startup (non-blocking, service-role only)
  if (hasServiceRole) {
    (async () => {
      try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        if (listError) {
          console.warn('⚠   Storage bucket check failed:', listError.message);
          return;
        }
        const required = ['ushamart', 'category-images'];
        for (const name of required) {
          if (!buckets.find(b => b.name === name)) {
            const { error } = await supabase.storage.createBucket(name, {
              public:        true,
              fileSizeLimit: 5242880, // 5 MB
            });
            if (error) {
              console.warn(`⚠   Could not create '${name}' bucket:`, error.message);
            } else {
              console.log(`✅  Storage bucket '${name}' created.`);
            }
          }
        }
      } catch (err) {
        console.warn('⚠   Storage init check failed (non-fatal):', err.message);
      }
    })();
  }
} else {
  if (process.env.NODE_ENV === 'production') {
    console.error(`❌  Supabase UNAVAILABLE: ${configurationError}`);
  } else {
    const localMode = String(process.env.USE_LOCAL_DB || '').toLowerCase() === 'true';
    if (localMode) {
      console.warn('⚠   Supabase not configured — using local JSON files (USE_LOCAL_DB=true).');
    } else {
      console.error(`❌  Supabase not configured: ${configurationError}`);
      console.error('    Set USE_LOCAL_DB=true to use local JSON files for local development.');
    }
  }
}

module.exports = { supabase, isConfigured, hasServiceRole, configurationError };
