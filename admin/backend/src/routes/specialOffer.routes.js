const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/specialOffer.controller');

router.get('/',        ctrl.getSpecialOffers);
router.get('/all',     authenticate, requireAdmin, ctrl.getAllSpecialOffers);
router.post('/',       authenticate, requireAdmin, ctrl.createSpecialOffer);
router.put('/:id',     authenticate, requireAdmin, ctrl.updateSpecialOffer);
router.delete('/:id',  authenticate, requireAdmin, ctrl.deleteSpecialOffer);

module.exports = router;
