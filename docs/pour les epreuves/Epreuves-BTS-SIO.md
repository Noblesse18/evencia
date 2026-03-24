# Épreuves BTS SIO SLAM — Projet Evencia

> Ce document rassemble les informations nécessaires pour remplir les fiches des épreuves **E5** et **E6** du BTS SIO option SLAM, adaptées au projet **Evencia**.

---

## Table des matières

- [Épreuve E5 — Fiche Annexe 9-1-B (Recto)](#épreuve-e5--fiche-annexe-9-1-b-recto)
- [Épreuve E5 — Fiche Annexe 9-1-B (Verso)](#épreuve-e5--fiche-annexe-9-1-b-verso)
- [Épreuve E6 — Parcours de professionnalisation (adapté Evencia)](#épreuve-e6--parcours-de-professionnalisation-adapté-evencia)

---

# Épreuve E5 — Fiche Annexe 9-1-B (Recto)

## Conception et développement d'applications (option SLAM)

### Informations candidat

| Champ | Valeur |
|-------|--------|
| **N° réalisation** | 1 |
| **Nom, prénom** | *(à compléter)* |
| **N° candidat** | *(à compléter)* |
| **Épreuve** | ☑ Épreuve ponctuelle / ☐ Contrôle en cours de formation |
| **Date** | *(à compléter)* |

---

### Organisation support de la réalisation professionnelle

Projet personnel réalisé dans le cadre du BTS SIO option SLAM (2024-2025). Le projet simule une plateforme de gestion d'événements permettant aux organisateurs de créer et gérer des événements, et aux participants de s'y inscrire et de payer en ligne.

---

### Intitulé de la réalisation professionnelle

**Evencia — Application web et mobile fullstack de gestion d'événements**

---

### Période et lieu

| Champ | Valeur |
|-------|--------|
| **Période de réalisation** | Septembre 2024 – Juin 2025 |
| **Lieu** | *(nom de l'établissement / entreprise de stage)* |

---

### Modalité

☑ Seul(e) — ☐ En équipe

---

### Compétences travaillées

| Compétence | Travaillée |
|------------|:----------:|
| **Concevoir et développer une solution applicative** | ☑ |
| **Assurer la maintenance corrective ou évolutive d'une solution applicative** | ☑ |
| **Gérer les données** | ☑ |

---

### Conditions de réalisation (ressources fournies, résultats attendus)

**Contexte :**
Conception et développement d'une application web et mobile de gestion d'événements. L'application doit permettre la création d'événements par des organisateurs, l'inscription et le paiement en ligne par des participants, ainsi qu'un tableau de bord d'administration.

**Ressources fournies :**
- Cahier des charges fonctionnel (gestion multi-rôles : participant, organisateur, administrateur)
- Maquettes et wireframes de l'interface utilisateur
- Accès à un serveur de base de données MySQL 8
- Clés API Stripe (mode test) pour l'intégration des paiements

**Résultats attendus :**
- API RESTful fonctionnelle avec authentification JWT et gestion des rôles
- Interface web responsive (Next.js) avec tableau de bord organisateur
- Application mobile cross-platform (React Native / Expo)
- Base de données relationnelle MySQL avec schéma normalisé
- Documentation interactive de l'API (Swagger / OpenAPI 3)
- Conteneurisation Docker pour le déploiement

---

### Description des ressources documentaires, matérielles et logicielles utilisées

**Environnement de développement :**

| Catégorie | Outils / Technologies |
|-----------|-----------------------|
| **IDE** | Cursor (VS Code), Android Studio |
| **OS** | Arch Linux |
| **Versioning** | Git, GitHub |
| **Conteneurisation** | Docker, Docker Compose |
| **Base de données** | MySQL 8.0 |

**Stack technique :**

| Couche | Technologies |
|--------|-------------|
| **Backend (API)** | Node.js 20, Express.js 4.18, JWT (jsonwebtoken), bcrypt, express-validator, Swagger (swagger-jsdoc + swagger-ui-express), Stripe, express-rate-limit |
| **ORM / BDD** | Drizzle ORM (schémas), mysql2 (requêtes), MySQL 8 |
| **Frontend (Web)** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand, Framer Motion, Axios, date-fns, Lucide React, @stripe/stripe-js |
| **Frontend (Mobile)** | React Native 0.81, Expo SDK 54, NativeWind v4, React Navigation (Stack + Bottom Tabs), AsyncStorage, Axios |
| **DevOps** | Docker, Docker Compose, Makefile, Nginx (production), Certbot (HTTPS) |
| **Tests** | Postman, Swagger UI |
| **Déploiement** | Oracle Cloud (VPS ARM), DuckDNS (sous-domaine gratuit) |

**Ressources documentaires :**
- Documentation officielle : Next.js, Express.js, React Native, Expo, Drizzle ORM, Stripe
- Référentiel BTS SIO option SLAM
- MDN Web Docs (JavaScript, API Web)

---

### Modalités d'accès aux productions et à leur documentation

| Élément | Accès |
|---------|-------|
| **Dépôt GitHub** | `https://github.com/Noblesse18/evencia` |
| **Documentation API (Swagger)** | `http://localhost:5000/api-docs` (local) ou `https://evencia.duckdns.org/api-docs` (prod) |
| **Frontend** | `http://localhost:3000` (local) ou `https://evencia.duckdns.org` (prod) |
| **Lancement Docker** | `docker compose up --build -d` à la racine du projet |
| **Documentation projet** | Dossier `docs/` du dépôt (TPs, guides de déploiement, Stripe) |

**Comptes de test :**

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Administrateur | admin@evencia.fr | Evencia2026! |
| Organisateur | organisateur@evencia.fr | Evencia2026! |
| Participant | participant@evencia.fr | Evencia2026! |

**Carte de test Stripe :** `4242 4242 4242 4242` (date future quelconque, CVC quelconque)

---

---

# Épreuve E5 — Fiche Annexe 9-1-B (Verso)

## Descriptif de la réalisation professionnelle

---

### 1. Contexte et objectifs

Dans le cadre du BTS SIO option SLAM, j'ai conçu et développé **Evencia**, une application fullstack de gestion d'événements. L'objectif était de créer une plateforme complète permettant :

- Aux **organisateurs** de créer, modifier et supprimer des événements, et de suivre les inscriptions via un tableau de bord
- Aux **participants** de parcourir les événements, s'inscrire, payer en ligne (Stripe) et gérer leur profil
- Aux **administrateurs** de superviser l'ensemble des utilisateurs et événements

L'application se compose de trois parties : une **API REST** (Express.js), une **interface web** (Next.js) et une **application mobile** (React Native / Expo), le tout orchestré par **Docker Compose**.

---

### 2. Architecture globale

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client / Utilisateur                      │
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

### 3. Schéma de la base de données

```
┌──────────────────────────┐       ┌──────────────────────────────────┐
│         users            │       │           events                 │
├──────────────────────────┤       ├──────────────────────────────────┤
│ id         VARCHAR(36) PK│       │ id           VARCHAR(36) PK     │
│ name       VARCHAR(100)  │       │ title        VARCHAR(200)       │
│ email      VARCHAR(100) U│       │ description  TEXT               │
│ password   VARCHAR(255)  │       │ category     VARCHAR(100)       │
│ role       ENUM(particip │       │ location     VARCHAR(200)       │
│   ant,organizer,admin)   │       │ event_date   DATETIME           │
│ created_at TIMESTAMP     │◄──────│ organizer_id VARCHAR(36) FK     │
│ updated_at TIMESTAMP     │       │ price        DECIMAL(10,2)      │
│ last_login TIMESTAMP     │       │ max_tickets  INT                │
└──────────┬───────────────┘       │ image_url    VARCHAR(500)       │
           │                       │ photos       JSON               │
           │                       │ created_at   TIMESTAMP          │
           │                       │ updated_at   TIMESTAMP          │
           │                       └──────────────┬───────────────────┘
           │                                      │
           │    ┌─────────────────────────┐       │
           │    │     inscriptions        │       │
           │    ├─────────────────────────┤       │
           │    │ id        VARCHAR(36) PK│       │
           └───►│ user_id   VARCHAR(36) FK│       │
                │ event_id  VARCHAR(36) FK│◄──────┘
                │ status    ENUM(pending, │
                │   confirmed, cancelled) │
                │ created_at TIMESTAMP    │
                │ updated_at TIMESTAMP    │
                │ UNIQUE(user_id,event_id)│
                └─────────┬───────────────┘
                          │
           ┌──────────────┘
           │
           │    ┌──────────────────────────────────┐
           │    │         payments                  │
           │    ├──────────────────────────────────┤
           │    │ id                    VARCHAR(36) │
           │    │ user_id               VARCHAR(36) │
           │    │ event_id              VARCHAR(36) │
           │    │ amount                DECIMAL     │
           │    │ status                VARCHAR     │
           │    │ stripe_payment_intent VARCHAR     │
           │    │ stripe_customer_id    VARCHAR     │
           │    │ payment_method        VARCHAR     │
           │    │ card_last4            VARCHAR(4)  │
           │    │ card_brand            VARCHAR     │
           │    └──────────────────────────────────┘
```

**Relations :**
- `users` 1 ↔ N `events` (un organisateur crée plusieurs événements)
- `users` 1 ↔ N `inscriptions` (un utilisateur s'inscrit à plusieurs événements)
- `events` 1 ↔ N `inscriptions` (un événement a plusieurs inscrits)
- `inscriptions` 1 ↔ 1 `payments` (une inscription peut avoir un paiement)

---

### 4. Diagramme de cas d'utilisation

```
┌───────────────────────────────────────────────────────────────┐
│               Système Evencia                                 │
│                                                               │
│   ┌─────────────────────┐  ┌─────────────────────────────┐   │
│   │ S'inscrire          │  │ Créer un événement          │   │
│   │ (register)          │  │ (titre, date, lieu, prix,   │   │
│   └─────────┬───────────┘  │  catégorie, places max)     │   │
│             │              └──────────────┬──────────────┘   │
│   ┌─────────┴───────────┐  ┌─────────────┴──────────────┐   │
│   │ Se connecter        │  │ Modifier un événement       │   │
│   │ (JWT)               │  └──────────────┬──────────────┘   │
│   └─────────┬───────────┘  ┌─────────────┴──────────────┐   │
│             │              │ Supprimer un événement      │   │
│   ┌─────────┴───────────┐  └──────────────┬──────────────┘   │
│   │ Voir les événements │  ┌─────────────┴──────────────┐   │
│   │ (filtres, recherche)│  │ Dashboard organisateur      │   │
│   └─────────┬───────────┘  │ (stats inscriptions)        │   │
│             │              └─────────────────────────────┘   │
│   ┌─────────┴───────────┐                                    │
│   │ S'inscrire à un     │  ┌─────────────────────────────┐   │
│   │ événement           │  │ Gérer les utilisateurs      │   │
│   └─────────┬───────────┘  │ (liste, rôles)              │   │
│             │              └──────────────┬──────────────┘   │
│   ┌─────────┴───────────┐               │                    │
│   │ Payer (Stripe)      │               │                    │
│   └─────────┬───────────┘               │                    │
│             │                            │                    │
│   ┌─────────┴───────────┐               │                    │
│   │ Annuler inscription │               │                    │
│   └─────────┬───────────┘               │                    │
│             │                            │                    │
│   ┌─────────┴───────────┐               │                    │
│   │ Modifier son profil │               │                    │
│   │ Changer mot de passe│               │                    │
│   └─────────────────────┘               │                    │
│             │                            │                    │
└─────────────┼────────────────────────────┼────────────────────┘
              │                            │
        ┌─────┴──────┐            ┌────────┴────────┐
        │ Participant │            │ Organisateur /  │
        │             │            │ Administrateur  │
        └────────────┘            └─────────────────┘
```

---

### 5. Endpoints de l'API REST

#### Authentification (`/api/auth`)

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| POST | `/api/auth/register` | Inscription d'un utilisateur | Public |
| POST | `/api/auth/login` | Connexion, retour JWT | Public |
| GET | `/api/auth/verify` | Vérification du token JWT | Authentifié |
| POST | `/api/auth/change-password` | Changement de mot de passe | Authentifié |
| POST | `/api/auth/request-password-reset` | Demande de réinitialisation | Public |
| POST | `/api/auth/reset-password` | Réinitialisation du mot de passe | Public |

#### Utilisateurs (`/api/users`)

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| GET | `/api/users/me` | Profil de l'utilisateur connecté | Authentifié |
| PUT | `/api/users/me` | Modifier son profil | Authentifié |
| GET | `/api/users/` | Liste de tous les utilisateurs | Admin |
| GET | `/api/users/:id` | Détail d'un utilisateur | Admin |

#### Événements (`/api/events`)

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| GET | `/api/events` | Lister les événements (filtres, pagination) | Public |
| GET | `/api/events/:id` | Détail d'un événement | Public |
| GET | `/api/events/categories` | Liste des catégories | Public |
| GET | `/api/events/organizer/my-events` | Événements de l'organisateur connecté | Organizer |
| POST | `/api/events` | Créer un événement | Organizer / Admin |
| PUT | `/api/events/:id` | Modifier un événement | Organizer / Admin |
| DELETE | `/api/events/:id` | Supprimer un événement | Organizer / Admin |

#### Inscriptions (`/api/inscriptions`)

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| GET | `/api/inscriptions/my` | Mes inscriptions | Authentifié |
| POST | `/api/inscriptions` | S'inscrire à un événement | Participant |
| DELETE | `/api/inscriptions/:id` | Annuler une inscription | Participant |

#### Paiements (`/api/payments`)

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| POST | `/api/payments` | Créer une session Stripe Checkout | Authentifié |
| POST | `/api/payments/webhook` | Webhook Stripe (confirmation) | Stripe |

---

### 6. Sécurité et authentification

**Flux d'authentification JWT :**

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
    │   Authorization: Bearer xxx  │                            │
    │                              │ authenticateToken()        │
    │                              │ jwt.verify(token, secret)  │
    │                              │                            │
    │                              │ authorizeRoles('organizer')│
    │                              │ req.user.role check        │
    │                              │                            │
    │◄── { events: [...] } ───────│                            │
```

**Mesures de sécurité implémentées :**

| Mesure | Implémentation |
|--------|---------------|
| Hashage des mots de passe | bcrypt avec salt factor 10 |
| Authentification | JWT avec expiration 7 jours |
| Autorisation par rôles | Middleware `authorizeRoles('participant', 'organizer', 'admin')` |
| Validation des entrées | express-validator (`@NotBlank`, `@Email`, longueur min/max) |
| Protection brute force | express-rate-limit (100 req/min global, 5 req/min sur `/auth`) |
| CORS | Origines restreintes via `CORS_ORIGINS` |
| Interception token expiré | Intercepteur Axios côté frontend (déconnexion auto sur 401) |

---

### 7. Interface utilisateur (Frontend Next.js)

**Pages principales :**

| Page | Route | Description |
|------|-------|-------------|
| Accueil | `/` | Présentation, événements mis en avant |
| Connexion | `/login` | Formulaire de connexion |
| Inscription | `/register` | Formulaire d'inscription |
| Événements | `/events` | Liste avec filtres (catégorie, date, prix, ville), pagination |
| Détail événement | `/events/[id]` | Informations complètes, inscription, paiement |
| Création événement | `/events/create` | Formulaire de création (organizer/admin) |
| Édition événement | `/events/[id]/edit` | Modification (organizer/admin) |
| Profil | `/profile` | Consultation et modification du profil |
| Dashboard | `/dashboard` | Tableau de bord organisateur (stats) |
| Administration | `/admin` | Gestion des utilisateurs (admin) |

**Technologies UI :**
- **Tailwind CSS 4** : design responsive et moderne
- **Framer Motion** : animations fluides (transitions de pages, apparitions)
- **Zustand** : gestion d'état centralisée avec persistance (localStorage)
- **Lucide React** : bibliothèque d'icônes

---

### 8. Application mobile (React Native / Expo)

**Écrans :**

| Écran | Description |
|-------|-------------|
| LoginScreen | Connexion utilisateur |
| HomeScreen | Accueil avec événements |
| SearchScreen | Recherche et filtres d'événements |
| EventDetailScreen | Détail d'un événement + inscription |
| DashboardScreen | Tableau de bord |
| ProfileScreen | Profil utilisateur |

**Architecture mobile :**
- **AuthContext** : gestion de l'authentification (login, logout, token AsyncStorage)
- **React Navigation** : Stack Navigator + Bottom Tab Navigator
- **Client API Axios** : base URL `10.0.2.2:5000/api` (émulateur) avec intercepteur JWT
- **NativeWind v4** : Tailwind CSS pour React Native

---

### 9. Conteneurisation Docker

```yaml
# docker-compose.yml — 3 services
services:
  mysql:      # MySQL 8.0, port 3307, volume persistant, migrations auto
  backend:    # Node 20 Alpine, port 5000, dépend de mysql (healthcheck)
  frontend:   # Next.js 16 (build multi-stage), port 3000
```

**Points techniques :**
- Les migrations SQL sont exécutées automatiquement au démarrage de MySQL via `/docker-entrypoint-initdb.d`
- Le backend attend que MySQL soit healthy avant de démarrer (`depends_on: condition: service_healthy`)
- Le frontend utilise un build multi-stage (deps → build → runner) pour une image optimisée
- Un `docker-compose.prod.yml` existe pour le déploiement avec Nginx et Certbot (HTTPS)

---

### 10. Extraits de code significatifs

#### Middleware d'authentification JWT

```javascript
// backend/src/middleware/auth.js
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token manquant' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token invalide' });
        req.user = user;
        next();
    });
};

function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Accès interdit' });
        }
        next();
    };
}
```

#### Validation avec express-validator

```javascript
// backend/src/validators/authValidator.js
const validateRegister = [
    body('name').trim().notEmpty().withMessage('Le nom est requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('8 caractères min, 1 majuscule, 1 minuscule, 1 chiffre'),
];
```

#### Store Zustand (frontend)

```typescript
// frontend/src/store/authStore.ts
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            login: async (email, password) => {
                const { data } = await authAPI.login({ email, password });
                set({ user: data.user, token: data.token, isAuthenticated: true });
            },
            logout: () => set({ user: null, token: null, isAuthenticated: false }),
        }),
        { name: 'auth-storage' }
    )
);
```

#### Paiement Stripe (backend)

```javascript
// backend/src/controllers/paymentController.js
const createCheckoutSession = async (req, res) => {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price_data: { currency: 'eur', product_data: { name: event.title }, unit_amount: event.price * 100 }, quantity: 1 }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/events/${eventId}?payment=success`,
        cancel_url: `${process.env.FRONTEND_URL}/events/${eventId}?payment=cancel`,
    });
    res.json({ url: session.url });
};
```

---

### 11. Compétences mises en œuvre (référentiel BTS SIO SLAM)

| Compétence du référentiel | Mise en œuvre dans Evencia |
|---------------------------|---------------------------|
| **Concevoir une solution applicative** | Architecture en couches (Controllers → Services → Repositories → MySQL), API REST, diagrammes UML |
| **Développer des composants métier** | Controllers Express (auth, events, inscriptions, payments), middleware JWT, validators |
| **Développer des composants d'accès aux données** | Repositories (BaseRepository, UserRepository, EventRepository), requêtes SQL paramétrées, Drizzle ORM |
| **Développer la présentation d'une solution applicative** | Interface Next.js responsive, composants React réutilisables (Button, Card, Input), application mobile Expo |
| **Intégrer des composants applicatifs** | Communication Frontend ↔ Backend via Axios, intégration Stripe, Docker Compose multi-services |
| **Gérer les données** | Schéma MySQL normalisé, migrations SQL, UUIDs, contraintes d'intégrité (UNIQUE, FK) |
| **Protéger les données à caractère personnel** | Hashage bcrypt, JWT, CORS, rate limiting, validation des entrées |
| **Assurer la maintenance corrective ou évolutive** | Ajout de catégories, tickets max, paiements Stripe, application mobile (évolutions) |
| **Documenter une solution applicative** | Swagger/OpenAPI 3 (`/api-docs`), README, guide de déploiement, TPs documentés |

---

---

# Épreuve E6 — Parcours de professionnalisation (adapté Evencia)

> Ci-dessous, le contenu adapté au projet Evencia pour l'épreuve E6 (même structure que le document E6_Slam_Filled.pdf mais avec la stack réelle du projet).

---

## 1. Contexte du projet

Dans le cadre du BTS SIO option SLAM, j'ai développé **Evencia**, une application fullstack de gestion d'événements. L'objectif était de concevoir une plateforme complète (web + mobile) intégrant authentification sécurisée, gestion des rôles, paiement en ligne et déploiement conteneurisé.

L'application gère trois rôles distincts :
- **Participant** : inscription, connexion, consultation et recherche d'événements, inscription/désinscription, paiement Stripe, modification du profil
- **Organisateur** : CRUD complet sur ses événements, tableau de bord avec statistiques d'inscriptions
- **Administrateur** : gestion de tous les utilisateurs et événements

La stack technique retenue est : **Node.js 20, Express.js, MySQL 8, Drizzle ORM, JWT, Swagger/OpenAPI 3, Next.js 16, TypeScript, Tailwind CSS 4, Zustand, React Native Expo SDK 54, Docker Compose, Stripe**.

---

## 2. Architecture Back-end — Schéma des couches

```
Client / Frontend
  Next.js · React Native · Postman

         │ HTTP / REST
         ▼
┌─────────────────────────────────────────────────┐
│           Couche Sécurité                       │
│  authenticateToken (JWT verify)                  │
│  authorizeRoles('participant','organizer','admin')│
│  express-rate-limit (100/min, 5/min auth)        │
│  CORS (origines configurables)                   │
├─────────────────────────────────────────────────┤
│           Couche Controller                     │
│  @RestController équivalent                     │
│  authController · eventController               │
│  userController · inscriptionController         │
│  paymentController                              │
├─────────────────────────────────────────────────┤
│           Couche Validation                     │
│  express-validator                              │
│  authValidator · eventValidator                 │
│  inscriptionValidator · paymentValidator        │
├─────────────────────────────────────────────────┤
│           Couche Service / Logique métier       │
│  Inscription avec vérification places dispo     │
│  Création Checkout Session Stripe               │
│  Hashage bcrypt · Génération JWT                │
├─────────────────────────────────────────────────┤
│           Couche Repository                     │
│  BaseRepository · UserRepository                │
│  EventRepository · InscriptionRepository        │
│  mysql2 pool · Requêtes paramétrées             │
├─────────────────────────────────────────────────┤
│           Couche Données                        │
│  MySQL 8.0 · Base evencianew                    │
│  Drizzle ORM (schémas)                          │
│  Migrations SQL auto (Docker init)              │
└─────────────────────────────────────────────────┘

  Swagger UI : /api-docs (documentation interactive)
```

---

## 3. Diagramme de classes (UML)

```
┌──────────────────────┐
│      «Entity»        │
│        User          │
├──────────────────────┤
│ - id : UUID          │
│ - name : String      │
│ - email : String     │
│ - password : String  │
│ - role : Role        │
│ - last_login : Date  │
├──────────────────────┤
│ + register()         │
│ + login()            │
│ + updateProfile()    │
│ + changePassword()   │
└──────┬──────┬────────┘
       │      │
       │      │ 1..*
       │      ▼
       │  ┌──────────────────────────┐
       │  │      «Entity»            │
       │  │     Inscription          │
       │  ├──────────────────────────┤
       │  │ - id : UUID              │
       │  │ - user : User            │
       │  │ - event : Event          │
       │  │ - status : InscriptionSt │
       │  │ - created_at : Date      │
       │  ├──────────────────────────┤
       │  │ + inscrire()             │
       │  │ + annuler()              │
       │  └──────────┬───────────────┘
       │             │
       │  1..*       │ 1..*
       ▼             ▼
┌──────────────────────────┐     ┌───────────────────┐
│      «Entity»            │     │ «Enum» Role       │
│       Event              │     ├───────────────────┤
├──────────────────────────┤     │ participant       │
│ - id : UUID              │     │ organizer         │
│ - title : String         │     │ admin             │
│ - description : Text     │     └───────────────────┘
│ - category : String      │
│ - location : String      │     ┌───────────────────┐
│ - event_date : DateTime  │     │ «Enum»            │
│ - price : Decimal        │     │ InscriptionStatus │
│ - max_tickets : Int      │     ├───────────────────┤
│ - image_url : String     │     │ pending           │
│ - organizer : User       │     │ confirmed         │
├──────────────────────────┤     │ cancelled         │
│ + create()               │     └───────────────────┘
│ + update()               │
│ + delete()               │     ┌───────────────────┐
│ + listByCategory()       │     │ «Entity» Payment  │
└──────────────────────────┘     ├───────────────────┤
                                 │ - id : UUID       │
                                 │ - user : User     │
                                 │ - event : Event   │
                                 │ - amount : Decimal│
                                 │ - status : String │
                                 │ - stripe_id : Str │
                                 └───────────────────┘
```

---

## 4. Documentation Swagger / OpenAPI 3

Accessible à : `http://localhost:5000/api-docs`

```
EventManagement API — OAS 3.0 — v1.0.0

▸ auth-controller
  POST /api/auth/register         Inscription utilisateur
  POST /api/auth/login            Connexion + retour JWT
  GET  /api/auth/verify           Vérification token
  POST /api/auth/change-password  Changement mot de passe

▸ event-controller
  GET    /api/events              Lister (filtres, pagination)
  GET    /api/events/:id          Détail événement
  GET    /api/events/categories   Catégories disponibles
  POST   /api/events              [ORGANIZER/ADMIN] Créer
  PUT    /api/events/:id          [ORGANIZER/ADMIN] Modifier
  DELETE /api/events/:id          [ORGANIZER/ADMIN] Supprimer

▸ user-controller
  GET /api/users/me               Mon profil
  PUT /api/users/me               Modifier profil

▸ inscription-controller
  GET    /api/inscriptions/my     Mes inscriptions
  POST   /api/inscriptions        S'inscrire
  DELETE /api/inscriptions/:id    Annuler

▸ payment-controller
  POST /api/payments              Checkout Stripe
  POST /api/payments/webhook      Webhook Stripe
```

Le bouton **Authorize** permet de saisir le token JWT (`Bearer <token>`) pour tester les endpoints protégés directement depuis l'interface Swagger.

---

## 5. Déploiement

**Environnement local :** Docker Compose (MySQL + Backend + Frontend) — `docker compose up --build -d`

**Environnement de production :**
- **Hébergement** : Oracle Cloud Free Tier (VM ARM, 4 CPU, 24 Go RAM)
- **Reverse proxy** : Nginx
- **HTTPS** : Certbot (Let's Encrypt)
- **Domaine** : `evencia.duckdns.org` (sous-domaine DuckDNS gratuit)
- **Orchestration** : `docker-compose.prod.yml` avec services MySQL, Backend, Frontend, Nginx, Certbot

---

## 6. Récapitulatif des technologies

| Couche | Technologies |
|--------|-------------|
| **Backend** | Node.js 20 · Express.js 4.18 · JWT · bcrypt · express-validator · express-rate-limit · Swagger/OpenAPI 3 · Stripe |
| **Base de données** | MySQL 8.0 · Drizzle ORM (schémas) · mysql2 (requêtes) · Migrations SQL |
| **Frontend Web** | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Zustand · Framer Motion · Axios · @stripe/stripe-js |
| **Frontend Mobile** | React Native 0.81 · Expo SDK 54 · NativeWind v4 · React Navigation · AsyncStorage · Axios |
| **DevOps** | Docker · Docker Compose · Makefile · Nginx · Certbot · Oracle Cloud |

---

*Projet réalisé dans le cadre des épreuves E5 et E6 · BTS SIO SLAM · 2024-2025 · Node.js · Express · Next.js 16 · MySQL 8 · JWT · Swagger/OpenAPI 3 · React Native Expo · Docker · Stripe*

---

---

# Diagrammes Mermaid (UML)

> Les diagrammes ci-dessous sont en syntaxe **Mermaid** et se rendent automatiquement sur GitHub, GitLab, Notion, ou tout éditeur Markdown compatible. Pour un rendu local, utiliser l'extension VS Code « Markdown Preview Mermaid Support » ou le site [mermaid.live](https://mermaid.live).

> **Thème coloré inclus** : chaque diagramme contient une directive `%%{init}%%` qui applique automatiquement les couleurs. Il suffit de copier-coller le bloc entier (y compris la première ligne `%%{init...}%%`) sur [mermaid.live](https://mermaid.live) pour obtenir un rendu coloré.

---

## 1. Diagramme de classes UML

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#BBF7D0', 'primaryTextColor': '#14532D', 'primaryBorderColor': '#22C55E', 'secondaryColor': '#BFDBFE', 'secondaryTextColor': '#1E3A8A', 'secondaryBorderColor': '#3B82F6', 'tertiaryColor': '#FDE68A', 'tertiaryTextColor': '#78350F', 'tertiaryBorderColor': '#F59E0B', 'lineColor': '#475569', 'textColor': '#1E293B', 'fontSize': '14px', 'background': '#ffffff'}}}%%
classDiagram
    direction LR

    class User {
        +String id · UUID
        +String name
        +String email
        +String password
        +Role role
        +DateTime createdAt
        +DateTime updatedAt
        +DateTime lastLogin
        +register()
        +login()
        +updateProfile()
        +changePassword()
    }

    class Event {
        +String id · UUID
        +String title
        +String description
        +String category
        +String location
        +DateTime event_date
        +Decimal price
        +Int max_tickets
        +String image_url
        +JSON photos
        +String organizer_id · FK
        +DateTime createdAt
        +DateTime updatedAt
        +create()
        +update()
        +delete()
        +listByCategory()
        +filterByDate()
    }

    class Inscription {
        +String id · UUID
        +String user_id · FK
        +String event_id · FK
        +InscriptionStatus status
        +DateTime createdAt
        +DateTime updatedAt
        +inscrire()
        +annuler()
        +confirmer()
    }

    class Payment {
        +String id · UUID
        +String user_id · FK
        +String event_id · FK
        +Decimal amount
        +PaymentStatus status
        +String stripe_payment_intent_id
        +String stripe_customer_id
        +String stripe_charge_id
        +PaymentMethod payment_method
        +String card_last4
        +String card_brand
        +String failure_message
        +String refund_reason
        +DateTime refunded_at
        +DateTime createdAt
        +DateTime updatedAt
        +createCheckout()
        +handleWebhook()
    }

    class Role {
        <<enumeration>>
        participant
        organizer
        admin
    }

    class InscriptionStatus {
        <<enumeration>>
        pending
        confirmed
        cancelled
    }

    class PaymentStatus {
        <<enumeration>>
        pending
        processing
        requires_action
        succeeded
        canceled
        failed
        refunded
    }

    class PaymentMethod {
        <<enumeration>>
        card
        sepa_debit
        ideal
        bancontact
        giropay
        sofort
        eps
        przelewy24
        alipay
        wechat_pay
    }

    User "1" --> "*" Event : organise
    User "1" --> "*" Inscription : participe
    Event "1" --> "*" Inscription : reçoit
    User "1" --> "*" Payment : effectue
    Event "1" --> "*" Payment : concerne
    Inscription "1" --> "0..1" Payment : déclenche

    User --> Role : a un
    Inscription --> InscriptionStatus : a un
    Payment --> PaymentStatus : a un
    Payment --> PaymentMethod : utilise

    style User fill:#DBEAFE,stroke:#2563EB,color:#1E3A8A,stroke-width:2px
    style Event fill:#BBF7D0,stroke:#16A34A,color:#14532D,stroke-width:2px
    style Inscription fill:#FDE68A,stroke:#D97706,color:#78350F,stroke-width:2px
    style Payment fill:#FECACA,stroke:#DC2626,color:#7F1D1D,stroke-width:2px
    style Role fill:#E0E7FF,stroke:#6366F1,color:#312E81,stroke-width:1px
    style InscriptionStatus fill:#FEF3C7,stroke:#F59E0B,color:#78350F,stroke-width:1px
    style PaymentStatus fill:#FCE7F3,stroke:#EC4899,color:#831843,stroke-width:1px
    style PaymentMethod fill:#CCFBF1,stroke:#14B8A6,color:#134E4A,stroke-width:1px
```

---

## 2. Diagramme entité-relation (base de données)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#DBEAFE', 'primaryTextColor': '#1E293B', 'primaryBorderColor': '#3B82F6', 'lineColor': '#475569', 'secondaryColor': '#BBF7D0', 'tertiaryColor': '#FDE68A', 'textColor': '#1E293B', 'fontSize': '13px', 'background': '#ffffff'}}}%%
erDiagram
    users {
        VARCHAR_36 id PK "UUID"
        VARCHAR_255 name "NOT NULL"
        VARCHAR_255 email UK "NOT NULL, UNIQUE"
        VARCHAR_255 password "NOT NULL, bcrypt hash"
        ENUM role "participant | organizer | admin"
        TIMESTAMP createdAt "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updatedAt "ON UPDATE CURRENT_TIMESTAMP"
        TIMESTAMP last_login "NULL"
    }

    events {
        VARCHAR_36 id PK "UUID"
        VARCHAR_255 title "NOT NULL"
        TEXT description
        VARCHAR_100 category "DEFAULT autre"
        VARCHAR_500 location
        TIMESTAMP event_date
        DECIMAL_10_2 price "DEFAULT 0"
        INT max_tickets
        VARCHAR_36 organizer_id FK "NOT NULL → users.id"
        JSON photos
        VARCHAR_500 image_url
        TIMESTAMP createdAt "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updatedAt "ON UPDATE CURRENT_TIMESTAMP"
    }

    inscriptions {
        VARCHAR_36 id PK "UUID"
        VARCHAR_36 user_id FK "NOT NULL → users.id"
        VARCHAR_36 event_id FK "NOT NULL → events.id"
        ENUM status "pending | confirmed | cancelled"
        TIMESTAMP createdAt "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updatedAt "ON UPDATE CURRENT_TIMESTAMP"
    }

    payments {
        VARCHAR_36 id PK "UUID"
        VARCHAR_36 user_id FK "NOT NULL → users.id"
        VARCHAR_36 event_id FK "NOT NULL → events.id"
        DECIMAL_10_2 amount "NOT NULL"
        ENUM status "pending | processing | succeeded | failed | refunded | ..."
        VARCHAR_255 stripe_payment_intent_id UK "UNIQUE"
        VARCHAR_255 stripe_customer_id
        VARCHAR_255 stripe_charge_id
        ENUM payment_method "card | sepa_debit | ideal | ..."
        VARCHAR_4 card_last4
        VARCHAR_20 card_brand
        TEXT failure_message
        TEXT refund_reason
        TIMESTAMP refunded_at "NULL"
        TIMESTAMP createdAt "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updatedAt "ON UPDATE CURRENT_TIMESTAMP"
    }

    users ||--o{ events : "organise (organizer_id)"
    users ||--o{ inscriptions : "s'inscrit (user_id)"
    events ||--o{ inscriptions : "reçoit (event_id)"
    users ||--o{ payments : "paie (user_id)"
    events ||--o{ payments : "est payé (event_id)"
```

---

## 3. Diagramme de cas d'utilisation

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#DBEAFE', 'primaryTextColor': '#1E3A5F', 'primaryBorderColor': '#3B82F6', 'lineColor': '#6366F1', 'secondaryColor': '#EDE9FE', 'tertiaryColor': '#ECFDF5', 'textColor': '#1E293B', 'fontSize': '13px', 'clusterBkg': '#F1F5F9', 'clusterBorder': '#94A3B8', 'background': '#ffffff'}}}%%
flowchart LR
    subgraph Acteurs
        P((Participant))
        O((Organisateur))
        A((Administrateur))
    end

    subgraph Système Evencia
        direction TB

        subgraph Authentification
            UC1[S'inscrire]
            UC2[Se connecter - JWT]
            UC3[Modifier son profil]
            UC4[Changer son mot de passe]
        end

        subgraph Événements
            UC5[Consulter les événements]
            UC6[Rechercher / Filtrer]
            UC7[Voir le détail d'un événement]
            UC8[Créer un événement]
            UC9[Modifier un événement]
            UC10[Supprimer un événement]
        end

        subgraph Inscriptions & Paiements
            UC11[S'inscrire à un événement]
            UC12[Payer via Stripe]
            UC13[Annuler une inscription]
            UC14[Voir mes inscriptions]
        end

        subgraph Administration
            UC15[Dashboard organisateur]
            UC16[Gérer les utilisateurs]
            UC17[Voir tous les événements]
        end
    end

    P --> UC1
    P --> UC2
    P --> UC3
    P --> UC4
    P --> UC5
    P --> UC6
    P --> UC7
    P --> UC11
    P --> UC12
    P --> UC13
    P --> UC14

    O --> UC2
    O --> UC8
    O --> UC9
    O --> UC10
    O --> UC15

    A --> UC2
    A --> UC16
    A --> UC17
    A --> UC8
    A --> UC9
    A --> UC10

    UC11 -.-> UC12
    A -.->|hérite de| O

    style P fill:#6366F1,stroke:#4338CA,color:#fff
    style O fill:#8B5CF6,stroke:#6D28D9,color:#fff
    style A fill:#EC4899,stroke:#BE185D,color:#fff
    style UC1 fill:#DBEAFE,stroke:#3B82F6,color:#1E3A5F
    style UC2 fill:#DBEAFE,stroke:#3B82F6,color:#1E3A5F
    style UC3 fill:#DBEAFE,stroke:#3B82F6,color:#1E3A5F
    style UC4 fill:#DBEAFE,stroke:#3B82F6,color:#1E3A5F
    style UC5 fill:#E0E7FF,stroke:#6366F1,color:#312E81
    style UC6 fill:#E0E7FF,stroke:#6366F1,color:#312E81
    style UC7 fill:#E0E7FF,stroke:#6366F1,color:#312E81
    style UC8 fill:#EDE9FE,stroke:#8B5CF6,color:#4C1D95
    style UC9 fill:#EDE9FE,stroke:#8B5CF6,color:#4C1D95
    style UC10 fill:#EDE9FE,stroke:#8B5CF6,color:#4C1D95
    style UC11 fill:#D1FAE5,stroke:#10B981,color:#065F46
    style UC12 fill:#D1FAE5,stroke:#10B981,color:#065F46
    style UC13 fill:#D1FAE5,stroke:#10B981,color:#065F46
    style UC14 fill:#D1FAE5,stroke:#10B981,color:#065F46
    style UC15 fill:#FCE7F3,stroke:#EC4899,color:#831843
    style UC16 fill:#FCE7F3,stroke:#EC4899,color:#831843
    style UC17 fill:#FCE7F3,stroke:#EC4899,color:#831843
```

---

## 4. Diagramme de séquence — Authentification JWT

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'actorBkg': '#3B82F6', 'actorTextColor': '#ffffff', 'actorBorder': '#1D4ED8', 'actorLineColor': '#94A3B8', 'signalColor': '#475569', 'signalTextColor': '#1E293B', 'labelBoxBkgColor': '#DBEAFE', 'labelBoxBorderColor': '#3B82F6', 'labelTextColor': '#1E3A8A', 'loopTextColor': '#1E3A8A', 'activationBorderColor': '#3B82F6', 'activationBkgColor': '#EFF6FF', 'sequenceNumberColor': '#ffffff', 'noteBkgColor': '#FEF3C7', 'noteTextColor': '#78350F', 'noteBorderColor': '#F59E0B', 'background': '#ffffff'}}}%%
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant F as Frontend (Next.js)
    participant API as API Express
    participant MW as Middleware JWT
    participant DB as MySQL

    rect rgb(219, 234, 254)
        Note over U,DB: Phase 1 — Inscription
        U->>F: Remplit le formulaire d'inscription
        F->>API: POST /api/auth/register {name, email, password}
        API->>API: express-validator (validation)
        API->>DB: SELECT * FROM users WHERE email = ?
        DB-->>API: Aucun résultat (email disponible)
        API->>API: bcrypt.hash(password, 10)
        API->>DB: INSERT INTO users (id, name, email, password, role)
        DB-->>API: OK
        API->>API: jwt.sign({id, role}, JWT_SECRET, {expiresIn: '7d'})
        API-->>F: 201 {token, user}
        F->>F: Zustand → set({token, user, isAuthenticated: true})
        F-->>U: Redirection vers /events
    end

    rect rgb(255, 245, 230)
        Note over U,DB: Phase 2 — Connexion
        U->>F: Saisit email + mot de passe
        F->>API: POST /api/auth/login {email, password}
        API->>DB: SELECT * FROM users WHERE email = ?
        DB-->>API: user row
        API->>API: bcrypt.compare(password, user.password)
        API->>API: jwt.sign({id, role}, JWT_SECRET, {expiresIn: '7d'})
        API->>DB: UPDATE users SET last_login = NOW()
        API-->>F: 200 {token, user}
        F->>F: Zustand → persist token dans localStorage
        F-->>U: Redirection vers /events
    end

    rect rgb(230, 255, 230)
        Note over U,DB: Phase 3 — Requête authentifiée
        U->>F: Clic sur "Mes inscriptions"
        F->>API: GET /api/inscriptions/my + Header: Authorization: Bearer xxx
        API->>MW: authenticateToken()
        MW->>MW: jwt.verify(token, JWT_SECRET)
        MW-->>API: req.user = {id, role}
        API->>DB: SELECT * FROM inscriptions WHERE user_id = ?
        DB-->>API: inscriptions[]
        API-->>F: 200 {inscriptions: [...]}
        F-->>U: Affiche les inscriptions
    end

    rect rgb(255, 230, 230)
        Note over U,DB: Phase 4 — Token expiré
        U->>F: Action quelconque
        F->>API: GET /api/... + Header: Authorization: Bearer expired_token
        API->>MW: authenticateToken()
        MW->>MW: jwt.verify() → TokenExpiredError
        MW-->>API: 403 Token invalide
        API-->>F: 403
        F->>F: Intercepteur Axios → logout()
        F-->>U: Redirection vers /login
    end
```

---

## 5. Diagramme de séquence — Paiement Stripe

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'actorBkg': '#16A34A', 'actorTextColor': '#ffffff', 'actorBorder': '#15803D', 'actorLineColor': '#94A3B8', 'signalColor': '#475569', 'signalTextColor': '#1E293B', 'labelBoxBkgColor': '#DCFCE7', 'labelBoxBorderColor': '#22C55E', 'labelTextColor': '#14532D', 'loopTextColor': '#14532D', 'activationBorderColor': '#22C55E', 'activationBkgColor': '#F0FDF4', 'sequenceNumberColor': '#ffffff', 'noteBkgColor': '#FEF3C7', 'noteBorderColor': '#F59E0B', 'noteTextColor': '#78350F', 'background': '#ffffff'}}}%%
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant F as Frontend (Next.js)
    participant API as API Express
    participant DB as MySQL
    participant S as Stripe API

    rect rgb(230, 245, 255)
        Note over U,S: Phase 1 — Inscription + Paiement
        U->>F: Clic "S'inscrire" sur un événement payant
        F->>API: POST /api/inscriptions {event_id}
        API->>DB: SELECT max_tickets, COUNT inscriptions FROM events
        DB-->>API: places disponibles
        API->>DB: INSERT INTO inscriptions (status: 'pending')
        DB-->>API: OK
        API-->>F: 201 {inscription}
    end

    rect rgb(255, 245, 230)
        Note over U,S: Phase 2 — Checkout Stripe
        F->>API: POST /api/payments {event_id}
        API->>DB: SELECT event (title, price)
        DB-->>API: event
        API->>S: stripe.checkout.sessions.create({line_items, success_url, cancel_url})
        S-->>API: {id, url: "https://checkout.stripe.com/..."}
        API-->>F: 200 {url}
        F->>U: Redirection vers Stripe Checkout
    end

    rect rgb(230, 255, 230)
        Note over U,S: Phase 3 — Paiement sur Stripe
        U->>S: Saisie carte 4242 4242 4242 4242
        S->>S: Traitement du paiement
        S-->>U: Redirection vers success_url
    end

    rect rgb(255, 230, 255)
        Note over U,S: Phase 4 — Webhook de confirmation
        S->>API: POST /api/payments/webhook (checkout.session.completed)
        API->>API: Vérification signature Stripe (STRIPE_WEBHOOK_SECRET)
        API->>DB: UPDATE payments SET status = 'succeeded'
        API->>DB: UPDATE inscriptions SET status = 'confirmed'
        DB-->>API: OK
        API-->>S: 200 OK
    end
```

---

## 6. Diagramme d'architecture globale

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#DBEAFE', 'primaryTextColor': '#1E3A5F', 'primaryBorderColor': '#3B82F6', 'lineColor': '#6366F1', 'secondaryColor': '#EDE9FE', 'tertiaryColor': '#ECFDF5', 'textColor': '#1E293B', 'fontSize': '13px', 'clusterBkg': '#F1F5F9', 'clusterBorder': '#94A3B8', 'background': '#ffffff'}}}%%
flowchart TB
    subgraph Client["Clients"]
        direction LR
        WEB["🌐 Application Web<br/>Next.js 16 · React 19<br/>TypeScript · Tailwind CSS 4<br/>Zustand · Framer Motion"]
        MOBILE["📱 Application Mobile<br/>React Native 0.81<br/>Expo SDK 54<br/>NativeWind v4"]
    end

    subgraph API["API REST — Express.js"]
        direction TB
        SEC["🔒 Couche Sécurité<br/>JWT · CORS · Rate Limit"]
        CTRL["🎮 Controllers<br/>auth · events · users<br/>inscriptions · payments"]
        VALID["✅ Validators<br/>express-validator<br/>auth · event · inscription · payment"]
        SVC["⚙️ Services / Logique métier<br/>bcrypt · jsonwebtoken<br/>Vérification places dispo"]
        REPO["📦 Repositories<br/>BaseRepository · UserRepository<br/>EventRepository · InscriptionRepository"]
        SWAGGER["📄 Swagger UI<br/>/api-docs"]

        SEC --> CTRL
        CTRL --> VALID
        VALID --> SVC
        SVC --> REPO
    end

    subgraph DATA["Données"]
        DB[("🗄️ MySQL 8.0<br/>Base : evencianew<br/>4 tables · UUID<br/>Migrations SQL")]
    end

    subgraph EXT["Services externes"]
        STRIPE["💳 Stripe API<br/>Checkout Sessions<br/>Webhooks"]
    end

    WEB -->|"HTTP/REST<br/>Axios + JWT"| SEC
    MOBILE -->|"HTTP/REST<br/>Axios + JWT"| SEC
    REPO -->|"mysql2 pool<br/>Requêtes paramétrées"| DB
    SVC -->|"stripe.checkout<br/>sessions.create"| STRIPE
    STRIPE -->|"POST /webhook<br/>checkout.session.completed"| CTRL

    style WEB fill:#DBEAFE,stroke:#3B82F6,color:#1E3A5F
    style MOBILE fill:#DBEAFE,stroke:#3B82F6,color:#1E3A5F
    style SEC fill:#FEE2E2,stroke:#EF4444,color:#7F1D1D
    style CTRL fill:#E0E7FF,stroke:#6366F1,color:#312E81
    style VALID fill:#EDE9FE,stroke:#8B5CF6,color:#4C1D95
    style SVC fill:#FCE7F3,stroke:#EC4899,color:#831843
    style REPO fill:#D1FAE5,stroke:#10B981,color:#065F46
    style SWAGGER fill:#FEF3C7,stroke:#F59E0B,color:#78350F
    style DB fill:#CFFAFE,stroke:#06B6D4,color:#164E63
    style STRIPE fill:#FEF3C7,stroke:#F59E0B,color:#78350F
```

---

## 7. Diagramme de déploiement Docker

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#DBEAFE', 'primaryTextColor': '#1E3A5F', 'primaryBorderColor': '#3B82F6', 'lineColor': '#6366F1', 'secondaryColor': '#EDE9FE', 'tertiaryColor': '#ECFDF5', 'textColor': '#1E293B', 'fontSize': '13px', 'clusterBkg': '#F1F5F9', 'clusterBorder': '#94A3B8', 'background': '#ffffff'}}}%%
flowchart TB
    subgraph LOCAL["🖥️ Environnement Local (docker-compose.yml)"]
        direction TB

        subgraph DNET["Réseau Docker : evencia-network"]
            direction LR

            MYSQL["🗄️ MySQL 8.0<br/>Container : evencia-mysql<br/>Port : 3307:3306<br/>Volume : mysql_data<br/>Healthcheck : mysqladmin ping"]
            BACK["⚙️ Backend Express<br/>Container : evencia-backend<br/>Port : 5000:5000<br/>Node 20 Alpine<br/>depends_on: mysql (healthy)"]
            FRONT["🌐 Frontend Next.js<br/>Container : evencia-frontend<br/>Port : 3000:3000<br/>Build multi-stage<br/>depends_on: backend"]

            MYSQL ---|"DB_HOST=mysql<br/>DB_PORT=3306"| BACK
            BACK ---|"NEXT_PUBLIC_API_URL<br/>http://localhost:5000"| FRONT
        end
    end

    subgraph PROD["☁️ Production (docker-compose.prod.yml)"]
        direction TB

        subgraph ORACLE["Oracle Cloud Free Tier<br/>VM ARM · 4 CPU · 24 Go RAM"]
            direction LR

            NGINX["🔀 Nginx<br/>Reverse Proxy<br/>Port 80 / 443"]
            CERTBOT["🔐 Certbot<br/>Let's Encrypt<br/>HTTPS auto"]
            PMYSQL["🗄️ MySQL 8.0"]
            PBACK["⚙️ Backend Express"]
            PFRONT["🌐 Frontend Next.js"]

            NGINX -->|"443 → 3000"| PFRONT
            NGINX -->|"/api → 5000"| PBACK
            CERTBOT -.->|"Certificat SSL"| NGINX
            PMYSQL --- PBACK
            PBACK --- PFRONT
        end

        DNS["🌍 DuckDNS<br/>evencia.duckdns.org"]
        DNS -->|"DNS → IP Oracle"| NGINX
    end

    DEV["👨‍💻 Développeur"]
    DEV -->|"docker compose up"| LOCAL
    DEV -->|"git push + docker compose -f prod"| PROD

    style MYSQL fill:#CFFAFE,stroke:#06B6D4,color:#164E63
    style BACK fill:#D1FAE5,stroke:#10B981,color:#065F46
    style FRONT fill:#DBEAFE,stroke:#3B82F6,color:#1E3A5F
    style PMYSQL fill:#CFFAFE,stroke:#06B6D4,color:#164E63
    style PBACK fill:#D1FAE5,stroke:#10B981,color:#065F46
    style PFRONT fill:#DBEAFE,stroke:#3B82F6,color:#1E3A5F
    style NGINX fill:#FEE2E2,stroke:#EF4444,color:#7F1D1D
    style CERTBOT fill:#FEF3C7,stroke:#F59E0B,color:#78350F
    style DNS fill:#EDE9FE,stroke:#8B5CF6,color:#4C1D95
    style DEV fill:#6366F1,stroke:#4338CA,color:#ffffff
```

---

## 8. Diagramme de séquence — Inscription à un événement

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'actorBkg': '#D97706', 'actorTextColor': '#ffffff', 'actorBorder': '#B45309', 'actorLineColor': '#94A3B8', 'signalColor': '#475569', 'signalTextColor': '#1E293B', 'labelBoxBkgColor': '#FEF3C7', 'labelBoxBorderColor': '#F59E0B', 'labelTextColor': '#78350F', 'loopTextColor': '#78350F', 'activationBorderColor': '#F59E0B', 'activationBkgColor': '#FFFBEB', 'sequenceNumberColor': '#ffffff', 'noteBkgColor': '#DBEAFE', 'noteBorderColor': '#3B82F6', 'noteTextColor': '#1E3A8A', 'background': '#ffffff'}}}%%
sequenceDiagram
    autonumber
    actor U as Utilisateur (Participant)
    participant F as Frontend Next.js
    participant API as API Express
    participant MW as Middleware Auth
    participant DB as MySQL

    U->>F: Clic "S'inscrire" (page /events/[id])
    F->>API: POST /api/inscriptions {event_id}
    API->>MW: authenticateToken()
    MW->>MW: jwt.verify(token)
    MW-->>API: req.user = {id, role: 'participant'}

    API->>DB: SELECT * FROM events WHERE id = ?
    DB-->>API: event {max_tickets: 100, ...}

    API->>DB: SELECT COUNT(*) FROM inscriptions WHERE event_id = ? AND status != 'cancelled'
    DB-->>API: count = 42

    alt Places disponibles (42 < 100)
        API->>DB: SELECT * FROM inscriptions WHERE user_id = ? AND event_id = ?
        DB-->>API: Aucun résultat

        API->>DB: INSERT INTO inscriptions (id, user_id, event_id, status='pending')
        DB-->>API: OK
        API-->>F: 201 {message: "Inscription réussie", inscription}
        F-->>U: Notification succès + bouton "Payer"
    else Plus de places (count >= max_tickets)
        API-->>F: 400 {message: "Événement complet"}
        F-->>U: Notification "Plus de places disponibles"
    else Déjà inscrit
        API-->>F: 409 {message: "Déjà inscrit à cet événement"}
        F-->>U: Notification "Vous êtes déjà inscrit"
    end
```

---

## 9. Diagramme de navigation — Application Mobile (Expo)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#DBEAFE', 'primaryTextColor': '#1E3A5F', 'primaryBorderColor': '#3B82F6', 'lineColor': '#6366F1', 'secondaryColor': '#EDE9FE', 'tertiaryColor': '#ECFDF5', 'textColor': '#1E293B', 'fontSize': '13px', 'clusterBkg': '#F1F5F9', 'clusterBorder': '#94A3B8', 'background': '#ffffff'}}}%%
flowchart TD
    START((App.js)) --> AUTH{Token<br/>AsyncStorage ?}

    AUTH -->|Non| LOGIN["📱 LoginScreen<br/>Email + Mot de passe"]
    AUTH -->|Oui| VERIFY["Vérification token<br/>GET /api/auth/verify"]

    VERIFY -->|Valide| TABS
    VERIFY -->|Expiré| LOGIN

    LOGIN -->|"POST /api/auth/login"| TABS

    subgraph TABS["Bottom Tab Navigator"]
        direction LR
        HOME["🏠 HomeScreen<br/>Événements à la une"]
        SEARCH["🔍 SearchScreen<br/>Recherche + Filtres"]
        DASH["📊 DashboardScreen<br/>Mes inscriptions"]
        PROFILE["👤 ProfileScreen<br/>Mon profil"]
    end

    HOME -->|"Clic événement"| DETAIL["📋 EventDetailScreen<br/>Détail + Inscription"]
    SEARCH -->|"Clic événement"| DETAIL
    PROFILE -->|"Déconnexion"| LOGIN

    style START fill:#6366F1,stroke:#4338CA,color:#fff
    style AUTH fill:#FEF3C7,stroke:#F59E0B,color:#78350F
    style LOGIN fill:#FEE2E2,stroke:#EF4444,color:#7F1D1D
    style VERIFY fill:#EDE9FE,stroke:#8B5CF6,color:#4C1D95
    style HOME fill:#DBEAFE,stroke:#3B82F6,color:#1E3A5F
    style SEARCH fill:#D1FAE5,stroke:#10B981,color:#065F46
    style DASH fill:#FCE7F3,stroke:#EC4899,color:#831843
    style PROFILE fill:#FEF3C7,stroke:#F59E0B,color:#78350F
    style DETAIL fill:#E0E7FF,stroke:#6366F1,color:#312E81
```

---

## 10. Diagramme de flux — Gestion des rôles et autorisations

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#DBEAFE', 'primaryTextColor': '#1E3A5F', 'primaryBorderColor': '#3B82F6', 'lineColor': '#6366F1', 'secondaryColor': '#EDE9FE', 'tertiaryColor': '#ECFDF5', 'textColor': '#1E293B', 'fontSize': '13px', 'background': '#ffffff'}}}%%
flowchart TD
    REQ["Requête HTTP entrante"] --> RATE["express-rate-limit<br/>100 req/min (global)<br/>5 req/min (/auth)"]
    RATE --> CORS["CORS<br/>Vérification origines autorisées"]
    CORS --> PUBLIC{Route<br/>publique ?}

    PUBLIC -->|"Oui<br/>GET /events, POST /auth/login..."| CTRL["Controller<br/>(traitement)"]
    PUBLIC -->|"Non<br/>Routes protégées"| JWT["authenticateToken()<br/>jwt.verify(token)"]

    JWT -->|"Token invalide / absent"| ERR401["401 Unauthorized<br/>ou 403 Forbidden"]
    JWT -->|"Token valide"| ROLE{authorizeRoles<br/>Rôle requis ?}

    ROLE -->|"participant"| PART["Inscriptions, Profil,<br/>Mes événements"]
    ROLE -->|"organizer"| ORG["CRUD événements,<br/>Dashboard stats"]
    ROLE -->|"admin"| ADM["Gestion users,<br/>Tous les événements"]
    ROLE -->|"Rôle insuffisant"| ERR403["403 Accès interdit"]

    PART --> CTRL
    ORG --> CTRL
    ADM --> CTRL
    CTRL --> DB[("MySQL")]

    style REQ fill:#6366F1,stroke:#4338CA,color:#fff
    style RATE fill:#FEF3C7,stroke:#F59E0B,color:#78350F
    style CORS fill:#FEF3C7,stroke:#F59E0B,color:#78350F
    style PUBLIC fill:#EDE9FE,stroke:#8B5CF6,color:#4C1D95
    style JWT fill:#FEE2E2,stroke:#EF4444,color:#7F1D1D
    style ROLE fill:#EDE9FE,stroke:#8B5CF6,color:#4C1D95
    style PART fill:#DBEAFE,stroke:#3B82F6,color:#1E3A5F
    style ORG fill:#D1FAE5,stroke:#10B981,color:#065F46
    style ADM fill:#FCE7F3,stroke:#EC4899,color:#831843
    style ERR401 fill:#FEE2E2,stroke:#EF4444,color:#7F1D1D
    style ERR403 fill:#FEE2E2,stroke:#EF4444,color:#7F1D1D
    style CTRL fill:#E0E7FF,stroke:#6366F1,color:#312E81
    style DB fill:#CFFAFE,stroke:#06B6D4,color:#164E63
```
