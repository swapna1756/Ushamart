const path = require('path');
const fs   = require('fs');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// POST /api/upload/image
function uploadImage(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ success: true, url: publicUrl, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/upload/images  (multiple)
function uploadImages(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }
    const urls = req.files.map(f => ({
      url: `${req.protocol}://${req.get('host')}/uploads/${f.filename}`,
      filename: f.filename,
    }));
    res.json({ success: true, data: urls });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { uploadImage, uploadImages };
