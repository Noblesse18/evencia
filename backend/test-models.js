// test-models.js
const models = require('./src/models');

console.log('Modèles disponibles :', Object.keys(models));
// Devrait afficher : ['users', 'events', 'inscriptions', 'payments']

console.log('Structure user :', models.users);
// Devrait afficher la structure de la table