# 📚 Travaux Pratiques - OneLastEvent

## Projet BTS SIO SLAM - Plateforme de Gestion d'Événements

Bienvenue dans cette série de **10 TPs progressifs** qui vous guideront dans la création complète d'une application web fullstack professionnelle.

---

## 🎯 Objectifs Pédagogiques

À la fin de ces TPs, vous serez capable de :

- ✅ Concevoir une architecture backend MVC + Repository
- ✅ Créer une API REST sécurisée avec Node.js/Express
- ✅ Implémenter une authentification JWT complète
- ✅ Développer un frontend React moderne avec hooks
- ✅ Utiliser Docker pour le déploiement
- ✅ Appliquer les bonnes pratiques de sécurité

---

## 📋 Liste des TPs

| TP | Titre | Durée estimée | Compétences |
|----|-------|---------------|-------------|
| [TP01](./TP01_Environnement.md) | Configuration de l'environnement | 1h | Node.js, npm, Git |
| [TP02](./TP02_Base_de_donnees.md) | Base de données MySQL + Sequelize | 2h | SQL, ORM, Modélisation |
| [TP03](./TP03_Architecture_Backend.md) | Architecture MVC + Repository | 2h | Patterns, Services |
| [TP04](./TP04_Authentification_JWT.md) | Authentification JWT | 2h30 | Sécurité, Tokens |
| [TP05](./TP05_API_REST.md) | API REST complète | 2h | Routes, CRUD, Validation |
| [TP06](./TP06_Frontend_React.md) | Frontend React - Configuration | 1h30 | Vite, Tailwind, Routing |
| [TP07](./TP07_Auth_Frontend.md) | Authentification côté Frontend | 2h | Context, Hooks, Axios |
| [TP08](./TP08_Pages_Composants.md) | Pages et Composants | 3h | React, UI/UX |
| [TP09](./TP09_Docker.md) | Docker et Déploiement | 1h30 | Conteneurisation |
| [TP10](./TP10_Corrections_BestPractices.md) | Corrections et Bonnes Pratiques | 1h | Sécurité, Optimisation |

---

## 🛠️ Prérequis Techniques

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** 18+ : [https://nodejs.org/](https://nodejs.org/)
- **Git** : [https://git-scm.com/](https://git-scm.com/)
- **VS Code** ou **Cursor** : Éditeur de code
- **Docker Desktop** : [https://www.docker.com/](https://www.docker.com/)
- **MySQL** 8.0 (ou via Docker)
- **Postman** : Pour tester l'API

---

## 📁 Structure Finale du Projet

```
onelastevent/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration (DB, Redis, Logger)
│   │   ├── controllers/     # Gestion des requêtes HTTP
│   │   ├── services/        # Logique métier
│   │   ├── repositories/    # Accès aux données
│   │   ├── models/          # Entités Sequelize
│   │   ├── middlewares/     # Auth, validation, erreurs
│   │   ├── validators/      # Schémas Joi
│   │   ├── routes/          # Définition des routes
│   │   ├── utils/           # Fonctions utilitaires
│   │   └── server.js        # Point d'entrée
│   ├── .env                 # Variables d'environnement
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Composants réutilisables
│   │   ├── pages/           # Pages de l'application
│   │   ├── context/         # Context React (Auth)
│   │   ├── services/        # Appels API
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 🎓 Conseils pour Réussir

1. **Suivez l'ordre des TPs** - Chaque TP s'appuie sur le précédent
2. **Testez à chaque étape** - Ne passez pas au TP suivant sans avoir validé
3. **Lisez les explications** - Comprenez le "pourquoi" de chaque code
4. **Prenez des notes** - Documentez vos apprentissages
5. **Expérimentez** - Modifiez le code pour comprendre son fonctionnement

---

## 🚀 Commencer

Rendez-vous au [TP01 - Configuration de l'environnement](./TP01_Environnement.md) pour débuter !

---

*Ces TPs ont été conçus pour l'épreuve E4 du BTS SIO SLAM*
