# TP01 - Configuration de l'Environnement

## 🎯 Objectifs

- Installer et configurer l'environnement de développement
- Initialiser le projet backend avec Node.js
- Configurer les variables d'environnement de manière sécurisée
- Comprendre la structure d'un projet professionnel

**Durée estimée :** 1 heure

---

## 📋 Prérequis

- Node.js 18+ installé
- Git installé
- Un éditeur de code (VS Code / Cursor)

---

## Étape 1 : Créer la structure du projet

### 1.1 Créer le dossier racine

```bash
# Créer le dossier du projet
mkdir onelastevent
cd onelastevent

# Initialiser un dépôt Git
git init

# Créer les sous-dossiers
mkdir backend frontend
```

### 1.2 Créer le fichier .gitignore

Créez un fichier `.gitignore` à la racine :

```gitignore
# Dependencies
node_modules/

# Environment variables (IMPORTANT : ne jamais commit ces fichiers !)
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*

# Build
dist/
build/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Uploads
uploads/*
!uploads/.gitkeep
```

> ⚠️ **IMPORTANT** : Le fichier `.gitignore` protège vos secrets ! Ne commitez JAMAIS vos fichiers `.env`.

---

## Étape 2 : Initialiser le Backend

### 2.1 Créer le package.json

```bash
cd backend
npm init -y
```

### 2.2 Modifier le package.json

Remplacez le contenu par :

```json
{
  "name": "onelastevent-backend",
  "version": "1.0.0",
  "description": "OneLastEvent API - Event management platform",
  "type": "module",
  "main": "src/server.js",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "migrate": "node src/scripts/migrate.js",
    "seed": "node src/scripts/seed.js",
    "test": "NODE_OPTIONS='--experimental-vm-modules' jest --coverage",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix"
  },
  "keywords": ["events", "platform", "nodejs", "express", "mysql"],
  "author": "Votre Nom",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

> 💡 **Explication** : `"type": "module"` permet d'utiliser les **ES Modules** (`import/export`) au lieu de CommonJS (`require`).

### 2.3 Installer les dépendances

```bash
# Dépendances de production
npm install express cors helmet dotenv mysql2 sequelize jsonwebtoken bcryptjs joi ioredis socket.io multer uuid winston express-rate-limit stripe

# Dépendances de développement
npm install -D nodemon eslint prettier jest supertest
```

**Explication des packages :**

| Package | Rôle |
|---------|------|
| `express` | Framework web |
| `cors` | Gestion du Cross-Origin |
| `helmet` | Sécurité des headers HTTP |
| `dotenv` | Variables d'environnement |
| `mysql2` | Driver MySQL |
| `sequelize` | ORM pour MySQL |
| `jsonwebtoken` | Création/vérification JWT |
| `bcryptjs` | Hachage des mots de passe |
| `joi` | Validation des données |
| `ioredis` | Client Redis |
| `socket.io` | WebSockets |
| `multer` | Upload de fichiers |
| `winston` | Logging |
| `express-rate-limit` | Protection contre les attaques |

---

## Étape 3 : Créer la structure des dossiers

```bash
# Dans le dossier backend/
mkdir -p src/{config,controllers,services,repositories,models,middlewares,validators,routes,utils,scripts,migrations}
mkdir -p uploads logs
touch uploads/.gitkeep logs/.gitkeep
```

Structure obtenue :

```
backend/
├── src/
│   ├── config/        # Configuration (DB, Redis, Logger)
│   ├── controllers/   # Gestion des requêtes HTTP
│   ├── services/      # Logique métier
│   ├── repositories/  # Accès aux données
│   ├── models/        # Entités Sequelize
│   ├── middlewares/   # Auth, validation, erreurs
│   ├── validators/    # Schémas Joi
│   ├── routes/        # Définition des routes
│   ├── utils/         # Fonctions utilitaires
│   ├── scripts/       # Migration, Seed
│   └── migrations/    # Scripts SQL
├── uploads/           # Fichiers uploadés
├── logs/              # Fichiers de logs
└── package.json
```

---

## Étape 4 : Créer le fichier .env

### 4.1 Créer le fichier .env.example

Ce fichier sert de **modèle** et peut être commité :

```bash
touch .env.example
```

Contenu de `.env.example` :

```env
# Application
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000

# Database MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=onelastevent_db

# JWT (GÉNÉRER DES SECRETS UNIQUES !)
JWT_ACCESS_SECRET=REMPLACER_PAR_UN_SECRET_ALEATOIRE_32_CARACTERES
JWT_REFRESH_SECRET=REMPLACER_PAR_UN_AUTRE_SECRET_ALEATOIRE
JWT_ACCESS_EXP=15m
JWT_REFRESH_EXP=30d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Stripe (optionnel)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4.2 Créer le fichier .env (CONFIDENTIEL)

```bash
cp .env.example .env
```

> ⚠️ **CRITIQUE** : Le fichier `.env` contient vos secrets. Ne le partagez JAMAIS !

### 4.3 Générer des secrets JWT sécurisés

Dans un terminal Node.js :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Exécutez cette commande **2 fois** et utilisez les résultats pour `JWT_ACCESS_SECRET` et `JWT_REFRESH_SECRET`.

---

## Étape 5 : Créer le serveur de base

### 5.1 Créer src/server.js

```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Créer l'application Express
const app = express();

// Middlewares de sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Parser le body JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'OneLastEvent API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Démarrer le serveur
const PORT = parseInt(process.env.PORT, 10) || 4000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📚 API available at http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
```

---

## Étape 6 : Tester le serveur

### 6.1 Lancer le serveur en mode développement

```bash
npm run dev
```

Vous devriez voir :

```
🚀 Server running on http://0.0.0.0:4000
📚 API available at http://localhost:4000/api
🌍 Environment: development
```

### 6.2 Tester l'endpoint health

Dans un navigateur ou avec curl :

```bash
curl http://localhost:4000/api/health
```

Réponse attendue :

```json
{
  "status": "ok",
  "message": "OneLastEvent API is running!",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

---

## ✅ Checklist de validation

Avant de passer au TP suivant, vérifiez :

- [ ] Le dossier `backend/` existe avec la bonne structure
- [ ] Le fichier `.gitignore` est créé et contient `.env`
- [ ] Le fichier `.env` existe (et n'est PAS dans Git)
- [ ] Les dépendances sont installées (`node_modules/` existe)
- [ ] Le serveur démarre sans erreur avec `npm run dev`
- [ ] L'endpoint `/api/health` retourne une réponse JSON

---

## 📝 Points Clés à Retenir

1. **Variables d'environnement** : Stockez toujours les secrets dans `.env`, jamais dans le code
2. **ES Modules** : Utilisez `import/export` avec `"type": "module"`
3. **Sécurité** : Helmet et CORS sont essentiels dès le départ
4. **Structure** : Une bonne organisation facilite la maintenance

---

## 🔗 Prochaine étape

Continuez avec le [TP02 - Base de données MySQL + Sequelize](./TP02_Base_de_donnees.md)
