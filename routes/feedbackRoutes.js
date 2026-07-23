const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/feedbackController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.post('/', protect, ctrl.createFeedback);
router.get('/', ctrl.getFeedback);
router.put('/:id/reply', protect, authorize('organizer', 'super_admin'), ctrl.replyToFeedback);

module.exports = router;
