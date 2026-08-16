const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/wishlist.controller');

router.get('/',                 authenticate, ctrl.getWishlist);
router.post('/:productId',      authenticate, ctrl.addToWishlist);
router.delete('/clear',         authenticate, ctrl.clearWishlist);
router.delete('/:productId',    authenticate, ctrl.removeFromWishlist);

module.exports = router;
