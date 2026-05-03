const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    next();
  };
};

const projectAccess = (allowedRoles = ['admin', 'manager', 'member']) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    if (req.user.role === 'admin') {
      return next();
    }
    
    const Project = require('../models/Project');
    const projectId = req.params.id || req.body.projectId;
    
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID required' });
    }
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    const memberRole = project.getMemberRole(req.user._id);
    if (!memberRole && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied to this project' });
    }
    
    req.project = project;
    next();
  };
};

const taskAccess = (allowedRoles = ['admin', 'manager', 'member']) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    if (req.user.role === 'admin') {
      return next();
    }
    
    const Task = require('../models/Task');
    const Project = require('../models/Project');
    const taskId = req.params.id || req.body.taskId;
    
    if (!taskId) {
      return res.status(400).json({ success: false, message: 'Task ID required' });
    }
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    const memberRole = project.getMemberRole(req.user._id);
    if (!memberRole && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied to this task' });
    }
    
    req.task = task;
    req.project = project;
    next();
  };
};

module.exports = { authorize, projectAccess, taskAccess };