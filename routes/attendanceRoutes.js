const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.post('/scan', protect, authorize('organizer', 'super_admin'), ctrl.scanTicket);
router.get('/', protect, authorize('organizer', 'super_admin'), ctrl.getAttendance);

module.exports = router;
