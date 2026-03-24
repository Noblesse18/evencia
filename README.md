# Evencia — Plateforme de gestion d'événements

Application web et mobile fullstack permettant aux organisateurs de créer et gérer des événements, et aux participants de s'y inscrire et de payer en ligne via Stripe.

---

## Identifiants de test

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| **Administrateur** | admin@evencia.fr | Evencia2026! |
| **Organisateur** | organisateur@evencia.fr | Evencia2026! |
| **Participant** | participant@evencia.fr | Evencia2026! |

> Ces comptes sont créés automatiquement au premier lancement via Docker.
> Pour les recréer manuellement : `cd backend && npm run seed`

**Carte de test Stripe** : `4242 4242 4242 4242` (date future quelconque, CVC quelconque)

---

## Technologies utilisées

| Couche | Technologies |
|--------|-------------|
| **Backend (API REST)** | Node.js 20, Express.js 4.18, JWT, bcrypt, express-validator, express-rate-limit, Swagger/OpenAPI 3, Stripe |
| **Base de données** | MySQL 8.0, Drizzle ORM, mysql2 |
| **Frontend Web** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand, Framer Motion, Axios, @stripe/stripe-js |
| **Frontend Mobile** | React Native 0.81, Expo SDK 54, NativeWind v4, React Navigation, AsyncStorage |
| **DevOps** | Docker, Docker Compose, Nginx, Certbot, Git, GitHub |

---

## Installation et lancement

### Prérequis

- Docker et Docker Compose
- Node.js 18+ (pour l'application mobile uniquement)

### 1. Cloner le projet

```bash
git clone https://github.com/Noblesse18/evencia.git
cd evencia
```

### 2. Lancer avec Docker (backend + frontend + base de données)

```bash
docker compose up --build -d
```

> Au premier lancement, la base MySQL est initialisée avec le schéma et un jeu de données de test
> (3 utilisateurs, 5 événements, inscriptions et paiements).
> Si la base existe déjà et que vous voulez la réinitialiser :
> `docker compose down -v && docker compose up --build -d`

### 3. Vérifier que tout fonctionne

```bash
docker compose ps
```

| Service | URL |
|---------|-----|
| Frontend Web | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| Documentation Swagger | http://localhost:5000/api-docs |

### 4. Lancer l'application mobile (optionnel)

```bash
cd mobile
npm install
npx expo start
# Appuyer sur 'a' pour ouvrir sur l'émulateur Android
```

### 5. Lancer Stripe en mode test (optionnel)

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

### Arrêter l'application

```bash
docker compose down
```

---

## Structure du projet

```
evencia/
├── backend/           # API REST Express.js (Node.js 20)
│   ├── src/
│   │   ├── config/        # Configuration BDD, Swagger
│   │   ├── controllers/   # Logique des routes (auth, events, users, inscriptions, payments)
│   │   ├── middleware/     # JWT, gestion erreurs, rate limiting
│   │   ├── repositories/  # Accès aux données (BaseRepository, UserRepository, etc.)
│   │   ├── services/      # Routes Express
│   │   └── validators/    # Validation express-validator
│   ├── migrations/        # Scripts SQL d'initialisation
│   └── Dockerfile
├── frontend/          # Application web Next.js 16
│   ├── src/
│   │   ├── app/           # Pages (App Router)
│   │   ├── components/    # Composants React réutilisables
│   │   └── store/         # État global Zustand
│   └── Dockerfile
├── mobile/            # Application mobile React Native / Expo
│   └── src/
│       ├── screens/       # Écrans (Login, Home, Search, EventDetail, Dashboard, Profile)
│       ├── contexts/      # AuthContext (gestion JWT + AsyncStorage)
│       └── services/      # Client API Axios
├── postman/           # Collections de tests API Postman (42 tests)
├── docs/              # Documentation complète du projet
│   ├── README.md              # Index de la documentation
│   ├── documentation-technique.md   # Architecture, BDD, API, sécurité
│   ├── documentation-utilisateur.md # Guide d'utilisation avec captures
│   └── pour les epreuves/    # Fiches E5/E6 BTS SIO
├── docker-compose.yml         # Orchestration locale (MySQL + Backend + Frontend)
├── docker-compose.prod.yml    # Orchestration production (+ Nginx + Certbot)
└── README.md                  # Ce fichier
```

---

## Accès en ligne (Production)

Le projet est déployé et accessible en ligne :

| Service | URL |
|---------|-----|
| **Frontend** | https://evencia-v2.vercel.app |
| **Backend API** | https://evencia.onrender.com/api |
| **Swagger** | https://evencia.onrender.com/api-docs |

> **Note importante** : le backend est hébergé sur Render (plan gratuit). Après une période d'inactivité (~15 minutes), le serveur se met en veille. La **première requête** peut prendre **30 à 50 secondes** le temps que le serveur redémarre. Les requêtes suivantes sont instantanées. Merci de patienter lors du premier chargement.

---

## Documentation

La documentation complète est disponible dans le dossier [`/docs`](docs/README.md) :

- [Documentation technique](docs/documentation-technique.md) — Architecture, schéma BDD, endpoints API, sécurité
- [Documentation utilisateur](docs/documentation-utilisateur.md) — Guide d'utilisation avec captures d'écran
- [Collection Postman (JSON)](docs/evencia-postman-collection.json) — Tests API exportés
- [Diagrammes UML](docs/pour%20les%20epreuves/Epreuves-BTS-SIO.md#diagrammes-mermaid-uml) — Classes, cas d'utilisation, séquence, architecture

---

## Endpoints principaux de l'API

| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|:----------------:|
| POST | `/api/auth/register` | Inscription | Non |
| POST | `/api/auth/login` | Connexion (retourne JWT) | Non |
| GET | `/api/auth/verify` | Vérifier le token | Oui |
| GET | `/api/events` | Lister les événements | Non |
| GET | `/api/events/:id` | Détail d'un événement | Non |
| POST | `/api/events` | Créer un événement | Organizer/Admin |
| PUT | `/api/events/:id` | Modifier un événement | Organizer/Admin |
| DELETE | `/api/events/:id` | Supprimer un événement | Organizer/Admin |
| POST | `/api/inscriptions` | S'inscrire à un événement | Participant |
| GET | `/api/inscriptions/my` | Mes inscriptions | Oui |
| POST | `/api/payments` | Créer un paiement Stripe | Oui |
| GET | `/api/users/me` | Mon profil | Oui |

Documentation complète de l'API : http://localhost:5000/api-docs (Swagger)

---

*Projet réalisé dans le cadre du BTS SIO SLAM — Session 2026*
