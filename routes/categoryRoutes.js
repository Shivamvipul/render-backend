const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', ctrl.getCategories);
router.post('/', protect, authorize('super_admin'), ctrl.createCategory);
router.put('/:id', protect, authorize('super_admin'), ctrl.updateCategory);
router.delete('/:id', protect, authorize('super_admin'), ctrl.deleteCategory);

module.exports = router;
