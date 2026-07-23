const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create-order', protect, ctrl.createOrder);
router.post('/verify', protect, ctrl.verifyPayment);
router.post('/:id/refund', protect, ctrl.refundPayment);
// NOTE: webhook route is mounted separately in app.js with express.raw() body parsing

module.exports = router;
