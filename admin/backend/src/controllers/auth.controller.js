const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../database/db');

const JWT_SECRET  = () => process.env.JWT_SECRET  || 'fallback_secret';
const JWT_EXPIRES = () => process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET(), { expiresIn: JWT_EXPIRES() }
  );
}

async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const users = await db.getAll('users');
    let user = users.find(u => u.email?.toLowerCase() === email.toLowerCase() &&
      ['super_admin','store_manager'].includes(u.role));

    if (!user) {
      const envEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
      const envPass  = process.env.ADMIN_PASSWORD || '';
      if (email.toLowerCase() === envEmail && password === envPass) {
        const hashedPass = await bcrypt.hash(password, 10);
        user = {
          id: 'adm_' + Date.now().toString(36), name: 'Super Admin',
          email, password: hashedPass, phone: '', role: 'super_admin',
          status: 'active', createdAt: Date.now(), updatedAt: Date.now(),
        };
        await db.insert('users', user);
      } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
    }

    if (user.status === 'blocked')
      return res.status(403).json({ success: false, message: 'Account is blocked.' });

    let valid = false;
    if (user.password) {
      if (user.password.startsWith('$2')) {
        valid = await bcrypt.compare(password, user.password);
      } else {
        valid = user.password === password;
        if (valid) await db.update('users', user.id, { password: await bcrypt.hash(password, 10) });
      }
    }
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    await db.update('users', user.id, { lastLogin: Date.now() });
    return res.json({
      success: true, token: signToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) { console.error('[adminLogin]', err); return res.status(500).json({ success: false, message: err.message }); }
}

async function userLogin(req, res) {
  try {
    const { phone, name, email } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required.' });

    const users = await db.getAll('users');
    let user = users.find(u => u.phone === phone && u.role === 'customer');

    if (user && user.status === 'blocked')
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Contact support.' });

    if (!user) {
      user = {
        id: 'usr_' + Date.now().toString(36), phone, name: name||'', email: email||'',
        role: 'customer', status: 'active', totalOrders: 0, totalSpent: 0,
        addressText: '', pincode: '', registeredAt: Date.now(), lastLogin: Date.now(),
        createdAt: Date.now(), updatedAt: Date.now(),
      };
      await db.insert('users', user);
    } else {
      await db.update('users', user.id, { lastLogin: Date.now() });
    }

    return res.json({
      success: true, token: signToken(user),
      user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role, status: user.status },
      isNewUser: !user.name,
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getMe(req, res) {
  try {
    const user = await db.getById('users', req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const { password: _, ...safe } = user;
    res.json({ success: true, user: safe });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { adminLogin, userLogin, getMe };
