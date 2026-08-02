const db = require('../database/db');

async function getNotifications(req, res) {
  try {
    const notifs = (await db.getAll('notifications'))
      .filter(n => n.status === 'published')
      .sort((a,b)=>(b.sentTime||b.createdAt||0)-(a.sentTime||a.createdAt||0));
    res.json({ success: true, data: notifs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getAllNotifications(req, res) {
  try {
    const notifs = (await db.getAll('notifications')).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    res.json({ success: true, data: notifs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function createNotification(req, res) {
  try {
    const id = 'notif_' + Date.now().toString(36);
    const notif = {
      id, title: req.body.title||'', content: req.body.content||'',
      message: req.body.message||req.body.content||'',
      type: req.body.type||'promotional', status: req.body.status||'published',
      sentTime: Date.now(), createdAt: Date.now(), updatedAt: Date.now(),
    };
    await db.insert('notifications', notif);
    res.status(201).json({ success: true, data: notif, message: 'Notification created.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function updateNotification(req, res) {
  try {
    const existing = await db.getById('notifications', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Notification not found.' });
    const updated = await db.update('notifications', req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function deleteNotification(req, res) {
  try {
    const deleted = await db.delete('notifications', req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Notification not found.' });
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { getNotifications, getAllNotifications, createNotification, updateNotification, deleteNotification };
