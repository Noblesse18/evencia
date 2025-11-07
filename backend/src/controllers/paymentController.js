// src/controllers/paymentController.js
const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');

async function createPaymentIntent(req, res, next) {
  try {
    const { event_id } = req.body;
    const user_id = req.user.userId;

    const [evRows] = await pool.execute('SELECT id, price FROM events WHERE id = ?', [event_id]);
    if (!evRows.length) return res.status(404).json({ message: 'Événement introuvable' });
    const price = evRows[0].price || 0;

    if (!process.env.STRIPE_SECRET_KEY) {
      const newPaymentId = uuidv4();
      await pool.execute('INSERT INTO payments (id, user_id, event_id, amount, status) VALUES (?,?,?,?,?)',
        [newPaymentId, user_id, event_id, price, 'pending']);
      const [rows] = await pool.execute('SELECT * FROM payments WHERE id = ?', [newPaymentId]);
      return res.json({ payment: rows[0], warning: 'Stripe non configuré. Ceci est un test local.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(price * 100),
      currency: 'eur',
      metadata: { event_id: String(event_id), user_id: String(user_id) },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) { next(err); }
}

module.exports = { createPaymentIntent };