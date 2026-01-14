-- Migration: Ajouter catégorie et nombre de tickets aux événements
USE evencianew;

-- Ajouter la colonne category aux events
ALTER TABLE events 
ADD COLUMN category VARCHAR(100) DEFAULT 'autre' AFTER description,
ADD COLUMN max_tickets INT DEFAULT NULL AFTER price,
ADD COLUMN image_url VARCHAR(500) DEFAULT NULL AFTER photos;

-- Créer un index sur la catégorie pour les filtres
CREATE INDEX idx_category ON events(category);

-- Créer un index sur le prix pour les filtres
CREATE INDEX idx_price ON events(price);

