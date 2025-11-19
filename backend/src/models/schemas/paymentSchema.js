const { mysqlTable, varchar, decimal, mysqlEnum, timestamp, text } = require('drizzle-orm/mysql-core');

const { users } = require('./userSchema');
const { events } = require('./eventSchema');

/**
 * SCHÉMA DE LA TABLE PAYMENTS
 * 
 * Gère les paiements pour les inscriptions aux événements
 */

const payments = mysqlTable('payments', {
    id: varchar('id', { length: 36}).primaryKey(),

    // Relations 
    user_id: varchar('user_id', {length: 36})
        .references(() => users.id)
        .notNull(),

    event_id: varchar('event_id', { length: 36 })
        .references(() => events.id)
        .notNull(),

    // Montant du paiement (jusqu'à 99999999.99)
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),

    // Status du paiement avec toutes les options possibles 
    status: mysqlEnum('status', [
        'pending',      // en attente
        'completed',    // payé avec succès 
        'failed',       // échec du paiement 
        'refunded',     // remboursé 
    ]).default('pending'), 

    // ✅ STRIPE - ID du PaymentIntent (pi_xxxxx)
    stripe_payment_intent_id: varchar('stripe_payment_intent_id', {length: 255}).unique(),

    // ✅ STRIPE - ID du Customer (cus_xxxxx) - Pour les clients récurrents
    stripe_customer_id: varchar('stripe_customer_id', {length: 255}),

    // ✅ STRIPE - ID du Charge (ch_xxxxx) - Pour le suivi détaillé
    stripe_charge_id: varchar('stripe_charge_id', {length: 255}),

    // Méthode de paiement utilisée 
    payment_method: mysqlEnum('payment_method', [
        'card',             // carte bancaire
        'bank_transfer',    // virement 
        'paypal',           // PayPal
    ]), 

    // ✅ STRIPE - Informations sur la carte (4 derniers chiffres, marque)
    card_last4: varchar('card_last4', {length: 4}),
    card_brand: varchar('card_brand', {length: 20}), // visa, mastercard, amex...

    // ✅ STRIPE - Message d'erreur en cas d'échec
    failure_message: text('failure_message'),

    // ✅ STRIPE - Raison du remboursement
    refund_reason: text('refund_reason'),

    // Timestamps
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow(),

    // Date du remboursement si applicable 
    refunded_at: timestamp('refunded_at'),
});

module.exports = { payments };
