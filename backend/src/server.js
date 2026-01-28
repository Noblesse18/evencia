// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./config/db');
const rateLimit = require('express-rate-limit'); 
const authRoutes = require('./services/routes/auth');
const userRoutes = require('./services/routes/users');
const eventRoutes = require('./services/routes/events');
const inscriptionRoutes = require('./services/routes/inscriptions');
const paymentRoutes = require('./services/routes/payments');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    // liste des origines autorisees depuis .env
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map(o => o.trim());

    // Autoriser les requetes sans origin (Postman, curl, etc.) en dev uniquement
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Non autoriser par CORS'));
    }
  },
  Credentials: true, // Autoriser les cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorizations'],
};

const PORT = process.env.PORT || 5000;

// Rate limiter global - 100 requetes par minute par IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requetes max
  message: {
    message: 'Trop de requetes, veuillez reessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Appliquer le rate limiter global
app.use(globalLimiter);

// Appliquer le rate limiter strict au routes d'auth
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/inscriptions', inscriptionRoutes);
app.use('/api/payments', paymentRoutes);

app.use(errorHandler);




app.listen(PORT, async () => {
  console.log(`Server started on port ${PORT}`);
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('Connected to MySQL');
  } catch (err) {
    console.error('MySQL connection error:', err.message);
  }
});