# PRD — L'espace Ingestion (global)

> **Statut** : Draft pour revue Tech Lead · **Cible** : jalon v0.5 « Curation fiable & sereine »
> **Sources** : disco entretien Andri + benchmark (2026-06-05), `docs/10-produit/contexte/admin-curation.md`, `docs/10-produit/prd/ingestion-admin.md`, `docs/10-produit/roadmap.md`
> **Périmètre** : tout le parcours back-office de curation, de l'import à la restitution. Remplace, en le globalisant, le cadrage feature-par-feature de `ingestion-admin.md`.

---

## 1 · Executive Summary

L'espace Ingestion est l'atelier où Andri (admin) transforme un flux brut de vidéos YouTube en un réservoir de références qualifiées qui alimente les deux parcours front (veille + treatment). Aujourd'hui la mécanique existe (scan → scoring → enrichissement → review) mais elle est **opérée à l'aveugle** : impossible de savoir quand un lot est « propre ». Ce PRD redéfinit l'espace autour d'un principe : **séparer le tri (rapide, garder/rejeter) de la qualification (lent, tags/sections)**, rendre le filtrage de la pollution **réutilisable**, et donner un **signal de complétude fiable**.

---

## 2 · Problem Statement

- **Contexte.** Phase de chargement massif POC : l'objectif est un volume qualitatif suffisant pour prouver la valeur (cible ≈ 500 réfs en ~30 min de travail). Le moteur, c'est l'import bulk de chaînes choisies à la main — le **choix des chaînes reste une expertise humaine assumée**, à ne pas automatiser. Topic Discovery (prompt NL) a été **abandonné à raison** : résultats pollués.
- **User pain (vécu, entretien).** Un même créateur produit plusieurs types de contenu (ex. *Justin Porter Media* = 50 %+ de contenu hors-cible). L'import par `@handle`/URL ramène donc beaucoup de pollution. Pour l'isoler, Andri **devine des mots-clés** au jugé : un jeu de taupe qui se termine **sans confiance** que le lot est propre. Il n'existe **aucun état « propre » fiable**. La phase de tri (garder/rejeter) et la phase de qualification (tags/sections) sont **mélangées** dans le même écran, alors que l'une doit être rapide et l'autre lente.
- **Business impact.** Sans réservoir qualifié fiable, les deux parcours front (veille v0.6, treatment v0.7) sont vides ou pollués → bloque la north star « digest read-through ≥ 55 % » et la crédibilité de la biblio. Chaque session de tri à l'aveugle brûle aussi du quota YouTube et du budget Claude sur du contenu qui finira rejeté.
- **Root cause hypothesis.** Le modèle de données ne connaît que `DRAFT | PUBLISHED | REJECTED` : il manque un **état de tri intermédiaire** et une **mémoire des exclusions**. La pollution connue revient à chaque scan car rien ne la retient.

---

## 3 · Target Users

| Persona | Segment | Primary job-to-be-done |
|---------|---------|------------------------|
| **Andri (admin/curateur)** | Fondateur-opérateur | « Quand j'importe des chaînes que j'ai choisies, je veux écarter la pollution sans la chasser à l'aveugle, et savoir avec certitude quand mon lot est propre — pour ensuite qualifier sereinement. » |
| Léa (bénéficiaire indirecte) | Vidéaste freelance | Reçoit une biblio dense et **non polluée** ; ne touche jamais l'espace ingestion. |

---

## 4 · Goals & Non-Goals

**In scope :**
- Import bulk de chaînes YouTube choisies à la main, avec dédup à l'import.
- **Règles de filtrage persistantes** : exclusions réutilisables par créateur/source, appliquées aux scans futurs.
- **État « lot à trier » explicite + compteur** : un statut de triage distinct de `DRAFT/PUBLISHED/REJECTED`, avec bulk garder/rejeter et un compteur dont la descente à 0 = signal de complétude.
- **Smart search Claude branché côté back-office de tri** (NL search admin), avant la biblio publique.
- Fiabiliser la qualification (structured output, taxonomie source unique) et la rendre moins pénible (écran des réfs gardées, tags qui s'empilent).

**Out of scope (explicitement) :**
- **Automatiser le choix des chaînes** — c'est l'expertise humaine du curateur, on ne la remplace pas.
- **Ressusciter Topic Discovery** (prompt NL d'ingestion) — abandonné à raison, résultats pollués.
- **Scan multi-sources** (Vimeo / web / Instagram) — backlog post-MVP, pipeline distinct.
- **Auth utilisateurs (Léa)** — l'auth admin existe déjà (`requireAdmin`, jose JWT) ; l'auth utilisateurs relève de v0.6.
- Le **filtrage par tags côté biblio publique** (cassé) — bug réel mais parcours distinct, traité hors de ce PRD.

---

## 5 · Solution Overview

Le parcours passe d'un seul écran « tout-mélangé » à **deux temps nets** :

```
IMPORT (bulk)                TRI (rapide)                QUALIF (lent)
─────────────                ────────────                ────────────
@handles choisis      →      Lot à trier [N]      →      Réfs gardées
+ dédup import               garder / rejeter            tags · mood · section
                             ↑ règles persistantes       structured output
                             ↑ smart search admin        ↓
                             compteur N → 0 = PROPRE  →   PUBLISHED
```

1. **Import.** Andri colle des `@handle` de chaînes qu'il a choisies. Le moteur scanne (filtre > 3 min), déduplique à l'import, et dépose le résultat dans un **lot à trier** avec un compteur.
2. **Tri (rapide).** Andri parcourt le lot. Pour écarter la pollution il dispose de deux leviers au lieu du jeu de taupe : (a) une **smart search NL** (« montre-moi les vlogs perso de cette chaîne ») qui surligne/sélectionne, (b) la possibilité de transformer une exclusion en **règle persistante** rattachée au créateur/source, pour que la même pollution ne revienne pas au prochain scan. Bulk garder/rejeter. **Quand le compteur tombe à 0, le lot est officiellement propre.**
3. **Qualif (lent).** Seules les réfs gardées passent en qualification : enrichissement Claude fiable (structured output) + ajustement manuel des tags/section dans un écran allégé. Puis `PUBLISHED`.

---

## 6 · Requirements

### Functional

| ID | Requirement | Priorité | Acceptance Criteria |
|----|-------------|----------|---------------------|
| ING-1 | **État de triage explicite** | P0 | Nouveau statut (ex. `TRIAGE`) distinct de `DRAFT/PUBLISHED/REJECTED` ; les réfs fraîchement scannées y atterrissent ; un compteur « à trier » par lot/session est exposé à l'UI et décroît à chaque décision. |
| ING-2 | **Bulk garder / rejeter** | P0 | Sélection multiple dans le lot ; action garder (→ qualif) / rejeter (→ `REJECTED`) en un geste ; compteur mis à jour ; le bulk select+reject existant est réutilisé/branché sur le nouvel état. |
| ING-3 | **Signal « lot propre »** | P0 | Compteur à 0 ⇒ état visuel non ambigu « lot trié / propre » ; un lot non vide ne peut pas être marqué propre. |
| ING-4 | **Règles de filtrage persistantes** | P0 | Créer une exclusion réutilisable rattachée à un créateur/source (mot-clé titre, durée, motif) ; les scans futurs de ce créateur appliquent les règles → la pollution connue ne réapparaît pas dans le lot à trier. |
| ING-5 | **Smart search dans le back-office de tri** | P1 | `/search` (Claude, déjà prêt) branché sur les réfs en `TRIAGE` ; requête NL filtre/surligne le lot ; sert le tri avant la biblio publique. |
| ING-6 | **Dédup à l'import** | P1 | Une URL déjà en base n'est pas réinsérée (contrainte `url UNIQUE` déjà présente) ; l'import bulk reporte les doublons ignorés. |
| ING-7 | **Qualif fiabilisée** | P1 | Enrichissement Claude via `output_config.format` + `json_schema` (fin du parsing regex) ; taxonomie importée d'une source unique `config/taxonomy.js`. |
| ING-8 | **Écran des réfs gardées allégé** | P2 | Édition des tags moins pénible (tags qui s'empilent) ; densité admin conservée (design system dark cinema). |

### Non-Functional
- **Performance.** Tri d'un lot de ~500 réfs fluide (pagination/virtualisation si besoin) ; smart search admin < 2 s p95.
- **Coût.** Le tri amont (règles + rejet rapide) réduit le volume envoyé à l'enrichissement Claude → budget API maîtrisé ; instrumenter ratio gardé/rejeté et coût Claude/session (backlog).
- **Sécurité.** Routes `/admin` + `/ingestion` derrière `requireAdmin` (déjà en place) + rate-limit ; ne jamais exposer `SUPABASE_SERVICE_KEY` / `ANTHROPIC_API_KEY`.
- **Fiabilité.** `ingestion.service.js` (814 l) sans test = risque ; T-02 (socle de tests) est fait, T-06 (découpe) prérequis avant d'empiler des features dessus.

---

## 7 · Success Metrics

| Metric | Baseline | Target | Mesure |
|--------|----------|--------|--------|
| Confiance « lot propre » | Aucune (signal inexistant) | Signal binaire fiable (compteur→0) | Présence/usage de l'état dans chaque session |
| Temps de tri d'un lot ~500 réfs | ~30 min (chasse à l'aveugle) | < 15 min | Chrono session avant/après |
| Pollution récurrente par créateur | Revient à chaque scan | ≈ 0 après 1ʳᵉ règle | Réfs polluées dans le lot au scan N vs N+1 |
| Ratio rejeté au scan suivant | TBD (à instrumenter) | ↓ tendanciel | Compteur rejeté/session |

---

## 8 · Technical Considerations

- **Modèle de données.** Ajouter l'état de triage : soit un nouveau membre d'enum `Reference.status` (`TRIAGE`), soit un champ dédié — à trancher avec le Tech Lead (impact migrations Prisma + RLS + index partiels existants). Le compteur s'appuie sur `IngestionSession` (`totalFound/totalFiltered/totalSaved`) — **dette connue : `totalFiltered` calculé en `$executeRaw`** (client Prisma non régénéré), à corriger.
- **Règles persistantes.** Nouvelle table (ex. `FilterRule` : creatorId, type, pattern, active) appliquée dans le pipeline de scan avant dépôt en `TRIAGE`. Inspiration : mute filters Feedly.
- **Smart search admin.** `search.service.js` est prêt (Claude + prompt caching + `json_schema`) ; le brancher sur un scope `status=TRIAGE` plutôt que `PUBLISHED`.
- **Dette structurante.** Découper `ingestion.service.js` (T-06) **avant** d'y ajouter règles + état ; aligner la taxonomie (T-05) et le structured output (T-07) d'abord.
- **Doc à resynchroniser.** `CLAUDE.md` + `admin-curation-context.md` affirment « `/admin` et `/ingestion` sans auth (bloquant) » — **faux** : `requireAdmin` est monté. À corriger pour éviter de re-travailler une sécu déjà faite.

---

## 9 · Open Questions

| Question | Owner | Deadline |
|----------|-------|----------|
| `TRIAGE` = nouveau statut enum ou champ séparé ? (impact migration/RLS) | Andri + Tech Lead | avant ING-1 |
| Granularité des règles persistantes : mot-clé titre seul, ou aussi durée/motif/playlist ? | Andri | avant ING-4 |
| Compteur au niveau lot/session ou au niveau créateur ? | Andri | avant ING-1 |
| Faut-il un « undo » sur le rejet bulk (sécurité du geste rapide) ? | Andri | pendant ING-2 |

---

## 10 · Out-of-Scope (Parking Lot)
- Automatisation du choix des chaînes (volontairement humain).
- Topic Discovery NL (abandonné).
- Scan Vimeo / site web / Instagram (post-MVP, pipeline distinct).
- Fix du filtrage par tags de la biblio publique (parcours front, ticket séparé).
- Agents de dev custom (curation semi-autonome) — réévaluer une fois v0.5 verte.
- Instrumentation métriques curation (ratio publié/rejeté, coût Claude/session) — backlog post-MVP.
