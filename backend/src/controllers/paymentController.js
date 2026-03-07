// src/controllers/paymentController.js
const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function createCheckoutSession(req, res, next) {
  try {
    const { event_id } = req.body;
    const user_id = req.user.userId;

    if (!event_id) {
      return res.status(400).json({ message: 'event_id requis' });
    }

    const [evRows] = await pool.execute(
      'SELECT id, title, price, max_tickets, event_date FROM events WHERE id = ?',
      [event_id]
    );
    if (!evRows.length) {
      return res.status(404).json({ message: 'Événement introuvable' });
    }

    const event = evRows[0];
    const price = parseFloat(event.price) || 0;

    if (price <= 0) {
      return res.status(400).json({ message: 'Cet événement est gratuit, utilisez l\'inscription directe' });
    }

    if (event.event_date && new Date(event.event_date) < new Date()) {
      return res.status(400).json({ message: 'Cet événement est déjà terminé' });
    }

    // Vérifier que l'utilisateur n'est pas déjà inscrit
    const [existingInscription] = await pool.execute(
      'SELECT id, status FROM inscriptions WHERE user_id = ? AND event_id = ?',
      [user_id, event_id]
    );
    if (existingInscription.length) {
      const ins = existingInscription[0];
      if (ins.status === 'confirmed') {
        return res.status(400).json({ message: 'Vous êtes déjà inscrit à cet événement' });
      }
      // Si pending, supprimer l'ancienne inscription pour en recréer une
      await pool.execute('DELETE FROM inscriptions WHERE id = ?', [ins.id]);
    }

    // Vérifier les places disponibles
    if (event.max_tickets) {
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as count FROM inscriptions WHERE event_id = ? AND status = "confirmed"',
        [event_id]
      );
      if (countResult[0].count >= event.max_tickets) {
        return res.status(400).json({ message: 'Plus de places disponibles' });
      }
    }

    // Créer l'inscription en pending
    const inscriptionId = uuidv4();
    await pool.execute(
      'INSERT INTO inscriptions (id, user_id, event_id, status) VALUES (?, ?, ?, ?)',
      [inscriptionId, user_id, event_id, 'pending']
    );

    if (!stripe) {
      // Mode dev sans Stripe : confirmer directement
      await pool.execute('UPDATE inscriptions SET status = "confirmed" WHERE id = ?', [inscriptionId]);
      return res.json({
        url: `${FRONTEND_URL}/events/${event_id}?payment=success`,
        warning: 'Stripe non configuré. Inscription confirmée directement.'
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: event.title,
            description: `Inscription à l'événement "${event.title}"`,
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      }],
      metadata: {
        event_id: String(event_id),
        user_id: String(user_id),
        inscription_id: String(inscriptionId),
      },
      success_url: `${FRONTEND_URL}/events/${event_id}?payment=success`,
      cancel_url: `${FRONTEND_URL}/events/${event_id}?payment=cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
}

async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    console.warn('Webhook reçu mais Stripe non configuré');
    return res.status(400).json({ message: 'Stripe non configuré' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Erreur vérification webhook:', err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { event_id, user_id, inscription_id } = session.metadata;

    try {
      // Confirmer l'inscription
      await pool.execute(
        'UPDATE inscriptions SET status = "confirmed" WHERE id = ?',
        [inscription_id]
      );

      // Enregistrer le paiement
      const paymentId = uuidv4();
      await pool.execute(
        `INSERT INTO payments (id, user_id, event_id, amount, status, stripe_payment_intent_id, payment_method)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          paymentId,
          user_id,
          event_id,
          (session.amount_total / 100).toFixed(2),
          'succeeded',
          session.payment_intent,
          'card',
        ]
      );

      console.log(`Paiement confirmé pour inscription ${inscription_id}`);
    } catch (err) {
      console.error('Erreur traitement webhook:', err);
      return res.status(500).json({ message: 'Erreur interne' });
    }
  }

  res.json({ received: true });
}

module.exports = { createCheckoutSession, handleWebhook };
