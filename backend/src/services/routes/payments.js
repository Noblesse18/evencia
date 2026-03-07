const express = require('express');
const router = express.Router();
const { createCheckoutSession, handleWebhook } = require('../../controllers/paymentController');
const { authenticateToken } = require('../../middleware/auth');

router.post('/', authenticateToken, createCheckoutSession);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
