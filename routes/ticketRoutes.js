const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');

router.get('/mine', protect, ctrl.getMyTickets);
router.get('/:id', protect, ctrl.getTicketById);
router.get('/:id/pdf', protect, ctrl.downloadTicketPDF);

module.exports = router;
