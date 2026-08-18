/**
 * upload.controller.js
 *
 * Handles image uploads for products, categories, and banners.
 *
 * Storage strategy:
 *   1. When Supabase is configured: upload directly to the "ushamart" Storage
 *      bucket and return a permanent public URL.
 *   2. Fallback (dev / local mode): save to the local ./uploads directory
 *      and return a relative /uploads/<filename> URL.
 *
 * All image URLs are stored in PostgreSQL (products.images, categories.icon,
 * banners.image_url) — never in a separate local file.
 */
const path = require('path');
const fs   = require('fs');
const { supabase, isConfigured: supabaseReady } = require('../database/supabase');

const BUCKET     = 'ushamart';          // single canonical bucket for all uploads
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ── Internal: upload one file buffer to Supabase Storage ─────────────────────
async function uploadToSupabase(fileBuffer, mimeType, originalFilename) {
  const timestamp   = Date.now();
  const safeName    = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `uploads/${timestamp}_${safeName}`;

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadErr) throw new Error(uploadErr.message);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return urlData.publicUrl;
}

// ── Internal: delete local temp file (non-fatal) ──────────────────────────────
function deleteTemp(localPath) {
  fs.unlink(localPath, err => {
    if (err) console.warn('[upload] Could not delete temp file:', err.message);
  });
}

// POST /api/upload/image  — single file
async function uploadImage(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const { path: localPath, filename, mimetype } = req.file;

    if (supabaseReady) {
      try {
        const fileBuffer = fs.readFileSync(localPath);
        const publicUrl  = await uploadToSupabase(fileBuffer, mimetype, filename);
        deleteTemp(localPath);
        return res.json({ success: true, url: publicUrl, filename });
      } catch (sbErr) {
        console.error('[upload] Supabase upload failed, using local fallback:', sbErr.message);
        // Fall through to local URL
      }
    }

    // Local fallback
    return res.json({ success: true, url: `/uploads/${filename}`, filename });
  } catch (err) {
    console.error('[upload] uploadImage error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/upload/images  — multiple files
async function uploadImages(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    const results = [];

    for (const f of req.files) {
      const { path: localPath, filename, mimetype } = f;

      if (supabaseReady) {
        try {
          const fileBuffer = fs.readFileSync(localPath);
          const publicUrl  = await uploadToSupabase(fileBuffer, mimetype, filename);
          deleteTemp(localPath);
          results.push({ url: publicUrl, filename });
          continue;
        } catch (sbErr) {
          console.error('[upload] Supabase upload failed for', filename, ':', sbErr.message);
          // Fall through to local URL for this file
        }
      }

      results.push({ url: `/uploads/${filename}`, filename });
    }

    return res.json({ success: true, data: results });
  } catch (err) {
    console.error('[upload] uploadImages error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { uploadImage, uploadImages };
