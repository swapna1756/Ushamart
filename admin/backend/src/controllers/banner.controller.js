const db = require('../database/db');

async function getBanners(req, res) {
  try {
    const banners = (await db.getAll('banners'))
      .filter(b => b.active !== false)
      .sort((a,b) => (a.displayOrder||0)-(b.displayOrder||0));
    res.json({ success: true, data: banners });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getAllBanners(req, res) {
  try {
    const banners = (await db.getAll('banners')).sort((a,b)=>(a.displayOrder||0)-(b.displayOrder||0));
    res.json({ success: true, data: banners });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function createBanner(req, res) {
  try {
    const id = 'ban_' + Date.now().toString(36);
    const banner = {
      id, title: req.body.title||'', subtitle: req.body.subtitle||'',
      badgeText: req.body.badgeText||'', buttonText: req.body.buttonText||'Shop Now',
      buttonDest: req.body.buttonDest||'', bgGradient: req.body.bgGradient||'',
      bgColor: req.body.bgColor||'#dcfce7', imageUrl: req.body.imageUrl||'',
      active: req.body.active !== false, displayOrder: Number(req.body.displayOrder)||0,
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    await db.insert('banners', banner);
    res.status(201).json({ success: true, data: banner, message: 'Banner created.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function updateBanner(req, res) {
  try {
    const existing = await db.getById('banners', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Banner not found.' });
    const updated = await db.update('banners', req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function deleteBanner(req, res) {
  try {
    const deleted = await db.delete('banners', req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Banner not found.' });
    res.json({ success: true, message: 'Banner deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { getBanners, getAllBanners, createBanner, updateBanner, deleteBanner };
