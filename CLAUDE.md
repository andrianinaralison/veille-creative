# 180 Degrés — CLAUDE.md

## Projet

Plateforme de veille créative pour vidéastes indépendants français.
Deux piliers : (1) veille quotidienne + digest éditorial, (2) bibliothèque thématique + création de *treatment* client.
Prix : 39€/mois. Persona principale : Léa, 31 ans, Lyon, Sony A7SIII.

## ⚙️ Méthode de travail (à lire en premier)

- **Le build se fait UNIQUEMENT dans Claude Code (VS Code).** Le code des features n'est jamais écrit ailleurs (ni en Cowork, qui sert au cadrage/docs/stratégie/git).
- **Index doc (point d'entrée) : [`docs/README.md`](docs/README.md).** Toute la doc est rangée par intention sous `docs/` (00-cadrage, 10-produit, 20-ux, 30-tech, 90-journal).
- **Source de vérité du quoi/quand : [`docs/10-produit/roadmap.md`](docs/10-produit/roadmap.md).** Ce CLAUDE.md ne redéfinit pas la roadmap, il pointe dessus.
- **Process de dev : [`docs/10-produit/way-of-working.md`](docs/10-produit/way-of-working.md)** (rôles, DoR/DoD, flux PR, rituels).
- **État des lieux & dette : [`docs/30-tech/audit/audit-2026-06-04.md`](docs/30-tech/audit/audit-2026-06-04.md)** + plan [`docs/30-tech/audit/plan-restructuration-code.md`](docs/30-tech/audit/plan-restructuration-code.md).
- **Flux Git** : une branche `feat|fix|chore/xxx` = un ticket = une PR vers `main` ; commits atomiques conventionnels ; checkpoints = tags (pas de branches `*_Save`).

## 📝 Documentation obligatoire à chaque ticket

**Règle** : tout ticket clôturé doit être documenté. C'est non négociable — sans trace, le travail n'existe pas.

### Commit (obligatoire)
Format Conventional Commits avec corps détaillé si le changement touche plusieurs fichiers :
```
feat(scope): description courte

- Fichier A : ce qui change et pourquoi
- Fichier B : ce qui change et pourquoi
- Packages ajoutés / supprimés
- Comportement avant → après
```

### Commentaire Linear (obligatoire à la clôture)
Poster un commentaire sur le ticket avec :
- **Ce qui a été fait** : liste des fichiers créés/modifiés avec leur rôle
- **Décisions techniques** : pourquoi cette approche (si non évidente)
- **Comportement avant → après** : ce qui change concrètement
- **Hash du commit** et message complet
- **DoD partiels reportés** : si un critère dépend d'un autre ticket, le noter explicitement

### Tests avant clôture (obligatoire)
Avant de marquer un ticket Done, vérifier systématiquement les effets de bord :
- Toute refacto d'imports ou de helpers → `grep` sur les anciens noms dans les fichiers touchés
- Tout changement de routing backend → tester l'endpoint avec `curl` ou équivalent
- Tout changement frontend → vérifier dans le navigateur les pages affectées
**Un ticket non testé n'est pas Done.**

### PR (quand `feat/admin-curation` est mergée)
Description PR avec :
- Résumé en 3 bullets max
- Liste des tickets couverts (ex: `Closes #180-5, #180-6, #180-7, #180-8`)
- Test plan : comment vérifier que ça marche

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
└── docs/                ← toute la doc non-code (voir docs/README.md = index maître)
    ├── README.md                       ← ⭐ point d'entrée / index de navigation
    ├── 00-cadrage/                     ← pourquoi : projet, business, decks investisseur
    ├── 10-produit/                     ← quoi : roadmap ⭐, way-of-working, prd/, discovery/, contexte/
    │   └── contexte/admin-curation.md  ← ⭐ LIRE EN PREMIER pour toute session admin
    ├── 20-ux/                          ← audits UX, userflow, inspirations, digest-reference
    ├── 30-tech/                        ← specs/, adr/, architecture/, audit/, journal-5c.md (ex lean.md)
    ├── 90-journal/                     ← instantanés datés : sessions/, threads
    └── archive/                        ← legacy (ne pas consulter comme source courante)
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
- **`additionalProperties: false` obligatoire** sur chaque objet `type: 'object'` dans tout schéma `output_config.format`, y compris les objets imbriqués dans des tableaux — sans ça, Anthropic retourne 400 BadRequest (5C #004)
- `max_tokens` calibré à la réponse réelle — 256 pour du JSON compact

## Zod — règles invariables

- Version installée : **Zod v4** (`^4.4.3`) — API différente de v3
- Erreurs de validation : `err.issues` (v4) — jamais `err.errors` (propriété supprimée en v4, retourne `undefined`) (5C #004)
- Tout middleware `validate()` : tester le chemin d'erreur (requête invalide → 400) avant clôture de ticket

## Git — Branches

| Branche | Rôle |
|---|---|
| `main` | Production — toujours déployable, jamais de push direct |
| `feat\|fix\|chore/xxx` | Travail en cours — une branche = un ticket = une PR, courte durée |

Checkpoints historiques = **tags** (`v0.x-checkpoint`), pas des branches `*_Save`. Détail du flux dans `docs/10-produit/way-of-working.md`.

## Priorité courante — 🔄 PIVOT FRONT « Explorer / Bibliothèque »

> ⚠️ Le détail (tickets, ordre, jalons) vit dans **`docs/10-produit/roadmap.md`** — source de vérité unique. PRD du pivot : **`docs/10-produit/prd/refonte-front-explorer.md`**.

✅ MVP v0.4→v0.7 livré et mergé dans `main` (2026-06-12). **Depuis le 2026-06-14, la priorité est le pivot front façon Spotify/Netflix** (remplace le colmatage v0.6.1) : page **Explorer** (`/`, rangées de sections + recherche), **Save** comme geste pivot, **Bibliothèque** = refs sauvegardées annotables, **pages créateur** + **reco par similarité**. Découpé en Track 0/**v0.8**/**v0.9**/v0.10 + un track « refonte tags & enrichissement » (tickets 180-64→86).

⚠️ **Finding data structurant (2026-06-14)** : **97% des refs publiées ont 0 tag de taxonomie**. v0.8 est conçu pour ne pas en dépendre ; toute la reco (v0.9) est gated sur l'enrichissement du catalogue (180-75/76).

🟢 **Avancement v0.8 (2026-06-15)** : **180-64 DONE & mergé** (PR #14, rebase sur `chore/pivot-front-explorer`, commit `05ea799`) — fondation data N-N : table `ReferenceSection` (remplace `Reference.sectionId`), `Section.type` AUTO/MANUAL, `Reference.awards[]` ; migration `20260615_nn_reference_section` appliquée sur Supabase (backfill 378→378, 9 sections MANUAL). API & front admin passés en `sectionIds[]` multi-section. **Prochain : 180-67 (Save)**.
> ⚠️ Migrations du pivot : appliquer en **SQL idempotent + apply_migration MCP + insert manuel dans `_prisma_migrations`** (PAS `prisma migrate deploy` — table incohérente, entrées `finished_at: null`).
> ✅ **Divergence résolue (2026-06-15)** : 180-56/audit (PR #12) et 180-57 (PR #15) mergés sur `main`, puis `main` re-mergé dans `chore/pivot-front-explorer`. Le pivot est désormais **0 derrière / N devant** `origin/main` et le contient entièrement. **Modèle arrêté** : `chore/pivot-front-explorer` = branche d'intégration v0.8 ; les tickets (180-67…) y sont PR ; **une** PR globale pivot→`main` quand v0.8 est déployable (main auto-déploie en prod, donc on n'y pousse pas le Explorer à moitié construit).

Restent en // (sécu/RGPD, avant ouverture publique) : 180-59 (mdp oublié), 180-61 (RGPD), 180-62 (unsubscribe). Humain : 180-48, 180-24 (périmètres à revoir post-pivot), domaine Resend prod.

## Backlog (résumé — détail dans `docs/10-produit/roadmap.md`)

- 🔄 **Pivot front (NOW)** — v0.8 Explorer&Save → refonte tags → v0.9 Créateurs&Reco → v0.10 raffinements
- ✅ v0.5/v0.6/v0.7 — boucle back, veille+digest, treatments (livrés, mergés)
- 🔒 v0.6.1 résiduel — mdp oublié, RGPD compte, unsubscribe (prérequis ouverture publique)
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
- ✅ Auth utilisateurs (signup/login/me, JWT role 'user' ≠ 'admin', sessionStorage) — ⚠️ pas de reset mdp (180-59) ni gestion de compte (180-61)
- 🔴 Bibliothèque **cassée** — LibraryPage/CategoryPage : fetch sans JWT + localhost en dur vers `/references` protégé → 401 silencieux, page vide (**180-57**, audit 2026-06-12)
- 🟠 Smart search : backend réel public + admin (filtre `taxonomy`, 180-49) mais **aucune UI côté Léa** — `api.search.query` jamais appelé (**180-58**)
- ✅ Feed de veille (`/` = Dashboard sur API, filtres mood/type)
- ✅ Digest hebdo — compose admin + vue Léa + email Resend (clé configurée en local, `onboarding@resend.dev` ; domaine à vérifier pour la prod) — ⚠️ pas de one-click unsubscribe (180-62)
- ✅ Projets/treatments — CRUD scopé user, builder (intention + réfs annotées), lien public `/t/:token`, PDF via CSS print
- ❌ mockData — supprimé, tout le front est sur l'API

## Métriques north star

- Digest read-through ≥ 55% à la semaine 4
- Moodboards partagés ≥ 60% dans les 48h
- NPS > 40
