// Configuration OpenAPI 3.0 pour Swagger UI - API Evencia

const PORT = process.env.PORT || 5000;
const basePath = '/api';

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'API Evencia',
    description: 'Documentation de l\'API REST Evencia (événements, inscriptions, authentification)',
    version: '1.0.0',
  },
  servers: [
    { url: `http://localhost:${PORT}${basePath}`, description: 'Serveur local' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentification et inscription' },
    { name: 'Users', description: 'Utilisateurs' },
    { name: 'Events', description: 'Événements' },
    { name: 'Inscriptions', description: 'Inscriptions aux événements' },
    { name: 'Payments', description: 'Paiements (Stripe)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenu via POST /api/auth/login',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['participant', 'organizer', 'admin'] },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Event: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          location: { type: 'string' },
          event_date: { type: 'string', format: 'date-time' },
          price: { type: 'number', nullable: true },
          category_id: { type: 'string', format: 'uuid', nullable: true },
          organizer_id: { type: 'string', format: 'uuid' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Inscription: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          event_id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          status: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 12 },
          role: { type: 'string', enum: ['participant', 'organizer', 'admin'] },
        },
      },
      CreateInscriptionRequest: {
        type: 'object',
        required: ['event_id'],
        properties: {
          event_id: { type: 'string', format: 'uuid' },
        },
      },
    },
  },
  paths: {
    // --- Auth ---
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Inscription',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: { description: 'Utilisateur créé', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' }, token: { type: 'string' } } } } } },
          400: { description: 'Validation ou email déjà utilisé' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Connexion',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Token JWT et utilisateur', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' }, token: { type: 'string' } } } } } },
          401: { description: 'Identifiants invalides' },
        },
      },
    },
    '/auth/verify': {
      get: {
        tags: ['Auth'],
        summary: 'Vérifier le token',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Token valide', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } },
          401: { description: 'Token invalide ou expiré' },
        },
      },
    },
    '/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Changer le mot de passe (connecté)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['oldPassword', 'newPassword', 'confirmPassword'],
                properties: {
                  oldPassword: { type: 'string' },
                  newPassword: { type: 'string' },
                  confirmPassword: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Mot de passe modifié' },
          400: { description: 'Erreur de validation' },
          401: { description: 'Non authentifié' },
        },
      },
    },
    '/auth/request-password-reset': {
      post: {
        tags: ['Auth'],
        summary: 'Demander une réinitialisation de mot de passe',
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } },
            },
          },
        },
        responses: {
          200: { description: 'Email envoyé si le compte existe' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Réinitialiser le mot de passe (avec token du mail)',
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { email: { type: 'string' }, token: { type: 'string' }, newPassword: { type: 'string' } } },
            },
          },
        },
        responses: {
          200: { description: 'Mot de passe réinitialisé' },
          400: { description: 'Token invalide ou expiré' },
        },
      },
    },
    // --- Users ---
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Mon profil',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Profil', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: { description: 'Non authentifié' },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Modifier mon profil',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { name: { type: 'string' } } },
            },
          },
        },
        responses: {
          200: { description: 'Profil mis à jour' },
          401: { description: 'Non authentifié' },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'Liste des utilisateurs (admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Liste des utilisateurs' },
          401: { description: 'Non authentifié' },
          403: { description: 'Rôle insuffisant' },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Détail utilisateur par ID (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Utilisateur' },
          401: { description: 'Non authentifié' },
          403: { description: 'Rôle insuffisant' },
          404: { description: 'Utilisateur non trouvé' },
        },
      },
    },
    // --- Events ---
    '/events/categories': {
      get: {
        tags: ['Events'],
        summary: 'Liste des catégories',
        responses: {
          200: { description: 'Liste des catégories' },
        },
      },
    },
    '/events': {
      get: {
        tags: ['Events'],
        summary: 'Liste des événements (pagination)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'events + pagination' },
        },
      },
      post: {
        tags: ['Events'],
        summary: 'Créer un événement (organizer/admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'location', 'event_date'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  location: { type: 'string' },
                  event_date: { type: 'string', format: 'date-time' },
                  price: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Événement créé' },
          400: { description: 'Validation' },
          401: { description: 'Non authentifié' },
          403: { description: 'Rôle insuffisant' },
        },
      },
    },
    '/events/organizer/my-events': {
      get: {
        tags: ['Events'],
        summary: 'Mes événements (organizer/admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Liste des événements de l\'organisateur' },
          401: { description: 'Non authentifié' },
          403: { description: 'Rôle insuffisant' },
        },
      },
    },
    '/events/{id}': {
      get: {
        tags: ['Events'],
        summary: 'Détail d\'un événement',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Événement' },
          404: { description: 'Non trouvé' },
        },
      },
      put: {
        tags: ['Events'],
        summary: 'Modifier un événement (organizer/admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  location: { type: 'string' },
                  event_date: { type: 'string', format: 'date-time' },
                  price: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Événement mis à jour' },
          401: { description: 'Non authentifié' },
          403: { description: 'Rôle insuffisant' },
          404: { description: 'Non trouvé' },
        },
      },
      delete: {
        tags: ['Events'],
        summary: 'Supprimer un événement (organizer/admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Événement supprimé' },
          401: { description: 'Non authentifié' },
          403: { description: 'Rôle insuffisant' },
          404: { description: 'Non trouvé' },
        },
      },
    },
    // --- Inscriptions ---
    '/inscriptions/my': {
      get: {
        tags: ['Inscriptions'],
        summary: 'Mes inscriptions',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Liste des inscriptions de l\'utilisateur' },
          401: { description: 'Non authentifié' },
        },
      },
    },
    '/inscriptions': {
      post: {
        tags: ['Inscriptions'],
        summary: 'S\'inscrire à un événement',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateInscriptionRequest' },
            },
          },
        },
        responses: {
          201: { description: 'Inscription créée' },
          400: { description: 'Déjà inscrit ou validation' },
          401: { description: 'Non authentifié' },
          404: { description: 'Événement non trouvé' },
        },
      },
    },
    '/inscriptions/{id}': {
      delete: {
        tags: ['Inscriptions'],
        summary: 'Annuler une inscription',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { reason: { type: 'string' } } },
            },
          },
        },
        responses: {
          200: { description: 'Inscription annulée' },
          401: { description: 'Non authentifié' },
          403: { description: 'Non autorisé' },
          404: { description: 'Inscription non trouvée' },
        },
      },
    },
    // --- Payments ---
    '/payments': {
      post: {
        tags: ['Payments'],
        summary: 'Créer une intention de paiement (Stripe)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { amount: { type: 'number' }, event_id: { type: 'string' }, inscription_id: { type: 'string' } } },
            },
          },
        },
        responses: {
          200: { description: 'Client secret Stripe' },
          401: { description: 'Non authentifié' },
        },
      },
    },
  },
};
