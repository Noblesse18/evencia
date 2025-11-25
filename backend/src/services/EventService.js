/**
 * SERVICE DE GESTION DES ÉVÉNEMENTS
 * 
 * Gère toute la logique métier des événements
 */

class EventService {
    constructor(eventRepository, userRepository, inscriptionRepository, emailService = null) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.inscriptionRepository = inscriptionRepository;
        this.emailService = emailService;
    }

    /**
     * CRÉER UN NOUVEL ÉVÉNEMENT
     */

    async createEvent(eventData, organizerId) {
        try {
            // 1. verifier que l'organisateur existe et a les droites
            const organizer = await this.userRepository.findById(organizerId);

            if (!organizer) {
                throw new Error('utilisateur introuvable');
            }

            if (organizer.role !== 'organizer' && organizer.role !== 'admin') {
                throw new Error('Seuls les organisateurs peuvent creer des evenements');
            }

            // 2. valider  les donnees
            this.validateEventData(eventData);

            // 3. Verifications metier supplementaires
            // date dans le futur
            if (new Date(eventData.event_date) <= new Date()) {
                throw new Error(`La date de l'evenement doit etre dans le future`);
            }

            // prix positif
            if (eventData.price && eventData.price < 0 ) {
                throw new Error('Le prix ne peut pas etre negatif');
            }

            // 4. creer l'evenement
            const event = await this.eventRepository.createEvent({
                ...eventData,
                organizer_id: organizerId
            });

            // 5 Notificqtion (optionnel)
            if (this.emailService) {
                await this.emailService.notifyNewEvent(event);
            }

            return {
                success: true,
                message: 'Evenement cree avec succes',
                event
            };
        }   catch (error){
            throw new Error(`Erreur creation evenement: ${error.message}`);
        }
    }

      /**
   * METTRE À JOUR UN ÉVÉNEMENT
   */
  async updateEvent(eventId, updateData, userId) {
    try {
      // 1. Vérifier que l'événement existe
      const event = await this.eventRepository.findById(eventId);
      
      if (!event) {
        throw new Error('Événement introuvable');
      }
      
      // 2. Vérifier les permissions
      const user = await this.userRepository.findById(userId);
      
      if (event.organizer_id !== userId && user.role !== 'admin') {
        throw new Error('Non autorisé à modifier cet événement');
      }
      
      // 3. Valider les nouvelles données
      if (updateData.event_date) {
        if (new Date(updateData.event_date) <= new Date()) {
          throw new Error('La date doit être dans le futur');
        }
        
        // Si la date change et qu'il y a des inscrits
        if (event.event_date !== updateData.event_date) {
          const participants = await this.inscriptionRepository.findByEvent(eventId);
          
          if (participants.length > 0) {
            // Notifier les participants du changement
            await this.notifyDateChange(eventId, event.event_date, updateData.event_date);
          }
        }
      }
      
      if (updateData.price !== undefined && updateData.price < 0) {
        throw new Error('Le prix ne peut pas être négatif');
      }
      
      // 4. Mettre à jour
      const updatedEvent = await this.eventRepository.updateEvent(
        eventId,
        updateData,
        userId
      );
      
      return {
        success: true,
        message: 'Événement mis à jour',
        event: updatedEvent
      };
    } catch (error) {
      throw new Error(`Erreur mise à jour: ${error.message}`);
    }
  }

  /**
   * SUPPRIMER UN ÉVÉNEMENT
   */
  async deleteEvent(eventId, userId) {
    try {
      // 1. Vérifier que l'événement existe
      const event = await this.eventRepository.findById(eventId);
      
      if (!event) {
        throw new Error('Événement introuvable');
      }
      
      // 2. Vérifier les permissions
      const user = await this.userRepository.findById(userId);
      
      if (event.organizer_id !== userId && user.role !== 'admin') {
        throw new Error('Non autorisé à supprimer cet événement');
      }
      
      // 3. Vérifier s'il y a des inscriptions
      const inscriptions = await this.inscriptionRepository.findByEvent(eventId);
      
      if (inscriptions.length > 0) {
        // Événement à venir avec inscrits = problème
        if (new Date(event.event_date) > new Date()) {
          throw new Error(
            `Impossible de supprimer : ${inscriptions.length} personnes sont inscrites. ` +
            `Annulez d'abord l'événement.`
          );
        }
      }
      
      // 4. Supprimer l'événement
      await this.eventRepository.delete(eventId);
      
      return {
        success: true,
        message: 'Événement supprimé'
      };
    } catch (error) {
      throw new Error(`Erreur suppression: ${error.message}`);
    }
  }

  /**
   * OBTENIR LES DÉTAILS D'UN ÉVÉNEMENT
   */
  async getEventDetails(eventId, userId = null) {
    try {
      const event = await this.eventRepository.findById(eventId);
      
      if (!event) {
        throw new Error('Événement introuvable');
      }
      
      // Enrichir avec des informations
      // 1. Organisateur
      const organizer = await this.userRepository.findById(event.organizer_id);
      
      // 2. Nombre de participants
      const participantStats = await this.inscriptionRepository.countByEventAndStatus(eventId);
      
      // 3. Statut de l'utilisateur (inscrit ou non)
      let userRegistration = null;
      if (userId) {
        const inscriptions = await this.inscriptionRepository.findByUser(userId);
        userRegistration = inscriptions.find(i => i.event.id === eventId);
      }
      
      return {
        ...event,
        photos: event.photos ? JSON.parse(event.photos) : [],
        organizer: {
          id: organizer.id,
          name: organizer.name,
          email: organizer.email
        },
        participants: {
          total: participantStats.total,
          confirmed: participantStats.confirmed,
          pending: participantStats.pending
        },
        userRegistration: userRegistration ? {
          status: userRegistration.status,
          registeredAt: userRegistration.createdAt
        } : null,
        isPast: new Date(event.event_date) < new Date()
      };
    } catch (error) {
      throw new Error(`Erreur détails événement: ${error.message}`);
    }
  }

  /**
   * LISTER LES ÉVÉNEMENTS AVEC FILTRES
   */
  async listEvents(filters = {}) {
    try {
      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const offset = (page - 1) * limit;
      
      // Récupérer les événements
      const events = await this.eventRepository.findAllWithOrganizers({
        ...filters,
        limit,
        offset
      });
      
      // Compter le total pour la pagination
      const total = await this.eventRepository.count();
      
      return {
        events: events.map(event => ({
          ...event,
          isPast: new Date(event.event_date) < new Date()
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total
        }
      };
    } catch (error) {
      throw new Error(`Erreur liste événements: ${error.message}`);
    }
  }

  /**
   * RECHERCHER DES ÉVÉNEMENTS
   */
  async searchEvents(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new Error('Terme de recherche trop court');
      }
      
      const events = await this.eventRepository.search(searchTerm);
      
      return events.map(event => ({
        ...event,
        isPast: new Date(event.event_date) < new Date()
      }));
    } catch (error) {
      throw new Error(`Erreur recherche: ${error.message}`);
    }
  }

  /**
   * OBTENIR LES ÉVÉNEMENTS À VENIR
   */
  async getUpcomingEvents(days = 30) {
    try {
      const events = await this.eventRepository.findUpcoming(days);
      
      return events.map(event => ({
        ...event,
        daysUntil: Math.ceil(
          (new Date(event.event_date) - new Date()) / (1000 * 60 * 60 * 24)
        )
      }));
    } catch (error) {
      throw new Error(`Erreur événements à venir: ${error.message}`);
    }
  }

  /**
   * OBTENIR LES ÉVÉNEMENTS D'UN ORGANISATEUR
   */
  async getOrganizerEvents(organizerId) {
    try {
      const events = await this.eventRepository.findByOrganizer(organizerId);
      
      // Ajouter les stats de participation
      const eventsWithStats = [];
      
      for (const event of events) {
        const stats = await this.inscriptionRepository.countByEventAndStatus(event.id);
        
        eventsWithStats.push({
          ...event,
          participants: stats,
          isPast: new Date(event.event_date) < new Date()
        });
      }
      
      return eventsWithStats;
    } catch (error) {
      throw new Error(`Erreur événements organisateur: ${error.message}`);
    }
  }

  /**
   * OBTENIR LES STATISTIQUES
   */
  async getStatistics(userId = null) {
    try {
      const baseStats = await this.eventRepository.getStatistics();
      
      // Si un userId est fourni et c'est un organisateur
      if (userId) {
        const user = await this.userRepository.findById(userId);
        
        if (user && (user.role === 'organizer' || user.role === 'admin')) {
          const myEvents = await this.eventRepository.findByOrganizer(userId);
          
          // Calculer les stats personnelles
          let totalParticipants = 0;
          let totalRevenue = 0;
          
          for (const event of myEvents) {
            const stats = await this.inscriptionRepository.countByEventAndStatus(event.id);
            totalParticipants += stats.confirmed;
            totalRevenue += (stats.confirmed * (event.price || 0));
          }
          
          return {
            ...baseStats,
            personal: {
              myEvents: myEvents.length,
              totalParticipants,
              estimatedRevenue: totalRevenue.toFixed(2)
            }
          };
        }
      }
      
      return baseStats;
    } catch (error) {
      throw new Error(`Erreur statistiques: ${error.message}`);
    }
  }

  /**
   * VALIDATION DES DONNÉES D'ÉVÉNEMENT
   */
  validateEventData(data) {
    const errors = [];
    
    // Titre
    if (!data.title || data.title.trim().length < 3) {
      errors.push('Le titre doit contenir au moins 3 caractères');
    }
    
    if (data.title && data.title.length > 200) {
      errors.push('Le titre ne peut pas dépasser 200 caractères');
    }
    
    // Description
    if (!data.description || data.description.trim().length < 10) {
      errors.push('La description doit contenir au moins 10 caractères');
    }
    
    if (data.description && data.description.length > 2000) {
      errors.push('La description ne peut pas dépasser 2000 caractères');
    }
    
    // Lieu
    if (!data.location) {
      errors.push('Le lieu est requis');
    }
    
    // Date
    if (!data.event_date) {
      errors.push('La date de l\'événement est requise');
    }
    
    // Photos
    if (data.photos && Array.isArray(data.photos)) {
      if (data.photos.length > 10) {
        errors.push('Maximum 10 photos autorisées');
      }
    }
    
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  /**
   * NOTIFIER LES PARTICIPANTS D'UN CHANGEMENT DE DATE
   */
  async notifyDateChange(eventId, oldDate, newDate) {
    try {
      if (!this.emailService) {
        console.log('Service email non configuré');
        return;
      }
      
      const participants = await this.inscriptionRepository.findByEvent(eventId);
      const event = await this.eventRepository.findById(eventId);
      
      for (const participant of participants) {
        if (participant.status === 'confirmed') {
          await this.emailService.sendDateChangeNotification(
            participant.user.email,
            event.title,
            oldDate,
            newDate
          );
        }
      }
      
      return {
        notified: participants.filter(p => p.status === 'confirmed').length
      };
    } catch (error) {
      console.error('Erreur notification:', error);
    }
  }

}

module.exports = EventService;

