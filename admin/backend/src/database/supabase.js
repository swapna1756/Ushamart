/**
 * supabase.js — Supabase Postgres client for UshaMart backend.
 * Project: https://xkooguvxhhempfpcmrjd.supabase.co
 */
const { createClient } = require('@supabase/supabase-js');

let SUPABASE_URL = process.env.SUPABASE_URL || 'https://xkooguvxhhempfpcmrjd.supabase.co';
let SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET || process.env.SUPABASE_KEY || 'sb_publishable_dOX9o2ZPgnyzL07orLNbnA_f_KD4Aqx';

// Detect and override placeholder values
if (!SUPABASE_URL || SUPABASE_URL.includes('YOUR_') || SUPABASE_URL.includes('your-') || SUPABASE_URL.includes('project-id')) {
  SUPABASE_URL = 'https://xkooguvxhhempfpcmrjd.supabase.co';
}
if (!SUPABASE_KEY || SUPABASE_KEY.includes('YOUR_') || SUPABASE_KEY.includes('your-') || SUPABASE_KEY.includes('sb_publishable_YOUR') || SUPABASE_KEY.includes('REPLACE')) {
  SUPABASE_KEY = 'sb_publishable_dOX9o2ZPgnyzL07orLNbnA_f_KD4Aqx';
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
} else {
  console.warn('⚠   Supabase not configured — using local JSON file database.');
}

module.exports = { supabase, isConfigured };
