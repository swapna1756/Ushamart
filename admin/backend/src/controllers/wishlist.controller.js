/**
 * wishlist.controller.js
 *
 * Persists wishlists in the dedicated `wishlists` table (one row per
 * user × product).  Falls back to the users.wishlist JSON column when
 * Supabase is in local-file mode so development still works.
 *
 * Routes (all require authenticate middleware):
 *   GET    /api/wishlist
 *   POST   /api/wishlist/:productId
 *   DELETE /api/wishlist/:productId
 *   DELETE /api/wishlist          (clear all)
 */
const db = require('../database/db');

// GET /api/wishlist
async function getWishlist(req, res) {
  try {
    const ids = await db.getWishlistIds(req.user.id);
    res.json({ success: true, data: ids });
  } catch (err) {
    console.error('[wishlist:get]', err.message);
    res.status(500).json({ success: false, message: 'Unable to load wishlist.' });
  }
}

// POST /api/wishlist/:productId
async function addToWishlist(req, res) {
  try {
    const productId = req.params.productId;
    const product   = await db.getById('products', productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    await db.addToWishlist(req.user.id, productId);
    const ids = await db.getWishlistIds(req.user.id);
    res.json({ success: true, data: ids, message: 'Added to wishlist.' });
  } catch (err) {
    console.error('[wishlist:add]', err.message);
    res.status(500).json({ success: false, message: 'Unable to add to wishlist.' });
  }
}

// DELETE /api/wishlist/:productId
async function removeFromWishlist(req, res) {
  try {
    await db.removeFromWishlist(req.user.id, req.params.productId);
    const ids = await db.getWishlistIds(req.user.id);
    res.json({ success: true, data: ids, message: 'Removed from wishlist.' });
  } catch (err) {
    console.error('[wishlist:remove]', err.message);
    res.status(500).json({ success: false, message: 'Unable to remove from wishlist.' });
  }
}

// DELETE /api/wishlist  (clear)
async function clearWishlist(req, res) {
  try {
    await db.clearWishlist(req.user.id);
    res.json({ success: true, data: [], message: 'Wishlist cleared.' });
  } catch (err) {
    console.error('[wishlist:clear]', err.message);
    res.status(500).json({ success: false, message: 'Unable to clear wishlist.' });
  }
}

module.exports = { getWishlist, addToWishlist, removeFromWishlist, clearWishlist };
