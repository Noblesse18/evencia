
const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Erreurs de validation',
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * Validation pour creer une intention de paiement
 */

const validateCreatePayment = [
    body('event_id')
        .notEmpty().withMessage('L\'ID de l\'evenement est requis')
        .isUUID().withMessage('ID d\'evenement invalide'),
    
    body('payment_method')
        .optional()
        .isIn(['card', 'bank_transfer', 'paypal'])
        .withMessage('Methode de paiement invalide'),
    
    handleValidationErrors
];

/**
 * Validation pour confirmer un paiement
 */

const validateConfirmPayment = [
    body('payment_intent_id')
        .notEmpty().withMessage('L\'ID de l\'intention de paiement est requis')
        .matches(/^pi_[a-zA-Z0-9]+$/).withMessage('Format d\'ID Stripe invalide'),
    
    handleValidationErrors
];

/**
 * Validation pour un remboursement
 */

const validateRefund = [
    param('id')
        .isUUID().withMessage('ID de paiement invalide'),
    
    body('reason')
        .notEmpty().withMessage('La raison du remboursement est requise')
        .isIn(['requested_by_customer', 'duplicate', 'fraudulent', 'event_cancelled'])
        .withMessage('Raison de remboursement invalide'),
    
    body('amount')
        .optional()
        .isFloat({ min: 0.01 }).withMessage('Le montant du remboursement doit etre positif'),
    
    handleValidationErrors
];

/**
 * Validation pour recuperer l'historique des paiements 
 */

const validatePaymentHistory = [
    query('startDate')
        .optional()
        .isISO8601().withMessage('Date de debut invalide'),
    
    query('endDate')
        .optional()
        .isISO8601().withMessage('Date de fin invalide'),
    
    query('status')
        .optional()
        .isIn(['pending', 'completed', 'failed', 'refunded'])
        .withMessage('Statut invalide'),
    
    handleValidationErrors
];

/**
 * validation pour le webhook stripe 
 */

const validateStripeWebhook = [
    body('id')
        .notEmpty().withMessage('ID d\'evenement Stripe requis'),
    
    body('type')
        .notEmpty().withMessage('Type d\'evenement requis'),
    
    body('data')
        .notEmpty().withMessage('Donnees de l\'evenement requises'),
    
    handleValidationErrors
];

module.exports = {
    validateCreatePayment,
    validateConfirmPayment, 
    validateRefund, 
    validatePaymentHistory,
    validateStripeWebhook,
    handleValidationErrors
};