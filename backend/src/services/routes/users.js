const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, getMyProfile, updateMyProfile } = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Routes pour l'utilisateur connecté
router.get('/me', authenticateToken, getMyProfile);
router.put('/me', authenticateToken, updateMyProfile);

// Routes admin
router.get('/', authenticateToken, authorizeRoles('admin'), getAllUsers);
router.get('/:id', authenticateToken, getUserById);

module.exports = router;
