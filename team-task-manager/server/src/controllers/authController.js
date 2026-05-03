const User = require('../models/User');
const Activity = require('../models/Activity');
const crypto = require('crypto');
const { generateAccessToken, generateRefreshToken, validatePassword, validateEmail, verifyRefreshToken } = require('../utils/authUtils');
const config = require('../config');
const bcrypt = require('bcryptjs');

const sendResetEmail = async (email, resetToken) => {
  console.log(`\n========== PASSWORD RESET EMAIL ==========`);
  console.log(`To: ${email}`);
  console.log(`Reset Token: ${resetToken}`);
  console.log(`Valid for: 15 minutes`);
  console.log(`============================================\n`);
};

exports.signup = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }
    
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain: ' + passwordErrors.join(', ')
      });
    }
    
    const user = new User({ username, email, password, role: role || 'member' });
    await user.save();
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    user.refreshTokens.push({ token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), userAgent: req.get('User-Agent') });
    await user.save();
    
    res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    await Activity.create({ user: user._id, action: 'user_created', targetType: 'user', targetId: user._id, ipAddress: req.ip });
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user: user.toJSON(), accessToken, refreshToken }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    if (user.isLocked()) {
      return res.status(403).json({
        success: false,
        message: `Account locked. Try again after ${new Date(user.lockedUntil).toLocaleTimeString()}`
      });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockAccount(30 * 60 * 1000);
        await user.save();
        return res.status(403).json({ success: false, message: 'Account locked for 30 minutes due to too many failed attempts' });
      }
      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    user.failedLoginAttempts = 0;
    user.unlockAccount();
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    user.refreshTokens.push({ token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), userAgent: req.get('User-Agent') });
    await user.save();
    
    res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    await Activity.create({ user: user._id, action: 'user_login', targetType: 'auth', targetId: user._id, ipAddress: req.ip });
    
    res.json({
      success: true,
      message: 'Login successful',
      data: { user: user.toJSON(), accessToken, refreshToken }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (req.user && refreshToken) {
      req.user.refreshTokens = req.user.refreshTokens.filter(t => t.token !== refreshToken);
      await req.user.save();
      
      await Activity.create({ user: req.user._id, action: 'user_logout', targetType: 'auth', targetId: req.user._id, ipAddress: req.ip });
    }
    
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

exports.logoutAll = async (req, res) => {
  try {
    if (req.user) {
      req.user.refreshTokens = [];
      await req.user.save();
      
      await Activity.create({ user: req.user._id, action: 'user_logout', targetType: 'auth', targetId: req.user._id, details: { action: 'logout_all' }, ipAddress: req.ip });
    }
    
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out from all devices' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    }
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    
    sendResetEmail(user.email, resetToken);
    
    res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Request failed' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const user = await User.findOne({ resetToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    
    if (user.resetTokenExpires < new Date()) {
      user.resetToken = undefined;
      user.resetTokenExpires = undefined;
      await user.save();
      return res.status(400).json({ success: false, message: 'Token expired' });
    }
    
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain: ' + passwordErrors.join(', ')
      });
    }
    
    const usedBefore = await user.comparePreviousPassword(newPassword);
    if (usedBefore) {
      return res.status(400).json({ success: false, message: 'Cannot reuse last 5 passwords' });
    }
    
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    user.refreshTokens = [];
    await user.save();
    
    await Activity.create({ user: user._id, action: 'password_reset', targetType: 'auth', targetId: user._id, ipAddress: req.ip });
    
    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Reset failed' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain: ' + passwordErrors.join(', ')
      });
    }
    
    const usedBefore = await user.comparePreviousPassword(newPassword);
    if (usedBefore) {
      return res.status(400).json({ success: false, message: 'Cannot reuse last 5 passwords' });
    }
    
    user.password = newPassword;
    user.refreshTokens = [];
    await user.save();
    
    await Activity.create({ user: user._id, action: 'password_changed', targetType: 'auth', targetId: user._id, ipAddress: req.ip });
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Password change failed' });
  }
};

exports.setSecurityQuestions = async (req, res) => {
  try {
    const { questions } = req.body;
    
    const user = await User.findById(req.user._id);
    
    for (const sq of questions) {
      sq.answerHash = await bcrypt.hash(sq.answer.toLowerCase(), 10);
    }
    
    user.securityQuestions = questions.map(sq => ({
      question: sq.question,
      answerHash: sq.answerHash
    }));
    await user.save();
    
    res.json({ success: true, message: 'Security questions set successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to set security questions' });
  }
};

exports.verifySecurityQuestions = async (req, res) => {
  try {
    const { email, answers } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ success: true, message: 'If the user exists, answers have been verified' });
    }
    
    const correctAnswers = await Promise.all(
      answers.map(ans => user.compareAnswer(ans))
    );
    
    if (correctAnswers.some(r => !r)) {
      return res.status(400).json({ success: false, message: 'Incorrect answers' });
    }
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    
    res.json({ success: true, message: 'Verification successful', data: { resetToken } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.headers['x-refresh-token'] || req.cookies.refreshToken || req.body.refreshToken || req.query.refreshToken;
    
    console.log('Refresh token attempt, header:', !!req.headers['x-refresh-token'], 'cookie:', !!req.cookies.refreshToken, 'body:', !!req.body.refreshToken, 'query:', !!req.query.refreshToken);
    
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }
    
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      console.log('Invalid token format');
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log('User not found for refresh token');
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    
    const tokenRecord = user.refreshTokens.find(t => t.token === refreshToken);
    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      console.log('Token expired or not found');
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    
    const accessToken = generateAccessToken(user);
    console.log('Token refreshed for user:', user.username);
    
    res.json({ success: true, data: { accessToken } });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, data: { user: req.user.toJSON() } });
};