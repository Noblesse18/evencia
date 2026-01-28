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