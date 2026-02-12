# Makefile Evencia - Lancement du projet avec Docker Compose
# Usage: make [cible]

.PHONY: help up up-build down build logs logs-backend logs-frontend logs-mysql ps restart clean shell-backend shell-frontend shell-mysql

# Cible par défaut
help:
	@echo "Evencia - Commandes disponibles:"
	@echo ""
	@echo "  make up          - Démarrer les conteneurs (sans rebuild)"
	@echo "  make up-build    - Démarrer et construire les images"
	@echo "  make down        - Arrêter les conteneurs"
	@echo "  make build       - Construire les images sans démarrer"
	@echo "  make logs        - Voir les logs de tous les services"
	@echo "  make logs-backend   - Logs du backend uniquement"
	@echo "  make logs-frontend  - Logs du frontend uniquement"
	@echo "  make logs-mysql     - Logs de MySQL uniquement"
	@echo "  make ps          - État des conteneurs"
	@echo "  make restart     - Redémarrer (down + up-build)"
	@echo "  make clean       - Arrêter et supprimer les volumes"
	@echo "  make shell-backend  - Shell dans le conteneur backend"
	@echo "  make shell-frontend - Shell dans le conteneur frontend"
	@echo "  make shell-mysql    - Connexion MySQL (cli)"
	@echo ""

# Démarrer les conteneurs
up:
	docker compose up -d

# Démarrer et (re)construire les images
up-build:
	docker compose up --build -d

# Arrêter les conteneurs
down:
	docker compose down

# Construire les images
build:
	docker compose build

# Logs
logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

logs-mysql:
	docker compose logs -f mysql

# État des conteneurs
ps:
	docker compose ps

# Redémarrer proprement
restart: down up-build

# Nettoyer (conteneurs + volumes)
clean:
	docker compose down -v

# Shell dans les conteneurs (debug)
shell-backend:
	docker compose exec backend sh

shell-frontend:
	docker compose exec frontend sh

shell-mysql:
	docker compose exec mysql mysql -uroot -pcomaravel evencianew
