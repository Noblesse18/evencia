// src/controllers/userController.js
const { pool } = require('../config/db');

async function getAllUsers(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT id, name, email, createdAt as created_at FROM users ORDER BY id');
    res.json(rows);
  } catch (err) { next(err); }
}

async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT id, name, email, createdAt as created_at FROM users WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

module.exports = { getAllUsers, getUserById };