const { body, param, validationResult } = require('express-validator');

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
 * Validation pour creer une inscription
 */

const validateCreateInscription = [
    body('event_id')
        .notEmpty().withMessage('L\'ID de l\'evenement est requis')
        .isUUID().withMessage('ID d\'evenement invalide'),
    
    handleValidationErrors
];

/**
 * Validation pour annuler une inscription
 */

const validateCancelInscription = [
    param('id')
        .isUUID().withMessage('ID d\'inscription invalide'),
    
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('La raison ne peut pas depasser 500 caracteres'),
    
    handleValidationErrors
];

/**
 * validation pour recuperer les participants d'un evenement
 */

const validateGetEventParticipants = [
    param('eventId')
        .isUUID().withMessage('ID d\'evenement invalide'),
    
    handleValidationErrors
];

/**
 * validation pour envoyer un rappel
 */

const validateSendReminder = [
    body('event_id')
        .notEmpty().withMessage('L\'ID de l\'evenement est requis')
        .isUUID().withMessage('ID d\'evenement invalide'),
    
    body('message')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Le message ne peut pas depasser 1000 caracteres'),
    
    handleValidationErrors
];

module.exports = {
    validateCreateInscription,
    validateCancelInscription,
    validateGetEventParticipants,
    validateSendReminder,
    handleValidationErrors
};

