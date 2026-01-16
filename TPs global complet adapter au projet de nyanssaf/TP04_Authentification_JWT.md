# TP04 - Authentification JWT

## 🎯 Objectifs

- Comprendre le fonctionnement des JSON Web Tokens (JWT)
- Implémenter un système d'authentification complet
- Gérer les Access Tokens et Refresh Tokens
- Sécuriser les routes avec des middlewares

**Durée estimée :** 2h30

---

## 📋 Prérequis

- TP01, TP02 et TP03 terminés
- Concepts de sécurité web basiques

---

## Comprendre JWT

### Qu'est-ce qu'un JWT ?

Un JWT (JSON Web Token) est un standard ouvert (RFC 7519) permettant l'échange sécurisé d'informations entre deux parties.

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTYwMDAwMDAwMH0.signature
└──────────── HEADER ───────────────┘.└────────────── PAYLOAD ─────────────────────┘.└─ SIGNATURE ─┘
```

### Structure d'un JWT

| Partie | Contenu |
|--------|---------|
| **Header** | Algorithme de signature (HS256) |
| **Payload** | Données utilisateur (claims) |
| **Signature** | Vérification d'intégrité |

### Stratégie Access + Refresh Token

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUX D'AUTHENTIFICATION                       │
└─────────────────────────────────────────────────────────────────┘

1. LOGIN
   Client ──[email, password]──► Server
   Client ◄──[accessToken (15min), refreshToken (30j)]── Server

2. REQUÊTE AUTHENTIFIÉE
   Client ──[Authorization: Bearer accessToken]──► Server
   Client ◄──[données]── Server

3. ACCESS TOKEN EXPIRÉ
   Client ──[requête]──► Server ──► 401 Unauthorized
   Client ──[refreshToken]──► Server
   Client ◄──[nouveau accessToken, nouveau refreshToken]── Server

4. REFRESH TOKEN EXPIRÉ → RECONNEXION OBLIGATOIRE
```

**Pourquoi deux tokens ?**

| Token | Durée | Stockage | Usage |
|-------|-------|----------|-------|
| **Access Token** | 15 min | Mémoire/localStorage | Authentifier les requêtes |
| **Refresh Token** | 30 jours | localStorage | Obtenir un nouveau access token |

---

## Étape 1 : Créer les utilitaires JWT

### 1.1 Créer src/utils/jwt.util.js

```javascript
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Configuration des secrets et durées d'expiration
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret';
const ACCESS_EXP = process.env.JWT_ACCESS_EXP || '15m';
const REFRESH_EXP = process.env.JWT_REFRESH_EXP || '30d';

/**
 * Générer un Access Token
 * @param {Object} payload - Données à inclure dans le token
 * @returns {string} JWT Access Token
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXP,
    issuer: 'onelastevent',      // Émetteur du token
    audience: 'onelastevent-users', // Destinataire prévu
  });
}

/**
 * Générer un Refresh Token
 * @param {Object} payload - Données minimales (userId uniquement)
 * @returns {string} JWT Refresh Token
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXP,
    issuer: 'onelastevent',
    audience: 'onelastevent-users',
  });
}

/**
 * Vérifier un Access Token
 * @param {string} token - JWT Access Token
 * @returns {Object} Payload décodé
 * @throws {Error} Si le token est invalide ou expiré
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET, {
    issuer: 'onelastevent',
    audience: 'onelastevent-users',
  });
}

/**
 * Vérifier un Refresh Token
 * @param {string} token - JWT Refresh Token
 * @returns {Object} Payload décodé
 * @throws {Error} Si le token est invalide ou expiré
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET, {
    issuer: 'onelastevent',
    audience: 'onelastevent-users',
  });
}

/**
 * Générer une paire de tokens (access + refresh)
 * @param {Object} user - Objet utilisateur
 * @returns {Object} { accessToken, refreshToken }
 */
export function generateTokenPair(user) {
  // L'access token contient plus d'informations pour éviter les requêtes DB
  const accessPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  // Le refresh token ne contient que l'userId pour minimiser les risques
  const refreshPayload = {
    userId: user.id,
  };

  return {
    accessToken: generateAccessToken(accessPayload),
    refreshToken: generateRefreshToken(refreshPayload),
  };
}

/**
 * Hasher un token pour le stockage sécurisé
 * @param {string} token - Token à hasher
 * @returns {string} Hash du token
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Générer un token aléatoire (pour vérification email, reset password)
 * @returns {string} Token aléatoire de 64 caractères hex
 */
export function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Convertir une chaîne d'expiration en secondes
 * @param {string} expString - Ex: '15m', '30d', '1h'
 * @returns {number} Durée en secondes
 */
export function getExpirationInSeconds(expString) {
  const match = expString.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // Défaut : 15 minutes

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    default: return 900;
  }
}

/**
 * Obtenir la date d'expiration du refresh token
 * @returns {Date} Date d'expiration
 */
export function getRefreshTokenExpiration() {
  const seconds = getExpirationInSeconds(REFRESH_EXP);
  return new Date(Date.now() + seconds * 1000);
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  hashToken,
  generateRandomToken,
  getExpirationInSeconds,
  getRefreshTokenExpiration,
};
```

---

## Étape 2 : Configurer Redis pour le Blacklist

### 2.1 Créer src/config/redis.js

```javascript
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Configuration Redis
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};

// Créer l'instance Redis
const redis = new Redis(redisConfig);

// Événements de connexion
redis.on('connect', () => {
  console.log('✅ Redis connected successfully.');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

// ==========================================
// GESTION DES REFRESH TOKENS
// ==========================================

/**
 * Stocker un refresh token dans Redis
 * @param {string} userId - ID de l'utilisateur
 * @param {string} tokenHash - Hash du token
 * @param {number} expiresInSeconds - Durée de validité
 */
export async function storeRefreshToken(userId, tokenHash, expiresInSeconds) {
  const key = `refresh_token:${userId}:${tokenHash}`;
  await redis.setex(key, expiresInSeconds, 'valid');
}

/**
 * Vérifier si un refresh token est valide
 * @param {string} userId - ID de l'utilisateur
 * @param {string} tokenHash - Hash du token
 * @returns {Promise<boolean>}
 */
export async function isRefreshTokenValid(userId, tokenHash) {
  const key = `refresh_token:${userId}:${tokenHash}`;
  const result = await redis.get(key);
  return result === 'valid';
}

/**
 * Révoquer un refresh token
 * @param {string} userId - ID de l'utilisateur
 * @param {string} tokenHash - Hash du token
 */
export async function revokeRefreshToken(userId, tokenHash) {
  const key = `refresh_token:${userId}:${tokenHash}`;
  await redis.del(key);
}

/**
 * Révoquer tous les refresh tokens d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 */
export async function revokeAllUserTokens(userId) {
  const pattern = `refresh_token:${userId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// ==========================================
// BLACKLIST DES ACCESS TOKENS
// ==========================================

/**
 * Ajouter un token à la blacklist
 * @param {string} token - Token à blacklister
 * @param {number} expiresInSeconds - Durée de la blacklist
 */
export async function blacklistToken(token, expiresInSeconds) {
  const key = `blacklist:${token}`;
  await redis.setex(key, expiresInSeconds, 'revoked');
}

/**
 * Vérifier si un token est blacklisté
 * @param {string} token - Token à vérifier
 * @returns {Promise<boolean>}
 */
export async function isTokenBlacklisted(token) {
  const key = `blacklist:${token}`;
  const result = await redis.get(key);
  return result === 'revoked';
}

export default redis;
```

> 💡 **Note** : Si vous n'avez pas Redis installé, vous pouvez :
> - L'installer via Docker : `docker run -d -p 6379:6379 redis:alpine`
> - Ou commenter temporairement les appels Redis pour tester

---

## Étape 3 : Créer le Service d'Authentification

### 3.1 Créer src/services/AuthService.js

```javascript
import UserRepository from '../repositories/UserRepository.js';
import { hashPassword, comparePassword } from '../utils/hash.util.js';
import {
  generateTokenPair,
  verifyRefreshToken,
  hashToken,
  generateRandomToken,
  getRefreshTokenExpiration,
  getExpirationInSeconds,
} from '../utils/jwt.util.js';
import {
  storeRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  isRefreshTokenValid,
  blacklistToken,
} from '../config/redis.js';
import { ApiError } from '../middlewares/error.middleware.js';
import logger from '../config/logger.js';

/**
 * Service d'authentification
 * Gère inscription, connexion, tokens et sécurité
 */
class AuthService {
  /**
   * Inscrire un nouvel utilisateur
   * @param {Object} userData - Données d'inscription
   * @returns {Promise<Object>} User et tokens
   */
  async register(userData) {
    const { fullName, email, password, role } = userData;

    // Vérifier si l'email existe déjà
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw ApiError.conflict('Email already registered', 'EMAIL_EXISTS');
    }

    // Hasher le mot de passe
    const passwordHash = await hashPassword(password);

    // Générer un token de vérification d'email
    const verificationToken = generateRandomToken();

    // Créer l'utilisateur
    const user = await UserRepository.create({
      fullName,
      email,
      passwordHash,
      role: role || 'USER',
      verificationToken,
      isVerified: false,
    });

    // Générer les tokens JWT
    const tokens = generateTokenPair(user);

    // Stocker le refresh token
    const tokenHash = hashToken(tokens.refreshToken);
    await storeRefreshToken(
      user.id,
      tokenHash,
      getExpirationInSeconds(process.env.JWT_REFRESH_EXP || '30d')
    );

    // Stocker aussi en base de données (pour la rotation)
    await UserRepository.storeRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt: getRefreshTokenExpiration(),
    });

    logger.info(`User registered: ${email}`);

    return {
      user: user.toPublicJSON(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Connecter un utilisateur
   * @param {Object} credentials - Email et mot de passe
   * @param {Object} requestInfo - Métadonnées de la requête
   * @returns {Promise<Object>} User et tokens
   */
  async login(credentials, requestInfo = {}) {
    const { email, password } = credentials;

    // Trouver l'utilisateur
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Vérifier le mot de passe
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Générer les tokens
    const tokens = generateTokenPair(user);

    // Stocker le refresh token
    const tokenHash = hashToken(tokens.refreshToken);
    await storeRefreshToken(
      user.id,
      tokenHash,
      getExpirationInSeconds(process.env.JWT_REFRESH_EXP || '30d')
    );

    // Stocker en base avec métadonnées
    await UserRepository.storeRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt: getRefreshTokenExpiration(),
      userAgent: requestInfo.userAgent,
      ipAddress: requestInfo.ipAddress,
    });

    logger.info(`User logged in: ${email}`);

    return {
      user: user.toPublicJSON(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Rafraîchir les tokens
   * @param {string} refreshToken - Refresh token actuel
   * @returns {Promise<Object>} Nouveaux tokens
   */
  async refresh(refreshToken) {
    try {
      // Vérifier le refresh token
      const decoded = verifyRefreshToken(refreshToken);
      const tokenHash = hashToken(refreshToken);

      // Vérifier si le token est valide dans Redis
      const isValid = await isRefreshTokenValid(decoded.userId, tokenHash);
      if (!isValid) {
        // Vérifier aussi en base de données
        const dbToken = await UserRepository.findRefreshToken(tokenHash);
        if (!dbToken || dbToken.revoked) {
          throw ApiError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
        }
      }

      // Récupérer l'utilisateur
      const user = await UserRepository.findById(decoded.userId);
      if (!user) {
        throw ApiError.unauthorized('User not found', 'USER_NOT_FOUND');
      }

      // ROTATION : Révoquer l'ancien token
      await revokeRefreshToken(decoded.userId, tokenHash);
      await UserRepository.revokeRefreshToken(tokenHash);

      // Générer de nouveaux tokens
      const tokens = generateTokenPair(user);
      const newTokenHash = hashToken(tokens.refreshToken);

      // Stocker le nouveau refresh token
      await storeRefreshToken(
        user.id,
        newTokenHash,
        getExpirationInSeconds(process.env.JWT_REFRESH_EXP || '30d')
      );

      await UserRepository.storeRefreshToken({
        userId: user.id,
        tokenHash: newTokenHash,
        expiresAt: getRefreshTokenExpiration(),
      });

      logger.info(`Token refreshed for user: ${user.email}`);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (error.isOperational) throw error;
      throw ApiError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }
  }

  /**
   * Déconnecter un utilisateur
   * @param {string} refreshToken - Refresh token à révoquer
   * @param {string} accessToken - Access token à blacklister
   */
  async logout(refreshToken, accessToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const tokenHash = hashToken(refreshToken);

      // Révoquer le refresh token
      await revokeRefreshToken(decoded.userId, tokenHash);
      await UserRepository.revokeRefreshToken(tokenHash);

      // Blacklister l'access token (jusqu'à son expiration naturelle)
      if (accessToken) {
        await blacklistToken(
          accessToken,
          getExpirationInSeconds(process.env.JWT_ACCESS_EXP || '15m')
        );
      }

      logger.info(`User logged out: ${decoded.userId}`);
      return true;
    } catch (error) {
      // Même si le token est invalide, on considère le logout réussi
      logger.warn('Logout with invalid token');
      return true;
    }
  }

  /**
   * Déconnecter de tous les appareils
   * @param {string} userId - ID de l'utilisateur
   */
  async logoutAll(userId) {
    await revokeAllUserTokens(userId);
    await UserRepository.revokeAllUserTokens(userId);
    logger.info(`User logged out from all devices: ${userId}`);
    return true;
  }
}

export default new AuthService();
```

---

## Étape 4 : Créer le Middleware d'Authentification

### 4.1 Créer src/middlewares/auth.middleware.js

```javascript
import { verifyAccessToken } from '../utils/jwt.util.js';
import { isTokenBlacklisted } from '../config/redis.js';
import { User } from '../models/index.js';
import logger from '../config/logger.js';

/**
 * Middleware d'authentification
 * Vérifie le JWT et attache l'utilisateur à la requête
 */
export async function authenticate(req, res, next) {
  try {
    // Extraire le token du header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
      });
    }

    // Extraire le token (après "Bearer ")
    const token = authHeader.split(' ')[1];

    // Vérifier si le token est blacklisté
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({
        error: 'Token has been revoked.',
        code: 'TOKEN_REVOKED',
      });
    }

    // Vérifier et décoder le token
    const decoded = verifyAccessToken(token);

    // Récupérer l'utilisateur en base
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        error: 'User not found.',
        code: 'USER_NOT_FOUND',
      });
    }

    // Attacher les informations à la requête
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;
    req.token = token;

    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token has expired.',
        code: 'TOKEN_EXPIRED',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token.',
        code: 'INVALID_TOKEN',
      });
    }

    return res.status(401).json({
      error: 'Authentication failed.',
      code: 'AUTH_FAILED',
    });
  }
}

/**
 * Middleware d'authentification optionnelle
 * Attache l'utilisateur si le token est valide, continue sinon
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Pas de token, on continue sans utilisateur
    }

    const token = authHeader.split(' ')[1];

    // Vérifier si blacklisté
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return next(); // Token révoqué, on continue sans utilisateur
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findByPk(decoded.userId);

    if (user) {
      req.user = user;
      req.userId = user.id;
      req.userRole = user.role;
      req.token = token;
    }

    next();
  } catch {
    // En cas d'erreur, on continue sans utilisateur
    next();
  }
}

export default { authenticate, optionalAuth };
```

---

## Étape 5 : Créer le Middleware de Gestion d'Erreurs

### 5.1 Créer src/middlewares/error.middleware.js

```javascript
import logger from '../config/logger.js';

/**
 * Classe d'erreur personnalisée pour l'API
 */
export class ApiError extends Error {
  constructor(statusCode, message, code = 'ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distingue les erreurs opérationnelles des bugs

    Error.captureStackTrace(this, this.constructor);
  }

  // Méthodes statiques pour créer des erreurs courantes
  static badRequest(message, code = 'BAD_REQUEST', details = null) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new ApiError(404, message, code);
  }

  static conflict(message, code = 'CONFLICT') {
    return new ApiError(409, message, code);
  }

  static tooMany(message = 'Too many requests', code = 'RATE_LIMITED') {
    return new ApiError(429, message, code);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    return new ApiError(500, message, code);
  }
}

/**
 * Middleware pour gérer les routes non trouvées
 */
export function notFoundHandler(req, res, next) {
  const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
}

/**
 * Middleware global de gestion des erreurs
 * Doit être le DERNIER middleware enregistré
 */
export function errorHandler(err, req, res, next) {
  // Logger l'erreur
  if (err.statusCode >= 500 || !err.isOperational) {
    logger.error(`${err.message}\n${err.stack}`);
  } else {
    logger.warn(`${err.code}: ${err.message}`);
  }

  // Gérer les erreurs Sequelize
  if (err.name === 'SequelizeValidationError') {
    const details = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details,
    });
  }

  // Erreur de contrainte unique (email déjà existant, etc.)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    return res.status(409).json({
      error: `${field} already exists`,
      code: 'DUPLICATE_ENTRY',
    });
  }

  // Erreur de clé étrangère
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Invalid reference to related resource',
      code: 'FOREIGN_KEY_ERROR',
    });
  }

  // Erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token has expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  // Erreurs opérationnelles (ApiError)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details && { details: err.details }),
    });
  }

  // Erreurs inattendues (bugs)
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message;

  res.status(statusCode).json({
    error: message,
    code: 'INTERNAL_ERROR',
    // Afficher la stack trace en développement uniquement
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export default {
  ApiError,
  notFoundHandler,
  errorHandler,
};
```

---

## Étape 6 : Créer le Controller d'Authentification

### 6.1 Créer src/controllers/AuthController.js

```javascript
import AuthService from '../services/AuthService.js';
import logger from '../config/logger.js';

/**
 * Controller d'authentification
 * Gère les requêtes HTTP pour l'auth
 */
class AuthController {
  /**
   * Inscription
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { fullName, email, password, role } = req.body;

      const result = await AuthService.register({
        fullName,
        email,
        password,
        role,
      });

      res.status(201).json({
        message: 'Registration successful',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Connexion
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login(
        { email, password },
        {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
        }
      );

      res.json({
        message: 'Login successful',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Rafraîchir le token
   * POST /api/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;

      const tokens = await AuthService.refresh(refreshToken);

      res.json({
        message: 'Token refreshed',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Déconnexion
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const accessToken = req.token; // Attaché par le middleware si présent

      await AuthService.logout(refreshToken, accessToken);

      res.json({ message: 'Logout successful' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Déconnexion de tous les appareils
   * POST /api/auth/logout-all
   */
  async logoutAll(req, res, next) {
    try {
      await AuthService.logoutAll(req.userId);
      res.json({ message: 'Logged out from all devices' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir l'utilisateur actuel
   * GET /api/auth/me
   */
  async getCurrentUser(req, res, next) {
    try {
      res.json({
        user: req.user.toPublicJSON(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
```

---

## ✅ Checklist de validation

- [ ] `jwt.util.js` est créé avec les fonctions de génération/vérification
- [ ] `redis.js` est configuré pour le stockage des tokens
- [ ] `AuthService.js` implémente register, login, refresh, logout
- [ ] `auth.middleware.js` vérifie les tokens
- [ ] `error.middleware.js` gère les erreurs de manière centralisée
- [ ] `AuthController.js` expose les endpoints

---

## 📝 Points Clés à Retenir

1. **Access Token** : Courte durée (15 min), contient les infos utilisateur
2. **Refresh Token** : Longue durée (30 jours), permet de renouveler l'access token
3. **Rotation** : À chaque refresh, l'ancien refresh token est révoqué
4. **Blacklist** : Les access tokens peuvent être invalidés via Redis
5. **Séparation** : Controller → Service → Repository

---

## 🔗 Prochaine étape

Continuez avec le [TP05 - API REST complète](./TP05_API_REST.md)
