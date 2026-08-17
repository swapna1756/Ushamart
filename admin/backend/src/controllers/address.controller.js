const db = require('../database/db');
const { hasServiceRole } = require('../database/supabase');

const PHONE_RE = /^[6-9]\d{9}$/;
const PIN_RE = /^\d{6}$/;

function logAddressError(action, error) {
  console.error(`[address:${action}]`, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    stack: error?.stack,
  });
}

function normalizeAddress(body = {}, userId) {
  return {
    userId,
    fullName: String(body.fullName || body.name || '').trim(),
    mobileNumber: String(body.mobileNumber || body.phone || '').replace(/\D/g, '').slice(-10),
    house: String(body.house || '').trim(),
    street: String(body.street || '').trim(),
    landmark: String(body.landmark || '').trim(),
    state: String(body.state || '').trim(),
    district: String(body.district || body.city || '').trim(),
    city: String(body.city || body.district || '').trim(),
    pincode: String(body.pincode || '').trim(),
    deliveryInstructions: String(body.deliveryInstructions || '').trim(),
  };
}

async function validateAddressPayload(payload) {
  const missing = [];
  ['fullName', 'mobileNumber', 'house', 'street', 'state', 'district', 'pincode'].forEach(k => {
    if (!payload[k]) missing.push(k);
  });
  if (missing.length) return `Please complete ${missing.join(', ')}.`;
  if (!PHONE_RE.test(payload.mobileNumber)) return 'Please enter a valid 10-digit mobile number.';
  if (!PIN_RE.test(payload.pincode)) return 'Please enter a valid 6-digit pincode.';

  const pins = await db.getAll('pincodes');
  const pin = pins.find(p => String(p.code || p.id) === payload.pincode && p.enabled !== false);
  if (!pin) return 'Delivery is currently unavailable at this pincode.';
  return '';
}

function addressText(a) {
  return [a.house, a.street, a.landmark, a.district || a.city, a.state, a.pincode].filter(Boolean).join(', ');
}

async function getAddresses(req, res) {
  try {
    const rows = (await db.getAll('user_addresses'))
      .filter(a => a.userId === req.user.id)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    res.json({ success: true, data: rows });
  } catch (err) {
    logAddressError('get', err);
    res.status(500).json({ success: false, message: 'Unable to load addresses.' });
  }
}

async function createAddress(req, res) {
  try {
    if (!hasServiceRole) {
      return res.status(503).json({ success: false, message: 'Address saving is temporarily unavailable. Please try again later.' });
    }
    const payload = normalizeAddress(req.body, req.user.id);
    const msg = await validateAddressPayload(payload);
    if (msg) return res.status(400).json({ success: false, message: msg });
    const now = Date.now();
    const doc = { id: 'addr_' + now.toString(36), ...payload, addressText: addressText(payload), createdAt: now, updatedAt: now };
    const saved = await db.insert('user_addresses', doc);
    if (!saved?.id) throw new Error('Address insert did not return an address ID.');
    res.status(201).json({ success: true, data: saved, message: 'Address saved.' });
  } catch (err) {
    logAddressError('create', err);
    res.status(500).json({ success: false, message: 'Unable to save address. Please try again.' });
  }
}

async function updateAddress(req, res) {
  try {
    if (!hasServiceRole) {
      return res.status(503).json({ success: false, message: 'Address saving is temporarily unavailable. Please try again later.' });
    }
    const existing = await db.getById('user_addresses', req.params.id);
    if (!existing || existing.userId !== req.user.id) return res.status(404).json({ success: false, message: 'Address not found.' });
    const payload = normalizeAddress({ ...existing, ...req.body }, req.user.id);
    const msg = await validateAddressPayload(payload);
    if (msg) return res.status(400).json({ success: false, message: msg });
    const updated = await db.update('user_addresses', req.params.id, { ...payload, addressText: addressText(payload) });
    res.json({ success: true, data: updated, message: 'Address updated.' });
  } catch (err) {
    logAddressError('update', err);
    res.status(500).json({ success: false, message: 'Unable to update address.' });
  }
}

async function deleteAddress(req, res) {
  try {
    if (!hasServiceRole) {
      return res.status(503).json({ success: false, message: 'Address saving is temporarily unavailable. Please try again later.' });
    }
    const existing = await db.getById('user_addresses', req.params.id);
    if (!existing || existing.userId !== req.user.id) return res.status(404).json({ success: false, message: 'Address not found.' });
    await db.delete('user_addresses', req.params.id);
    res.json({ success: true, message: 'Address deleted.' });
  } catch (err) {
    logAddressError('delete', err);
    res.status(500).json({ success: false, message: 'Unable to delete address.' });
  }
}

module.exports = { getAddresses, createAddress, updateAddress, deleteAddress, validateAddressPayload, normalizeAddress, addressText };
