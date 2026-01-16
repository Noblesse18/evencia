# TP07 - Authentification côté Frontend

## 🎯 Objectifs

- Créer un Context React pour l'authentification
- Implémenter le hook personnalisé `useAuth()`
- Créer les pages Login et Register
- Protéger les routes avec un composant ProtectedRoute

**Durée estimée :** 2 heures

---

## 📋 Prérequis

- TP06 terminé
- Backend fonctionnel avec les endpoints d'auth

---

## Comprendre le Context React

### Qu'est-ce que le Context ?

Le Context permet de partager des données entre composants sans passer par les props à chaque niveau. C'est idéal pour des données globales comme l'authentification.

```
         ┌──────────────────┐
         │   AuthProvider   │  ← Fournit user, login, logout...
         └────────┬─────────┘
                  │
     ┌────────────┼────────────┐
     │            │            │
┌────▼────┐  ┌────▼────┐  ┌────▼────┐
│  Header │  │  Page   │  │ Footer  │
│ useAuth │  │ useAuth │  │         │
└─────────┘  └─────────┘  └─────────┘
```

---

## Étape 1 : Créer le Context d'Authentification

### 1.1 Créer src/context/AuthContext.jsx

```javascript
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

// Créer le Context
const AuthContext = createContext(null);

/**
 * Provider d'authentification
 * Enveloppe l'application et fournit l'état d'auth
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ==========================================
  // INITIALISATION - Vérifier la session existante
  // ==========================================
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken && refreshToken) {
        try {
          // Tenter de récupérer l'utilisateur courant
          const response = await api.get('/auth/me');
          setUser(response.data.user);
        } catch (error) {
          // Si le token est expiré, essayer de le rafraîchir
          try {
            const refreshResponse = await api.post('/auth/refresh', { refreshToken });
            localStorage.setItem('accessToken', refreshResponse.data.accessToken);
            localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
            
            // Réessayer de récupérer l'utilisateur
            const response = await api.get('/auth/me');
            setUser(response.data.user);
          } catch {
            // Échec total : nettoyer les tokens
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // ==========================================
  // CONNEXION
  // ==========================================
  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data;

      // Stocker les tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Mettre à jour l'état
      setUser(user);

      toast.success(`Bienvenue, ${user.fullName} !`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Échec de la connexion';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // ==========================================
  // INSCRIPTION
  // ==========================================
  const register = useCallback(async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user, accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);

      toast.success('Inscription réussie ! Bienvenue sur OneLastEvent !');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Échec de l\'inscription';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // ==========================================
  // DÉCONNEXION
  // ==========================================
  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignorer les erreurs de logout
    } finally {
      // Toujours nettoyer côté client
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      toast.success('Déconnexion réussie');
      navigate('/');
    }
  }, [navigate]);

  // ==========================================
  // MISE À JOUR LOCALE DE L'UTILISATEUR
  // ==========================================
  const updateUser = useCallback((updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  // Valeur du Context
  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isOrganizer: user?.role === 'ORGANIZER' || user?.role === 'ADMIN',
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook personnalisé pour accéder au Context d'auth
 * @returns {Object} État et actions d'authentification
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
```

---

## Étape 2 : Créer le composant ProtectedRoute

### 2.1 Créer src/components/ProtectedRoute.jsx

```javascript
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Composant de protection des routes
 * Redirige vers /login si non authentifié
 * Vérifie les rôles si spécifiés
 * 
 * @param {string[]} roles - Rôles autorisés (optionnel)
 */
function ProtectedRoute({ roles = [] }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Attendre le chargement initial
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // Rediriger si non authentifié
  if (!isAuthenticated) {
    // Sauvegarder l'URL d'origine pour y revenir après login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier les rôles si spécifiés
  if (roles.length > 0 && user && !roles.includes(user.role)) {
    // Pas le bon rôle : rediriger vers l'accueil
    return <Navigate to="/" replace />;
  }

  // Tout est OK : afficher le contenu protégé
  return <Outlet />;
}

export default ProtectedRoute;
```

---

## Étape 3 : Créer la page Login

### 3.1 Créer src/pages/Login.jsx

```javascript
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

function Login() {
  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Hooks
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // URL de redirection après login
  const from = location.state?.from?.pathname || '/';

  // Validation côté client
  const validate = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email invalide';
    }
    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            Bienvenue
          </h1>
          <p className="text-neutral-400">
            Connectez-vous pour continuer
          </p>
        </div>

        {/* Formulaire */}
        <div className="glass p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="vous@exemple.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="label">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Lien vers inscription */}
          <div className="mt-6 text-center">
            <p className="text-neutral-400 text-sm">
              Pas encore de compte ?{' '}
              <Link to="/register" className="link">
                S'inscrire
              </Link>
            </p>
          </div>
        </div>

        {/* Comptes de démo */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-sm text-neutral-400 mb-2">Comptes de test :</p>
          <div className="space-y-1 text-sm font-mono">
            <p className="text-neutral-300">admin@onelastevent.com / Admin123!</p>
            <p className="text-neutral-300">organizer1@example.com / Organizer1!</p>
            <p className="text-neutral-300">user1@example.com / User1234!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
```

---

## Étape 4 : Créer la page Register

### 4.1 Créer src/pages/Register.jsx

```javascript
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/react/24/outline';

function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { register } = useAuth();
  const navigate = useNavigate();

  // Validation du mot de passe
  const passwordRequirements = [
    { label: 'Au moins 8 caractères', test: (p) => p.length >= 8 },
    { label: 'Une majuscule', test: (p) => /[A-Z]/.test(p) },
    { label: 'Une minuscule', test: (p) => /[a-z]/.test(p) },
    { label: 'Un chiffre', test: (p) => /\d/.test(p) },
    { label: 'Un caractère spécial', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.fullName || formData.fullName.length < 2) {
      newErrors.fullName = 'Le nom doit faire au moins 2 caractères';
    }
    
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (!passwordRequirements.every((req) => req.test(formData.password))) {
      newErrors.password = 'Le mot de passe ne respecte pas les critères';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await register({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });
    setLoading(false);

    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            Créer un compte
          </h1>
          <p className="text-neutral-400">
            Rejoignez OneLastEvent gratuitement
          </p>
        </div>

        {/* Formulaire */}
        <div className="glass p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nom complet */}
            <div>
              <label htmlFor="fullName" className="label">
                Nom complet
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className={`input ${errors.fullName ? 'input-error' : ''}`}
                placeholder="Jean Dupont"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-400">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="vous@exemple.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="label">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {/* Indicateurs de force du mot de passe */}
              <div className="mt-2 space-y-1">
                {passwordRequirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <CheckIcon
                      className={`w-4 h-4 ${
                        req.test(formData.password)
                          ? 'text-green-500'
                          : 'text-neutral-600'
                      }`}
                    />
                    <span
                      className={
                        req.test(formData.password)
                          ? 'text-green-500'
                          : 'text-neutral-500'
                      }
                    >
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Choix du rôle */}
            <div>
              <label className="label">Je souhaite</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, role: 'USER' }))}
                  className={`p-3 rounded-xl border text-sm transition-all ${
                    formData.role === 'USER'
                      ? 'border-primary-500 bg-primary-500/10 text-white'
                      : 'border-white/10 bg-white/5 text-neutral-400 hover:border-white/20'
                  }`}
                >
                  Participer à des événements
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, role: 'ORGANIZER' }))}
                  className={`p-3 rounded-xl border text-sm transition-all ${
                    formData.role === 'ORGANIZER'
                      ? 'border-primary-500 bg-primary-500/10 text-white'
                      : 'border-white/10 bg-white/5 text-neutral-400 hover:border-white/20'
                  }`}
                >
                  Organiser des événements
                </button>
              </div>
            </div>

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          {/* Lien vers connexion */}
          <div className="mt-6 text-center">
            <p className="text-neutral-400 text-sm">
              Déjà un compte ?{' '}
              <Link to="/login" className="link">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
```

---

## Étape 5 : Créer le Header avec état d'authentification

### 5.1 Créer src/components/Header.jsx

```javascript
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  CalendarIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { user, isAuthenticated, isOrganizer, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-neutral-950/80 backdrop-blur-xl">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-display font-bold gradient-text">
              OneLastEvent
            </span>
          </Link>

          {/* Navigation desktop */}
          <div className="hidden md:flex md:items-center md:gap-6">
            <Link to="/events" className="text-neutral-300 hover:text-white transition-colors">
              Événements
            </Link>

            {isAuthenticated ? (
              <>
                {isOrganizer && (
                  <Link
                    to="/events/create"
                    className="btn-primary flex items-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Créer
                  </Link>
                )}

                {/* Menu utilisateur */}
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 transition-colors">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="w-8 h-8 text-neutral-400" />
                    )}
                    <span className="text-sm text-neutral-300">{user?.fullName}</span>
                  </Menu.Button>

                  <Transition
                    enter="transition duration-100 ease-out"
                    enterFrom="transform scale-95 opacity-0"
                    enterTo="transform scale-100 opacity-100"
                    leave="transition duration-75 ease-in"
                    leaveFrom="transform scale-100 opacity-100"
                    leaveTo="transform scale-95 opacity-0"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-56 glass p-2">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/profile"
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${
                              active ? 'bg-white/10' : ''
                            }`}
                          >
                            <UserCircleIcon className="w-5 h-5" />
                            Mon profil
                          </Link>
                        )}
                      </Menu.Item>
                      
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/dashboard"
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${
                              active ? 'bg-white/10' : ''
                            }`}
                          >
                            <CalendarIcon className="w-5 h-5" />
                            Mes inscriptions
                          </Link>
                        )}
                      </Menu.Item>

                      {isOrganizer && (
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/organizer"
                              className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${
                                active ? 'bg-white/10' : ''
                              }`}
                            >
                              <CalendarIcon className="w-5 h-5" />
                              Mes événements
                            </Link>
                          )}
                        </Menu.Item>
                      )}

                      <div className="border-t border-white/10 my-2" />

                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={logout}
                            className={`flex w-full items-center gap-3 px-4 py-2 rounded-lg text-sm text-red-400 ${
                              active ? 'bg-white/10' : ''
                            }`}
                          >
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                            Déconnexion
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-ghost">
                  Connexion
                </Link>
                <Link to="/register" className="btn-primary">
                  S'inscrire
                </Link>
              </div>
            )}
          </div>

          {/* Bouton menu mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}

export default Header;
```

### 5.2 Créer src/components/Footer.jsx

```javascript
function Footer() {
  return (
    <footer className="border-t border-white/5 py-8 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center text-neutral-500 text-sm">
          <p>© {new Date().getFullYear()} OneLastEvent. Projet BTS SIO SLAM.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
```

---

## ✅ Checklist de validation

- [ ] Le Context `AuthContext` est créé et fournit user, login, logout, register
- [ ] Le hook `useAuth()` est fonctionnel
- [ ] La page Login fonctionne avec le backend
- [ ] La page Register valide et crée un compte
- [ ] Le Header affiche le bon état selon l'authentification
- [ ] Les routes protégées redirigent vers /login
- [ ] La déconnexion nettoie les tokens et l'état

---

## 🔗 Prochaine étape

Continuez avec le [TP08 - Pages et Composants](./TP08_Pages_Composants.md)
