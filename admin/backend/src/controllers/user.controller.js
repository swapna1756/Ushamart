const db = require('../database/db');

async function getUsers(req, res) {
  try {
    const { search, status } = req.query;
    let users = (await db.getAll('users')).filter(u => u.role === 'customer');
    if (status && status !== 'all') users = users.filter(u => u.status === status);
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u =>
        (u.name||'').toLowerCase().includes(q) || (u.phone||'').includes(q) ||
        (u.email||'').toLowerCase().includes(q)
      );
    }
    users.sort((a, b) => (b.registeredAt||b.createdAt||0) - (a.registeredAt||a.createdAt||0));
    const safe = users.map(({ password: _, ...u }) => u);
    res.json({ success: true, data: safe, total: safe.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getUser(req, res) {
  try {
    const user = await db.getById('users', req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const isAdmin = ['super_admin','store_manager'].includes(req.user.role);
    if (!isAdmin && req.user.id !== req.params.id)
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    const { password: _, ...safe } = user;
    res.json({ success: true, data: safe });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function updateProfile(req, res) {
  try {
    const uid = req.user.id;
    if (uid !== req.params.id) return res.status(403).json({ success: false, message: 'Forbidden.' });
    const allowed = ['name','email','addressText','pincode','house','street','area','landmark','city','state','dob','gender','profilePic'];
    const fields  = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) fields[k] = req.body[k]; });
    const updated = await db.update('users', uid, fields);
    if (!updated) return res.status(404).json({ success: false, message: 'User not found.' });
    const { password: _, ...safe } = updated;
    res.json({ success: true, data: safe, message: 'Profile updated.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function toggleBlock(req, res) {
  try {
    const user = await db.getById('users', req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const nextStatus = user.status === 'blocked' ? 'active' : 'blocked';
    const updated = await db.update('users', req.params.id, { status: nextStatus });
    const { password: _, ...safe } = updated;
    res.json({ success: true, data: safe, message: `User ${nextStatus}.` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { getUsers, getUser, updateProfile, toggleBlock };
