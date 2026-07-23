const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.get('/recommendations', protect, ctrl.getRecommendations);
router.post('/generate-description', protect, ctrl.generateDescription);
router.post('/chat', ctrl.chat); // chatbot is open to visitors
router.get('/predict-attendance/:eventId', protect, ctrl.predictAttendance);
router.get('/predict-demand/:eventId', protect, ctrl.predictDemand);

module.exports = router;
