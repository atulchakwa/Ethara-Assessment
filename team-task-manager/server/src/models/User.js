const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const securityQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answerHash: { type: String, required: true }
}, { _id: false });

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  role: {
    type: String,
    enum: { values: ['admin', 'manager', 'member'], message: 'Invalid role' },
    default: 'member'
  },
  securityQuestions: [securityQuestionSchema],
  refreshTokens: [refreshTokenSchema],
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date },
  resetToken: { type: String },
  resetTokenExpires: { type: Date },
  lastPasswords: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  
  const passwords = this.lastPasswords || [];
  passwords.unshift(this.password);
  this.lastPasswords = passwords.slice(0, 5);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.comparePreviousPassword = async function(candidatePassword) {
  for (const hash of this.lastPasswords || []) {
    if (await bcrypt.compare(candidatePassword, hash)) return true;
  }
  return false;
};

userSchema.methods.compareAnswer = async function(canswer) {
  for (const sq of this.securityQuestions || []) {
    if (await bcrypt.compare(canswer.toLowerCase(), sq.answerHash)) return true;
  }
  return false;
};

userSchema.methods.isLocked = function() {
  return this.lockedUntil && this.lockedUntil > new Date();
};

userSchema.methods.lockAccount = function(duration = 30 * 60 * 1000) {
  this.failedLoginAttempts = 0;
  this.lockedUntil = new Date(Date.now() + duration);
};

userSchema.methods.unlockAccount = function() {
  this.failedLoginAttempts = 0;
  this.lockedUntil = undefined;
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.lastPasswords;
  delete user.refreshTokens;
  return user;
};

module.exports = mongoose.model('User', userSchema);