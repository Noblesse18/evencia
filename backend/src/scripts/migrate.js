const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function runMigrations() {
  console.log('🚀 Début des migrations...\n');

  // 1) Localiser le fichier
  const migrationPath = path.join(__dirname, '../../migrations/001_create_tables.sql');
  console.log('📂 Fichier de migration :', migrationPath);

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Fichier introuvable. Vérifie le chemin ci-dessus.');
    process.exit(1);
  }

  try {
    // 2) Lire le SQL
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 3) Découper en requêtes (naïf mais suffisant si tu n’as pas de procédures/DELIMITER)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📊 ${statements.length} requête(s) détectée(s)\n`);

    // 4) Exécuter séquentiellement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`⏳ Exécution ${i + 1}/${statements.length}...`);
      try {
        await pool.query(stmt); // pour DDL, query va bien
        console.log(`✅ OK (${i + 1})`);
      } catch (e) {
        console.error(`❌ Erreur sur la requête ${i + 1}: ${e.message}`);
        console.error('🧩 Extrait:', stmt.slice(0, 200) + (stmt.length > 200 ? '...' : ''));
        throw e; // stoppe tout: une migration doit être atomique au mieux
      }
    }

    console.log('\n✅ Migrations terminées avec succès !');
  } catch (err) {
    console.error('\n❌ Erreur lors des migrations :', err);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('🔌 Connexions libérées');
  }
}

// Exécution directe
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
