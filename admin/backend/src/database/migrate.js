/**
 * migrate.js — Safely migrate local JSON data → Supabase Postgres
 *
 * Usage:
 *   node src/database/migrate.js
 *
 * What it does:
 *   1. Reads all local JSON files in src/database/data/
 *   2. Maps camelCase fields → snake_case columns
 *   3. Upserts into Supabase (ON CONFLICT DO UPDATE) — never deletes valid rows
 *   4. Migrates wishlists from users.wishlist[] → wishlists table
 *   5. Migrates order items from orders.items[] → order_items table
 *   6. Verifies final row counts
 *
 * Safe to run multiple times — uses upsert, not insert.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs   = require('fs');
const path = require('path');
const { supabase, isConfigured } = require('./supabase');

if (!isConfigured) {
  console.error('\n❌  Supabase is not configured.');
  console.error('    Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in admin/backend/.env\n');
  process.exit(1);
}

const DATA_DIR = path.join(__dirname, 'data');

function readLocal(name) {
  const fp = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(fp)) return [];
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return []; }
}

// ── Field mappers ─────────────────────────────────────────────────────────────

function mapUser(u) {
  return {
    id:           u.id,
    name:         u.name         || null,
    email:        u.email        || null,
    password:     u.password     || null,
    phone:        u.phone        || null,
    role:         u.role         || 'customer',
    status:       u.status       || 'active',
    firebase_uid: u.firebaseUid  || null,
    address_text: u.addressText  || null,
    pincode:      u.pincode      || null,
    house:        u.house        || null,
    street:       u.street       || null,
    area:         u.area         || null,
    landmark:     u.landmark     || null,
    city:         u.city         || null,
    state:        u.state        || null,
    dob:          u.dob          || null,
    gender:       u.gender       || null,
    profile_pic:  u.profilePic   || u.profile_pic || null,
    // wishlist migrated separately → wishlists table
    wishlist:     Array.isArray(u.wishlist) ? u.wishlist : [],
    total_orders: u.totalOrders  || 0,
    total_spent:  u.totalSpent   || 0,
    registered_at:u.registeredAt || null,
    last_login:   u.lastLogin    || null,
    created_at:   u.createdAt    || Date.now(),
    updated_at:   u.updatedAt    || Date.now(),
  };
}

function mapCategory(c) {
  return {
    id:            c.id,
    name:          c.name,
    description:   c.description  || null,
    emoji_icon:    c.emojiIcon    || null,
    icon:          c.icon         || null,
    banner:        c.banner       || null,
    section:       c.section      || 'Grocery & Kitchen',
    status:        c.status       || 'published',
    featured:      Boolean(c.featured),
    display_order: c.displayOrder || 0,
    created_at:    c.createdAt    || Date.now(),
    updated_at:    c.updatedAt    || Date.now(),
  };
}

function mapProduct(p) {
  return {
    id:                  p.id,
    name:                p.name,
    brand:               p.brand               || null,
    description:         p.description         || null,
    category:            p.category            || null,
    subcategory:         p.subcategory         || null,
    sku:                 p.sku                 || null,
    barcode:             p.barcode             || null,
    unit:                p.unit                || null,
    variants:            p.variants            || null,
    variant_list:        Array.isArray(p.variantList) ? p.variantList : [],
    images:              Array.isArray(p.images)       ? p.images      : [],
    mrp:                 Number(p.mrp)          || 0,
    price:               Number(p.price)        || 0,
    discount_percent:    Number(p.discountPercent) || 0,
    stock:               Number(p.stock)        || 0,
    low_stock_alert:     Number(p.lowStockAlert) || 10,
    status:              p.status              || 'draft',
    availability_status: p.availabilityStatus  || p.status || 'draft',
    pincodes_available:  Array.isArray(p.pincodesAvailable) ? p.pincodesAvailable : [],
    featured:            Boolean(p.featured),
    best_seller:         Boolean(p.bestSeller),
    new_arrival:         Boolean(p.newArrival),
    trending:            Boolean(p.trending),
    today_offer:         Boolean(p.todayOffer),
    expiry_date:         p.expiryDate          || null,
    gst:                 p.gst                 || '5',
    delivery_time:       p.deliveryTime        || '1-2 Days',
    cod:                 p.cod !== false,
    specifications:      p.specifications      || null,
    created_at:          p.createdAt           || Date.now(),
    updated_at:          p.updatedAt           || Date.now(),
  };
}

function mapPincode(p) {
  return {
    id:            p.id   || p.code,
    code:          p.code,
    area_name:     p.areaName     || null,
    city:          p.city         || null,
    district:      p.district     || null,
    state:         p.state        || null,
    latitude:      p.latitude     ? Number(p.latitude)  : null,
    longitude:     p.longitude    ? Number(p.longitude) : null,
    charges:       Number(p.charges)      || 0,
    delivery_time: p.deliveryTime || p.time || '1-2 Days',
    enabled:       p.enabled !== false,
    created_at:    p.createdAt    || Date.now(),
    updated_at:    p.updatedAt    || Date.now(),
  };
}

function mapOrder(o) {
  return {
    id:               o.id,
    order_number:     o.orderNumber    || null,
    user_id:          o.userId         || null,
    user_name:        o.userName       || null,
    user_phone:       o.userPhone      || null,
    user_email:       o.userEmail      || null,
    customer_name:    o.customerName   || o.userName  || null,
    customer_phone:   o.customerPhone  || o.userPhone || null,
    // address_id FK skipped on legacy orders (column may be null)
    address:          o.address        || {},
    address_text:     o.addressText    || null,
    pincode:          o.pincode        || null,
    items:            Array.isArray(o.items) ? o.items : [],
    subtotal:         Number(o.subtotal)         || 0,
    delivery_charges: Number(o.deliveryCharges)  || 0,
    discount_amount:  Number(o.discountAmount)   || 0,
    total_amount:     Number(o.totalAmount)      || 0,
    coupon_code:      o.couponCode     || null,
    status:           o.status         || 'PLACED',
    order_status:     o.orderStatus    || o.status || 'PLACED',
    payment_method:   o.paymentMethod  || 'COD',
    payment_status:   o.paymentStatus  || 'PENDING',
    delivery_slot:    o.deliverySlot   || null,
    status_history:   Array.isArray(o.statusHistory) ? o.statusHistory : [],
    idempotency_key:  o.idempotencyKey || null,
    created_at:       o.createdAt      || Date.now(),
    updated_at:       o.updatedAt      || Date.now(),
  };
}

function mapBanner(b) {
  return {
    id:            b.id,
    title:         b.title,
    subtitle:      b.subtitle       || null,
    badge_text:    b.badgeText      || null,
    button_text:   b.buttonText     || null,
    button_dest:   b.buttonDest     || null,
    bg_gradient:   b.bgGradient     || null,
    bg_color:      b.bgColor        || null,
    image_url:     b.imageUrl       || null,
    active:        b.active !== false,
    display_order: b.displayOrder   || 0,
    created_at:    b.createdAt      || Date.now(),
    updated_at:    b.updatedAt      || Date.now(),
  };
}

function mapOffer(o) {
  return {
    id:             o.id,
    title:          o.title,
    subtitle:       o.subtitle        || null,
    badge_text:     o.badgeText       || null,
    button_text:    o.buttonText      || null,
    image_url:      o.imageUrl        || null,
    bg_color:       o.bgColor         || null,
    offer_type:     o.offerType       || 'general',
    linked_cat_id:  o.linkedCatId     || null,
    linked_prod_id: o.linkedProdId    || null,
    multi_prod_ids: Array.isArray(o.multiProdIds) ? o.multiProdIds : [],
    start_date:     o.startDate       || null,
    end_date:       o.endDate         || null,
    status:         o.status          || 'active',
    active:         o.active !== false,
    display_order:  o.displayOrder    || 0,
    created_at:     o.createdAt       || Date.now(),
    updated_at:     o.updatedAt       || Date.now(),
  };
}

function mapCoupon(c) {
  return {
    id:          c.id,
    code:        c.code,
    type:        c.type,
    value:       Number(c.value)    || 0,
    min_spend:   Number(c.minSpend) || 0,
    description: c.description     || null,
    status:      c.status          || 'published',
    created_at:  c.createdAt       || Date.now(),
    updated_at:  c.updatedAt       || Date.now(),
  };
}

function mapNotification(n) {
  return {
    id:         n.id,
    title:      n.title,
    content:    n.content  || null,
    message:    n.message  || null,
    type:       n.type     || 'promotional',
    status:     n.status   || 'published',
    sent_time:  n.sentTime || Date.now(),
    created_at: n.createdAt || Date.now(),
    updated_at: n.updatedAt || Date.now(),
  };
}

function mapUserAddress(a) {
  return {
    id:                    a.id,
    user_id:               a.userId,
    full_name:             a.fullName             || '',
    mobile_number:         a.mobileNumber         || '',
    house:                 a.house                || '',
    street:                a.street               || '',
    landmark:              a.landmark             || null,
    state:                 a.state                || '',
    district:              a.district             || '',
    city:                  a.city                 || null,
    pincode:               a.pincode              || '',
    delivery_instructions: a.deliveryInstructions || null,
    address_text:          a.addressText          || null,
    created_at:            a.createdAt            || Date.now(),
    updated_at:            a.updatedAt            || Date.now(),
  };
}

// ── Upsert batch ──────────────────────────────────────────────────────────────
async function upsert(table, rows, conflictCol = 'id') {
  if (!rows || rows.length === 0) {
    console.log(`  ⚪  ${table}: nothing to migrate`);
    return 0;
  }
  // Chunk to avoid hitting Supabase's 1 MB request limit
  const CHUNK = 200;
  let total = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict: conflictCol });
    if (error) {
      console.error(`  ❌  ${table} chunk ${Math.floor(i/CHUNK)+1}: ${error.message}`);
    } else {
      total += chunk.length;
    }
  }
  console.log(`  ✅  ${table}: ${total}/${rows.length} rows upserted`);
  return total;
}

// ── Wishlist migration: users[].wishlist[] → wishlists table ──────────────────
async function migrateWishlists(users) {
  const rows = [];
  for (const u of users) {
    if (!Array.isArray(u.wishlist) || u.wishlist.length === 0) continue;
    for (const productId of u.wishlist) {
      if (!productId) continue;
      const id = `wl_${u.id}_${productId}`.slice(0, 80);
      rows.push({
        id,
        user_id:    u.id,
        product_id: productId,
        created_at: u.createdAt || Date.now(),
      });
    }
  }
  return upsert('wishlists', rows, 'user_id,product_id');
}

// ── Order-items migration: orders[].items[] → order_items table ───────────────
async function migrateOrderItems(orders) {
  const rows = [];
  for (const o of orders) {
    if (!Array.isArray(o.items) || o.items.length === 0) continue;
    o.items.forEach((item, idx) => {
      if (!item.productId && !item.product_id) return;
      rows.push({
        id:            `oi_${o.id}_${idx + 1}`,
        order_id:      o.id,
        product_id:    item.productId  || item.product_id,
        product_name:  item.productName || item.name || '',
        product_image: item.productImage || item.image || null,
        variant_info:  item.variantInfo || item.variant_info || null,
        unit:          item.unit        || null,
        quantity:      Number(item.quantity) || 1,
        unit_price:    Number(item.unitPrice  || item.price)   || 0,
        mrp:           Number(item.mrp)       || 0,
        subtotal:      Number(item.total || item.subtotal) || 0,
        created_at:    o.createdAt     || Date.now(),
        updated_at:    o.updatedAt     || Date.now(),
      });
    });
  }
  return upsert('order_items', rows);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function migrate() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║       UshaMart → Supabase Data Migration  (v2)          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log('  Target:', process.env.SUPABASE_URL, '\n');

  let total = 0;

  // Core catalog (no FK dependencies)
  const users      = readLocal('users');
  const categories = readLocal('categories');
  const products   = readLocal('products');
  const pincodes   = readLocal('pincodes');

  total += await upsert('users',       users.map(mapUser));
  total += await upsert('categories',  categories.map(mapCategory));
  total += await upsert('products',    products.map(mapProduct));
  total += await upsert('pincodes',    pincodes.map(mapPincode));

  // User-owned content (depends on users)
  const addresses = readLocal('user_addresses');
  total += await upsert('user_addresses', addresses.map(mapUserAddress));

  // Orders (depends on users + user_addresses)
  const orders = readLocal('orders');
  // Strip address_id FK on legacy orders to avoid FK violation
  const orderRows = orders.map(o => {
    const row = mapOrder(o);
    // Only include address_id if we can verify the address exists
    const addrExists = addresses.some(a => a.id === o.addressId);
    if (!addrExists) delete row.address_id;
    return row;
  });
  total += await upsert('orders', orderRows);

  // order_items (depends on orders + products)
  total += await migrateOrderItems(orders);

  // Wishlists (depends on users + products)
  total += await migrateWishlists(users);

  // Supporting tables
  total += await upsert('banners',        readLocal('banners').map(mapBanner));
  total += await upsert('special_offers', readLocal('special_offers').map(mapOffer));
  total += await upsert('coupons',        readLocal('coupons').map(mapCoupon));
  total += await upsert('notifications',  readLocal('notifications').map(mapNotification));

  // ── Row count verification ──────────────────────────────────────────────────
  console.log('\n── Row count verification ───────────────────────────────────');
  const tables = [
    'users','categories','products','pincodes','user_addresses',
    'orders','order_items','wishlists','banners','special_offers',
    'coupons','notifications',
  ];
  for (const t of tables) {
    const { count, error } = await supabase
      .from(t)
      .select('*', { count: 'exact', head: true });
    if (error) console.log(`  ⚠  ${t}: ${error.message}`);
    else       console.log(`  ${t}: ${count} rows`);
  }

  console.log(`\n✅  Migration complete — ${total} rows written to Supabase.\n`);
}

migrate().catch(err => {
  console.error('\n❌  Migration failed:', err.message);
  process.exit(1);
});
