const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/pincode.controller');

// ── Public routes (no auth needed) ───────────────────────────────────────────
router.get('/',            ctrl.getPincodes);    // active pincodes for user app
router.post('/check',      ctrl.checkPincode);   // check if a pincode is serviceable

// ── Admin routes (auth required) — MUST come before /:code to avoid conflicts ─
router.get('/all',         authenticate, requireAdmin, ctrl.getAllPincodes);
router.post('/',           authenticate, requireAdmin, ctrl.createPincode);
router.put('/:code',       authenticate, requireAdmin, ctrl.updatePincode);
router.patch('/:code',     authenticate, requireAdmin, ctrl.updatePincode);  // alias
router.delete('/:code',    authenticate, requireAdmin, ctrl.deletePincode);

module.exports = router;
