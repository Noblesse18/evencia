const { mysqlTable, varchar, mysqlEnum, timestamp, unique } = require('drizzle-orm/mysql-core');
const { users } = require('./userSchema');
const { event } = require('./eventSchema');

/**
 * SCHÉMA DE LA TABLE INSCRIPTIONS
 * 
 * Table de liaison entre users et event
 * Un utilisateur peut s'inscrire à plusieurs événements
 * Un événement peut avoir plusieurs participants
 */

const inscriptions = mysqlTable('inscriptions', {
    id: varchar('id', { length: 36 }).primaryKey(),

    // relations : liens vers users et event 
    user_id: varchar('user_id', {length: 36 }) 
    .references(() => users.id) // Clé étrangère : Cette colonne fait référence à une autre table
    .notNull(), 

    event_id: varchar('event_id', {length: 36})
    .references(() => event_id)
    .notNull(), 

    // status de l'inscription
    status: mysqlEnum('status', [
        'pending',      //En attente de paiement 
        'confirmed',    // inscription confirmer 
        'cancelled',    // inscription annulee
    ]).default('pending'), 

    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),

}, (table) => {
    // CONTRAINTE UNIQUE COMPOSEE 
    // Un utilisateur ne peut s'incrire qu'une fois a un evenement 
    return {
        uniqueUserEvent: unique().on(table.user_id, table.event_id),
    }

});

module.exports = { inscriptions }; 