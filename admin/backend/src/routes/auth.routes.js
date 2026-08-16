const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/auth.controller');

// POST /api/auth/admin/login
router.post('/admin/login',
  body('email').isEmail().withMessage('Valid email required.'),
  body('password').notEmpty().withMessage('Password required.'),
  validate,
  ctrl.adminLogin
);

// POST /api/auth/user/login
router.post('/user/login',
  body('phone').notEmpty().withMessage('Phone number required.'),
  validate,
  ctrl.userLogin
);

// POST /api/auth/user/firebase-login
router.post('/user/firebase-login',
  body('idToken').notEmpty().withMessage('Firebase ID token required.'),
  validate,
  ctrl.firebaseUserLogin
);

// GET /api/auth/me  — requires token
router.get('/me', authenticate, ctrl.getMe);

module.exports = router;
