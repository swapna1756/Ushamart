const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const ctrl   = require('../controllers/upload.controller');

// POST /api/upload/image   — single image
router.post('/image',
  authenticate, requireAdmin,
  upload.single('image'),
  ctrl.uploadImage
);

// POST /api/upload/images  — multiple images (up to 10)
router.post('/images',
  authenticate, requireAdmin,
  upload.array('images', 10),
  ctrl.uploadImages
);

module.exports = router;
