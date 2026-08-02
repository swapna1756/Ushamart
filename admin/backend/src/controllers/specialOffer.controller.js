const db = require('../database/db');

async function getSpecialOffers(req, res) {
  try {
    const now = Date.now();
    const offers = (await db.getAll('special_offers')).filter(o => {
      if (o.status !== 'active' && o.active !== true) return false;
      if (o.endDate   && new Date(o.endDate).getTime()   < now) return false;
      if (o.startDate && new Date(o.startDate).getTime() > now) return false;
      return true;
    }).sort((a,b)=>(a.displayOrder||999)-(b.displayOrder||999));
    res.json({ success: true, data: offers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getAllSpecialOffers(req, res) {
  try {
    const offers = (await db.getAll('special_offers')).sort((a,b)=>(a.displayOrder||999)-(b.displayOrder||999));
    res.json({ success: true, data: offers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function createSpecialOffer(req, res) {
  try {
    const id = 'offer_' + Date.now().toString(36);
    const offer = {
      id, title: req.body.title||'', subtitle: req.body.subtitle||'',
      badgeText: req.body.badgeText||'', buttonText: req.body.buttonText||'SHOP NOW →',
      imageUrl: req.body.imageUrl||'', bgColor: req.body.bgColor||'#ede9fe',
      offerType: req.body.offerType||'general', linkedCatId: req.body.linkedCatId||'',
      linkedProdId: req.body.linkedProdId||'', multiProdIds: req.body.multiProdIds||[],
      startDate: req.body.startDate||'', endDate: req.body.endDate||'',
      status: req.body.status||'active', active: req.body.status === 'active',
      displayOrder: Number(req.body.displayOrder)||0,
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    await db.insert('special_offers', offer);
    res.status(201).json({ success: true, data: offer, message: 'Special offer created.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function updateSpecialOffer(req, res) {
  try {
    const existing = await db.getById('special_offers', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Special offer not found.' });
    const updated = await db.update('special_offers', req.params.id, {
      ...req.body, active: req.body.status === 'active',
    });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function deleteSpecialOffer(req, res) {
  try {
    const deleted = await db.delete('special_offers', req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Special offer not found.' });
    res.json({ success: true, message: 'Special offer deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { getSpecialOffers, getAllSpecialOffers, createSpecialOffer, updateSpecialOffer, deleteSpecialOffer };
