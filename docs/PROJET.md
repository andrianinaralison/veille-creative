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

> **Périmètre ajusté (2 juin 2026)** : la feature "Découvertes / Surprises" est abandonnée. Le Digest est déprioritisé post-MVP.

---

## Stade de développement actuel

> Dernière mise à jour : **2 juin 2026**

| Composant | Statut |
|---|---|
| Frontend React (UI + mocks) | ✅ Fonctionnel — design système dark cinema validé |
| Smart search (Claude API) | ✅ Opérationnel — prompt caching + structured output |
| Health check API | ✅ Actif |
| Base de données (Prisma + PostgreSQL) | ✅ Schéma complet, migrations appliquées sur Supabase |
| Supabase Storage (thumbnails CDN) | ✅ Opérationnel |
| Pipeline d'ingestion — Topic Discovery | ✅ Brief NL → Claude → YouTube API → DRAFT |
| Pipeline d'ingestion — Creator Scan | ✅ Handle YouTube → chaîne complète → filtre > 3 min → DRAFT |
| Pipeline d'ingestion — Liens manuels | ✅ URLs YouTube → metadata → DRAFT |
| Backoffice admin `/admin` | ✅ Curation, sections, références, monitoring live |
| Enrichissement Claude (tags/mood/context) | ✅ Prompt caching, batch 15, taxonomie complète |
| Authentification utilisateurs | ❌ Non implémentée |
| Bibliothèque branchée sur API réelle | ❌ Encore sur mock data |
| Projets & Moodboard | ❌ Non démarré |
| Digest hebdomadaire | 🔽 Déprioritisé — post-MVP |
| Découvertes / Surprises | 🚫 Abandonné |
| Scan sources non-YouTube (IG, Vimeo, Web) | ❌ Stockage profil OK, scan à développer |

---

## Scope MVP

Le MVP couvre les fonctionnalités strictement nécessaires pour valider l'usage et ouvrir les premiers abonnements :

- **Inscription / connexion** — auth JWT sécurisée
- **Bibliothèque de références** — affichage et filtres branchés sur de vraies données
- **Smart search** — recherche sémantique via Claude sur la bibliothèque réelle
- **Projets** — création et gestion de projets personnels
- **Moodboard** — constitution de planches et export PDF
- **Pipeline d'ingestion** — collecte automatisée via YouTube Data API v3 ✅ livré
- **Digest hebdomadaire** — envoi email + affichage dans l'app *(déprioritisé post-MVP)*

---

## Roadmap vers le MVP

Les étapes sont ordonnées par dépendance technique — chaque bloc débloque le suivant.

### Étape 1 — Base de données `[✅ Terminé]`
- ✅ Schéma Prisma complet : `Reference`, `IngestionSession`, `Creator`, `Section`
- ✅ PostgreSQL 16 sur Supabase — 2 migrations appliquées
- ✅ Prisma client généré

### Étape 2 — Pipeline d'ingestion & backoffice admin `[✅ Terminé]`
- ✅ 3 modes d'import : Topic Discovery (brief NL), Creator Scan (chaîne YouTube), Liens manuels
- ✅ Agent Claude : génération de queries, scoring 0–100, enrichissement tags/mood/context
- ✅ YouTube API : `search.list`, `videos.list` (avec `contentDetails` pour durée), `playlistItems.list`, `channels.list`
- ✅ Filtre durée > 3 min, résolution `@handle` nu, thumbnails → Supabase CDN
- ✅ Backoffice `/admin` : curation, tableau de validation DRAFT/PUBLISHED/REJECTED, sections, monitoring live
- ✅ Profils créateurs 4 sources : YouTube (scan auto), Instagram, Vimeo, site web (stockage)

### Étape 3 — Authentification `[⏳ À faire]`
- `POST /api/v1/auth/signup` et `/login`
- `GET /api/v1/auth/me`
- Middleware JWT sur les routes protégées
- Branchement côté frontend (état global Zustand)
- Protection des routes `/admin`

### Étape 4 — Bibliothèque réelle `[⏳ À faire]`
- `GET /api/v1/references` avec filtres SQL — remplacer les 60+ mocks
- Brancher le smart search Claude sur les données réelles (remplacer `results: []`)
- LibraryPage et CategoryPage branchées sur l'API

### Étape 5 — Projets `[⏳ À faire]`
- CRUD complet `/api/v1/projects`
- Sauvegarde de références dans un projet

### Étape 6 — Moodboard `[⏳ À faire]`
- CRUD `/api/v1/moodboards`
- Export PDF (html2canvas + react-pdf)
- Partage par lien

### Étape 7 — Digest `[⏳ Déprioritisé — post-MVP]`
- Modèle éditorial de sélection hebdomadaire
- Interface admin de publication (s'appuie sur le backoffice existant)
- Envoi email via Resend
- ⚠️ Déprioritisé : la bibliothèque + projets valident l'usage en premier

### Étape 8 — Scan multi-sources `[⏳ Backlog secondaire]`
- Vimeo API (`/users/{id}/videos`) — priorité 1
- Site web scraping (embeds → pipeline liens manuels) — priorité 2
- Instagram — décision à prendre (API officielle vs tiers) — priorité 3

---

**Métriques de succès MVP**
- ~~Digest read-through ≥ 55 % à la semaine 4~~ *(déprioritisé)*
- Moodboards partagés ≥ 60 % dans les 48 h suivant leur création
- NPS > 40
