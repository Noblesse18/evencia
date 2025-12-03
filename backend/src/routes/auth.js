const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const {
    validateRegister,
    validateLogin,
    validatePasswordChange,
    validatePasswordReset
} = require('../validators/authValidator');


// Appliquer les validators avant le controleur

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/change-password', validatePasswordChange, authController.changePassword);
//router.post('/reset-password', validatePasswordReset, authController.resetPassword);


module.exports = router;

