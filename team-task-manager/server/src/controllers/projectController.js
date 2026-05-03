const Project = require('../models/Project');
const Activity = require('../models/Activity');
const User = require('../models/User');

exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const project = new Project({
      name,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }]
    });
    await project.save();
    
    await Activity.create({
      user: req.user._id,
      action: 'project_created',
      targetType: 'project',
      targetId: project._id,
      ipAddress: req.ip
    });
    
    res.status(201).json({ success: true, message: 'Project created', data: { project } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create project' });
  }
};

exports.getProjects = async (req, res) => {
  try {
    let query = { isArchived: false };
    
    if (req.user.role !== 'admin') {
      query['members.user'] = req.user._id;
    }
    
    const projects = await Project.find(query).populate('members.user', 'username email role').populate('owner', 'username email');
    
    res.json({ success: true, data: { projects } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch projects' });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('members.user', 'username email role').populate('owner', 'username email');
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (req.user.role !== 'admin' && !project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.json({ success: true, data: { project } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch project' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    const memberRole = project.getMemberRole(req.user._id);
    const isOwner = project.owner.toString() === req.user._id.toString();
    
    if (req.user.role !== 'admin' && !isOwner && memberRole !== 'manager') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { name, description } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    
    await project.save();
    
    await Activity.create({
      user: req.user._id,
      action: 'project_updated',
      targetType: 'project',
      targetId: project._id,
      ipAddress: req.ip
    });
    
    res.json({ success: true, message: 'Project updated', data: { project } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update project' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can delete projects' });
    }
    
    const Task = require('../models/Task');
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    
    await Activity.create({
      user: req.user._id,
      action: 'project_deleted',
      targetType: 'project',
      targetId: project._id,
      details: { name: project.name },
      ipAddress: req.ip
    });
    
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete project' });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { userId, role = 'member' } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    const memberRole = project.getMemberRole(req.user._id);
    const isOwner = project.owner.toString() === req.user._id.toString();
    
    if (req.user.role !== 'admin' && !isOwner && memberRole !== 'manager') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (project.isMember(userId)) {
      return res.status(400).json({ success: false, message: 'User already a member' });
    }
    
    project.members.push({ user: userId, role });
    await project.save();
    
    await Activity.create({
      user: req.user._id,
      action: 'project_member_added',
      targetType: 'project',
      targetId: project._id,
      details: { userId, role },
      ipAddress: req.ip
    });
    
    res.json({ success: true, message: 'Member added', data: { project } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add member' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (project.owner.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove project owner' });
    }
    
    const memberRole = project.getMemberRole(req.user._id);
    const isOwner = project.owner.toString() === req.user._id.toString();
    
    if (req.user.role !== 'admin' && !isOwner && memberRole !== 'manager') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    project.members = project.members.filter(m => m.user.toString() !== userId);
    await project.save();
    
    await Activity.create({
      user: req.user._id,
      action: 'project_member_removed',
      targetType: 'project',
      targetId: project._id,
      details: { userId },
      ipAddress: req.ip
    });
    
    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove member' });
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (project.owner.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Cannot change owner role' });
    }
    
    const memberRole = project.getMemberRole(req.user._id);
    const isOwner = project.owner.toString() === req.user._id.toString();
    
    if (req.user.role !== 'admin' && !isOwner && memberRole !== 'manager') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const memberIndex = project.members.findIndex(m => m.user.toString() === userId);
    if (memberIndex === -1) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    
    project.members[memberIndex].role = role;
    await project.save();
    
    res.json({ success: true, message: 'Role updated', data: { project } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
};

exports.leaveProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (project.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Owner cannot leave project. Transfer ownership first.' });
    }
    
    if (!project.isMember(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Not a member of this project' });
    }
    
    project.members = project.members.filter(m => m.user.toString() !== req.user._id.toString());
    await project.save();
    
    res.json({ success: true, message: 'Left project successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to leave project' });
  }
};