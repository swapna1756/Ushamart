const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/order.controller');

router.get('/',    authenticate, ctrl.getOrders);
router.get('/:id', authenticate, ctrl.getOrder);

// User places order
router.post('/',
  authenticate,
  body('items').isArray({ min: 1 }).withMessage('At least one item required.'),
  validate,
  ctrl.createOrder
);

// Admin updates status
router.patch('/:id/status',
  authenticate, requireAdmin,
  body('status').notEmpty(),
  validate,
  ctrl.updateStatus
);

module.exports = router;
