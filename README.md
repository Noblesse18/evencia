# 📋 ANALYSE DU PROJET EVENCIA
## Épreuve E4 – BTS SIO SLAM – Conception et développement d'applications

---

## 📌 Informations générales

| Élément | Description |
|---------|-------------|
| **Nom du projet** | Evencia |
| **Type** | Application web fullstack de gestion d'événements |
| **Stack technique** | Next.js 16 (Frontend) + Express.js (Backend) + MySQL + Drizzle ORM |
| **Fonctionnalités principales** | Gestion d'événements, inscriptions, multi-rôles, dashboard organisateur |

---

## 📖 Documentation API (Swagger)

L’API est documentée avec **Swagger / OpenAPI 3.0**. Vous pouvez explorer et tester tous les endpoints depuis l’interface web.

### Accès à Swagger

| Contexte | URL |
|----------|-----|
| **Backend en local** (`npm run dev` dans `backend/`) | [http://localhost:5000/api-docs](http://localhost:5000/api-docs) |
| **Backend via Docker** (`docker compose up`) | [http://localhost:5000/api-docs](http://localhost:5000/api-docs) |

### Utilisation

1. Ouvrir l’URL dans un navigateur.
2. Pour tester les routes protégées : exécuter **POST /api/auth/login** avec un body `{ "email": "...", "password": "..." }`, copier le `token` dans la réponse.
3. Cliquer sur **Authorize**, saisir `Bearer <votre_token>` (ou uniquement le token selon l’interface), puis valider.
4. Les requêtes suivantes enverront automatiquement le header `Authorization`.

Les sections documentées : **Auth**, **Users**, **Events**, **Inscriptions**, **Payments**.

---

## 📂 Documentation projet (TPs et guides)

| Document | Description |
|----------|-------------|
| `docs/TP-Mobile-React-Native-Expo-Evencia.md` | Application mobile Expo et connexion à l’API |
| `docs/TP-Deploiement-Evencia.md` | Exposition via tunnel (ngrok/Cloudflare) et déploiement sur serveur Linux |
| `docs/TP-Stripe-Evencia.md` | Mise en place de Stripe (clés, backend, test API, optionnel frontend et webhooks) |

---

## 🚀 Installation et lancement en local

### Prérequis

- **Node.js** 18 ou 20 (LTS)
- **npm** (ou yarn)
- **MySQL** 8 (ou MariaDB) installé et démarré sur la machine

### 1. Base de données MySQL

- Démarrer le service MySQL (`sudo systemctl start mysql` sous Linux).
- Créer la base et un utilisateur (ex. dans le client MySQL) :
  ```sql
  CREATE DATABASE IF NOT EXISTS evencianew CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  -- Optionnel : CREATE USER 'evencia'@'localhost' IDENTIFIED BY 'mot_de_passe';
  -- GRANT ALL ON evencianew.* TO 'evencia'@'localhost'; FLUSH PRIVILEGES;
  ```

### 2. Backend (API)

```bash
cd backend
npm install
```

- Créer le fichier **`.env`** à la racine de `backend/` (copier depuis **`env.example`** si présent).
- Renseigner au minimum :
  - `DB_HOST=localhost`
  - `DB_PORT=3306`
  - `DB_USER=root` (ou l’utilisateur créé)
  - `DB_PASSWORD=votre_mot_de_passe`
  - `DB_NAME=evencianew`
  - `JWT_SECRET=une_chaîne_longue_et_aléatoire` (ex. `openssl rand -hex 32`)
  - `PORT=5000`
  - `CORS_ORIGINS=http://localhost:3000,http://localhost:5000`

Puis :

```bash
npm run migrate
npm run seed
npm run dev
```

L’API est disponible sur **http://localhost:5000**. La doc Swagger : **http://localhost:5000/api-docs**.

### 3. Frontend (Next.js)

Dans un **autre terminal** :

```bash
cd frontend
npm install
npm run dev
```

Le site est accessible sur **http://localhost:3000**. Par défaut, le frontend appelle l’API sur `http://localhost:5000/api`. Pour changer l’URL (ex. autre machine) : créer **`frontend/.env.local`** avec `NEXT_PUBLIC_API_URL=http://...`.

### 4. Récapitulatif

| Service   | URL locale              |
|----------|--------------------------|
| Frontend | http://localhost:3000    |
| Backend  | http://localhost:5000   |
| Swagger  | http://localhost:5000/api-docs |

### Alternative : tout lancer avec Docker

À la racine du projet :

```bash
docker compose up --build -d
```

ou, si un Makefile est fourni : `make up-build`.  
Frontend : **http://localhost:3000**, Backend : **http://localhost:5000**, Swagger : **http://localhost:5000/api-docs**. La base MySQL tourne dans un conteneur ; les variables d’environnement sont définies dans `docker-compose.yml`.

---

## 1. 🔍 FONCTIONNEMENT GLOBAL

### ✅ Points positifs

| Aspect | Évaluation |
|--------|------------|
| **Architecture** | Séparation claire Frontend (Next.js) / Backend (Express) / BDD (MySQL) |
| **Communication API** | Bien structurée avec Axios + intercepteurs JWT |
| **Authentification** | JWT fonctionnel avec gestion des rôles (participant, organizer, admin) |
| **CRUD Événements** | Complet avec filtres, pagination, catégories |
| **Gestion des inscriptions** | Fonctionnelle avec vérification des places disponibles |
| **Interface utilisateur** | Moderne, responsive, animations Framer Motion |

### ⚠️ Points d'attention

- **Configuration Docker** : Les migrations doivent être exécutées dans le bon ordre
- **Variables d'environnement** : Le frontend nécessite `NEXT_PUBLIC_API_URL` pour la production
- **Schéma Drizzle** : Défini mais non utilisé dans les contrôleurs (requêtes SQL directes)

---

## 2. 🚨 PROBLÈMES URGENTS À CORRIGER

### 🔴 PRIORITÉ CRITIQUE

| Problème | Fichier | Impact | Solution |
|----------|---------|--------|----------|
| **Secret JWT en dur** | `env.example` | 🔒 Sécurité | Générer un nouveau secret et ne pas versionner |
| **Clé Stripe exposée** | `env.example` | 🔒 Sécurité | Supprimer du dépôt, utiliser variables d'environnement |
| **CORS trop permissif** | `server.js` | 🔒 Sécurité | Restreindre aux domaines autorisés |

### 🟠 PRIORITÉ HAUTE

| Problème | Fichier | Solution |
|----------|---------|----------|
| **Validation manquante events** | `eventController.js` | Ajouter validators comme pour auth |
| **Error handler minimaliste** | `errorHandler.js` | Distinguer les types d'erreurs |
| **Page forgot-password manquante** | Frontend | Créer la page `/forgot-password` |

### 🟡 PRIORITÉ MOYENNE

| Problème | Solution |
|----------|----------|
| **Console.log en production** | Supprimer les logs de debug |
| **Images externes non sécurisées** | Utiliser Next.js Image avec domaines autorisés |

---

## 3. 💡 AMÉLIORATIONS RECOMMANDÉES

### Court terme (avant l'examen)

| Amélioration | Valeur ajoutée pour E4 |
|--------------|------------------------|
| Ajouter des tests unitaires | Démontre la maîtrise des tests (Jest disponible) |
| Créer la page `/forgot-password` | Complète le parcours utilisateur |
| ~~Documenter l'API avec Swagger~~ | ✅ **Fait** – accessible sur `/api-docs` |
| Ajouter validators pour events | Cohérence avec authValidator.js |

### Moyen terme (valorisation du dossier)

| Amélioration | Description |
|--------------|-------------|
| Utiliser Drizzle ORM | Passer aux requêtes typées |
| Système de notifications | Email de confirmation d'inscription |
| Paiement Stripe complet | Le controller existe mais incomplet |
| Graphiques Dashboard | Chart.js ou Recharts pour les stats |

---

## 4. 📁 QUALITÉ DU CODE ET ARCHITECTURE

### Structure des dossiers : ⭐⭐⭐⭐ (4/5)

```
✅ Excellente séparation backend/frontend
✅ Organisation MVC côté backend (controllers, routes, models, middleware)
✅ Composants UI réutilisables (Button, Card, Input)
✅ Store Zustand bien structuré avec persistence
✅ Types TypeScript bien définis (types.ts)

⚠️ Les repositories ne sont pas utilisés
⚠️ Manque un dossier /tests
```

### Lisibilité et maintenabilité : ⭐⭐⭐⭐ (4/5)

**Points forts :**
- Code bien commenté en français
- Nommage explicite des variables et fonctions
- Composants React bien découpés
- Gestion d'état centralisée (Zustand)

**Points à améliorer :**
- Supprimer le code de debug
- Uniformiser les messages d'erreur

### Bonnes pratiques identifiées

```javascript
// ✅ Validation robuste avec express-validator
const validateRegister = [
    body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
];

// ✅ Middleware d'autorisation par rôles
function authorizeRoles(...allowedRoles) { ... }

// ✅ Intercepteurs Axios pour la gestion du token
api.interceptors.request.use((config) => { ... });
```

---

## 5. 🔐 SÉCURITÉ & DONNÉES

### Authentification : ⭐⭐⭐⭐ (4/5)

| Critère | Statut | Commentaire |
|---------|--------|-------------|
| Hashage mot de passe | ✅ | bcrypt avec salt de 10 |
| JWT | ✅ | Expiration 7 jours, payload minimal |
| Vérification token | ✅ | Middleware `authenticateToken` |
| Gestion des rôles | ✅ | 3 niveaux (participant, organizer, admin) |
| Reset password | ⚠️ | Backend OK, frontend manquant |

### Validation des données : ⭐⭐⭐ (3/5)

| Endpoint | Validation |
|----------|------------|
| `/auth/register` | ✅ Complète |
| `/auth/login` | ✅ Basique |
| `/auth/change-password` | ✅ Bonne |
| `/events` (CRUD) | ⚠️ Partielle |
| `/inscriptions` | ⚠️ Basique |

### Points de vigilance pour l'examen

1. **Supprimer les secrets du dépôt Git**
2. **Ajouter rate limiting** (protection brute force)
3. **Configurer CORS correctement**

---

## 📝 ÉVALUATION FINALE

### Note globale : **14,5 / 20**

### Grille d'évaluation détaillée

| Critère | Points max | Obtenu | Commentaire |
|---------|------------|--------|-------------|
| **Fonctionnalité** | 5 | 4 | Application fonctionnelle, CRUD complet |
| **Qualité technique** | 5 | 3,5 | Bonne architecture, manque tests |
| **Sécurité** | 4 | 3 | Auth solide, secrets exposés |
| **Professionnalisme** | 3 | 2 | Code propre, debug à nettoyer |
| **Conformité référentiel** | 3 | 2 | Respect SLAM, documentation à compléter |

---

## 🎯 POINTS FORTS À VALORISER À L'ORAL

1. **Architecture fullstack moderne** (Next.js 16 + Express + MySQL + Drizzle)
2. **Gestion des rôles** avec middleware d'autorisation
3. **UI/UX professionnelle** avec Tailwind + Framer Motion
4. **Docker-compose** pour le déploiement (CORS configuré pour frontend et Swagger)
5. **Documentation API Swagger** sur `/api-docs` pour tester l’API
6. **Validation robuste** avec express-validator
7. **State management** avec Zustand et persistence

---

## ⚡ ACTIONS PRIORITAIRES POUR ATTEINDRE 16+

- [ ] Supprimer les secrets du code versionné
- [ ] Ajouter 5-10 tests unitaires basiques
- [x] Créer une documentation Swagger/OpenAPI (voir section « Documentation API » ci-dessus)
- [ ] Compléter le parcours reset password (frontend)
- [ ] Nettoyer le code de debug (console.log)
- [ ] Ajouter validators pour les événements

---

## 📚 TECHNOLOGIES UTILISÉES

### Frontend
- **Next.js 16** - Framework React avec SSR
- **TypeScript** - Typage statique
- **Tailwind CSS 4** - Framework CSS utilitaire
- **Zustand** - Gestion d'état
- **Framer Motion** - Animations
- **Axios** - Client HTTP
- **date-fns** - Manipulation des dates
- **Lucide React** - Icônes

### Backend
- **Express.js** - Framework Node.js
- **MySQL** - Base de données relationnelle
- **Drizzle ORM** - ORM TypeScript
- **JWT** - Authentification
- **bcrypt** - Hashage des mots de passe
- **express-validator** - Validation des données
- **Swagger / OpenAPI 3** - Documentation interactive de l’API (`/api-docs`)
- **Stripe** - Paiements (Payment Intents ; voir `docs/TP-Stripe-Evencia.md`)

### DevOps
- **Docker** - Conteneurisation
- **Docker Compose** - Orchestration

---

## 🎓 COMPÉTENCES BTS SIO SLAM DÉMONTRÉES

| Compétence | Mise en œuvre |
|------------|---------------|
| **Concevoir une solution applicative** | Architecture MVC, API REST |
| **Développer des composants métier** | Controllers, Services, Repositories |
| **Développer des composants d'accès aux données** | Drizzle ORM, requêtes MySQL |
| **Intégrer des composants applicatifs** | Frontend/Backend, authentification |
| **Tester une solution applicative** | Validation, gestion d'erreurs |
| **Documenter une solution applicative** | Commentaires, types TypeScript, **Swagger/OpenAPI** |

---

## 📅 Date de l'analyse

**14 janvier 2026**

---

> *Ce document a été généré pour préparer la présentation de l'épreuve E4 du BTS SIO SLAM.*
