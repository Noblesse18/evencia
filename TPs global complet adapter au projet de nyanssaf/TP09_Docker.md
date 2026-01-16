# TP09 - Docker et Déploiement

## 🎯 Objectifs

- Comprendre les concepts de Docker
- Créer des Dockerfile pour le backend et le frontend
- Configurer docker-compose pour orchestrer les services
- Déployer l'application en local avec Docker

**Durée estimée :** 1h30

---

## 📋 Prérequis

- Docker Desktop installé
- TP01 à TP08 terminés

---

## Comprendre Docker

### Qu'est-ce que Docker ?

Docker permet de "conteneuriser" des applications. Un conteneur est comme une machine virtuelle légère contenant votre application et toutes ses dépendances.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Host                               │
├───────────────┬─────────────────┬───────────────┬───────────────┤
│   Container   │    Container    │   Container   │   Container   │
│   Frontend    │     Backend     │     MySQL     │     Redis     │
│   (React)     │    (Node.js)    │               │               │
│   Port 3000   │    Port 4000    │   Port 3306   │   Port 6379   │
└───────────────┴─────────────────┴───────────────┴───────────────┘
```

### Avantages

- **Portabilité** : Fonctionne de la même façon partout
- **Isolation** : Chaque service est indépendant
- **Reproductibilité** : Même environnement dev/prod
- **Facilité** : Un seul fichier pour démarrer tout

---

## Étape 1 : Dockerfile Backend

### 1.1 Créer backend/Dockerfile

```dockerfile
# ==================================
# Stage 1 : Dépendances de production
# ==================================
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copier uniquement les fichiers de dépendances
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm ci --only=production

# ==================================
# Stage 2 : Image finale
# ==================================
FROM node:18-alpine

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copier les dépendances depuis le stage précédent
COPY --from=dependencies /app/node_modules ./node_modules

# Copier le code source
COPY . .

# Créer les dossiers nécessaires
RUN mkdir -p uploads logs && \
    chown -R appuser:appgroup /app

# Utiliser l'utilisateur non-root
USER appuser

# Exposer le port
EXPOSE 4000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

# Commande de démarrage
CMD ["node", "src/server.js"]
```

> 💡 **Explications** :
> - `node:18-alpine` : Image légère basée sur Alpine Linux
> - `--only=production` : N'installe pas les devDependencies
> - `USER appuser` : Sécurité (ne pas tourner en root)
> - `HEALTHCHECK` : Docker vérifie que l'app est fonctionnelle

### 1.2 Créer backend/.dockerignore

```
node_modules
npm-debug.log
.env
.env.*
logs/*
uploads/*
coverage
.git
.gitignore
*.md
tests
__tests__
```

---

## Étape 2 : Dockerfile Frontend

### 2.1 Créer frontend/Dockerfile (développement)

```dockerfile
# Dockerfile pour le développement
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 3000

# Démarrer en mode développement
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### 2.2 Créer frontend/Dockerfile.prod (production)

```dockerfile
# ==================================
# Stage 1 : Build
# ==================================
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build de production
RUN npm run build

# ==================================
# Stage 2 : Serveur nginx
# ==================================
FROM nginx:alpine

# Copier la configuration nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Exposer le port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### 2.3 Créer frontend/nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache des assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Toutes les routes renvoient index.html (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy vers le backend
    location /api {
        proxy_pass http://backend:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Fichiers uploadés
    location /uploads {
        proxy_pass http://backend:4000;
    }
}
```

### 2.4 Créer frontend/.dockerignore

```
node_modules
npm-debug.log
dist
.git
.gitignore
*.md
```

---

## Étape 3 : Docker Compose

### 3.1 Créer docker-compose.yml (racine du projet)

```yaml
version: '3.8'

services:
  # ==================================
  # Base de données MySQL
  # ==================================
  mysql:
    image: mysql:8.0
    container_name: onelastevent_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-rootpassword}
      MYSQL_DATABASE: ${DB_NAME:-onelastevent_db}
      MYSQL_USER: ${DB_USER:-onevent_user}
      MYSQL_PASSWORD: ${DB_PASS:-yourpassword}
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3307:3306"  # Port 3307 pour éviter conflit avec MySQL local
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  # ==================================
  # Redis (cache et sessions)
  # ==================================
  redis:
    image: redis:7-alpine
    container_name: onelastevent_redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6380:6379"  # Port 6380 pour éviter conflit avec Redis local
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  # ==================================
  # Backend API (Node.js)
  # ==================================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: onelastevent_backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 4000
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: ${DB_USER:-onevent_user}
      DB_PASS: ${DB_PASS:-yourpassword}
      DB_NAME: ${DB_NAME:-onelastevent_db}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET:-your_jwt_access_secret}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:-your_jwt_refresh_secret}
      FRONTEND_URL: http://localhost:3000
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/logs:/app/logs
    ports:
      - "4000:4000"
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app-network

  # ==================================
  # Frontend (React - Dev)
  # ==================================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: onelastevent_frontend
    restart: unless-stopped
    environment:
      VITE_API_URL: http://localhost:4000/api
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - app-network

# ==================================
# Volumes persistants
# ==================================
volumes:
  mysql_data:
    name: onelastevent_mysql_data
  redis_data:
    name: onelastevent_redis_data

# ==================================
# Réseau
# ==================================
networks:
  app-network:
    driver: bridge
    name: onelastevent_network
```

### 3.2 Créer docker-compose.prod.yml (production)

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: onelastevent_mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASS}
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    container_name: onelastevent_redis
    restart: always
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: onelastevent_backend
    restart: always
    environment:
      NODE_ENV: production
      PORT: 4000
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: ${DB_USER}
      DB_PASS: ${DB_PASS}
      DB_NAME: ${DB_NAME}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
    volumes:
      - uploads:/app/uploads
      - logs:/app/logs
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: onelastevent_frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - app-network

volumes:
  mysql_data:
  redis_data:
  uploads:
  logs:

networks:
  app-network:
    driver: bridge
```

---

## Étape 4 : Lancer l'application

### 4.1 Créer le fichier .env pour Docker

À la racine du projet, créez `.env` :

```env
# Database
DB_ROOT_PASSWORD=rootpassword123
DB_NAME=onelastevent_db
DB_USER=onevent_user
DB_PASS=userpassword123

# JWT (IMPORTANT: Générez des secrets uniques!)
JWT_ACCESS_SECRET=your_very_long_and_secure_access_secret_here_32chars
JWT_REFRESH_SECRET=your_very_long_and_secure_refresh_secret_here_32chars

# Redis (prod)
REDIS_PASSWORD=redispassword123

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 4.2 Lancer en développement

```bash
# Construire les images
docker-compose build

# Lancer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f backend
```

### 4.3 Vérifier que tout fonctionne

```bash
# Vérifier les conteneurs en cours
docker-compose ps

# Tester le backend
curl http://localhost:4000/api/health

# Ouvrir le frontend dans le navigateur
open http://localhost:3000
```

### 4.4 Commandes utiles

```bash
# Arrêter les conteneurs
docker-compose down

# Arrêter et supprimer les volumes (ATTENTION: perte de données!)
docker-compose down -v

# Reconstruire un service
docker-compose build backend

# Redémarrer un service
docker-compose restart backend

# Entrer dans un conteneur
docker-compose exec backend sh
docker-compose exec mysql mysql -u onevent_user -p
```

---

## Étape 5 : Migrations et Seeds

### 5.1 Exécuter les migrations

```bash
# Entrer dans le conteneur backend
docker-compose exec backend sh

# Exécuter les migrations
npm run migrate

# Exécuter les seeds
npm run seed
```

---

## ✅ Checklist de validation

- [ ] Docker Desktop est installé et fonctionne
- [ ] `docker-compose build` réussit sans erreur
- [ ] `docker-compose up -d` démarre tous les services
- [ ] http://localhost:4000/api/health répond `{ "status": "ok" }`
- [ ] http://localhost:3000 affiche le frontend
- [ ] Les migrations s'exécutent correctement
- [ ] Les données sont persistées après redémarrage

---

## 📝 Points Clés à Retenir

1. **Multi-stage build** : Réduit la taille des images
2. **Non-root user** : Améliore la sécurité
3. **Healthchecks** : Permet à Docker de surveiller la santé des services
4. **Volumes** : Persistent les données au-delà de la vie des conteneurs
5. **Networks** : Isolent les services et permettent la communication

---

## 🔗 Prochaine étape

Continuez avec le [TP10 - Corrections et Bonnes Pratiques](./TP10_Corrections_BestPractices.md)
