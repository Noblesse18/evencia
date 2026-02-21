# TP – Implémentation de Stripe dans Evencia

**Public :** BTS SIO option SLAM  
**Contexte :** Intégrer les paiements en ligne (Stripe) dans l’API et le frontend du projet Evencia.

---

## Objectifs pédagogiques

- Créer un compte Stripe et récupérer les clés API (mode Test).
- Configurer le backend pour créer des Payment Intents et retourner un `clientSecret`.
- Tester le flux paiement via l’API (Swagger / Postman).
- (Optionnel) Intégrer Stripe.js / Elements dans le frontend pour collecter la carte et confirmer le paiement.
- (Optionnel) Comprendre le rôle des webhooks Stripe.

---

## Prérequis

- Projet Evencia fonctionnel : backend (Node.js/Express), base MySQL, frontend Next.js si utilisé.
- Compte Stripe (gratuit) : [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register).
- Connaissances de base : API REST, JWT, React/Next.js.

---

# Partie 1 – Compte Stripe et clés API

## 1.1 Créer un compte Stripe

1. Aller sur [https://stripe.com](https://stripe.com) et cliquer sur **Sign in** ou **Create account**.
2. Créer un compte (email, mot de passe). Aucune carte bancaire n’est demandée pour le **mode Test**.
3. Une fois connecté, le **Dashboard** s’affiche. En haut à droite, vérifier que le mode **Test** est activé (interrupteur « Test mode »).

## 1.2 Récupérer les clés API (mode Test)

1. Dans le menu de gauche : **Developers** → **API keys**.
2. Tu vois deux clés en mode Test :
   - **Publishable key** : `pk_test_...`  
     → Utilisée côté **navigateur** (frontend) pour initialiser Stripe.js. Elle peut être exposée.
   - **Secret key** : `sk_test_...`  
     → Utilisée côté **serveur** (backend) uniquement. Ne jamais la mettre dans le code frontend ni la commiter.
3. Cliquer sur **Reveal test key** pour la Secret key et la **copier** (tu en auras besoin à la Partie 2).

**Résumé :**

| Clé              | Préfixe   | Où l’utiliser        |
|------------------|-----------|----------------------|
| Publishable key | `pk_test_`| Frontend (Stripe.js) |
| Secret key       | `sk_test_`| Backend (.env)       |

---

# Partie 2 – Configuration du backend

Le backend Evencia expose déjà la route **POST /api/payments** : elle crée un **Payment Intent** Stripe et renvoie le **clientSecret** si `STRIPE_SECRET_KEY` est défini. Sinon, il simule un paiement (insertion en base sans Stripe).

## 2.1 Fichier `.env` du backend

1. Ouvrir le fichier **`backend/.env`** (à la racine du dossier `backend/`).
2. Ajouter ou modifier la ligne suivante (en collant **ta** clé secrète Stripe) :
   ```env
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. **Ne pas** commiter ce fichier (il doit rester dans `.gitignore`). Chaque développeur utilise sa propre clé en local.

## 2.2 Lancer le backend et vérifier

1. Démarrer le backend (local ou Docker) :
   - **Local :** `cd backend && npm run dev`
   - **Docker :** `docker compose up -d` (ou `make up-build`)
2. Vérifier que le serveur démarre sans erreur. Si `STRIPE_SECRET_KEY` est vide, le backend accepte quand même les requêtes mais renverra un message du type « Stripe non configuré ».

## 2.3 (Optionnel) Backend en Docker

Si le backend tourne dans un conteneur Docker, la variable `STRIPE_SECRET_KEY` doit être passée au conteneur. Deux possibilités :

- **Fichier `.env` à la racine du projet** (à côté de `docker-compose.yml`) avec :
  ```env
  STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
  ```
  Puis dans `docker-compose.yml`, le service `backend` doit avoir dans `environment` :
  ```yaml
  - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
  ```
- Ou ajouter directement la ligne dans la section `environment` du service `backend` (à éviter en production pour ne pas exposer la clé dans le fichier).

Après modification, redémarrer le backend :  
`docker compose up -d --build backend`.

---

# Partie 3 – Tester l’API paiement (Swagger ou Postman)

## 3.1 Obtenir un token JWT

La route **POST /api/payments** est protégée : il faut envoyer le header **Authorization: Bearer &lt;token&gt;**.

1. **Connexion :**  
   **POST** `http://localhost:5000/api/auth/login`  
   Body (JSON) :
   ```json
   {
     "email": "admin@example.com",
     "password": "votre_mot_de_passe"
   }
   ```
2. Dans la réponse, copier la valeur du champ **`token`**.

## 3.2 Récupérer un ID d’événement

1. **Liste des événements :**  
   **GET** `http://localhost:5000/api/events`  
   (sans token pour cette route).
2. Copier l’**`id`** (UUID) d’un événement de la liste.

## 3.3 Créer une intention de paiement (Payment Intent)

1. **POST** `http://localhost:5000/api/payments`  
2. **Headers :**
   - `Content-Type: application/json`
   - `Authorization: Bearer <token>` (coller le token obtenu en 3.1)
3. **Body (JSON) :**
   ```json
   {
     "event_id": "uuid-de-l-evenement"
   }
   ```
4. **Réponse attendue (Stripe configuré) :**
   ```json
   {
     "clientSecret": "pi_xxxxxxxxxxxx_secret_xxxxxxxxxxxx"
   }
   ```
   Ce **clientSecret** est utilisé côté frontend pour confirmer le paiement avec Stripe.js (voir Partie 4).

5. **Réponse si Stripe non configuré :**
   ```json
   {
     "payment": { ... },
     "warning": "Stripe non configuré. Ceci est un test local."
   }
   ```

## 3.4 Tester avec Swagger

1. Ouvrir **http://localhost:5000/api-docs**.
2. Cliquer sur **Authorize**, saisir : `Bearer <ton_token>`, puis **Authorize**.
3. Aller sur **POST /api/payments** → **Try it out** → renseigner `event_id` → **Execute**.
4. Vérifier que la réponse contient bien `clientSecret` (ou le message de test local).

---

# Partie 4 – (Optionnel) Intégration frontend avec Stripe Elements

L’objectif est d’afficher un formulaire de saisie de carte (sécurisé par Stripe) et de confirmer le paiement avec le `clientSecret` renvoyé par le backend.

## 4.1 Prérequis frontend

- Le projet utilise déjà **@stripe/stripe-js** (voir `frontend/package.json`).
- Pour un formulaire carte complet, tu peux ajouter **@stripe/react-stripe-js** :
  ```bash
  cd frontend && npm install @stripe/react-stripe-js
  ```

## 4.2 Variable d’environnement (Publishable key)

1. Créer ou modifier **`frontend/.env.local`**.
2. Ajouter (avec **ta** clé publique Stripe) :
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxx
   ```
3. Redémarrer le serveur Next.js pour que la variable soit lue.

## 4.3 Flux à implémenter (sans détailler le code)

1. **Page ou modal « Payer »** (ex. sur la page détail d’un événement, après clic sur « Payer » ou « S’inscrire et payer »).
2. **Appel API backend :**  
   `POST /api/payments` avec `{ "event_id": "<id>" }` (en envoyant le JWT).  
   Récupérer le **clientSecret** dans la réponse.
3. **Initialiser Stripe côté client :**  
   `loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)`.
4. **Afficher les Stripe Elements** (composant `CardElement` ou `PaymentElement`) dans un formulaire.
5. **Confirmer le paiement :**  
   Appeler `stripe.confirmCardPayment(clientSecret, { payment_method: { card: cardElement } })` (ou l’équivalent avec le Payment Element).  
   Gérer le résultat : succès (redirection ou message) ou erreur (afficher le message Stripe).

## 4.4 Cartes de test Stripe

En mode Test, utiliser les numéros de carte fournis par Stripe, par exemple :

- **Succès :** `4242 4242 4242 4242`
- **Refus :** `4000 0000 0000 0002`
- **3D Secure :** `4000 0025 0000 3155`

Date et CVC : n’importe quelle valeur future (ex. 12/34, 123).  
Voir : [https://docs.stripe.com/testing#cards](https://docs.stripe.com/testing#cards).

---

# Partie 5 – (Optionnel) Webhooks Stripe

Les webhooks permettent à Stripe d’envoyer des événements à ton serveur (ex. « paiement réussi ») pour mettre à jour ta base (statut du paiement, inscription confirmée, etc.).

## 5.1 Principe

1. Tu exposes une route **POST** sur ton backend (ex. **POST /api/webhooks/stripe**).
2. Dans le Dashboard Stripe, tu configures une **Webhook endpoint** pointant vers cette URL.
3. Stripe envoie des requêtes POST avec un body signé. Tu **dois** vérifier la signature avec le **Webhook signing secret** (`whsec_...`) pour éviter les faux appels.
4. Selon l’événement reçu (ex. `payment_intent.succeeded`), tu mets à jour la table `payments` (et éventuellement les inscriptions).

## 5.2 Étapes côté Stripe (sans coder)

1. **Developers** → **Webhooks** → **Add endpoint**.
2. **Endpoint URL :**
   - En production : `https://ton-domaine.com/api/webhooks/stripe`
   - En local : utiliser une URL publique (ex. **ngrok** : `https://xxx.ngrok.io/api/webhooks/stripe`).
3. **Events to send :** sélectionner au minimum **`payment_intent.succeeded`** (et éventuellement `payment_intent.payment_failed`).
4. Après création, Stripe affiche le **Signing secret** (`whsec_...`). Le stocker dans le `.env` du backend (ex. `STRIPE_WEBHOOK_SECRET=whsec_...`).

## 5.3 Côté backend (à développer)

- Créer une route **POST /api/webhooks/stripe** qui :
  - Reçoit le **body brut** (ne pas utiliser `express.json()` pour cette route, ou utiliser un middleware qui garde le raw body pour ce path).
  - Récupère le header **Stripe-Signature**.
  - Utilise `stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET)` pour vérifier la signature.
  - Si l’événement est `payment_intent.succeeded`, récupérer l’id du Payment Intent et mettre à jour la table `payments` (et/ou inscriptions) en conséquence.
  - Répondre par un statut **200** pour accuser réception (sinon Stripe réessaiera).

Le projet ne contient pas encore cette route ; la Partie 5 sert de guide pour l’ajouter plus tard.

---

# Récapitulatif des parties

| Partie | Contenu | Obligatoire pour « Stripe branché » |
|--------|---------|-------------------------------------|
| **1**  | Compte Stripe + clés API (Test) | Oui |
| **2**  | Backend : `STRIPE_SECRET_KEY` dans `.env` (et Docker si besoin) | Oui |
| **3**  | Test API : login → POST /api/payments → récupérer `clientSecret` | Oui |
| **4**  | Frontend : Stripe.js, Elements, confirmation du paiement | Optionnel |
| **5**  | Webhooks : endpoint + signing secret + mise à jour BDD | Optionnel |

Une fois les **Parties 1, 2 et 3** réalisées, Stripe est correctement implanté côté API ; les Parties 4 et 5 permettent d’avoir un parcours utilisateur complet et une traçabilité côté serveur.
