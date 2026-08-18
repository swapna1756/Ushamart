/**
 * db.js — Unified database adapter for UshaMart.
 *
 * Uses Supabase when configured (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 * Falls back to local JSON files only when USE_LOCAL_DB=true is explicitly set.
 *
 * All controllers call db.* — they never touch Supabase or the filesystem directly.
 *
 * Column naming:
 *   Supabase schema uses snake_case (user_id, full_name, etc.)
 *   Application code uses camelCase (userId, fullName, etc.)
 *   This adapter translates in both directions via SNAKE / CAMEL maps.
 */
const fs   = require('fs');
const path = require('path');
const { supabase, isConfigured: supabaseReady, configurationError } = require('./supabase');

const allowLocalFallback = String(process.env.USE_LOCAL_DB || '').toLowerCase() === 'true';

// ── Tables that do NOT have a created_at column ────────────────────────────
// These use updated_at for ordering, or have no timestamp ordering.
const TABLES_WITHOUT_CREATED_AT = new Set([
  // All our tables now have created_at — this set is a safety guard only
]);

// ── Tables with no timestamp at all (no ordering applied) ─────────────────
const TABLES_NO_ORDER = new Set([]);

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

// ── Complete snake_case ↔ camelCase mapping ───────────────────────────────────
const SNAKE = {
  // ── common timestamps ─────────────────────────────────────────────────────
  createdAt:              'created_at',
  updatedAt:              'updated_at',
  // ── categories ────────────────────────────────────────────────────────────
  emojiIcon:              'emoji_icon',
  displayOrder:           'display_order',
  // ── products ──────────────────────────────────────────────────────────────
  variantList:            'variant_list',
  discountPercent:        'discount_percent',
  lowStockAlert:          'low_stock_alert',
  availabilityStatus:     'availability_status',
  pincodesAvailable:      'pincodes_available',
  bestSeller:             'best_seller',
  newArrival:             'new_arrival',
  todayOffer:             'today_offer',
  expiryDate:             'expiry_date',
  deliveryTime:           'delivery_time',
  // ── banners / special_offers ──────────────────────────────────────────────
  badgeText:              'badge_text',
  buttonText:             'button_text',
  buttonDest:             'button_dest',
  bgGradient:             'bg_gradient',
  bgColor:                'bg_color',
  imageUrl:               'image_url',
  // ── special_offers ────────────────────────────────────────────────────────
  offerType:              'offer_type',
  linkedCatId:            'linked_cat_id',
  linkedProdId:           'linked_prod_id',
  multiProdIds:           'multi_prod_ids',
  startDate:              'start_date',
  endDate:                'end_date',
  // ── orders ────────────────────────────────────────────────────────────────
  orderNumber:            'order_number',
  userId:                 'user_id',
  userName:               'user_name',
  userPhone:              'user_phone',
  userEmail:              'user_email',
  addressText:            'address_text',
  deliveryCharges:        'delivery_charges',
  discountAmount:         'discount_amount',
  totalAmount:            'total_amount',
  couponCode:             'coupon_code',
  paymentMethod:          'payment_method',
  paymentStatus:          'payment_status',
  orderStatus:            'order_status',
  deliverySlot:           'delivery_slot',
  statusHistory:          'status_history',
  idempotencyKey:         'idempotency_key',
  customerName:           'customer_name',
  customerPhone:          'customer_phone',
  addressId:              'address_id',
  // ── order_items ───────────────────────────────────────────────────────────
  orderId:                'order_id',
  productId:              'product_id',
  productName:            'product_name',
  productImage:           'product_image',
  variantInfo:            'variant_info',
  unitPrice:              'unit_price',
  finalAmount:            'final_amount',
  // ── user_addresses ────────────────────────────────────────────────────────
  fullName:               'full_name',
  mobileNumber:           'mobile_number',
  deliveryInstructions:   'delivery_instructions',
  // ── users ─────────────────────────────────────────────────────────────────
  firebaseUid:            'firebase_uid',
  registeredAt:           'registered_at',
  lastLogin:              'last_login',
  totalOrders:            'total_orders',
  totalSpent:             'total_spent',
  profilePic:             'profile_pic',
  addressLine:            'address_line',
  // ── pincodes ──────────────────────────────────────────────────────────────
  areaName:               'area_name',
  // ── notifications ─────────────────────────────────────────────────────────
  sentTime:               'sent_time',
  expiresAt:              'expires_at',
  scheduledAt:            'scheduled_at',
  targetAudience:         'target_audience',
  // ── coupons ───────────────────────────────────────────────────────────────
  minSpend:               'min_spend',
  // ── wishlists / cart_items ────────────────────────────────────────────────
  cartKey:                'cart_key',
  // ── sessions ──────────────────────────────────────────────────────────────
  tokenHash:              'token_hash',
};

const CAMEL = Object.fromEntries(Object.entries(SNAKE).map(([k, v]) => [v, k]));

function toSnake(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    result[SNAKE[k] || k] = v;
  }
  return result;
}

function toCamel(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    result[CAMEL[k] || k] = v;
  }
  return result;
}

function rowsToCamel(rows) {
  return (rows || []).map(toCamel);
}

// ── Supabase operations ───────────────────────────────────────────────────────

/**
 * Returns all rows from a table, ordered by created_at asc when available.
 * Falls back to updated_at, then no ordering for tables without timestamps.
 */
async function sbGetAll(table) {
  let query = supabase.from(table).select('*');

  if (!TABLES_NO_ORDER.has(table)) {
    if (TABLES_WITHOUT_CREATED_AT.has(table)) {
      query = query.order('updated_at', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: true });
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(`[SB getAll:${table}] ${error.message}`);
  return rowsToCamel(data || []);
}

async function sbGetById(table, id) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`[SB getById:${table}] ${error.message}`);
  return data ? toCamel(data) : null;
}

async function sbInsert(table, doc) {
  const now = Date.now();
  const row = toSnake({
    ...doc,
    createdAt: doc.createdAt || now,
    updatedAt: now,
  });
  const { data, error } = await supabase
    .from(table)
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(`[SB insert:${table}] ${error.message}`);
  return toCamel(data);
}

async function sbInsertMany(table, docs) {
  const now = Date.now();
  const rows = docs.map(doc => toSnake({
    ...doc,
    createdAt: doc.createdAt || now,
    updatedAt: now,
  }));
  const { data, error } = await supabase
    .from(table)
    .insert(rows)
    .select();
  if (error) throw new Error(`[SB insertMany:${table}] ${error.message}`);
  return rowsToCamel(data || []);
}

async function sbUpdate(table, id, fields) {
  const row = toSnake({ ...fields, updatedAt: Date.now() });
  const { data, error } = await supabase
    .from(table)
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`[SB update:${table}] ${error.message}`);
  return toCamel(data);
}

async function sbUpsert(table, id, doc) {
  const now = Date.now();
  const row = toSnake({ ...doc, id, updatedAt: now });
  if (!row.created_at) row.created_at = now;
  const { data, error } = await supabase
    .from(table)
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(`[SB upsert:${table}] ${error.message}`);
  return toCamel(data);
}

async function sbDelete(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw new Error(`[SB delete:${table}] ${error.message}`);
  return true;
}

// ── Error helpers ─────────────────────────────────────────────────────────────
function localOrThrow(error) {
  if (!allowLocalFallback) throw error;
  console.warn(`[db local mode] ${error.message}`);
}

function ensureLocalMode() {
  if (!allowLocalFallback) {
    throw new Error(
      configurationError ||
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars. ' +
      'Set USE_LOCAL_DB=true only for local development without a Supabase project.'
    );
  }
}

// ── Unified db API ────────────────────────────────────────────────────────────
const db = {

  async getAll(collection) {
    if (supabaseReady) {
      try { return await sbGetAll(collection); }
      catch (err) { localOrThrow(err); }
    }
    ensureLocalMode();
    return readLocal(collection);
  },

  async getById(collection, id) {
    if (supabaseReady) {
      try { return await sbGetById(collection, id); }
      catch (err) { localOrThrow(err); }
    }
    ensureLocalMode();
    return readLocal(collection).find(d => d.id === id) || null;
  },

  async find(collection, predicate) {
    if (supabaseReady) {
      try {
        const rows = await sbGetAll(collection);
        return rows.filter(predicate);
      } catch (err) { localOrThrow(err); }
    }
    ensureLocalMode();
    return readLocal(collection).filter(predicate);
  },

  async insert(collection, doc) {
    if (supabaseReady) {
      try { return await sbInsert(collection, doc); }
      catch (err) { localOrThrow(err); }
    }
    ensureLocalMode();
    const docs  = readLocal(collection);
    const now   = Date.now();
    const entry = { ...doc, createdAt: doc.createdAt || now, updatedAt: now };
    docs.push(entry);
    writeLocal(collection, docs);
    return entry;
  },

  async update(collection, id, fields) {
    if (supabaseReady) {
      try { return await sbUpdate(collection, id, fields); }
      catch (err) { localOrThrow(err); }
    }
    ensureLocalMode();
    const docs = readLocal(collection);
    const idx  = docs.findIndex(d => d.id === id);
    if (idx === -1) return null;
    docs[idx] = { ...docs[idx], ...fields, updatedAt: Date.now() };
    writeLocal(collection, docs);
    return docs[idx];
  },

  async upsert(collection, id, doc) {
    if (supabaseReady) {
      try { return await sbUpsert(collection, id, doc); }
      catch (err) { localOrThrow(err); }
    }
    ensureLocalMode();
    const docs  = readLocal(collection);
    const idx   = docs.findIndex(d => d.id === id);
    const now   = Date.now();
    const entry = { ...doc, id, updatedAt: now };
    if (idx === -1) {
      entry.createdAt = entry.createdAt || now;
      docs.push(entry);
    } else {
      entry.createdAt = docs[idx].createdAt;
      docs[idx] = entry;
    }
    writeLocal(collection, docs);
    return entry;
  },

  async delete(collection, id) {
    if (supabaseReady) {
      try { return await sbDelete(collection, id); }
      catch (err) { localOrThrow(err); }
    }
    ensureLocalMode();
    const docs     = readLocal(collection);
    const filtered = docs.filter(d => d.id !== id);
    if (filtered.length === docs.length) return false;
    writeLocal(collection, filtered);
    return true;
  },

  async count(collection, predicate) {
    if (supabaseReady) {
      const { count, error } = await supabase
        .from(collection)
        .select('*', { count: 'exact', head: true });
      if (error) throw new Error(error.message);
      return count || 0;
    }
    ensureLocalMode();
    const docs = readLocal(collection);
    return predicate ? docs.filter(predicate).length : docs.length;
  },

  async insertMany(collection, docs) {
    if (!Array.isArray(docs) || docs.length === 0) return [];
    if (supabaseReady) return sbInsertMany(collection, docs);
    if (!allowLocalFallback) throw new Error('Supabase is not configured. Cannot persist data locally in production.');
    const existing = readLocal(collection);
    const now      = Date.now();
    const entries  = docs.map(doc => ({ ...doc, createdAt: doc.createdAt || now, updatedAt: now }));
    writeLocal(collection, [...existing, ...entries]);
    return entries;
  },

  /**
   * replaceAll — wipes the collection and inserts all new docs.
   * Used only by seed.js. Never call from request handlers.
   */
  async replaceAll(collection, docs) {
    if (supabaseReady) {
      // Delete all rows then insert the new batch
      const { error: delErr } = await supabase
        .from(collection)
        .delete()
        .neq('id', '___never___'); // match all rows
      if (delErr) throw new Error(`[SB replaceAll delete:${collection}] ${delErr.message}`);
      if (docs.length > 0) {
        const now  = Date.now();
        const rows = docs.map(d => toSnake({ ...d, updatedAt: d.updatedAt || now, createdAt: d.createdAt || now }));
        const { error: insErr } = await supabase.from(collection).insert(rows);
        if (insErr) throw new Error(`[SB replaceAll insert:${collection}] ${insErr.message}`);
      }
      return;
    }
    // Local fallback (seed / dev only)
    if (!allowLocalFallback) throw new Error('Supabase is not configured. Cannot use replaceAll locally in production.');
    writeLocal(collection, docs);
  },

  // ── Wishlist helpers ─────────────────────────────────────────────────────────
  async getWishlistIds(userId) {
    if (supabaseReady) {
      const { data, error } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', userId);
      if (error) throw new Error(`[SB wishlists.get] ${error.message}`);
      return (data || []).map(r => r.product_id);
    }
    ensureLocalMode();
    const users = readLocal('users');
    const u = users.find(u => u.id === userId);
    return Array.isArray(u?.wishlist) ? u.wishlist : [];
  },

  async addToWishlist(userId, productId) {
    if (supabaseReady) {
      const id = `wl_${userId}_${productId}`.slice(0, 80);
      const { error } = await supabase
        .from('wishlists')
        .upsert(
          { id, user_id: userId, product_id: productId, created_at: Date.now() },
          { onConflict: 'user_id,product_id' }
        );
      if (error) throw new Error(`[SB wishlists.add] ${error.message}`);
      return;
    }
    ensureLocalMode();
    const users = readLocal('users');
    const idx   = users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    const current = Array.isArray(users[idx].wishlist) ? users[idx].wishlist : [];
    if (!current.includes(productId)) {
      users[idx].wishlist = [...current, productId];
      writeLocal('users', users);
    }
  },

  async removeFromWishlist(userId, productId) {
    if (supabaseReady) {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);
      if (error) throw new Error(`[SB wishlists.remove] ${error.message}`);
      return;
    }
    ensureLocalMode();
    const users = readLocal('users');
    const idx   = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      const current = Array.isArray(users[idx].wishlist) ? users[idx].wishlist : [];
      users[idx].wishlist = current.filter(id => id !== productId);
      writeLocal('users', users);
    }
  },

  async clearWishlist(userId) {
    if (supabaseReady) {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId);
      if (error) throw new Error(`[SB wishlists.clear] ${error.message}`);
      return;
    }
    ensureLocalMode();
    const users = readLocal('users');
    const idx   = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].wishlist = [];
      writeLocal('users', users);
    }
  },

  // ── Cart helpers ─────────────────────────────────────────────────────────────
  async getCart(userId) {
    if (supabaseReady) {
      const { data, error } = await supabase
        .from('cart_items')
        .select('cart_key, quantity')
        .eq('user_id', userId);
      if (error) throw new Error(`[SB cart.get] ${error.message}`);
      const map = {};
      for (const row of (data || [])) map[row.cart_key] = row.quantity;
      return map;
    }
    ensureLocalMode();
    return {};
  },

  async setCartItem(userId, cartKey, productId, variant, quantity) {
    if (supabaseReady) {
      if (quantity <= 0) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', userId)
          .eq('cart_key', cartKey);
        if (error) throw new Error(`[SB cart.delete] ${error.message}`);
        return;
      }
      const now = Date.now();
      const id  = `ci_${userId}_${cartKey}`.slice(0, 120);
      const { error } = await supabase
        .from('cart_items')
        .upsert(
          {
            id,
            user_id:    userId,
            cart_key:   cartKey,
            product_id: productId,
            variant:    variant || null,
            quantity,
            updated_at: now,
            created_at: now,
          },
          { onConflict: 'user_id,cart_key' }
        );
      if (error) throw new Error(`[SB cart.set] ${error.message}`);
      return;
    }
    ensureLocalMode();
  },

  async clearCart(userId) {
    if (supabaseReady) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);
      if (error) throw new Error(`[SB cart.clear] ${error.message}`);
      return;
    }
    ensureLocalMode();
  },

  /**
   * syncCart — replaces the entire server cart with the provided map.
   * cartMap: { [cartKey]: quantity }
   */
  async syncCart(userId, cartMap) {
    if (!supabaseReady) return; // guest mode — no-op

    // Delete existing cart, then insert fresh
    await supabase.from('cart_items').delete().eq('user_id', userId);

    const rows = Object.entries(cartMap)
      .filter(([, qty]) => qty > 0)
      .map(([cartKey, quantity]) => {
        const [productId, variant = ''] = cartKey.split('::');
        const now = Date.now();
        return {
          id:         `ci_${userId}_${cartKey}`.slice(0, 120),
          user_id:    userId,
          cart_key:   cartKey,
          product_id: productId,
          variant:    variant || null,
          quantity,
          updated_at: now,
          created_at: now,
        };
      });

    if (rows.length > 0) {
      const { error } = await supabase.from('cart_items').insert(rows);
      if (error) throw new Error(`[SB cart.sync] ${error.message}`);
    }
  },
};

module.exports = db;
