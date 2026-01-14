const express = require('express');
const router = express.Router();
const { createInscription, cancelInscription, getMyInscriptions } = require('../controllers/inscriptionController');
const { authenticateToken } = require('../middleware/auth');

router.get('/my', authenticateToken, getMyInscriptions);
router.post('/', authenticateToken, createInscription);
router.delete('/:id', authenticateToken, cancelInscription);

module.exports = router;
