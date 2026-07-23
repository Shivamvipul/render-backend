const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const parseJsonFields = require('../middleware/parseJsonFields');
const { createEventValidator } = require('../validators/eventValidator');

const eventUploads = upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'gallery', maxCount: 10 },
]);

router.get('/', ctrl.getEvents);
router.get('/featured', ctrl.getFeaturedEvents);
router.get('/mine', protect, authorize('organizer', 'super_admin'), ctrl.getMyEvents);
router.get('/:id', ctrl.getEventById);

router.post('/', protect, authorize('organizer', 'super_admin'), eventUploads, parseJsonFields, createEventValidator, validate, ctrl.createEvent);
router.put('/:id', protect, authorize('organizer', 'super_admin'), eventUploads, parseJsonFields, ctrl.updateEvent);
router.delete('/:id', protect, authorize('organizer', 'super_admin'), ctrl.deleteEvent);
router.patch('/:id/status', protect, authorize('organizer', 'super_admin'), ctrl.setEventStatus);
router.patch('/:id/approve', protect, authorize('super_admin'), ctrl.approveEvent);

module.exports = router;
