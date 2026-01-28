// src/controllers/eventController.js
const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { EventRepository, InscriptionRepository, eventRepository, inscriptionRepository} = require('../repositories');


// Liste des catégories disponibles
const CATEGORIES = [
  'musique',
  'sport',
  'conference',
  'theatre',
  'cinema',
  'exposition',
  'festival',
  'atelier',
  'networking',
  'gastronomie',
  'autre'
];

async function getCategories(req, res) {
  res.json(CATEGORIES);
}

async function listEvents(req, res, next) {
  try {
    const { 
      category, 
      date_from, 
      date_to, 
      price_min, 
      price_max, 
      city,
      search,
      page = 1, 
      limit = 12 
    } = req.query;

    // Construction de la requête avec filtres
    let query = `
      SELECT e.*, 
        (SELECT COUNT(*) FROM inscriptions i WHERE i.event_id = e.id AND i.status = 'confirmed') as participants_count
      FROM events e 
      WHERE 1=1
    `;
    const params = [];

    // Filtre par catégorie
    if (category && category !== 'all') {
      query += ' AND e.category = ?';
      params.push(category);
    }

    // Filtre par date
    if (date_from) {
      query += ' AND e.event_date >= ?';
      params.push(date_from);
    }
    if (date_to) {
      query += ' AND e.event_date <= ?';
      params.push(date_to);
    }

    // Filtre par prix
    if (price_min !== undefined && price_min !== '') {
      query += ' AND e.price >= ?';
      params.push(parseFloat(price_min));
    }
    if (price_max !== undefined && price_max !== '') {
      query += ' AND e.price <= ?';
      params.push(parseFloat(price_max));
    }

    // Filtre par ville (recherche dans location)
    if (city) {
      query += ' AND e.location LIKE ?';
      params.push(`%${city}%`);
    }

    // Recherche par titre ou description
    if (search) {
      query += ' AND (e.title LIKE ? OR e.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Compter le total pour la pagination
    const countQuery = query.replace(
      /SELECT e\.\*, \s*\(SELECT COUNT\(\*\).*?\) as participants_count/,
      'SELECT COUNT(*) as total'
    );
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    // Ajouter ORDER BY et pagination
    query += ' ORDER BY e.event_date ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    // MySQL execute() ne supporte pas bien les placeholders pour LIMIT/OFFSET,
    // on les ajoute directement (valeurs déjà validées comme nombres)
    query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const [rows] = await pool.execute(query, params);

    res.json({
      events: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) { next(err); }
}

async function getEvent(req, res, next) {
  try {
    const { id } = req.params;
    
    const event = await eventRepository.findAll(id);

    if (!event) {
      return res.status(404).json({ message : 'Evenement introuvable' });
    }

    // Recuperer le nombre de participants
    const participantsCount = await inscriptionRepository.countByEventId(id);

    // Calculer les tickets restants 
    const ticketsRemaining = event.max_tickets
      ? event.max_tickets - participantsCount
      : null;
    
    res.json({
      ...events,
      participants_count: participantsCount,
      tickets_remaining: ticketsRemaining
    });
  } catch (err) {
    next(err);
  }
}

async function createEvent(req, res, next) {
  try {
    const { title, description, category, location, event_date, price, max_tickets, image_url, photos } = req.body;
    const organizer_id = req.user.userId;
    
    const newEvent = await eventRepository.createEvent({
      title, 
      description, 
      category: category || 'autre',
      location, 
      event_date: event_date || null, 
      price:  price || 0, 
      max_tickets: max_tickets || null,
      organizer_id, 
      image_url: image_url || null,
      photos : photos || null
    });

    res.stats(201).json(newEvent);
  } catch (err) {
    next(err);
  }
}


async function updateEvent(req, res, next) {
  try {
    const { id } = req.params;
    const fields = req.body;
    
    // Liste blanche des champs autorisés pour éviter l'injection SQL
    const allowedFields = ['title', 'description', 'category', 'location', 'event_date', 'price', 'max_tickets', 'image_url', 'photos'];
    const set = [];
    const values = [];
    
    for (const key in fields) {
      // Vérifier que le champ est autorisé
      if (allowedFields.includes(key)) {
        set.push(`${key} = ?`);
        if (key === 'photos') {
          values.push(JSON.stringify(fields[key]));
        } else if (key === 'max_tickets' && (fields[key] === '' || fields[key] === null)) {
          values.push(null);
        } else {
          values.push(fields[key]);
        }
      }
    }
    
    if (!set.length) return res.status(400).json({ message: 'Pas de champs à mettre à jour' });
    
    // Vérifier que l'événement existe et appartient à l'utilisateur (sauf admin)
    const [existing] = await pool.execute('SELECT organizer_id FROM events WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ message: 'Événement introuvable' });
    
    if (existing[0].organizer_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres événements' });
    }
    
    values.push(id);
    await pool.execute(`UPDATE events SET ${set.join(', ')} WHERE id = ?`, values);
    const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function deleteEvent(req, res, next) {
  try {
    const { id } = req.params;
    
    // Vérifier que l'événement existe et appartient à l'utilisateur (sauf admin)
    const [existing] = await pool.execute('SELECT organizer_id FROM events WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ message: 'Événement introuvable' });
    
    if (existing[0].organizer_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres événements' });
    }
    
    await pool.execute('DELETE FROM events WHERE id = ?', [id]);
    res.json({ message: 'Événement supprimé' });
  } catch (err) { next(err); }
}

// Obtenir les événements d'un organisateur
async function getOrganizerEvents(req, res, next) {
  try {
    const organizer_id = req.user.userId;
    
    const [rows] = await pool.execute(`
      SELECT e.*, 
        (SELECT COUNT(*) FROM inscriptions i WHERE i.event_id = e.id AND i.status = 'confirmed') as participants_count,
        (SELECT COUNT(*) FROM inscriptions i WHERE i.event_id = e.id AND i.status = 'confirmed') as tickets_sold
      FROM events e 
      WHERE e.organizer_id = ?
      ORDER BY e.createdAt DESC
    `, [organizer_id]);
    
    // Calculer les statistiques globales
    let totalTicketsSold = 0;
    let totalRevenue = 0;
    
    rows.forEach(event => {
      totalTicketsSold += event.tickets_sold || 0;
      totalRevenue += (event.tickets_sold || 0) * (parseFloat(event.price) || 0);
    });
    
    res.json({
      events: rows,
      stats: {
        totalEvents: rows.length,
        totalTicketsSold,
        totalRevenue
      }
    });
  } catch (err) { next(err); }
}

module.exports = { 
  listEvents, 
  getEvent, 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  getCategories,
  getOrganizerEvents 
};
