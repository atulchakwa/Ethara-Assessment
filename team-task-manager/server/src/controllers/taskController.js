const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const mongoose = require('mongoose');

exports.createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignee, status = 'todo', priority = 'medium', dueDate } = req.body;
    
    console.log('Create task request:', { title, projectId, user: req.user._id });
    
    // Validate projectId is provided
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }
    
    // Validate projectId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      console.log('Invalid projectId:', projectId);
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }
    
    // Check project exists
    const project = await Project.findById(projectId);
    if (!project) {
      console.log('Project not found:', projectId);
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    // Check user has access to this project
    if (req.user.role !== 'admin' && !project.isMember(req.user._id)) {
      console.log('Access denied:', { user: req.user._id, projectId });
      return res.status(403).json({ success: false, message: 'Access denied to this project' });
    }
    
    const task = new Task({
      title,
      description,
      project: projectId,
      assignee: assignee && assignee.trim() ? assignee : null,
      status,
      priority,
      dueDate: dueDate || null,
      createdBy: req.user._id
    });
    await task.save();
    
    await Activity.create({
      user: req.user._id,
      action: 'task_created',
      targetType: 'task',
      targetId: task._id,
      details: { projectId, status },
      ipAddress: req.ip
    });
    
    console.log('Task created:', task._id);
    res.status(201).json({ success: true, message: 'Task created', data: { task } });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, message: 'Failed to create task: ' + error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { projectId, status, priority, assignee } = req.query;
    
    let query = {};
    
    // Admin sees all tasks
    if (req.user.role === 'admin') {
      // No filter
    } else if (projectId) {
      // Filter by specific project
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      if (!project.isMember(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      query.project = projectId;
    } else {
      // Members see: tasks from projects they're in OR assigned to them OR they created
      const memberProjects = await Project.find({ 'members.user': req.user._id });
      const projectIds = memberProjects.map(p => p._id);
      
      query.$or = [
        { project: { $in: projectIds } },
        { assignee: req.user._id },
        { createdBy: req.user._id }
      ];
    }
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee) query.assignee = assignee;
    
    const tasks = await Task.find(query)
      .populate('assignee', 'username email')
      .populate('createdBy', 'username email')
      .populate('project', 'name')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: { tasks } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};

exports.getProjectTasks = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (req.user.role !== 'admin' && !project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const tasks = await Task.find({ project: req.params.id })
      .populate('assignee', 'username email')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: { tasks } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'username email')
      .populate('createdBy', 'username email')
      .populate('project', 'name owner members');
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const project = await Project.findById(task.project);
    if (project) {
      if (req.user.role !== 'admin' && !project.isMember(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }
    
    res.json({ success: true, data: { task } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch task' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const project = await Project.findById(task.project);
    const memberRole = project ? project.getMemberRole(req.user._id) : null;
    const isProjectMember = project ? project.isMember(req.user._id) : false;
    const canEdit = req.user.role === 'admin' || memberRole === 'owner' || memberRole === 'manager';
    const isAssignee = task.assignee && task.assignee.toString() === req.user._id.toString();
    const isCreator = task.createdBy && task.createdBy.toString() === req.user._id.toString();
    
    // Allow: admin, owner/manager in project, assignee, task creator, OR any project member for status updates
    if (req.user.role !== 'admin' && !canEdit && !isAssignee && !isCreator && !isProjectMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { title, description, assignee, status, priority, dueDate } = req.body;
    
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignee !== undefined) task.assignee = assignee && assignee.trim() ? assignee : null;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    
    await task.save();
    
    await Activity.create({
      user: req.user._id,
      action: assignee !== undefined ? 'task_assigned' : 'task_updated',
      targetType: 'task',
      targetId: task._id,
      details: { status, assignee, priority },
      ipAddress: req.ip
    });
    
    res.json({ success: true, message: 'Task updated', data: { task } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const project = await Project.findById(task.project);
    const memberRole = project ? project.getMemberRole(req.user._id) : null;
    const isProjectMember = project ? project.isMember(req.user._id) : false;
    const canDelete = req.user.role === 'admin' || memberRole === 'owner' || memberRole === 'manager';
    const isCreator = task.createdBy && task.createdBy.toString() === req.user._id.toString();
    
    // Allow: admin, owner/manager in project, or task creator OR any project member
    if (!canDelete && !isCreator && !isProjectMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    await task.deleteOne();
    
    await Activity.create({
      user: req.user._id,
      action: 'task_deleted',
      targetType: 'task',
      targetId: task._id,
      details: { title: task.title },
      ipAddress: req.ip
    });
    
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignee: req.user._id })
      .populate('project', 'name')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: { tasks } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};