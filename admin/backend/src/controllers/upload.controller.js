const path = require('path');
const fs   = require('fs');
const { supabase, isConfigured: supabaseReady } = require('../database/supabase');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// POST /api/upload/image
async function uploadImage(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const localPath = req.file.path;
    const filename = req.file.filename;

    if (supabaseReady) {
      try {
        const fileBuffer = fs.readFileSync(localPath);
        const storagePath = `uploads/${Date.now()}_${filename}`;

        const { error: uploadErr } = await supabase.storage
          .from('ushamart')
          .upload(storagePath, fileBuffer, {
            contentType: req.file.mimetype,
            upsert: true
          });

        if (uploadErr) throw new Error(uploadErr.message);

        const { data: urlData } = supabase.storage
          .from('ushamart')
          .getPublicUrl(storagePath);

        // Clean up local temp file
        fs.unlink(localPath, (err) => {
          if (err) console.error('[Upload Controller] Local file deletion error:', err.message);
        });

        return res.json({ success: true, url: urlData.publicUrl, filename });
      } catch (sbErr) {
        console.error('[Upload Controller] Supabase upload failed:', sbErr.message);
        // Fallback to serving locally if Supabase bucket isn't initialized yet
        const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
        return res.json({ success: true, url: publicUrl, filename });
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

      if (supabaseReady) {
        try {
          const fileBuffer = fs.readFileSync(localPath);
          const storagePath = `uploads/${Date.now()}_${filename}`;

          const { error: uploadErr } = await supabase.storage
            .from('ushamart')
            .upload(storagePath, fileBuffer, {
              contentType: f.mimetype,
              upsert: true
            });

          if (uploadErr) throw new Error(uploadErr.message);

          const { data: urlData } = supabase.storage
            .from('ushamart')
            .getPublicUrl(storagePath);

          fs.unlink(localPath, (err) => {
            if (err) console.error('[Upload Controller] Local file deletion error:', err.message);
          });

          urls.push({ url: urlData.publicUrl, filename });
        } catch (sbErr) {
          console.error('[Upload Controller] Supabase upload failed for file:', filename, sbErr.message);
          const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
          urls.push({ url: publicUrl, filename });
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
