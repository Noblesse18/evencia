const { mysqlTable, varchar, text, decimal, timestamp, json, int } = require('drizzle-orm/mysql-core');

const { users } = require('./userSchema'); // Import le fichier userSchema pour la relation

const events = mysqlTable('events', {
    // Identifiant unique de l'evenement 
    id: varchar('id', {length: 36 }).primaryKey(),

    // Informations princiaples 
    title: varchar('title', {length: 255}).notNull(),
    description: text('description'), // text pour les longs textes
    category: varchar('category', {length: 100}).default('autre'), // Catégorie de l'événement
    location: varchar('location', {length: 500 }), 
    
    //date de l'evement (peut etre NULL)
    event_date: timestamp('event_date'),

    // Prix avec 2 decimales (10 chiffres max dont 2 apres la virgule)
    price: decimal('price', { precision: 10, scale: 2 }).default(0),
    
    // Nombre maximum de tickets disponibles
    max_tickets: int('max_tickets'),
    
    // relation : lien vers la table users 
    // chaque evenement a un organisateuer (user)
    organizer_id: varchar('organizer_id', {length: 36}).references(() => users.id).notNull(), // <- cle etrangere vers users.id.notNull(),

    // photo stockee en JSON
    // Exemple : ["url1.jpg", "url2.jpg"] ou [{url: "...", caption: "..."}],
    photos: json('photos'),
    
    // URL de l'image principale
    image_url: varchar('image_url', {length: 500}),

    // Dates de creation et modification
    createdAt: timestamp('createdAt').defaultNow(),
    updateAt: timestamp('updatedAt').defaultNow().onUpdateNow(),
    
});

module.exports = { events };
