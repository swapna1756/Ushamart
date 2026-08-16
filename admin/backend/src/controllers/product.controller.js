const db = require('../database/db');

function normalise(raw) {
  return {
    id:                 raw.id,
    name:               raw.name               || '',
    brand:              raw.brand              || '',
    description:        raw.description        || '',
    category:           raw.category           || '',
    subcategory:        raw.subcategory        || '',
    sku:                raw.sku                || '',
    barcode:            raw.barcode            || '',
    unit:               raw.unit               || '',
    variants:           raw.variants           || '',
    variantList:        Array.isArray(raw.variantList) ? raw.variantList : [],
    images:             Array.isArray(raw.images)      ? raw.images      : [],
    mrp:                Number(raw.mrp)         || 0,
    price:              Number(raw.price)       || 0,
    discountPercent:    Number(raw.discountPercent) || (raw.mrp > raw.price ? Math.round(((raw.mrp - raw.price) / raw.mrp) * 100) : 0),
    stock:              Number(raw.stock)       || 0,
    lowStockAlert:      Number(raw.lowStockAlert) || 10,
    status:             raw.status             || 'draft',
    availabilityStatus: raw.availabilityStatus || raw.status || 'draft',
    pincodesAvailable:  Array.isArray(raw.pincodesAvailable) ? raw.pincodesAvailable : [],
    featured:           Boolean(raw.featured),
    bestSeller:         Boolean(raw.bestSeller),
    newArrival:         Boolean(raw.newArrival),
    trending:           Boolean(raw.trending),
    todayOffer:         Boolean(raw.todayOffer),
    expiryDate:         raw.expiryDate         || '',
    gst:                raw.gst                || '5',
    deliveryTime:       raw.deliveryTime       || '1-2 Days',
    cod:                raw.cod !== false,
    specifications:     raw.specifications     || '',
    createdAt:          raw.createdAt          || Date.now(),
    updatedAt:          Date.now(),
  };
}

async function getProducts(req, res) {
  try {
    let products = await db.getAll('products');
    const { pincode, category, search, featured, bestSeller, newArrival, trending, todayOffer, status } = req.query;
    const isAdmin = req.user && ['super_admin','store_manager'].includes(req.user.role);

    if (!isAdmin) {
      products = products.filter(p => p.status === 'published');
    } else if (status && status !== 'all') {
      products = products.filter(p => p.status === status);
    }

    if (pincode && pincode.trim()) {
      products = products.filter(p =>
        !p.pincodesAvailable || p.pincodesAvailable.length === 0 || p.pincodesAvailable.includes(pincode.trim())
      );
    }
    if (category)              products = products.filter(p => p.category === category);
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p =>
        (p.name||'').toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q) ||
        (p.description||'').toLowerCase().includes(q) || (p.sku||'').toLowerCase().includes(q)
      );
    }
    if (featured   === 'true') products = products.filter(p => p.featured);
    if (bestSeller === 'true') products = products.filter(p => p.bestSeller);
    if (newArrival === 'true') products = products.filter(p => p.newArrival);
    if (trending   === 'true') products = products.filter(p => p.trending);
    if (todayOffer === 'true') products = products.filter(p => p.todayOffer);

    products.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    res.json({ success: true, data: products, total: products.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getProduct(req, res) {
  try {
    const product = await db.getById('products', req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function createProduct(req, res) {
  try {
    const id = 'prod_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const product = normalise({ ...req.body, id });
    await db.insert('products', product);
    res.status(201).json({ success: true, data: product, message: 'Product created successfully.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function updateProduct(req, res) {
  try {
    const existing = await db.getById('products', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found.' });
    const updated = normalise({ ...existing, ...req.body, id: req.params.id });
    updated.createdAt = existing.createdAt;
    await db.upsert('products', req.params.id, updated);
    res.json({ success: true, data: updated, message: 'Product updated successfully.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function toggleStatus(req, res) {
  try {
    const product = await db.getById('products', req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    const { status } = req.body;
    if (!['published','draft','inactive','hidden'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    const updated = await db.update('products', req.params.id, { status, availabilityStatus: status });
    res.json({ success: true, data: updated, message: `Product ${status}.` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function updateStock(req, res) {
  try {
    const product = await db.getById('products', req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    const stock = Number(req.body.stock);
    if (isNaN(stock) || stock < 0) return res.status(400).json({ success: false, message: 'Invalid stock value.' });
    const updated = await db.update('products', req.params.id, { stock });
    res.json({ success: true, data: updated, message: 'Stock updated.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function deleteProduct(req, res) {
  try {
    const deleted = await db.delete('products', req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, message: 'Product permanently deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { getProducts, getProduct, createProduct, updateProduct, toggleStatus, updateStock, deleteProduct };
