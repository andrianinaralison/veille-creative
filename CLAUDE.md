# 180 Degrés — CLAUDE.md

## Projet

Plateforme de veille créative pour vidéastes indépendants français.
Deux piliers : (1) veille quotidienne + digest éditorial, (2) bibliothèque thématique + création de *treatment* client.
Prix : 39€/mois. Persona principale : Léa, 31 ans, Lyon, Sony A7SIII.

## ⚙️ Méthode de travail (à lire en premier)

- **Le build se fait UNIQUEMENT dans Claude Code (VS Code).** Le code des features n'est jamais écrit ailleurs (ni en Cowork, qui sert au cadrage/docs/stratégie/git).
- **Source de vérité du quoi/quand : [`docs/ROADMAP.md`](docs/ROADMAP.md).** Ce CLAUDE.md ne redéfinit pas la roadmap, il pointe dessus.
- **Process de dev : [`docs/WAY-OF-WORKING.md`](docs/WAY-OF-WORKING.md)** (rôles, DoR/DoD, flux PR, rituels).
- **État des lieux & dette : [`docs/audit/AUDIT-2026-06-04.md`](docs/audit/AUDIT-2026-06-04.md)** + plan [`docs/audit/PLAN-RESTRUCTURATION.md`](docs/audit/PLAN-RESTRUCTURATION.md).
- **Flux Git** : une branche `feat|fix|chore/xxx` = un ticket = une PR vers `main` ; commits atomiques conventionnels ; checkpoints = tags (pas de branches `*_Save`).

## Stack

| Couche | Techno |
|---|---|
| Frontend | React 19 + Vite + Tailwind + Zustand + React Router v7 |
| Backend | Node.js 22 + Express + Prisma + PostgreSQL 16 |
| Auth | JWT (jose) + bcrypt |
| IA | Claude API `claude-sonnet-4-6` — smart search avec prompt caching |
| Pipeline data | Python 3.12 + YouTube Data API v3 |
| PDF | react-pdf / html2canvas |
| Email | Resend |
| Queue | BullMQ + Redis |
| Infra | Vercel (front) + Railway (back) + Supabase Storage |

## Structure du dépôt

```
/                        ← racine
├── veille-creative/     ← frontend React (Vite)
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── data/mockData.js   ← 60+ mocks à remplacer par l'API
│       └── store/
├── server/              ← backend Express
│   └── src/
│       ├── index.js
│       ├── lib/supabase.js           ← client Supabase singleton (service role)
│       ├── routes/search.route.js
│       ├── services/search.service.js   ← Claude API + prompt caching
│       └── services/thumbnail.service.js ← DL thumbnail + upload Supabase CDN
└── docs/
    ├── admin-curation-context.md  ← ⭐ LIRE EN PREMIER pour toute session admin
    ├── backlog-180degres.md       ← suivi des itérations
    ├── iteration-1-prisma-schema.md
    └── PRD_Ingestion_Admin.md     ← PRD complet feature ingestion
```

## Conventions de code

- ESM partout (`"type": "module"`) — pas de `require()`
- Nommage fichiers : `kebab-case.js` côté backend, `PascalCase.jsx` côté frontend
- Pas de commentaires sauf si le WHY est non-évident
- Pas d'abstractions prématurées — pas de helper si utilisé une seule fois

## Claude API — règles invariables

- Modèle : `claude-sonnet-4-6` (spécifié dans la doc technique)
- Prompt caching : `cache_control: { type: 'ephemeral', ttl: '1h' }` sur tout system prompt stable
- Structured output : `output_config.format` avec `json_schema` — jamais de prefill (interdit sur Sonnet 4.6)
- `max_tokens` calibré à la réponse réelle — 256 pour du JSON compact

## Git — Branches

| Branche | Rôle |
|---|---|
| `main` | Production — toujours déployable, jamais de push direct |
| `feat\|fix\|chore/xxx` | Travail en cours — une branche = un ticket = une PR, courte durée |

Checkpoints historiques = **tags** (`v0.x-checkpoint`), pas des branches `*_Save`. Détail du flux dans `docs/WAY-OF-WORKING.md`.

## Priorité courante — v0.4 « Structure propre »

> ⚠️ Le détail (tickets, ordre, jalons) vit dans **`docs/ROADMAP.md`** — source de vérité unique.

En cours : nettoyer la structure (git, docs, arbo) + **sécuriser la boucle back** (`/admin` + `/ingestion` n'ont aucune auth aujourd'hui — bloquant). Aucune feature de parcours ne démarre avant que ce jalon soit vert.

Parcours cibles (cf. ROADMAP) : 🔧 boucle back curation → 🎬 veille + digest → 🎨 treatment client.

## Backlog (résumé — détail dans `docs/ROADMAP.md`)

- 🔧 v0.5 — fiabiliser la boucle back (taxonomie unique, structured output, découpe `ingestion.service`, validation, tests)
- 🎬 v0.6 — Auth utilisateurs, smart search réel, feed veille, **Digest** (modèle éditorial + email Resend) — *réintégré au scope*
- 🎨 v0.7 — Projets/treatments CRUD, builder de treatment, export PDF + partage
- Post-MVP — scan multi-sources (Vimeo → web → Instagram)
- ~~Découvertes / Surprises~~ — **abandonné**

## Ce qui existe déjà

- ✅ Frontend React avec mock data (60+ références) — design système dark cinema validé
- ✅ Smart search backend (`POST /api/v1/search`) avec Claude API + prompt caching + json_schema
- ✅ Health check (`GET /health`)
- ✅ Supabase Storage — bucket `thumbnails` public, CDN opérationnel
- ✅ `thumbnail.service.js` — DL thumbnail YouTube + upload Supabase CDN (testé)
- ✅ `server/.env` — SUPABASE_URL, SUPABASE_SERVICE_KEY, YOUTUBE_API_KEY, DATABASE_URL configurés
- ✅ Base de données — Prisma + PostgreSQL 16 Supabase, schéma complet, 2 migrations appliquées
- ✅ Routes admin — CRUD créateurs, références, sections (`/api/v1/admin/*`)
- ✅ Pipeline ingestion tri-modal — Topic Discovery, Creator Scan (filtre > 3 min), Liens manuels
- ✅ Agent Claude enrichissement — tags taxonomie, mood, typeContenu, context (prompt caching, batch 15)
- ✅ Backoffice `/admin` — CurationPage, monitoring live, tableau validation DRAFT/PUBLISHED/REJECTED
- ✅ Profils créateurs 4 sources — YouTube (scan auto au submit), Instagram, Vimeo, site web
- ❌ Auth utilisateurs (JWT)
- ✅ Bibliothèque branchée sur API réelle — LibraryPage + CategoryPage sur `/api/v1/references`
- ❌ Smart search branché sur données réelles (`results: []` dans search.route.js)
- ❌ Projets & Moodboard
- ❌ Digest hebdomadaire

## Métriques north star

- Digest read-through ≥ 55% à la semaine 4
- Moodboards partagés ≥ 60% dans les 48h
- NPS > 40
