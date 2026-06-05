# 🎯 Roadmap 180 Degrés — Mise à jour juin 2026
**Statut**: En développement actif  
**Révisée le**: 5 juin 2026  
**Source de vérité détaillée**: [`docs/ROADMAP.md`](docs/ROADMAP.md)  
**Format**: Now / Next / Later — 3 parcours

---

## 📊 État Actuel du Projet (5 juin 2026)

### ✅ COMPLÉTÉ

**Foundation & Infrastructure**
- Stack complet opérationnel : React 19 + Vite + Express + Prisma + PostgreSQL 16 (Supabase)
- Supabase Storage CDN — bucket `thumbnails` public, DL + upload testé
- Design système dark cinema Tailwind (variables couleurs, typographie, spacing) validé
- 60+ mocks frontend pour prototypage rapide

**Backend — Boucle de curation**
- Smart search backend (`POST /api/v1/search`) avec Claude API + prompt caching + json_schema
- Pipeline ingestion **tri-modal** : Topic Discovery, Creator Scan (filtre > 3 min), Liens manuels
- Agent Claude enrichissement : tags taxonomie, mood, typeContenu, context (batch 15, prompt caching)
- Routes admin CRUD complètes (`/api/v1/admin/creators`, `/references`, `/sections`)
- Profils créateurs 4 sources : YouTube (scan auto au submit), Instagram, Vimeo, site web
- Migrations RLS (anon = read-only PUBLISHED, service_role = full access)
- Partial indexes DRAFT/PUBLISHED/creator_active

**Backoffice `/admin`**
- CurationPage avec tableau de validation DRAFT / PUBLISHED / REJECTED
- Monitoring live des sessions d'ingestion
- Formulaire Creator avec scan YouTube automatique

**Frontend utilisateur**
- LibraryPage + CategoryPage branchées sur l'API réelle (`/api/v1/references`)
- Routing complet pour toutes les pages prévues
- Layout général sidebar navigation

**Docs & Process**
- Audit transverse (4 juin 2026) + Way of Working + plan de restructuration
- Docs architecture & ADRs

### ⚠️ EN COURS / PARTIEL

- **Sécurisation admin + ingestion** : aucune auth sur `/admin` et `/ingestion` — bloquant v0.5
- **Structure Git** : branches `*_Save` à convertir en tags, `main` non protégée
- **Arborescence** : fichiers legacy / CSV / HTML à ranger dans `docs/archive/` et `assets/`
- **Smart search** : route branchée mais `results: []` — données réelles non connectées

### ❌ NON COMMENCÉ

- Auth utilisateurs (JWT signup/login)
- Feed de veille quotidienne (Dashboard encore sur mock data)
- Digest — modèle éditorial + envoi email (Resend)
- Projets / Treatments — CRUD + builder + export PDF + partage
- Tests automatisés (chemin critique back)
- ~~Surprises~~ — **abandonné**

---

## 🗺️ Les 3 parcours cibles

| | Parcours | Pour qui | En une phrase |
|---|---|---|---|
| 🔧 **Back** | Boucle de curation | Admin (toi) | Ajouter des `@youtube` → scan → qualif → check + enrichissement metadata |
| 🎬 **Front 1** | Veille quotidienne + Digest | Léa | Consulter sa veille créative et recevoir un digest éditorial |
| 🎨 **Front 2** | Création d'un treatment client | Léa | Construire le doc créatif (références + intention) pour le présenter à son client |

---

## 🟢 NOW — v0.4 « Structure propre » (sem. 1-2)

> Aucune feature des parcours ne démarre tant que ce bloc n'est pas vert.

| # | Ticket | Effort |
|---|---|---|
| 1 | **Nettoyer Git** : branches `*_Save` → tags, supprimer mortes, protéger `main`, `CONTRIBUTING.md` | S |
| 2 | **Source de vérité unique** : `CLAUDE.md` + `PROJET.md` pointent vers `docs/ROADMAP.md` | S |
| 3 | **Ranger l'arborescence** : `assets/` + `docs/archive/` | S |
| 4 | **Sécuriser admin + ingestion** : middleware `requireAdmin` (JWT) + login admin + rate-limit `/ingestion` | M |

**Sortie** : base de travail propre, plus aucune route admin publique.

---

## 🟡 NEXT — v0.5 « Boucle back fiable » (sem. 3-5) · 🔧

| # | Ticket | Quoi | Effort |
|---|---|---|---|
| 5 | **Taxonomie source unique** | `config/taxonomy.js` importé partout (fin du copier-collé) | S |
| 6 | **Fiabiliser la qualif Claude** | Structured output au lieu du parsing JSON regex | S |
| 7 | **Découper `ingestion.service.js`** | `youtube.client` / `enrichment.service` / `orchestrator` | L |
| 8 | **Validation + erreurs + logs** | zod, middleware d'erreur, logger structuré | M |
| 9 | **Polir le tableau de review** | UX check + enrichissement metadata manuel | M |
| 10 | **Tests chemin critique back** | Résolution `@handle`, filtre > 3 min, qualif, 401 routes protégées + CI | M |

**Sortie** : ajout `@handle` → vidéos qualifiées → check sans friction. Réservoir de contenu fiable.

---

## 🔵 NEXT+ — v0.6 « Veille + Digest » (sem. 6-9) · 🎬

| # | Ticket | Quoi | Effort |
|---|---|---|---|
| 11 | **Auth utilisateurs** | signup / login / me (réutilise JWT de T-01) | M |
| 12 | **Smart search réel** | Brancher `/search` sur les vraies données | M |
| 13 | **Feed de veille quotidienne** | Page d'accueil Léa sur API (fin des mocks Dashboard) | M |
| 14 | **Digest — modèle éditorial** | Sélection hebdo s'appuyant sur le backoffice, vue in-app | M |
| 15 | **Digest — envoi email** | Resend + préférences d'abonnement | M |
| 16 | **Couper le code zombie** | Retirer Surprises ; aligner Digest sur le vrai modèle | S |

**Sortie** : Léa s'inscrit, consulte sa veille du jour, reçoit son digest.

---

## 🟣 LATER — v0.7 « Treatment client » (sem. 10-14) · 🎨

> Précédé d'une spec + session JTBD (qu'est-ce qu'un bon treatment pour Léa ?).

| # | Ticket | Quoi | Effort |
|---|---|---|---|
| 17 | **Projets / treatments — CRUD** | Créer un projet client, y rattacher des références | M |
| 18 | **Builder de treatment** | Éditeur moodboard enrichi : références + intention créative | L |
| 19 | **Export & partage** | PDF + lien de partage client → débloque north star « partagés ≥ 60 % » | M |

---

## 🔭 Backlog post-MVP

- Scan multi-sources : Vimeo (API ouverte) → site web (scraping embeds) → Instagram (décision API)
- Agrégation TikTok / Pinterest : hors scope MVP — sources instables, CGU contraignantes
- Agents de dev custom (review PR vs DoD, curation semi-autonome)
- Instrumentation métriques curation (ratio publié/rejeté, coût Claude/session)
- Trancher BullMQ/Redis : implémenter ou retirer du stack documenté

---

## 📈 Métriques de Succès

| Métrique | Cible M6 | Cible M12 |
|----------|----------|-----------|
| **Digest Read-Through (S4)** | ≥ 55% | ≥ 65% |
| **Treatments partagés (48h)** | ≥ 60% | ≥ 75% |
| **Weekly Veille Time Saved** | ≤ 2h30 | ≤ 1h30 |
| **NPS** | ≥ 40 | ≥ 55 |
| **Churn mensuel** | ≤ 5% | ≤ 3% |

---

## ⚠️ Risques & Décisions

| ID | Risque / Décision | Statut |
|----|-------------------|--------|
| R1 | API Instagram/TikTok fermeture | Mitigation : Vimeo + web en priorité |
| R2 | Surprises hors-profil | **Abandonné** — non validé par les métriques |
| R3 | Modèle ML custom (classification intentions) | **Remplacé** par Claude API enrichissement (déjà en prod) |
| R4 | PDF génération côté serveur | Queue job + caching — à implémenter en v0.7 |
| R5 | Routes admin publiques | **Bloquant** — sécurisation en v0.4 ticket 4 |

---

## 📅 Vue calendrier

```
Sem. 1-2   ████ v0.4  Structure propre + sécu back
Sem. 3-5   ████ v0.5  Boucle back fiable           🔧 → réservoir de contenu
Sem. 6-9   ████ v0.6  Veille + Digest              🎬 → parcours front 1
Sem.10-14  ████ v0.7  Treatment client             🎨 → parcours front 2
```

---

## ✅ DONE (archive datée)

- **2026-06-04** — Audit transverse + Way of Working + plan restructuration + recadrage 3 parcours
- **2026-06-04** — Migrations RLS + partial indexes, docs architecture
- **2026-06-02** — v0.3 : backoffice curation (ingestion tri-modale, qualif Claude, review DRAFT/PUBLISHED)
- *(antérieur)* — Schéma Prisma + migrations, Supabase Storage CDN, smart search backend, LibraryPage sur API
