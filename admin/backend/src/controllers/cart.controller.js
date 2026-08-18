/**
 * cart.controller.js
 *
 * Server-side cart persistence using the `cart_items` table.
 * Each logged-in user's cart is stored as rows in Supabase.
 * The frontend still keeps a localStorage mirror for instant UI updates;
 * this API is the source of truth that survives refresh, device switches,
 * and redeployment.
 *
 * Routes (all require authenticate middleware):
 *   GET    /api/cart              — return { [cartKey]: quantity } map
 *   PUT    /api/cart              — full sync: replace server cart with body.cart
 *   PATCH  /api/cart/:cartKey     — update single item quantity (0 = remove)
 *   DELETE /api/cart              — clear entire cart
 */
const db = require('../database/db');

// ── Helpers ───────────────────────────────────────────────────────────────────
function splitCartKey(cartKey) {
  const [productId, variant = ''] = String(cartKey).split('::');
  return { productId, variant };
}

// GET /api/cart
async function getCart(req, res) {
  try {
    const cartMap = await db.getCart(req.user.id);
    res.json({ success: true, data: cartMap });
  } catch (err) {
    console.error('[cart:get]', err.message);
    res.status(500).json({ success: false, message: 'Unable to load cart.' });
  }
}

// PUT /api/cart  — full cart sync from client (body: { cart: { cartKey: qty } })
async function syncCart(req, res) {
  try {
    const incoming = req.body?.cart;
    if (typeof incoming !== 'object' || incoming === null || Array.isArray(incoming)) {
      return res.status(400).json({ success: false, message: 'cart must be an object mapping cartKey → quantity.' });
    }

    // Validate quantities and product existence (skip expensive check for empty cart)
    const entries = Object.entries(incoming).filter(([, qty]) => Number(qty) > 0);
    if (entries.length > 50) {
      return res.status(400).json({ success: false, message: 'Cart may not contain more than 50 distinct items.' });
    }

    // Validate that each product exists
    for (const [cartKey] of entries) {
      const { productId } = splitCartKey(cartKey);
      const p = await db.getById('products', productId);
      if (!p) {
        return res.status(400).json({
          success: false,
          message: `Product "${productId}" not found. Please refresh your cart.`,
        });
      }
    }

    const clean = {};
    for (const [k, qty] of entries) clean[k] = Math.max(1, Number(qty));

    await db.syncCart(req.user.id, clean);
    res.json({ success: true, data: clean, message: 'Cart synced.' });
  } catch (err) {
    console.error('[cart:sync]', err.message);
    res.status(500).json({ success: false, message: 'Unable to sync cart.' });
  }
}

// PATCH /api/cart/:cartKey  — update a single item
async function updateCartItem(req, res) {
  try {
    const cartKey = decodeURIComponent(req.params.cartKey);
    const quantity = Number(req.body.quantity);
    if (isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ success: false, message: 'quantity must be a non-negative number.' });
    }

    const { productId, variant } = splitCartKey(cartKey);

    if (quantity === 0) {
      await db.setCartItem(req.user.id, cartKey, productId, variant, 0);
    } else {
      const p = await db.getById('products', productId);
      if (!p) return res.status(404).json({ success: false, message: 'Product not found.' });
      await db.setCartItem(req.user.id, cartKey, productId, variant, quantity);
    }

    const cartMap = await db.getCart(req.user.id);
    res.json({ success: true, data: cartMap, message: 'Cart updated.' });
  } catch (err) {
    console.error('[cart:update]', err.message);
    res.status(500).json({ success: false, message: 'Unable to update cart item.' });
  }
}

// DELETE /api/cart  — clear cart
async function clearCart(req, res) {
  try {
    await db.clearCart(req.user.id);
    res.json({ success: true, data: {}, message: 'Cart cleared.' });
  } catch (err) {
    console.error('[cart:clear]', err.message);
    res.status(500).json({ success: false, message: 'Unable to clear cart.' });
  }
}

module.exports = { getCart, syncCart, updateCartItem, clearCart };
