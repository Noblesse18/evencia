const BaseRepository = require('./BaseRepository');
const { eq, and, sql } = require('drizzle-orm');
const { v4: uuidv4 } = require('uuid');

/**
 * REPOSITORY POUR LA GESTION DES INSCRIPTIONS
 */
class InscriptionRepository extends BaseRepository {
  constructor(db, inscriptionTable, userTable, eventTable) {
    super(db, inscriptionTable);
    this.userTable = userTable;
    this.eventTable = eventTable;
  }

  /**
   * VÉRIFIER SI UN UTILISATEUR EST DÉJÀ INSCRIT
   */
  async isUserRegistered(userId, eventId) {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(
          and(
            eq(this.table.user_id, userId),
            eq(this.table.event_id, eventId)
          )
        )
        .limit(1);
      
      return result.length > 0;
    } catch (error) {
      throw new Error(`Erreur isUserRegistered: ${error.message}`);
    }
  }

  /**
   * CRÉER UNE NOUVELLE INSCRIPTION
   */
  async createInscription(userId, eventId, status = 'pending') {
    try {
      // Vérifier si déjà inscrit
      const alreadyRegistered = await this.isUserRegistered(userId, eventId);
      
      if (alreadyRegistered) {
        throw new Error('Utilisateur déjà inscrit à cet événement');
      }
      
      const inscriptionId = uuidv4();
      
      await this.db
        .insert(this.table)
        .values({
          id: inscriptionId,
          user_id: userId,
          event_id: eventId,
          status: status
        });
      
      return await this.findInscriptionWithDetails(inscriptionId);
    } catch (error) {
      // Gérer l'erreur de contrainte unique
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Inscription déjà existante');
      }
      throw new Error(`Erreur createInscription: ${error.message}`);
    }
  }

  /**
   * RÉCUPÉRER UNE INSCRIPTION AVEC TOUS LES DÉTAILS
   * Jointure avec users et events
   */
  async findInscriptionWithDetails(inscriptionId) {
    try {
      const results = await this.db
        .select({
          // Inscription
          id: this.table.id,
          status: this.table.status,
          createdAt: this.table.createdAt,
          // Utilisateur
          user: {
            id: this.userTable.id,
            name: this.userTable.name,
            email: this.userTable.email
          },
          // Événement
          event: {
            id: this.eventTable.id,
            title: this.eventTable.title,
            event_date: this.eventTable.event_date,
            location: this.eventTable.location,
            price: this.eventTable.price
          }
        })
        .from(this.table)
        .leftJoin(
          this.userTable,
          eq(this.table.user_id, this.userTable.id)
        )
        .leftJoin(
          this.eventTable,
          eq(this.table.event_id, this.eventTable.id)
        )
        .where(eq(this.table.id, inscriptionId))
        .limit(1);
      
      return results[0] || null;
    } catch (error) {
      throw new Error(`Erreur findInscriptionWithDetails: ${error.message}`);
    }
  }

  /**
   * TROUVER TOUTES LES INSCRIPTIONS D'UN UTILISATEUR
   */
  async findByUser(userId) {
    try {
      const inscriptions = await this.db
        .select({
          // Inscription
          id: this.table.id,
          status: this.table.status,
          createdAt: this.table.createdAt,
          // Événement
          event: {
            id: this.eventTable.id,
            title: this.eventTable.title,
            event_date: this.eventTable.event_date,
            location: this.eventTable.location,
            price: this.eventTable.price
          }
        })
        .from(this.table)
        .leftJoin(
          this.eventTable,
          eq(this.table.event_id, this.eventTable.id)
        )
        .where(eq(this.table.user_id, userId))
        .orderBy(this.eventTable.event_date);
      
      return inscriptions;
    } catch (error) {
      throw new Error(`Erreur findByUser: ${error.message}`);
    }
  }

  /**
   * TROUVER TOUS LES PARTICIPANTS D'UN ÉVÉNEMENT
   */
  async findByEvent(eventId) {
    try {
      const participants = await this.db
        .select({
          // Inscription
          id: this.table.id,
          status: this.table.status,
          createdAt: this.table.createdAt,
          // Utilisateur
          user: {
            id: this.userTable.id,
            name: this.userTable.name,
            email: this.userTable.email
          }
        })
        .from(this.table)
        .leftJoin(
          this.userTable,
          eq(this.table.user_id, this.userTable.id)
        )
        .where(eq(this.table.event_id, eventId))
        .orderBy(this.table.createdAt);
      
      return participants;
    } catch (error) {
      throw new Error(`Erreur findByEvent: ${error.message}`);
    }
  }

  /**
   * METTRE À JOUR LE STATUT D'UNE INSCRIPTION
   */
  async updateStatus(inscriptionId, status) {
    try {
      await this.db
        .update(this.table)
        .set({
          status: status,
          updatedAt: new Date()
        })
        .where(eq(this.table.id, inscriptionId));
      
      return await this.findInscriptionWithDetails(inscriptionId);
    } catch (error) {
      throw new Error(`Erreur updateStatus: ${error.message}`);
    }
  }

  /**
   * ANNULER UNE INSCRIPTION
   */
  async cancelInscription(inscriptionId, userId) {
    try {
      // Vérifier que l'inscription existe
      const inscription = await this.findById(inscriptionId);
      
      if (!inscription) {
        throw new Error('Inscription introuvable');
      }
      
      // Vérifier que c'est bien l'utilisateur inscrit
      if (inscription.user_id !== userId) {
        throw new Error('Non autorisé à annuler cette inscription');
      }
      
      // Passer le statut à "cancelled"
      await this.updateStatus(inscriptionId, 'cancelled');
      
      return true;
    } catch (error) {
      throw new Error(`Erreur cancelInscription: ${error.message}`);
    }
  }

  /**
   * COMPTER LES INSCRIPTIONS PAR STATUT POUR UN ÉVÉNEMENT
   */
  async countByEventAndStatus(eventId) {
    try {
      const counts = await this.db
        .select({
          status: this.table.status,
          count: sql`COUNT(*)`
        })
        .from(this.table)
        .where(eq(this.table.event_id, eventId))
        .groupBy(this.table.status);
      
      // Formatter le résultat
      const result = {
        total: 0,
        pending: 0,
        confirmed: 0,
        cancelled: 0
      };
      
      counts.forEach(item => {
        const count = parseInt(item.count);
        result[item.status] = count;
        result.total += count;
      });
      
      return result;
    } catch (error) {
      throw new Error(`Erreur countByEventAndStatus: ${error.message}`);
    }
  }

  /**
   * OBTENIR LES STATISTIQUES DES INSCRIPTIONS
   */
  async getStatistics() {
    try {
      // Total des inscriptions
      const total = await this.count();
      
      // Inscriptions par statut
      const byStatus = await this.db
        .select({
          status: this.table.status,
          count: sql`COUNT(*)`
        })
        .from(this.table)
        .groupBy(this.table.status);
      
      // Inscriptions des 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recent = await this.count(
        sql`${this.table.createdAt} >= ${thirtyDaysAgo}`
      );
      
      return {
        total,
        recent,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {})
      };
    } catch (error) {
      throw new Error(`Erreur getStatistics: ${error.message}`);
    }
  }

  /**
   * OBTENIR LES PROCHAINES INSCRIPTIONS D'UN UTILISATEUR
   */
  async getUpcomingForUser(userId) {
    try {
      const now = new Date();
      
      const inscriptions = await this.db
        .select({
          id: this.table.id,
          status: this.table.status,
          createdAt: this.table.createdAt,
          event: {
            id: this.eventTable.id,
            title: this.eventTable.title,
            event_date: this.eventTable.event_date,
            location: this.eventTable.location
          }
        })
        .from(this.table)
        .leftJoin(
          this.eventTable,
          eq(this.table.event_id, this.eventTable.id)
        )
        .where(
          and(
            eq(this.table.user_id, userId),
            eq(this.table.status, 'confirmed'),
            sql`${this.eventTable.event_date} >= ${now}`
          )
        )
        .orderBy(this.eventTable.event_date)
        .limit(5);
      
      return inscriptions;
    } catch (error) {
      throw new Error(`Erreur getUpcomingForUser: ${error.message}`);
    }
  }
}

module.exports = InscriptionRepository;