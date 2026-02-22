# TP2 - Utiliser les Services dans les Controllers
## Durée : 2h | Niveau : ⭐⭐ Intermédiaire

---

## 🎯 Objectifs

À la fin de ce TP, tu sauras :
- Comprendre le pattern Service (couche métier)
- Connecter AuthService au controller d'authentification
- Créer un EventService
- Séparer la logique métier des controllers

---

## 📚 Rappel théorique

### Architecture en couches

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
└─────────────────────────────────────────────────────────┘
                          │ HTTP
                          ▼
┌─────────────────────────────────────────────────────────┐
│  CONTROLLERS   │  Reçoit les requêtes, envoie réponses  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  SERVICES      │  Logique métier, validations           │ ← CE TP
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  REPOSITORIES  │  Accès aux données (CRUD)              │ ← TP1
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  BASE DE DONNÉES                                        │
└─────────────────────────────────────────────────────────┘
```

### Rôle de chaque couche

| Couche | Responsabilité | Exemple |
|--------|----------------|---------|
| **Controller** | HTTP (req/res) | Valider le format, renvoyer 200/400/500 |
| **Service** | Logique métier | Vérifier si email unique, hasher mot de passe |
| **Repository** | CRUD BDD | SELECT, INSERT, UPDATE, DELETE |

---

## 📋 Étapes du TP

### Étape 1 : Créer le fichier d'initialisation des services

Crée `backend/src/services/index.js` :

```javascript
// backend/src/services/index.js

const { userRepository, eventRepository, inscriptionRepository } = require('../repositories');

const AuthService = require('./AuthService');
const EventService = require('./EventService');

// Instancier les services avec leurs dépendances (repositories)
const authService = new AuthService(userRepository);
const eventService = new EventService(eventRepository, inscriptionRepository);

module.exports = {
    authService,
    eventService
};
```

---

### Étape 2 : Créer EventService

Crée `backend/src/services/EventService.js` :

```javascript
// backend/src/services/EventService.js

class EventService {
    constructor(eventRepository, inscriptionRepository) {
        this.eventRepository = eventRepository;
        this.inscriptionRepository = inscriptionRepository;
    }

    /**
     * Récupérer tous les événements avec pagination et filtres
     */
    async getAllEvents(filters = {}) {
        try {
            const { 
                category, 
                date_from, 
                date_to, 
                price_min, 
                price_max, 
                city, 
                search,
                page = 1, 
                limit = 12 
            } = filters;

            // Construire les filtres pour le repository
            const repositoryFilters = {
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit)
            };

            if (category && category !== 'all') {
                repositoryFilters.category = category;
            }
            if (date_from) repositoryFilters.startDate = date_from;
            if (date_to) repositoryFilters.endDate = date_to;
            if (price_min) repositoryFilters.minPrice = parseFloat(price_min);
            if (price_max) repositoryFilters.maxPrice = parseFloat(price_max);
            if (city) repositoryFilters.location = city;
            if (search) repositoryFilters.search = search;

            // Récupérer les événements
            const events = await this.eventRepository.findAllWithOrganizers(repositoryFilters);

            // Ajouter le nombre de participants pour chaque événement
            const eventsWithParticipants = await Promise.all(
                events.map(async (event) => {
                    const participantsCount = await this.inscriptionRepository.countByEventId(event.id);
                    return {
                        ...event,
                        participants_count: participantsCount
                    };
                })
            );

            // Calculer le total pour la pagination
            const total = await this.eventRepository.count();

            return {
                events: eventsWithParticipants,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            };
        } catch (error) {
            throw new Error(`Erreur getAllEvents: ${error.message}`);
        }
    }

    /**
     * Récupérer un événement par ID avec les infos complètes
     */
    async getEventById(eventId) {
        try {
            const event = await this.eventRepository.findById(eventId);

            if (!event) {
                return null;
            }

            // Récupérer le nombre de participants
            const participantsCount = await this.inscriptionRepository.countByEventId(eventId);

            // Calculer les tickets restants
            const ticketsRemaining = event.max_tickets 
                ? event.max_tickets - participantsCount 
                : null;

            return {
                ...event,
                participants_count: participantsCount,
                tickets_remaining: ticketsRemaining
            };
        } catch (error) {
            throw new Error(`Erreur getEventById: ${error.message}`);
        }
    }

    /**
     * Créer un nouvel événement
     */
    async createEvent(eventData, organizerId) {
        try {
            // Validations métier
            this.validateEventData(eventData);

            // Créer l'événement
            const newEvent = await this.eventRepository.createEvent({
                ...eventData,
                organizer_id: organizerId
            });

            return newEvent;
        } catch (error) {
            throw new Error(`Erreur createEvent: ${error.message}`);
        }
    }

    /**
     * Mettre à jour un événement
     */
    async updateEvent(eventId, updateData, userId, userRole) {
        try {
            // Vérifier que l'événement existe
            const event = await this.eventRepository.findById(eventId);

            if (!event) {
                throw new Error('Événement introuvable');
            }

            // Vérifier les permissions
            if (event.organizer_id !== userId && userRole !== 'admin') {
                throw new Error('Non autorisé à modifier cet événement');
            }

            // Mettre à jour
            const updatedEvent = await this.eventRepository.updateEvent(
                eventId, 
                updateData, 
                userId
            );

            return updatedEvent;
        } catch (error) {
            throw new Error(`Erreur updateEvent: ${error.message}`);
        }
    }

    /**
     * Supprimer un événement
     */
    async deleteEvent(eventId, userId, userRole) {
        try {
            // Vérifier que l'événement existe
            const event = await this.eventRepository.findById(eventId);

            if (!event) {
                throw new Error('Événement introuvable');
            }

            // Vérifier les permissions
            if (event.organizer_id !== userId && userRole !== 'admin') {
                throw new Error('Non autorisé à supprimer cet événement');
            }

            // Supprimer
            await this.eventRepository.delete(eventId);

            return { success: true, message: 'Événement supprimé' };
        } catch (error) {
            throw new Error(`Erreur deleteEvent: ${error.message}`);
        }
    }

    /**
     * Récupérer les événements d'un organisateur
     */
    async getOrganizerEvents(organizerId) {
        try {
            const events = await this.eventRepository.findByOrganizer(organizerId);

            // Ajouter les stats pour chaque événement
            const eventsWithStats = await Promise.all(
                events.map(async (event) => {
                    const ticketsSold = await this.inscriptionRepository.countByEventId(event.id);
                    return {
                        ...event,
                        participants_count: ticketsSold,
                        tickets_sold: ticketsSold
                    };
                })
            );

            // Calculer les statistiques globales
            let totalTicketsSold = 0;
            let totalRevenue = 0;

            eventsWithStats.forEach(event => {
                totalTicketsSold += event.tickets_sold || 0;
                totalRevenue += (event.tickets_sold || 0) * (parseFloat(event.price) || 0);
            });

            return {
                events: eventsWithStats,
                stats: {
                    totalEvents: eventsWithStats.length,
                    totalTicketsSold,
                    totalRevenue
                }
            };
        } catch (error) {
            throw new Error(`Erreur getOrganizerEvents: ${error.message}`);
        }
    }

    /**
     * Validations métier des données d'événement
     */
    validateEventData(eventData) {
        const errors = [];

        // Titre obligatoire
        if (!eventData.title || eventData.title.trim().length < 3) {
            errors.push('Le titre doit contenir au moins 3 caractères');
        }

        // Titre max 255 caractères
        if (eventData.title && eventData.title.length > 255) {
            errors.push('Le titre ne peut pas dépasser 255 caractères');
        }

        // Prix positif ou nul
        if (eventData.price !== undefined && eventData.price < 0) {
            errors.push('Le prix ne peut pas être négatif');
        }

        // Max tickets positif
        if (eventData.max_tickets !== undefined && eventData.max_tickets !== null && eventData.max_tickets < 1) {
            errors.push('Le nombre de tickets doit être supérieur à 0');
        }

        // Date dans le futur (si fournie)
        if (eventData.event_date) {
            const eventDate = new Date(eventData.event_date);
            if (eventDate < new Date()) {
                errors.push('La date de l\'événement doit être dans le futur');
            }
        }

        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    }
}

module.exports = EventService;
```

---

### Étape 3 : Modifier authController pour utiliser AuthService

Modifie `backend/src/controllers/authController.js` :

**AVANT (logique métier dans le controller) :**
```javascript
async function register(req, res, next) {
  try {
    const { name, email, password, role = 'participant' } = req.body;
    
    // Validation dans le controller ❌
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Champs manquants' });
    }

    // Logique métier dans le controller ❌
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    // Hash dans le controller ❌
    const password_hash = await bcrypt.hash(password, 10);
    // ...
  }
}
```

**APRÈS (avec Service) :**
```javascript
// backend/src/controllers/authController.js
const { authService } = require('../services');

async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    // Le controller ne fait que transmettre au service
    const result = await authService.register({
      name,
      email,
      password,
      role: role || 'participant'
    });

    res.status(201).json({
      user: result.user,
      token: result.token
    });

  } catch (error) {
    // Gérer les erreurs du service
    if (error.message.includes('existe deja') || error.message.includes('email')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Le controller ne fait que transmettre au service
    const result = await authService.login(email, password);

    res.json({
      user: result.user,
      token: result.token
    });

  } catch (error) {
    if (error.message.includes('incorrect') || error.message.includes('requis')) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }
    next(error);
  }
}

async function verifyToken(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    const result = authService.verifyToken(token);

    // Récupérer les infos utilisateur complètes
    const user = await authService.userRepository.findById(result.userId);

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.createdAt
      },
      valid: true
    });

  } catch (error) {
    if (error.message.includes('Token') || error.message.includes('token')) {
      return res.status(401).json({ message: error.message });
    }
    next(error);
  }
}

module.exports = { register, login, verifyToken, changePassword, requestPasswordReset, resetPassword };
```

---

### Étape 4 : Modifier eventController pour utiliser EventService

Modifie `backend/src/controllers/eventController.js` :

```javascript
// backend/src/controllers/eventController.js
const { eventService } = require('../services');

const CATEGORIES = [
  'musique', 'sport', 'conference', 'theatre', 'cinema',
  'exposition', 'festival', 'atelier', 'networking', 'gastronomie', 'autre'
];

async function getCategories(req, res) {
  res.json(CATEGORIES);
}

async function listEvents(req, res, next) {
  try {
    const result = await eventService.getAllEvents(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getEvent(req, res, next) {
  try {
    const event = await eventService.getEventById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement introuvable' });
    }
    
    res.json(event);
  } catch (error) {
    next(error);
  }
}

async function createEvent(req, res, next) {
  try {
    const newEvent = await eventService.createEvent(req.body, req.user.userId);
    res.status(201).json(newEvent);
  } catch (error) {
    if (error.message.includes('validation') || error.message.includes('doit')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function updateEvent(req, res, next) {
  try {
    const updatedEvent = await eventService.updateEvent(
      req.params.id,
      req.body,
      req.user.userId,
      req.user.role
    );
    res.json(updatedEvent);
  } catch (error) {
    if (error.message.includes('introuvable')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('autorisé')) {
      return res.status(403).json({ message: error.message });
    }
    next(error);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const result = await eventService.deleteEvent(
      req.params.id,
      req.user.userId,
      req.user.role
    );
    res.json(result);
  } catch (error) {
    if (error.message.includes('introuvable')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('autorisé')) {
      return res.status(403).json({ message: error.message });
    }
    next(error);
  }
}

async function getOrganizerEvents(req, res, next) {
  try {
    const result = await eventService.getOrganizerEvents(req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { 
  listEvents, getEvent, createEvent, updateEvent, deleteEvent, 
  getCategories, getOrganizerEvents 
};
```

---

### Étape 5 : Tester

1. **Démarre le serveur** :
```bash
cd backend
npm run dev
```

2. **Teste l'inscription** :
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test1234"}'
```

3. **Teste la création d'événement** (avec token) :
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TON_TOKEN]" \
  -d '{"title":"Mon événement","description":"Description","location":"Paris"}'
```

---

## ✅ Checklist de validation

- [ ] `services/index.js` est créé et exporte les services
- [ ] `EventService.js` est créé avec toutes les méthodes
- [ ] `authController.js` utilise `authService`
- [ ] `eventController.js` utilise `eventService`
- [ ] Les controllers ne contiennent plus de logique métier
- [ ] Tous les endpoints fonctionnent

---

## 📝 Ce que tu as appris

1. **La couche Service** contient la logique métier
2. **Les Controllers** ne font que router les requêtes/réponses HTTP
3. **L'injection de dépendances** permet de tester facilement
4. **Les validations métier** sont centralisées dans les services

---

## 🎯 Schéma final de l'architecture

```
Requête HTTP
     │
     ▼
┌─────────────────┐
│   CONTROLLER    │  → Valide le format HTTP, renvoie les codes status
│  (authController)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    SERVICE      │  → Logique métier, validations, orchestration
│  (AuthService)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   REPOSITORY    │  → CRUD, requêtes SQL via Drizzle
│(UserRepository) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     MYSQL       │
└─────────────────┘
```

---

## ➡️ Étape suivante

Passe au [TP3 - Créer des Custom Hooks React](./TP3_HOOKS.md) pour améliorer le frontend.
