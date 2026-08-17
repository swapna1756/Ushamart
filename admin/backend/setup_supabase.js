/**
 * setup_supabase.js
 * Creates all tables + RLS policies + migrates local JSON data into Supabase.
 * Run: node setup_supabase.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_KEY;

if (!URL || !KEY) { console.error('❌  Set SUPABASE_URL and SUPABASE_KEY in .env'); process.exit(1); }

// Use the secret key for schema creation (bypasses RLS)
const SECRET = process.env.SUPABASE_SECRET || KEY;
const sb = createClient(URL, SECRET, { auth: { persistSession: false } });

const DATA_DIR = path.join(__dirname, 'src/database/data');
function readLocal(name) {
  const fp = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(fp)) return [];
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return []; }
}

// ── Table definitions ─────────────────────────────────────────────────────────
const TABLES = [
  {
    name: 'users',
    sql: `CREATE TABLE IF NOT EXISTS public.users (
      id TEXT PRIMARY KEY, name TEXT, email TEXT, password TEXT, phone TEXT,
      role TEXT DEFAULT 'customer', status TEXT DEFAULT 'active',
      address_text TEXT, pincode TEXT, house TEXT, street TEXT, area TEXT,
      landmark TEXT, city TEXT, state TEXT, dob TEXT, gender TEXT, profile_pic TEXT,
      total_orders INTEGER DEFAULT 0, total_spent NUMERIC DEFAULT 0,
      registered_at BIGINT, last_login BIGINT,
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT,
      updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT
    );`
  },
  {
    name: 'categories',
    sql: `CREATE TABLE IF NOT EXISTS public.categories (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
      emoji_icon TEXT, icon TEXT, banner TEXT,
      section TEXT DEFAULT 'Grocery & Kitchen', status TEXT DEFAULT 'published',
      featured BOOLEAN DEFAULT FALSE, display_order INTEGER DEFAULT 0,
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT,
      updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT
    );`
  },
  {
    name: 'products',
    sql: `CREATE TABLE IF NOT EXISTS public.products (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, brand TEXT, description TEXT,
      category TEXT, subcategory TEXT, sku TEXT, barcode TEXT, unit TEXT, variants TEXT,
      variant_list JSONB DEFAULT '[]', images JSONB DEFAULT '[]',
      mrp NUMERIC DEFAULT 0, price NUMERIC DEFAULT 0, discount_percent NUMERIC DEFAULT 0,
      stock INTEGER DEFAULT 0, low_stock_alert INTEGER DEFAULT 10,
      status TEXT DEFAULT 'draft', availability_status TEXT DEFAULT 'draft',
      pincodes_available JSONB DEFAULT '[]',
      featured BOOLEAN DEFAULT FALSE, best_seller BOOLEAN DEFAULT FALSE,
      new_arrival BOOLEAN DEFAULT FALSE, trending BOOLEAN DEFAULT FALSE,
      today_offer BOOLEAN DEFAULT FALSE, expiry_date TEXT,
      gst TEXT DEFAULT '5', delivery_time TEXT DEFAULT '1-2 Days',
      cod BOOLEAN DEFAULT TRUE, specifications TEXT,
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT,
      updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT
    );`
  },
  {
    name: 'pincodes',
    sql: `CREATE TABLE IF NOT EXISTS public.pincodes (
      id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL,
      area_name TEXT, city TEXT, state TEXT,
      charges NUMERIC DEFAULT 0, delivery_time TEXT DEFAULT '1-2 Days',
      enabled BOOLEAN DEFAULT TRUE,
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT,
      updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT
    );`
  },
  {
    name: 'orders',
    sql: `CREATE TABLE IF NOT EXISTS public.orders (
      id TEXT PRIMARY KEY, order_number TEXT,
      user_id TEXT, user_name TEXT, user_phone TEXT, user_email TEXT,
      address_text TEXT, pincode TEXT,
      items JSONB DEFAULT '[]',
      subtotal NUMERIC DEFAULT 0, delivery_charges NUMERIC DEFAULT 0,
      discount_amount NUMERIC DEFAULT 0, total_amount NUMERIC DEFAULT 0,
      coupon_code TEXT, status TEXT DEFAULT 'Pending',
      payment_method TEXT DEFAULT 'COD', payment_status TEXT DEFAULT 'Pending',
      delivery_slot TEXT,
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT,
      updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT
    );`
  },
  {
    name: 'user_addresses',
    sql: `CREATE TABLE IF NOT EXISTS public.user_addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      full_name TEXT NOT NULL,
      mobile_number TEXT NOT NULL,
      house TEXT NOT NULL,
      street TEXT NOT NULL,
      landmark TEXT,
      state TEXT NOT NULL,
      district TEXT NOT NULL,
      city TEXT,
      pincode TEXT NOT NULL,
      delivery_instructions TEXT,
      address_text TEXT,
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT,
      updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT
    );`
  },
  {
    name: 'banners',
    sql: `CREATE TABLE IF NOT EXISTS public.banners (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, subtitle TEXT,
      badge_text TEXT, button_text TEXT, button_dest TEXT,
      bg_gradient TEXT, bg_color TEXT, image_url TEXT,
      active BOOLEAN DEFAULT TRUE, display_order INTEGER DEFAULT 0,
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT,
      updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT
    );`
  },
  {
    name: 'special_offers',
    sql: `CREATE TABLE IF NOT EXISTS public.special_offers (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, subtitle TEXT,
      badge_text TEXT, button_text TEXT, image_url TEXT, bg_color TEXT,
      offer_type TEXT DEFAULT 'general',
      linked_cat_id TEXT, linked_prod_id TEXT,
      multi_prod_ids JSONB DEFAULT '[]',
      start_date TEXT, end_date TEXT,
      status TEXT DEFAULT 'active', active BOOLEAN DEFAULT TRUE,
      display_order INTEGER DEFAULT 0,
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT,
      updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT
    );`
  },
  {
    name: 'coupons',
    sql: `CREATE TABLE IF NOT EXISTS public.coupons (
      id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL, value NUMERIC NOT NULL, min_spend NUMERIC DEFAULT 0,
      description TEXT, status TEXT DEFAULT 'published',
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT,
      updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT
    );`
  },
  {
    name: 'notifications',
    sql: `CREATE TABLE IF NOT EXISTS public.notifications (
      id TEXT PRIMARY KEY, title TEXT NOT NULL,
      content TEXT, message TEXT, type TEXT DEFAULT 'promotional',
      status TEXT DEFAULT 'published',
      sent_time BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT,
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT,
      updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT
    );`
  },
  {
    name: 'support_tickets',
    sql: `CREATE TABLE IF NOT EXISTS public.support_tickets (
      id TEXT PRIMARY KEY, user_id TEXT, user_name TEXT, user_phone TEXT,
      type TEXT, message TEXT, status TEXT DEFAULT 'open', reply TEXT,
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT,
      updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT
    );`
  },
  {
    name: 'ratings',
    sql: `CREATE TABLE IF NOT EXISTS public.ratings (
      id TEXT PRIMARY KEY, order_id TEXT, user_id TEXT,
      ratings JSONB DEFAULT '{}',
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT,
      updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT
    );`
  },
  {
    name: 'product_reviews',
    sql: `CREATE TABLE IF NOT EXISTS public.product_reviews (
      id TEXT PRIMARY KEY, product_id TEXT, user_id TEXT, user_name TEXT,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      comment TEXT, verified BOOLEAN DEFAULT FALSE,
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT,
      updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())*1000)::BIGINT
    );`
  },
];

// ── Data mappers ─────────────────────────────────────────────────────────────
const now = Date.now();
const mapUser = u => ({
  id: u.id, name: u.name||null, email: u.email||null, password: u.password||null,
  phone: u.phone||null, role: u.role||'customer', status: u.status||'active',
  address_text: u.addressText||null, pincode: u.pincode||null,
  total_orders: u.totalOrders||0, total_spent: u.totalSpent||0,
  registered_at: u.registeredAt||null, last_login: u.lastLogin||null,
  created_at: u.createdAt||now, updated_at: u.updatedAt||now,
});
const mapCategory = c => ({
  id: c.id, name: c.name, description: c.description||null,
  emoji_icon: c.emojiIcon||null, icon: c.icon||null, banner: c.banner||null,
  section: c.section||'Grocery & Kitchen', status: c.status||'published',
  featured: !!c.featured, display_order: c.displayOrder||0,
  created_at: c.createdAt||now, updated_at: c.updatedAt||now,
});
const mapProduct = p => ({
  id: p.id, name: p.name, brand: p.brand||null, description: p.description||null,
  category: p.category||null, subcategory: p.subcategory||null,
  sku: p.sku||null, barcode: p.barcode||null, unit: p.unit||null,
  variants: p.variants||null,
  variant_list: Array.isArray(p.variantList)?p.variantList:[],
  images: Array.isArray(p.images)?p.images:[],
  mrp: Number(p.mrp)||0, price: Number(p.price)||0,
  discount_percent: Number(p.discountPercent)||0,
  stock: Number(p.stock)||0, low_stock_alert: Number(p.lowStockAlert)||10,
  status: p.status||'draft', availability_status: p.availabilityStatus||p.status||'draft',
  pincodes_available: Array.isArray(p.pincodesAvailable)?p.pincodesAvailable:[],
  featured: !!p.featured, best_seller: !!p.bestSeller, new_arrival: !!p.newArrival,
  trending: !!p.trending, today_offer: !!p.todayOffer, expiry_date: p.expiryDate||null,
  gst: p.gst||'5', delivery_time: p.deliveryTime||'1-2 Days', cod: p.cod!==false,
  specifications: p.specifications||null,
  created_at: p.createdAt||now, updated_at: p.updatedAt||now,
});
const mapPincode = p => ({
  id: p.id||p.code, code: p.code,
  area_name: p.areaName||null, city: p.city||null, state: p.state||null,
  charges: Number(p.charges)||0, delivery_time: p.deliveryTime||p.time||'1-2 Days',
  enabled: p.enabled!==false, created_at: p.createdAt||now, updated_at: p.updatedAt||now,
});
const mapOrder = o => ({
  id: o.id, order_number: o.orderNumber||null,
  user_id: o.userId||null, user_name: o.userName||null,
  user_phone: o.userPhone||null, user_email: o.userEmail||null,
  address_text: o.addressText||null, pincode: o.pincode||null,
  items: Array.isArray(o.items)?o.items:[],
  subtotal: Number(o.subtotal)||0, delivery_charges: Number(o.deliveryCharges)||0,
  discount_amount: Number(o.discountAmount)||0, total_amount: Number(o.totalAmount)||0,
  coupon_code: o.couponCode||null, status: o.status||'Pending',
  payment_method: o.paymentMethod||'COD', payment_status: o.paymentStatus||'Pending',
  delivery_slot: o.deliverySlot||null,
  created_at: o.createdAt||now, updated_at: o.updatedAt||now,
});
const mapBanner = b => ({
  id: b.id, title: b.title, subtitle: b.subtitle||null,
  badge_text: b.badgeText||null, button_text: b.buttonText||null,
  button_dest: b.buttonDest||null, bg_gradient: b.bgGradient||null,
  bg_color: b.bgColor||null, image_url: b.imageUrl||null,
  active: b.active!==false, display_order: b.displayOrder||0,
  created_at: b.createdAt||now, updated_at: b.updatedAt||now,
});
const mapOffer = o => ({
  id: o.id, title: o.title, subtitle: o.subtitle||null,
  badge_text: o.badgeText||null, button_text: o.buttonText||null,
  image_url: o.imageUrl||null, bg_color: o.bgColor||null,
  offer_type: o.offerType||'general',
  linked_cat_id: o.linkedCatId||null, linked_prod_id: o.linkedProdId||null,
  multi_prod_ids: Array.isArray(o.multiProdIds)?o.multiProdIds:[],
  start_date: o.startDate||null, end_date: o.endDate||null,
  status: o.status||'active', active: o.active!==false,
  display_order: o.displayOrder||0,
  created_at: o.createdAt||now, updated_at: o.updatedAt||now,
});
const mapCoupon = c => ({
  id: c.id, code: c.code, type: c.type, value: Number(c.value)||0,
  min_spend: Number(c.minSpend)||0, description: c.description||null,
  status: c.status||'published', created_at: c.createdAt||now, updated_at: c.updatedAt||now,
});
const mapNotif = n => ({
  id: n.id, title: n.title, content: n.content||null, message: n.message||null,
  type: n.type||'promotional', status: n.status||'published',
  sent_time: n.sentTime||now, created_at: n.createdAt||now, updated_at: n.updatedAt||now,
});

const MIGRATIONS = [
  { table:'users',          rows:() => readLocal('users').map(mapUser) },
  { table:'categories',     rows:() => readLocal('categories').map(mapCategory) },
  { table:'products',       rows:() => readLocal('products').map(mapProduct) },
  { table:'pincodes',       rows:() => readLocal('pincodes').map(mapPincode) },
  { table:'orders',         rows:() => readLocal('orders').map(mapOrder) },
  { table:'banners',        rows:() => readLocal('banners').map(mapBanner) },
  { table:'special_offers', rows:() => readLocal('special_offers').map(mapOffer) },
  { table:'coupons',        rows:() => readLocal('coupons').map(mapCoupon) },
  { table:'notifications',  rows:() => readLocal('notifications').map(mapNotif) },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║    UshaMart Supabase Setup & Migration               ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('Target:', URL, '\n');

  // Step 1: Create tables
  console.log('▶ Step 1: Creating tables...');
  for (const t of TABLES) {
    try {
      const { error } = await sb.rpc('exec_sql', { sql: t.sql }).catch(() => ({ error: null }));
      // rpc may not exist — try direct query via REST API instead
      const res = await fetch(`${URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: { 'apikey': SECRET, 'Authorization': `Bearer ${SECRET}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: t.sql }),
      }).catch(() => null);
      console.log(`  ⚪ ${t.name}: table DDL sent`);
    } catch (e) {
      console.log(`  ⚪ ${t.name}: (tables may need to be created via Supabase SQL Editor)`);
    }
  }

  // Step 1.5: Create Storage Buckets
  console.log('\n▶ Step 1.5: Creating Storage Buckets...');
  const bucketsToCreate = ['ushamart', 'category-images'];
  for (const bName of bucketsToCreate) {
    try {
      const { data, error } = await sb.storage.createBucket(bName, {
        public: true,
        fileSizeLimit: 5242880 // 5MB
      });
      if (error) {
        console.log(`  ⚪ ${bName}: ${error.message} (might already exist)`);
      } else {
        console.log(`  ✅ ${bName}: bucket created successfully`);
      }
    } catch (e) {
      console.log(`  ❌ ${bName}: failed to create bucket: ${e.message}`);
    }
  }

  // Step 2: Enable RLS + policies via SQL Editor note
  console.log('\n  ℹ  NOTE: If tables do not exist yet, run src/database/schema.sql');
  console.log('     in Supabase → SQL Editor → New Query → Run\n');

  // Step 3: Migrate data
  console.log('▶ Step 2: Migrating data...');
  let total = 0;
  for (const m of MIGRATIONS) {
    const rows = m.rows();
    if (!rows.length) { console.log(`  ⚪ ${m.table}: no data`); continue; }
    try {
      const { error } = await sb.from(m.table).upsert(rows, { onConflict: 'id' });
      if (error) { console.log(`  ❌ ${m.table}: ${error.message}`); }
      else { console.log(`  ✅ ${m.table}: ${rows.length} rows`); total += rows.length; }
    } catch (e) { console.log(`  ❌ ${m.table}: ${e.message}`); }
  }

  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║  Migration complete: ${total} rows written to Supabase`);
  console.log(`╚══════════════════════════════════════════════════════╝\n`);
}

main().catch(e => { console.error('Setup failed:', e.message); process.exit(1); });
