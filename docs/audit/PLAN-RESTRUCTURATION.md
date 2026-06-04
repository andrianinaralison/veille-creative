# Plan de restructuration — 180 Degrés

> Le « quoi faire concrètement » qui découle de [`AUDIT-2026-06-04.md`](./AUDIT-2026-06-04.md) et [`WAY-OF-WORKING.md`](../WAY-OF-WORKING.md).
> Pensé pour être exécuté ticket par ticket. Chaque bloc = un candidat PR.
> Date : 4 juin 2026.

---

## Sprint 0 — « Reprise en main » (avant toute nouvelle feature)

Objectif : pouvoir développer **sans risque** (sécurité + tests) et **sans se perdre** (source de vérité + git propre). Rien de neuf tant que ce n'est pas fait.

### 🎟️ T-01 — Sécuriser les routes admin & ingestion `[P0 · sécurité]`
**Problème** : `/api/v1/admin/*` et `/api/v1/ingestion/*` sont publiques. Quota YouTube + budget Claude exposés.
**Faire** :
- Middleware `requireAdmin` (JWT `jose` + secret en env) monté sur les routers `admin`, `admin-sections`, `ingestion`.
- Un endpoint `POST /api/v1/admin/login` minimal (1 admin, mot de passe bcrypt en env) → renvoie un JWT court.
- `.env.example` racine + check *fail-fast* au démarrage (le serveur refuse de démarrer si `JWT_SECRET`, `ANTHROPIC_API_KEY`, `DATABASE_URL`, `YOUTUBE_API_KEY` manquent).
- Rate-limit sur `/ingestion` (express-rate-limit).
**DoD** : un appel sans token sur `/admin` ou `/ingestion` renvoie 401, prouvé par un test d'intégration.
**Effort** : M.

### 🎟️ T-02 — Socle de tests + CI `[P0 · qualité]`
**Faire** :
- Installer **Vitest** (front + back).
- Écrire les **premiers tests qui comptent** (pas de course à la couverture) :
  - unitaire : résolution `@handle` YouTube, filtre durée > 3 min, `extractSearchFilters` (mock SDK).
  - intégration : `GET /references` (DB de test), `PATCH /references/:id/status`, 401 sur routes protégées (T-01).
- **GitHub Actions** : `lint + test` sur chaque push et PR. Badge dans le README.
**DoD** : CI verte visible sur une PR, ≥ 6 tests, le pipeline échoue si un test casse.
**Effort** : M.

### 🎟️ T-03 — Source de vérité unique `[P0 · process]`
**Faire** :
- Créer `docs/ROADMAP.md` au format Now/Next/Later (ou monter un board Linear et y migrer le backlog).
- Vider la roadmap de `CLAUDE.md` et `docs/PROJET.md` → remplacer par un lien vers `ROADMAP.md`.
- Déplacer dans `docs/archive/` : `ROADMAP_VEILLE_CREATIVE.md`, `lean-canvas-180degres.md`, `lean-canvas-180degres-detail.md` (garder `lean-canvas-enrichi.md` comme version vivante, ou inverser — **un seul** survit), `SESSION_31_MARS_2026.md`, `LEGACY_*`, journey maps de mars, `analyse-*`.
- Réconcilier `docs/backlog-180degres.md` : supprimer les sections « à venir » mensongères, ou l'archiver au profit de ROADMAP.md.
**DoD** : depuis n'importe quel point d'entrée doc, on trouve LA roadmap en 1 clic, et elle ne se contredit nulle part.
**Effort** : S.

### 🎟️ T-04 — Nettoyer Git `[P0 · process]`
**Faire** (cf. WAY-OF-WORKING §4.1) :
- Convertir les branches `*_Save` et `ToImprove` en **tags**.
- Supprimer les branches mortes (local + origin).
- Écrire `CONTRIBUTING.md` court : modèle de branches, format de commit, flux PR.
- Activer la protection de `main` sur GitHub (pas de push direct, CI requise).
**DoD** : `git branch -a` ne montre que `main` + branches de travail actives. Les checkpoints sont des tags.
**Effort** : S.

**Sortie de Sprint 0** : tu peux coder en confiance, plus rien n'est ouvert au public, et il y a une seule roadmap. *C'est ça, « reprendre la main ».*

---

## Sprint 1-2 — Stabilisation (dette structurante)

### 🎟️ T-05 — Taxonomie : source unique `[P1 · archi]`
Extraire `TAG_TAXONOMY` dans `server/src/config/taxonomy.js`, importé par `search.service.js` **et** `ingestion.service.js`. Supprime la duplication de ~2 000 tokens et sécurise le prompt caching. **Effort : S.**

### 🎟️ T-06 — Découper `ingestion.service.js` `[P1 · archi]`
Précédé d'un **ADR** (`docs/adr/0001-decoupage-ingestion.md`). Découpe :
- `lib/youtube.client.js` — appels API purs (search/videos/playlistItems/channels).
- `services/enrichment.service.js` — les 2 passes Claude (scoring + enrichissement), **alignées sur structured output**.
- `services/ingestion.orchestrator.js` — le pipeline.
**Prérequis** : T-02 (les tests garantissent qu'on ne casse rien). **Effort : L.**

### 🎟️ T-07 — Fiabiliser l'enrichissement Claude `[P1 · fiabilité]`
Remplacer le parsing JSON regex de `enrichVideosBatch` par `output_config.format` + `json_schema`, comme `search.service.js`. Conforme à la règle `CLAUDE.md`. **Effort : S.** (fait avec T-06.)

### 🎟️ T-08 — Couche de validation + erreurs `[P1 · robustesse]`
- Middleware `validate(zodSchema)` sur les routes (body + query), avec cap `limit ≤ 200`.
- `asyncHandler` + middleware d'erreur centralisé → supprime les `try/catch` répétés.
- Logger structuré (pino). **Effort : M.**

### 🎟️ T-09 — Finir la migration mock → API `[P1 · frontend]`
- Couche `src/lib/api.js` (base URL, gestion erreurs/loading centralisée).
- Brancher Dashboard sur l'API réelle.
- **Brancher Smart Search sur les vraies données** (aujourd'hui `results: []` dans `search.route.js`) — c'est le pilier 2, prioritaire.
- Retirer `mockData.js` des pages migrées. **Effort : M-L.**

### 🎟️ T-10 — Couper le code zombie `[P2 · frontend]`
Supprimer (ou flag) `SurprisesPage` (abandonné) et `DigestPage` (déprioritisé) + leurs routes. **Effort : S.**

**Sortie** : MVP démontrable bout-en-bout (lib + search réels, backend testé et sécurisé, pipeline maintenable).

---

## Sprint 3+ — Croissance (features MVP)

Dans l'ordre de la roadmap réconciliée, chacune passant DoR → cycle PR → DoD :
1. **Auth utilisateurs** (signup/login/me) — réutilise le socle JWT de T-01.
2. **Projets** (CRUD).
3. **Moodboard** (CRUD + export PDF + partage par lien) — débloque la north star « moodboards partagés ».
4. **Scan multi-sources** : Vimeo (API ouverte, proche du scan YouTube) → site web (scraping embeds → pipeline liens) → Instagram (décision API à trancher).
5. **Digest** (déprioritisé, post-validation des piliers).

En parallèle/continu : D11→D16 (réorg racine repo, design system documenté, health check DB, retirer ou implémenter BullMQ).

---

## Réorganisation de l'arborescence (cible)

Le repo mélange aujourd'hui source, données, présentations et docs. Cible :

```
180degres/
├── CLAUDE.md                  # contrat technique (sans roadmap)
├── CONTRIBUTING.md            # NEW — git/PR/commits
├── README.md                  # NEW — quickstart + badge CI
├── .github/workflows/ci.yml   # NEW — lint + test
├── veille-creative/           # front (inchangé)
├── server/                    # back (inchangé, + config/ lib/ enrichis)
├── docs/
│   ├── PROJET.md              # pitch/persona/scope (pointe vers ROADMAP)
│   ├── ROADMAP.md             # NEW — source de vérité unique
│   ├── WAY-OF-WORKING.md      # process
│   ├── adr/                   # NEW — une décision = un fichier
│   ├── specs/                 # NEW — specs de features
│   ├── audit/                 # ce dossier
│   └── archive/               # NEW — legacy, lean canvas ×3, sessions, analyses
└── assets/                    # NEW — deck.html, architecture.html, CSV, thumbnails
```

**Mouvements concrets** (à faire en un commit `chore: réorganisation arborescence`) :
- `analyse-digest-reference.html`, `analyse-pages-digest-reference.md`, `deck-180degres.html`, `youtube_wedding_videos.csv`, `thumbnails/`, `inspirations/` → `assets/` ou `docs/archive/`.
- `ROADMAP_VEILLE_CREATIVE.md`, `SESSION_31_MARS_2026.md` → `docs/archive/`.
- `docs/LEGACY_*`, journey maps mars, lean canvas redondants → `docs/archive/`.
- `Product-Manager-Skills/` : déjà gitignoré ✅, mais le sortir physiquement du dossier projet (c'est un clone tiers, il pollue l'IDE et les recherches).

---

## Récap : ordre d'exécution

```
Sprint 0 (bloquant) : T-01 → T-02 → T-03 → T-04   [sécu + tests + vérité + git]
Sprint 1-2 (dette)  : T-05 → T-07 → T-06 → T-08 → T-09 → T-10
Sprint 3+ (features): Auth users → Projets → Moodboard → Scan multi → Digest
Continu             : réorg arbo, ADR, design system, métriques curation
```

**La seule règle qui compte aujourd'hui** : ne pas commencer une feature du Sprint 3 tant que le Sprint 0 n'est pas vert. Tout le reste en découle.
