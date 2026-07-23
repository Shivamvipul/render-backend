const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, ctrl.getNotifications);
router.patch('/:id/read', protect, ctrl.markAsRead);
router.patch('/read-all', protect, ctrl.markAllAsRead);

module.exports = router;
