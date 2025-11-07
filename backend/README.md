# Event App Backend (MySQL + Drizzle ORM)

Scaffold using:
- Node.js + Express (JavaScript)
- MySQL (mysql2 driver)
- Drizzle ORM for queries
- Migrations: SQL files run by scripts/run-migrations.js (Option B)

Quickstart:
1. Copy .env.example -> .env and fill values.
2. Create MySQL database: e.g. `CREATE DATABASE event_app;`
3. Install deps: `npm install`
4. Run migrations: `npm run migrate`
5. Seed admin: `npm run seed`
6. Start server: `npm run dev`
