# Documentation utilisateur — Evencia

> Guide d'utilisation de l'application web et mobile Evencia.

---

## Sommaire

1. [Présentation](#1-présentation)
2. [Rôles et permissions](#2-rôles-et-permissions)
3. [Application Web — Guide d'utilisation](#3-application-web--guide-dutilisation)
4. [Application Mobile — Guide d'utilisation](#4-application-mobile--guide-dutilisation)
5. [Paiement en ligne (Stripe)](#5-paiement-en-ligne-stripe)
6. [Identifiants de test](#6-identifiants-de-test)

---

## 1. Présentation

**Evencia** est une plateforme de gestion d'événements qui permet :

- Aux **participants** de parcourir des événements, s'y inscrire et payer en ligne
- Aux **organisateurs** de créer et gérer leurs événements, et de suivre les inscriptions
- Aux **administrateurs** de superviser l'ensemble de la plateforme

L'application est disponible en version **web** (Next.js) et **mobile** (React Native / Expo).

---

## 2. Rôles et permissions

| Fonctionnalité | Participant | Organisateur | Administrateur |
|----------------|:-----------:|:------------:|:--------------:|
| Consulter les événements | ✅ | ✅ | ✅ |
| Rechercher / filtrer les événements | ✅ | ✅ | ✅ |
| S'inscrire à un événement | ✅ | — | — |
| Payer via Stripe | ✅ | — | — |
| Annuler une inscription | ✅ | — | — |
| Voir ses inscriptions | ✅ | — | — |
| Modifier son profil | ✅ | ✅ | ✅ |
| Créer un événement | — | ✅ | ✅ |
| Modifier / supprimer un événement | — | ✅ (ses événements) | ✅ (tous) |
| Tableau de bord (stats inscriptions) | — | ✅ | ✅ |
| Gérer les utilisateurs | — | — | ✅ |

---

## 3. Application Web — Guide d'utilisation

### 3.1 Page d'accueil

La page d'accueil présente la plateforme et affiche les événements mis en avant. Un bouton permet d'accéder à la liste complète des événements.

**URL** : http://localhost:3000

---

### 3.2 Inscription et connexion

**Inscription** (`/register`) :
1. Renseigner son nom, email et mot de passe
2. Le mot de passe doit contenir au minimum 8 caractères, une majuscule, une minuscule et un chiffre
3. Le compte est créé avec le rôle « participant » par défaut

**Connexion** (`/login`) :
1. Saisir son email et mot de passe
2. Un token JWT est généré et stocké automatiquement
3. Redirection vers la page des événements

---

### 3.3 Liste des événements

**URL** : http://localhost:3000/events

La page affiche tous les événements disponibles sous forme de cartes. Chaque carte montre :
- Le titre, la date, le lieu
- La catégorie et le prix
- Le nombre de places disponibles

**Fonctionnalités de filtrage** :
- **Par catégorie** : musique, sport, conférence, théâtre, etc.
- **Par ville** : recherche textuelle
- **Par prix** : prix minimum et maximum
- **Par date** : événements à venir ou passés
- **Recherche textuelle** : dans le titre et la description
- **Pagination** : navigation entre les pages de résultats

---

### 3.4 Détail d'un événement

**URL** : http://localhost:3000/events/[id]

Affiche les informations complètes d'un événement :
- Titre, description, images
- Date, lieu, catégorie
- Prix et nombre de places restantes
- Nom de l'organisateur
- Bouton « S'inscrire » (pour les participants connectés)
- Bouton « Payer » (si l'événement est payant)

---

### 3.5 Tableau de bord organisateur

**URL** : http://localhost:3000/dashboard

Accessible aux organisateurs et administrateurs, il affiche :
- La liste des événements créés par l'organisateur
- Le nombre d'inscrits par événement
- Les statistiques globales (total d'événements, total d'inscrits)
- Les boutons pour modifier ou supprimer un événement

---

### 3.6 Création d'un événement

**URL** : http://localhost:3000/events/create

Formulaire de création accessible aux organisateurs et administrateurs :
- Titre, description
- Catégorie (liste déroulante)
- Date et heure
- Lieu
- Prix (0 pour un événement gratuit)
- Nombre maximum de places
- Image (URL)

---

### 3.7 Profil utilisateur

**URL** : http://localhost:3000/profile

Permet de :
- Consulter ses informations personnelles
- Modifier son nom
- Changer son mot de passe

---

## 4. Application Mobile — Guide d'utilisation

### 4.1 Installation et lancement

1. S'assurer que le backend tourne (`docker compose up -d`)
2. Installer les dépendances : `cd mobile && npm install`
3. Lancer Expo : `npx expo start`
4. Appuyer sur `a` pour ouvrir sur l'émulateur Android, ou scanner le QR code avec Expo Go sur un téléphone

---

### 4.2 Écran de connexion

L'écran de connexion permet de saisir son email et mot de passe. Après connexion, le token JWT est stocké dans AsyncStorage et l'utilisateur accède à l'application.

---

### 4.3 Navigation

L'application utilise une barre de navigation en bas avec 4 onglets :

| Onglet | Écran | Description |
|--------|-------|-------------|
| Accueil | HomeScreen | Événements à la une, chargés dynamiquement depuis l'API |
| Recherche | SearchScreen | Recherche et filtres (catégorie, date, prix) |
| Dashboard | DashboardScreen | Mes inscriptions en cours |
| Profil | ProfileScreen | Informations personnelles et déconnexion |

Un clic sur un événement ouvre l'écran de détail (EventDetailScreen) avec toutes les informations et le bouton d'inscription.

---

### 4.4 Inscription à un événement

1. Depuis HomeScreen ou SearchScreen, cliquer sur un événement
2. L'écran de détail affiche les informations complètes
3. Cliquer sur « S'inscrire »
4. L'application vérifie les places disponibles et confirme l'inscription

---

## 5. Paiement en ligne (Stripe)

### Flux de paiement (web)

1. L'utilisateur clique sur « S'inscrire » sur un événement payant
2. Une inscription en statut « pending » est créée
3. L'utilisateur est redirigé vers la page de paiement Stripe Checkout
4. Il saisit les informations de sa carte bancaire
5. Après paiement réussi, Stripe envoie un webhook au backend
6. Le backend met à jour le statut de l'inscription en « confirmed » et le paiement en « succeeded »
7. L'utilisateur est redirigé vers la page de l'événement avec confirmation

### Carte de test

Pour tester le paiement en mode test :

| Champ | Valeur |
|-------|--------|
| Numéro de carte | `4242 4242 4242 4242` |
| Date d'expiration | N'importe quelle date future |
| CVC | N'importe quel nombre à 3 chiffres |

---

## 6. Identifiants de test

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| **Organisateur** | comaravel@gmail.com | *(défini dans le seed de la base)* |
| **Participant** | *(créer un compte via la page d'inscription)* | — |

### Documentation API interactive

La documentation Swagger est accessible à : http://localhost:5000/api-docs

Elle permet de :
- Voir tous les endpoints disponibles
- Tester les requêtes directement depuis le navigateur
- Saisir un token JWT via le bouton « Authorize » pour tester les routes protégées
