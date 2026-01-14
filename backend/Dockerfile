# Backend Dockerfile - Node.js Express API
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le reste du code source
COPY . .

# Exposer le port de l'API
EXPOSE 5000

# Commande de démarrage
CMD ["npm", "start"]
