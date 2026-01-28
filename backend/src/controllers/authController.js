// src/controllers/authController.js
const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const JWT_EXPIRES_IN = '7d';

async function register(req, res, next) {
  try {
    const { name, email, password, role = 'participant' } = req.body;
    
    
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
      'INSERT INTO users (id, name, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, NOW())',
      [newUserId, name, email, password_hash, role]
    );

    // Récupération de l'utilisateur créé
    const [users] = await pool.execute(
      'SELECT id, name, email, role, createdAt as created_at FROM users WHERE id = ?',
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

    const responseUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'participant',
      created_at: user.createdAt
    };
    
    console.log('🔐 Login response:', { email: user.email, role: user.role, responseRole: responseUser.role });
    
    res.json({
      user: responseUser,
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
      'SELECT id, name, email, role, createdAt as created_at FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }

    const user = users[0];

    req.user = {
      userId: decoded.userId,
      role: user.role
    };

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      },
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

async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;
    const { userId } = req.user; // recuperer par authenticateToken

    // 1. recuperer l'utilisateur en base 
    const [users] = await pool.execute(
      'SELECT id, password FROM users WHERE id = ?',
      [userId]
    );
    if (users.length === 0){
      return res.status(404).json({ message: 'utilisateur non trouve' });
    }
    const user = users[0];

    // 2 verifier l'ancien mot de passe 
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid){
      return res.status(401).json({ message: 'Mot de passe actuel incorrect'});
    }


    // 3. Hasher et mettre a jour le mot de passe 
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE users SET password = ?, updatedAt = NOW() WHERE id = ?',
      [newPasswordHash, userId]
    ); 

    // 4. Reponse reussie
    res.json({
      message: 'Mot de passe change avec succes. Veuillez vous reconnecter.',
    });
  } catch (err) {
    console.error('Erreur changePassword:', err);
    next(err);
  }
}

// 1. Demande de réinitialisation (envoi du token par email)
async function requestPasswordReset(req, res, next) {
  try {
    const { email } = req.body;

    // Vérifier l'utilisateur
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (users.length === 0) {
      return res.json({ message: "Si l'email existe, un lien a été envoyé." });
    }

    // Générer un token (valide 1h)
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1h

    // Sauvegarder en base
    await pool.execute(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [token, expires, users[0].id]
    );

    // [À IMPLEMENTER] Envoyer l'email avec le lien:
    // ${process.env.FRONTEND_URL}/reset-password?token=${token}
    console.log(`[DEV] Token généré: ${token} (lien: /reset-password?token=${token})`);

    res.json({ message: "Si l'email existe, un lien a été envoyé." });
  } catch (err) {
    next(err);
  }
}

// 2. Réinitialisation effective (avec token + nouveau mot de passe)
async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;

    // Vérifier le token
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );
    if (users.length === 0) {
      return res.status(400).json({ message: "Token invalide ou expiré." });
    }

    // Hasher et mettre à jour le mot de passe
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hash, users[0].id]
    );

    res.json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, changePassword, resetPassword, requestPasswordReset , verifyToken };