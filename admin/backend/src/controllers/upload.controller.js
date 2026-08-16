const path = require('path');
const fs   = require('fs');
const { uploadToFirebase, isFirebaseReady } = require('../services/firebase');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// POST /api/upload/image
async function uploadImage(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const localPath = req.file.path;
    const filename = req.file.filename;

    if (isFirebaseReady()) {
      try {
        const firebaseVal = await uploadToFirebase(localPath, filename, req.file.mimetype);
        // Clean up local temp file
        fs.unlink(localPath, (err) => {
          if (err) console.error('[Upload Controller] Local file deletion error:', err.message);
        });
        return res.json({ success: true, url: firebaseVal, filename });
      } catch (fbErr) {
        console.error('[Upload Controller] Firebase upload failed:', fbErr.message);
        return res.status(500).json({
          success: false,
          message: `Cloud storage upload failed: ${fbErr.message}`
        });
      }
    } else {
      // Fallback local URL
      const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
      return res.json({ success: true, url: publicUrl, filename });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/upload/images  (multiple)
async function uploadImages(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    const urls = [];
    for (const f of req.files) {
      const localPath = f.path;
      const filename = f.filename;

      if (isFirebaseReady()) {
        try {
          const firebaseVal = await uploadToFirebase(localPath, filename, f.mimetype);
          fs.unlink(localPath, (err) => {
            if (err) console.error('[Upload Controller] Local file deletion error:', err.message);
          });
          urls.push({ url: firebaseVal, filename });
        } catch (fbErr) {
          console.error('[Upload Controller] Firebase upload failed for file:', filename, fbErr.message);
          return res.status(500).json({
            success: false,
            message: `Cloud storage upload failed: ${fbErr.message}`
          });
        }
      } else {
        const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
        urls.push({ url: publicUrl, filename });
      }
    }
    return res.json({ success: true, data: urls });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { uploadImage, uploadImages };
