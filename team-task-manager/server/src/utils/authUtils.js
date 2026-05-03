const jwt = require('jsonwebtoken');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_ACCESS_EXPIRE }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRE }
  );
};

const generateResetToken = () => {
  return uuidv4() + uuidv4();
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.JWT_REFRESH_SECRET);
};

const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('1 uppercase letter');
  if (!/[0-9]/.test(password)) errors.push('1 number');
  if (!/[!@#$%^&*]/.test(password)) errors.push('1 special character (!@#$%^&*)');
  return errors;
};

const validateEmail = (email) => {
  return /^\S+@\S+\.\S+$/.test(email);
};

const validateUsername = (username) => {
  return /^[a-zA-Z0-9_]{3,30}$/.test(username);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  verifyAccessToken,
  verifyRefreshToken,
  validatePassword,
  validateEmail,
  validateUsername
};