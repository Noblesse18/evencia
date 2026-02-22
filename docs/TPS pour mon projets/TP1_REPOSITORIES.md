# TP1 - Connecter les Repositories aux Controllers
## Durée : 2h | Niveau : ⭐⭐ Intermédiaire

---

## 🎯 Objectifs

À la fin de ce TP, tu sauras :
- Comprendre le pattern Repository
- Initialiser et injecter les repositories
- Remplacer les requêtes SQL directes par des appels aux repositories
- Améliorer la maintenabilité de ton code

---

## 📚 Rappel théorique

### Qu'est-ce que le pattern Repository ?

Le **Repository** est une couche d'abstraction entre les controllers et la base de données.

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────┐
│  Controller │ --> │  Repository  │ --> │  Drizzle ORM │ --> │  MySQL │
└─────────────┘     └──────────────┘     └──────────────┘     └────────┘
```

### Avantages

| Sans Repository | Avec Repository |
|-----------------|-----------------|
| SQL dans les controllers | SQL centralisé |
| Code dupliqué | Code réutilisable |
| Difficile à tester | Facile à mocker |
| Couplage fort avec la BDD | Couplage faible |

---

## 📋 Étapes du TP

### Étape 1 : Créer le fichier d'initialisation des repositories

Crée un nouveau fichier `backend/src/repositories/index.js` :

```javascript
// backend/src/repositories/index.js

const { db } = require('../config/db');
const { users } = require('../models/schemas/userSchema');
const { events } = require('../models/schemas/eventSchema');
const { inscriptions } = require('../models/schemas/inscriptionSchema');

const UserRepository = require('./UserRepository');
const EventRepository = require('./EventRepository');
const InscriptionRepository = require('./InscriptionRepository');

// Instancier les repositories avec les dépendances
const userRepository = new UserRepository(db, users);
const eventRepository = new EventRepository(db, events, users);
const inscriptionRepository = new InscriptionRepository(db, inscriptions, events, users);

module.exports = {
    userRepository,
    eventRepository,
    inscriptionRepository
};
```

---

### Étape 2 : Vérifier que InscriptionRepository existe

Si le fichier `InscriptionRepository.js` n'existe pas, crée-le :

```javascript
// backend/src/repositories/InscriptionRepository.js

const BaseRepository = require('./BaseRepository');
const { eq, and } = require('drizzle-orm');
const { v4: uuidv4 } = require('uuid');

class InscriptionRepository extends BaseRepository {
    constructor(db, inscriptionTable, eventTable, userTable) {
        super(db, inscriptionTable);
        this.eventTable = eventTable;
        this.userTable = userTable;
    }

    /**
     * Créer une inscription
     */
    async createInscription(userId, eventId, status = 'confirmed') {
        try {
            const inscriptionId = uuidv4();

            await this.db
                .insert(this.table)
                .values({
                    id: inscriptionId,
                    user_id: userId,
                    event_id: eventId,
                    status: status
                });

            return await this.findById(inscriptionId);
        } catch (error) {
            // Gestion de l'erreur de doublon
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Déjà inscrit à cet événement');
            }
            throw new Error(`Erreur createInscription: ${error.message}`);
        }
    }

    /**
     * Trouver les inscriptions d'un utilisateur
     */
    async findByUserId(userId) {
        try {
            const results = await this.db
                .select()
                .from(this.table)
                .where(eq(this.table.user_id, userId));

            return results;
        } catch (error) {
            throw new Error(`Erreur findByUserId: ${error.message}`);
        }
    }

    /**
     * Trouver les inscriptions d'un utilisateur avec les détails des événements
     */
    async findByUserIdWithEvents(userId) {
        try {
            const results = await this.db
                .select({
                    id: this.table.id,
                    user_id: this.table.user_id,
                    event_id: this.table.event_id,
                    status: this.table.status,
                    createdAt: this.table.createdAt,
                    // Infos de l'événement
                    event_title: this.eventTable.title,
                    event_description: this.eventTable.description,
                    event_location: this.eventTable.location,
                    event_date: this.eventTable.event_date,
                    event_price: this.eventTable.price,
                    event_category: this.eventTable.category,
                    event_image_url: this.eventTable.image_url
                })
                .from(this.table)
                .leftJoin(this.eventTable, eq(this.table.event_id, this.eventTable.id))
                .where(eq(this.table.user_id, userId))
                .orderBy(this.table.createdAt);

            return results;
        } catch (error) {
            throw new Error(`Erreur findByUserIdWithEvents: ${error.message}`);
        }
    }

    /**
     * Vérifier si un utilisateur est inscrit à un événement
     */
    async isUserRegistered(userId, eventId) {
        try {
            const results = await this.db
                .select()
                .from(this.table)
                .where(
                    and(
                        eq(this.table.user_id, userId),
                        eq(this.table.event_id, eventId)
                    )
                )
                .limit(1);

            return results.length > 0;
        } catch (error) {
            throw new Error(`Erreur isUserRegistered: ${error.message}`);
        }
    }

    /**
     * Compter les inscriptions confirmées pour un événement
     */
    async countByEventId(eventId, status = 'confirmed') {
        try {
            const results = await this.db
                .select()
                .from(this.table)
                .where(
                    and(
                        eq(this.table.event_id, eventId),
                        eq(this.table.status, status)
                    )
                );

            return results.length;
        } catch (error) {
            throw new Error(`Erreur countByEventId: ${error.message}`);
        }
    }

    /**
     * Annuler une inscription
     */
    async cancelInscription(inscriptionId, userId) {
        try {
            // Vérifier que l'inscription appartient à l'utilisateur
            const inscription = await this.findById(inscriptionId);
            
            if (!inscription) {
                throw new Error('Inscription introuvable');
            }

            if (inscription.user_id !== userId) {
                throw new Error('Non autorisé');
            }

            await this.delete(inscriptionId);
            return true;
        } catch (error) {
            throw new Error(`Erreur cancelInscription: ${error.message}`);
        }
    }
}

module.exports = InscriptionRepository;
```

---

### Étape 3 : Modifier le Controller des événements

Ouvre `backend/src/controllers/eventController.js` et modifie-le :

**AVANT (avec SQL direct) :**
```javascript
const { pool } = require('../config/db');

async function getEvent(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Événement introuvable' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}
```

**APRÈS (avec Repository) :**
```javascript
const { eventRepository, inscriptionRepository } = require('../repositories');

async function getEvent(req, res, next) {
  try {
    const { id } = req.params;
    
    // Utiliser le repository au lieu de SQL direct
    const event = await eventRepository.findById(id);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement introuvable' });
    }

    // Récupérer le nombre de participants
    const participantsCount = await inscriptionRepository.countByEventId(id);

    // Calculer les tickets restants
    const ticketsRemaining = event.max_tickets 
      ? event.max_tickets - participantsCount 
      : null;

    res.json({
      ...event,
      participants_count: participantsCount,
      tickets_remaining: ticketsRemaining
    });
  } catch (err) { 
    next(err); 
  }
}
```

---

### Étape 4 : Modifier la fonction createEvent

**AVANT :**
```javascript
async function createEvent(req, res, next) {
  try {
    const { title, description, category, location, event_date, price, max_tickets, image_url, photos } = req.body;
    const organizer_id = req.user.userId;
    const newEventId = uuidv4();
    
    await pool.execute(
      `INSERT INTO events (...) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [newEventId, title, description, ...]
    );
    const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [newEventId]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}
```

**APRÈS :**
```javascript
async function createEvent(req, res, next) {
  try {
    const { title, description, category, location, event_date, price, max_tickets, image_url, photos } = req.body;
    const organizer_id = req.user.userId;

    // Utiliser le repository
    const newEvent = await eventRepository.createEvent({
      title,
      description,
      category: category || 'autre',
      location,
      event_date: event_date || null,
      price: price || 0,
      max_tickets: max_tickets || null,
      organizer_id,
      image_url: image_url || null,
      photos: photos || null
    });

    res.status(201).json(newEvent);
  } catch (err) { 
    next(err); 
  }
}
```

---

### Étape 5 : Ajouter la méthode createEvent au EventRepository

Vérifie que `EventRepository.js` a bien cette méthode :

```javascript
async createEvent(eventData) {
    try {
        const eventId = uuidv4();

        const eventToCreate = {
            id: eventId,
            title: eventData.title.trim(),
            description: eventData.description?.trim(),
            category: eventData.category || 'autre',
            location: eventData.location?.trim(),
            event_date: eventData.event_date,
            price: eventData.price || 0,
            max_tickets: eventData.max_tickets || null,
            organizer_id: eventData.organizer_id,
            image_url: eventData.image_url || null,
            photos: eventData.photos ? JSON.stringify(eventData.photos) : null
        };

        await this.db
            .insert(this.table)
            .values(eventToCreate);

        return await this.findById(eventId);
    } catch (error) {
        throw new Error(`Erreur createEvent: ${error.message}`);
    }
}
```

---

### Étape 6 : Tester ton code

1. **Démarre le serveur** :
```bash
cd backend
npm run dev
```

2. **Teste avec Postman ou curl** :
```bash
# Récupérer un événement
curl http://localhost:5000/api/events/[ID_EVENEMENT]
```

3. **Vérifie les logs** — Tu ne dois plus voir de requêtes SQL directes dans les controllers.

---

## ✅ Checklist de validation

- [ ] Le fichier `repositories/index.js` est créé
- [ ] `InscriptionRepository.js` existe et fonctionne
- [ ] `getEvent` utilise `eventRepository.findById()`
- [ ] `createEvent` utilise `eventRepository.createEvent()`
- [ ] Le serveur démarre sans erreur
- [ ] Les endpoints `/api/events` fonctionnent

---

## 🎯 Exercice bonus

Modifie également ces fonctions pour utiliser les repositories :
- [ ] `listEvents` → Utiliser `eventRepository.findAllWithOrganizers()`
- [ ] `updateEvent` → Utiliser `eventRepository.updateEvent()`
- [ ] `deleteEvent` → Utiliser `eventRepository.delete()`
- [ ] `getOrganizerEvents` → Utiliser `eventRepository.findByOrganizer()`

---

## 📝 Ce que tu as appris

1. **Le pattern Repository** sépare l'accès aux données de la logique métier
2. **L'injection de dépendances** permet de passer les repositories aux controllers
3. **La centralisation** du SQL facilite la maintenance
4. **Le code devient testable** car on peut mocker les repositories

---

## ➡️ Étape suivante

Passe au [TP2 - Utiliser les Services](./TP2_SERVICES.md) pour ajouter une couche métier entre les controllers et les repositories.
