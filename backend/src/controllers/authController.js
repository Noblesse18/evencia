// src/controllers/authController.js
const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_EXPIRES_IN = '7d';

async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    
    // Validation des champs requis
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Champs manquants: nom, email et mot de passe requis' });
    }

    // Vérification si l'email existe déjà
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?', 
      [email]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    // Hash du mot de passe
    const password_hash = await bcrypt.hash(password, 10);
    
    // Génération d'un UUID et insertion du nouvel utilisateur
    const newUserId = uuidv4();
    await pool.execute(
      'INSERT INTO users (id, name, email, password, createdAt) VALUES (?, ?, ?, ?, NOW())',
      [newUserId, name, email, password_hash]
    );

    // Récupération de l'utilisateur créé
    const [users] = await pool.execute(
      'SELECT id, name, email, createdAt as created_at FROM users WHERE id = ?',
      [newUserId]
    );

    if (users.length === 0) {
      return res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
    }

    const user = users[0];

    // Génération du token JWT avec le rôle réel
    const token = jwt.sign(
      { userId: user.id, role: user.role || 'participant' }, 
      process.env.JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'participant',
        created_at: user.created_at
      },
      token
    });

  } catch (err) {
    console.error('Erreur register:', err);
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    
    // Validation des champs requis
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    // Recherche de l'utilisateur
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const user = users[0];

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    // Génération du token JWT avec le rôle réel
    const token = jwt.sign(
      { userId: user.id, role: user.role || 'participant' },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'participant',
        created_at: user.createdAt
      },
      token
    });

  } catch (err) {
    console.error('Erreur login:', err);
    next(err);
  }
}

// Fonction optionnelle pour vérifier le token
async function verifyToken(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que l'utilisateur existe toujours
    const [users] = await pool.execute(
      'SELECT id, name, email, createdAt as created_at FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    res.json({
      user: users[0],
      valid: true
    });

  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré' });
    }
    next(err);
  }
}

module.exports = { register, login, verifyToken };