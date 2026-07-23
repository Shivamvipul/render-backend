const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const upload = require('../middleware/upload');

router.get('/profile', protect, ctrl.getProfile);
router.put('/profile', protect, upload.single('avatar'), ctrl.updateProfile);
router.post('/wishlist/:eventId', protect, ctrl.toggleWishlist);

router.get('/', protect, authorize('super_admin'), ctrl.getAllUsers);
router.put('/:id', protect, authorize('super_admin'), ctrl.adminUpdateUser);

module.exports = router;
