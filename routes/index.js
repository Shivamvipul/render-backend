const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/events', require('./eventRoutes'));
router.use('/bookings', require('./bookingRoutes'));
router.use('/tickets', require('./ticketRoutes'));
router.use('/attendance', require('./attendanceRoutes'));
router.use('/payment', require('./paymentRoutes'));
router.use('/feedback', require('./feedbackRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/analytics', require('./analyticsRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/ai', require('./aiRoutes'));
router.use('/search', require('./searchRoutes'));

module.exports = router;
