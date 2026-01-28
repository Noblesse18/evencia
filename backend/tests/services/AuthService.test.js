const AuthService = require('../../src/services/AuthService');

describe('AuthService', () => {
  let authService;
  let mockUserRepository;

  // Avant chaque test, créer un nouveau service avec des mocks
  beforeEach(() => {
    // Mock du repository
    mockUserRepository = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
      findById: jest.fn(),
      verifyPassword: jest.fn(),
      updateLastLogin: jest.fn(),
    };

    // Créer le service avec le mock
    authService = new AuthService(mockUserRepository);
  });

  // Nettoyer après chaque test
  afterEach(() => {
    jest.clearAllMocks();
  });

  // =============================================
  // Tests de validateRegistrationData
  // =============================================
  describe('validateRegistrationData', () => {
    test('devrait accepter des données valides', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
      };

      // Ne devrait pas lancer d'erreur
      expect(() => {
        authService.validateRegistrationData(validData);
      }).not.toThrow();
    });

    test('devrait rejeter un nom trop court', () => {
      const invalidData = {
        name: 'J', // 1 caractère
        email: 'john@example.com',
        password: 'Password123',
      };

      expect(() => {
        authService.validateRegistrationData(invalidData);
      }).toThrow('Le nom doit contenir au moins 2 caractères');
    });

    test('devrait rejeter un email invalide', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'not-an-email',
        password: 'Password123',
      };

      expect(() => {
        authService.validateRegistrationData(invalidData);
      }).toThrow("L'email n'est pas valide");
    });

    test('devrait rejeter un mot de passe sans majuscule', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123', // pas de majuscule
      };

      expect(() => {
        authService.validateRegistrationData(invalidData);
      }).toThrow('majuscule');
    });

    test('devrait rejeter un mot de passe trop court', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Pass1', // 5 caractères
      };

      expect(() => {
        authService.validateRegistrationData(invalidData);
      }).toThrow('au moins 8 caractères');
    });
  });

  // =============================================
  // Tests de isValidEmail
  // =============================================
  describe('isValidEmail', () => {
    test('devrait accepter un email valide', () => {
      expect(authService.isValidEmail('test@example.com')).toBe(true);
      expect(authService.isValidEmail('user.name@domain.org')).toBe(true);
      expect(authService.isValidEmail('user+tag@gmail.com')).toBe(true);
    });

    test('devrait rejeter un email invalide', () => {
      expect(authService.isValidEmail('not-an-email')).toBe(false);
      expect(authService.isValidEmail('missing@domain')).toBe(false);
      expect(authService.isValidEmail('@nodomain.com')).toBe(false);
      expect(authService.isValidEmail('spaces in@email.com')).toBe(false);
    });
  });

  // =============================================
  // Tests de validatePassword
  // =============================================
  describe('validatePassword', () => {
    test('devrait accepter un mot de passe valide', () => {
      expect(() => {
        authService.validatePassword('Password123');
      }).not.toThrow();
    });

    test('devrait rejeter un mot de passe sans chiffre', () => {
      expect(() => {
        authService.validatePassword('PasswordABC');
      }).toThrow('chiffre');
    });

    test('devrait rejeter un mot de passe sans minuscule', () => {
      expect(() => {
        authService.validatePassword('PASSWORD123');
      }).toThrow('minuscule');
    });
  });

  // =============================================
  // Tests de register (avec mocks)
  // =============================================
  describe('register', () => {
    test('devrait créer un utilisateur avec des données valides', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
      };

      // Configurer les mocks
      mockUserRepository.findByEmail.mockResolvedValue(null); // Email non utilisé
      mockUserRepository.createUser.mockResolvedValue({
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'participant',
      });

      const result = await authService.register(userData);

      expect(result.success).toBe(true);
      expect(result.user.email).toBe('john@example.com');
      expect(result.token).toBeDefined();
      expect(mockUserRepository.createUser).toHaveBeenCalled();
    });

    test('devrait rejeter si l\'email existe déjà', async () => {
      const userData = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'Password123',
      };

      // Simuler un email existant
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: 'existing@example.com',
      });

      await expect(authService.register(userData)).rejects.toThrow('existe deja');
    });
  });

  // =============================================
  // Tests de login (avec mocks)
  // =============================================
  describe('login', () => {
    test('devrait connecter un utilisateur avec des identifiants valides', async () => {
      mockUserRepository.verifyPassword.mockResolvedValue({
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'participant',
      });
      mockUserRepository.updateLastLogin.mockResolvedValue(true);

      const result = await authService.login('john@example.com', 'Password123');

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith('user-123');
    });

    test('devrait rejeter des identifiants invalides', async () => {
      mockUserRepository.verifyPassword.mockResolvedValue(null);

      await expect(
        authService.login('wrong@example.com', 'wrongpassword')
      ).rejects.toThrow('incorrect');
    });

    test('devrait rejeter si email manquant', async () => {
      await expect(authService.login('', 'Password123')).rejects.toThrow('requis');
    });
  });

  // =============================================
  // Tests de verifyToken
  // =============================================
  describe('verifyToken', () => {
    test('devrait valider un token correct', () => {
      // Créer un token valide
      const user = { id: 'user-123', email: 'test@test.com', role: 'participant' };
      const token = authService.generateToken(user);

      const result = authService.verifyToken(token);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user-123');
    });

    test('devrait rejeter un token invalide', () => {
      expect(() => {
        authService.verifyToken('invalid-token');
      }).toThrow('invalide');
    });

    test('devrait rejeter si token manquant', () => {
      expect(() => {
        authService.verifyToken(null);
      }).toThrow('manquant');
    });
  });
});
