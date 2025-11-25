// test-repositories.js
const { db } = require('../config/db');
const { users } = require('../models/schemas/userSchema');
const UserRepository = require('./UserRepository');

async function test() {
  const userRepo = new UserRepository(db, users);
  
  // Test création
  const newUser = await userRepo.createUser({
    name: 'Test',
    email: 'test@example.com',
    password: 'Password1234'
  });
  console.log('Utilisateur créé:', newUser);
  
  // Test recherche
  const found = await userRepo.findByEmail('test@example.com');
  console.log('Utilisateur trouvé:', found);
}

test().catch(console.error);
