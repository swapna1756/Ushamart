/*
 * Verifies the production checkout schema without exposing credentials.
 * Run after applying migrations/20260817_order_checkout.sql:
 *   node src/database/verify_order_schema.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { supabase, isConfigured } = require('./supabase');

const required = [
  ['orders', 'id,address_id,address,order_status,payment_status,status_history,idempotency_key'],
  ['user_addresses', 'id,user_id,pincode,address_text'],
  ['order_items', 'id,order_id,product_id,quantity,unit_price,subtotal'],
];

async function verify() {
  if (!isConfigured || !supabase) throw new Error('Supabase service credentials are not configured.');
  for (const [table, columns] of required) {
    const { error } = await supabase.from(table).select(columns).limit(0);
    if (error) throw new Error(`${table}: ${error.message}`);
    console.log(`OK ${table} (${columns})`);
  }
  console.log('Production checkout schema is ready.');
}

verify().catch(error => {
  console.error(`Schema verification failed: ${error.message}`);
  process.exitCode = 1;
});
