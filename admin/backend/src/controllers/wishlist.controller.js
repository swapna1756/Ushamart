/**
 * Wishlist controller — persists wishlist per user in the database.
 * Stored as a field on the user record: user.wishlist = ['prod_1','prod_2',...]
 */
const db = require('../database/db');

// GET /api/wishlist — get current user's wishlist product IDs
async function getWishlist(req, res) {
  try {
    const user = await db.getById('users', req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user.wishlist || [] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

// POST /api/wishlist/:productId — add to wishlist
async function addToWishlist(req, res) {
  try {
    const user = await db.getById('users', req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const productId = req.params.productId;
    const product   = await db.getById('products', productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const current = Array.isArray(user.wishlist) ? user.wishlist : [];
    if (current.includes(productId)) {
      return res.json({ success: true, data: current, message: 'Already in wishlist.' });
    }

    const updated = [...current, productId];
    await db.update('users', req.user.id, { wishlist: updated });
    res.json({ success: true, data: updated, message: 'Added to wishlist.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

// DELETE /api/wishlist/:productId — remove from wishlist
async function removeFromWishlist(req, res) {
  try {
    const user = await db.getById('users', req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const current = Array.isArray(user.wishlist) ? user.wishlist : [];
    const updated = current.filter(id => id !== req.params.productId);
    await db.update('users', req.user.id, { wishlist: updated });
    res.json({ success: true, data: updated, message: 'Removed from wishlist.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

// DELETE /api/wishlist — clear entire wishlist
async function clearWishlist(req, res) {
  try {
    const user = await db.getById('users', req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    await db.update('users', req.user.id, { wishlist: [] });
    res.json({ success: true, data: [], message: 'Wishlist cleared.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { getWishlist, addToWishlist, removeFromWishlist, clearWishlist };
