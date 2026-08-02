const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/product.controller');

// Public + optional auth (admin gets all statuses, public gets published only)
router.get('/',    optionalAuth, ctrl.getProducts);
router.get('/:id', optionalAuth, ctrl.getProduct);

// Admin-only CRUD
router.post('/',
  authenticate, requireAdmin,
  body('name').notEmpty().withMessage('Product name is required.'),
  body('price').isNumeric().withMessage('Price must be a number.'),
  body('category').notEmpty().withMessage('Category is required.'),
  validate,
  ctrl.createProduct
);

router.put('/:id',
  authenticate, requireAdmin,
  ctrl.updateProduct
);

router.patch('/:id/status',
  authenticate, requireAdmin,
  body('status').notEmpty(),
  validate,
  ctrl.toggleStatus
);

router.patch('/:id/stock',
  authenticate, requireAdmin,
  body('stock').isNumeric().withMessage('Stock must be a number.'),
  validate,
  ctrl.updateStock
);

router.delete('/:id',
  authenticate, requireAdmin,
  ctrl.deleteProduct
);

module.exports = router;
