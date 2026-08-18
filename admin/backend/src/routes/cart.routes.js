const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/cart.controller');

// All cart routes require a valid user JWT
router.get('/',              authenticate, ctrl.getCart);
router.put('/',              authenticate, ctrl.syncCart);
router.patch('/:cartKey',    authenticate, ctrl.updateCartItem);
router.delete('/',           authenticate, ctrl.clearCart);

module.exports = router;
