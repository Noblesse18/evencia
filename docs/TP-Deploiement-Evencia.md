# TP – Déploiement Evencia

**Public :** BTS SIO option SLAM  
**Contexte :** Exposer l’API Evencia sur Internet (tunnel) puis déployer sur un serveur Linux.

---

## Objectifs pédagogiques

- Exposer le backend Evencia depuis un PC local vers Internet via un tunnel (Option A).
- Configurer CORS et l’app mobile pour utiliser l’URL publique.
- Déployer « pour de bon » le backend sur un serveur Linux (Node.js, MySQL, Nginx, PM2, HTTPS).

---

## Prérequis

- Backend Evencia fonctionnel en local (`npm run dev` sur le port 5000).
- MySQL installé et base `evencianew` créée, migrations exécutées.
- Compte ngrok **ou** Cloudflare (gratuit) pour la partie tunnel.
- Pour la partie serveur : un VPS ou une machine Linux avec accès SSH (Debian/Ubuntu recommandé).

---

# Partie 1 – Option A : exposition via tunnel (PC local accessible sur Internet)

L’objectif est d’obtenir une URL publique (HTTPS) qui pointe vers `localhost:5000` sur ton PC, sans modifier la box ni ouvrir de ports.

---

## 1.1 Choisir le tunnel : ngrok ou Cloudflare

| Outil              | Avantages                          | Inconvénients (offre gratuite)     |
|--------------------|------------------------------------|------------------------------------|
| **ngrok**          | Installation simple, URL immédiate | URL change à chaque redémarrage   |
| **Cloudflare Tunnel** | URL/sous-domaine persistant possible | Compte Cloudflare, config un peu plus longue |

Tu peux faire le TP avec un seul des deux ; les deux sont détaillés ci-dessous.

---

## 1.2 Option 1 – Tunnel avec ngrok

### 1.2.1 Installer ngrok

- **Linux (Debian/Ubuntu)**  
  ```bash
  sudo apt update
  sudo apt install -y ngrok
  ```
  Ou télécharger le binaire depuis [ngrok.com](https://ngrok.com/download) et le placer dans ton `PATH`.

- **Windows**  
  Télécharger l’exécutable depuis [ngrok.com](https://ngrok.com/download), le décompresser et l’ajouter au `PATH` ou l’exécuter depuis son dossier.

- Créer un compte gratuit sur [ngrok.com](https://ngrok.com), récupérer ton **Authtoken** et le configurer :
  ```bash
  ngrok config add-authtoken VOTRE_TOKEN_ICI
  ```

### 1.2.2 Lancer le backend et le tunnel

1. Sur ton PC, dans le dossier backend :
   ```bash
   cd evencia/backend
   npm run dev
   ```
   Vérifier que l’API répond sur `http://localhost:5000` (ex. `GET http://localhost:5000/api/events`).

2. Dans un **second terminal**, lancer ngrok vers le port 5000 :
   ```bash
  ngrok http 5000
  ```

3. Dans la sortie de ngrok, noter l’**URL HTTPS** affichée, par exemple :
   ```
   Forwarding   https://abc123def.ngrok-free.app -> http://localhost:5000
   ```
   Cette URL est ta **base publique de l’API** (sans le suffixe `/api` pour la base ; l’app enverra les requêtes vers `https://abc123def.ngrok-free.app/api`).

### 1.2.3 Configurer le backend (CORS)

Le navigateur et l’app mobile enverront des requêtes depuis une origine différente de `localhost`. Il faut autoriser l’origine du tunnel (et Expo) dans CORS.

1. Ouvrir le fichier `.env` du backend (dans `backend/`).

2. Ajouter ou modifier la variable `CORS_ORIGINS` pour inclure :
   - L’URL ngrok **sans** le chemin (ex. `https://abc123def.ngrok-free.app`).
   - Les origines Expo si tu utilises l’app mobile (Expo Go utilise des origines du type `exp://...` ; tu peux aussi mettre `*` pour les tests, **à restreindre en production**).
   Exemple :
   ```env
   CORS_ORIGINS=https://abc123def.ngrok-free.app,http://localhost:3000,http://localhost:8081,exp://192.168.x.x:8081
   ```
   Remplacer `https://abc123def.ngrok-free.app` par ton URL ngrok réelle.

3. Redémarrer le backend (`Ctrl+C` puis `npm run dev`).

### 1.2.4 Configurer l’app mobile (URL de l’API)

1. Ouvrir le fichier qui définit l’URL de base de l’API, par exemple `mobile/src/api/client.js`.

2. Remplacer l’URL actuelle (ex. `http://192.168.1.42:5000/api`) par l’URL ngrok + `/api` :
   ```text
   https://abc123def.ngrok-free.app/api
   ```
   (adapter avec ton URL ngrok.)

3. Sauvegarder, puis relancer l’app Expo (ou recharger).

### 1.2.5 Vérifications

- **Depuis un navigateur** : ouvrir `https://TON_URL_NGROK/api/events` (sans être sur le même réseau que le PC). Tu dois recevoir la réponse JSON des événements (ou une erreur métier, pas une erreur CORS).
- **Depuis l’app mobile** : se connecter au même compte, lister les événements. Si tout est bien configuré (CORS + URL dans `client.js`), l’app doit fonctionner via Internet.
- **Remarque** : en gratuit, ngrok affiche parfois une page d’avertissement au premier chargement ; cliquer sur « Visit Site » si besoin.

---

## 1.3 Option 2 – Tunnel avec Cloudflare (cloudflared)

Avec Cloudflare Tunnel, tu peux obtenir une URL fixe de type `https://evencia-ton-compte.trycloudflare.com` (ou un sous-domaine personnalisé si tu gères un domaine chez Cloudflare).

### 1.3.1 Installer cloudflared

- **Linux (Debian/Ubuntu)**  
  ```bash
  curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  sudo dpkg -i cloudflared.deb
  ```

- **Windows**  
  Télécharger l’exécutable depuis [developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation).

- Un compte Cloudflare (gratuit) est utile pour un sous-domaine persistant ; le mode « quick tunnel » fonctionne sans compte mais avec une URL qui change à chaque session.

### 1.3.2 Lancer un quick tunnel (sans compte)

1. Backend lancé sur `http://localhost:5000`.
2. Dans un autre terminal :
   ```bash
   cloudflared tunnel --url http://localhost:5000
   ```
3. Noter l’URL affichée (ex. `https://xxx-xxx-xxx.trycloudflare.com`). C’est ta **base publique de l’API** (les requêtes iront vers `https://xxx-xxx-xxx.trycloudflare.com/api`).

### 1.3.3 Configurer CORS et l’app mobile

- Dans le `.env` du backend, ajouter cette URL dans `CORS_ORIGINS` (ex. `https://xxx-xxx-xxx.trycloudflare.com`).
- Dans `mobile/src/api/client.js`, mettre `API_BASE_URL = 'https://xxx-xxx-xxx.trycloudflare.com/api'`.
- Redémarrer le backend, recharger l’app, puis tester comme en 1.2.5.

---

## 1.4 Synthèse Partie 1

- Tu as une **URL publique HTTPS** (ngrok ou Cloudflare) qui pointe vers ton backend sur ton PC.
- Le backend autorise cette origine dans **CORS**.
- L’**app mobile** utilise cette URL comme base pour l’API.
- Tant que le backend et le tunnel tournent sur ton PC, l’API est accessible depuis Internet. À l’arrêt du tunnel ou du backend, l’accès ne fonctionne plus.

---

# Partie 2 – Déploiement « pour de bon » sur un serveur Linux

On suppose un serveur frais (VPS ou machine dédiée) avec une IP publique, sous Debian ou Ubuntu. Pas de modification du code du projet demandée ici : uniquement configuration et commandes sur le serveur.

---

## 2.1 Prérequis serveur

- Accès **SSH** (utilisateur avec droits sudo).
- **Domaine** (optionnel mais recommandé) pointant vers l’IP du serveur (ex. `api.evencia.fr` → IP du VPS). Sinon, tu pourras utiliser l’IP directement pour les tests.

---

## 2.2 Préparer le serveur (base)

Se connecter en SSH puis exécuter les commandes suivantes (à adapter si tu es sous Ubuntu : `apt` reste valide).

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git
```

---

## 2.3 Installer Node.js (LTS)

Utiliser NodeSource pour une version LTS (ex. 20) :

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # doit afficher v20.x
npm -v
```

---

## 2.4 Installer MySQL

```bash
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

Sécurisation basique :

```bash
sudo mysql_secure_installation
```

- Définir un mot de passe root si demandé.
- Répondre oui aux questions de sécurité (suppression des utilisateurs anonymes, désactivation de la connexion root à distance, etc.).

Créer la base et un utilisateur dédié pour Evencia :

```bash
sudo mysql -u root -p
```

Dans le client MySQL :

```sql
CREATE DATABASE evencianew CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'evencia'@'localhost' IDENTIFIED BY 'MOT_DE_PASSE_FORT_ICI';
GRANT ALL PRIVILEGES ON evencianew.* TO 'evencia'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Noter le mot de passe ; il servira pour `DB_PASSWORD` dans le `.env` du backend.

---

## 2.5 Déployer le code du backend

- Soit **cloner** le dépôt Git depuis ta machine (si le projet est sur Git) :
  ```bash
  cd /opt   # ou un autre répertoire de ton choix
  sudo git clone https://github.com/TON_ORG/TON_REPO.git evencia
  sudo chown -R $USER:$USER evencia
  cd evencia/backend
  ```
- Soit **copier** le dossier `evencia` (avec `backend/`) sur le serveur via `scp` ou rsync, par exemple :
  ```bash
  scp -r evencia utilisateur@IP_DU_SERVEUR:/opt/
  ```
  Puis sur le serveur : `cd /opt/evencia/backend`.

Ensuite :

```bash
npm install --omit=dev
```

Créer le fichier `.env` à la racine de `backend/` (ne pas commiter ce fichier) :

```env
PORT=5000
NODE_ENV=production
JWT_SECRET=UN_SECRET_JWT_TRES_LONG_ET_ALEATOIRE_64_CARACTERES_MINIMUM
JWT_EXPIRES_IN=7d

DB_HOST=localhost
DB_PORT=3306
DB_USER=evencia
DB_PASSWORD=MOT_DE_PASSE_FORT_ICI
DB_NAME=evencianew

CORS_ORIGINS=https://ton-domaine.com,https://api.ton-domaine.com
```

- Remplacer `JWT_SECRET` par une valeur générée (ex. `openssl rand -hex 32`).
- Remplacer `CORS_ORIGINS` par les domaines réels de ton front / app (et les origines Expo si besoin).
- Si tu n’as pas de domaine, tu peux mettre `*` pour les tests (à restreindre ensuite).

Lancer les migrations :

```bash
npm run migrate
```

Optionnel : créer un compte admin :

```bash
npm run seed
```

Tester que le backend répond en local sur le serveur :

```bash
node src/server.js
# ou npm run start si le script "start" existe
```

Dans un autre terminal (ou depuis ta machine) : `curl http://IP_DU_SERVEUR:5000/api/events`. Puis arrêter le serveur (Ctrl+C).

---

## 2.6 Lancer le backend en production avec PM2

PM2 garde le processus Node actif et le relance en cas de crash ou après redémarrage du serveur.

```bash
sudo npm install -g pm2
cd /opt/evencia/backend   # adapter le chemin
pm2 start src/server.js --name evencia-api
# ou : pm2 start npm --name evencia-api -- run start
pm2 save
pm2 startup
```

Exécuter la commande que `pm2 startup` affiche (souvent un `sudo env PATH=...`). Vérifier :

```bash
pm2 status
pm2 logs evencia-api
```

---

## 2.7 Installer Nginx et configurer le reverse proxy

Nginx écoute sur 80 (et plus tard 443 pour HTTPS) et redirige les requêtes vers `http://127.0.0.1:5000`.

```bash
sudo apt install -y nginx
```

Créer un fichier de configuration pour ton site (remplacer `api.evencia.fr` par ton domaine ou par l’IP pour les tests) :

```bash
sudo nano /etc/nginx/sites-available/evencia-api
```

Contenu type (à adapter `server_name`) :

```nginx
server {
    listen 80;
    server_name api.evencia.fr;
    # si pas de domaine : server_name IP_DU_SERVEUR;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activer le site et recharger Nginx :

```bash
sudo ln -s /etc/nginx/sites-available/evencia-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Tester : `http://api.evencia.fr/api/events` ou `http://IP_DU_SERVEUR/api/events`.

---

## 2.8 HTTPS avec Let's Encrypt (recommandé)

À faire **si** tu as un nom de domaine pointant vers ce serveur.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.evencia.fr
```

Suivre les instructions (email, acceptation des conditions). Certbot configure automatiquement Nginx pour le HTTPS et la redirection HTTP → HTTPS.

Ensuite, dans le `.env` du backend, `CORS_ORIGINS` doit inclure `https://api.evencia.fr` (et les origines de ton app mobile / front). Redémarrer l’API si besoin :

```bash
pm2 restart evencia-api
```

---

## 2.9 Pare-feu

Ne laisser ouverts que les ports utiles (SSH, HTTP, HTTPS) :

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

Le port 5000 ne doit **pas** être exposé ; seul Nginx (80/443) est accessible.

---

## 2.10 Configurer l’app mobile pour la production

Dans le projet mobile, dans le fichier qui définit l’URL de l’API (ex. `mobile/src/api/client.js`), mettre l’URL de production :

- Avec domaine : `https://api.evencia.fr/api`
- Sans domaine (tests) : `http://IP_DU_SERVEUR/api`

Rebuilder / redistribuer l’app pour que les utilisateurs utilisent la nouvelle URL.

---

## 2.11 Synthèse Partie 2

- Serveur à jour, Node.js (LTS), MySQL, base et utilisateur créés.
- Code backend déployé, `.env` de production, migrations et seed si besoin.
- Backend lancé avec **PM2**.
- **Nginx** en reverse proxy sur le port 80 (et 443 avec **Let's Encrypt** si domaine).
- **Pare-feu** configuré.
- **App mobile** pointant vers l’URL de l’API de production.

---

# Récapitulatif des deux parties

| Partie | Objectif | Résultat |
|--------|----------|----------|
| **Partie 1 (Option A)** | Exposer le backend depuis ton PC sur Internet | URL publique (ngrok ou Cloudflare) ; CORS et app mobile configurés pour cette URL. |
| **Partie 2** | Déploiement permanent sur Linux | Backend + MySQL sur un VPS/serveur ; Nginx + HTTPS ; PM2 ; app mobile configurée pour l’URL de prod. |

Une fois la Partie 2 en place, tu peux arrêter d’utiliser le tunnel (Partie 1) pour la production et n’utiliser le tunnel que pour des tests ponctuels depuis ton PC.
