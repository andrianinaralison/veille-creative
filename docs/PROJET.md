# 180 Degrés — Présentation du projet

## Contexte

Les vidéastes indépendants français manquent d'un outil dédié pour faire leur veille créative. Ils passent des heures à fouiller YouTube, Vimeo, Instagram et des dizaines de blogs pour trouver des références visuelles pertinentes — du temps qu'ils pourraient consacrer à leurs projets.

**Persona principale : Léa, 31 ans, Lyon, Sony A7SIII.** Directrice photo freelance, elle tourne 3 à 4 projets par mois et cherche constamment de l'inspiration, des tendances et des références techniques à montrer à ses clients. Elle n'a pas le temps de tout surveiller elle-même.

---

## La solution

**180 Degrés** est une plateforme de veille créative pensée pour les vidéastes indépendants. Elle repose sur deux piliers complémentaires :

**1. Le digest hebdomadaire**
Une sélection éditoriale d'environ 10 références par semaine — vidéos, films, publicités, clips — choisies pour leur pertinence créative et technique. Le contenu est livré directement, sans que l'utilisateur ait à chercher.

**2. La bibliothèque thématique + Moodboard builder**
Un moteur de recherche intelligent (propulsé par Claude) permet de fouiller une bibliothèque de références filtrées par thème, style, technique ou intention. L'utilisateur peut constituer des moodboards pour ses projets et les partager avec ses clients.

**Prix : 39 €/mois.**

---

## Stade de développement actuel

Le projet est en phase de construction du socle technique. Voici l'état précis :

| Composant | Statut |
|---|---|
| Frontend React (UI + mocks) | ✅ Fonctionnel — 60+ références mockées |
| Smart search (Claude API) | ✅ Opérationnel avec prompt caching et structured output |
| Health check API | ✅ Actif |
| Base de données (Prisma + PostgreSQL) | ❌ Non configuré |
| Authentification | ❌ Non implémentée |
| Données réelles en base | ❌ Les recherches renvoient `[]` |
| Pipeline d'ingestion (YouTube API) | ❌ Non démarré |
| Digest éditorial | ❌ Non démarré |

En résumé : l'interface existe, le moteur de recherche IA tourne, mais rien n'est encore connecté à une vraie base de données.

---

## Scope MVP

Le MVP couvre les fonctionnalités strictement nécessaires pour valider l'usage et ouvrir les premiers abonnements :

- **Inscription / connexion** — auth JWT sécurisée
- **Bibliothèque de références** — affichage et filtres branchés sur de vraies données
- **Smart search** — recherche sémantique via Claude sur la bibliothèque réelle
- **Projets** — création et gestion de projets personnels
- **Moodboard** — constitution de planches et export PDF
- **Pipeline d'ingestion** — collecte automatisée via YouTube Data API v3
- **Digest hebdomadaire** — envoi email + affichage dans l'app

Les fonctionnalités hors MVP (analytics avancés, partage collaboratif, intégrations tierces) seront traitées post-lancement.

---

## Roadmap vers le MVP

Les étapes sont ordonnées par dépendance technique — chaque bloc débloque le suivant.

### Étape 1 — Base de données `[en cours]`
- Définir le schéma Prisma : `users`, `references`, `tags`, `projects`, `user_saves`, `moodboards`
- Mettre en place PostgreSQL 16 (Supabase)
- Générer et appliquer les migrations

### Étape 2 — Authentification
- `POST /api/v1/auth/signup` et `/login`
- `GET /api/v1/auth/me`
- Middleware JWT sur les routes protégées
- Branchement côté frontend (état global Zustand)

### Étape 3 — Bibliothèque réelle
- `GET /api/v1/references` avec filtres SQL
- Brancher le smart search Claude sur les données réelles (remplacer `results: []`)
- Remplacer les 60+ mocks du frontend par les appels API

### Étape 4 — Projets
- CRUD complet `/api/v1/projects`
- Sauvegarde de références dans un projet

### Étape 5 — Moodboard
- CRUD `/api/v1/moodboards`
- Export PDF (html2canvas + react-pdf)
- Partage par lien

### Étape 6 — Pipeline d'ingestion
- Collecte via YouTube Data API v3
- Normalisation des métadonnées
- Insertion en base via BullMQ + Redis (file d'attente)

### Étape 7 — Digest
- Modèle éditorial de sélection hebdomadaire
- Interface admin de curation
- Envoi email via Resend

---

**Métriques de succès MVP**
- Digest read-through ≥ 55 % à la semaine 4
- Moodboards partagés ≥ 60 % dans les 48 h suivant leur création
- NPS > 40
