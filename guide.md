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

```bash
emulator -avd Medium_Phone_API_36.1 -no-snapshot-load -qt-hide-window -no-skin &
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
emulator -avd Medium_Phone_API_36.1 -no-snapshot-load -qt-hide-window -no-skin &
scrcpy

# Terminal 3 : Application mobile Expo
cd /home/comaravel/bts/evencia/mobile
npx expo start
# Appuyer sur 'a' pour ouvrir sur Android
```

## Variables d'environnement

Les variables sont définies dans `docker-compose.yml` avec des valeurs par défaut.
Pour les personnaliser, créer un fichier `.env` à la racine du projet :

```env
DB_PASSWORD=comaravel
DB_NAME=evencianew
JWT_SECRET=votre_secret
CORS_ORIGINS=http://localhost:3000,http://localhost:5000
STRIPE_SECRET_KEY=sk_test_...
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
