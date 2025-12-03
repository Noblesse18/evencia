
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
 * validation pour recuperer un utilisateur par ID
 */

const validateGetUser = [
    param('id')
        .isUUID().withMessage('ID d\'utilisateur invalide'),
    
    handleValidationErrors
];

/**
 * validation pour mettre a jour un profil utilisateur
 */

const validateUpdateProfile = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caracteres'),

    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Email invalide')
        .normalizeEmail(),
    
    body('phone')
        .optional()
        .trim()
        .matches(/^(\+33|0)[1-9]([\s\-]?\d{2}){4}$/)
            .withMessage('Numéro de téléphone invalide. Formats acceptés : 0612345678, +33612345678, 01-23-45-67-89'),
    
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('La bio ne peut pas depasser 500 caracteres'),
    
    body('avatar')
        .optional()
        .isURL().withMessage('URL d\'avatar invalide'),
    
    handleValidationErrors
];

/**
 * validation pour la liste des utilisateurs (admin)
 */

const validateListUsers = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Le numero de page doit etre un entier positif'),
    
    query('limit')
        .optional()
        .isInt({ min: 1 }).withMessage('Le numero de page doit etre un entier positif'),

    query('role')
        .optional()
        .isIn(['participant', 'organizer', 'admin'])
        .withMessage('Role invalide'),
    
    query('search')
        .optional()
        .trim()
        .isLength({ min: 2 }).withMessage('Le terme de recherche doit contenir au moins 2 caracteres'),
    
    handleValidationErrors
];

/**
 * validation pour changer le role d'un utilisateur (admin)
 */

const validateChangeRole = [
    param('id')
        .isUUID().withMessage('ID d\'utilisateur invalide'),
    
    body('role')
        .notEmpty().withMessage('le role est requis')
        .isIn(['participant', 'organizer', 'admin'])
        .withMessage('Role invalide'),
    
    handleValidationErrors
];

/**
 * validation pour supprimer un utilisateur (admin)
 */

const validateDeleteUser = [
    param('id')
        .isUUID().withMessage('ID d\'utilisateur invalide'),
    
    body('confirm')
        .notEmpty().withMessage('Confirmation requise')
        .equals('true').withMessage('Vous devez confirmer la suppression'),
    
    handleValidationErrors
];

module.exports = {
    validateGetUser,
    validateUpdateProfile,
    validateListUsers,
    validateChangeRole,
    validateDeleteUser,
    handleValidationErrors
};

