# TPs – Application mobile Evencia (React Native Expo)

**Public :** BTS SIO option SLAM  
**Contexte :** Connexion d’une application mobile React Native (Expo) au backend Evencia existant (API REST Node.js/Express).

---

## Objectifs pédagogiques

- Installer et configurer un projet React Native avec Expo.
- Consommer une API REST (authentification JWT, liste d’événements, détail, inscription).
- Réaliser une application avec : **écran de connexion**, **liste des événements**, **détail d’un événement** et **bouton d’inscription**.

---

## Prérequis

- **Backend Evencia** installé et fonctionnel (voir [§ 1](#1-vérifier-le-backend-existant)).
- **Node.js** (LTS, ex. 18 ou 20).
- **npm** ou **yarn**.
- **Expo Go** installé sur un smartphone (Android/iOS) ou émulateur.
- Connaissances de base : JavaScript/ES6, React (hooks), requêtes HTTP.

---

# Partie 1 – Vérifier le backend existant

## 1.1 Lancer le backend

1. Aller dans le dossier backend :  
   `cd evencia/backend`
2. Installer les dépendances :  
   `npm install`
3. Créer un fichier `.env` à la racine de `backend/` (ou copier depuis `.env.example`) avec au minimum :
   ```env
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=votre_secret_jwt_tres_long_et_securise
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=evencianew
   CORS_ORIGINS=http://localhost:3000,http://localhost:8081,exp://192.168.x.x:8081
   ```
   **Important :** ajouter l’origine Expo (ex. `exp://192.168.x.x:8081`) dans `CORS_ORIGINS` pour que l’app mobile puisse appeler l’API.
4. Exécuter les migrations :  
   `npm run migrate`
5. (Optionnel) Créer un compte admin :  
   `npm run seed`
6. Démarrer le serveur :  
   `npm run dev`  
   Le serveur doit répondre sur **http://localhost:5000**.

## 1.2 Tester l’API avec Postman ou curl

- **Login :**  
  `POST http://localhost:5000/api/auth/login`  
  Body (JSON) : `{ "email": "admin@example.com", "password": "votre_mot_de_passe" }`  
  → Réponse attendue : `{ "user": { ... }, "token": "..." }`.
- **Liste des événements :**  
  `GET http://localhost:5000/api/events`  
  → Réponse : `{ "events": [ ... ], "pagination": { ... } }`.
- **Détail d’un événement :**  
  `GET http://localhost:5000/api/events/:id`  
  (remplacer `:id` par un UUID d’événement).
- **Inscription (avec token) :**  
  `POST http://localhost:5000/api/inscriptions`  
  Headers : `Authorization: Bearer <token>`  
  Body : `{ "event_id": "uuid-de-l-evenement" }`.

Noter l’**URL de base** de l’API : `http://localhost:5000` (ou l’IP de votre machine pour le téléphone, ex. `http://192.168.1.10:5000`).

---

# Partie 2 – Créer le projet React Native Expo

## 2.1 Créer l’application

**Commandes à exécuter (à la racine du projet evencia ou dans un dossier parent) :**

```bash
npx create-expo-app@latest evencia-mobile --template blank
cd evencia-mobile
```

**Explication :**

| Commande | Rôle |
|----------|------|
| `npx` | Exécute un package npm sans l’installer globalement (évite les conflits de versions). |
| `create-expo-app@latest` | Générateur officiel Expo pour créer une app React Native. |
| `--template blank` | Projet minimal (un seul écran), sans onglets ni navigation préinstallée. |

Quand on vous demande **JavaScript ou TypeScript**, choisir **JavaScript** pour ce TP.

---

## 2.2 Installer les dépendances

**Commandes :**

```bash
npx expo install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
npx expo install @react-native-async-storage/async-storage
npm install axios
```

**Utilité de chaque package :**

| Package | Utilité |
|---------|--------|
| `@react-navigation/native` | Moteur de navigation (gestion des écrans, pile d’écrans). |
| `@react-navigation/native-stack` | Navigateur en pile : un écran par-dessus l’autre (liste → détail). |
| `react-native-screens` | Optimise le rendu des écrans (requis par React Navigation). |
| `react-native-safe-area-context` | Gère les zones sûres (encoche, barre de statut) sur les téléphones. |
| `@react-native-async-storage/async-storage` | Stockage clé/valeur persistant (pour enregistrer le token JWT). |
| `axios` | Client HTTP pour appeler l’API (GET, POST, etc.) avec une syntaxe simple. |

**Pourquoi `npx expo install` pour certains ?**  
Expo recommande d’installer les librairies natives avec sa commande pour garder des versions compatibles avec votre SDK Expo.

---

## 2.3 Créer la structure des dossiers

À la racine de `evencia-mobile`, créer les dossiers et fichiers vides suivants (les fichiers seront remplis dans les parties suivantes) :

```
evencia-mobile/
├── App.js
├── src/
│   ├── api/
│   │   └── client.js
│   ├── context/
│   │   └── AuthContext.js
│   └── screens/
│       ├── LoginScreen.js
│       ├── EventsListScreen.js
│       └── EventDetailScreen.js
```

**Commandes :**

```bash
mkdir -p src/api src/context src/screens
touch src/api/client.js src/context/AuthContext.js src/screens/LoginScreen.js src/screens/EventsListScreen.js src/screens/EventDetailScreen.js
```

---

# Partie 3 – Client API (axios) et configuration

## 3.1 Rôle du fichier `src/api/client.js`

Ce fichier centralise toutes les requêtes vers le backend : une seule base URL, et un **intercepteur** qui ajoute automatiquement le token JWT à chaque requête (pour les routes protégées).

## 3.2 Code complet avec explications ligne par ligne

**Fichier : `src/api/client.js`**

```javascript
// 1. Import du client HTTP axios (pour GET, POST, etc.)
import axios from 'axios';

// 2. Import du stockage local : on y enregistre le token après le login
import AsyncStorage from '@react-native-async-storage/async-storage';

// 3. URL de base de l'API backend
//    - Émulateur Android : utiliser 10.0.2.2 (alias de localhost)
//    - Appareil réel : mettre l'IP de la machine qui lance le backend (ex: ip addr sous Linux)
const API_BASE_URL = 'http://192.168.1.10:5000/api';

// 4. Création d'une instance axios avec des options par défaut
const apiClient = axios.create({
  baseURL: API_BASE_URL,           // Toutes les requêtes commenceront par cette URL
  headers: {
    'Content-Type': 'application/json',  // Le backend attend du JSON
  },
});

// 5. Intercepteur "request" : s'exécute AVANT chaque envoi de requête
apiClient.interceptors.request.use(async (config) => {
  // 6. On récupère le token stocké au moment du login (clé "token")
  const token = await AsyncStorage.getItem('token');
  // 7. Si un token existe, on l'ajoute dans le header Authorization (exigé par le backend)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // 8. On retourne la config modifiée pour que la requête parte avec le bon header
  return config;
});

// 9. On exporte l'instance pour l'utiliser dans les écrans et le contexte (ex: apiClient.get('/events'))
export default apiClient;
```

**À faire :** remplacer `192.168.1.10` par l’IP de votre machine (ou `10.0.2.2` pour l’émulateur Android).

---

# Partie 4 – Contexte d’authentification (AuthContext)

## 4.1 Rôle du fichier `src/context/AuthContext.js`

- **Contexte React** : permet de partager l’état « utilisateur connecté / token » dans toute l’app sans passer des props à chaque niveau.
- Au démarrage : lit le token dans AsyncStorage ; s’il existe, appelle `GET /api/auth/verify` pour récupérer l’utilisateur et éviter de redemander le login à chaque ouverture.
- Expose `login`, `logout`, `user`, `loading` pour les écrans (Login et navigation).

## 4.2 Code complet avec explications ligne par ligne

**Fichier : `src/context/AuthContext.js`**

```javascript
// 1. createContext : crée un "conteneur" pour partager des données dans l'arbre de composants
import React, { createContext, useState, useEffect, useCallback } from 'react';
// 2. AsyncStorage : lecture/écriture du token sur le téléphone
import AsyncStorage from '@react-native-async-storage/async-storage';
// 3. Notre client API (pour login et verify)
import apiClient from '../api/client';

// 4. Création du contexte. La valeur par défaut (null) est utilisée si un composant utilise useAuth en dehors du AuthProvider
export const AuthContext = createContext(null);

// 5. Composant "fournisseur" qui enveloppera toute l'app (dans App.js)
export function AuthProvider({ children }) {
  // 6. État : utilisateur connecté (objet { id, name, email, role } ou null)
  const [user, setUser] = useState(null);
  // 7. État : true pendant qu'on vérifie le token au démarrage ou pendant le login
  const [loading, setLoading] = useState(true);

  // 8. Fonction appelée au login : envoie email/password à l'API, stocke token et user
  const login = useCallback(async (email, password) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    // 9. Réponse attendue : { user, token }
    await AsyncStorage.setItem('token', data.token);  // Persistance du token
    setUser(data.user);                               // Mise à jour de l'état pour afficher l'app connectée
  }, []);

  // 10. Fonction déconnexion : supprime le token et remet user à null
  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  }, []);

  // 11. Au premier rendu (et à chaque changement de dépendances [] = une seule fois), vérifier si un token existe
  useEffect(() => {
    let isMounted = true;

    async function loadStoredToken() {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }
        // 12. Token trouvé : on vérifie qu'il est encore valide et on récupère l'utilisateur
        const { data } = await apiClient.get('/auth/verify');
        if (isMounted && data.user) setUser(data.user);
      } catch (err) {
        // 13. Token expiré ou invalide : on le supprime
        await AsyncStorage.removeItem('token');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStoredToken();
    return () => { isMounted = false };  // 14. Évite de mettre à jour l'état si le composant est démonté
  }, []);

  // 15. Valeur fournie à tous les composants qui utilisent useAuth()
  const value = {
    user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 16. Hook personnalisé : permet d'utiliser le contexte facilement (const { user, login } = useAuth())
export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé à l\'intérieur de AuthProvider');
  return ctx;
}
```

**Points importants :**  
- En cas d’erreur sur le login (401), l’appel `apiClient.post('/auth/login', ...)` lèvera une exception : on gèrera l’erreur dans l’écran Login (Partie 5).  
- `loadStoredToken` utilise `isMounted` pour ne pas faire `setUser` après un démontage du composant (bonne pratique React).

---

# Partie 5 – Écran de connexion (LoginScreen)

## 5.1 Rôle du fichier `src/screens/LoginScreen.js`

Afficher un formulaire (email, mot de passe), appeler `login(email, password)` du contexte au clic sur « Se connecter », et afficher un message d’erreur en cas d’échec (identifiants invalides ou réseau).

## 5.2 Code complet avec explications ligne par ligne

**Fichier : `src/screens/LoginScreen.js`**

```javascript
// 1. Hooks React pour l'état local et le contexte d'authentification
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  // 2. État local : valeurs des champs et message d'erreur
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 3. Récupération de la fonction login du contexte (fournie par AuthProvider)
  const { login } = useAuth();

  // 4. Appelée au clic sur "Se connecter"
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir email et mot de passe.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // 5. Appel API POST /api/auth/login via le contexte (qui stocke token + user)
      await login(email.trim(), password);
      // 6. Succès : le contexte a mis à jour user, App.js affichera alors la navigation (liste des events)
    } catch (err) {
      // 7. Erreur réseau ou 401 : afficher le message renvoyé par l'API ou un message par défaut
      const message = err.response?.data?.message || 'Erreur de connexion. Vérifiez vos identifiants.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // 8. KeyboardAvoidingView : décale le contenu quand le clavier s'ouvre (UX sur mobile)
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Connexion</Text>

        {/* 9. Champ email : valeur contrôlée par l'état email */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        {/* 10. Champ mot de passe : secureTextEntry masque les caractères */}
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        {/* 11. Message d'erreur affiché sous les champs */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* 12. Bouton : désactivé pendant le chargement, affiche un indicateur si loading */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  form: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#c00',
    marginBottom: 12,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

# Partie 6 – Liste des événements et navigation

## 6.1 Rôle du fichier `src/screens/EventsListScreen.js`

- Au chargement : appeler `GET /api/events` (pas besoin de token).
- Afficher les événements dans une `FlatList` (titre, date, lieu, prix).
- Au clic sur un événement : naviguer vers l’écran Détail en passant l’`id` (paramètre de route).

## 6.2 Code complet avec explications ligne par ligne

**Fichier : `src/screens/EventsListScreen.js`**

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function EventsListScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  // 1. Charger la liste des événements au montage du composant
  const loadEvents = async () => {
    try {
      const { data } = await apiClient.get('/events', { params: { page: 1, limit: 20 } });
      setEvents(data.events || []);
    } catch (err) {
      console.warn('Erreur chargement events:', err.message);
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // 2. Rendu d'un item de la liste (titre, date, lieu, prix)
  const renderItem = ({ item }) => {
    const dateStr = item.event_date ? new Date(item.event_date).toLocaleDateString('fr-FR') : '';
    const priceStr = item.price != null && Number(item.price) > 0 ? `${Number(item.price).toFixed(2)} €` : 'Gratuit';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
        activeOpacity={0.7}
      >
        <Text style={styles.cardTitle}>{item.title || 'Sans titre'}</Text>
        <Text style={styles.cardInfo}>📅 {dateStr}</Text>
        <Text style={styles.cardInfo}>📍 {item.location || '—'}</Text>
        <Text style={styles.cardPrice}>{priceStr}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Événements</Text>
        {user && (
          <TouchableOpacity onPress={logout}>
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadEvents(); }} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  logoutText: { color: '#2563eb', fontSize: 14 },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  cardInfo: { fontSize: 14, color: '#555', marginBottom: 4 },
  cardPrice: { fontSize: 14, fontWeight: '600', color: '#2563eb', marginTop: 4 },
});
```

**Lignes clés :**  
- `apiClient.get('/events', { params: { page: 1, limit: 20 } })` → requête `GET /api/events?page=1&limit=20`.  
- `navigation.navigate('EventDetail', { eventId: item.id })` → ouvre l’écran Détail avec le paramètre `eventId` (nom de la route à définir dans `App.js`).

---

# Partie 7 – Détail d’un événement et bouton S’inscrire

## 7.1 Rôle du fichier `src/screens/EventDetailScreen.js`

- Récupérer `eventId` depuis les paramètres de la route.
- Appeler `GET /api/events/:id` pour afficher titre, description, lieu, date, prix, places restantes, organisateur.
- Afficher un bouton « S’inscrire » : si l’utilisateur est connecté, appeler `POST /api/inscriptions` avec `event_id` ; sinon inviter à se connecter. Gérer les messages « Déjà inscrit », « Plus de places », succès.

## 7.2 Code complet avec explications ligne par ligne

**Fichier : `src/screens/EventDetailScreen.js`**

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function EventDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const eventId = route.params?.eventId;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inscribing, setInscribing] = useState(false);
  const [alreadyInscribed, setAlreadyInscribed] = useState(false);

  // 1. Charger le détail de l'événement au montage
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get(`/events/${eventId}`);
        if (!cancelled) setEvent(data);
      } catch (err) {
        if (!cancelled) setEvent(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [eventId]);

  // 2. Inscription à l'événement (utilisateur doit être connecté)
  const handleInscribe = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour vous inscrire.', [
        { text: 'OK', onPress: () => logout() },
      ]);
      return;
    }
    if (!eventId) return;
    setInscribing(true);
    try {
      await apiClient.post('/inscriptions', { event_id: eventId });
      setAlreadyInscribed(true);
      Alert.alert('Succès', 'Vous êtes inscrit à cet événement.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'inscription.';
      Alert.alert('Erreur', msg);
    } finally {
      setInscribing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }
  if (!event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Événement introuvable.</Text>
      </View>
    );
  }

  const dateStr = event.event_date ? new Date(event.event_date).toLocaleString('fr-FR') : '';
  const priceStr = event.price != null && Number(event.price) > 0 ? `${Number(event.price).toFixed(2)} €` : 'Gratuit';
  const placesStr = event.tickets_remaining != null ? `${event.tickets_remaining} place(s) restante(s)` : '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.category}>{event.category || '—'}</Text>
      <Text style={styles.body}>{event.description || 'Aucune description.'}</Text>
      <Text style={styles.info}>📅 {dateStr}</Text>
      <Text style={styles.info}>📍 {event.location || '—'}</Text>
      <Text style={styles.info}>💰 {priceStr}</Text>
      {placesStr ? <Text style={styles.info}>🎫 {placesStr}</Text> : null}
      {event.organizer ? (
        <Text style={styles.info}>Organisateur : {event.organizer.name} ({event.organizer.email})</Text>
      ) : null}

      <TouchableOpacity
        style={[styles.button, (alreadyInscribed || inscribing) && styles.buttonDisabled]}
        onPress={handleInscribe}
        disabled={alreadyInscribed || inscribing}
      >
        {inscribing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {alreadyInscribed ? 'Inscrit' : 'S\'inscrire'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: '#c00', fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  category: { fontSize: 14, color: '#666', marginBottom: 12 },
  body: { fontSize: 16, color: '#333', marginBottom: 16 },
  info: { fontSize: 14, color: '#555', marginBottom: 6 },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

**Lignes clés :**  
- Si l'utilisateur n'est pas connecté (`!user`), on affiche une alerte ; au clic sur « OK », `logout()` est appelé, ce qui réaffiche l'écran de connexion (car l'app n'a pas d'écran « Login » dans la stack).
- `route.params?.eventId` : paramètre passé depuis la liste lors du `navigate('EventDetail', { eventId: item.id })`.  
- `apiClient.get(\`/events/${eventId}\`)` → `GET /api/events/:id`.  
- `apiClient.post('/inscriptions', { event_id: eventId })` → le token est ajouté automatiquement par l’intercepteur dans `client.js`.

---

# Partie 8 – Point d’entrée : `App.js` (navigation + Auth)

## 8.1 Rôle du fichier `App.js`

- Envelopper l’app avec `AuthProvider` pour que tous les écrans aient accès à `useAuth()`.
- Si `loading` est true : afficher un écran de chargement.
- Si `user` est null : afficher uniquement l’écran **Login** (pas de stack).
- Si `user` est défini : afficher la stack **EventsList** et **EventDetail** (avec possibilité de déconnexion depuis la liste).

Pour que « Déconnexion » depuis la liste redirige vers Login, il suffit que `user` devienne null (ce que fait `logout()`). Comme l’écran Login n’est pas dans la stack, il réapparaît automatiquement quand `user` est null.

## 8.2 Code complet avec explications ligne par ligne

**Fichier : `App.js` (à la racine du projet)**  

```javascript
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import EventsListScreen from './src/screens/EventsListScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';

// 1. Création du navigateur en pile (stack) : écrans empilés (liste → détail)
const Stack = createNativeStackNavigator();

// 2. Sous-arbre de navigation affiché uniquement quand l'utilisateur est connecté
function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen name="EventsList" component={EventsListScreen} options={{ title: 'Événements' }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Détail' }} />
    </Stack.Navigator>
  );
}

// 3. Choix de l'écran selon l'état d'authentification (doit être utilisé à l'intérieur de AuthProvider)
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // 4. Non connecté : on affiche uniquement l'écran de connexion (pas de stack)
  if (!user) {
    return <LoginScreen />;
  }

  // 5. Connecté : on affiche la navigation avec la liste et le détail
  return (
    <NavigationContainer>
      <MainStack />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});
```

**Résumé du flux :**  
- Au démarrage, `AuthProvider` lit le token et appelle `/auth/verify` → si OK, `user` est défini et l’app affiche la stack.  
- Après login réussi, `user` est défini → affichage de la stack.  
- Après `logout()`, `user` devient null → affichage du `LoginScreen`.

---

# Partie 9 – Récapitulatif des endpoints utilisés

| Action              | Méthode | URL                      | Auth   | Body / paramètres                    |
|---------------------|--------|---------------------------|--------|--------------------------------------|
| Connexion           | POST   | `/api/auth/login`         | Non    | `{ "email", "password" }`           |
| Vérifier le token   | GET    | `/api/auth/verify`        | Bearer | —                                    |
| Liste des événements| GET    | `/api/events`             | Non    | Query : `page`, `limit`              |
| Détail événement    | GET    | `/api/events/:id`         | Non    | Param : `id`                         |
| S’inscrire          | POST   | `/api/inscriptions`       | Bearer | `{ "event_id": "..." }`              |

**Base URL :** `http://<IP_MACHINE>:5000` (ne pas oublier le préfixe `/api` dans les chemins).

---

# Partie 9 – Grille d’évaluation (suggestions)

| Critère                               | Points |
|---------------------------------------|--------|
| Backend lancé et CORS configuré       | 2      |
| Projet Expo créé et dépendances OK     | 2      |
| Client API (axios, base URL, token)   | 3      |
| Contexte Auth (login, logout, stockage)| 4      |
| Écran Login fonctionnel               | 3      |
| Liste des événements + navigation     | 4      |
| Détail événement affiché              | 3      |
| Bouton S’inscrire fonctionnel         | 4      |
| Gestion des erreurs (messages clairs) | 2      |
| Code structuré et lisible             | 3      |
| **Total**                             | **30** |

---

# Annexes

## A. Exemple de .env backend (extrait)

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=changez_moi_en_production_par_une_longue_cle_secrete
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=evencianew
CORS_ORIGINS=http://localhost:3000,http://localhost:8081,exp://192.168.1.10:8081
```

## B. Trouver l’IP de sa machine (pour CORS et app mobile)

- **Windows :** `ipconfig` (adresse IPv4 du réseau local).
- **Linux / macOS :** `ip addr` ou `ifconfig` (adresse du réseau local, ex. 192.168.x.x).

Utiliser cette IP dans l’URL de l’API côté mobile et dans `CORS_ORIGINS` du backend.

## C. Ressources

- [Expo documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Axios](https://github.com/axios/axios)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

---

*Document généré à partir de l’analyse du backend Evencia – BTS SIO SLAM.*
