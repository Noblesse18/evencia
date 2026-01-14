// src/controllers/inscriptionController.js
const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function createInscription(req, res, next) {
  try {
    const { event_id } = req.body;
    const user_id = req.user.userId;
    if (!event_id) return res.status(400).json({ message: 'event_id requis' });

    // Vérifier que l'événement existe
    const [evRows] = await pool.execute('SELECT id, max_tickets FROM events WHERE id = ?', [event_id]);
    if (!evRows.length) return res.status(404).json({ message: 'Événement introuvable' });

    // Vérifier s'il reste des places
    const event = evRows[0];
    if (event.max_tickets) {
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as count FROM inscriptions WHERE event_id = ? AND status = "confirmed"',
        [event_id]
      );
      if (countResult[0].count >= event.max_tickets) {
        return res.status(400).json({ message: 'Plus de places disponibles' });
      }
    }

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

// Obtenir l'historique des inscriptions de l'utilisateur connecté
async function getMyInscriptions(req, res, next) {
  try {
    const user_id = req.user.userId;
    
    const [rows] = await pool.execute(`
      SELECT i.*, 
        e.title as event_title, 
        e.description as event_description,
        e.location as event_location,
        e.event_date,
        e.price as event_price,
        e.category as event_category,
        e.image_url as event_image_url
      FROM inscriptions i
      JOIN events e ON i.event_id = e.id
      WHERE i.user_id = ?
      ORDER BY i.createdAt DESC
    `, [user_id]);
    
    res.json(rows);
  } catch (err) { next(err); }
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

module.exports = { createInscription, cancelInscription, getMyInscriptions };