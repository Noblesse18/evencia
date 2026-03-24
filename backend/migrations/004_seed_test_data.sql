-- Jeu de données de test pour Evencia
-- Mot de passe commun : Evencia2026!
-- Hash bcrypt (10 rounds) : $2b$10$KaVvG3xvqLbOShSNkQDweeNJfIlfPXDSD0P1J9YqTK2LvCffAYMly

USE evencianew;

-- ============================================
-- UTILISATEURS (3 rôles)
-- ============================================

INSERT IGNORE INTO users (id, name, email, password, role, createdAt) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Administrateur Evencia', 'admin@evencia.fr',
   '$2b$10$KaVvG3xvqLbOShSNkQDweeNJfIlfPXDSD0P1J9YqTK2LvCffAYMly', 'admin', NOW()),
  ('b0000000-0000-0000-0000-000000000002', 'Marie Dupont', 'organisateur@evencia.fr',
   '$2b$10$KaVvG3xvqLbOShSNkQDweeNJfIlfPXDSD0P1J9YqTK2LvCffAYMly', 'organizer', NOW()),
  ('c0000000-0000-0000-0000-000000000003', 'Lucas Martin', 'participant@evencia.fr',
   '$2b$10$KaVvG3xvqLbOShSNkQDweeNJfIlfPXDSD0P1J9YqTK2LvCffAYMly', 'participant', NOW());

-- ============================================
-- ÉVÉNEMENTS (5 événements variés, dates futures)
-- ============================================

INSERT IGNORE INTO events (id, title, description, category, location, event_date, price, max_tickets, organizer_id, image_url, createdAt) VALUES
  ('e0000000-0000-0000-0000-000000000001',
   'Festival de Musique Électro 2026',
   'Un festival en plein air avec les meilleurs DJ de la scène électronique française. Au programme : 3 scènes, food trucks et espace détente.',
   'musique', 'Parc de la Villette, Paris', '2026-07-15 18:00:00', 45.00, 500,
   'b0000000-0000-0000-0000-000000000002',
   'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800', NOW()),

  ('e0000000-0000-0000-0000-000000000002',
   'Marathon de Paris 2026',
   'Le marathon annuel de Paris. Parcours de 42,195 km à travers les plus beaux monuments de la capitale. Ravitaillement tous les 5 km.',
   'sport', 'Champs-Élysées, Paris', '2026-10-12 08:00:00', 35.00, 1000,
   'b0000000-0000-0000-0000-000000000002',
   'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800', NOW()),

  ('e0000000-0000-0000-0000-000000000003',
   'Conférence Tech & IA 2026',
   'Journée de conférences sur l''intelligence artificielle, le cloud computing et le développement web moderne. Networking et ateliers pratiques inclus.',
   'conference', 'Station F, Paris', '2026-06-20 09:00:00', 0.00, 200,
   'b0000000-0000-0000-0000-000000000002',
   'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', NOW()),

  ('e0000000-0000-0000-0000-000000000004',
   'Exposition Art Contemporain',
   'Découvrez les œuvres de 30 artistes contemporains émergents. Vernissage avec cocktail le premier soir. Entrée libre pour les étudiants.',
   'culture', 'Grand Palais, Paris', '2026-09-05 10:00:00', 15.00, 300,
   'b0000000-0000-0000-0000-000000000002',
   'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800', NOW()),

  ('e0000000-0000-0000-0000-000000000005',
   'Atelier Cuisine Japonaise',
   'Apprenez à préparer des sushis, makis et ramen avec un chef japonais. Ingrédients et matériel fournis. Dégustation en fin de cours.',
   'atelier', 'L''Atelier des Chefs, Lyon', '2026-08-22 14:00:00', 55.00, 20,
   'b0000000-0000-0000-0000-000000000002',
   'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800', NOW());

-- ============================================
-- INSCRIPTIONS (le participant est inscrit à 2 événements)
-- ============================================

INSERT IGNORE INTO inscriptions (id, user_id, event_id, status, createdAt, updatedAt) VALUES
  ('i0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003',
   'confirmed', NOW(), NOW()),
  ('i0000000-0000-0000-0000-000000000002',
   'c0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001',
   'confirmed', NOW(), NOW());

-- ============================================
-- PAIEMENTS (1 paiement confirmé pour l'événement payant)
-- ============================================

INSERT IGNORE INTO payments (id, user_id, event_id, amount, status, payment_method, card_last4, card_brand, createdAt, updatedAt) VALUES
  ('p0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001',
   45.00, 'succeeded', 'card', '4242', 'visa', NOW(), NOW());
