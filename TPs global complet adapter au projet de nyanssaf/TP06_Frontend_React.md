# TP06 - Frontend React - Configuration

## 🎯 Objectifs

- Initialiser un projet React avec Vite
- Configurer Tailwind CSS
- Mettre en place React Router
- Configurer Axios pour les appels API

**Durée estimée :** 1h30

---

## 📋 Prérequis

- TP01 à TP05 terminés (backend fonctionnel)
- Node.js installé

---

## Étape 1 : Créer le projet React

### 1.1 Initialiser avec Vite

```bash
cd onelastevent/frontend

# Créer le projet avec Vite
npm create vite@latest . -- --template react

# Installer les dépendances
npm install
```

### 1.2 Installer les dépendances supplémentaires

```bash
# Dépendances de production
npm install react-router-dom axios @tanstack/react-query react-hot-toast date-fns @headlessui/react @heroicons/react

# Dépendances de développement (Tailwind)
npm install -D tailwindcss postcss autoprefixer
```

### 1.3 Initialiser Tailwind CSS

```bash
npx tailwindcss init -p
```

---

## Étape 2 : Configurer Tailwind

### 2.1 Modifier tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Couleurs personnalisées
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#f97068', // Couleur principale
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        accent: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef', // Couleur d'accent
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        neutral: {
          950: '#0a0a0c', // Fond très sombre
        },
      },
      // Police personnalisée
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### 2.2 Créer src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
  }
  
  body {
    @apply bg-neutral-950 text-white;
    background-image: 
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(249, 112, 104, 0.15), transparent),
      radial-gradient(ellipse 60% 40% at 80% 50%, rgba(217, 70, 239, 0.08), transparent);
    min-height: 100vh;
  }

  ::selection {
    @apply bg-primary-500/30 text-white;
  }

  /* Scrollbar personnalisée */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-neutral-900;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-neutral-700 rounded-full;
  }
}

@layer components {
  /* Boutons */
  .btn {
    @apply inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-primary {
    @apply btn bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 focus:ring-primary-500 shadow-lg shadow-primary-500/25;
  }

  .btn-secondary {
    @apply btn bg-white/10 text-white hover:bg-white/20 focus:ring-white/30 backdrop-blur-sm border border-white/10;
  }

  .btn-ghost {
    @apply btn bg-transparent text-white hover:bg-white/10 focus:ring-white/20;
  }

  /* Inputs */
  .input {
    @apply w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200;
  }

  .input-error {
    @apply border-red-500 focus:border-red-500 focus:ring-red-500/20;
  }

  .label {
    @apply block text-sm font-medium text-neutral-300 mb-2;
  }

  /* Cards */
  .card {
    @apply bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden;
  }

  .card-hover {
    @apply card hover:border-white/10 hover:bg-neutral-900/70 transition-all duration-300;
  }

  .glass {
    @apply bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl;
  }

  /* Typography */
  .gradient-text {
    @apply bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400;
  }

  .section-title {
    @apply text-3xl md:text-4xl font-display font-bold tracking-tight;
  }

  .link {
    @apply text-primary-400 hover:text-primary-300 transition-colors duration-200;
  }
}
```

---

## Étape 3 : Configurer Vite

### 3.1 Modifier vite.config.js

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Proxy pour l'API backend
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

---

## Étape 4 : Créer le client HTTP (Axios)

### 4.1 Créer src/services/api.js

```javascript
import axios from 'axios';

// URL de base de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Créer une instance Axios configurée
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// INTERCEPTEUR DE REQUÊTE
// Ajoute automatiquement le token d'authentification
// ==========================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// INTERCEPTEUR DE RÉPONSE
// Gère le refresh automatique du token
// ==========================================
api.interceptors.response.use(
  // Succès : retourner la réponse telle quelle
  (response) => response,
  
  // Erreur : gérer les cas spéciaux
  async (error) => {
    const originalRequest = error.config;

    // Si erreur 401 et qu'on n'a pas encore réessayé
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          // Tenter de rafraîchir le token
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          // Stocker les nouveaux tokens
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Réessayer la requête originale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Échec du refresh : déconnecter l'utilisateur
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 4.2 Créer src/services/events.js

```javascript
import api from './api';

export const eventsService = {
  /**
   * Récupérer la liste des événements
   * @param {Object} params - Paramètres de filtrage/pagination
   */
  getEvents: async (params = {}) => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  /**
   * Récupérer un événement par ID
   * @param {string} id - ID de l'événement
   */
  getEvent: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  /**
   * Créer un événement
   * @param {Object} eventData - Données de l'événement
   */
  createEvent: async (eventData) => {
    // Utiliser FormData pour supporter l'upload d'image
    const formData = new FormData();
    Object.entries(eventData).forEach(([key, value]) => {
      if (key === 'tags' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'image' && value instanceof File) {
        formData.append(key, value);
      } else if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    const response = await api.post('/events', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Mettre à jour un événement
   * @param {string} id - ID de l'événement
   * @param {Object} eventData - Données à modifier
   */
  updateEvent: async (id, eventData) => {
    const response = await api.patch(`/events/${id}`, eventData);
    return response.data;
  },

  /**
   * Supprimer un événement
   * @param {string} id - ID de l'événement
   */
  deleteEvent: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  /**
   * Publier un événement
   * @param {string} id - ID de l'événement
   */
  publishEvent: async (id) => {
    const response = await api.post(`/events/${id}/publish`);
    return response.data;
  },

  /**
   * Récupérer mes événements (organisateur)
   * @param {Object} params - Paramètres de pagination
   */
  getMyEvents: async (params = {}) => {
    const response = await api.get('/events/my-events', { params });
    return response.data;
  },

  /**
   * S'inscrire à un événement
   * @param {string} eventId - ID de l'événement
   */
  registerForEvent: async (eventId) => {
    const response = await api.post(`/events/${eventId}/inscriptions`);
    return response.data;
  },
};

export default eventsService;
```

### 4.3 Créer src/services/users.js

```javascript
import api from './api';

export const usersService = {
  /**
   * Récupérer le profil de l'utilisateur courant
   */
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  /**
   * Mettre à jour le profil
   * @param {Object} data - Données à modifier
   */
  updateProfile: async (data) => {
    const response = await api.patch('/users/me', data);
    return response.data;
  },

  /**
   * Changer le mot de passe
   * @param {string} currentPassword - Mot de passe actuel
   * @param {string} newPassword - Nouveau mot de passe
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/users/me/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Récupérer mes inscriptions
   * @param {Object} params - Paramètres de pagination
   */
  getInscriptions: async (params = {}) => {
    const response = await api.get('/users/me/inscriptions', { params });
    return response.data;
  },

  /**
   * Annuler une inscription
   * @param {string} inscriptionId - ID de l'inscription
   */
  cancelInscription: async (inscriptionId) => {
    const response = await api.patch(`/inscriptions/${inscriptionId}/cancel`);
    return response.data;
  },
};

export default usersService;
```

---

## Étape 5 : Configurer React Query

### 5.1 Créer src/main.jsx

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Configuration de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes avant de considérer les données comme périmées
      retry: 1, // Réessayer 1 fois en cas d'échec
      refetchOnWindowFocus: false, // Ne pas recharger au focus de la fenêtre
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          {/* Notifications toast */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f1f23',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#f04438',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
```

---

## Étape 6 : Créer la structure de base

### 6.1 Créer la structure des dossiers

```bash
mkdir -p src/{components,pages,context,services}
```

### 6.2 Créer src/App.jsx

```javascript
import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy loading des pages pour optimiser le chargement
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const EventList = lazy(() => import('./pages/EventList'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const DashboardUser = lazy(() => import('./pages/DashboardUser'));
const DashboardOrganizer = lazy(() => import('./pages/DashboardOrganizer'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Routes publiques */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="events" element={<EventList />} />
          <Route path="events/:id" element={<EventDetails />} />

          {/* Routes protégées - tout utilisateur authentifié */}
          <Route element={<ProtectedRoute />}>
            <Route path="profile" element={<Profile />} />
            <Route path="dashboard" element={<DashboardUser />} />
          </Route>

          {/* Routes protégées - organisateurs uniquement */}
          <Route element={<ProtectedRoute roles={['ORGANIZER', 'ADMIN']} />}>
            <Route path="organizer" element={<DashboardOrganizer />} />
            <Route path="events/create" element={<CreateEvent />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
```

### 6.3 Créer src/components/LoadingSpinner.jsx

```javascript
function LoadingSpinner({ fullScreen = false }) {
  const spinner = (
    <div className="flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-neutral-950">
        {spinner}
      </div>
    );
  }

  return <div className="py-12">{spinner}</div>;
}

export default LoadingSpinner;
```

### 6.4 Créer src/components/Layout.jsx

```javascript
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
```

---

## Étape 7 : Tester la configuration

### 7.1 Créer une page Home temporaire

Créez `src/pages/Home.jsx` :

```javascript
function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-4">
          OneLastEvent
        </h1>
        <p className="text-neutral-400">
          Votre plateforme de gestion d'événements
        </p>
      </div>
    </div>
  );
}

export default Home;
```

### 7.2 Lancer le serveur de développement

```bash
npm run dev
```

Ouvrez http://localhost:3000 pour voir le résultat.

---

## ✅ Checklist de validation

- [ ] Le projet React est créé avec Vite
- [ ] Tailwind CSS est configuré et fonctionne
- [ ] Les services API (Axios) sont créés
- [ ] React Query est configuré
- [ ] Le routing de base fonctionne
- [ ] La page Home s'affiche correctement

---

## 🔗 Prochaine étape

Continuez avec le [TP07 - Authentification côté Frontend](./TP07_Auth_Frontend.md)
