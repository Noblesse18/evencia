# TP10 - Corrections et Bonnes Pratiques

## 🎯 Objectifs

- Identifier et corriger les problèmes de sécurité
- Appliquer les bonnes pratiques de développement
- Préparer le projet pour l'épreuve E4
- Optimiser les performances

**Durée estimée :** 1 heure

---

## 📋 Ce TP couvre

Ce TP final corrige les problèmes identifiés dans le projet original et applique les bonnes pratiques professionnelles.

---

## 🔴 Corrections Critiques (Priorité 1)

### 1.1 Renommer le fichier d'environnement

**Problème** : Le fichier `backend/env` devrait être `.env`

```bash
cd backend
mv env .env
```

**Impact** : Sans le point, `dotenv` ne charge pas automatiquement les variables.

---

### 1.2 Sécuriser les secrets JWT

**Problème** : Les secrets JWT par défaut sont exposés dans le code.

**Solution** : Dans `src/utils/jwt.util.js`, ajouter une vérification :

```javascript
// AU DÉBUT DU FICHIER
import dotenv from 'dotenv';
dotenv.config();

// Vérifier que les secrets sont définis en production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET === 'default_access_secret') {
    throw new Error('JWT_ACCESS_SECRET must be set in production');
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === 'default_refresh_secret') {
    throw new Error('JWT_REFRESH_SECRET must be set in production');
  }
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
```

---

### 1.3 Vérifier les imports Redis

**Problème** : L'import de Redis peut échouer silencieusement.

**Solution** : Modifier `src/config/redis.js` pour gérer l'absence de Redis :

```javascript
import Redis from 'ioredis';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

let redis = null;
let isRedisAvailable = false;

// Tenter de se connecter à Redis
try {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    lazyConnect: true, // Ne pas se connecter immédiatement
  });

  redis.on('connect', () => {
    isRedisAvailable = true;
    logger.info('✅ Redis connected successfully.');
  });

  redis.on('error', (err) => {
    isRedisAvailable = false;
    logger.warn(`⚠️ Redis connection error: ${err.message}`);
  });

  // Tenter une connexion initiale
  redis.connect().catch(() => {
    logger.warn('⚠️ Redis not available, using fallback storage.');
  });
} catch (error) {
  logger.warn('⚠️ Redis initialization failed, using fallback storage.');
}

// Fonctions avec fallback si Redis n'est pas disponible
const memoryStore = new Map();

export async function storeRefreshToken(userId, tokenHash, expiresInSeconds) {
  if (isRedisAvailable && redis) {
    const key = `refresh_token:${userId}:${tokenHash}`;
    await redis.setex(key, expiresInSeconds, 'valid');
  } else {
    // Fallback : stockage en mémoire (non recommandé en prod)
    memoryStore.set(`refresh_token:${userId}:${tokenHash}`, {
      value: 'valid',
      expiry: Date.now() + expiresInSeconds * 1000,
    });
  }
}

export async function isRefreshTokenValid(userId, tokenHash) {
  if (isRedisAvailable && redis) {
    const key = `refresh_token:${userId}:${tokenHash}`;
    const result = await redis.get(key);
    return result === 'valid';
  } else {
    const data = memoryStore.get(`refresh_token:${userId}:${tokenHash}`);
    if (data && data.expiry > Date.now()) {
      return data.value === 'valid';
    }
    return false;
  }
}

export async function revokeRefreshToken(userId, tokenHash) {
  if (isRedisAvailable && redis) {
    const key = `refresh_token:${userId}:${tokenHash}`;
    await redis.del(key);
  } else {
    memoryStore.delete(`refresh_token:${userId}:${tokenHash}`);
  }
}

export async function revokeAllUserTokens(userId) {
  if (isRedisAvailable && redis) {
    const pattern = `refresh_token:${userId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } else {
    for (const key of memoryStore.keys()) {
      if (key.startsWith(`refresh_token:${userId}:`)) {
        memoryStore.delete(key);
      }
    }
  }
}

export async function blacklistToken(token, expiresInSeconds) {
  if (isRedisAvailable && redis) {
    const key = `blacklist:${token}`;
    await redis.setex(key, expiresInSeconds, 'revoked');
  } else {
    memoryStore.set(`blacklist:${token}`, {
      value: 'revoked',
      expiry: Date.now() + expiresInSeconds * 1000,
    });
  }
}

export async function isTokenBlacklisted(token) {
  if (isRedisAvailable && redis) {
    const key = `blacklist:${token}`;
    const result = await redis.get(key);
    return result === 'revoked';
  } else {
    const data = memoryStore.get(`blacklist:${token}`);
    if (data && data.expiry > Date.now()) {
      return data.value === 'revoked';
    }
    return false;
  }
}

export default redis;
```

---

## 🟠 Corrections Importantes (Priorité 2)

### 2.1 Améliorer la gestion des erreurs async

**Problème** : Les contrôleurs peuvent crasher sur des erreurs non gérées.

**Solution** : Créer un wrapper async dans `src/utils/asyncHandler.js` :

```javascript
/**
 * Wrapper pour gérer automatiquement les erreurs async dans les contrôleurs
 * @param {Function} fn - Fonction async du contrôleur
 * @returns {Function} Middleware Express
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default asyncHandler;
```

**Utilisation dans les routes** :

```javascript
import { asyncHandler } from '../utils/asyncHandler.js';

// Au lieu de :
router.get('/:id', authenticate, EventController.getEvent);

// Utiliser :
router.get('/:id', authenticate, asyncHandler(EventController.getEvent.bind(EventController)));
```

---

### 2.2 Ajouter des types de fichiers valides pour upload

**Problème** : N'importe quel fichier peut être uploadé.

**Solution** : Dans `src/middlewares/upload.middleware.js` :

```javascript
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from './error.middleware.js';

// Types de fichiers autorisés
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// Filtre des fichiers
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(ApiError.badRequest('Invalid file type. Only images are allowed.', 'INVALID_FILE_TYPE'), false);
  }
  
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(ApiError.badRequest('Invalid file extension.', 'INVALID_FILE_EXT'), false);
  }
  
  cb(null, true);
};

// Configuration Multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
    files: 1, // Un seul fichier à la fois
  },
});

export default upload;
```

---

### 2.3 Sécuriser les headers HTTP

**Vérifier** que Helmet est bien configuré dans `server.js` :

```javascript
import helmet from 'helmet';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
```

---

## 🟡 Améliorations Recommandées (Priorité 3)

### 3.1 Ajouter des index à la base de données

Vérifiez que les index sont créés sur les colonnes fréquemment utilisées :

```sql
-- Dans migrations/001_create_tables.sql

-- Index sur users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Index sur events
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start ON events(start_datetime);
CREATE INDEX idx_events_price ON events(price);

-- Index sur inscriptions
CREATE INDEX idx_inscriptions_user ON inscriptions(user_id);
CREATE INDEX idx_inscriptions_event ON inscriptions(event_id);
CREATE INDEX idx_inscriptions_status ON inscriptions(status);
```

---

### 3.2 Validation côté frontend

Ajouter une validation plus robuste dans les formulaires :

```javascript
// src/utils/validation.js (frontend)

/**
 * Valider un email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valider un mot de passe sécurisé
 */
export function isValidPassword(password) {
  // Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Valider une date future
 */
export function isFutureDate(date) {
  return new Date(date) > new Date();
}

/**
 * Sanitizer basique (XSS)
 */
export function sanitizeString(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

---

### 3.3 Améliorer les messages d'erreur

Créer des messages d'erreur utilisateur-friendly dans le frontend :

```javascript
// src/utils/errorMessages.js

const ERROR_MESSAGES = {
  // Auth
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
  EMAIL_EXISTS: 'Cet email est déjà utilisé',
  USER_NOT_FOUND: 'Utilisateur non trouvé',
  TOKEN_EXPIRED: 'Votre session a expiré. Veuillez vous reconnecter.',
  
  // Events
  EVENT_NOT_FOUND: 'Événement non trouvé',
  NOT_OWNER: 'Vous n\'êtes pas autorisé à modifier cet événement',
  EVENT_CANCELLED: 'Cet événement a été annulé',
  EVENT_FULL: 'Cet événement est complet',
  
  // General
  VALIDATION_ERROR: 'Veuillez vérifier les informations saisies',
  NETWORK_ERROR: 'Erreur de connexion. Vérifiez votre connexion internet.',
  INTERNAL_ERROR: 'Une erreur est survenue. Veuillez réessayer.',
  RATE_LIMITED: 'Trop de tentatives. Veuillez patienter quelques minutes.',
};

export function getErrorMessage(code, defaultMessage = 'Une erreur est survenue') {
  return ERROR_MESSAGES[code] || defaultMessage;
}

export default ERROR_MESSAGES;
```

---

## 📚 Checklist Finale pour l'Épreuve E4

### Documentation

- [ ] README.md complet avec instructions d'installation
- [ ] Documentation API (Swagger ou Postman collection)
- [ ] Schéma de la base de données (diagramme ER)
- [ ] Documentation des choix techniques

### Code Quality

- [ ] Code commenté aux endroits clés
- [ ] Nommage cohérent (camelCase JS, snake_case SQL)
- [ ] Pas de code mort ou de console.log de debug
- [ ] Variables d'environnement pour tous les secrets

### Sécurité

- [ ] Mot de passe hashé avec bcrypt (coût >= 12)
- [ ] JWT avec secrets uniques et complexes
- [ ] Validation des entrées (Joi côté backend)
- [ ] Rate limiting actif
- [ ] Headers sécurisés (Helmet)

### Tests

- [ ] Au moins quelques tests unitaires
- [ ] Tests d'intégration des routes principales
- [ ] Collection Postman fonctionnelle

### Fonctionnalités

- [ ] Inscription / Connexion fonctionnelle
- [ ] CRUD complet sur les événements
- [ ] Inscription aux événements
- [ ] Gestion des rôles (User, Organizer, Admin)
- [ ] Pagination sur les listes

---

## 📝 Points Clés pour l'Oral E4

### Soyez prêt à expliquer :

1. **L'architecture MVC** : Pourquoi cette séparation ? Avantages ?
2. **L'authentification JWT** : Pourquoi deux tokens ? Rotation ?
3. **Le pattern Repository** : Quel problème résout-il ?
4. **Docker** : Pourquoi conteneuriser ? Avantages en production ?
5. **React Context** : Pourquoi utiliser Context pour l'auth ?
6. **Les choix de sécurité** : Rate limiting, validation, hashage...

### Questions types :

- "Comment avez-vous sécurisé l'application ?"
- "Expliquez le flux d'authentification"
- "Pourquoi avez-vous choisi cette architecture ?"
- "Comment gérez-vous les erreurs ?"
- "Comment testeriez-vous cette application ?"

---

## 🎓 Conclusion

Vous avez maintenant tous les éléments pour :

✅ Comprendre l'architecture fullstack professionnelle
✅ Implémenter une authentification sécurisée
✅ Créer une API REST complète
✅ Développer un frontend React moderne
✅ Déployer avec Docker
✅ Appliquer les bonnes pratiques de sécurité

**Bon courage pour votre épreuve E4 !** 🚀

---

*Ces TPs ont été conçus pour le BTS SIO SLAM - Épreuve E4*
