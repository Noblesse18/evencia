
const { body, validationResult } = require('express-validator');

/**
 * Middleware pour gerer les erreurs de validation
 */

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
 * Règles de validation pour l'inscription
 */

const validateRegister = [
    // validation du nom
    body('name')
        .trim()
        .notEmpty().withMessage('le nom est requis')
        .isLength({ min: 2, max: 100 }).withMessage('le nom doit contenir entre 2 et 100 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('le nom contient des caracteres invalides'),
    
    // validation de l'email
    body('email')
        .trim()
        .notEmpty().withMessage('L\'email est requis')
        .isEmail().withMessage('Email invalide')
        .normalizeEmail()
        .custom(async (value) => {
            // verifier la blacklist de domaines jetables
            const disposableDomains = ['tempmail.com', 'throwaway.email'];
            const domain = value.split('@')[1];
            if (disposableDomains.includes(domain)){
                throw new Error('Les emails temporaires ne sont pas acceptes');
            }
            return true;
        }),
    
    // validation du mot de passe 
    body('password')
        .notEmpty().withMessage('le mot de passe est requis')
        .isLength({ min: 12 }).withMessage('le mot de passe doit contenir au moins 12 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage(
            'le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
        )
        .custom((value) => {
            // verifier les mots de passe trop communs
            const commonPasswords = ['Password123', 'Admin123', 'Azerty123'];
            if (commonPasswords.includes(value)) {
                throw new Error('Ce mot de passe est trop commun');
            }
            return true;
        }),
    // validation du role (optionnel)
    body('role')
        .optional()
        .isIn(['participant', 'organizer', 'admin'])
        .withMessage('Role invalide'),
    
    handleValidationErrors
];

/**
 * Regele de validation pour la connexion
 */
const validateLogin = [
    body('email')
        .trim() // supprime les espace, debut et fin 
        .notEmpty().withMessage('L\'email est requis') 
        .normalizeEmail(), // convertie tout en miniscule 
    
    body('password')
        .notEmpty().withMessage('le mot de passe est requis'),
    
    handleValidationErrors
];

/**
 * Regle de validation pour le changement de mot de passe
 */

const validatePasswordChange = [
    body('oldPassword')
        .notEmpty().withMessage('L\'ancien mot de passe est requis'),

    body('newPassword')
        .notEmpty().withMessage('Le nouveau mot de passe est requis')
        .isLength({ min: 12}).withMessage('le mot de passe doit contenir au moins 12 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage(
            'le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
        )
        .custom((value, { req }) => {
            if (value === req.body.oldPassword) {
                throw new Error('Le nouveau mot de passe doit etre different de l\'ancien');
            }
            return true;
        }),
    
    body('confirmPassword')
        .notEmpty().withMessage('La confirmation du mot de passe est requise')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('les mots de passe ne correspondent pas');
            }
            return true;
        }),
    
    handleValidationErrors

];

/**
 * Regles de validation pour la reinitialisation de mot de passe
 */

const validatePasswordReset = [
    body('email')
        .notEmpty().withMessage('L\'email est requis')
        .isEmail().withMessage('Email invalide')
        .normalizeEmail(),
    
    handleValidationErrors
];

module.exports = {
    validateRegister,
    validateLogin,
    validatePasswordChange,
    validatePasswordReset,
    handleValidationErrors
};
