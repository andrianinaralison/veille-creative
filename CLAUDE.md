# 180 Degrés — CLAUDE.md

## Projet

Plateforme de veille créative pour vidéastes indépendants français.
Deux piliers : (1) digest éditorial hebdomadaire ~10 références, (2) bibliothèque thématique avec moodboard builder.
Prix : 39€/mois. Persona principale : Léa, 31 ans, Lyon, Sony A7SIII.

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
| `main` | Production — code stable |
| `2025-05-05_Save` | Checkpoint du main au 05/05/2026 — rollback si besoin |
| `feat/admin-curation` | ← **branche active** — tout le développement backoffice curation ici |

Tout le travail sur le backoffice se fait sur `feat/admin-curation`. Merger dans `main` uniquement quand une itération est validée.

## Priorité courante — Backoffice Curation

> ⚠️ Avant toute session de développement sur cette feature, lire : `docs/admin-curation-context.md`

Feature prioritaire : **backoffice de curation admin** (`/admin/curation`).
L'admin (Andri) soumet un brief → agent Claude orchestre la découverte YouTube → l'admin valide/publie les références.

Plan d'itérations (voir `docs/backlog-180degres.md`) :
1. Prisma schema + migration Supabase ← **étape courante**
2. Shell admin — routes `/admin` + layout
3. Formulaire brief + agent Claude (Topic Discovery)
4. Review UI — valider / rejeter / éditer les DRAFT
5. Publish flow — DRAFT → PUBLISHED → LibraryPage branchée sur API
6. Creator Scan mode
7. Auth admin JWT

## Backlog secondaire (post-curation)

- Auth utilisateurs — POST /api/v1/auth/signup, /login, /me
- Smart search — brancher `/api/v1/search` sur les données réelles (remplacer `results: []`)
- Projets — CRUD /api/v1/projects
- Moodboard — CRUD /api/v1/moodboards + export PDF
- Digest — modèle éditorial *(déprioritisé post-MVP)*
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
