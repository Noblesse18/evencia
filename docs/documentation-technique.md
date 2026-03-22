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
