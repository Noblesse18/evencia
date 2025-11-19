const { mysqlTable, varchar, text, decimal, timestamp, json } = require('drizzle-orm/mysql-core');

const { users } = require('./userSchema'); // Import le fichier userSchema pour la relation

const events = mysqlTable('event', {
    // Identifiant unique de l'evenement 
    id: varchar('id', {length: 36 }).primaryKey(),

    // Informations princiaples 
    title: varchar('title', {length: 255}).notNull(),
    description: text('description'), // text pour les longs textes
    location: varchar('location', {length: 500 }), 
    
    //date de l'evement (peut etre NULL)
    event_date: timestamp('event_date'),

    // Prix avec 2 decimales (10 chiffres max dont 2 apres la virgule)
    price: decimal('price', { precision: 10, scale: 2 }).default(0),
    
    // relation : lien vers la table users 
    // chaque evenement a un organisateuer (user)
    organizer_id: varchar('organizer_id', {length: 36}).references(() => users.id).notNull(), // <- cle etrangere vers users.id.notNull(),

    // photo stockee en JSON
    // Exemple : ["url1.jpg", "url2.jpg"] ou [{url: "...", caption: "..."}],
    photos: json('photos'), 

    // Dates de creation et modification
    createdAt: timestamp('createdAt').defaultNow(),
    updateAt: timestamp('updatedAt').defaultNow().onUpdateNow(),
    
});

module.exports = { events };
