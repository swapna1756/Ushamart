const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/user.controller');

router.get('/',             authenticate, requireAdmin, ctrl.getUsers);
router.get('/:id',          authenticate, ctrl.getUser);
router.patch('/:id/profile',authenticate, ctrl.updateProfile);
router.patch('/:id/block',  authenticate, requireAdmin, ctrl.toggleBlock);

module.exports = router;
