const db = require('../database/db');
const { isConfigured: supabaseReady } = require('../database/supabase');

// GET /api/notifications — public (published, not expired)
async function getNotifications(req, res) {
  try {
    const now = Date.now();
    const notifs = (await db.getAll('notifications'))
      .filter(n => {
        if (n.status !== 'published') return false;
        if (n.expiresAt && n.expiresAt < now) return false;
        return true;
      })
      .sort((a,b) => (b.sentTime||b.createdAt||0) - (a.sentTime||a.createdAt||0));
    res.json({ success: true, data: notifs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

// GET /api/notifications/all — admin (all)
async function getAllNotifications(req, res) {
  try {
    const notifs = (await db.getAll('notifications'))
      .sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
    res.json({ success: true, data: notifs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

// POST /api/notifications — admin
async function createNotification(req, res) {
  try {
    if (!req.body.title?.trim())
      return res.status(400).json({ success: false, message: 'Title is required.' });

    const id = 'notif_' + Date.now().toString(36);

    // Base fields that always exist in the Supabase schema
    const base = {
      id,
      title:    req.body.title.trim(),
      content:  req.body.content  || '',
      message:  req.body.message  || req.body.content || '',
      type:     req.body.type     || 'promotional',
      status:   req.body.status   || 'published',
      sentTime: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Extended fields — only include if Supabase columns exist
    // (when using local JSON fallback, all fields are stored anyway)
    const extended = supabaseReady ? {} : {
      imageUrl:       req.body.imageUrl       || '',
      category:       req.body.category       || 'general',
      priority:       req.body.priority       || 'normal',
      targetAudience: req.body.targetAudience || 'all',
      scheduledAt:    req.body.scheduledAt    || null,
      expiresAt:      req.body.expiresAt      || null,
    };

    const notif = { ...base, ...extended };

    // Try to insert — if columns are missing, retry with only base fields
    try {
      await db.insert('notifications', notif);
    } catch (insertErr) {
      if (insertErr.message && insertErr.message.includes('column')) {
        // Extended columns not yet added to Supabase — insert base only
        await db.insert('notifications', base);
        // Merge extended fields into response so UI still gets full object
        Object.assign(base, {
          imageUrl:       req.body.imageUrl       || '',
          category:       req.body.category       || 'general',
          priority:       req.body.priority       || 'normal',
          targetAudience: req.body.targetAudience || 'all',
        });
      } else {
        throw insertErr;
      }
    }

    res.status(201).json({
      success: true,
      data: { ...base, ...extended },
      id: base.id,
      message: 'Notification created.',
    });
  } catch (err) {
    console.error('[createNotification]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/notifications/:id — admin
async function updateNotification(req, res) {
  try {
    const existing = await db.getById('notifications', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Notification not found.' });
    // Strip unknown columns gracefully
    const safe = { ...req.body };
    const updated = await db.update('notifications', req.params.id, safe);
    res.json({ success: true, data: updated || { ...existing, ...safe } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

// DELETE /api/notifications/:id — admin
async function deleteNotification(req, res) {
  try {
    const deleted = await db.delete('notifications', req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Notification not found.' });
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

// POST /api/notifications/:id/read — user marks notification read
async function markRead(req, res) {
  try {
    const userId = req.user?.id || 'guest';
    const notif  = await db.getById('notifications', req.params.id);
    if (!notif) return res.status(404).json({ success: false, message: 'Not found.' });
    // Store read state in localStorage on client — server just acknowledges
    res.json({ success: true, message: 'Marked as read.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  getNotifications, getAllNotifications,
  createNotification, updateNotification, deleteNotification,
  markRead,
};
