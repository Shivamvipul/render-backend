const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Organizers see analytics scoped to their own events; super_admin sees platform-wide
router.use(protect, authorize('super_admin', 'organizer'));

router.get('/registration-trends', ctrl.getRegistrationTrends);
router.get('/attendance-ratio', ctrl.getAttendanceRatio);
router.get('/popular-categories', ctrl.getPopularCategories);
router.get('/peak-registration-timings', ctrl.getPeakRegistrationTimings);

module.exports = router;
