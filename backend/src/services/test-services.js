const UserRepository = require('../repositories/UserRepository');
const AuthService = require('../services/AuthService');
const { db } = require('../config/db');
const { users } = require('../models');

async function test() {
  const userRepo = new UserRepository(db, users);
  const authService = new AuthService(userRepo);
  
  // Test inscription
  const result = await authService.register({
    name: 'test4',
    email: 'test4@example.com',
    password: 'Password123!'
  });
  
  console.log('Inscription:', result);
  
  // Test connexion
  const login = await authService.login('test4@example.com', 'Password123!');
  console.log('Connexion:', login);
}

test().catch(console.error);