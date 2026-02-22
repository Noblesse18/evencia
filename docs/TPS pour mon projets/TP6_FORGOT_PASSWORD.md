# TP6 - Créer la page mot de passe oublié
## Durée : 1h | Niveau : ⭐ Débutant

---

## 🎯 Objectifs

À la fin de ce TP, tu sauras :
- Créer une page React avec formulaire
- Appeler une API depuis un composant
- Gérer les états de succès et d'erreur
- Compléter un parcours utilisateur

---

## 📚 Contexte

Actuellement, la page de connexion a un lien "Mot de passe oublié ?" qui pointe vers `/forgot-password`, mais cette page n'existe pas. Nous allons la créer.

Le backend a déjà les routes :
- `POST /api/auth/request-password-reset` — Demande un email de reset
- `POST /api/auth/reset-password` — Réinitialise avec le token

---

## 📋 Étapes du TP

### Étape 1 : Ajouter la fonction API

Modifie `frontend/src/lib/api.ts` pour ajouter les fonctions manquantes :

```typescript
// frontend/src/lib/api.ts

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  verifyToken: () =>
    api.get('/auth/verify'),
  changePassword: (data: { oldPassword: string; newPassword: string; confirmPassword: string }) =>
    api.post('/auth/change-password', data),
  
  // AJOUTER CES DEUX FONCTIONS :
  requestPasswordReset: (email: string) =>
    api.post('/auth/request-password-reset', { email }),
  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
};
```

---

### Étape 2 : Créer la page forgot-password

Crée le dossier et fichier `frontend/src/app/forgot-password/page.tsx` :

```typescript
// frontend/src/app/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { authAPI } from '@/lib/api';
import { AxiosError } from 'axios';
import { ApiError } from '@/lib/types';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authAPI.requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(axiosError.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg pattern-dots flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card variant="elevated" className="p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gradient">Evencia</span>
            </Link>
          </div>

          {/* Affichage conditionnel : succès ou formulaire */}
          {success ? (
            // Message de succès
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Email envoyé !
              </h1>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Si un compte existe avec l&apos;adresse <strong>{email}</strong>, 
                vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
              </p>
              
              <p className="text-sm text-slate-500 dark:text-slate-500 mb-8">
                Vérifiez également vos spams si vous ne recevez rien.
              </p>

              <Link href="/login">
                <Button variant="outline" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Retour à la connexion
                </Button>
              </Link>
            </motion.div>
          ) : (
            // Formulaire
            <>
              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Mot de passe oublié ?
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Entrez votre email pour recevoir un lien de réinitialisation
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  id="email"
                  type="email"
                  label="Adresse email"
                  placeholder="votremail@exemple.com"
                  leftIcon={<Mail className="w-5 h-5" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                >
                  Envoyer le lien
                </Button>
              </form>

              {/* Back to login */}
              <div className="mt-8 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
```

---

### Étape 3 : Créer la page reset-password

Crée `frontend/src/app/reset-password/page.tsx` :

```typescript
// frontend/src/app/reset-password/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Calendar, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { authAPI } from '@/lib/api';
import { AxiosError } from 'axios';
import { ApiError } from '@/lib/types';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Vérifier qu'un token est présent
  useEffect(() => {
    if (!token) {
      setError('Lien de réinitialisation invalide ou expiré');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation côté client
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!token) {
      setError('Token manquant');
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.resetPassword({
        token,
        newPassword: formData.newPassword,
      });
      setSuccess(true);
      
      // Rediriger vers login après 3 secondes
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(axiosError.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg pattern-dots flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card variant="elevated" className="p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gradient">Evencia</span>
            </Link>
          </div>

          {success ? (
            // Message de succès
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Mot de passe réinitialisé !
              </h1>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Votre mot de passe a été modifié avec succès. 
                Vous allez être redirigé vers la page de connexion...
              </p>

              <Link href="/login">
                <Button className="w-full">
                  Se connecter
                </Button>
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Nouveau mot de passe
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Choisissez un nouveau mot de passe sécurisé
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    label="Nouveau mot de passe"
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-5 h-5" />}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  label="Confirmer le mot de passe"
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-5 h-5" />}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />

                {/* Password requirements */}
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <p>Le mot de passe doit contenir :</p>
                  <ul className="list-disc list-inside">
                    <li>Au moins 8 caractères</li>
                    <li>Une majuscule et une minuscule</li>
                    <li>Un chiffre</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                  disabled={!token}
                >
                  Réinitialiser le mot de passe
                </Button>
              </form>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

// Page avec Suspense (requis pour useSearchParams)
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
```

---

### Étape 4 : Tester le parcours

1. **Démarre les serveurs** :
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

2. **Teste le parcours** :
   - Va sur http://localhost:3000/login
   - Clique sur "Mot de passe oublié ?"
   - Entre un email et soumets le formulaire
   - Vérifie que le message de succès s'affiche

3. **Teste la page reset-password** :
   - Va sur http://localhost:3000/reset-password?token=test
   - Vérifie que le formulaire s'affiche

---

### Étape 5 : Vérifier les logs backend

Quand tu demandes un reset, le backend affiche le token dans la console :

```
[DEV] Token généré: abc123... (lien: /reset-password?token=abc123...)
```

En production, ce token serait envoyé par email.

---

## ✅ Checklist de validation

- [ ] La fonction `requestPasswordReset` est ajoutée à `api.ts`
- [ ] La fonction `resetPassword` est ajoutée à `api.ts`
- [ ] La page `/forgot-password` existe et fonctionne
- [ ] La page `/reset-password` existe et fonctionne
- [ ] Le lien depuis `/login` fonctionne
- [ ] Les messages d'erreur et succès s'affichent correctement
- [ ] Le design est cohérent avec le reste de l'application

---

## 📝 Ce que tu as appris

1. **Créer une page Next.js** avec un formulaire
2. **Gérer les états** (loading, error, success)
3. **Appeler une API** avec gestion des erreurs
4. **Utiliser useSearchParams** pour récupérer les query params
5. **Envelopper avec Suspense** pour Next.js 16

---

## 🎯 Améliorations possibles

| Amélioration | Description |
|--------------|-------------|
| Validation temps réel | Vérifier le mot de passe pendant la saisie |
| Force du mot de passe | Afficher un indicateur de force |
| Expiration du token | Afficher le temps restant |
| Email réel | Intégrer Nodemailer ou SendGrid |

---

## 🎉 Félicitations !

Tu as terminé tous les TPs ! Ton projet est maintenant :

- ✅ Bien architecturé (Repositories, Services)
- ✅ Sécurisé (CORS, rate limiting, secrets protégés)
- ✅ Testé (tests unitaires)
- ✅ Complet (parcours utilisateur fonctionnel)

Tu es prêt pour l'épreuve E4 ! 🎓
