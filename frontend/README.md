# Evencia — Frontend Web

Application web Next.js 16 (React 19, TypeScript) pour la plateforme de gestion d'événements Evencia.

## Stack technique

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS 4** — styles utilitaires
- **Zustand 5** — gestion d'état global (authentification)
- **Framer Motion 12** — animations et transitions
- **Axios** — client HTTP avec intercepteur JWT
- **@stripe/stripe-js** — intégration paiement côté client
- **Lucide React** — icônes

## Structure

```
src/
├── app/              # Pages (App Router Next.js)
│   ├── page.tsx          # Accueil
│   ├── login/            # Connexion
│   ├── register/         # Inscription
│   ├── events/           # Liste, détail, création, édition
│   ├── dashboard/        # Tableau de bord organisateur
│   ├── admin/            # Panel administrateur
│   └── profile/          # Profil utilisateur
├── components/       # Composants React réutilisables
│   └── layout/           # Navbar, Footer
├── lib/              # API client (Axios), types TypeScript
└── store/            # Store Zustand (authStore)
```

## Lancement

```bash
npm install
npm run dev
```

L'application est accessible sur http://localhost:3000.

> En production, le frontend est conteneurisé via Docker (voir le `docker-compose.yml` à la racine).
