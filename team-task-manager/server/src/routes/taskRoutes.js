const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateTask, validateObjectId } = require('../validators/authValidator');

router.post('/', authenticate, validateTask, taskController.createTask);
router.get('/', authenticate, taskController.getTasks);
router.get('/my', authenticate, taskController.getMyTasks);
router.get('/project/:id', authenticate, validateObjectId, taskController.getProjectTasks);
router.get('/:id', authenticate, validateObjectId, taskController.getTask);
router.put('/:id', authenticate, validateObjectId, taskController.updateTask);
router.delete('/:id', authenticate, validateObjectId, taskController.deleteTask);

module.exports = router;