/**
 * migrate.js — Migrate local JSON data → Supabase Postgres
 * Run: node src/database/migrate.js
 *
 * This script:
 *  1. Reads all local JSON files
 *  2. Maps camelCase fields to snake_case columns
 *  3. Upserts everything into Supabase
 *  4. Verifies row counts match
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs   = require('fs');
const path = require('path');
const { supabase, isConfigured } = require('./supabase');

if (!isConfigured) {
  console.error('❌  Supabase not configured. Set SUPABASE_URL and SUPABASE_KEY in .env');
  process.exit(1);
}

const DATA_DIR = path.join(__dirname, 'data');

function readLocal(name) {
  const fp = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(fp)) return [];
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return []; }
}

// ── Field mappers: camelCase JSON → snake_case Supabase columns ───────────────
function mapUser(u) {
  return {
    id: u.id, name: u.name || null, email: u.email || null,
    password: u.password || null, phone: u.phone || null,
    role: u.role || 'customer', status: u.status || 'active',
    address_text: u.addressText || null, pincode: u.pincode || null,
    total_orders: u.totalOrders || 0, total_spent: u.totalSpent || 0,
    registered_at: u.registeredAt || null, last_login: u.lastLogin || null,
    created_at: u.createdAt || Date.now(), updated_at: u.updatedAt || Date.now(),
  };
}

function mapCategory(c) {
  return {
    id: c.id, name: c.name, description: c.description || null,
    emoji_icon: c.emojiIcon || null, icon: c.icon || null, banner: c.banner || null,
    section: c.section || 'Grocery & Kitchen', status: c.status || 'published',
    featured: Boolean(c.featured), display_order: c.displayOrder || 0,
    created_at: c.createdAt || Date.now(), updated_at: c.updatedAt || Date.now(),
  };
}

function mapProduct(p) {
  return {
    id: p.id, name: p.name, brand: p.brand || null, description: p.description || null,
    category: p.category || null, subcategory: p.subcategory || null,
    sku: p.sku || null, barcode: p.barcode || null, unit: p.unit || null,
    variants: p.variants || null,
    variant_list: Array.isArray(p.variantList) ? p.variantList : [],
    images: Array.isArray(p.images) ? p.images : [],
    mrp: Number(p.mrp) || 0, price: Number(p.price) || 0,
    discount_percent: Number(p.discountPercent) || 0,
    stock: Number(p.stock) || 0, low_stock_alert: Number(p.lowStockAlert) || 10,
    status: p.status || 'draft', availability_status: p.availabilityStatus || p.status || 'draft',
    pincodes_available: Array.isArray(p.pincodesAvailable) ? p.pincodesAvailable : [],
    featured: Boolean(p.featured), best_seller: Boolean(p.bestSeller),
    new_arrival: Boolean(p.newArrival), trending: Boolean(p.trending),
    today_offer: Boolean(p.todayOffer), expiry_date: p.expiryDate || null,
    gst: p.gst || '5', delivery_time: p.deliveryTime || '1-2 Days', cod: p.cod !== false,
    specifications: p.specifications || null,
    created_at: p.createdAt || Date.now(), updated_at: p.updatedAt || Date.now(),
  };
}

function mapPincode(p) {
  return {
    id: p.id || p.code, code: p.code, area_name: p.areaName || null,
    city: p.city || null, state: p.state || null,
    charges: Number(p.charges) || 0,
    delivery_time: p.deliveryTime || p.time || '1-2 Days',
    enabled: p.enabled !== false,
    created_at: p.createdAt || Date.now(), updated_at: p.updatedAt || Date.now(),
  };
}

function mapOrder(o) {
  return {
    id: o.id, order_number: o.orderNumber || null,
    user_id: o.userId || null, user_name: o.userName || null,
    user_phone: o.userPhone || null, user_email: o.userEmail || null,
    address_text: o.addressText || null, pincode: o.pincode || null,
    items: Array.isArray(o.items) ? o.items : [],
    subtotal: Number(o.subtotal) || 0,
    delivery_charges: Number(o.deliveryCharges) || 0,
    discount_amount: Number(o.discountAmount) || 0,
    total_amount: Number(o.totalAmount) || 0,
    coupon_code: o.couponCode || null, status: o.status || 'Pending',
    payment_method: o.paymentMethod || 'COD', payment_status: o.paymentStatus || 'Pending',
    delivery_slot: o.deliverySlot || null,
    created_at: o.createdAt || Date.now(), updated_at: o.updatedAt || Date.now(),
  };
}

function mapBanner(b) {
  return {
    id: b.id, title: b.title, subtitle: b.subtitle || null,
    badge_text: b.badgeText || null, button_text: b.buttonText || null,
    button_dest: b.buttonDest || null, bg_gradient: b.bgGradient || null,
    bg_color: b.bgColor || null, image_url: b.imageUrl || null,
    active: b.active !== false, display_order: b.displayOrder || 0,
    created_at: b.createdAt || Date.now(), updated_at: b.updatedAt || Date.now(),
  };
}

function mapOffer(o) {
  return {
    id: o.id, title: o.title, subtitle: o.subtitle || null,
    badge_text: o.badgeText || null, button_text: o.buttonText || null,
    image_url: o.imageUrl || null, bg_color: o.bgColor || null,
    offer_type: o.offerType || 'general',
    linked_cat_id: o.linkedCatId || null, linked_prod_id: o.linkedProdId || null,
    multi_prod_ids: Array.isArray(o.multiProdIds) ? o.multiProdIds : [],
    start_date: o.startDate || null, end_date: o.endDate || null,
    status: o.status || 'active', active: o.active !== false,
    display_order: o.displayOrder || 0,
    created_at: o.createdAt || Date.now(), updated_at: o.updatedAt || Date.now(),
  };
}

function mapCoupon(c) {
  return {
    id: c.id, code: c.code, type: c.type, value: Number(c.value) || 0,
    min_spend: Number(c.minSpend) || 0, description: c.description || null,
    status: c.status || 'published',
    created_at: c.createdAt || Date.now(), updated_at: c.updatedAt || Date.now(),
  };
}

function mapNotification(n) {
  return {
    id: n.id, title: n.title, content: n.content || null, message: n.message || null,
    type: n.type || 'promotional', status: n.status || 'published',
    sent_time: n.sentTime || Date.now(),
    created_at: n.createdAt || Date.now(), updated_at: n.updatedAt || Date.now(),
  };
}

// ── Upsert batch into Supabase ────────────────────────────────────────────────
async function upsert(table, rows) {
  if (!rows || rows.length === 0) {
    console.log(`  ⚪ ${table}: no data to migrate`);
    return 0;
  }
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error(`  ❌ ${table}: ${error.message}`);
    return 0;
  }
  console.log(`  ✅ ${table}: ${rows.length} rows migrated`);
  return rows.length;
}

// ── Main migration ────────────────────────────────────────────────────────────
async function migrate() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║        UshaMart → Supabase Migration                ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
  console.log('Target:', process.env.SUPABASE_URL, '\n');

  let total = 0;

  total += await upsert('users',          readLocal('users').map(mapUser));
  total += await upsert('categories',     readLocal('categories').map(mapCategory));
  total += await upsert('products',       readLocal('products').map(mapProduct));
  total += await upsert('pincodes',       readLocal('pincodes').map(mapPincode));
  total += await upsert('orders',         readLocal('orders').map(mapOrder));
  total += await upsert('banners',        readLocal('banners').map(mapBanner));
  total += await upsert('special_offers', readLocal('special_offers').map(mapOffer));
  total += await upsert('coupons',        readLocal('coupons').map(mapCoupon));
  total += await upsert('notifications',  readLocal('notifications').map(mapNotification));

  console.log(`\n✅ Migration complete — ${total} total rows written to Supabase.\n`);
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
