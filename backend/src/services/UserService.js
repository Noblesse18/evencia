/**
 * SERVICE DE GESTION DES UTILISATEURS
 * 
 * Gère la logique métier liée aux profils utilisateur
 */
class UserService {
    constructor(userRepository, inscriptionRepository, eventRepository) {
      this.userRepository = userRepository;
      this.inscriptionRepository = inscriptionRepository;
      this.eventRepository = eventRepository;
    }
  
    /**
     * OBTENIR LE PROFIL D'UN UTILISATEUR
     */
    async getUserProfile(userId) {
      try {
        const user = await this.userRepository.findById(userId);
        
        if (!user) {
          throw new Error('Utilisateur introuvable');
        }
        
        // Enlever les données sensibles
        delete user.password;
        
        return user;
      } catch (error) {
        throw new Error(`Erreur récupération profil: ${error.message}`);
      }
    }
  
    /**
     * METTRE À JOUR LE PROFIL
     */
    async updateProfile(userId, updateData) {
      try {
        // Valider les données
        this.validateProfileData(updateData);
        
        // Empêcher la modification de certains champs
        const { 
          id, 
          email, 
          password, 
          role, 
          createdAt, 
          ...safeData 
        } = updateData;
        
        // Mettre à jour
        const updatedUser = await this.userRepository.updateProfile(userId, safeData);
        
        // Enlever le mot de passe
        delete updatedUser.password;
        
        return updatedUser;
      } catch (error) {
        throw new Error(`Erreur mise à jour profil: ${error.message}`);
      }
    }
  
    /**
     * OBTENIR LA LISTE DES UTILISATEURS (ADMIN)
     */
    async listUsers(filters = {}) {
      try {
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 10;
        
        const result = await this.userRepository.getPaginated(page, limit, filters);
        
        return {
          users: result.users,
          pagination: result.pagination
        };
      } catch (error) {
        throw new Error(`Erreur liste utilisateurs: ${error.message}`);
      }
    }
  
    /**
     * CHANGER LE RÔLE D'UN UTILISATEUR (ADMIN)
     */
    async changeRole(userId, newRole, adminId) {
      try {
        // Vérifier que l'admin existe
        const admin = await this.userRepository.findById(adminId);
        
        if (!admin || admin.role !== 'admin') {
          throw new Error('Non autorisé');
        }
        
        // Vérifier que l'utilisateur existe
        const user = await this.userRepository.findById(userId);
        
        if (!user) {
          throw new Error('Utilisateur introuvable');
        }
        
        // Empêcher un admin de se retirer ses droits
        if (userId === adminId && newRole !== 'admin') {
          throw new Error('Vous ne pouvez pas changer votre propre rôle');
        }
        
        // Valider le nouveau rôle
        const validRoles = ['participant', 'organizer', 'admin'];
        if (!validRoles.includes(newRole)) {
          throw new Error('Rôle invalide');
        }
        
        // Mettre à jour
        await this.userRepository.update(userId, { role: newRole });
        
        return {
          success: true,
          message: `Rôle changé en ${newRole}`
        };
      } catch (error) {
        throw new Error(`Erreur changement rôle: ${error.message}`);
      }
    }
  
    /**
     * SUPPRIMER UN UTILISATEUR (ADMIN)
     */
    async deleteUser(userId, adminId) {
      try {
        // Vérifications d'autorisation
        const admin = await this.userRepository.findById(adminId);
        
        if (!admin || admin.role !== 'admin') {
          throw new Error('Non autorisé');
        }
        
        // Empêcher l'auto-suppression
        if (userId === adminId) {
          throw new Error('Vous ne pouvez pas supprimer votre propre compte');
        }
        
        // Vérifier que l'utilisateur existe
        const user = await this.userRepository.findById(userId);
        
        if (!user) {
          throw new Error('Utilisateur introuvable');
        }
        
        // Vérifier les dépendances
        // - Événements organisés
        const events = await this.eventRepository.findByOrganizer(userId);
        if (events.length > 0) {
          throw new Error('Cet utilisateur a des événements. Supprimez d\'abord les événements.');
        }
        
        // Supprimer l'utilisateur (les inscriptions seront supprimées en cascade)
        await this.userRepository.delete(userId);
        
        return {
          success: true,
          message: 'Utilisateur supprimé'
        };
      } catch (error) {
        throw new Error(`Erreur suppression utilisateur: ${error.message}`);
      }
    }
  
    /**
     * OBTENIR LE DASHBOARD D'UN UTILISATEUR
     */
    async getUserDashboard(userId) {
      try {
        // Profil utilisateur
        const user = await this.getUserProfile(userId);
        
        // Statistiques selon le rôle
        let stats = {};
        
        if (user.role === 'participant') {
          // Inscriptions
          const inscriptions = await this.inscriptionRepository.findByUser(userId);
          const upcoming = inscriptions.filter(i => 
            new Date(i.event.event_date) > new Date() && 
            i.status === 'confirmed'
          );
          
          stats = {
            totalInscriptions: inscriptions.length,
            upcomingEvents: upcoming.length,
            pastEvents: inscriptions.length - upcoming.length
          };
        } else if (user.role === 'organizer') {
          // Événements organisés
          const events = await this.eventRepository.findByOrganizer(userId);
          const upcoming = events.filter(e => 
            new Date(e.event_date) > new Date()
          );
          
          // Nombre total de participants
          let totalParticipants = 0;
          for (const event of events) {
            const count = await this.inscriptionRepository.countByEventAndStatus(event.id);
            totalParticipants += count.confirmed;
          }
          
          stats = {
            totalEvents: events.length,
            upcomingEvents: upcoming.length,
            pastEvents: events.length - upcoming.length,
            totalParticipants
          };
        } else if (user.role === 'admin') {
          // Statistiques globales
          const userStats = await this.userRepository.getStatistics();
          const eventStats = await this.eventRepository.getStatistics();
          
          stats = {
            totalUsers: userStats.total,
            newUsers: userStats.newUsers,
            totalEvents: eventStats.total,
            upcomingEvents: eventStats.upcoming
          };
        }
        
        return {
          user,
          stats,
          lastActivity: new Date()
        };
      } catch (error) {
        throw new Error(`Erreur dashboard: ${error.message}`);
      }
    }
  
    /**
     * RECHERCHER DES UTILISATEURS
     */
    async searchUsers(searchTerm) {
      try {
        if (!searchTerm || searchTerm.trim().length < 2) {
          throw new Error('Terme de recherche trop court (min 2 caractères)');
        }
        
        const users = await this.userRepository.search(searchTerm);
        
        // Enlever les mots de passe
        return users.map(user => {
          delete user.password;
          return user;
        });
      } catch (error) {
        throw new Error(`Erreur recherche: ${error.message}`);
      }
    }
  
    /**
     * OBTENIR LES STATISTIQUES (ADMIN)
     */
    async getStatistics() {
      try {
        return await this.userRepository.getStatistics();
      } catch (error) {
        throw new Error(`Erreur statistiques: ${error.message}`);
      }
    }
  
    /**
     * VALIDATION DES DONNÉES DE PROFIL
     */
    validateProfileData(data) {
      const errors = [];
      
      if (data.name !== undefined) {
        if (data.name.trim().length < 2) {
          errors.push('Le nom doit contenir au moins 2 caractères');
        }
        if (data.name.length > 100) {
          errors.push('Le nom ne peut pas dépasser 100 caractères');
        }
      }
      
      if (data.phone !== undefined && data.phone) {
        // Validation simple du téléphone
        if (!/^[0-9+\-\s()]+$/.test(data.phone)) {
          errors.push('Numéro de téléphone invalide');
        }
      }
      
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }
    }
  }
  
module.exports = UserService;