const express = require('express');
const router = express.Router();
const { createPaymentIntent } = require('../../controllers/paymentController');
const { authenticateToken } = require('../../middleware/auth');

router.post('/', authenticateToken, createPaymentIntent);

module.exports = router;
