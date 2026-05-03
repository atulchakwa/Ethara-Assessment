const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['user_created', 'user_updated', 'user_deleted', 'user_login', 'user_logout',
          'project_created', 'project_updated', 'project_deleted', 'project_member_added', 'project_member_removed',
          'task_created', 'task_updated', 'task_deleted', 'task_assigned', 'task_status_changed',
          'password_changed', 'password_reset']
  },
  targetType: {
    type: String,
    enum: ['user', 'project', 'task', 'auth']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true
});

activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);