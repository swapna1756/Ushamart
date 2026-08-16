/**
 * db.js — Hybrid database adapter.
 * Uses Supabase when configured, falls back to JSON files.
 * All controllers use this API — zero changes needed in controllers.
 */
const fs   = require('fs');
const path = require('path');
const { supabase, isConfigured: supabaseReady } = require('./supabase');

// ── JSON file fallback ────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const filePath = n => path.join(DATA_DIR, `${n}.json`);

function readLocal(name) {
  const fp = filePath(name);
  if (!fs.existsSync(fp)) return [];
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return []; }
}
function writeLocal(name, data) {
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2), 'utf8');
}

// ── snake_case ↔ camelCase mapping ───────────────────────────────────────────
// Supabase columns use snake_case; app code uses camelCase.
const SNAKE = {
  emojiIcon:'emoji_icon', displayOrder:'display_order', badgeText:'badge_text',
  buttonText:'button_text', buttonDest:'button_dest', bgGradient:'bg_gradient',
  bgColor:'bg_color', imageUrl:'image_url', offerType:'offer_type',
  linkedCatId:'linked_cat_id', linkedProdId:'linked_prod_id',
  multiProdIds:'multi_prod_ids', startDate:'start_date', endDate:'end_date',
  variantList:'variant_list', discountPercent:'discount_percent',
  lowStockAlert:'low_stock_alert', availabilityStatus:'availability_status',
  pincodesAvailable:'pincodes_available', bestSeller:'best_seller',
  newArrival:'new_arrival', todayOffer:'today_offer', expiryDate:'expiry_date',
  deliveryTime:'delivery_time', orderNumber:'order_number',
  userId:'user_id', userName:'user_name', userPhone:'user_phone',
  userEmail:'user_email', addressText:'address_text',
  deliveryCharges:'delivery_charges', discountAmount:'discount_amount',
  totalAmount:'total_amount', couponCode:'coupon_code',
  paymentMethod:'payment_method', paymentStatus:'payment_status',
  orderStatus:'order_status', deliverySlot:'delivery_slot',
  productId:'product_id', productName:'product_name', productImage:'product_image',
  firebaseUid:'firebase_uid',
  variantInfo:'variant_info', unitPrice:'unit_price', finalAmount:'final_amount',
  customerName:'customer_name', customerPhone:'customer_phone', addressId:'address_id',
  fullName:'full_name', mobileNumber:'mobile_number', house:'house',
  street:'street', landmark:'landmark', state:'state', district:'district',
  city:'city', deliveryInstructions:'delivery_instructions',
  statusHistory:'status_history', idempotencyKey:'idempotency_key',
  sentTime:'sent_time',
  minSpend:'min_spend', registeredAt:'registered_at',
  lastLogin:'last_login', totalOrders:'total_orders',
  totalSpent:'total_spent', areaName:'area_name',
  createdAt:'created_at', updatedAt:'updated_at',
};
const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([k,v])=>[v,k]));

function toSnake(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k,v]) => [SNAKE[k]||k, v])
  );
}
function toCamel(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k,v]) => [CAMEL[k]||k, v])
  );
}
function rowsToCamel(rows) {
  return (rows||[]).map(toCamel);
}

// ── Supabase operations ───────────────────────────────────────────────────────
async function sbGetAll(table) {
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: true });
  if (error) throw new Error(`[SB getAll:${table}] ${error.message}`);
  return rowsToCamel(data || []);
}
async function sbGetById(table, id) {
  const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`[SB getById:${table}] ${error.message}`);
  return data ? toCamel(data) : null;
}
async function sbInsert(table, doc) {
  const row = toSnake({ ...doc, createdAt: doc.createdAt||Date.now(), updatedAt: Date.now() });
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) throw new Error(`[SB insert:${table}] ${error.message}`);
  return toCamel(data);
}
async function sbUpdate(table, id, fields) {
  const row = toSnake({ ...fields, updatedAt: Date.now() });
  const { data, error } = await supabase.from(table).update(row).eq('id', id).select().single();
  if (error) throw new Error(`[SB update:${table}] ${error.message}`);
  return toCamel(data);
}
async function sbUpsert(table, id, doc) {
  const row = toSnake({ ...doc, id, updatedAt: Date.now() });
  const { data, error } = await supabase.from(table).upsert(row, { onConflict:'id' }).select().single();
  if (error) throw new Error(`[SB upsert:${table}] ${error.message}`);
  return toCamel(data);
}
async function sbDelete(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw new Error(`[SB delete:${table}] ${error.message}`);
  return true;
}

// ── Unified db API (async-first; sync JSON as fallback) ───────────────────────
const db = {
  async getAll(collection) {
    return supabaseReady ? sbGetAll(collection) : readLocal(collection);
  },
  async getById(collection, id) {
    return supabaseReady ? sbGetById(collection, id)
      : (readLocal(collection).find(d => d.id === id) || null);
  },
  async find(collection, predicate) {
    const rows = supabaseReady ? await sbGetAll(collection) : readLocal(collection);
    return rows.filter(predicate);
  },
  async insert(collection, doc) {
    if (supabaseReady) return sbInsert(collection, doc);
    const docs  = readLocal(collection);
    const entry = { ...doc, createdAt: doc.createdAt||Date.now(), updatedAt: Date.now() };
    docs.push(entry); writeLocal(collection, docs); return entry;
  },
  async update(collection, id, fields) {
    if (supabaseReady) return sbUpdate(collection, id, fields);
    const docs = readLocal(collection);
    const idx  = docs.findIndex(d => d.id === id);
    if (idx === -1) return null;
    docs[idx] = { ...docs[idx], ...fields, updatedAt: Date.now() };
    writeLocal(collection, docs); return docs[idx];
  },
  async upsert(collection, id, doc) {
    if (supabaseReady) return sbUpsert(collection, id, doc);
    const docs  = readLocal(collection);
    const idx   = docs.findIndex(d => d.id === id);
    const entry = { ...doc, id, updatedAt: Date.now() };
    if (idx === -1) { entry.createdAt = entry.createdAt||Date.now(); docs.push(entry); }
    else { entry.createdAt = docs[idx].createdAt; docs[idx] = entry; }
    writeLocal(collection, docs); return entry;
  },
  async delete(collection, id) {
    if (supabaseReady) return sbDelete(collection, id);
    const docs     = readLocal(collection);
    const filtered = docs.filter(d => d.id !== id);
    if (filtered.length === docs.length) return false;
    writeLocal(collection, filtered); return true;
  },
  async count(collection, predicate) {
    if (supabaseReady) {
      const { count, error } = await supabase.from(collection)
        .select('*', { count:'exact', head:true });
      if (error) throw new Error(error.message);
      return count || 0;
    }
    const docs = readLocal(collection);
    return predicate ? docs.filter(predicate).length : docs.length;
  },
  async replaceAll(collection, docs) {
    if (supabaseReady) {
      await supabase.from(collection).delete().neq('id', '___never___');
      if (docs.length > 0) {
        const rows = docs.map(d => toSnake({ ...d, updatedAt: Date.now() }));
        const { error } = await supabase.from(collection).insert(rows);
        if (error) throw new Error(error.message);
      }
      return;
    }
    writeLocal(collection, docs);
  },
};

module.exports = db;
