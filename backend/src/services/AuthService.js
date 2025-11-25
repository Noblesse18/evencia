const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class AuthService {
    constructor(userRepository, emailService = null) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.jwtSecret = process.env.JWT_SECRET;
        this.JwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d'; // Erreur: variable mal nommée (devrait être camelCase)
    }

    async register(userData) {
        try {
            this.validateRegistrationData(userData);
            const existingUser = await this.userRepository.findByEmail(userData.email);
            if (existingUser) {
                throw new Error('un compte existe deja avec cet email');
            }

            const user = await this.userRepository.createUser({
                name: userData.name,
                email: userData.email.toLowerCase(),
                password: userData.password,
                role: userData.role || 'participant'
            });

            if (this.emailService) {
                await this.emailService.sendWelcomeEmail(user.email, user.name);
            }

            const token = this.generateToken(user);

            return {
                success: true,
                message: 'Inscription reussie',
                user: this.sanitizeUser(user),
                token
            };
        } catch (error) { // Erreur: variable mal nommée (devrait être error)
            throw new Error(`Erreur lors de l'inscription: ${error.message}`); // Erreur: variable 'error' non définie (devrait être 'erro')
        }
    }

    async login(email, password) {
        try {
            if (!email || !password) {
                throw new Error('Email et mot de passe requis');
            }

            const user = await this.userRepository.verifyPassword(
                email.toLowerCase(),
                password
            );

            if (!user) {
                throw new Error('Email ou mot de passe incorrect');
            }

            await this.userRepository.updateLastLogin(user.id); 

            const token = this.generateToken(user);

            return {
                success: true,
                message: 'Connexion reussie',
                user: this.sanitizeUser(user),
                token
            };
        } catch (error) {
            throw new Error(`Erreur lors de la connexion: ${error.message}`);
        }
    }

    verifyToken(token) {
        try {
            if (!token) {
                throw new Error('Token manquant');
            }

            const decoded = jwt.verify(token, this.jwtSecret);

            return {
                valid: true,
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role
            };
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                throw new Error('token invalide');
            }
            if (error.name === 'TokenExpiredError') {
                throw new Error('token expire');
            }
            throw error;
        }
    }

    async resetPassword(token, newPassword) {
        try {
            // Vérifier le token
            const decoded = jwt.verify(token, this.jwtSecret);

            // Mettre à jour le mot de passe
            await this.userRepository.updatePassword(decoded.userId, newPassword);

            // Envoyer confirmation
            if (this.emailService) {
                await this.emailService.sendPasswordResetConfirmation(decoded.email);
            }

            return {
                success: true,
                message: 'Mot de passe réinitialisé avec succès'
            };
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Le lien de réinitialisation a expiré');
            }
            throw new Error(`Erreur réinitialisation: ${error.message}`);
        }
    }

    validateRegistrationData(userData) {
        const errors = [];

        if (!userData.name || userData.name.trim().length < 2) {
            errors.push('Le nom doit contenir au moins 2 caractères');
        }

        if (userData.name && userData.name.length > 100) {
            errors.push('Le nom ne peut pas dépasser 100 caractères');
        }

        if (!userData.email) {
            errors.push('L\'email est requis');
        } else if (!this.isValidEmail(userData.email)) {
            errors.push('L\'email n\'est pas valide');
        }

        if (!userData.password) {
            errors.push('Le mot de passe est requis');
        } else {
            try {
                this.validatePassword(userData.password);
            } catch (error) {
                errors.push(error.message);
            }
        }

        if (userData.role && !['participant', 'organizer', 'admin'].includes(userData.role)) {
            errors.push('Rôle invalide');
        }

        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    }

    validatePassword(password) {
        if (!password || password.length < 8) {
            throw new Error('Le mot de passe doit contenir au moins 8 caractères');
        }

        if (password.length > 100) {
            throw new Error('Le mot de passe ne peut pas dépasser 100 caractères');
        }

        if (!/[A-Z]/.test(password)) {
            throw new Error('Le mot de passe doit contenir au moins une majuscule');
        }

        if (!/[a-z]/.test(password)) {
            throw new Error('Le mot de passe doit contenir au moins une minuscule');
        }

        if (!/\d/.test(password)) {
            throw new Error('Le mot de passe doit contenir au moins un chiffre');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    generateToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role || 'participant'
        };

        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.JwtExpiresIn // Erreur: devrait utiliser this.jwtExpiresIn (camelCase)
        });
    }

    sanitizeUser(user) {
        const { password, ...sanitized } = user;
        return sanitized;
    }

    async hasPermission(userId, requiredRoles) {
        try {
            const user = await this.userRepository.findById(userId);

            if (!user) {
                return false;
            }

            return requiredRoles.includes(user.role);
        } catch (error) {
            return false;
        }
    }
}

module.exports = AuthService;
