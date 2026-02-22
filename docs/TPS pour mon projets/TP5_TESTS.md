# TP5 - Ajouter des tests unitaires
## Durée : 2h | Niveau : ⭐⭐ Intermédiaire

---

## 🎯 Objectifs

À la fin de ce TP, tu sauras :
- Comprendre l'importance des tests unitaires
- Configurer Jest pour ton projet
- Écrire des tests pour les services
- Écrire des tests pour les validators
- Mocker les dépendances

---

## 📚 Rappel théorique

### Pourquoi tester ?

| Sans tests | Avec tests |
|------------|------------|
| "Ça marche sur ma machine" | Comportement vérifié |
| Peur de modifier le code | Refactoring serein |
| Bugs en production | Bugs détectés avant |
| Debug manuel | Erreurs précises |

### Types de tests

```
┌─────────────────────────────────────────────────────────┐
│                    Tests E2E                            │  Peu
│         (Cypress, Playwright - tout le système)         │
├─────────────────────────────────────────────────────────┤
│                Tests d'intégration                       │  Moyen
│            (API routes, base de données)                │
├─────────────────────────────────────────────────────────┤
│                  Tests Unitaires                         │  Beaucoup
│          (Services, Validators, Utils)                   │  ← CE TP
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Étapes du TP

### Étape 1 : Configurer Jest

Jest est déjà dans tes devDependencies. Vérifie avec :

```bash
cd backend
npm list jest
```

Crée le fichier de configuration `backend/jest.config.js` :

```javascript
// backend/jest.config.js
module.exports = {
  // Environnement Node.js
  testEnvironment: 'node',
  
  // Dossier des tests
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  
  // Ignorer node_modules
  testPathIgnorePatterns: ['/node_modules/'],
  
  // Couverture de code
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**',
  ],
  
  // Affichage
  verbose: true,
  
  // Variables d'environnement pour les tests
  setupFiles: ['<rootDir>/tests/setup.js'],
};
```

Crée le fichier de setup `backend/tests/setup.js` :

```javascript
// backend/tests/setup.js
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
```

Ajoute le script de test dans `backend/package.json` :

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

### Étape 2 : Structure des dossiers de tests

Crée la structure suivante :

```
backend/
├── tests/
│   ├── setup.js
│   ├── services/
│   │   ├── AuthService.test.js
│   │   └── EventService.test.js
│   ├── validators/
│   │   └── authValidator.test.js
│   └── utils/
│       └── helpers.test.js
```

---

### Étape 3 : Tester le AuthService

Crée `backend/tests/services/AuthService.test.js` :

```javascript
// backend/tests/services/AuthService.test.js
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
```

---

### Étape 4 : Tester les validators

Crée `backend/tests/validators/authValidator.test.js` :

```javascript
// backend/tests/validators/authValidator.test.js
const { validationResult } = require('express-validator');
const { validateRegister, validateLogin } = require('../../src/validators/authValidator');

// Fonction helper pour exécuter les validators
const runValidators = async (validators, body) => {
  const req = { body };
  const res = {};
  
  for (const validator of validators) {
    if (typeof validator === 'function' && validator.length === 3) {
      // C'est un middleware (handleValidationErrors)
      continue;
    }
    await validator.run(req);
  }
  
  return validationResult(req);
};

describe('Auth Validators', () => {
  describe('validateRegister', () => {
    test('devrait accepter des données valides', async () => {
      const body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
      };

      const result = await runValidators(validateRegister, body);
      expect(result.isEmpty()).toBe(true);
    });

    test('devrait rejeter un nom vide', async () => {
      const body = {
        name: '',
        email: 'john@example.com',
        password: 'Password123',
      };

      const result = await runValidators(validateRegister, body);
      expect(result.isEmpty()).toBe(false);
      
      const errors = result.array();
      expect(errors.some(e => e.path === 'name')).toBe(true);
    });

    test('devrait rejeter un email invalide', async () => {
      const body = {
        name: 'John Doe',
        email: 'not-an-email',
        password: 'Password123',
      };

      const result = await runValidators(validateRegister, body);
      expect(result.isEmpty()).toBe(false);
      
      const errors = result.array();
      expect(errors.some(e => e.path === 'email')).toBe(true);
    });

    test('devrait rejeter un mot de passe faible', async () => {
      const body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weak', // Trop court, pas de majuscule, pas de chiffre
      };

      const result = await runValidators(validateRegister, body);
      expect(result.isEmpty()).toBe(false);
      
      const errors = result.array();
      expect(errors.some(e => e.path === 'password')).toBe(true);
    });

    test('devrait rejeter un rôle invalide', async () => {
      const body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        role: 'superadmin', // Rôle non autorisé
      };

      const result = await runValidators(validateRegister, body);
      expect(result.isEmpty()).toBe(false);
    });

    test('devrait accepter un rôle valide', async () => {
      const body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        role: 'organizer',
      };

      const result = await runValidators(validateRegister, body);
      expect(result.isEmpty()).toBe(true);
    });
  });

  describe('validateLogin', () => {
    test('devrait accepter des données valides', async () => {
      const body = {
        email: 'john@example.com',
        password: 'anypassword',
      };

      const result = await runValidators(validateLogin, body);
      expect(result.isEmpty()).toBe(true);
    });

    test('devrait rejeter un email vide', async () => {
      const body = {
        email: '',
        password: 'password',
      };

      const result = await runValidators(validateLogin, body);
      expect(result.isEmpty()).toBe(false);
    });

    test('devrait rejeter un mot de passe vide', async () => {
      const body = {
        email: 'john@example.com',
        password: '',
      };

      const result = await runValidators(validateLogin, body);
      expect(result.isEmpty()).toBe(false);
    });
  });
});
```

---

### Étape 5 : Exécuter les tests

```bash
cd backend

# Exécuter tous les tests
npm test

# Exécuter en mode watch (relance auto)
npm run test:watch

# Voir la couverture de code
npm run test:coverage
```

Tu devrais voir :

```
 PASS  tests/services/AuthService.test.js
  AuthService
    validateRegistrationData
      ✓ devrait accepter des données valides (2 ms)
      ✓ devrait rejeter un nom trop court (1 ms)
      ✓ devrait rejeter un email invalide (1 ms)
      ...
    register
      ✓ devrait créer un utilisateur avec des données valides (5 ms)
      ✓ devrait rejeter si l'email existe déjà (2 ms)
    ...

Test Suites: 2 passed, 2 total
Tests:       15 passed, 15 total
```

---

### Étape 6 : Comprendre les mocks

Les **mocks** permettent de simuler des dépendances :

```javascript
// Créer un mock de repository
const mockUserRepository = {
  findByEmail: jest.fn(), // Fonction mock
};

// Configurer le comportement
mockUserRepository.findByEmail.mockResolvedValue(null); // Retourne null

// Vérifier les appels
expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@test.com');
expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(1);
```

---

## ✅ Checklist de validation

- [ ] `jest.config.js` est créé
- [ ] `tests/setup.js` configure l'environnement
- [ ] Les tests du AuthService passent
- [ ] Les tests des validators passent
- [ ] `npm test` s'exécute sans erreur
- [ ] La couverture est > 50%

---

## 📝 Ce que tu as appris

1. **Jest** est le framework de test standard pour Node.js
2. **describe/test** organisent les tests en groupes logiques
3. **expect** vérifie les résultats attendus
4. **Les mocks** simulent les dépendances externes
5. **La couverture** montre quelles parties du code sont testées

---

## 🎯 Matchers Jest utiles

| Matcher | Usage |
|---------|-------|
| `toBe(value)` | Égalité stricte (===) |
| `toEqual(obj)` | Égalité profonde (objets) |
| `toBeTruthy()` | Valeur "truthy" |
| `toBeFalsy()` | Valeur "falsy" |
| `toThrow(message)` | Lance une erreur |
| `toContain(item)` | Contient un élément |
| `toHaveBeenCalled()` | Fonction appelée |
| `toHaveBeenCalledWith(args)` | Appelée avec ces arguments |

---

## ➡️ Étape suivante

Passe au [TP6 - Créer la page mot de passe oublié](./TP6_FORGOT_PASSWORD.md) pour compléter le parcours utilisateur.
