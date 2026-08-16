const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/address.controller');

router.get('/', authenticate, ctrl.getAddresses);
router.post('/', authenticate, ctrl.createAddress);
router.put('/:id', authenticate, ctrl.updateAddress);
router.delete('/:id', authenticate, ctrl.deleteAddress);

module.exports = router;
