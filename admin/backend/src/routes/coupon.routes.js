const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/coupon.controller');

router.get('/',              ctrl.getCoupons);                            // public
router.get('/all',           authenticate, requireAdmin, ctrl.getAllCoupons);
router.post('/validate',     authenticate, ctrl.validateCoupon);          // user validates
router.post('/',             authenticate, requireAdmin, ctrl.createCoupon);
router.put('/:id',           authenticate, requireAdmin, ctrl.updateCoupon);
router.delete('/:id',        authenticate, requireAdmin, ctrl.deleteCoupon);

module.exports = router;
