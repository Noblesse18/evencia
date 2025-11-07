// src/controllers/inscriptionController.js
const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function createInscription(req, res, next) {
  try {
    const { event_id } = req.body;
    const user_id = req.user.userId;
    if (!event_id) return res.status(400).json({ message: 'event_id requis' });

    const [evRows] = await pool.execute('SELECT id FROM events WHERE id = ?', [event_id]);
    if (!evRows.length) return res.status(404).json({ message: 'Événement introuvable' });

    const newInscriptionId = uuidv4();
    await pool.execute(
      'INSERT INTO inscriptions (id, user_id, event_id, status) VALUES (?,?,?,?)',
      [newInscriptionId, user_id, event_id, 'confirmed']
    );
    const [rows] = await pool.execute('SELECT * FROM inscriptions WHERE id = ?', [newInscriptionId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err && err.errno === 1062) return res.status(400).json({ message: 'Déjà inscrit' });
    next(err);
  }
}

async function cancelInscription(req, res, next) {
  try {
    const { id } = req.params;
    const user_id = req.user.userId;
    const [rows] = await pool.execute('SELECT * FROM inscriptions WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Inscription introuvable' });
    const ins = rows[0];
    if (ins.user_id !== user_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    await pool.execute('DELETE FROM inscriptions WHERE id = ?', [id]);
    res.json({ message: 'Inscription annulée' });
  } catch (err) { next(err); }
}

module.exports = { createInscription, cancelInscription };