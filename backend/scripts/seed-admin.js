// scripts/seed-admin.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'event_app'
  });

  const password_hash = await bcrypt.hash('admin123', 10);
  await conn.execute(
    'INSERT IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Admin', 'admin@example.com', password_hash, 'admin']
  );
  console.log('Admin seeded (email: admin@example.com / password: admin123)');
  await conn.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
