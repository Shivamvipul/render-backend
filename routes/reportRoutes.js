const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', protect, authorize('organizer', 'super_admin'), ctrl.getReport);

module.exports = router;
