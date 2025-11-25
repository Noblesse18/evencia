const BaseRepository = require('./BaseRepository');
const { eq, like, or, and, sql } = require('drizzle-orm'); 
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// bcrypt = fonction de hashage du mot de passe 


/**
 * REPOSITORY POUR LA GESTION DES UTILISATEURS
 * 
 * Hérite de BaseRepository et ajoute des méthodes spécifiques aux users
 */

class UserRepository extends BaseRepository {
    constructor(db, userTable){
        super(db, userTable);
    }

    /**
   * TROUVER UN UTILISATEUR PAR EMAIL
   * Utilisé pour : connexion, vérification d'unicité
   */
  async findByEmail(email){
    try {
        const results = await this.db
            .select()
            .from(this.table)
            .where(eq(this.table.email, email.toLowerCase()))
            .limit(1);

        return results[0] || null;
    }   catch (error) {
        throw new Error(`Erreur findByEmail: ${error.message}`);
    }
  }

  /**
   * CRÉER UN NOUVEL UTILISATEUR
   * Hash automatiquement le mot de passe
   */

  async createUser(userData){
    try {
        // Generer un UUID pour l'id 
        const userId = uuidv4();

        // hasher le mot de passe 
        const saltRounds = 10; 
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

        // Preparer les donnes 
        const userToCreate = {
            id: userId,
            name: userData.name.trim(),
            email: userData.email.toLowerCase().trim(),
            password: hashedPassword,
            role: userData.role || 'participant'
        };

        // Inserer en base
        await this.db
            .insert(this.table)
            .values(userToCreate);

        // recuper l'utilisateur cree (sans le mot de passe )
        const createdUser = await this.findById(userId);
        delete createdUser.password;

        return createdUser;
    }   catch (error) {
        // gerer l'erreur de duplicate d'email
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error('Cet email est deja utilise');
        }
        throw new Error(`Erreur createUser: ${error.message}`);
    }
  }

   /**
   * VÉRIFIER LE MOT DE PASSE D'UN UTILISATEUR
   * Retourne l'utilisateur si le mot de passe est correct, null sinon
   */

   async verifyPassword(email, password) {
    try { 
        // recuperer l'utilisateur avec son mot de passe 
        const user = await this.findByEmail(email);
        
        if (!user) {
            return null;
        }

        // verifier le mot de passe 
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid){
            return null; 
        }

        // Retourner l'utilisateur sans le mot de passe 
        delete user.password;
        return user;
    }   catch (error){
        throw new Error(`Erreur verifyPassword: ${error.message}`);
    }
   }

   /**
   * METTRE À JOUR LE MOT DE PASSE
   */
  async updatePassword(userId, newPassword){
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10); 

        await this.db
            .update(this.table)
            .set({
                password: hashedPassword,
                updatedAt: new Date()
            })
            .where(eq(this.table.id, userId));
        
        return true;
    }   catch (error) {
        throw new Error(`Erreur updatePassword: ${error.message}`);
    }
  }

   /**
   * TROUVER DES UTILISATEURS PAR RÔLE
   */
  
   async findByRole(role){
    try {
        const users = await this.db
            .select({
                id: this.table.id,
                name: this.table.name,
                email: this.table.email,
                role: this.table.role,
                createdAt: this.table.createdAt
            })
            .from(this.table)
            .where(eq(this.table.role, role));

        return users;
    }   catch (error){
        throw new Error(`Erreur findByRole: ${error.message}`);
    }
   }

   /**
   * RECHERCHER DES UTILISATEURS
   * Par nom ou email
   */

   async search(searchTerm) {
    try {
        const term = `%${searchTerm}%`;

        const users = await this.db
            .select({
                id: this.table.id,
                name: this.table.name,
                email: this.table.email,
                role: this.table.role,
                createdAt: this.table.createdAt
            })
            .from(this.table)
            .where(
                or(
                    like(this.table.name, term),
                    like(this.table.email, term)
                )
            );

            return users;
    }   catch (error){
        throw new Error(`Erreur search: ${error.message}`);
    }
   }

   /**
   * METTRE À JOUR LE PROFIL
   * Sans toucher au mot de passe
   */

   async updateProfile(userId, profileData) {
    try {
        // enlever les champs sensibles
        const { password, id, email, ...safeData } = profileData;

        await this.db
            .update(this.table)
            .set({
                ...safeData,
                updatedAt: new Date()
            })
            .where(eq(this.table.id, userId));

        return await this.findById(userId);
    }   catch (error) {
        throw new Error(`Erreur updateProfile: ${error.message}`);
    }
   }

   /**
   * OBTENIR LES STATISTIQUES DES UTILISATEURS
   */
  async getStatistics() {
    try {
        // Total des utilisateurs
        const total = await this.count();

        // Utilisateurs par role 
        const byRole = await this.db
            .select({
                role: this.table.role,
                count: sql`COUNT(*)`
            })
            .from(this.table)
            .groupBy(this.table.role);

        // Nouveaux utilisateur (30 derniers jours)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newUsers = await this.count (
            sql`${this.table.createdAt} >= ${thirtyDaysAgo}`
        );

        return {
            total,
            newUsers,
            byRole: byRole.reduce((acc, item) => {
                acc[item.role] = parseInt(item.count);
                return acc;
            }, {})
        };
    }   catch (error) {
        throw new Error(`Erreur getStatistics: ${error.message}`);
    }
  }
  /**
    * METTRE À JOUR LA DATE DE DERNIÈRE CONNEXION
    */
    async updateLastLogin(userId) {
        try {
            await this.db
            .update(this.table)
            .set({ lastLogin: new Date() })
            .where(eq(this.table.id, userId));
        return true;
        } catch (error) {
            throw new Error(`Erreur updateLastLogin: ${error.message}`);
        }
    }
    
  

  /**
   * VÉRIFIER SI UN EMAIL EST DISPONIBLE
   */

  async isEmailAvailable(email) {
    try {
        const user = await this.findByEmail(email);
        return user === null;
    } catch (error) {
        throw new Error(`Erreur isEmailAvailable: ${error.message}`);
    }
  }

  /**
   * OBTENIR LA LISTE PAGINÉE DES UTILISATEURS
   */

  async getPaginated(page = 1, limit = 10, filters = {}) {
    try {
        const offset = (page - 1) * limit;

        let query = this.db
            .select({
                id: this.table.id,
                name: this.table.name,
                email: this.table.email,
                role: this.table.role,
                createdAt: this.table.createdAt
            })
            .from(this.table);

        // appliquer les filtres
        const conditions = [];

        if (filters.role) {
            conditions.push(eq(this.table.role, filters.role));
        }

        if (filters.search) {
            const searchTerm = `%${filters.search}%`;
            conditions.push(
                or(
                    like(this.table.name, searchTerm),
                    like(this.table.email, searchTerm)
                )
            );
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        // pagination 
        query = query.limit(limit).offset(offset);

        const users = await query;
        const total = await this.count(
            conditions.length > 0 ? and(...conditions): null 
        );

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    }   catch (error) {
        throw new Error(`Erreur getPaginated: ${error.message}`);
    }
  }
}

module.exports = UserRepository;

