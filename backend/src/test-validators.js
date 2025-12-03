// test-validators.js
const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = 'http://localhost:5000/api';

const tests = [
  {
    name: '✅ Register avec données valides',
    method: 'POST',
    url: '/auth/register',
    data: {
      name: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      password: 'Password123',
      role: 'participant'
    },
    expectStatus: [200, 201],
    expectError: false
  },
  {
    name: '❌ Register avec email invalide',
    method: 'POST',
    url: '/auth/register',
    data: {
      name: 'Jean Dupont',
      email: 'email-invalide',
      password: 'Password123'
    },
    expectStatus: [400],
    expectError: true,
    expectErrorField: 'email'
  },
  {
    name: '❌ Register avec mot de passe faible',
    method: 'POST',
    url: '/auth/register',
    data: {
      name: 'Jean Dupont',
      email: 'jean@example.com',
      password: 'faible'
    },
    expectStatus: [400],
    expectError: true,
    expectErrorField: 'password'
  },
  {
    name: '❌ Register avec nom trop court',
    method: 'POST',
    url: '/auth/register',
    data: {
      name: 'J',
      email: 'jean@example.com',
      password: 'Password123'
    },
    expectStatus: [400],
    expectError: true,
    expectErrorField: 'name'
  },
  {
    name: '❌ Register avec email temporaire',
    method: 'POST',
    url: '/auth/register',
    data: {
      name: 'Jean Dupont',
      email: 'test@tempmail.com',
      password: 'Password123'
    },
    expectStatus: [400],
    expectError: true,
    expectErrorField: 'email'
  },
  {
    name: '❌ Login sans email',
    method: 'POST',
    url: '/auth/login',
    data: {
      password: 'Password123'
    },
    expectStatus: [400],
    expectError: true,
    expectErrorField: 'email'
  },
  {
    name: '❌ Change password - nouveau = ancien',
    method: 'POST',
    url: '/auth/change-password',
    data: {
      oldPassword: 'Password123',
      newPassword: 'Password123',
      confirmPassword: 'Password123'
    },
    expectStatus: [400],
    expectError: true,
    expectErrorField: 'newPassword'
  }
];

async function runTests() {
  console.log(chalk.bold.blue('\n🧪 Démarrage des tests de validation...\n'));
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const response = await axios({
        method: test.method,
        url: BASE_URL + test.url,
        data: test.data,
        validateStatus: () => true // Accepter tous les status
      });
      
      // Vérifier le status
      const statusOk = test.expectStatus.includes(response.status);
      
      // Vérifier les erreurs
      let errorOk = true;
      if (test.expectError) {
        errorOk = response.data.message === 'Erreurs de validation' &&
                  Array.isArray(response.data.errors);
        
        if (test.expectErrorField && errorOk) {
          errorOk = response.data.errors.some(e => e.field === test.expectErrorField);
        }
      }
      
      if (statusOk && errorOk) {
        console.log(chalk.green(`✓ ${test.name}`));
        passed++;
      } else {
        console.log(chalk.red(`✗ ${test.name}`));
        console.log(chalk.gray(`  Status: ${response.status}, Attendu: ${test.expectStatus}`));
        console.log(chalk.gray(`  Response:`, JSON.stringify(response.data, null, 2)));
        failed++;
      }
      
    } catch (error) {
      console.log(chalk.red(`✗ ${test.name}`));
      console.log(chalk.gray(`  Erreur: ${error.message}`));
      failed++;
    }
  }
  
  console.log(chalk.bold.blue('\n📊 Résultats:'));
  console.log(chalk.green(`  ✓ Réussis: ${passed}`));
  console.log(chalk.red(`  ✗ Échoués: ${failed}`));
  console.log(chalk.blue(`  Total: ${passed + failed}\n`));
}

// Exécuter les tests
runTests().catch(console.error);
