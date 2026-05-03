const User = require('../models/User');
const Activity = require('../models/Activity');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -lastPasswords -refreshTokens');
    
    res.json({ success: true, data: { users } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -lastPasswords -refreshTokens');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { username, role } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (username) user.username = username;
    if (role) user.role = role;
    
    await user.save();
    
    await Activity.create({
      user: req.user._id,
      action: 'user_updated',
      targetType: 'user',
      targetId: user._id,
      details: { username, role },
      ipAddress: req.ip
    });
    
    res.json({ success: true, message: 'User updated', data: { user: user.toJSON() } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }
    
    await Activity.create({
      user: req.user._id,
      action: 'user_deleted',
      targetType: 'user',
      targetId: user._id,
      details: { username: user.username, email: user.email },
      ipAddress: req.ip
    });
    
    await user.deleteOne();
    
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

exports.lockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.lockAccount(30 * 60 * 1000);
    await user.save();
    
    res.json({ success: true, message: 'User locked for 30 minutes' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to lock user' });
  }
};

exports.unlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.unlockAccount();
    await user.save();
    
    res.json({ success: true, message: 'User unlocked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to unlock user' });
  }
};

exports.getUserActivity = async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, data: { activities } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch activity' });
  }
};