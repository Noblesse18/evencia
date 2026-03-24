// src/config/db.js
const mysql = require('mysql2/promise');
const { drizzle } = require('drizzle-orm/mysql2');
require('dotenv').config();

const sslConfig = process.env.DB_CA_CERT
  ? { ssl: { ca: process.env.DB_CA_CERT.replace(/\\n/g, '\n'), rejectUnauthorized: true } }
  : {};

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'evencianew',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  ...sslConfig,
});

const db = drizzle(pool);

module.exports = { pool, db };
