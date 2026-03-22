# Analyse des fiches E5 — Projet Evencia

> Analyse comparative des deux fiches **Annexe 9-1-B** (Épreuve E5 — SLAM) par rapport aux exigences du **Guide E6 BTS SIO SLAM 2026** et de la **Fiche E6 Verso Exemple**.

---

## Légende

- ✅ Présent et conforme
- ⚠️ Présent mais à corriger
- ❌ Absent — à ajouter

---

---

# Fiche 1 : Application Mobile (React Native / Expo)

## RECTO — Analyse champ par champ

| Champ | État | Problème | Correction |
|-------|:----:|----------|------------|
| **Session** | ⚠️ | Indique « SESSION 2024 » | Corriger en **SESSION 2026** |
| **N° réalisation** | ❌ | Non renseigné (vide) | Indiquer **1** (ou **2** selon l'ordre choisi) |
| **N° candidat** | ❌ | Non renseigné | Renseigner : **02542627596** (comme sur la fiche web) |
| **Épreuve ponctuelle / CCF** | ⚠️ | Aucune case cochée | Cocher **☑ Épreuve ponctuelle** (ou CCF selon ta situation) |
| **Organisation support** | ✅ | CFA ITIS - Evry-Courcouronnes | OK |
| **Intitulé** | ⚠️ | « Conception et développement d'une application web fullstack... » | L'intitulé parle d'application **web** alors que c'est la fiche **mobile**. Corriger en : **« Conception et développement d'une application mobile de gestion d'événements (React Native / Expo) »** |
| **Période** | ✅ | Septembre 2025 – Mars 2026 | OK |
| **Modalité** | ⚠️ | Aucune case cochée | Cocher **☑ Seul(e)** |
| **Compétences** | ⚠️ | Les 3 cases sont non cochées (☐) | Cocher les compétences travaillées (au minimum « Concevoir et développer » et « Gérer les données ») |
| **Ressources fournies** | ⚠️ | Mentionne « React Native + Expo Go » dans les ressources fournies | Les ressources fournies = ce qu'on t'a donné au départ (cahier des charges, etc.), pas les technos utilisées |
| **Résultats attendus** | ✅ | Liste correcte (API, app mobile, auth, inscription, recherche) | OK |
| **Ressources logicielles** | ⚠️ | Liste correcte mais manque les versions précises pour certains outils | Ajouter les versions (React Navigation **7**, AsyncStorage **2.2**, Axios **1.13**) |
| **Modalités d'accès** | ⚠️ | Lien vers portfolio + GitHub avec URL incorrecte (`/linux`) | Corriger l'URL : `https://github.com/Noblesse18/evencia` (branche `linux`, dossier `/mobile`). Ajouter les commandes de lancement |

## VERSO — Analyse de la structure

Le Guide E6 recommande la structure suivante pour le verso. Voici l'état actuel :

| Section attendue (Guide E6) | État | Détail |
|------------------------------|:----:|--------|
| **A. Contexte et besoins** | ⚠️ | Un court paragraphe existe (page 4) mais trop succinct. Pas de mention du contexte métier ni des besoins détaillés |
| **B. Architecture technique** | ⚠️ | Mentionne « Architecture Backend » et « Architecture Frontend » mais semble être des titres pour des images sans texte explicatif |
| **C.1 Diagramme de cas d'utilisation** | ✅ | Mentionné (page 4) |
| **C.2 Diagramme de classes** | ✅ | Mentionné (page 4) |
| **C.3 Diagramme de séquence** | ❌ | **ABSENT** — Le guide l'exige explicitement |
| **D. Captures d'écran commentées** | ⚠️ | 2 captures présentes (accueil + réservation, pages 5-6) mais **commentaires trop courts** |
| **E. Démarche de développement (sprints)** | ❌ | **ABSENT** — Aucune description de la méthodologie de développement |
| **F. Tests et validation** | ❌ | **ABSENT** — Aucune section de tests |
| **G. Bilan et perspectives** | ❌ | **ABSENT** |
| **Historique Git** | ❌ | **ABSENT** — Le guide recommande une capture de l'historique Git |

### Éléments manquants critiques (verso mobile) :

1. **Diagramme de séquence UML** — Illustrer par exemple le flux d'authentification mobile (saisie → POST /api/auth/login → token → AsyncStorage → redirection)
2. **Section Tests** — Décrire les tests effectués (tests manuels sur émulateur, tests sur appareil physique Expo Go, scénarios testés)
3. **Démarche de développement** — Décrire les sprints ou étapes de développement
4. **Bilan** — Résumer les résultats et les perspectives d'amélioration
5. **Capture de l'historique Git** — Montrer les commits réguliers

---

---

# Fiche 2 : Application Web (Express.js + Next.js)

## RECTO — Analyse champ par champ

| Champ | État | Problème | Correction |
|-------|:----:|----------|------------|
| **Session (recto)** | ✅ | Indique « SESSION 2026 » | OK |
| **Session (verso p.3)** | ⚠️ | L'en-tête du verso indique « SESSION 2024 » | Corriger en **SESSION 2026** |
| **N° réalisation** | ✅ | 2 | OK |
| **N° candidat** | ✅ | 02542627596 | OK |
| **Épreuve ponctuelle / CCF** | ⚠️ | Aucune case cochée | Cocher **☑ Épreuve ponctuelle** (ou CCF) |
| **Organisation support** | ✅ | CFA ITIS - Evry-Courcouronnes | OK |
| **Intitulé** | ✅ | Clair et professionnel | OK |
| **Modalité** | ⚠️ | Aucune case cochée | Cocher **☑ Seul(e)** |
| **Compétences** | ⚠️ | Les 3 cases sont non cochées (☐) | Cocher les 3 compétences |
| **Typo « Strippe »** | ⚠️ | Apparaît 3 fois dans le document | Corriger en **Stripe** partout |
| **Ressources fournies** | ✅ | Cahier des charges, architecture applicative | OK |
| **Résultats attendus** | ✅ | Détaillés et pertinents | OK |
| **Ressources logicielles** | ✅ | Très détaillées avec versions | OK |
| **Modalités d'accès** | ⚠️ | Swagger uniquement en local (`localhost:5000`) + URL GitHub avec `/linux` | Ajouter l'URL de production (`https://evencia.duckdns.org/api-docs`). Corriger l'URL GitHub. **Ajouter des identifiants de test** pour le jury |

## VERSO — Analyse de la structure

| Section attendue (Guide E6) | État | Détail |
|------------------------------|:----:|--------|
| **A. Contexte et besoins** | ✅ | Bon paragraphe descriptif avec les 3 rôles | OK |
| **B. Architecture technique** | ⚠️ | Mentionne « Architecture Backend » et « Architecture Frontend » mais texte minimal — semble s'appuyer sur des images |
| **C.1 Diagramme de cas d'utilisation** | ✅ | Présent |
| **C.2 Diagramme de classes** | ✅ | Présent |
| **C.3 Diagramme de séquence** | ❌ | **ABSENT** — Le guide l'exige explicitement |
| **D. Captures d'écran commentées** | ⚠️ | La page d'accueil est mentionnée (pages 5-7) mais les commentaires sont insuffisants |
| **D. Documentation Swagger** | ✅ | Capture Swagger mentionnée avec description des endpoints | OK |
| **E. Démarche de développement (sprints)** | ❌ | **ABSENT** |
| **F. Tests et validation** | ❌ | **ABSENT** |
| **G. Bilan et perspectives** | ❌ | **ABSENT** |
| **Historique Git** | ❌ | **ABSENT** |
| **Identifiants de test** | ❌ | **ABSENT** — Le jury doit pouvoir tester l'application |

### Éléments manquants critiques (verso web) :

1. **Diagramme de séquence UML** — Par exemple : inscription à un événement (Frontend → API → validation → BDD → réponse) ou flux de paiement Stripe
2. **Section Tests** — Décrire les tests réalisés (Postman/Swagger, tests fonctionnels, tests d'intégration)
3. **Démarche de développement** — Sprints, méthodologie itérative
4. **Bilan et perspectives** — Résultats obtenus, améliorations possibles
5. **Identifiants de test** — Admin + Participant pour le jury
6. **Capture de l'historique Git**

---

---

# Synthèse : éléments manquants dans les deux fiches

## Corrections à apporter sur les PDF

| Correction | Fiche Mobile | Fiche Web |
|------------|:------------:|:---------:|
| Session → 2026 | ⚠️ Toutes les pages | ⚠️ Verso uniquement |
| N° réalisation | ❌ À renseigner | ✅ OK |
| N° candidat | ❌ À renseigner | ✅ OK |
| Cocher épreuve ponctuelle/CCF | ⚠️ | ⚠️ |
| Cocher modalité (Seul) | ⚠️ | ⚠️ |
| Cocher compétences | ⚠️ | ⚠️ |
| Corriger intitulé (web → mobile) | ⚠️ | N/A |
| Corriger « Strippe » → « Stripe » | N/A | ⚠️ |
| Corriger URL GitHub | ⚠️ | ⚠️ |
| Ajouter identifiants de test | ❌ | ❌ |

## Documents / sections à ajouter au verso

| Élément à ajouter | Fiche Mobile | Fiche Web | Priorité |
|--------------------|:------------:|:---------:|:--------:|
| **Diagramme de séquence UML** | ❌ | ❌ | **HAUTE** — Exigé par le guide |
| **Section Tests et validation** | ❌ | ❌ | **HAUTE** — Critère d'évaluation |
| **Démarche de développement (sprints)** | ❌ | ❌ | **HAUTE** — Démontre la méthodologie |
| **Bilan et perspectives** | ❌ | ❌ | MOYENNE |
| **Capture historique Git** | ❌ | ❌ | MOYENNE |
| **Commentaires détaillés sur captures** | ⚠️ | ⚠️ | MOYENNE |

---

---

# Contenu suggéré pour compléter les versos

## Pour les deux fiches — Diagramme de séquence (exemple)

### Diagramme de séquence — Authentification JWT (pour la fiche Mobile)

```
Utilisateur          App Mobile (Expo)        API Express.js         MySQL
    │                      │                       │                   │
    │── Email + MDP ──────►│                       │                   │
    │                      │── POST /auth/login ──►│                   │
    │                      │                       │── SELECT user ───►│
    │                      │                       │◄── user row ──────│
    │                      │                       │                   │
    │                      │                       │ bcrypt.compare()  │
    │                      │                       │ jwt.sign({id,role})│
    │                      │                       │                   │
    │                      │◄── {token, user} ─────│                   │
    │                      │                       │                   │
    │                      │ AsyncStorage.setItem   │                   │
    │                      │ ('token', jwt)         │                   │
    │                      │                       │                   │
    │◄── HomeScreen ──────│                       │                   │
```

### Diagramme de séquence — Inscription + Paiement Stripe (pour la fiche Web)

```
Utilisateur       Frontend Next.js       API Express        MySQL         Stripe
    │                   │                    │                 │              │
    │── Clic Inscrire ─►│                    │                 │              │
    │                   │── POST /inscriptions►                │              │
    │                   │                    │── Vérif places ►│              │
    │                   │                    │◄── OK ──────────│              │
    │                   │                    │── INSERT ───────►│              │
    │                   │◄── 201 {inscription}│                │              │
    │                   │                    │                 │              │
    │                   │── POST /payments ──►│                │              │
    │                   │                    │── checkout.create►             │
    │                   │                    │◄── {url} ────────             │
    │                   │◄── {url} ─────────│                 │              │
    │◄── Redirect Stripe│                    │                 │              │
    │                   │                    │                 │              │
    │── Carte 4242... ──────────────────────────────────────────►             │
    │◄── Redirect success_url ──────────────────────────────────             │
    │                   │                    │                 │              │
    │                   │              ◄── POST /webhook ──────             │
    │                   │                    │── UPDATE status ►│              │
    │                   │                    │◄── OK ──────────│              │
```

---

## Pour les deux fiches — Section « Démarche de développement »

### Proposition pour la fiche Web :

> Développement itératif en 4 sprints :
>
> - **Sprint 1** (socle technique) : initialisation du projet Node.js/Express, création de la base de données MySQL, configuration Docker Compose, initialisation Git
> - **Sprint 2** (API REST) : CRUD événements et utilisateurs, authentification JWT, validation express-validator, intégration Stripe, documentation Swagger
> - **Sprint 3** (frontend Next.js) : pages et composants React, routage App Router, intégration API via Axios, gestion d'état Zustand, design Tailwind CSS
> - **Sprint 4** (tests, corrections, déploiement) : tests Postman, corrections de bugs, déploiement Docker sur Oracle Cloud, documentation README
>
> Git utilisé avec branches par fonctionnalité et commits réguliers.

### Proposition pour la fiche Mobile :

> Développement itératif en 3 sprints :
>
> - **Sprint 1** (socle technique) : initialisation du projet Expo, configuration NativeWind, mise en place de la navigation (React Navigation), création de l'AuthContext
> - **Sprint 2** (fonctionnalités) : écrans d'authentification, liste des événements, détail événement, inscription, recherche et filtres
> - **Sprint 3** (finitions) : écran profil, tableau de bord, animations, tests sur émulateur et appareil physique, corrections de bugs
>
> L'application mobile réutilise le même back-end Express.js que l'application web, assurant la cohérence des données.

---

## Pour les deux fiches — Section « Tests et validation »

### Proposition pour la fiche Web :

> Tests réalisés :
> - **Tests API (Postman / Swagger)** : vérification de tous les endpoints REST (codes HTTP 200, 201, 400, 401, 403, 404)
> - **Tests fonctionnels** : navigation, formulaires (validation côté client et serveur), affichage conditionnel par rôle
> - **Tests d'intégration** : flux complet inscription → connexion → consultation événements → inscription → paiement Stripe → vérification en BDD
> - **Tests de sécurité** : tentative d'accès sans token (401), accès avec rôle insuffisant (403), injection SQL (requêtes paramétrées), rate limiting
> - **Tests de non-régression** après chaque correction ou ajout de fonctionnalité
> - Jeu de données de test préparé (seed) avec scénarios représentatifs

### Proposition pour la fiche Mobile :

> Tests réalisés :
> - **Tests sur émulateur Android** (Android SDK + scrcpy) : vérification de tous les écrans et flux de navigation
> - **Tests sur appareil physique** (Expo Go sur smartphone Android) : validation du comportement réel
> - **Tests d'authentification** : connexion, déconnexion, persistance du token (AsyncStorage), expiration du token
> - **Tests fonctionnels** : consultation des événements, recherche, filtres, inscription, détail événement, profil
> - **Tests de gestion d'erreurs** : réseau indisponible, token expiré, événement complet, double inscription

---

## Pour les deux fiches — Section « Bilan et perspectives »

### Proposition pour la fiche Web :

> **Bilan** : l'application web est fonctionnelle et conforme au cahier des charges. L'architecture découplée (API REST + SPA Next.js) facilite la maintenance et l'évolution. Le déploiement via Docker Compose et Oracle Cloud permet une mise en production automatisée.
>
> **Perspectives** :
> - Notifications par email (NodeMailer) lors de l'inscription ou d'un changement d'événement
> - Tests automatisés (Jest + Supertest pour l'API, React Testing Library pour le frontend)
> - Système de commentaires et d'avis sur les événements
> - Export des inscriptions en CSV pour les organisateurs

### Proposition pour la fiche Mobile :

> **Bilan** : l'application mobile est fonctionnelle sur Android (émulateur et appareil physique via Expo Go). Elle offre une expérience utilisateur fluide et communique avec le même back-end que l'application web.
>
> **Perspectives** :
> - Intégration du paiement Stripe dans l'application mobile (Stripe React Native SDK)
> - Notifications push (Expo Notifications) pour les rappels d'événements
> - Mode hors-ligne avec synchronisation au retour du réseau
> - Publication sur le Google Play Store (EAS Build)

---

---

# Identifiants de test à ajouter sur les deux fiches (modalités d'accès)

Ajouter dans la section « Modalités d'accès aux productions » des deux fiches :

```
Comptes de test :
┌──────────────┬───────────────────────┬────────────────────┐
│ Rôle         │ Email                 │ Mot de passe       │
├──────────────┼───────────────────────┼────────────────────┤
│ Admin        │ admin@evencia.com     │ (défini dans seed) │
│ Organisateur │ (créer via /register) │ —                  │
│ Participant  │ (créer via /register) │ —                  │
└──────────────┴───────────────────────┴────────────────────┘

Carte de test Stripe : 4242 4242 4242 4242 (date future, CVC quelconque)
```

---

---

# Checklist finale avant remise (basée sur le Guide E6)

## Fiche Mobile

| Critère | État |
|---------|:----:|
| Informations administratives complètes | ❌ N° réalisation et N° candidat manquants |
| Session 2026 | ❌ Indique 2024 |
| Intitulé clair et cohérent (mobile, pas web) | ❌ Parle de « web fullstack » |
| Compétences cochées | ❌ Non cochées |
| Modalité cochée | ❌ Non cochée |
| Conditions de réalisation complètes | ⚠️ À préciser |
| Outils avec versions | ⚠️ Quelques versions manquantes |
| Modalités d'accès fonctionnelles | ⚠️ URL à corriger + identifiants à ajouter |
| Verso structuré (contexte, archi, UML, captures, tests) | ❌ Structure très incomplète |
| Diagramme de séquence | ❌ Absent |
| Captures d'écran commentées | ⚠️ Présentes mais commentaires insuffisants |
| Section tests | ❌ Absente |
| Démarche de développement | ❌ Absente |
| Historique Git | ❌ Absent |

## Fiche Web

| Critère | État |
|---------|:----:|
| Informations administratives complètes | ✅ |
| Session 2026 (y compris verso) | ⚠️ Verso dit 2024 |
| Intitulé clair et professionnel | ✅ |
| Compétences cochées | ❌ Non cochées |
| Modalité cochée | ❌ Non cochée |
| Conditions de réalisation complètes | ✅ |
| Outils avec versions | ✅ Très bien détaillé |
| Typo « Strippe » | ⚠️ Corriger en « Stripe » |
| Modalités d'accès fonctionnelles | ⚠️ Ajouter URL prod + identifiants |
| Verso structuré (contexte, archi, UML, captures, tests) | ⚠️ Contexte OK, mais sections manquantes |
| Diagramme de séquence | ❌ Absent |
| Captures d'écran commentées | ⚠️ Présentes mais commentaires insuffisants |
| Section tests | ❌ Absente |
| Démarche de développement | ❌ Absente |
| Historique Git | ❌ Absent |

---

## Couverture des compétences par les 2 fiches

Le guide précise que les 2 réalisations doivent couvrir **ensemble** les 3 compétences du bloc SLAM. Vérification :

| Compétence | Fiche Web | Fiche Mobile | Couverte |
|------------|:---------:|:------------:|:--------:|
| Concevoir et développer une solution applicative | ✅ API REST + Frontend Next.js | ✅ App mobile React Native | ✅ |
| Assurer la maintenance corrective ou évolutive | ⚠️ Mentionner explicitement dans le verso (corrections de bugs, ajout de fonctionnalités) | ⚠️ Mentionner explicitement | ⚠️ À renforcer |
| Gérer les données | ✅ MySQL, Drizzle ORM, schéma normalisé | ✅ Consommation de l'API, AsyncStorage | ✅ |

**Attention** : la compétence « Assurer la maintenance corrective ou évolutive » doit être **explicitement justifiée** dans au moins une des deux fiches. Ajouter des exemples concrets : correction d'un bug de validation, ajout d'une fonctionnalité de filtrage, mise à jour d'une dépendance, etc.

---

## Conformité Annexe II.E SLAM

| Exigence Annexe II.E | Votre projet |
|-----------------------|-------------|
| 1. Un ou deux environnements de développement avec outils de tests, supportant un framework et au moins deux langages | ✅ Cursor (VS Code) — JavaScript (backend) + TypeScript (frontend) + JSX (mobile) |
| 2. Une bibliothèque de composants logiciels | ✅ npm (Express, React, Expo, Axios, etc.) |
| 3. Un SGBD avec langage de programmation associé | ✅ MySQL 8.0 + SQL + Drizzle ORM |
| 4. Un logiciel de gestion de versions | ✅ Git + GitHub |
| 5. Du code exécuté dans un navigateur Web | ✅ Next.js (React) côté client |
| 6. Du code exécuté sur un serveur | ✅ Node.js / Express.js côté serveur |

---

*Document créé le 22 mars 2026 — À utiliser pour compléter les fiches E5 avant remise.*
