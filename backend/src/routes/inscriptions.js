const express = require('express');
const router = express.Router();
const { createInscription, cancelInscription } = require('../controllers/inscriptionController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, createInscription);
router.delete('/:id', authenticateToken, cancelInscription);

module.exports = router;
