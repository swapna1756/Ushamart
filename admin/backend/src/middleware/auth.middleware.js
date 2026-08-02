const jwt = require('jsonwebtoken');

/**
 * Verifies the JWT from the Authorization: Bearer <token> header.
 * Attaches req.user on success.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing or invalid Authorization header.' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token is expired or invalid.' });
  }
}

/**
 * Verifies the user has admin-level role (super_admin or store_manager).
 * Must be used AFTER authenticate().
 */
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated.' });
  if (!['super_admin', 'store_manager'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden: admin access required.' });
  }
  next();
}

/**
 * Optional auth — attaches req.user if token is present but does NOT block on missing token.
 * Used for public routes that behave differently for authenticated users.
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.split(' ')[1];
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch { /* token invalid — proceed as guest */ }
  }
  next();
}

module.exports = { authenticate, requireAdmin, optionalAuth };
