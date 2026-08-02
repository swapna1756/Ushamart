const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/banner.controller');

router.get('/',        ctrl.getBanners);
router.get('/all',     authenticate, requireAdmin, ctrl.getAllBanners);
router.post('/',       authenticate, requireAdmin, ctrl.createBanner);
router.put('/:id',     authenticate, requireAdmin, ctrl.updateBanner);
router.delete('/:id',  authenticate, requireAdmin, ctrl.deleteBanner);

module.exports = router;
