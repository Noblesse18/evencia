# TP03 - Architecture Backend MVC + Repository

## 🎯 Objectifs

- Comprendre le pattern MVC (Model-View-Controller)
- Implémenter le pattern Repository pour l'accès aux données
- Créer une couche Service pour la logique métier
- Comprendre la séparation des responsabilités

**Durée estimée :** 2 heures

---

## 📋 Prérequis

- TP01 et TP02 terminés
- Modèles Sequelize fonctionnels

---

## Comprendre l'Architecture

### Flux d'une requête

```
CLIENT (Navigateur/Postman)
        │
        ▼
┌───────────────────┐
│      ROUTES       │  → Définit les endpoints URL
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│    MIDDLEWARES    │  → Auth, Validation, Rate Limiting
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   CONTROLLERS     │  → Reçoit la requête, envoie la réponse
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│     SERVICES      │  → Logique métier, règles de gestion
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   REPOSITORIES    │  → Accès aux données (requêtes DB)
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│      MODELS       │  → Définition des entités (Sequelize)
└─────────┬─────────┘
          │
          ▼
      DATABASE
```

### Responsabilités de chaque couche

| Couche | Responsabilité | Ne fait PAS |
|--------|---------------|-------------|
| **Controller** | Recevoir/envoyer HTTP | Logique métier |
| **Service** | Règles métier | Requêtes SQL directes |
| **Repository** | Accès aux données | Logique métier |
| **Model** | Structure des données | Logique applicative |

---

## Étape 1 : Créer le Repository User

### 1.1 Créer src/repositories/UserRepository.js

```javascript
import { User, RefreshToken } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Repository pour l'accès aux données utilisateurs
 * Centralise toutes les requêtes à la base de données
 */
class UserRepository {
  /**
   * Trouver un utilisateur par son ID
   * @param {string} id - UUID de l'utilisateur
   * @returns {Promise<User|null>}
   */
  async findById(id) {
    return User.findByPk(id);
  }

  /**
   * Trouver un utilisateur par son email
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    return User.findOne({ 
      where: { email: email.toLowerCase() } 
    });
  }

  /**
   * Trouver par token de vérification d'email
   * @param {string} token - Token de vérification
   * @returns {Promise<User|null>}
   */
  async findByVerificationToken(token) {
    return User.findOne({ 
      where: { verification_token: token } 
    });
  }

  /**
   * Trouver par token de reset de mot de passe
   * @param {string} token - Token de reset
   * @returns {Promise<User|null>}
   */
  async findByResetToken(token) {
    return User.findOne({
      where: {
        reset_password_token: token,
        // Vérifier que le token n'est pas expiré
        reset_password_expires: { [Op.gt]: new Date() },
      },
    });
  }

  /**
   * Créer un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur
   * @returns {Promise<User>}
   */
  async create(userData) {
    return User.create({
      email: userData.email.toLowerCase(),
      password_hash: userData.passwordHash,
      full_name: userData.fullName,
      role: userData.role || 'USER',
      verification_token: userData.verificationToken,
      is_verified: userData.isVerified || false,
    });
  }

  /**
   * Mettre à jour un utilisateur
   * @param {string} id - ID de l'utilisateur
   * @param {Object} updates - Données à mettre à jour
   * @returns {Promise<User|null>}
   */
  async update(id, updates) {
    const user = await User.findByPk(id);
    if (!user) return null;

    // Liste des champs autorisés à être modifiés
    const allowedUpdates = [
      'full_name',
      'bio',
      'avatar_url',
      'email',
      'password_hash',
      'role',
      'is_verified',
      'verification_token',
      'reset_password_token',
      'reset_password_expires',
    ];

    // Filtrer les updates pour ne garder que les champs autorisés
    const filteredUpdates = {};
    for (const key of Object.keys(updates)) {
      // Convertir camelCase en snake_case si nécessaire
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      if (allowedUpdates.includes(snakeKey)) {
        filteredUpdates[snakeKey] = updates[key];
      } else if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    }

    await user.update(filteredUpdates);
    return user;
  }

  /**
   * Supprimer un utilisateur
   * @param {string} id - ID de l'utilisateur
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const user = await User.findByPk(id);
    if (!user) return false;
    await user.destroy();
    return true;
  }

  /**
   * Lister les utilisateurs avec pagination et filtres
   * @param {Object} options - Options de requête
   * @returns {Promise<Object>}
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      role,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = options;

    const where = {};

    // Filtre par rôle
    if (role) {
      where.role = role;
    }

    // Recherche textuelle
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit,
      offset: (page - 1) * limit,
      // Exclure les données sensibles
      attributes: { 
        exclude: ['password_hash', 'verification_token', 'reset_password_token'] 
      },
    });

    return {
      users: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Vérifier si un email existe déjà
   * @param {string} email - Email à vérifier
   * @returns {Promise<boolean>}
   */
  async emailExists(email) {
    const count = await User.count({ 
      where: { email: email.toLowerCase() } 
    });
    return count > 0;
  }

  // ==========================================
  // GESTION DES REFRESH TOKENS
  // ==========================================

  /**
   * Stocker un refresh token
   * @param {Object} tokenData - Données du token
   * @returns {Promise<RefreshToken>}
   */
  async storeRefreshToken(tokenData) {
    return RefreshToken.create({
      user_id: tokenData.userId,
      token_hash: tokenData.tokenHash,
      expires_at: tokenData.expiresAt,
      user_agent: tokenData.userAgent,
      ip_address: tokenData.ipAddress,
    });
  }

  /**
   * Trouver un refresh token par son hash
   * @param {string} tokenHash - Hash du token
   * @returns {Promise<RefreshToken|null>}
   */
  async findRefreshToken(tokenHash) {
    return RefreshToken.findOne({
      where: {
        token_hash: tokenHash,
        revoked: false,
        expires_at: { [Op.gt]: new Date() },
      },
    });
  }

  /**
   * Révoquer un refresh token
   * @param {string} tokenHash - Hash du token
   * @returns {Promise<RefreshToken|null>}
   */
  async revokeRefreshToken(tokenHash) {
    const token = await RefreshToken.findOne({ 
      where: { token_hash: tokenHash } 
    });
    if (token) {
      await token.update({ revoked: true });
    }
    return token;
  }

  /**
   * Révoquer tous les tokens d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<number>} Nombre de tokens révoqués
   */
  async revokeAllUserTokens(userId) {
    const [affectedCount] = await RefreshToken.update(
      { revoked: true },
      { where: { user_id: userId } }
    );
    return affectedCount;
  }

  /**
   * Nettoyer les tokens expirés
   * @returns {Promise<number>} Nombre de tokens supprimés
   */
  async cleanupExpiredTokens() {
    return RefreshToken.destroy({
      where: {
        [Op.or]: [
          { expires_at: { [Op.lt]: new Date() } },
          { revoked: true },
        ],
      },
    });
  }
}

// Exporter une instance unique (Singleton)
export default new UserRepository();
```

---

## Étape 2 : Créer le Repository Event

### 2.1 Créer src/repositories/EventRepository.js

```javascript
import { Event, User, Inscription } from '../models/index.js';
import { Op } from 'sequelize';

class EventRepository {
  /**
   * Trouver un événement par ID avec l'organisateur
   * @param {string} id - UUID de l'événement
   * @returns {Promise<Event|null>}
   */
  async findById(id) {
    return Event.findByPk(id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'full_name', 'email', 'avatar_url'],
        },
      ],
    });
  }

  /**
   * Créer un événement
   * @param {Object} eventData - Données de l'événement
   * @returns {Promise<Event>}
   */
  async create(eventData) {
    return Event.create({
      organizer_id: eventData.organizerId,
      title: eventData.title,
      description: eventData.description,
      location: eventData.location,
      start_datetime: eventData.startDatetime,
      end_datetime: eventData.endDatetime,
      capacity: eventData.capacity || 100,
      price: eventData.price || 0,
      currency: eventData.currency || 'EUR',
      status: eventData.status || 'DRAFT',
      image_url: eventData.imageUrl,
      tags: eventData.tags || [],
    });
  }

  /**
   * Mettre à jour un événement
   * @param {string} id - ID de l'événement
   * @param {Object} updates - Données à mettre à jour
   * @returns {Promise<Event|null>}
   */
  async update(id, updates) {
    const event = await Event.findByPk(id);
    if (!event) return null;
    await event.update(updates);
    return event;
  }

  /**
   * Supprimer un événement
   * @param {string} id - ID de l'événement
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const event = await Event.findByPk(id);
    if (!event) return false;
    await event.destroy();
    return true;
  }

  /**
   * Lister les événements avec filtres et pagination
   * @param {Object} options - Options de requête
   * @returns {Promise<Object>}
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      location,
      minPrice,
      maxPrice,
      startDate,
      endDate,
      organizerId,
      sortBy = 'start_datetime',
      sortOrder = 'asc',
      includeUnpublished = false,
    } = options;

    const where = {};

    // Filtrer par statut
    if (status) {
      where.status = status;
    } else if (!includeUnpublished) {
      where.status = 'PUBLISHED';
    }

    // Filtrer par organisateur
    if (organizerId) {
      where.organizer_id = organizerId;
    }

    // Recherche textuelle
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
      ];
    }

    // Filtrer par localisation
    if (location) {
      where.location = { [Op.like]: `%${location}%` };
    }

    // Filtrer par prix
    if (minPrice !== undefined) {
      where.price = { ...where.price, [Op.gte]: minPrice };
    }
    if (maxPrice !== undefined) {
      where.price = { ...where.price, [Op.lte]: maxPrice };
    }

    // Filtrer par date
    if (startDate) {
      where.start_datetime = { ...where.start_datetime, [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      where.start_datetime = { ...where.start_datetime, [Op.lte]: new Date(endDate) };
    }

    const { count, rows } = await Event.findAndCountAll({
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: Math.min(limit, 100), // Maximum 100 résultats
      offset: (page - 1) * limit,
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'full_name', 'avatar_url'],
        },
      ],
    });

    return {
      events: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Incrémenter le nombre de participants
   * @param {string} id - ID de l'événement
   * @returns {Promise<Event|null>}
   */
  async incrementParticipants(id) {
    const event = await Event.findByPk(id);
    if (!event) return null;
    await event.increment('current_participants');
    await event.reload();
    return event;
  }

  /**
   * Décrémenter le nombre de participants
   * @param {string} id - ID de l'événement
   * @returns {Promise<Event|null>}
   */
  async decrementParticipants(id) {
    const event = await Event.findByPk(id);
    if (!event || event.current_participants <= 0) return null;
    await event.decrement('current_participants');
    await event.reload();
    return event;
  }
}

export default new EventRepository();
```

---

## Étape 3 : Créer les Services

### 3.1 Créer src/services/UserService.js

```javascript
import UserRepository from '../repositories/UserRepository.js';
import { hashPassword, comparePassword } from '../utils/hash.util.js';
import { ApiError } from '../middlewares/error.middleware.js';
import logger from '../config/logger.js';

/**
 * Service pour la logique métier des utilisateurs
 * Contient les règles de gestion et validations métier
 */
class UserService {
  /**
   * Obtenir le profil d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>}
   */
  async getProfile(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }
    return user.toPublicJSON();
  }

  /**
   * Mettre à jour le profil
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} updates - Données à mettre à jour
   * @returns {Promise<Object>}
   */
  async updateProfile(userId, updates) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    // Vérifier si l'email est modifié et déjà utilisé
    if (updates.email && updates.email !== user.email) {
      const emailExists = await UserRepository.emailExists(updates.email);
      if (emailExists) {
        throw ApiError.conflict('Email already in use', 'EMAIL_EXISTS');
      }
    }

    // Filtrer les champs autorisés pour la mise à jour du profil
    const allowedUpdates = {
      full_name: updates.fullName,
      bio: updates.bio,
      email: updates.email,
    };

    // Supprimer les valeurs undefined
    Object.keys(allowedUpdates).forEach((key) => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });

    const updatedUser = await UserRepository.update(userId, allowedUpdates);
    
    logger.info(`Profile updated for user: ${userId}`);
    return updatedUser.toPublicJSON();
  }

  /**
   * Changer le mot de passe
   * @param {string} userId - ID de l'utilisateur
   * @param {string} currentPassword - Mot de passe actuel
   * @param {string} newPassword - Nouveau mot de passe
   * @returns {Promise<Object>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    // Vérifier le mot de passe actuel
    const isValid = await comparePassword(currentPassword, user.password_hash);
    if (!isValid) {
      throw ApiError.unauthorized('Current password is incorrect', 'INVALID_PASSWORD');
    }

    // Vérifier que le nouveau mot de passe est différent
    if (currentPassword === newPassword) {
      throw ApiError.badRequest(
        'New password must be different from current password',
        'SAME_PASSWORD'
      );
    }

    // Hasher et sauvegarder le nouveau mot de passe
    const passwordHash = await hashPassword(newPassword);
    await UserRepository.update(userId, { password_hash: passwordHash });

    // Révoquer tous les refresh tokens pour forcer la reconnexion
    await UserRepository.revokeAllUserTokens(userId);

    logger.info(`Password changed for user: ${userId}`);
    return { message: 'Password changed successfully' };
  }

  /**
   * Mettre à jour l'avatar
   * @param {string} userId - ID de l'utilisateur
   * @param {string} avatarUrl - URL de l'avatar
   * @returns {Promise<Object>}
   */
  async updateAvatar(userId, avatarUrl) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    await UserRepository.update(userId, { avatar_url: avatarUrl });
    
    logger.info(`Avatar updated for user: ${userId}`);
    return { avatarUrl };
  }

  /**
   * Lister les utilisateurs (admin uniquement)
   * @param {Object} options - Options de pagination/filtrage
   * @returns {Promise<Object>}
   */
  async listUsers(options) {
    return UserRepository.findAll(options);
  }

  /**
   * Supprimer un utilisateur (admin uniquement)
   * @param {string} userId - ID de l'utilisateur
   * @param {string} adminId - ID de l'admin effectuant l'action
   * @returns {Promise<Object>}
   */
  async deleteUser(userId, adminId) {
    // Empêcher l'auto-suppression
    if (userId === adminId) {
      throw ApiError.badRequest('Cannot delete your own account', 'SELF_DELETE');
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    // Empêcher la suppression d'un admin
    if (user.role === 'ADMIN') {
      throw ApiError.forbidden('Cannot delete admin users', 'ADMIN_DELETE');
    }

    await UserRepository.delete(userId);
    
    logger.info(`User deleted: ${userId} by admin: ${adminId}`);
    return { message: 'User deleted successfully' };
  }
}

export default new UserService();
```

---

## Étape 4 : Créer le Service Event

### 4.1 Créer src/services/EventService.js

```javascript
import EventRepository from '../repositories/EventRepository.js';
import { ApiError } from '../middlewares/error.middleware.js';
import logger from '../config/logger.js';

/**
 * Service pour la logique métier des événements
 */
class EventService {
  /**
   * Créer un nouvel événement
   * @param {Object} eventData - Données de l'événement
   * @param {string} organizerId - ID de l'organisateur
   * @returns {Promise<Object>}
   */
  async createEvent(eventData, organizerId) {
    const event = await EventRepository.create({
      ...eventData,
      organizerId,
      status: eventData.status || 'DRAFT',
    });

    logger.info(`Event created: ${event.id} by organizer ${organizerId}`);
    return event.toPublicJSON();
  }

  /**
   * Obtenir un événement par ID
   * @param {string} eventId - ID de l'événement
   * @param {string} userId - ID de l'utilisateur demandeur (optionnel)
   * @returns {Promise<Object>}
   */
  async getEvent(eventId, userId = null) {
    const event = await EventRepository.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
    }

    // Si l'événement n'est pas publié, seul l'organisateur peut le voir
    if (event.status !== 'PUBLISHED') {
      if (!userId || event.organizer_id !== userId) {
        throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
      }
    }

    const result = event.toPublicJSON();

    // Ajouter les infos de l'organisateur
    if (event.organizer) {
      result.organizer = {
        id: event.organizer.id,
        fullName: event.organizer.full_name,
        avatarUrl: event.organizer.avatar_url,
      };
    }

    return result;
  }

  /**
   * Lister les événements
   * @param {Object} options - Options de filtrage/pagination
   * @returns {Promise<Object>}
   */
  async listEvents(options = {}) {
    // Par défaut, ne montrer que les événements publiés
    if (!options.includeUnpublished) {
      options.status = 'PUBLISHED';
    }

    const result = await EventRepository.findAll(options);

    return {
      events: result.events.map((e) => e.toPublicJSON()),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Mettre à jour un événement
   * @param {string} eventId - ID de l'événement
   * @param {Object} updates - Données à mettre à jour
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>}
   */
  async updateEvent(eventId, updates, userId) {
    const event = await EventRepository.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (event.organizer_id !== userId) {
      throw ApiError.forbidden('You do not own this event', 'NOT_OWNER');
    }

    // Empêcher la modification d'un événement annulé
    if (event.status === 'CANCELLED') {
      throw ApiError.badRequest('Cannot update cancelled event', 'EVENT_CANCELLED');
    }

    // Mapper les updates (camelCase → snake_case)
    const mappedUpdates = {};
    if (updates.title) mappedUpdates.title = updates.title;
    if (updates.description !== undefined) mappedUpdates.description = updates.description;
    if (updates.location !== undefined) mappedUpdates.location = updates.location;
    if (updates.startDatetime) mappedUpdates.start_datetime = updates.startDatetime;
    if (updates.endDatetime) mappedUpdates.end_datetime = updates.endDatetime;
    if (updates.capacity) mappedUpdates.capacity = updates.capacity;
    if (updates.price !== undefined) mappedUpdates.price = updates.price;
    if (updates.currency) mappedUpdates.currency = updates.currency;
    if (updates.tags) mappedUpdates.tags = updates.tags;

    const updatedEvent = await EventRepository.update(eventId, mappedUpdates);
    
    logger.info(`Event updated: ${eventId}`);
    return updatedEvent.toPublicJSON();
  }

  /**
   * Supprimer un événement
   * @param {string} eventId - ID de l'événement
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>}
   */
  async deleteEvent(eventId, userId) {
    const event = await EventRepository.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
    }

    if (event.organizer_id !== userId) {
      throw ApiError.forbidden('You do not own this event', 'NOT_OWNER');
    }

    await EventRepository.delete(eventId);
    
    logger.info(`Event deleted: ${eventId}`);
    return { message: 'Event deleted successfully' };
  }

  /**
   * Publier un événement
   * @param {string} eventId - ID de l'événement
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>}
   */
  async publishEvent(eventId, userId) {
    const event = await EventRepository.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
    }

    if (event.organizer_id !== userId) {
      throw ApiError.forbidden('You do not own this event', 'NOT_OWNER');
    }

    if (event.status === 'CANCELLED') {
      throw ApiError.badRequest('Cannot publish cancelled event', 'EVENT_CANCELLED');
    }

    if (event.status === 'PUBLISHED') {
      throw ApiError.badRequest('Event is already published', 'ALREADY_PUBLISHED');
    }

    // Vérifier que l'événement a les champs requis
    if (!event.title || !event.start_datetime) {
      throw ApiError.badRequest(
        'Event must have title and start date to publish',
        'INCOMPLETE_EVENT'
      );
    }

    const updatedEvent = await EventRepository.update(eventId, { status: 'PUBLISHED' });
    
    logger.info(`Event published: ${eventId}`);
    return updatedEvent.toPublicJSON();
  }

  /**
   * Obtenir les événements d'un organisateur
   * @param {string} organizerId - ID de l'organisateur
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>}
   */
  async getOrganizerEvents(organizerId, options = {}) {
    return EventRepository.findAll({
      ...options,
      organizerId,
      includeUnpublished: true, // L'organisateur voit tous ses événements
    });
  }
}

export default new EventService();
```

---

## Étape 5 : Créer le Logger

### 5.1 Créer src/config/logger.js

```javascript
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Format personnalisé pour les logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// Créer le logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console (toujours actif)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
  ],
});

// En production, ajouter les fichiers de log
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
    })
  );
  logger.add(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
    })
  );
}

// Middleware Express pour logger les requêtes
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    
    if (res.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  });
  
  next();
};

export default logger;
```

---

## Étape 6 : Créer les Utilitaires

### 6.1 Créer src/utils/hash.util.js

```javascript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12; // Plus c'est élevé, plus c'est sécurisé (mais lent)

/**
 * Hasher un mot de passe
 * @param {string} password - Mot de passe en clair
 * @returns {Promise<string>} - Hash du mot de passe
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Comparer un mot de passe avec son hash
 * @param {string} password - Mot de passe en clair
 * @param {string} hash - Hash stocké
 * @returns {Promise<boolean>}
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export default {
  hashPassword,
  comparePassword,
};
```

---

## ✅ Checklist de validation

- [ ] Le fichier `UserRepository.js` est créé avec toutes les méthodes
- [ ] Le fichier `EventRepository.js` est créé
- [ ] Le fichier `UserService.js` contient la logique métier
- [ ] Le fichier `EventService.js` est créé
- [ ] Le logger Winston est configuré
- [ ] Les utilitaires de hash sont créés
- [ ] La structure respecte la séparation des responsabilités

---

## 📝 Points Clés à Retenir

1. **Repository** : Ne contient QUE l'accès aux données (requêtes Sequelize)
2. **Service** : Contient la logique métier (validations, règles de gestion)
3. **Controller** (TP suivant) : Gère uniquement HTTP (req → res)
4. **Singleton** : `export default new ClassName()` crée une instance unique
5. **Séparation** : Permet de tester chaque couche indépendamment

---

## 🔗 Prochaine étape

Continuez avec le [TP04 - Authentification JWT](./TP04_Authentification_JWT.md)
