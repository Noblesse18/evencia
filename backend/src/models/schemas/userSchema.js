const { mysqlTable, varchar, timestamp, mysqlEnum} = require ('drizzle-orm/mysql-core');

const users = mysqlTable('users', {
    // COLONNE: id
    // Type: VARCHAR(36) - Pour stocker des UUID
    // Contrainte: PRIMARY KEY (clé primaire)
    id: varchar('id', { length: 36 }).primaryKey(),
    
    // COLONNE: name
    // Type: VARCHAR(255) - Texte limité à 255 caractères
    // Contrainte: NOT NULL (obligatoire)
    name: varchar('name', { length: 255 }).notNull(),
    
    // COLONNE: email
    // Type: VARCHAR(255)
    // Contraintes: NOT NULL + UNIQUE (obligatoire et unique)
    email: varchar('email', { length: 255 }).notNull().unique(),
    
    // COLONNE: password
    // Type: VARCHAR(255) - Pour stocker le hash bcrypt
    // Contrainte: NOT NULL
    password: varchar('password', { length: 255 }).notNull(),
    
    // COLONNE: role
    // Type: ENUM - Valeurs limitées à cette liste
    // Valeur par défaut: 'participant'
    role: mysqlEnum('role', ['participant', 'organizer', 'admin'])
      .default('participant'),
    
    // COLONNE: createdAt
    // Type: TIMESTAMP
    // Valeur par défaut: Date/heure actuelle
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    
    // COLONNE: updatedAt
    // Type: TIMESTAMP
    // Se met à jour automatiquement à chaque modification
    updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow(),
    lastLogin: timestamp('last_login', {mode: 'date'}).default(null),
  });
  
  // Exporter le schéma pour l'utiliser ailleurs
module.exports = { users };

  
 