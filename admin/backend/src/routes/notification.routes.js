const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/notification.controller');

router.get('/',         ctrl.getNotifications);                          // public
router.get('/all',      authenticate, requireAdmin, ctrl.getAllNotifications);
router.post('/',        authenticate, requireAdmin, ctrl.createNotification);
router.put('/:id',      authenticate, requireAdmin, ctrl.updateNotification);
router.delete('/:id',   authenticate, requireAdmin, ctrl.deleteNotification);
router.post('/:id/read',authenticate, ctrl.markRead);                    // user marks read

module.exports = router;
