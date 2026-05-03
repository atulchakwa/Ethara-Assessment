const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', authenticate, dashboardController.getDashboard);
router.get('/my-tasks', authenticate, dashboardController.getMyTasks);
router.get('/activity', authenticate, dashboardController.getRecentActivity);

module.exports = router;