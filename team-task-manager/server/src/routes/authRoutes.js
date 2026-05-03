const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateSignup, validateLogin, validateForgotPassword, validateResetPassword, validateChangePassword, validateSecurityQuestions } = require('../validators/authValidator');
const { rateLimiter } = require('../middleware/rateLimiter');

router.post('/signup', validateSignup, authController.signup);
router.post('/login', rateLimiter(5, 15 * 60 * 1000), validateLogin, authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', rateLimiter(3, 60 * 60 * 1000), validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);
router.put('/change-password', authenticate, validateChangePassword, authController.changePassword);
router.put('/security-questions', authenticate, validateSecurityQuestions, authController.setSecurityQuestions);
router.post('/verify-security-questions', validateSecurityQuestions, authController.verifySecurityQuestions);
router.get('/me', authenticate, authController.getMe);

module.exports = router;