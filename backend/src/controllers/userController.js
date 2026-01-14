// src/controllers/userController.js
const { pool } = require('../config/db');

async function getAllUsers(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT id, name, email, role, createdAt as created_at FROM users ORDER BY id');
    res.json(rows);
  } catch (err) { next(err); }
}

async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT id, name, email, role, createdAt as created_at FROM users WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// Obtenir le profil de l'utilisateur connecté
async function getMyProfile(req, res, next) {
  try {
    const userId = req.user.userId;
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, createdAt as created_at FROM users WHERE id = ?',
      [userId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// Modifier le profil de l'utilisateur connecté
async function updateMyProfile(req, res, next) {
  try {
    const userId = req.user.userId;
    const { name, email } = req.body;
    
    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email) {
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
    }
    
    // Construire la requête de mise à jour
    const updates = [];
    const values = [];
    
    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'Aucune modification fournie' });
    }
    
    values.push(userId);
    await pool.execute(
      `UPDATE users SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`,
      values
    );
    
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, createdAt as created_at FROM users WHERE id = ?',
      [userId]
    );
    
    res.json(rows[0]);
  } catch (err) { next(err); }
}

module.exports = { getAllUsers, getUserById, getMyProfile, updateMyProfile };