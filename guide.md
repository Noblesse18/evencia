# Guide de lancement du projet Evencia

## Prérequis

- Docker et Docker Compose
- Node.js 18+
- Android SDK (`~/Android/Sdk`)
- Java JDK (`sudo pacman -S jdk-openjdk`)
- scrcpy (`sudo pacman -S scrcpy`)

## 1. Lancer le backend + frontend + base de données (Docker)

```bash
cd /home/comaravel/bts/evencia
docker compose up --build -d
```

Vérifier que tout tourne :

```bash
docker compose ps
```

| Service  | URL                              |
|----------|----------------------------------|
| Frontend | http://localhost:3000             |
| Backend  | http://localhost:5000             |
| Swagger  | http://localhost:5000/api-docs    |
| MySQL    | localhost:3307                    |

Pour voir les logs :

```bash
docker compose logs -f
```

Pour tout arrêter :

```bash
docker compose down
```

## 2. Lancer l'émulateur Android

### Démarrer l'émulateur (mode headless)

Lister les AVD disponibles : `emulator -list-avds`

Puis lancer l'émulateur :

```bash
emulator -avd Pixel_9 -no-snapshot-load -qt-hide-window -no-skin &
```

### Afficher l'écran avec scrcpy

```bash
scrcpy
```

### Vérifier que l'émulateur est détecté

```bash
adb devices
```

## 3. Lancer l'application mobile (Expo)

```bash
cd /home/comaravel/bts/evencia/mobile
npm install
npx expo start
```

Puis appuyer sur `a` pour ouvrir sur l'émulateur Android.

## Résumé : ordre de lancement

```bash
# Terminal 1 : Docker (backend + frontend + BDD)
cd /home/comaravel/bts/evencia
docker compose up --build -d

# Terminal 2 : Émulateur Android
emulator -avd Pixel_9 -no-snapshot-load -qt-hide-window -no-skin &
scrcpy

# Terminal 3 : Stripe webhook (paiements)
stripe listen --forward-to localhost:5000/api/payments/webhook

# Terminal 4 : Application mobile Expo
cd /home/comaravel/bts/evencia/mobile
npx expo start
# Appuyer sur 'a' pour ouvrir sur Android
```

## 4. Lancer Stripe (paiements)

### Installer Stripe CLI

```bash
curl -L https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz -o /tmp/stripe.tar.gz
tar -xzf /tmp/stripe.tar.gz -C /tmp
sudo mv /tmp/stripe /usr/local/bin/
```

### Se connecter à Stripe

```bash
stripe login
```

### Lancer le listener de webhook

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

Copier le `whsec_...` affiché et le mettre dans `.env` :

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxx
```

Puis redémarrer le backend (`docker compose restart backend`).

Laisser `stripe listen` tourner dans un terminal pendant le développement.

### Carte de test

Numéro : `4242 4242 4242 4242`, date future quelconque, CVC quelconque.

## Variables d'environnement

Les variables sont définies dans `docker-compose.yml` avec des valeurs par défaut.
Pour les personnaliser, créer un fichier `.env` à la racine du projet :

```env
DB_PASSWORD=comaravel
DB_NAME=evencianew
JWT_SECRET=votre_secret
CORS_ORIGINS=http://localhost:3000,http://localhost:5000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

## 5. Déploiement en production (Oracle Cloud + nginx)

### Prérequis serveur

- Un VPS Oracle Cloud Free Tier (gratuit) : [cloud.oracle.com](https://cloud.oracle.com)
  - Instance **VM.Standard.A1.Flex** (ARM) ou **VM.Standard.E2.1.Micro** (x86)
  - OS : Ubuntu 22.04 ou **Oracle Linux** (utilisateur `opc`)
  - Ouvrir les ports **80** et **443** dans les Security Lists du VCN
- Un sous-domaine gratuit via [duckdns.org](https://duckdns.org) (ex: `evencia.duckdns.org`)

### Étape 1 : Se connecter au VPS

```bash
ssh -i /chemin/vers/ta-cle.key opc@IP_DU_VPS
# Pour Oracle Linux, l'utilisateur est "opc" (pas ubuntu)
```

### Étape 2 : Installer Docker et Git

**Oracle Linux :**

```bash
sudo dnf install -y docker-engine git
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

**Ubuntu :**

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

> ⚠️ **Se déconnecter et reconnecter** pour que le groupe `docker` soit pris en compte.

### Étape 3 : Cloner le projet

```bash
# Via HTTPS (recommandé si pas de clé SSH GitHub sur le VPS)
git clone https://github.com/Noblesse18/evencia.git ~/evencia
cd ~/evencia

# OU via SSH (si tu as ajouté une clé déploiement sur le VPS)
# git clone git@github.com:Noblesse18/evencia.git ~/evencia
```

### Étape 4 : Configurer les variables d'environnement

```bash
cp .env.production .env
nano .env   # ou vi .env
```

Remplir les valeurs dans `.env` (remplace `evencia.duckdns.org` par ton domaine) :

```env
DOMAIN=evencia.duckdns.org
DB_PASSWORD=un_mot_de_passe_fort
JWT_SECRET=un_secret_genere_avec_openssl_rand_hex_32
CORS_ORIGINS=https://evencia.duckdns.org
FRONTEND_URL=https://evencia.duckdns.org
NEXT_PUBLIC_API_URL=https://evencia.duckdns.org/api
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Générer un JWT_SECRET : `openssl rand -hex 32`

### Étape 5 : Lancer en production

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Vérifier que tout tourne :

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

**Test rapide sans domaine** : Si tu n'as pas encore de domaine, configure `.env` avec l'IP du VPS :
- `CORS_ORIGINS=http://IP_DU_VPS`
- `FRONTEND_URL=http://IP_DU_VPS`
- `NEXT_PUBLIC_API_URL=http://IP_DU_VPS/api`

Puis accède au site via `http://IP_DU_VPS`. Pour HTTPS, il faut un nom de domaine.

### Étape 6 : Activer HTTPS avec Certbot (avec un domaine)

Obtenir le certificat SSL (le site doit être accessible sur le port 80) :

```bash
docker compose -f docker-compose.prod.yml exec certbot \
  certbot certonly --webroot -w /var/www/certbot -d evencia.duckdns.org
```

Puis redémarrer nginx :

```bash
docker compose -f docker-compose.prod.yml restart nginx
```

### Étape 7 : Configurer le webhook Stripe en production

1. Aller sur [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Ajouter un endpoint : `https://evencia.duckdns.org/api/payments/webhook`
3. Sélectionner l'événement `checkout.session.completed`
4. Copier le signing secret et le mettre dans `.env` comme `STRIPE_WEBHOOK_SECRET`
5. Redémarrer le backend : `docker compose -f docker-compose.prod.yml restart backend`

### Mise à jour du site

```bash
cd ~/evencia
git pull
docker compose -f docker-compose.prod.yml up --build -d
```

## Dépannage

### `adb` ou `emulator` non trouvé

```bash
source ~/.bashrc
```

### L'émulateur affiche un bloc blanc

Utiliser scrcpy au lieu de la fenêtre de l'émulateur (lancer en mode `-qt-hide-window`).

### Expo ne détecte pas l'émulateur

S'assurer que l'émulateur est démarré avant d'appuyer sur `a` :

```bash
adb devices
# Doit afficher : emulator-5554   device
```
