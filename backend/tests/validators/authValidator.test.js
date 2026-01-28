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