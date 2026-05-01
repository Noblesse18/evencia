# Documentation technique — Evencia

> Architecture, base de données, API REST, sécurité et déploiement.

---

## 1. Architecture globale

L'application Evencia repose sur une architecture **client-serveur découplée** avec trois clients (web, mobile, Swagger) qui communiquent avec une API REST centrale.

```
┌──────────────────────────────────────────────────────────────────┐
│                        Clients                                    │
│                                                                  │
│   ┌──────────────────┐    ┌──────────────────────────────────┐  │
│   │  Application      │    │  Application Web                 │  │
│   │  Mobile (Expo)    │    │  Next.js 16 + TypeScript         │  │
│   │  React Native     │    │  Tailwind CSS 4 + Framer Motion  │  │
│   │  NativeWind       │    │  Zustand (state) + Axios         │  │
│   └────────┬─────────┘    └──────────────┬───────────────────┘  │
│            │          HTTP / REST          │                      │
└────────────┼──────────────────────────────┼──────────────────────┘
             │                              │
             ▼                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     API REST — Express.js                         │
│                                                                  │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────────────┐  │
│  │ Middleware   │  │ Controllers│  │ Services / Validators    │  │
│  │ JWT + Roles  │  │ (5 modules)│  │ express-validator        │  │
│  │ Rate Limit   │  │            │  │ bcrypt · jsonwebtoken    │  │
│  │ CORS         │  │            │  │                          │  │
│  └──────┬──────┘  └─────┬──────┘  └────────────┬─────────────┘  │
│         │               │                       │                │
│         ▼               ▼                       ▼                │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │           Repositories + mysql2 (pool)                   │    │
│  │           Drizzle ORM (schémas)                          │    │
│  └────────────────────────┬─────────────────────────────────┘    │
│                           │                                      │
│  ┌────────────────┐       │       ┌──────────────────────────┐   │
│  │ Swagger UI     │       │       │ Stripe API               │   │
│  │ /api-docs      │       │       │ Checkout + Webhooks      │   │
│  └────────────────┘       │       └──────────────────────────┘   │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │   MySQL 8.0         │
                 │   Base : evencianew │
                 │   (Docker volume)   │
                 └─────────────────────┘
```

---

## 2. Architecture Backend — Couches

Le backend suit une architecture en couches :

| Couche | Responsabilité | Technologies |
|--------|---------------|-------------|
| **Sécurité** | Authentification, autorisation, rate limiting, CORS | JWT, authorizeRoles, express-rate-limit |
| **Controllers** | Orchestration des requêtes HTTP | authController, eventController, userController, inscriptionController, paymentController |
| **Validators** | Validation des données entrantes | express-validator |
| **Services** | Logique métier | bcrypt (hashage), jwt (tokens), Stripe (paiements), vérification des places |
| **Repositories** | Accès aux données | BaseRepository, UserRepository, EventRepository, InscriptionRepository (mysql2 pool, requêtes paramétrées) |
| **Base de données** | Stockage persistant | MySQL 8.0, Drizzle ORM (schémas), migrations SQL |

---

## 3. Schéma de la base de données

La base `evencianew` contient 4 tables principales :

```
┌────────────────────────┐       ┌──────────────────────────────┐
│        users           │       │          events              │
├────────────────────────┤       ├──────────────────────────────┤
│ id        VARCHAR(36)  │ PK    │ id          VARCHAR(36)  PK  │
│ name      VARCHAR(100) │       │ title       VARCHAR(200)     │
│ email     VARCHAR(100) │ UK    │ description TEXT             │
│ password  VARCHAR(255) │       │ category    VARCHAR(100)     │
│ role      ENUM         │       │ location    VARCHAR(200)     │
│  (participant,         │       │ event_date  DATETIME         │
│   organizer, admin)    │       │ price       DECIMAL(10,2)    │
│ created_at TIMESTAMP   │◄──────│ organizer_id VARCHAR(36) FK  │
│ updated_at TIMESTAMP   │       │ max_tickets INT              │
│ last_login TIMESTAMP   │       │ image_url   VARCHAR(500)     │
└──────────┬─────────────┘       │ photos      JSON             │
           │                     └─────────────┬────────────────┘
           │                                   │
           │    ┌─────────────────────────┐    │
           │    │     inscriptions        │    │
           │    ├─────────────────────────┤    │
           │    │ id       VARCHAR(36) PK │    │
           └───►│ user_id  VARCHAR(36) FK │    │
                │ event_id VARCHAR(36) FK │◄───┘
                │ status   ENUM          │
                │  (pending, confirmed,  │
                │   cancelled)           │
                │ UNIQUE(user_id,        │
                │        event_id)       │
                └────────────────────────┘

           ┌──────────────────────────────┐
           │         payments             │
           ├──────────────────────────────┤
           │ id                VARCHAR(36)│ PK
           │ user_id           VARCHAR(36)│ FK → users
           │ event_id          VARCHAR(36)│ FK → events
           │ amount            DECIMAL    │
           │ status            VARCHAR    │
           │ stripe_payment_intent_id     │ UK
           │ stripe_customer_id           │
           │ payment_method    VARCHAR    │
           │ card_last4        VARCHAR(4) │
           │ card_brand        VARCHAR    │
           └──────────────────────────────┘
```

**Relations :**
- `users` 1 → N `events` (un organisateur crée plusieurs événements)
- `users` 1 → N `inscriptions` (un utilisateur s'inscrit à plusieurs événements)
- `events` 1 → N `inscriptions` (un événement a plusieurs inscrits)
- `inscriptions` 1 → 0..1 `payments` (une inscription peut avoir un paiement)

---

## 4. Endpoints de l'API REST

Documentation interactive complète : http://localhost:5000/api-docs (Swagger)

### Authentification (`/api/auth`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|:----:|
| POST | `/api/auth/register` | Inscription (name, email, password, role) | Non |
| POST | `/api/auth/login` | Connexion → retourne JWT | Non |
| GET | `/api/auth/verify` | Vérification du token | Oui |
| POST | `/api/auth/change-password` | Changement de mot de passe | Oui |
| POST | `/api/auth/request-password-reset` | Demande réinitialisation | Non |
| POST | `/api/auth/reset-password` | Réinitialisation par token | Non |

### Utilisateurs (`/api/users`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|:----:|
| GET | `/api/users/me` | Mon profil | Oui |
| PUT | `/api/users/me` | Modifier mon profil | Oui |
| GET | `/api/users/` | Liste des utilisateurs | Admin |
| GET | `/api/users/:id` | Détail d'un utilisateur | Oui |

### Événements (`/api/events`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|:----:|
| GET | `/api/events` | Lister (filtres, recherche, pagination) | Non |
| GET | `/api/events/:id` | Détail d'un événement | Non |
| GET | `/api/events/categories` | Liste des catégories | Non |
| GET | `/api/events/organizer/my-events` | Mes événements (organisateur) | Organizer |
| POST | `/api/events` | Créer un événement | Organizer/Admin |
| PUT | `/api/events/:id` | Modifier un événement | Organizer/Admin |
| DELETE | `/api/events/:id` | Supprimer un événement | Organizer/Admin |

### Inscriptions (`/api/inscriptions`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|:----:|
| GET | `/api/inscriptions/my` | Mes inscriptions | Oui |
| POST | `/api/inscriptions` | S'inscrire à un événement | Participant |
| DELETE | `/api/inscriptions/:id` | Annuler une inscription | Participant |

### Paiements (`/api/payments`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|:----:|
| POST | `/api/payments` | Créer une session Stripe Checkout | Oui |
| POST | `/api/payments/webhook` | Webhook Stripe (confirmation paiement) | Stripe |

---

## 5. Sécurité

| Mesure | Implémentation |
|--------|---------------|
| **Hashage mots de passe** | bcrypt avec salt factor 10 |
| **Authentification** | JWT (jsonwebtoken) avec expiration 7 jours |
| **Autorisation par rôles** | Middleware `authorizeRoles('participant', 'organizer', 'admin')` |
| **Validation des entrées** | express-validator (email, longueur min/max, regex mot de passe) |
| **Protection brute force** | express-rate-limit : 100 req/min global, 5 req/min sur `/auth` |
| **CORS** | Origines restreintes via variable `CORS_ORIGINS` |
| **Interception token expiré** | Intercepteur Axios côté frontend (déconnexion auto sur 401) |
| **Requêtes SQL sécurisées** | Requêtes paramétrées via mysql2 (protection injection SQL) |

### Flux d'authentification JWT

```
Utilisateur                    API Express                    MySQL
    │                              │                            │
    │── POST /api/auth/login ─────►│                            │
    │   { email, password }        │── SELECT user WHERE email ►│
    │                              │◄── user row ───────────────│
    │                              │                            │
    │                              │ bcrypt.compare(password,   │
    │                              │   user.password)           │
    │                              │                            │
    │                              │ jwt.sign({ id, role },     │
    │                              │   JWT_SECRET, { 7d })      │
    │                              │                            │
    │◄── { token, user } ─────────│                            │
    │                              │                            │
    │── GET /api/events ──────────►│                            │
    │   Authorization: Bearer xxx  │ authenticateToken()        │
    │                              │ jwt.verify(token, secret)  │
    │                              │ authorizeRoles()           │
    │◄── { events: [...] } ───────│                            │
```

---

## 6. Conteneurisation Docker

### Environnement local (`docker-compose.yml`)

3 services orchestrés :

| Service | Image | Port | Détail |
|---------|-------|------|--------|
| **mysql** | mysql:8.0 | 3307 → 3306 | Volume persistant, migrations SQL auto, healthcheck |
| **backend** | Node 20 Alpine | 5000 | Dépend de mysql (healthy), variables d'env |
| **frontend** | Next.js 16 | 3000 | Build multi-stage, dépend de backend |

### Environnement production (`docker-compose.prod.yml`)

5 services (les 3 ci-dessus + Nginx + Certbot) :

| Service | Rôle |
|---------|------|
| **nginx** | Reverse proxy, ports 80/443, routage `/api` → backend, `/` → frontend |
| **certbot** | Certificat SSL Let's Encrypt (HTTPS automatique) |

**Hébergement** : Oracle Cloud Free Tier (VM ARM, 4 CPU, 24 Go RAM)
**Domaine** : `evencia.duckdns.org` (sous-domaine DuckDNS gratuit)

---

## 7. Architecture Frontend — Next.js 16

```
Application Web — Next.js 16 (React 19)

  Pages (App Router)
  ├── /              Page d'accueil (événements mis en avant)
  ├── /events        Liste avec filtres, recherche, pagination
  ├── /events/[id]   Détail + inscription + paiement Stripe
  ├── /events/create Création d'événement (organizer/admin)
  ├── /dashboard     Tableau de bord organisateur
  ├── /profile       Profil utilisateur
  ├── /auth/login    Connexion
  └── /auth/register Inscription

  Components Layer
  ├── Navbar, Footer, EventCard, FilterBar
  ├── ProtectedRoute, DashboardStats
  └── Composants réutilisables (Button, Card, Input)

  State Management → Zustand 5 (persistance localStorage)
  API Layer → Axios + intercepteur JWT (déconnexion auto sur 401)
  Style → Tailwind CSS 4 + Framer Motion 12 + Lucide React
```

---

## 8. Architecture Mobile — React Native / Expo

```
Application Mobile — Expo SDK 54 (React Native 0.81)

  Navigation (React Navigation 7)
  ├── Stack Navigator (Login → Main)
  └── Bottom Tab Navigator
      ├── HomeScreen       → Événements à la une
      ├── SearchScreen     → Recherche + filtres
      ├── DashboardScreen  → Mes inscriptions
      └── ProfileScreen    → Mon profil + déconnexion
          └── EventDetailScreen → Détail + inscription (Stack)

  Context Layer → AuthContext (login, logout, token AsyncStorage)
  API Layer → Axios (baseURL: 10.0.2.2:5000/api) + intercepteur JWT
  Style → NativeWind v4 (Tailwind CSS pour React Native)
  Animations → react-native-reanimated 4.1
```

L'application mobile communique avec le même backend Express.js que le frontend web.

---

## 9. Tests API

La collection Postman complète est disponible dans [`docs/evencia-postman-collection.json`](evencia-postman-collection.json).

### Tests couverts

| Catégorie | Nombre de tests | Scénarios |
|-----------|:--------------:|-----------|
| **Auth** | 15 | Register (participant, organizer, duplicate, missing fields, weak password), Login (success, invalid, missing), Verify token (valid, invalid, missing), Change password, Reset password |
| **Users** | 6 | Get profile, Update profile, Get by ID, Not found, Access control (sans auth, non-admin) |
| **Events** | 12 | Get categories, Create (free, paid, unauthorized), List (all, filters, search, pagination), Get by ID, Not found, Update, My events |
| **Inscriptions** | Tests d'inscription, annulation, cas d'erreur |
| **Payments** | Création de session Stripe Checkout |

---

## 10. Variables d'environnement

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `DB_HOST` | Hôte MySQL | `localhost` (Docker : `mysql`) |
| `DB_PORT` | Port MySQL | `3306` |
| `DB_USER` | Utilisateur MySQL | `root` |
| `DB_PASSWORD` | Mot de passe MySQL | `comaravel` |
| `DB_NAME` | Nom de la base | `evencianew` |
| `JWT_SECRET` | Clé secrète JWT | *(à générer)* |
| `PORT` | Port du backend | `5000` |
| `CORS_ORIGINS` | Origines autorisées | `http://localhost:3000` |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | *(mode test)* |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe | *(fourni par Stripe CLI)* |
| `FRONTEND_URL` | URL du frontend | `http://localhost:3000` |

---

## 11. Choix des dépendances (justification)

Cette section explique **pourquoi** chaque dépendance a été choisie dans le projet (web, mobile, backend).

### Backend (`backend/package.json`)

#### Dépendances

- **express** : framework HTTP minimal et très répandu, idéal pour exposer une API REST claire avec middlewares (auth, validation, rate-limit…).
- **mysql2** : driver MySQL performant avec support des pools et des requêtes paramétrées (sécurité contre l’injection SQL).
- **drizzle-orm** : ORM léger orienté schémas, utilisé pour structurer les tables et faciliter l’évolution du modèle sans complexité excessive.
- **bcrypt** : référence pour le **hashage sécurisé** des mots de passe (salt + coût configurable).
- **jsonwebtoken** : génération/vérification de JWT pour une authentification stateless adaptée à une API REST.
- **express-validator** : validation des entrées côté serveur (formats, longueurs, règles métier basiques) avant d’atteindre la logique métier.
- **cors** : contrôle explicite des origines autorisées entre frontend/mobile et API.
- **express-rate-limit** : limitation de débit pour réduire le risque de brute force et d’abus (notamment sur `/auth`).
- **dotenv** : chargement des variables d’environnement en local (cohérent avec Docker/Render où les vars sont injectées).
- **swagger-jsdoc** : génération de la spécification OpenAPI depuis la configuration JSDoc.
- **swagger-ui-express** : interface Swagger UI servie par Express pour tester/documenter l’API.
- **stripe** : SDK officiel Stripe pour Checkout et webhooks (fiable, maintenu, conforme aux bonnes pratiques Stripe).
- **uuid** : génération d’identifiants uniques (utile pour des IDs non-séquentiels, pratiques à exposer publiquement).
- **axios** : utilisé pour effectuer certains appels HTTP sortants si nécessaire (ex. services externes). Le projet l’utilise aussi côté clients, ce qui garde une cohérence d’usage.

#### Dépendances de développement

- **nodemon** : relance automatique du serveur en développement pour accélérer le cycle de dev.
- **jest** : framework de tests (unitaires) simple à mettre en place sur Node.
- **supertest** : tests d’intégration HTTP sur l’API Express (requêtes simulées + assertions).
- **drizzle-kit** : outils CLI associés à Drizzle (génération/gestion autour du schéma et workflows de DB).
- **@faker-js/faker** : génération de données réalistes pour seed/tests (évite des jeux de données “fake” trop simplistes).
- **tsx** : exécution rapide de scripts TypeScript (utile pour scripts/outils sans step de build lourd).
- **install** : utilitaire npm parfois ajouté automatiquement dans certains workflows ; **non indispensable** au fonctionnement applicatif (peut être retiré si inutile).

### Frontend web (`frontend/package.json`)

#### Dépendances

- **next** : framework React complet (App Router, SSR/SSG, routing, optimisations) adapté à une app web moderne.
- **react / react-dom** : cœur du rendu UI et de l’écosystème composant.
- **zustand** : state management minimaliste et ergonomique (moins de boilerplate qu’un store plus lourd, suffisant pour auth/user/panier/filtre…).
- **axios** : client HTTP pratique (interceptors pour JWT/401, baseURL, gestion d’erreurs).
- **@stripe/stripe-js** : intégration Stripe côté navigateur (chargement sécurisé de Stripe.js).
- **tailwindcss** : productivité UI via classes utilitaires, design cohérent, itération rapide.
- **framer-motion** : animations fluides et déclaratives pour améliorer l’UX.
- **lucide-react** : bibliothèque d’icônes moderne, légère et cohérente visuellement.
- **clsx** : composition conditionnelle des classes (particulièrement utile avec Tailwind).
- **date-fns** : manipulation/formatage des dates avec API simple (plus léger que des libs historiques).

#### Dépendances de développement

- **typescript** : typage statique pour réduire les bugs et améliorer l’autocomplétion.
- **eslint** + **eslint-config-next** : linting + règles adaptées à Next pour garder une base de code homogène.
- **@types/node / @types/react / @types/react-dom** : types nécessaires à TypeScript.
- **@tailwindcss/postcss** : intégration Tailwind dans la chaîne PostCSS.
- **babel-plugin-react-compiler** : compatibilité/outillage autour du React Compiler (optimisations/expérimentation selon le setup).

### Mobile (`mobile/package.json`)

#### Dépendances

- **expo** : accélère le développement React Native (tooling, build, OTA, modules) sans config native lourde.
- **react / react-native** : base de l’app mobile.
- **@react-navigation/native** + **native-stack** + **bottom-tabs** : navigation standard (stack + tabs) stable, maintenue, adaptée au parcours décrit dans la doc.
- **@react-native-async-storage/async-storage** : persistance locale (token, préférences) de façon fiable.
- **axios** : client HTTP partagé avec le web (mêmes patterns d’interceptors/erreurs).
- **nativewind** : approche Tailwind-like sur React Native, cohérente avec le web (réutilisation des réflexes de design).
- **react-native-reanimated** : animations performantes (sur le thread UI), standard de facto pour RN.
- **react-native-safe-area-context** : gestion correcte des safe areas (encoches, barres système).
- **react-native-screens** : améliore performance/mémoire de la navigation via l’optimisation des écrans natifs.
- **expo-status-bar** : contrôle simple de la barre de statut (lisibilité, thèmes).
- **babel-preset-expo** : preset Babel recommandé par Expo (compatibilité/transpilation).
- **tailwindcss** : utilisé pour la configuration des tokens/classes avec NativeWind (même vocabulaire que sur le web).

---

## 12. Version “oral BTS” — pourquoi ce choix et pas une autre

Objectif à l’oral : montrer que les choix sont **cohérents**, **réalistes**, et adaptés au **temps/profil BTS** (aller vite, rester robuste, éviter la sur-architecture).

### Backend (API)

- **Express plutôt que NestJS/Spring** : Express est plus simple et rapide à mettre en place. NestJS apporte une structure “entreprise” (décorateurs, injection, modules) mais c’est plus long à configurer et à apprendre pour un projet BTS. Spring est très solide mais beaucoup plus lourd pour ce besoin.
- **MySQL plutôt que MongoDB/PostgreSQL** : on a un modèle relationnel clair (users, events, inscriptions, payments) avec contraintes (FK, uniques). MySQL est très courant, simple à héberger et adapté au relationnel. MongoDB est moins naturel quand on a beaucoup de relations. PostgreSQL est excellent aussi, mais MySQL suffisait et plus “classique” dans ce contexte.
- **mysql2 plutôt que “raw mysql”** : `mysql2` est un driver moderne, rapide, et surtout il facilite le **pool** et les **requêtes paramétrées** (sécurité).
- **Drizzle plutôt que Prisma/Sequelize** : Drizzle est léger et “proche du SQL”, donc on garde la maîtrise. Prisma est très confortable mais ajoute une couche plus grosse (génération, client, workflow) et peut être trop “magique” pour expliquer à l’oral. Sequelize est plus ancien et peut devenir verbeux.
- **JWT plutôt que sessions serveur** : JWT est pratique pour plusieurs clients (web + mobile) sans stocker de session côté serveur. Les sessions serveur sont très bien aussi, mais demandent un stockage (Redis/DB) et de la gestion supplémentaire.
- **bcrypt plutôt que SHA256** : SHA256 n’est pas fait pour des mots de passe (trop rapide). bcrypt est conçu pour ça (salt + coût), donc plus sûr.
- **express-validator plutôt que du “if” partout** : on centralise la validation, on évite de dupliquer les contrôles dans chaque controller, et on renvoie des erreurs propres.
- **Swagger (swagger-jsdoc + swagger-ui-express) plutôt qu’un PDF** : Swagger permet de tester l’API en direct, c’est plus parlant à l’oral et plus pratique pour le frontend/mobile.
- **Stripe SDK plutôt que “paiement maison”** : Stripe est une solution reconnue et sécurisée. Faire un paiement “maison” est risqué et irréaliste.
- **Rate limit + CORS** : ce sont des mesures simples à justifier à l’oral pour montrer que l’API n’est pas “ouverte à tout”.

### Frontend web

- **Next.js plutôt que React (Vite) “pur”** : Next apporte le routing, les optimisations et un cadre clair (App Router). Vite + React fonctionne très bien, mais Next structure mieux une app complète et se déploie facilement.
- **Zustand plutôt que Redux** : Redux est très puissant mais plus verbeux (actions/reducers/boilerplate). Zustand est simple, suffisant pour l’état global du projet (auth, utilisateur, panier/inscriptions, filtres).
- **Axios plutôt que fetch “brut”** : `fetch` marche, mais Axios simplifie la config (baseURL), les interceptors (JWT/401), et la gestion d’erreurs uniforme.
- **Tailwind plutôt que Bootstrap** : Tailwind donne une UI sur-mesure et cohérente sans se battre avec des styles préfaits. Bootstrap va vite aussi, mais on se retrouve souvent avec un rendu “standard” et moins personnalisable.
- **Framer Motion plutôt que animations CSS dispersées** : c’est plus simple à maintenir, déclaratif, et ça améliore l’UX sans complexité.
- **date-fns plutôt que Moment.js** : plus moderne et plus léger ; Moment est historique mais lourd et moins recommandé aujourd’hui.
- **Lucide + clsx** : petits outils qui améliorent la qualité (icônes cohérentes, classes conditionnelles propres) sans alourdir.

### Mobile

- **Expo plutôt que React Native CLI** : Expo fait gagner énormément de temps (outils, démarrage, build). RN CLI donne plus de contrôle natif, mais c’est plus long et plus fragile pour un projet BTS.
- **React Navigation plutôt que navigation “maison”** : standard du marché, stable, facile à expliquer (stack + tabs).
- **AsyncStorage plutôt que stockage “en mémoire”** : en mémoire on perd tout au redémarrage ; AsyncStorage permet de garder le token et l’état de connexion.
- **NativeWind plutôt que styles RN à la main** : plus rapide et cohérent avec le web (même logique Tailwind), donc productivité.
- **Reanimated plutôt que Animated classique** : meilleures perfs et standard actuel pour des animations fluides.
