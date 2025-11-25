const { eq, sql } = require('drizzle-orm');

/**
 * CLASSE DE BASE POUR TOUS LES REPOSITORIES
 *
 * Cette classe contient les opérations CRUD communes à toutes les tables.
 * Les autres repositories héritent de cette classe.
 *
 * CRUD = Create, Read, Update, Delete
 */
class BaseRepository {
    /**
     * Constructeur
     * @param {Object} db - Instance Drizzle (connexion DB)
     * @param {Object} table - Schéma de la table (depuis models)
     */
    constructor(db, table) {
        this.db = db;
        this.table = table;
    }

    /**
     * RÉCUPÉRER TOUS LES ENREGISTREMENTS
     * Équivalent SQL : SELECT * FROM table
     * @param {Object} options - Options de pagination et tri
     * @param {number} options.limit - Nombre maximum d'enregistrements
     * @param {number} options.offset - Décalage pour la pagination
     * @param {Array} options.orderBy - Critères de tri
     * @returns {Promise<Array>} Liste des enregistrements
     */
    async findAll(options = {}) {
        try {
            let query = this.db.select().from(this.table);

            if (options.limit) {
                query = query.limit(options.limit);
            }

            if (options.offset) {
                query = query.offset(options.offset);
            }

            if (options.orderBy) {
                query = query.orderBy(options.orderBy);
            }

            const results = await query;
            return results;
        } catch (error) {
            throw new Error(`Erreur findAll: ${error.message}`);
        }
    }

    /**
     * RÉCUPÉRER UN ENREGISTREMENT PAR ID
     * Équivalent SQL : SELECT * FROM table WHERE id = ?
     * @param {number|string} id - Identifiant de l'enregistrement
     * @returns {Promise<Object|null>} L'enregistrement ou null
     */
    async findById(id) {
        try {
            const results = await this.db
                .select()
                .from(this.table)
                .where(eq(this.table.id, id))
                .limit(1);

            return results[0] || null;
        } catch (error) {
            throw new Error(`Erreur findById: ${error.message}`);
        }
    }

    /**
     * CRÉER UN NOUVEL ENREGISTREMENT
     * Équivalent SQL : INSERT INTO table VALUES (...)
     * @param {Object} data - Données à insérer
     * @returns {Promise<Object>} L'enregistrement créé
     */
    async create(data) {
        try {
            await this.db
                .insert(this.table)
                .values(data);

            if (data.id) {
                return await this.findById(data.id);
            }
            return data;
        } catch (error) {
            throw new Error(`Erreur create: ${error.message}`);
        }
    }

    /**
     * METTRE À JOUR UN ENREGISTREMENT
     * Équivalent SQL : UPDATE table SET ... WHERE id = ?
     * @param {number|string} id - Identifiant de l'enregistrement
     * @param {Object} data - Données à mettre à jour
     * @returns {Promise<Object|null>} L'enregistrement mis à jour
     */
    async update(id, data) {
        try {
            const { id: _, ...updateData } = data;

            await this.db
                .update(this.table)
                .set(updateData)
                .where(eq(this.table.id, id));

            return await this.findById(id);
        } catch (error) {
            throw new Error(`Erreur update: ${error.message}`);
        }
    }

    /**
     * SUPPRIMER UN ENREGISTREMENT
     * Équivalent SQL : DELETE FROM table WHERE id = ?
     * @param {number|string} id - Identifiant de l'enregistrement
     * @returns {Promise<boolean>} True si la suppression a réussi
     */
    async delete(id) {
        try {
            const result = await this.db
                .delete(this.table)
                .where(eq(this.table.id, id));

            return result.count > 0;
        } catch (error) {
            throw new Error(`Erreur delete: ${error.message}`);
        }
    }

    /**
     * COMPTER LE NOMBRE D'ENREGISTREMENTS
     * Équivalent SQL : SELECT COUNT(*) FROM table
     * @param {Object|null} conditions - Conditions de filtrage
     * @returns {Promise<number>} Nombre d'enregistrements
     */
    async count(conditions = null) {
        try {
            let query = this.db
                .select({ count: sql`COUNT(*)` })
                .from(this.table);

            if (conditions) {
                query = query.where(conditions);
            }

            const result = await query;
            return parseInt(result[0]?.count || 0);
        } catch (error) {
            throw new Error(`Erreur count: ${error.message}`);
        }
    }

    /**
     * VÉRIFIER SI UN ENREGISTREMENT EXISTE
     * @param {number|string} id - Identifiant de l'enregistrement
     * @returns {Promise<boolean>} True si l'enregistrement existe
     */
    async exists(id) {
        try {
            const result = await this.db
                .select({ exists: sql`1` })
                .from(this.table)
                .where(eq(this.table.id, id))
                .limit(1);

            return result.length > 0;
        } catch (error) {
            throw new Error(`Erreur exists: ${error.message}`);
        }
    }

    /**
     * EXÉCUTER UNE TRANSACTION
     * Pour les opérations qui doivent toutes réussir ou toutes échouer
     * @param {Function} callback - Fonction à exécuter dans la transaction
     * @returns {Promise<any>} Résultat de la transaction
     */
    async transaction(callback) {
        try {
            return await this.db.transaction(async (tx) => {
                return await callback(tx);
            });
        } catch (error) {
            throw new Error(`Erreur transaction: ${error.message}`);
        }
    }
}

module.exports = BaseRepository;
