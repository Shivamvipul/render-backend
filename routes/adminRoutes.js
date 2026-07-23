const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect, authorize('super_admin'));

router.get('/analytics', ctrl.getSystemAnalytics);
router.get('/organizers/pending', ctrl.getPendingOrganizers);
router.patch('/organizers/:id/approve', ctrl.approveOrganizer);
router.get('/events/pending', ctrl.getPendingEvents);
router.get('/audit-logs', ctrl.getAuditLogs);
router.get('/activity-logs', ctrl.getActivityLogs);

module.exports = router;
