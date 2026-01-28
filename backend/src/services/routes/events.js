const express = require('express');
const router = express.Router();
const { listEvents, getEvent, createEvent, updateEvent, deleteEvent, getCategories, getOrganizerEvents } = require('../../controllers/eventController');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');

// Routes publiques (statiques d'abord)
router.get('/categories', getCategories);

// Routes pour les organisateurs (avant les routes avec paramètres)
router.get('/organizer/my-events', authenticateToken, authorizeRoles('organizer','admin'), getOrganizerEvents);

// Routes publiques avec paramètres
router.get('/', listEvents);
router.get('/:id', getEvent);

// Routes protégées
router.post('/', authenticateToken, authorizeRoles('organizer','admin'), createEvent);
router.put('/:id', authenticateToken, authorizeRoles('organizer','admin'), updateEvent);
router.delete('/:id', authenticateToken, authorizeRoles('organizer','admin'), deleteEvent);

module.exports = router;
