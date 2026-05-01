# TP — Déploiement Evencia sur Vercel + Render + Aiven

**Public :** BTS SIO option SLAM
**Durée estimée :** 2h
**Contexte :** Déployer gratuitement l'application Evencia (frontend + backend + base de données) sur Internet en utilisant des services cloud.

---

## Objectifs pédagogiques

- Déployer un frontend Next.js sur **Vercel**
- Déployer un backend Express.js sur **Render**
- Créer et configurer une base de données MySQL sur **Aiven**
- Comprendre les problématiques de déploiement cloud : CORS, SSL, variables d'environnement, webhooks

---

## Architecture cible

```
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│   Vercel (CDN)   │  API   │  Render (Node)   │  MySQL  │  Aiven (MySQL)   │
│                  │───────>│                  │───────>│                  │
│  Frontend Next.js│        │  Backend Express │        │  Base de données │
│  (React, SSR)    │        │  (API REST)      │        │  (SSL requis)    │
└──────────────────┘        └──────────────────┘        └──────────────────┘
    evencia-xxx.          evencia.onrender.com        mysql-xxx.aiven.com
    vercel.app
```

---

## Prérequis

- Le projet Evencia fonctionnel en local (frontend + backend + MySQL)
- Un compte **GitHub** avec le code pushé sur un repo
- Un navigateur web (pour créer les comptes sur les services)

---

## Étape 1 — Préparer le code pour le déploiement

### 1.1 Modifier `frontend/next.config.ts`

Si votre fichier contient `output: "standalone"`, **supprimez cette ligne**. Ce mode est conçu pour Docker et n'est pas compatible avec Vercel.

Votre fichier doit ressembler à :

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
};

export default nextConfig;
```

### 1.2 Configurer SSL pour le backend

Aiven (le service de base de données) requiert des connexions SSL. Modifiez `backend/src/config/db.js` pour activer SSL en production :

```javascript
const getSslConfig = () => {
  if (process.env.NODE_ENV !== 'production') return {};
  if (process.env.DB_CA_CERT) {
    return { ssl: { ca: process.env.DB_CA_CERT.replace(/\\n/g, '\n'), rejectUnauthorized: true } };
  }
  return { ssl: { rejectUnauthorized: false } };
};

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'evencianew',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  ...getSslConfig(),
});
```

### 1.3 Configurer le reverse proxy pour Render

Render utilise un reverse proxy devant votre application. Ajoutez dans `backend/src/server.js`, juste après `const app = express();` :

```javascript
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
```

Sans cette ligne, le rate limiter (`express-rate-limit`) plantera avec l'erreur `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`.

### 1.4 Autoriser les requêtes sans origin

Render fait des health checks (requêtes de vérification) sur votre serveur. Ces requêtes n'ont pas d'header `origin`. Modifiez la configuration CORS dans `backend/src/server.js` :

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map(o => o.trim());

    // Autoriser les requêtes sans origin (health checks, Swagger, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
```

### 1.5 Corriger les guillemets dans les requêtes SQL

**Important** : Aiven MySQL utilise le mode `ANSI_QUOTES`. Les guillemets doubles `"` sont interprétés comme des noms de colonnes, pas comme des valeurs texte.

Cherchez dans tout le dossier `backend/src/` les requêtes SQL qui utilisent `"confirmed"`, `"pending"`, etc. et remplacez les guillemets doubles par des guillemets simples :

```javascript
// AVANT (erreur sur Aiven)
'SELECT COUNT(*) as count FROM inscriptions WHERE event_id = ? AND status = "confirmed"'

// APRÈS (fonctionne partout)
"SELECT COUNT(*) as count FROM inscriptions WHERE event_id = ? AND status = 'confirmed'"
```

**Fichiers à vérifier** : `inscriptionController.js` et `paymentController.js`.

### 1.6 Configurer le raw body pour le webhook Stripe

Le webhook Stripe a besoin du body brut (non parsé par JSON) pour vérifier la signature. Modifiez le middleware dans `backend/src/server.js` :

```javascript
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});
```

### 1.7 Pusher les modifications

```bash
git add .
git commit -m "fix: préparation pour déploiement cloud (SSL, CORS, trust proxy)"
git push origin votre-branche
```

---

## Étape 2 — Créer la base de données sur Aiven

### 2.1 Créer un compte

1. Allez sur [aiven.io](https://aiven.io)
2. Créez un compte gratuit (connexion via GitHub possible)

### 2.2 Créer un service MySQL

1. Cliquez sur **"Create service"**
2. Sélectionnez **MySQL**
3. Plan : **Free**
4. Région : la plus proche (ex: Europe)
5. Cliquez sur **"Create service"**

### 2.3 Récupérer les identifiants

Une fois le service en état **"Running"** (pastille verte), allez dans l'onglet **Overview**. Notez :

| Information | Exemple |
|---|---|
| **Host** | `mysql-xxx.l.aivencloud.com` |
| **Port** | `15170` |
| **User** | `avnadmin` |
| **Password** | cliquez sur l'icône œil puis copier |
| **Database** | `defaultdb` |

### 2.4 Tester la connexion localement

Avant de configurer Render, **testez toujours la connexion depuis votre machine** :

```bash
cd backend
node -e "
const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'VOTRE_HOST',
      port: VOTRE_PORT,
      user: 'avnadmin',
      password: 'VOTRE_MDP',
      database: 'defaultdb',
      ssl: { rejectUnauthorized: false }
    });
    console.log('Connexion reussie !');
    await conn.end();
  } catch (e) {
    console.log('Erreur:', e.message);
  }
})();
"
```

Si vous obtenez `Connexion reussie !`, passez à la suite. Sinon, vérifiez vos identifiants.

> **Attention** : si la connexion échoue avec "Access denied", utilisez le bouton **copier** d'Aiven pour le mot de passe (ne le tapez pas à la main). Si ça échoue toujours, réinitialisez le mot de passe via l'icône de réinitialisation sur Aiven.

### 2.5 Migrer la base de données

La base Aiven est vide. Il faut créer les tables en lançant les migrations :

```bash
cd backend
DB_HOST=votre_host DB_PORT=votre_port DB_USER=avnadmin DB_PASSWORD='votre_mdp' DB_NAME=defaultdb node -e "
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, multipleStatements: true,
    ssl: { rejectUnauthorized: false }
  });
  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    console.log('Migration:', file);
    await conn.query(fs.readFileSync(path.join(dir, file), 'utf8'));
    console.log('  OK');
  }
  await conn.end();
  console.log('Migrations terminées !');
})();
"
```

> **Attention** : si vos fichiers SQL contiennent `CREATE DATABASE evencianew; USE evencianew;`, les tables seront créées dans `evencianew` et non dans `defaultdb`. Notez le nom de la base réellement utilisée, vous en aurez besoin à l'étape suivante.

Pour vérifier dans quelle base les tables ont été créées :

```bash
node -e "
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'VOTRE_HOST', port: VOTRE_PORT,
    user: 'avnadmin', password: 'VOTRE_MDP',
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
  });
  const [dbs] = await conn.query('SHOW DATABASES');
  console.log('Databases:', dbs.map(d => d.Database));
  await conn.end();
})();
"
```

Si les tables sont dans `evencianew`, utilisez `evencianew` comme `DB_NAME` dans les étapes suivantes.

---

## Étape 3 — Déployer le backend sur Render

### 3.1 Créer un compte

1. Allez sur [render.com](https://render.com)
2. Connectez-vous avec votre **compte GitHub**

### 3.2 Créer un Web Service

1. Cliquez sur **"New" → "Web Service"**
2. Choisissez **"Git Provider"** → connectez votre GitHub
3. Sélectionnez votre repo Evencia
4. Configurez :

| Paramètre | Valeur |
|---|---|
| **Name** | `evencia` |
| **Branch** | votre branche (ex: `linux` ou `main`) |
| **Runtime** | **Node** (pas Docker !) |
| **Root Directory** | `backend` (pas d'espace !) |
| **Build Command** | `npm install` |
| **Start Command** | `node src/server.js` |
| **Instance Type** | Free |

> **Piège courant** : Render propose "Docker" par défaut comme runtime. Choisissez **Node**.

> **Piège courant** : pas d'espace dans le Root Directory. `backend ` (avec espace) → erreur.

### 3.3 Ajouter les variables d'environnement

Avant de cliquer sur "Create Web Service", ajoutez les variables d'environnement. Vous pouvez les ajouter une par une ou utiliser le bouton **"Add from .env"** :

```
DB_HOST=votre-host-aiven.l.aivencloud.com
DB_PORT=15170
DB_USER=avnadmin
DB_PASSWORD=votre_mot_de_passe_aiven
DB_NAME=evencianew
JWT_SECRET=votre_secret_jwt
NODE_ENV=production
CORS_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
STRIPE_SECRET_KEY=votre_cle_stripe
STRIPE_WEBHOOK_SECRET=votre_webhook_secret
```

> On met `http://localhost:3000` temporairement pour CORS et FRONTEND_URL. On les mettra à jour avec l'URL Vercel après.

### 3.4 Déployer

Cliquez sur **"Create Web Service"**. Render va :
1. Cloner votre repo
2. Installer les dépendances (`npm install`)
3. Lancer le serveur (`node src/server.js`)

### 3.5 Vérifier les logs

Dans les logs Render, vous devez voir :

```
Server started on port 10000
Connected to MySQL
```

Si vous voyez `MySQL connection error: Access denied`, revérifiez le mot de passe (voir étape 2.4).

Notez l'URL de votre backend : `https://evencia.onrender.com` (ou le nom que vous avez choisi).

---

## Étape 4 — Déployer le frontend sur Vercel

### 4.1 Créer un compte

1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous avec votre **compte GitHub**

### 4.2 Importer le projet

1. Cliquez sur **"Add New" → "Project"**
2. Sélectionnez votre repo Evencia
3. Configurez :

| Paramètre | Valeur |
|---|---|
| **Framework** | Next.js (auto-détecté) |
| **Root Directory** | cliquez sur "Edit" → tapez `./frontend` |
| **Branch** | votre branche |

> **Piège courant** : mettre `./frontend` et non `frontend` seul, sinon Vercel ne trouve pas le dossier.

### 4.3 Ajouter la variable d'environnement

Une seule variable nécessaire :

| Clé | Valeur |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://votre-backend.onrender.com/api` |

Remplacez par l'URL réelle de votre backend Render (étape 3.5).

### 4.4 Configurer la branche de production

Si votre branche principale n'est pas `main` ou `master` :

1. Allez dans **Settings → General**
2. Trouvez **"Production Branch"**
3. Changez pour votre branche (ex: `linux`)

> **Piège courant** : sans cette modification, Vercel déploie votre branche en mode "preview" et l'URL de production affiche "Not Found".

### 4.5 Déployer

Cliquez sur **"Deploy"**. Si le build échoue à cause d'une version Next.js vulnérable :

```bash
cd frontend
npm install next@latest
git add . && git commit -m "fix: update next.js" && git push
```

### 4.6 Vérifier

Une fois le déploiement terminé ("Ready"), visitez votre URL (ex: `https://evencia-xxx.vercel.app`). La page d'accueil doit s'afficher.

---

## Étape 5 — Connecter Vercel et Render

Maintenant que vous avez les deux URLs, il faut les relier.

### 5.1 Mettre à jour Render avec l'URL Vercel

Sur **Render → Environment**, modifiez :

| Variable | Valeur |
|---|---|
| `CORS_ORIGINS` | `https://votre-app.vercel.app` |
| `FRONTEND_URL` | `https://votre-app.vercel.app` |

> **Piège courant** : ne mettez **pas** de `/` à la fin de l'URL. Le navigateur envoie `https://app.vercel.app` comme origin, et `https://app.vercel.app/` ne correspondra pas.

Render redémarrera automatiquement.

### 5.2 Tester

1. Visitez votre site Vercel
2. Allez sur la page des événements
3. Les événements doivent s'afficher

Si vous voyez des erreurs, ouvrez la console du navigateur (F12 → Console) et vérifiez s'il y a des erreurs CORS ou réseau.

---

## Étape 6 — Configurer le webhook Stripe (optionnel)

Si votre application utilise les paiements Stripe, le webhook doit pointer vers votre backend en production :

1. Allez sur [dashboard.stripe.com](https://dashboard.stripe.com) → **Développeurs** → **Webhooks**
2. Cliquez sur **"Ajouter un endpoint"**
3. URL : `https://votre-backend.onrender.com/api/payments/webhook`
4. Événement : `checkout.session.completed`
5. Copiez le nouveau **Signing secret** (`whsec_...`)
6. Mettez à jour `STRIPE_WEBHOOK_SECRET` sur Render avec ce nouveau secret

---

## Récapitulatif

### Ce que vous avez déployé

| Service | Rôle | URL |
|---|---|---|
| **Vercel** | Frontend Next.js | `https://votre-app.vercel.app` |
| **Render** | Backend Express.js | `https://votre-app.onrender.com` |
| **Aiven** | Base de données MySQL | `mysql-xxx.aivencloud.com:15170` |

### Variables d'environnement

**Vercel** (1 seule) :

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://votre-backend.onrender.com/api` |

**Render** (11 variables) :

| Variable | Valeur |
|---|---|
| `DB_HOST` | host Aiven |
| `DB_PORT` | port Aiven |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | mot de passe Aiven |
| `DB_NAME` | `evencianew` (ou `defaultdb`) |
| `JWT_SECRET` | votre secret |
| `NODE_ENV` | `production` |
| `CORS_ORIGINS` | URL Vercel (sans `/`) |
| `FRONTEND_URL` | URL Vercel (sans `/`) |
| `STRIPE_SECRET_KEY` | clé Stripe |
| `STRIPE_WEBHOOK_SECRET` | secret webhook Stripe |

### Limitations du plan gratuit

| Service | Limitation | Impact |
|---|---|---|
| **Render** | Veille après 15 min d'inactivité | Premier chargement ~30-50s |
| **Aiven** | Suppression après ~30 jours d'inactivité | Se connecter au dashboard 1x/mois |
| **Vercel** | 100 Go bande passante/mois | Aucun impact pour un projet école |

---

## Checklist de vérification

- [ ] `frontend/next.config.ts` : pas de `output: "standalone"`
- [ ] `backend/src/config/db.js` : SSL activé en production
- [ ] `backend/src/server.js` : `trust proxy` activé en production
- [ ] `backend/src/server.js` : CORS autorise les requêtes sans origin
- [ ] `backend/src/server.js` : `express.raw()` pour le webhook Stripe
- [ ] Requêtes SQL : guillemets simples pour les valeurs (pas de `"confirmed"`)
- [ ] Aiven : connexion testée localement avant de configurer Render
- [ ] Aiven : migrations exécutées, tables vérifiées
- [ ] Render : Runtime = Node (pas Docker)
- [ ] Render : Root Directory = `backend` (sans espace)
- [ ] Render : toutes les variables d'environnement configurées
- [ ] Vercel : Root Directory = `./frontend`
- [ ] Vercel : branche de production = votre branche
- [ ] Vercel : `NEXT_PUBLIC_API_URL` configurée
- [ ] Render : `CORS_ORIGINS` = URL Vercel **sans** `/` à la fin
- [ ] Stripe : webhook endpoint créé pour la production (si applicable)

---

## Dépannage

### Le site affiche "Not Found" sur Vercel

→ La branche de production n'est pas la bonne. Changez dans Settings → General → Production Branch.

### "Non autorisé par CORS" dans les logs Render

→ Vérifiez `CORS_ORIGINS` : doit correspondre exactement à l'URL Vercel, sans `/` final.

### "Access denied" pour MySQL sur Render

→ Le mot de passe est incorrect. Copiez-le depuis Aiven avec le bouton copier. Testez d'abord localement (étape 2.4).

### "Unknown column 'confirmed'"

→ Vos requêtes SQL utilisent `"confirmed"` (guillemets doubles). Remplacez par `'confirmed'` (guillemets simples).

### "self-signed certificate in certificate chain"

→ Le SSL est activé avec `rejectUnauthorized: true` mais sans certificat CA. Utilisez `rejectUnauthorized: false`.

### Les inscriptions payantes restent en "pending"

→ Le webhook Stripe n'est pas configuré pour la production (étape 6).

### Le backend met 30-50 secondes à répondre

→ C'est normal sur le plan gratuit de Render (cold start). Le serveur se met en veille après 15 min d'inactivité.
