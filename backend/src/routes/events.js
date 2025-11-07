const express = require('express');
const router = express.Router();
const { listEvents, getEvent, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', listEvents);
router.get('/:id', getEvent);
router.post('/', authenticateToken, authorizeRoles('organizer','admin'), createEvent);
router.put('/:id', authenticateToken, authorizeRoles('organizer','admin'), updateEvent);
router.delete('/:id', authenticateToken, authorizeRoles('organizer','admin'), deleteEvent);

module.exports = router;
