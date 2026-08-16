/**
 * supabase.js — Supabase Postgres client for UshaMart backend.
 * Project: https://xkooguvxhhempfpcmrjd.supabase.co
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

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
