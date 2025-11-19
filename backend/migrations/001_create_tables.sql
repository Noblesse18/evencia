CREATE DATABASE IF NOT EXISTS evencianew;
USE evencianew;


-- Table Users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('participant', 'organizer', 'admin') DEFAULT 'participant',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Table Events
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(500),
  event_date TIMESTAMP,
  price DECIMAL(10,2) DEFAULT 0,
  organizer_id VARCHAR(36) NOT NULL,
  photos JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_organizer (organizer_id),
  INDEX idx_event_date (event_date)
);

-- Table Inscriptions
CREATE TABLE IF NOT EXISTS inscriptions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  event_id VARCHAR(36) NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_event (user_id, event_id),
  INDEX idx_user (user_id),
  INDEX idx_event (event_id),
  INDEX idx_status (status)
);

-- Table Payments
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  event_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  
  -- Statut aligné avec Stripe
  status ENUM(
    'pending',           -- En attente
    'processing',        -- En cours (Stripe traite)
    'requires_action',   -- 3D Secure requis
    'succeeded',         -- Paiement réussi
    'canceled',          -- Annulé
    'failed',            -- Échoué
    'refunded'           -- Remboursé
  ) DEFAULT 'pending',
  
  -- IDs Stripe essentiels
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  
  -- Méthodes de paiement Stripe uniquement
  payment_method ENUM(
    'card',              -- Carte bancaire (Visa, Mastercard, Amex...)
    'sepa_debit',        -- Prélèvement SEPA
    'ideal',             -- iDEAL (Pays-Bas)
    'bancontact',        -- Bancontact (Belgique)
    'giropay',           -- Giropay (Allemagne)
    'sofort',            -- Sofort (Europe)
    'eps',               -- EPS (Autriche)
    'przelewy24',        -- Przelewy24 (Pologne)
    'alipay',            -- Alipay
    'wechat_pay'         -- WeChat Pay
  ),
  
  -- Infos carte (si payment_method = 'card')
  card_last4 VARCHAR(4),
  card_brand VARCHAR(20),
  
  -- Erreurs Stripe
  failure_message TEXT,
  
  -- Remboursement
  refunded_at TIMESTAMP NULL,
  refund_reason TEXT,
  
  -- Timestamps
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Relations
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  
  -- Index
  INDEX idx_user_payment (user_id),
  INDEX idx_event_payment (event_id),
  INDEX idx_status_payment (status),
  INDEX idx_stripe_id (stripe_payment_intent_id)
);

