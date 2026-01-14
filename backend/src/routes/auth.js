const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const {
    validateRegister,
    validateLogin,
    validatePasswordChange,
    validatePasswordReset
} = require('../validators/authValidator');


// Appliquer les validators avant le controleur

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/change-password', authenticateToken, validatePasswordChange, authController.changePassword);
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', validatePasswordReset, authController.resetPassword);
router.get('/verify', authController.verifyToken);


module.exports = router;

