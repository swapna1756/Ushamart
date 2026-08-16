const db = require('../database/db');

async function getCategories(req, res) {
  try {
    let cats = await db.getAll('categories');
    const isAdmin = req.user && ['super_admin','store_manager'].includes(req.user.role);
    if (!isAdmin) cats = cats.filter(c => c.status === 'published');
    cats.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
    res.json({ success: true, data: cats, total: cats.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getCategory(req, res) {
  try {
    const cat = await db.getById('categories', req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, data: cat });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function createCategory(req, res) {
  try {
    const id  = 'cat_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const cat = {
      id, name: req.body.name || '', description: req.body.description || '',
      emojiIcon: req.body.emojiIcon || '', icon: req.body.icon || '',
      banner: req.body.banner || '', section: req.body.section || 'Grocery & Kitchen',
      status: req.body.status || 'published', featured: Boolean(req.body.featured),
      displayOrder: Number(req.body.displayOrder) || 0,
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    await db.insert('categories', cat);
    res.status(201).json({ success: true, data: cat, message: 'Category created.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function updateCategory(req, res) {
  try {
    const existing = await db.getById('categories', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Category not found.' });
    const updated = await db.update('categories', req.params.id, {
      ...req.body, featured: Boolean(req.body.featured),
      displayOrder: Number(req.body.displayOrder ?? existing.displayOrder ?? 0),
    });
    res.json({ success: true, data: updated, message: 'Category updated.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function toggleStatus(req, res) {
  try {
    const cat = await db.getById('categories', req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found.' });
    const { status } = req.body;
    if (!['published','inactive'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    const updated = await db.update('categories', req.params.id, { status });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function deleteCategory(req, res) {
  try {
    const deleted = await db.delete('categories', req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { getCategories, getCategory, createCategory, updateCategory, toggleStatus, deleteCategory };
