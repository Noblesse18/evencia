/**
 * POINT D'ENTRÉE CENTRAL POUR TOUS LES MODÈLES
 * 
 * Ce fichier regroupe tous les schémas pour faciliter les imports.
 * Au lieu d'importer depuis chaque fichier individuellement,
 * on peut tout importer depuis ici.
 */

// importer tous les schemas 

const { users } = require('./schemas/userSchema');
const { events } = require('./schemas/eventSchema');
const { inscriptions } = require('./schemas/inscriptionSchema');
const { payments } = require('./schemas/paymentSchema');

// exporter tout d'un coup 
module.exports = { 
    users,
    events,
    inscriptions,
    payments
}; 

// Maintenant, dans d'autres fichiers, on peut faire :
// const { users, events } = require('../models');
// Au lieu de :
// const { users } = require('../models/schemas/userSchema');
// const { events } = require('../models/schemas/eventSchema');