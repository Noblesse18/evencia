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
 * Validation pour la creation d'un evenement
 */

const validationCreateEvent = [
    body('title')
        .trim() // supprime espace vide
        .notEmpty().withMessage('Le titre est requis')
        .isLength({ min: 3, max: 200 }).withMessage('Le titre doit contenir entre 3 et 200 caracteres'),
    
    body('description')
        .trim()
        .notEmpty().withMessage('La description est requise')
        .isLength({ min: 10, max: 2000 }).withMessage('La description doit contenir entre 10 et 2000 caracteres'),
    
    body('location')
        .trim()
        .notEmpty().withMessage('Le lieu est requis')
        .isLength({ max: 500 }).withMessage('Le lieu ne peut pas depasser 500 caracteres'),
    
    body('event_date')
        .notEmpty().withMessage('La date de l\'evenement est requise')
        .isISO8601().withMessage('Date invalide')
        .custom((value) => {
            if (new Date(value) < new Date()) {
                throw new Error('La date de l\'evenement ne peut pas etre dans le passe');
                }
                return true;
            }),
    
    body('price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Le prix doit etre un nombre positif')
        .custom((value) => {
            // verifier que le prix a maximun 2 decimales
            if (value && !(/^\d+(\.\d{1,2})?$/.test(value.toString()))) {
                throw new Error('Le prix ne peut avoir que 2 decimales maximum');
            }
            return true;
        }),

    body('photo.*.url')
        .optional()
        .isURL().withMessage('url de photo invalide'),
    
    handleValidationErrors
];

/**
 * Validation pour la mise a jour d'un evenement 
 */

const validateUpdateEvent = [
    param('id')
        .isUUID().withMessage('ID d\'evenement invalide'),
    
    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 }).withMessage('Le titre doit contenir entre 3 et 200 caracteres'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ min: 10, max: 2000 }).withMessage('La description doit contenir entre 10 et 2000 caracteres'),
    
    body('location')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Le lieu ne peut pas depasser 500 caracteres'),
    
    body('event_date')
        .optional()
        .isISO8601().withMessage('Date invalide')
        .custom((value) => {
            if (new Date(value) < new Date()) {
                throw new Error('La date de l\'evenement ne peut pas etre dans le passe');
            }
            return true;
        }),
    
    body('price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Le prix doit etre un nombre positif'),
    
    handleValidationErrors
];

/**
 * Validation pour recuperer un evenement 
 */

const validateGetEvent = [
    param('id')
        .isUUID().withMessage('ID d\'evenement invalide'),
    
    handleValidationErrors
];

/**
 * Validation pour supprimer un evenement
 */

const validateDeleteEvent = [
    param('id')
        .isUUID().withMessage('ID d\'evenement invalide'),
    
    handleValidationErrors
];


/**
 * Validation pour la liste des evenements avec filtres
 */

const validateListEvents = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Le numero de page doit etre un entier positif'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('La limite doit etre entre 1 et 100'),
    
    query('startDate')
        .optional()
        .isISO8601().withMessage('Date de debut invalide'),
    
    query('endDate')
        .optional()
        .isISO8601().withMessage('Date de fin invalide')
        .custom((value, { req }) => {
            if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
                throw new Error('La date de fin doit etre apres la date de debut');
            }
            return true;
        }),
    
    query('minPrice')
        .optional()
        .isFloat({ min: 0}).withMessage('Le prix minimum doit etre positif'),
    
    query('maxPrice')
        .optional()
        .isFloat({ min: 0 }).withMessage('Le prix maximum doit etre positif')
        .custom((value, { req }) => {
            if (req.query.minPrice && parseFloat(value) < parseFloat(req.query.minPrice)) {
                throw new Error('Le prix maximun doit etre superieur au prix minimum');
            }
            return true;
        }),
    
    query('location')
        .optional()
        .trim()
        .isLength({ min: 2 }).withMessage('Le lieu de recherche doit contenir au moins 2 caracteres'),
    
    query('search')
        .optional()
        .trim()
        .isLength({ min: 2 }).withMessage('Le terme de recherche doit contenir au moins 2 caracteres'),
    
    handleValidationErrors
];

module.exports = {
    validationCreateEvent,
    validateUpdateEvent,
    validateGetEvent,
    validateDeleteEvent,
    validateListEvents,
    handleValidationErrors
};
