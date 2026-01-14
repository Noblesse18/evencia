# Frontend Dockerfile - Next.js 16
FROM node:20-alpine AS base

# Installer les dépendances nécessaires pour les builds
RUN apk add --no-cache libc6-compat

# ==========================================
# Étape des dépendances
# ==========================================
FROM base AS deps
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances
RUN npm ci

# ==========================================
# Étape de build
# ==========================================
FROM base AS builder
WORKDIR /app

# Copier les dépendances installées
COPY --from=deps /app/node_modules ./node_modules

# Copier le code source
COPY . .

# Variable d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED=1

# Builder l'application
RUN npm run build

# ==========================================
# Étape de production
# ==========================================
FROM base AS runner
WORKDIR /app

# Définir l'environnement de production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers publics
COPY --from=builder /app/public ./public

# Créer le dossier .next et définir les permissions
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copier les fichiers de build standalone (si disponible) ou le build complet
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Utiliser l'utilisateur non-root
USER nextjs

# Exposer le port
EXPOSE 3000

# Variable d'environnement pour le port
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Commande de démarrage
CMD ["node", "server.js"]
