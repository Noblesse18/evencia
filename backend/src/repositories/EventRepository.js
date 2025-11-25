const BaseRepository = require('./BaseRepository');
const { eq, gte, lte, and, or, like, sql } = require('drizzle-orm');
const { v4: uuidv4 } = require('uuid'); // generer des id aleatorie unique 


/**
 * REPOSITORY POUR LA GESTION DES ÉVÉNEMENTS
 */

class EventRepository extends BaseRepository {
    constructor(db, eventTable, userTable) {
        super(db, eventTable);
        this.userTable = userTable;
    }

    /**
   * CRÉER UN NOUVEL ÉVÉNEMENT
   */
  async createEvent(eventData) {
    try {
        const eventId = uuidv4();

        const eventToCreate = {
            id: eventId,
            title: eventData.title.trim(),
            description: eventData.description?.trim(),
            location: eventData.location?.trim(),
            event_date: eventData.event_date,
            price: eventData.price || 0,
            organizer_id: eventData.organizer_id,
            photos: eventData.photos ? JSON.stringify(eventData.photos) : null
        };

        await this.db
            .insert(this.table)
            .values(eventToCreate);
        
        return await this.findById(eventId);
    }   catch (error) {
        throw new Error(`Erreur createEvent: ${error.message}`);
    }
  }

  /**
   * RÉCUPÉRER LES ÉVÉNEMENTS AVEC LES ORGANISATEURS
   * Jointure avec la table users
   */

  async findAllWithOrganizers(filters = {}){
    try {
        let query = this.db
            .select({
                // colonnes de l'evenement
                id: this.table.id,
                title: this.table.title,
                description: this.table.description,
                location: this.table.location,
                event_date: this.table.event_date,
                price: this.table.price,
                createdAt: this.table.createdAt,
                // Informations de l'organisateur
                organizer: {
                    id: this.userTable.id,
                    name: this.userTable.name,
                    email: this.userTable.email
                }
            })
            .from(this.table)
            .leftJoin(
                this.userTable,
                eq(this.table.organizer_id, this.userTable.id)
            );

        // appliquer les filtres
        const conditions = [];

        // filtre par date de debut
        if (filters.startDate) {
            conditions.push(gte(this.table.event_date, new Date(filters.startDate)));
        }

        // filtre par date de fin
        if (filters.endDate) {
            conditions.push(lte(this.table.event_date, new Date(filters.endDate)));
        }

        // filtre par lieu
        if (filters.location) {
            conditions.push(like(this.table.location, `%${filters.location}%`));
          }
          
          // Filtre par prix minimum
        if (filters.minPrice !== undefined) {
            conditions.push(gte(this.table.price, filters.minPrice));
        }
          
          // Filtre par prix maximum
        if (filters.maxPrice !== undefined) {
            conditions.push(lte(this.table.price, filters.maxPrice));
         }
          
          // Appliquer les conditions
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
          
          // Tri par défaut : date de l'événement
        query = query.orderBy(this.table.event_date);
          
          // Pagination
        if (filters.limit) {
            query = query.limit(filters.limit);
        }
          
        if (filters.offset) {
            query = query.offset(filters.offset);
        }

        const results = await query;

        // parser les photos JSON
        return results.map(event => ({
            ...event,
            photos: event.photos ? JSON.parse(event.photos): []
        }));
    }   catch (error) {
        throw new Error(`Erreur findAllWithOrganizers: ${error.message}`);
    }
  }

  /**
   * TROUVER LES ÉVÉNEMENTS D'UN ORGANISATEUR
   */
  async findByOrganizer(organizerId) {
    try {
        const events = await this.db
            .select()
            .from(this.table)
            .where(eq(this.table.organizer_id, organizerId))
            .orderBy(this.table.event_date);
        
        return events.map(event => ({
            ...event,
            photos: event.photos ? JSON.parse(event.photos): []
        }));
    }   catch (error) {
        throw new Error(`Erreur findByOrganizer: ${error.message}`);
    }
  }

  /**
   * TROUVER LES ÉVÉNEMENTS À VENIR
   */
  async findUpcoming(days = 30) {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      const events = await this.db
        .select()
        .from(this.table)
        .where(
          and(
            gte(this.table.event_date, now),
            lte(this.table.event_date, futureDate)
          )
        )
        .orderBy(this.table.event_date);
      
      return events.map(event => ({
        ...event,
        photos: event.photos ? JSON.parse(event.photos) : []
      }));
    } catch (error) {
      throw new Error(`Erreur findUpcoming: ${error.message}`);
    }
  }

  /**
   * RECHERCHER DES ÉVÉNEMENTS
   * Par titre, description ou lieu
   */
  async search(searchTerm) {
    try {
      const term = `%${searchTerm}%`;
      
      const events = await this.db
        .select()
        .from(this.table)
        .where(
          or(
            like(this.table.title, term),
            like(this.table.description, term),
            like(this.table.location, term)
          )
        )
        .orderBy(this.table.event_date);
      
      return events.map(event => ({
        ...event,
        photos: event.photos ? JSON.parse(event.photos) : []
      }));
    } catch (error) {
      throw new Error(`Erreur search: ${error.message}`);
    }
  }

  /**
   * METTRE À JOUR UN ÉVÉNEMENT
   * Vérifie que l'utilisateur est bien l'organisateur
   */
  async updateEvent(eventId, updateData, userId) {
    try {
      // Vérifier que l'événement existe
      const event = await this.findById(eventId);
      
      if (!event) {
        throw new Error('Événement introuvable');
      }
      
      // Vérifier les permissions
      if (event.organizer_id !== userId) {
        throw new Error('Non autorisé à modifier cet événement');
      }
      
      // Préparer les données
      const dataToUpdate = { ...updateData };
      
      // Convertir les photos en JSON si nécessaire
      if (dataToUpdate.photos && typeof dataToUpdate.photos === 'object') {
        dataToUpdate.photos = JSON.stringify(dataToUpdate.photos);
      }
      
      // Mettre à jour
      await this.db
        .update(this.table)
        .set({
          ...dataToUpdate,
          updatedAt: new Date()
        })
        .where(eq(this.table.id, eventId));
      
      return await this.findById(eventId);
    } catch (error) {
      throw new Error(`Erreur updateEvent: ${error.message}`);
    }
  }


  /**
   * OBTENIR LES STATISTIQUES DES ÉVÉNEMENTS
   */
  async getStatistics() {
    try {
      const now = new Date();
      
      // Total des événements
      const total = await this.count();
      
      // Événements à venir
      const upcoming = await this.count(
        gte(this.table.event_date, now)
      );
      
      // Événements passés
      const past = total - upcoming;
      
      // Prix moyen
      const avgPriceResult = await this.db
        .select({
          avg: sql`AVG(${this.table.price})`
        })
        .from(this.table);
      
      const averagePrice = parseFloat(avgPriceResult[0]?.avg || 0);
      
      // Événements par mois (12 derniers mois)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      
      const eventsByMonth = await this.db
        .select({
          month: sql`DATE_FORMAT(${this.table.event_date}, '%Y-%m')`,
          count: sql`COUNT(*)`
        })
        .from(this.table)
        .where(gte(this.table.event_date, twelveMonthsAgo))
        .groupBy(sql`DATE_FORMAT(${this.table.event_date}, '%Y-%m')`);
      
      return {
        total,
        upcoming,
        past,
        averagePrice: averagePrice.toFixed(2),
        eventsByMonth
      };
    } catch (error) {
      throw new Error(`Erreur getStatistics: ${error.message}`);
    }
  }


 /**
   * OBTENIR LES ÉVÉNEMENTS POPULAIRES
   * Basé sur le nombre d'inscriptions
   */
  async getPopularEvents(limit = 5) {
    try {
      // Cette requête nécessite une jointure avec inscriptions
      // Pour simplifier, on retourne les événements les plus récents
      const events = await this.db
        .select()
        .from(this.table)
        .where(gte(this.table.event_date, new Date()))
        .orderBy(this.table.createdAt)
        .limit(limit);
      
      return events.map(event => ({
        ...event,
        photos: event.photos ? JSON.parse(event.photos) : []
      }));
    } catch (error) {
      throw new Error(`Erreur getPopularEvents: ${error.message}`);
    }
  }

    /**
   * VÉRIFIER SI UN UTILISATEUR EST L'ORGANISATEUR
   */
  async isOrganizer(eventId, userId) {
    try {
      const event = await this.findById(eventId);
      
      if (!event) {
        return false;
      }
      
      return event.organizer_id === userId;
    } catch (error) {
      throw new Error(`Erreur isOrganizer: ${error.message}`);
    }
  }
}

module.exports = EventRepository; 

