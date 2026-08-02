const db = require('../database/db');

async function getCoupons(req, res) {
  try {
    const coupons = (await db.getAll('coupons')).filter(c => c.status === 'published');
    res.json({ success: true, data: coupons });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getAllCoupons(req, res) {
  try {
    res.json({ success: true, data: await db.getAll('coupons') });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function validateCoupon(req, res) {
  try {
    const { code, orderTotal } = req.body;
    const coupons = await db.getAll('coupons');
    const coupon = coupons.find(c => c.code === code?.toUpperCase() && c.status === 'published');
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or expired coupon.' });
    if (orderTotal < coupon.minSpend)
      return res.status(400).json({ success: false, message: `Minimum spend of ₹${coupon.minSpend} required.` });
    res.json({ success: true, data: coupon });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function createCoupon(req, res) {
  try {
    const id = 'cpn_' + Date.now().toString(36);
    const code = (req.body.code||'').toUpperCase();
    const all = await db.getAll('coupons');
    if (all.find(c => c.code === code)) return res.status(409).json({ success: false, message: 'Coupon code already exists.' });
    const coupon = {
      id, code, type: req.body.type||'percentage', value: Number(req.body.value)||0,
      minSpend: Number(req.body.minSpend)||0, description: req.body.description||'',
      status: req.body.status||'published', createdAt: Date.now(), updatedAt: Date.now(),
    };
    await db.insert('coupons', coupon);
    res.status(201).json({ success: true, data: coupon, message: 'Coupon created.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function updateCoupon(req, res) {
  try {
    const existing = await db.getById('coupons', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    const updated = await db.update('coupons', req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function deleteCoupon(req, res) {
  try {
    const deleted = await db.delete('coupons', req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { getCoupons, getAllCoupons, validateCoupon, createCoupon, updateCoupon, deleteCoupon };
