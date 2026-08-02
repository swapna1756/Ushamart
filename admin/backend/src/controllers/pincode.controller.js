const db = require('../database/db');

async function getPincodes(req, res) {
  try {
    const pincodes = (await db.getAll('pincodes')).filter(p => p.enabled !== false);
    res.json({ success: true, data: pincodes });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getAllPincodes(req, res) {
  try {
    const pincodes = (await db.getAll('pincodes')).sort((a,b) => (a.createdAt||0)-(b.createdAt||0));
    res.json({ success: true, data: pincodes });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function createPincode(req, res) {
  try {
    const { code, areaName, city, state, charges, deliveryTime, enabled } = req.body;
    if (!code || !/^\d{6}$/.test(String(code).trim()))
      return res.status(400).json({ success: false, message: 'A valid 6-digit pincode is required.' });
    const cleanCode = String(code).trim();
    const existing = await db.getById('pincodes', cleanCode);
    if (existing) return res.status(409).json({ success: false, message: `Pincode ${cleanCode} already exists.` });
    const now = Date.now();
    const pincode = {
      id: cleanCode, code: cleanCode,
      areaName: (areaName||'').trim(), city: (city||'').trim(), state: (state||'').trim(),
      charges: Number(charges)||0, deliveryTime: (deliveryTime||'1-2 Days').trim(),
      enabled: enabled !== false, createdAt: now, updatedAt: now,
    };
    await db.insert('pincodes', pincode);
    return res.status(201).json({ success: true, data: pincode, message: `Pincode ${cleanCode} added successfully.` });
  } catch (err) { console.error('[createPincode]', err); return res.status(500).json({ success: false, message: err.message }); }
}

async function updatePincode(req, res) {
  try {
    const code = String(req.params.code).trim();
    const pin  = await db.getById('pincodes', code);
    if (!pin) return res.status(404).json({ success: false, message: `Pincode ${code} not found.` });
    const fields = {};
    if (req.body.areaName     !== undefined) fields.areaName     = String(req.body.areaName).trim();
    if (req.body.city         !== undefined) fields.city         = String(req.body.city).trim();
    if (req.body.state        !== undefined) fields.state        = String(req.body.state).trim();
    if (req.body.charges      !== undefined) fields.charges      = Number(req.body.charges)||0;
    if (req.body.deliveryTime !== undefined) fields.deliveryTime = String(req.body.deliveryTime).trim();
    if (req.body.enabled      !== undefined) fields.enabled      = Boolean(req.body.enabled);
    const updated = await db.update('pincodes', code, fields);
    if (!updated) return res.status(500).json({ success: false, message: 'Failed to update pincode.' });
    return res.json({ success: true, data: updated, message: `Pincode ${code} updated successfully.` });
  } catch (err) { console.error('[updatePincode]', err); return res.status(500).json({ success: false, message: err.message }); }
}

async function deletePincode(req, res) {
  try {
    const code = String(req.params.code).trim();
    const pin  = await db.getById('pincodes', code);
    if (!pin) return res.status(404).json({ success: false, message: `Pincode ${code} not found.` });
    const deleted = await db.delete('pincodes', code);
    if (!deleted) return res.status(500).json({ success: false, message: 'Failed to delete pincode.' });
    return res.json({ success: true, message: `Pincode ${code} permanently deleted.` });
  } catch (err) { console.error('[deletePincode]', err); return res.status(500).json({ success: false, message: err.message }); }
}

async function checkPincode(req, res) {
  try {
    const code = String(req.body.code||'').trim();
    if (!code) return res.status(400).json({ success: false, message: 'Pincode is required.' });
    const all = await db.getAll('pincodes');
    const pin = all.find(p => p.code === code && p.enabled !== false);
    if (!pin) {
      const available = all.filter(p => p.enabled !== false).map(p => p.code).sort();
      return res.json({ success: false, serviceable: false, availablePincodes: available, message: `Sorry, we don't deliver to ${code} yet.` });
    }
    return res.json({ success: true, serviceable: true, data: pin });
  } catch (err) { console.error('[checkPincode]', err); return res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { getPincodes, getAllPincodes, createPincode, updatePincode, deletePincode, checkPincode };
