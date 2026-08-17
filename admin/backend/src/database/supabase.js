/**
 * supabase.js — Supabase Postgres client for UshaMart backend.
 * Project: https://xkooguvxhhempfpcmrjd.supabase.co
 */
const { createClient } = require('@supabase/supabase-js');

let SUPABASE_URL = process.env.SUPABASE_URL;
let SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET || process.env.SUPABASE_KEY || '';

const isJunk = (val) => {
  if (!val) return true;
  const s = String(val).trim();
  return !(
    (s.startsWith('eyJ') && s.length > 50) ||
    s.startsWith('sb_secret_') ||
    s.startsWith('sb_publishable_')
  );
};

const hasServiceRole = String(SUPABASE_KEY).startsWith('sb_secret_') ||
  (String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').startsWith('eyJ') && String(process.env.SUPABASE_SERVICE_ROLE_KEY).length > 50) ||
  (String(process.env.SUPABASE_SECRET || '').startsWith('eyJ') && String(process.env.SUPABASE_SECRET).length > 50);

if (isJunk(SUPABASE_KEY)) SUPABASE_KEY = '';
// Never silently select a real database project.  The deployed backend must
// receive its intended project URL through its environment configuration.
if (!SUPABASE_URL || !SUPABASE_URL.startsWith('https://') || !SUPABASE_URL.includes('.supabase.co')) {
  SUPABASE_URL = '';
}

const isConfigured = !!(
  SUPABASE_URL &&
  SUPABASE_KEY &&
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_URL.includes('.supabase.co')
);

let supabase = null;

if (isConfigured) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth:  { persistSession: false, autoRefreshToken: false },
    db:    { schema: 'public' },
    global: {
      headers: { 'x-client-info': 'ushamart-backend/1.0' },
    },
  });
  console.log(`✅  Supabase connected → ${SUPABASE_URL}`);

  // Only a service-role key may manage buckets. A publishable key is still
  // valid for ordinary RLS-controlled database requests.
  if (hasServiceRole) (async () => {
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      if (listError) {
        console.warn('⚠ Could not list storage buckets:', listError.message);
        return;
      }
      const bucketsToCreate = ['category-images', 'ushamart'];
      for (const bName of bucketsToCreate) {
        const exists = buckets.find(b => b.name === bName);
        if (!exists) {
          console.log(`Bucket '${bName}' does not exist. Creating it...`);
          const { error: createError } = await supabase.storage.createBucket(bName, {
            public: true,
            fileSizeLimit: 5242880 // 5MB
          });
          if (createError) {
            console.error(`❌ Failed to create '${bName}' bucket:`, createError.message);
          } else {
            console.log(`✅ '${bName}' bucket created successfully!`);
          }
        } else {
          console.log(`✅ '${bName}' bucket already exists.`);
        }
      }
    } catch (err) {
      console.warn('⚠ Storage initialization check failed (this is expected if running with restricted anon key):', err.message);
    }
  })();
} else {
  console.warn('⚠   Supabase not configured — using local JSON file database.');
}

module.exports = { supabase, isConfigured, hasServiceRole };
