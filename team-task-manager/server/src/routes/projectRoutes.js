const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { validateProject, validateObjectId } = require('../validators/authValidator');

router.post('/', authenticate, validateProject, projectController.createProject);
router.get('/', authenticate, projectController.getProjects);
router.get('/:id', authenticate, validateObjectId, projectController.getProject);
router.put('/:id', authenticate, validateObjectId, projectController.updateProject);
router.delete('/:id', authenticate, authorize('admin'), validateObjectId, projectController.deleteProject);
router.post('/:id/members', authenticate, validateObjectId, projectController.addMember);
router.delete('/:id/members/:userId', authenticate, validateObjectId, projectController.removeMember);
router.put('/:id/members/:userId', authenticate, validateObjectId, projectController.updateMemberRole);
router.post('/:id/leave', authenticate, validateObjectId, projectController.leaveProject);

module.exports = router;