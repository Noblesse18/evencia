module.exports = {

    // Environnement Node.js
    testEnvironment: 'node',

    // Dossier des tests
    testMatch: ['**/_tests_/**/*.test.js', '**/*.test.js'],

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

