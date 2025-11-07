// src/controllers/eventController.js
const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function listEvents(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT * FROM events ORDER BY event_date ASC');
    res.json(rows);
  } catch (err) { next(err); }
}

async function getEvent(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Événement introuvable' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function createEvent(req, res, next) {
  try {
    const { title, description, location, event_date, price, photos } = req.body;
    const organizer_id = req.user.userId;
    const newEventId = uuidv4();
    await pool.execute(
      'INSERT INTO events (id, title, description, location, event_date, price, organizer_id, photos) VALUES (?,?,?,?,?,?,?,?)',
      [newEventId, title, description, location, event_date || null, price || 0, organizer_id, photos ? JSON.stringify(photos) : null]
    );
    const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [newEventId]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

async function updateEvent(req, res, next) {
  try {
    const { id } = req.params;
    const fields = req.body;
    const set = [];
    const values = [];
    for (const key in fields) {
      set.push(`${key} = ?`);
      values.push(fields[key]);
    }
    if (!set.length) return res.status(400).json({ message: 'Pas de champs à mettre à jour' });
    values.push(id);
    await pool.execute(`UPDATE events SET ${set.join(', ')} WHERE id = ?`, values);
    const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function deleteEvent(req, res, next) {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM events WHERE id = ?', [id]);
    res.json({ message: 'Événement supprimé' });
  } catch (err) { next(err); }
}

module.exports = { listEvents, getEvent, createEvent, updateEvent, deleteEvent };