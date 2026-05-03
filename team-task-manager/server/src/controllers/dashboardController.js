const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Activity = require('../models/Activity');

exports.getDashboard = async (req, res) => {
  try {
    let projectQuery = {};
    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({ 'members.user': req.user._id });
      projectQuery = { _id: { $in: userProjects.map(p => p._id) } };
    }
    
    const projects = await Project.find(projectQuery);
    const projectIds = projects.map(p => p._id);
    
    const taskQuery = { project: { $in: projectIds } };
    
    const statusCounts = await Task.aggregate([
      { $match: taskQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const priorityCounts = await Task.aggregate([
      { $match: taskQuery },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const completedThisWeek = await Task.countDocuments({
      project: { $in: projectIds },
      status: 'done',
      updatedAt: { $gte: weekAgo }
    });
    
    const totalTasks = await Task.countDocuments(taskQuery);
    const completionRate = totalTasks > 0 ? Math.round((completedThisWeek / totalTasks) * 100) : 0;
    
    const statusMap = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
    statusCounts.forEach(s => { statusMap[s._id] = s.count; });
    
    const priorityMap = { low: 0, medium: 0, high: 0 };
    priorityCounts.forEach(p => { priorityMap[p._id] = p.count; });
    
    const overdueTasks = await Task.find({
      project: { $in: projectIds },
      status: { $ne: 'done' },
      dueDate: { $lt: new Date() }
    }).populate('assignee', 'username').populate('project', 'name').limit(10);
    
    const recentTasks = await Task.find({ project: { $in: projectIds } })
      .populate('project', 'name')
      .populate('assignee', 'username')
      .sort({ createdAt: -1 })
      .limit(10);
    
    const recentProjects = await Project.find(projectQuery).sort({ createdAt: -1 }).limit(5);
    
    const teamStats = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    const roleMap = { admin: 0, manager: 0, member: 0 };
    teamStats.forEach(r => { roleMap[r._id] = r.count; });
    
    res.json({
      success: true,
      data: {
        stats: {
          totalProjects: projects.length,
          totalTasks,
          completedThisWeek,
          completionRate,
          byStatus: statusMap,
          byPriority: priorityMap,
          overdue: overdueTasks.length,
          teamByRole: roleMap
        },
        overdueTasks,
        recentTasks,
        recentProjects
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id });
    const projectIds = projects.map(p => p._id);
    
    const taskQuery = { project: { $in: projectIds } };
    
    const stats = await Task.aggregate([
      { $match: taskQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const statusMap = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
    stats.forEach(s => { statusMap[s._id] = s.count; });
    
    const myTasks = await Task.find({ assignee: req.user._id })
      .populate('project', 'name')
      .sort({ createdAt: -1 });
    
    const overdueMyTasks = await Task.find({
      assignee: req.user._id,
      status: { $ne: 'done' },
      dueDate: { $lt: new Date() }
    }).populate('project', 'name');
    
    res.json({
      success: true,
      data: {
        stats: statusMap,
        tasks: myTasks,
        overdueTasks: overdueMyTasks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({ success: true, data: { activities } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch activity' });
  }
};