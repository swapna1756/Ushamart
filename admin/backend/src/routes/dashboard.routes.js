const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/dashboard.controller');

router.get('/', authenticate, requireAdmin, ctrl.getDashboard);

module.exports = router;
