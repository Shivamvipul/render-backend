const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createBookingValidator } = require('../validators/bookingValidator');

router.post('/', protect, createBookingValidator, validate, ctrl.createBooking);
router.get('/', protect, ctrl.getBookings);
router.get('/:id', protect, ctrl.getBookingById);
router.delete('/:id', protect, ctrl.cancelBooking);

module.exports = router;
