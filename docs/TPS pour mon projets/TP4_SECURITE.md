# TP4 - Sécuriser l'application
## Durée : 1h30 | Niveau : ⭐⭐⭐ Avancé

---

## 🎯 Objectifs

À la fin de ce TP, tu sauras :
- Protéger les secrets de l'application
- Configurer CORS correctement
- Ajouter un rate limiting
- Nettoyer le code de debug
- Sécuriser les variables d'environnement

---

## 🚨 Problèmes de sécurité identifiés

| Problème | Risque | Priorité |
|----------|--------|----------|
| JWT Secret exposé dans env.example | Un attaquant peut forger des tokens | 🔴 Critique |
| Clé Stripe exposée | Fraude financière possible | 🔴 Critique |
| CORS trop permissif | Attaques CSRF possibles | 🟠 Haute |
| Pas de rate limiting | Attaques brute force | 🟠 Haute |
| Console.log en production | Fuite d'informations | 🟡 Moyenne |

---

## 📋 Étapes du TP

### Étape 1 : Nettoyer env.example

Le fichier `env.example` sert de **modèle** — il ne doit **jamais** contenir de vraies valeurs.

Modifie `backend/env.example` :

```bash
# backend/env.example

# ===========================================
# CONFIGURATION BASE DE DONNÉES
# ===========================================
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_ici
DB_NAME=evencianew

# ===========================================
# CONFIGURATION JWT
# ===========================================
# Générer un secret aléatoire avec: openssl rand -hex 32
JWT_SECRET=REMPLACER_PAR_UN_SECRET_ALEATOIRE_DE_64_CARACTERES
JWT_EXPIRES_IN=7d

# ===========================================
# CONFIGURATION SERVEUR
# ===========================================
PORT=5000
NODE_ENV=development

# ===========================================
# CONFIGURATION CORS
# ===========================================
# Origines autorisées (séparées par des virgules)
CORS_ORIGINS=http://localhost:3000

# ===========================================
# CONFIGURATION STRIPE (optionnel)
# ===========================================
# Obtenir les clés sur https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_ICI
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_WEBHOOK
```

---

### Étape 2 : Ajouter env.example au .gitignore correctement

Vérifie que `.env` (mais PAS `env.example`) est ignoré :

```bash
# backend/.gitignore

# Environment variables
.env
.env.local
.env.*.local

# NE PAS ignorer env.example - c'est le modèle pour les développeurs
# env.example  ← cette ligne ne doit PAS exister
```

---

### Étape 3 : Générer un nouveau JWT Secret

Ouvre un terminal et génère un secret sécurisé :

```bash
# Sur Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])

# Sur Linux/Mac
openssl rand -hex 32

# Ou avec Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie le résultat dans ton fichier `.env` (pas env.example !) :

```bash
# backend/.env
JWT_SECRET=8f4a2b1c9e5d7f3a8b6c4e2d0f9a1b3c5e7d9f1a3b5c7e9d1f3a5b7c9e1d3f5a
```

---

### Étape 4 : Configurer CORS correctement

Modifie `backend/src/server.js` :

**AVANT (trop permissif) :**
```javascript
app.use(cors()); // Accepte TOUTES les origines ❌
```

**APRÈS (sécurisé) :**
```javascript
// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Configuration CORS sécurisée
const corsOptions = {
  origin: function (origin, callback) {
    // Liste des origines autorisées depuis .env
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map(o => o.trim());

    // Autoriser les requêtes sans origin (Postman, curl, etc.) en dev uniquement
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true, // Autoriser les cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// ... reste du code
```

Ajoute dans ton `.env` :

```bash
CORS_ORIGINS=http://localhost:3000,https://ton-domaine.com
NODE_ENV=development
```

---

### Étape 5 : Ajouter le Rate Limiting

Installe le package :

```bash
cd backend
npm install express-rate-limit
```

Modifie `backend/src/server.js` :

```javascript
// backend/src/server.js
const rateLimit = require('express-rate-limit');

// Rate limiter global - 100 requêtes par minute par IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requêtes max
  message: {
    message: 'Trop de requêtes, veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter strict pour l'authentification - 5 tentatives par minute
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 tentatives max
  message: {
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Appliquer le rate limiter global
app.use(globalLimiter);

// Appliquer le rate limiter strict aux routes d'auth
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
// ...
```

---

### Étape 6 : Supprimer les console.log de debug

Recherche et supprime tous les `console.log` de debug :

#### Dans `authController.js` :

```javascript
// SUPPRIMER ces lignes :
console.log('📝 Register request body:', { name, email, role, hasPassword: !!password });
console.log('🔐 Login response:', { email: user.email, role: user.role, responseRole: responseUser.role });
```

#### Dans `Navbar.tsx` :

```javascript
// SUPPRIMER cette ligne :
console.log('🔍 Navbar - User:', user?.email, 'Role:', user?.role, 'isAuthenticated:', isAuthenticated);
```

#### Méthode rapide avec recherche :

Utilise la recherche globale (Ctrl+Shift+F) pour trouver tous les `console.log` et les supprimer.

---

### Étape 7 : Sécuriser les images externes

Modifie `frontend/next.config.ts` pour autoriser uniquement certains domaines d'images :

```typescript
// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  
  // Sécuriser les images externes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      // Ajoute d'autres domaines autorisés ici
    ],
  },
};

export default nextConfig;
```

---

### Étape 8 : Améliorer le middleware d'erreur

Modifie `backend/src/middleware/errorHandler.js` :

```javascript
// backend/src/middleware/errorHandler.js

function errorHandler(err, req, res, next) {
  // Log l'erreur (en production, utiliser un service de logging)
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Erreur:', err);
  } else {
    // En production, logger uniquement les infos essentielles
    console.error(`[${new Date().toISOString()}] ${err.message}`);
  }

  // Déterminer le code de statut
  const status = err.status || err.statusCode || 500;

  // Ne pas exposer les détails des erreurs serveur en production
  const message = status === 500 && process.env.NODE_ENV === 'production'
    ? 'Erreur interne du serveur'
    : err.message || 'Une erreur est survenue';

  // Réponse
  res.status(status).json({
    message,
    // En développement, inclure la stack trace
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
```

---

### Étape 9 : Vérifier que .env n'est pas versionné

Vérifie que ton `.env` n'est pas suivi par git :

```bash
cd backend
git status
```

Si `.env` apparaît dans les fichiers modifiés :

```bash
# Retirer .env du suivi git
git rm --cached .env

# S'assurer qu'il est dans .gitignore
echo ".env" >> .gitignore

# Commit
git add .gitignore
git commit -m "fix: ignore .env file"
```

---

## ✅ Checklist de validation

- [ ] `env.example` ne contient plus de vrais secrets
- [ ] Un nouveau JWT secret a été généré
- [ ] CORS est configuré avec les origines autorisées
- [ ] Rate limiting est en place (global + auth)
- [ ] Les console.log de debug sont supprimés
- [ ] Le error handler ne fuit pas d'infos en production
- [ ] `.env` n'est pas versionné dans git

---

## 🧪 Tester la sécurité

### Test du rate limiting

```bash
# Faire 6 requêtes de login rapidement
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo ""
done
```

La 6ème requête devrait retourner :
```json
{"message": "Trop de tentatives de connexion, veuillez réessayer dans 1 minute"}
```

### Test du CORS

```javascript
// Dans la console du navigateur, depuis un autre domaine
fetch('http://localhost:5000/api/events')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
// Devrait échouer si l'origine n'est pas autorisée
```

---

## 📝 Ce que tu as appris

1. **Les secrets ne doivent jamais être versionnés** — utiliser `.env`
2. **CORS protège contre les requêtes cross-origin** malveillantes
3. **Le rate limiting** empêche les attaques brute force
4. **Les logs de debug** peuvent fuiter des informations sensibles
5. **Le error handler** doit masquer les détails en production

---

## 🔒 Bonnes pratiques de sécurité

| Pratique | Raison |
|----------|--------|
| Utiliser HTTPS | Chiffrer les données en transit |
| Hasher les mots de passe (bcrypt) | ✅ Déjà fait |
| Valider les entrées | ✅ Déjà fait avec express-validator |
| Rate limiting | ✅ Ajouté dans ce TP |
| CORS restrictif | ✅ Ajouté dans ce TP |
| Helmet (headers sécurité) | À ajouter si tu veux aller plus loin |

---

## ➡️ Étape suivante

Passe au [TP5 - Ajouter des tests unitaires](./TP5_TESTS.md) pour tester ton code.
