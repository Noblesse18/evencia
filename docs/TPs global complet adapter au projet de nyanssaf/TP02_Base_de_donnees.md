# TP02 - Base de Données MySQL + Sequelize

## 🎯 Objectifs

- Comprendre le modèle relationnel de la base de données
- Configurer Sequelize (ORM) pour MySQL
- Créer les modèles de données avec leurs associations
- Implémenter des méthodes métier sur les modèles

**Durée estimée :** 2 heures

---

## 📋 Prérequis

- TP01 terminé
- MySQL installé et accessible
- Une base de données créée

---

## Étape 1 : Préparer MySQL

### 1.1 Créer la base de données

Connectez-vous à MySQL :

```bash
mysql -u root -p
```

Puis exécutez :

```sql
-- Créer la base de données
CREATE DATABASE IF NOT EXISTS onelastevent_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Créer un utilisateur dédié (bonne pratique)
CREATE USER IF NOT EXISTS 'onevent_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';

-- Donner les droits
GRANT ALL PRIVILEGES ON onelastevent_db.* TO 'onevent_user'@'localhost';
FLUSH PRIVILEGES;

-- Vérifier
SHOW DATABASES;
```

### 1.2 Mettre à jour le fichier .env

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=onevent_user
DB_PASS=votre_mot_de_passe
DB_NAME=onelastevent_db
```

---

## Étape 2 : Comprendre le Schéma de Données

### 2.1 Diagramme Entité-Relation

```
┌─────────────┐       ┌─────────────┐       ┌──────────────┐
│    USERS    │       │   EVENTS    │       │ INSCRIPTIONS │
├─────────────┤       ├─────────────┤       ├──────────────┤
│ PK id       │       │ PK id       │       │ PK id        │
│    email    │───1:N─│ FK organizer│       │ FK event_id  │
│    password │       │    title    │───1:N─│ FK user_id   │
│    role     │       │    price    │       │    status    │
│    ...      │       │    status   │       │    ...       │
└─────────────┘       └─────────────┘       └──────────────┘
       │                     │                     │
       │                     │                     │
       │                     │ 1:N                 │ 1:1
       │                     ▼                     ▼
       │              ┌─────────────┐       ┌─────────────┐
       └──────────────│  PAYMENTS   │───────│             │
              1:N     ├─────────────┤       └─────────────┘
                      │ PK id       │
                      │ FK user_id  │
                      │ FK event_id │
                      │    amount   │
                      │    status   │
                      └─────────────┘
```

### 2.2 Relations

| Relation | Type | Description |
|----------|------|-------------|
| User → Events | 1:N | Un utilisateur organise plusieurs événements |
| User → Inscriptions | 1:N | Un utilisateur a plusieurs inscriptions |
| Event → Inscriptions | 1:N | Un événement a plusieurs inscriptions |
| Inscription → Payment | 1:1 | Une inscription peut avoir un paiement |

---

## Étape 3 : Configurer Sequelize

### 3.1 Créer src/config/db.js

```javascript
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Configuration de Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || 'onelastevent_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',
    // Afficher les requêtes SQL en développement uniquement
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    // Configuration du pool de connexions
    pool: {
      max: 10,      // Maximum de connexions
      min: 0,       // Minimum de connexions
      acquire: 30000, // Temps max pour acquérir une connexion
      idle: 10000,    // Temps avant de libérer une connexion inactive
    },
    // Convention de nommage snake_case
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

/**
 * Tester la connexion à la base de données
 * @returns {Promise<boolean>}
 */
export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    return false;
  }
}

/**
 * Synchroniser les modèles avec la base de données
 * @param {Object} options - Options de synchronisation
 */
export async function syncDatabase(options = {}) {
  try {
    await sequelize.sync(options);
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
    throw error;
  }
}

export default sequelize;
```

> 💡 **Explication** :
> - `pool` : Gère un pool de connexions pour de meilleures performances
> - `underscored: true` : Convertit automatiquement `createdAt` en `created_at`

---

## Étape 4 : Créer les Modèles

### 4.1 Modèle User (src/models/User.js)

```javascript
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class User extends Model {
  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   * @param {string} role - Rôle à vérifier
   * @returns {boolean}
   */
  hasRole(role) {
    return this.role === role;
  }

  /**
   * Vérifier si l'utilisateur est admin
   * @returns {boolean}
   */
  isAdmin() {
    return this.role === 'ADMIN';
  }

  /**
   * Vérifier si l'utilisateur est organisateur
   * @returns {boolean}
   */
  isOrganizer() {
    return this.role === 'ORGANIZER' || this.role === 'ADMIN';
  }

  /**
   * Retourner les données publiques (sans mot de passe)
   * @returns {Object}
   */
  toPublicJSON() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.full_name,
      role: this.role,
      bio: this.bio,
      avatarUrl: this.avatar_url,
      isVerified: this.is_verified,
      createdAt: this.created_at,
    };
  }
}

// Définition du schéma
User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('USER', 'ORGANIZER', 'ADMIN'),
      defaultValue: 'USER',
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    reset_password_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    // Index pour optimiser les recherches
    indexes: [
      { fields: ['email'], unique: true },
      { fields: ['role'] },
      { fields: ['is_verified'] },
    ],
  }
);

export default User;
```

### 4.2 Modèle Event (src/models/Event.js)

```javascript
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Event extends Model {
  /**
   * Vérifier si l'événement est gratuit
   */
  isFree() {
    return parseFloat(this.price) === 0;
  }

  /**
   * Vérifier s'il reste de la place
   */
  hasCapacity() {
    return this.current_participants < this.capacity;
  }

  /**
   * Vérifier si l'événement est publié
   */
  isPublished() {
    return this.status === 'PUBLISHED';
  }

  /**
   * Obtenir le nombre de places restantes
   */
  getRemainingSpots() {
    return Math.max(0, this.capacity - this.current_participants);
  }

  /**
   * Convertir en JSON public
   */
  toPublicJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      location: this.location,
      startDatetime: this.start_datetime,
      endDatetime: this.end_datetime,
      capacity: this.capacity,
      currentParticipants: this.current_participants,
      remainingSpots: this.getRemainingSpots(),
      price: this.price,
      currency: this.currency,
      status: this.status,
      imageUrl: this.image_url,
      organizerId: this.organizer_id,
      createdAt: this.created_at,
      updatedAt: this.updated_at,
    };
  }
}

Event.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    organizer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    start_datetime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_datetime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: 1,
      },
    },
    current_participants: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'EUR',
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'PUBLISHED', 'CANCELLED'),
      defaultValue: 'DRAFT',
      allowNull: false,
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'Event',
    tableName: 'events',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['organizer_id'] },
      { fields: ['status'] },
      { fields: ['start_datetime'] },
      { fields: ['price'] },
    ],
  }
);

export default Event;
```

### 4.3 Modèle Inscription (src/models/Inscription.js)

```javascript
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Inscription extends Model {
  isConfirmed() {
    return this.status === 'CONFIRMED';
  }

  isPending() {
    return this.status === 'PENDING';
  }

  toPublicJSON() {
    return {
      id: this.id,
      eventId: this.event_id,
      userId: this.user_id,
      status: this.status,
      notes: this.notes,
      createdAt: this.created_at,
    };
  }
}

Inscription.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    event_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'CANCELLED'),
      defaultValue: 'PENDING',
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Inscription',
    tableName: 'inscriptions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['event_id'] },
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['event_id', 'user_id'], unique: true },
    ],
  }
);

export default Inscription;
```

### 4.4 Modèle Payment (src/models/Payment.js)

```javascript
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Payment extends Model {
  isPaid() {
    return this.status === 'PAID';
  }

  toPublicJSON() {
    return {
      id: this.id,
      userId: this.user_id,
      eventId: this.event_id,
      inscriptionId: this.inscription_id,
      amount: this.amount,
      currency: this.currency,
      provider: this.provider,
      status: this.status,
      createdAt: this.created_at,
    };
  }
}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    event_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id',
      },
    },
    inscription_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'inscriptions',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'EUR',
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'stripe',
    },
    provider_payment_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED'),
      defaultValue: 'PENDING',
      allowNull: false,
    },
    refunded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['event_id'] },
      { fields: ['inscription_id'] },
      { fields: ['status'] },
    ],
  }
);

export default Payment;
```

### 4.5 Modèle RefreshToken (src/models/RefreshToken.js)

```javascript
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class RefreshToken extends Model {
  isValid() {
    return !this.revoked && new Date(this.expires_at) > new Date();
  }
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['token_hash'] },
      { fields: ['expires_at'] },
    ],
  }
);

export default RefreshToken;
```

---

## Étape 5 : Définir les Associations

### 5.1 Créer src/models/index.js

```javascript
import sequelize from '../config/db.js';
import User from './User.js';
import Event from './Event.js';
import Inscription from './Inscription.js';
import Payment from './Payment.js';
import RefreshToken from './RefreshToken.js';

// ========================================
// DÉFINITION DES ASSOCIATIONS
// ========================================

// User → Events (Un utilisateur organise plusieurs événements)
User.hasMany(Event, {
  foreignKey: 'organizer_id',
  as: 'organizedEvents',
});
Event.belongsTo(User, {
  foreignKey: 'organizer_id',
  as: 'organizer',
});

// User → Inscriptions
User.hasMany(Inscription, {
  foreignKey: 'user_id',
  as: 'inscriptions',
});
Inscription.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Event → Inscriptions
Event.hasMany(Inscription, {
  foreignKey: 'event_id',
  as: 'inscriptions',
});
Inscription.belongsTo(Event, {
  foreignKey: 'event_id',
  as: 'event',
});

// User → Payments
User.hasMany(Payment, {
  foreignKey: 'user_id',
  as: 'payments',
});
Payment.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Event → Payments
Event.hasMany(Payment, {
  foreignKey: 'event_id',
  as: 'payments',
});
Payment.belongsTo(Event, {
  foreignKey: 'event_id',
  as: 'event',
});

// Inscription → Payment (One-to-One)
Inscription.hasOne(Payment, {
  foreignKey: 'inscription_id',
  as: 'payment',
});
Payment.belongsTo(Inscription, {
  foreignKey: 'inscription_id',
  as: 'inscription',
});

// User → RefreshTokens
User.hasMany(RefreshToken, {
  foreignKey: 'user_id',
  as: 'refreshTokens',
  onDelete: 'CASCADE',
});
RefreshToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Many-to-Many : User participe à Events via Inscriptions
User.belongsToMany(Event, {
  through: Inscription,
  foreignKey: 'user_id',
  otherKey: 'event_id',
  as: 'participatingEvents',
});
Event.belongsToMany(User, {
  through: Inscription,
  foreignKey: 'event_id',
  otherKey: 'user_id',
  as: 'participants',
});

// Export
export {
  sequelize,
  User,
  Event,
  Inscription,
  Payment,
  RefreshToken,
};

export default {
  sequelize,
  User,
  Event,
  Inscription,
  Payment,
  RefreshToken,
};
```

---

## Étape 6 : Tester la connexion

### 6.1 Modifier src/server.js

```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Import de la configuration DB
import { testConnection, syncDatabase } from './config/db.js';

// Import des modèles pour initialiser les associations
import './models/index.js';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Démarrer le serveur
const PORT = parseInt(process.env.PORT, 10) || 4000;

async function startServer() {
  try {
    // Tester la connexion à la base de données
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Synchroniser les modèles
    // En développement : { alter: true } modifie les tables existantes
    // En production : utiliser les migrations
    await syncDatabase({ alter: process.env.NODE_ENV === 'development' });

    // Démarrer le serveur HTTP
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
```

### 6.2 Lancer le serveur

```bash
npm run dev
```

Vous devriez voir :

```
✅ Database connection established successfully.
✅ Database synchronized successfully.
🚀 Server running on http://localhost:4000
```

---

## ✅ Checklist de validation

- [ ] MySQL est accessible avec vos identifiants
- [ ] Les 5 modèles sont créés dans `src/models/`
- [ ] Le fichier `src/models/index.js` définit les associations
- [ ] Le serveur démarre et se connecte à la base de données
- [ ] Les tables sont créées automatiquement (vérifiez dans MySQL)

**Pour vérifier les tables créées :**

```sql
USE onelastevent_db;
SHOW TABLES;
DESCRIBE users;
DESCRIBE events;
```

---

## 📝 Points Clés à Retenir

1. **ORM** : Sequelize abstrait les requêtes SQL et gère les relations
2. **UUID** : Utiliser des UUID plutôt que des auto-increment pour les ID
3. **Méthodes métier** : Ajoutez des méthodes utiles directement sur les modèles (`toPublicJSON()`)
4. **Associations** : Les définir dans un fichier centralisé (`models/index.js`)
5. **Index** : Optimisent les performances des requêtes

---

## 🔗 Prochaine étape

Continuez avec le [TP03 - Architecture MVC + Repository](./TP03_Architecture_Backend.md)
