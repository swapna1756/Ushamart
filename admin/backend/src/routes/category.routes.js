const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/category.controller');

router.get('/',    optionalAuth, ctrl.getCategories);
router.get('/:id', optionalAuth, ctrl.getCategory);

router.post('/',
  authenticate, requireAdmin,
  body('name').notEmpty().withMessage('Category name is required.'),
  validate,
  ctrl.createCategory
);

router.put('/:id',   authenticate, requireAdmin, ctrl.updateCategory);
router.patch('/:id/status', authenticate, requireAdmin, ctrl.toggleStatus);
router.delete('/:id', authenticate, requireAdmin, ctrl.deleteCategory);

module.exports = router;
