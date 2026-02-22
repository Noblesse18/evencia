# TP05 - API REST Complète

## 🎯 Objectifs

- Créer des routes RESTful pour les ressources
- Implémenter la validation des données avec Joi
- Configurer le rate limiting
- Tester l'API avec Postman

**Durée estimée :** 2 heures

---

## 📋 Prérequis

- TP01 à TP04 terminés
- Postman installé

---

## Comprendre REST

### Conventions REST

| Méthode | Endpoint | Action | Description |
|---------|----------|--------|-------------|
| GET | `/resources` | List | Lister toutes les ressources |
| GET | `/resources/:id` | Read | Obtenir une ressource |
| POST | `/resources` | Create | Créer une ressource |
| PATCH | `/resources/:id` | Update | Modifier partiellement |
| PUT | `/resources/:id` | Replace | Remplacer entièrement |
| DELETE | `/resources/:id` | Delete | Supprimer |

### Codes de réponse HTTP

| Code | Signification | Usage |
|------|---------------|-------|
| 200 | OK | Succès général |
| 201 | Created | Ressource créée |
| 204 | No Content | Succès sans contenu |
| 400 | Bad Request | Données invalides |
| 401 | Unauthorized | Non authentifié |
| 403 | Forbidden | Non autorisé |
| 404 | Not Found | Ressource inexistante |
| 409 | Conflict | Conflit (ex: email existant) |
| 429 | Too Many Requests | Rate limit atteint |
| 500 | Internal Server Error | Erreur serveur |

---

## Étape 1 : Créer le Middleware de Validation

### 1.1 Créer src/middlewares/validate.middleware.js

```javascript
import { ApiError } from './error.middleware.js';

/**
 * Middleware de validation avec Joi
 * Valide body, params et query selon le schéma fourni
 * 
 * @param {Object} schema - Schéma Joi { body, params, query }
 */
export function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    // Valider le body
    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, {
        abortEarly: false, // Collecter toutes les erreurs
        stripUnknown: true, // Supprimer les champs non définis
      });

      if (error) {
        errors.push(
          ...error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
            location: 'body',
          }))
        );
      } else {
        req.body = value; // Remplacer par les valeurs validées/transformées
      }
    }

    // Valider les paramètres d'URL
    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, {
        abortEarly: false,
      });

      if (error) {
        errors.push(
          ...error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
            location: 'params',
          }))
        );
      } else {
        req.params = value;
      }
    }

    // Valider les query strings
    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        errors.push(
          ...error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
            location: 'query',
          }))
        );
      } else {
        req.query = value;
      }
    }

    // S'il y a des erreurs, renvoyer une erreur 400
    if (errors.length > 0) {
      throw ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', errors);
    }

    next();
  };
}

export default { validate };
```

---

## Étape 2 : Créer les Validateurs

### 2.1 Créer src/validators/auth.validator.js

```javascript
import Joi from 'joi';

// Pattern pour un mot de passe sécurisé
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;

/**
 * Schéma de validation pour l'inscription
 */
export const registerSchema = {
  body: Joi.object({
    fullName: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Full name must be at least 2 characters',
        'string.max': 'Full name must be at most 100 characters',
        'any.required': 'Full name is required',
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(passwordPattern)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
        'any.required': 'Password is required',
      }),
    role: Joi.string()
      .valid('USER', 'ORGANIZER')
      .default('USER')
      .messages({
        'any.only': 'Role must be USER or ORGANIZER',
      }),
  }),
};

/**
 * Schéma de validation pour la connexion
 */
export const loginSchema = {
  body: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required',
      }),
  }),
};

/**
 * Schéma pour le refresh token
 */
export const refreshSchema = {
  body: Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'any.required': 'Refresh token is required',
      }),
  }),
};

/**
 * Schéma pour le logout
 */
export const logoutSchema = {
  body: Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'any.required': 'Refresh token is required',
      }),
  }),
};

export default {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
};
```

### 2.2 Créer src/validators/event.validator.js

```javascript
import Joi from 'joi';

/**
 * Schéma pour créer un événement
 */
export const createEventSchema = {
  body: Joi.object({
    title: Joi.string()
      .min(3)
      .max(255)
      .required()
      .messages({
        'string.min': 'Title must be at least 3 characters',
        'any.required': 'Title is required',
      }),
    description: Joi.string()
      .max(5000)
      .allow('', null),
    location: Joi.string()
      .max(500)
      .allow('', null),
    startDatetime: Joi.date()
      .iso()
      .greater('now')
      .required()
      .messages({
        'date.greater': 'Start date must be in the future',
        'any.required': 'Start date is required',
      }),
    endDatetime: Joi.date()
      .iso()
      .greater(Joi.ref('startDatetime'))
      .allow(null)
      .messages({
        'date.greater': 'End date must be after start date',
      }),
    capacity: Joi.number()
      .integer()
      .min(1)
      .max(100000)
      .default(100),
    price: Joi.number()
      .min(0)
      .max(99999.99)
      .default(0),
    currency: Joi.string()
      .length(3)
      .uppercase()
      .default('EUR'),
    tags: Joi.array()
      .items(Joi.string().max(50))
      .max(10)
      .default([]),
    status: Joi.string()
      .valid('DRAFT', 'PUBLISHED')
      .default('DRAFT'),
  }),
};

/**
 * Schéma pour mettre à jour un événement
 */
export const updateEventSchema = {
  params: Joi.object({
    id: Joi.string()
      .uuid()
      .required(),
  }),
  body: Joi.object({
    title: Joi.string().min(3).max(255),
    description: Joi.string().max(5000).allow('', null),
    location: Joi.string().max(500).allow('', null),
    startDatetime: Joi.date().iso(),
    endDatetime: Joi.date().iso().allow(null),
    capacity: Joi.number().integer().min(1).max(100000),
    price: Joi.number().min(0).max(99999.99),
    currency: Joi.string().length(3).uppercase(),
    tags: Joi.array().items(Joi.string().max(50)).max(10),
  }),
};

/**
 * Schéma pour obtenir un événement par ID
 */
export const getEventSchema = {
  params: Joi.object({
    id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Invalid event ID format',
      }),
  }),
};

/**
 * Schéma pour lister les événements
 */
export const listEventsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('DRAFT', 'PUBLISHED', 'CANCELLED'),
    search: Joi.string().max(100),
    location: Joi.string().max(100),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    organizerId: Joi.string().uuid(),
    sortBy: Joi.string().valid('start_datetime', 'price', 'created_at').default('start_datetime'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  }),
};

/**
 * Schéma pour publier/dépublier
 */
export const publishEventSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

/**
 * Schéma pour supprimer
 */
export const deleteEventSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export default {
  createEventSchema,
  updateEventSchema,
  getEventSchema,
  listEventsSchema,
  publishEventSchema,
  deleteEventSchema,
};
```

---

## Étape 3 : Créer le Rate Limiter

### 3.1 Créer src/middlewares/rateLimiter.middleware.js

```javascript
import rateLimit from 'express-rate-limit';

/**
 * Rate limiter par défaut pour l'API
 * 100 requêtes par 15 minutes
 */
export const defaultLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  message: {
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMITED',
  },
  standardHeaders: true, // Ajoute les headers RateLimit-*
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      code: 'RATE_LIMITED',
    });
  },
});

/**
 * Rate limiter strict pour l'authentification
 * 10 tentatives par 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
      code: 'AUTH_RATE_LIMITED',
    });
  },
});

/**
 * Rate limiter pour la création d'événements
 * 20 événements par heure
 */
export const eventCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    error: 'Event creation limit reached, please try again later.',
    code: 'EVENT_RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip, // Limiter par utilisateur
  handler: (req, res) => {
    res.status(429).json({
      error: 'Event creation limit reached, please try again later.',
      code: 'EVENT_RATE_LIMITED',
    });
  },
});

export default {
  defaultLimiter,
  authLimiter,
  eventCreationLimiter,
};
```

---

## Étape 4 : Créer les Routes

### 4.1 Créer src/routes/auth.routes.js

```javascript
import { Router } from 'express';
import AuthController from '../controllers/AuthController.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from '../validators/auth.validator.js';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Inscription d'un nouvel utilisateur
 * @access Public
 */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  AuthController.register
);

/**
 * @route POST /api/auth/login
 * @desc Connexion
 * @access Public
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  AuthController.login
);

/**
 * @route POST /api/auth/refresh
 * @desc Rafraîchir le token d'accès
 * @access Public
 */
router.post(
  '/refresh',
  validate(refreshSchema),
  AuthController.refresh
);

/**
 * @route POST /api/auth/logout
 * @desc Déconnexion
 * @access Public
 */
router.post(
  '/logout',
  validate(logoutSchema),
  AuthController.logout
);

/**
 * @route POST /api/auth/logout-all
 * @desc Déconnexion de tous les appareils
 * @access Private
 */
router.post(
  '/logout-all',
  authenticate,
  AuthController.logoutAll
);

/**
 * @route GET /api/auth/me
 * @desc Obtenir l'utilisateur courant
 * @access Private
 */
router.get(
  '/me',
  authenticate,
  AuthController.getCurrentUser
);

export default router;
```

### 4.2 Créer src/routes/events.routes.js

```javascript
import { Router } from 'express';
import EventController from '../controllers/EventController.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js';
import { requireOrganizer } from '../middlewares/role.middleware.js';
import { eventCreationLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  createEventSchema,
  updateEventSchema,
  getEventSchema,
  listEventsSchema,
  publishEventSchema,
  deleteEventSchema,
} from '../validators/event.validator.js';

const router = Router();

/**
 * @route GET /api/events
 * @desc Lister les événements (publics)
 * @access Public
 */
router.get(
  '/',
  optionalAuth,
  validate(listEventsSchema),
  EventController.listEvents
);

/**
 * @route GET /api/events/my-events
 * @desc Obtenir mes événements (organisateur)
 * @access Private/Organizer
 */
router.get(
  '/my-events',
  authenticate,
  requireOrganizer,
  EventController.getMyEvents
);

/**
 * @route POST /api/events
 * @desc Créer un événement
 * @access Private/Organizer
 */
router.post(
  '/',
  authenticate,
  requireOrganizer,
  eventCreationLimiter,
  validate(createEventSchema),
  EventController.createEvent
);

/**
 * @route GET /api/events/:id
 * @desc Obtenir un événement par ID
 * @access Public
 */
router.get(
  '/:id',
  optionalAuth,
  validate(getEventSchema),
  EventController.getEvent
);

/**
 * @route PATCH /api/events/:id
 * @desc Modifier un événement
 * @access Private/Owner
 */
router.patch(
  '/:id',
  authenticate,
  validate(updateEventSchema),
  EventController.updateEvent
);

/**
 * @route DELETE /api/events/:id
 * @desc Supprimer un événement
 * @access Private/Owner
 */
router.delete(
  '/:id',
  authenticate,
  validate(deleteEventSchema),
  EventController.deleteEvent
);

/**
 * @route POST /api/events/:id/publish
 * @desc Publier un événement
 * @access Private/Owner
 */
router.post(
  '/:id/publish',
  authenticate,
  validate(publishEventSchema),
  EventController.publishEvent
);

export default router;
```

### 4.3 Créer src/routes/index.js

```javascript
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import eventsRoutes from './events.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes de l'API
router.use('/auth', authRoutes);
router.use('/events', eventsRoutes);

export default router;
```

---

## Étape 5 : Créer le Middleware de Rôles

### 5.1 Créer src/middlewares/role.middleware.js

```javascript
/**
 * Middleware pour vérifier les rôles
 * Doit être utilisé APRÈS le middleware authenticate
 */

/**
 * Exiger un ou plusieurs rôles
 * @param {...string} allowedRoles - Rôles autorisés
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
}

/**
 * Exiger le rôle admin
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required.',
      code: 'AUTH_REQUIRED',
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Admin access required.',
      code: 'ADMIN_REQUIRED',
    });
  }

  next();
}

/**
 * Exiger le rôle organisateur ou admin
 */
export function requireOrganizer(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required.',
      code: 'AUTH_REQUIRED',
    });
  }

  if (!['ORGANIZER', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'Organizer access required.',
      code: 'ORGANIZER_REQUIRED',
    });
  }

  next();
}

export default {
  requireRole,
  requireAdmin,
  requireOrganizer,
};
```

---

## Étape 6 : Mettre à jour le serveur

### 6.1 Mettre à jour src/server.js

```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

// Import configurations
import { testConnection, syncDatabase } from './config/db.js';
import logger, { requestLogger } from './config/logger.js';

// Import middlewares
import { defaultLimiter } from './middlewares/rateLimiter.middleware.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';

// Import routes
import routes from './routes/index.js';

// Import models pour initialiser les associations
import './models/index.js';

const app = express();

// Trust proxy (pour rate limiting derrière un reverse proxy)
app.set('trust proxy', 1);

// Middlewares de sécurité
app.use(helmet());

// Configuration CORS
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting global
app.use('/api', defaultLimiter);

// Routes de l'API
app.use('/api', routes);

// Handler 404
app.use(notFoundHandler);

// Handler global des erreurs
app.use(errorHandler);

// Démarrage du serveur
const PORT = parseInt(process.env.PORT, 10) || 4000;
const HOST = '0.0.0.0';

async function startServer() {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    await syncDatabase({ alter: process.env.NODE_ENV === 'development' });

    app.listen(PORT, HOST, () => {
      logger.info(`🚀 Server running on http://${HOST}:${PORT}`);
      logger.info(`📚 API available at http://${HOST}:${PORT}/api`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
```

---

## Étape 7 : Tester avec Postman

### 7.1 Créer une collection Postman

1. **POST /api/auth/register** - Inscription
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "role": "ORGANIZER"
}
```

2. **POST /api/auth/login** - Connexion
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

3. **GET /api/auth/me** - Obtenir le profil
   - Header: `Authorization: Bearer <accessToken>`

4. **POST /api/events** - Créer un événement
```json
{
  "title": "Tech Meetup Paris",
  "description": "Monthly tech meetup",
  "location": "Paris, France",
  "startDatetime": "2025-02-15T18:00:00.000Z",
  "capacity": 50,
  "price": 0
}
```

5. **GET /api/events** - Lister les événements

---

## ✅ Checklist de validation

- [ ] Les validateurs Joi sont créés
- [ ] Les routes sont définies et fonctionnelles
- [ ] Le rate limiting est actif
- [ ] Les tests Postman passent
- [ ] Les erreurs sont bien formatées

---

## 🔗 Prochaine étape

Continuez avec le [TP06 - Frontend React - Configuration](./TP06_Frontend_React.md)
