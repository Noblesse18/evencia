require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const TEST_PASSWORD = 'Evencia2026!';

const TEST_USERS = [
  { id: 'a0000000-0000-0000-0000-000000000001', name: 'Administrateur Evencia', email: 'admin@evencia.fr', role: 'admin' },
  { id: 'b0000000-0000-0000-0000-000000000002', name: 'Marie Dupont', email: 'organisateur@evencia.fr', role: 'organizer' },
  { id: 'c0000000-0000-0000-0000-000000000003', name: 'Lucas Martin', email: 'participant@evencia.fr', role: 'participant' },
];

const TEST_EVENTS = [
  { id: 'e0000000-0000-0000-0000-000000000001', title: 'Festival de Musique Électro 2026', description: 'Un festival en plein air avec les meilleurs DJ.', category: 'musique', location: 'Parc de la Villette, Paris', event_date: '2026-07-15 18:00:00', price: 45.00, max_tickets: 500, image_url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800' },
  { id: 'e0000000-0000-0000-0000-000000000002', title: 'Marathon de Paris 2026', description: 'Le marathon annuel de Paris, 42.195 km.', category: 'sport', location: 'Champs-Élysées, Paris', event_date: '2026-10-12 08:00:00', price: 35.00, max_tickets: 1000, image_url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800' },
  { id: 'e0000000-0000-0000-0000-000000000003', title: 'Conférence Tech & IA 2026', description: 'Conférences sur l\'IA et le cloud computing.', category: 'conference', location: 'Station F, Paris', event_date: '2026-06-20 09:00:00', price: 0.00, max_tickets: 200, image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800' },
  { id: 'e0000000-0000-0000-0000-000000000004', title: 'Exposition Art Contemporain', description: '30 artistes contemporains émergents.', category: 'culture', location: 'Grand Palais, Paris', event_date: '2026-09-05 10:00:00', price: 15.00, max_tickets: 300, image_url: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800' },
  { id: 'e0000000-0000-0000-0000-000000000005', title: 'Atelier Cuisine Japonaise', description: 'Sushis, makis et ramen avec un chef japonais.', category: 'atelier', location: 'L\'Atelier des Chefs, Lyon', event_date: '2026-08-22 14:00:00', price: 55.00, max_tickets: 20, image_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800' },
];

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'evencianew',
  });

  const hash = await bcrypt.hash(TEST_PASSWORD, 10);

  for (const u of TEST_USERS) {
    await conn.execute(
      `INSERT IGNORE INTO users (id, name, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, NOW())`,
      [u.id, u.name, u.email, hash, u.role]
    );
    console.log(`  ✔ ${u.role.padEnd(12)} ${u.email}`);
  }

  const organizerId = TEST_USERS[1].id;
  for (const e of TEST_EVENTS) {
    await conn.execute(
      `INSERT IGNORE INTO events (id, title, description, category, location, event_date, price, max_tickets, organizer_id, image_url, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [e.id, e.title, e.description, e.category, e.location, e.event_date, e.price, e.max_tickets, organizerId, e.image_url]
    );
  }
  console.log(`  ✔ ${TEST_EVENTS.length} événements créés`);

  const participantId = TEST_USERS[2].id;
  await conn.execute(
    `INSERT IGNORE INTO inscriptions (id, user_id, event_id, status, createdAt, updatedAt) VALUES (?, ?, ?, 'confirmed', NOW(), NOW())`,
    [uuidv4(), participantId, TEST_EVENTS[2].id]
  );
  await conn.execute(
    `INSERT IGNORE INTO inscriptions (id, user_id, event_id, status, createdAt, updatedAt) VALUES (?, ?, ?, 'confirmed', NOW(), NOW())`,
    [uuidv4(), participantId, TEST_EVENTS[0].id]
  );
  console.log('  ✔ 2 inscriptions créées');

  await conn.execute(
    `INSERT IGNORE INTO payments (id, user_id, event_id, amount, status, payment_method, card_last4, card_brand, createdAt, updatedAt) VALUES (?, ?, ?, 45.00, 'succeeded', 'card', '4242', 'visa', NOW(), NOW())`,
    [uuidv4(), participantId, TEST_EVENTS[0].id]
  );
  console.log('  ✔ 1 paiement créé');

  console.log('\n✅ Seed terminé. Identifiants de test :');
  console.log('  Admin       : admin@evencia.fr        / Evencia2026!');
  console.log('  Organisateur: organisateur@evencia.fr  / Evencia2026!');
  console.log('  Participant : participant@evencia.fr   / Evencia2026!');

  await conn.end();
}

seed().catch(e => { console.error('❌ Erreur seed:', e); process.exit(1); });
