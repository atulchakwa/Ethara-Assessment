const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { validateUserUpdate, validateObjectId } = require('../validators/authValidator');

router.get('/', authenticate, authorize('admin', 'manager'), userController.getUsers);
router.get('/:id', authenticate, validateObjectId, userController.getUser);
router.put('/:id', authenticate, authorize('admin'), validateUserUpdate, userController.updateUser);
router.delete('/:id', authenticate, authorize('admin'), validateObjectId, userController.deleteUser);
router.post('/:id/lock', authenticate, authorize('admin'), validateObjectId, userController.lockUser);
router.post('/:id/unlock', authenticate, authorize('admin'), validateObjectId, userController.unlockUser);
router.get('/:id/activity', authenticate, authorize('admin'), validateObjectId, userController.getUserActivity);

module.exports = router;