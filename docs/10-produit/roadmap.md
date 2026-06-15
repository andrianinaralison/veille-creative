# Roadmap — 180 Degrés

> **Statut** : ⭐ Référence vivante · **Domaine** : Produit · **MàJ** : 2026-06-12 · **Source de vérité** : oui

> **Source de vérité unique** pour le quoi/quand. Si `CLAUDE.md`, `projet.md` ou le backlog disent autre chose, c'est **ce fichier** qui fait foi.
> Liés : [`way-of-working.md`](./way-of-working.md) · [`audit code`](../30-tech/audit/audit-2026-06-04.md) · [`plan restructuration code`](../30-tech/audit/plan-restructuration-code.md) · [`prd/ingestion-espace.md`](./prd/ingestion-espace.md)
> Révisée le : **7 juin 2026** — Phase C active, jalons restructurés avec tickets 180-40→180-49.

---

## 🎯 La cible : 2 axes, 3 parcours

**Axe 1 — Nettoyer la structure.** Hygiène qui rend le reste possible (git, docs, arbo, sécu). Rapide, en premier.

**Axe 2 — Brancher les parcours de bout en bout** (front ↔ back, vraies données) :

| | Parcours | Pour qui | En une phrase |
|---|---|---|---|
| 🔧 **Back** | Boucle de curation | Toi (admin) | Ajouter des `@youtube` (choix humain) → le moteur scanne → tu **tries** vite (garder/rejeter, règles persistantes, smart search) jusqu'à un **lot propre** → tu **qualifies** (tags/sections) sereinement. |
| 🎬 **Front 1** | Veille quotidienne + Digest | Léa | Consulter sa veille créative au quotidien et recevoir un digest éditorial. |
| 🎨 **Front 2** | Création d'un *treatment* client | Léa | Construire le doc créatif (références + intention) d'un projet pour le présenter à son client. |

> Le parcours **back alimente** les deux parcours front : sans contenu qualifié, la veille et les treatments sont vides. D'où l'ordre ci-dessous.

---

## 🗺️ Vue d'ensemble des jalons

| Jalon | Contenu | Statut | Critère de sortie |
|---|---|---|---|
| **v0.4 — Structure propre** | Git · docs · arbo · sécu JWT | ✅ Done (2026-06-05) | Routes admin fermées, `main` protégé, CI verte |
| **v0.5A — Dette qui sécurise** | Taxonomie · structured output · découpe service · zod | ✅ Done (2026-06-05) | `ingestion.service` découpé, qualif Claude fiable |
| **v0.5B — Tri amont (3 paris)** | Lot+compteur · règles · smart search · UX cas non-noms | ✅ Done (2026-06-05) | Compteur → 0 = lot propre, règles persistent, search admin opérationnel |
| **v0.5C — UX audit ingestion** | 8 tickets UX · research · accordéon tags | 🟡 Code Done, mergé main (2026-06-12) | Reste : test utilisabilité Camille (180-48) |
| **v0.6 — Veille + Digest** | Auth Léa · feed · smart search public · digest + email | 🟠 Mergé main **mais audit parcours = 2 trous** | **180-57 (bibliothèque cassée) + 180-58 (search sans UI)** puis recette device (180-25) |
| **v0.7 — Treatment client** | Projets CRUD · builder · export PDF · partage | 🟡 Code Done, mergé main (2026-06-12) | Reste : session JTBD (180-24) + recette (180-27) |
| **v0.6.1 — Colmatage** | Restes sécu/RGPD de l'audit du 2026-06-12 | 🟠 Réduit par le pivot | 180-57 ✅ mergé main (PR#15) · maintenus 180-59/61/62 (avant ouverture publique) · 180-58/60/63 absorbés |
| **🔄 PIVOT FRONT — Explorer / Bibliothèque** | Refonte Spotify/Netflix (remplace la priorité) | 🔴 NOW | voir vagues v0.8 → v0.10 ci-dessous |

---

## 🟠 NOW — v0.5C « UX audit ingestion admin » (sem. 7)

> Issu de l'audit live `@tobifilmsofficial` (2026-06-07) + thread équipe produit (9 agents). 3 findings bloquants, 6 majeurs, 2 live. Deux sprints.
> Prérequis pour entrer en v0.6 : parcours admin validé par un test utilisabilité (180-48).

### Sprint S — Indépendants, en cours (~14h)

> Tous exécutables en parallèle. Démarrer par **180-41** (bloquant, le plus rapide à diagnostiquer).

| Ticket | Finding | Quoi | Effort | Priorité |
|---|---|---|---|---|
| [**180-41**](https://linear.app/180degre/issue/180-41) | B3 🔴 | NL search admin : corriger `POST /admin/search` 500 | M | Urgent — bloquer le smart search admin rend P3 inopérant |
| [**180-40**](https://linear.app/180degre/issue/180-40) | B2 🔴 | Session RUNNING perdue au refresh — restaurer le polling au montage | S | High |
| [**180-42**](https://linear.app/180degre/issue/180-42) | L1/L2 🟣 | Sticky header `MonitoringView` + état chargement bouton FILTRER | S | Medium |
| [**180-43**](https://linear.app/180degre/issue/180-43) | M2/M3 🟡 | Polling 5 s (au lieu de 2 s) + error handling réseau (3→10 erreurs consécutives) | S | Medium |
| [**180-47**](https://linear.app/180degre/issue/180-47) | — | Médiathèque admin : accordéon tags YouTube fermé par défaut | XS | Medium — 20 min, embarquer avec 180-40 (même fichier) |

**Sortie sprint S :** MonitoringView stable, smart search opérationnel, Médiathèque utilisable dès l'ouverture.

### Sprint S+1 — Après wireframe Marie

> 180-44 **bloque** les deux autres (TagEditor groupé est prérequis à la qualif sereine). Démarrer 180-45 et 180-46 en parallèle de Marie dès qu'elle livre le wireframe.

| Ticket | Finding | Quoi | Effort | Dépend de |
|---|---|---|---|---|
| [**180-44**](https://linear.app/180degre/issue/180-44) | B1 🔴 | TagEditor : regrouper les tags par axe taxonomique 180° (18 axes) | M | Wireframe Marie (`@marie`) |
| [**180-45**](https://linear.app/180degre/issue/180-45) | M1/M4 🟡 | Confirmation inline avant publication + dirty indicator `RefRow` | S | — |
| [**180-46**](https://linear.app/180degre/issue/180-46) | M5/M6 🟡 | Pagination refs (50/page côté serveur) + `duration_max` dans FilterRules | M | — |

**Sortie sprint S+1 :** qualif sans ambiguïté taxonomique, publication protégée, table refs performante.

### Research & cosmétiques (en parallèle des deux sprints)

| Ticket | Quoi | Assigné | Quand |
|---|---|---|---|
| [**180-48**](https://linear.app/180degre/issue/180-48) | Guide + session test utilisabilité (45 min) — valide la sortie de v0.5C | Camille | Avant beta v0.6 |
| C1→C7 (pas de ticket dédié) | Labels FR, Escape TagEditor, aria-labels, placeholder search, tab form | Andri | Opportuniste — embarquer dans les PR adjacentes |

**✅ Sortie v0.5C** : test utilisabilité valide que l'admin peut importer → monitorer → trier → qualifier en < 15 min sans confusion ni perte de contexte.

---

## 🔵 NEXT — v0.6 « Veille quotidienne + Digest » (sem. 8-11) · 🎬 Parcours front 1

> **Prérequis d'entrée :** v0.5C Done (test utilisabilité passé) **+ 180-49** livré (sinon la data pipeline alimente le feed avec des tags YouTube bruts mélangés à la taxonomie).

### Prérequis technique (faire en premier, avant le reste de v0.6)

| Ticket | Quoi | Effort | Pourquoi maintenant |
|---|---|---|---|
| [**180-49**](https://linear.app/180degre/issue/180-49) | Séparer `tags[]` YouTube et `taxonomy` Claude dans schéma Prisma + UI | M | Sans ça, le feed Léa et le smart search public héritent du mélange YouTube/éditorial — même bug que B1, côté utilisateur |

> 180-49 dépend de 180-44 (B1 TagEditor) — les deux forment le fix complet de la cause racine.

### Features v0.6

| # | Ticket | Quoi | Effort |
|---|---|---|---|
| 11 | **Auth utilisateurs** (180-11) | signup / login / me — réutilise le socle JWT T-01 | M |
| 12 | **Smart search réel** (180-12) | Brancher `/search` sur vraies données (`results: []` aujourd'hui) | M |
| 13 | **Feed de veille quotidienne** (180-13) | Page d'accueil Léa sur API, fin des mocks Dashboard | M |
| 14 | **Digest — modèle éditorial** (180-19) | Sélection hebdo in-app (s'appuie sur le backoffice qualifié) | M |
| 15 | **Digest — envoi email** (180-20, Resend) | Livraison + préférences d'abonnement | M |
| 16 | **Couper le code zombie** (T-10) | Retirer Surprises (abandonné), aligner Digest sur le vrai modèle | S |

**✅ Sortie v0.6** : Léa s'inscrit, ouvre l'app pour sa veille du jour, reçoit son digest. Premier parcours front vivant.

---

## 🟣 LATER — v0.7 « Treatment client » (sem. 12-16) · 🎨 Parcours front 2

> Précédé d'une **spec + session JTBD** (180-24) : qu'est-ce qu'un bon treatment pour Léa ? que met-elle dedans ? comment le client le reçoit ?

| # | Ticket | Quoi | Effort |
|---|---|---|---|
| — | **Spec + JTBD treatment** (180-24) | Définir précisément le treatment avant d'écrire une ligne de code | S |
| 17 | **Projets / treatments — CRUD** (180-21) | Créer un projet client, y rattacher des références | M |
| 18 | **Builder de treatment** (180-22) | Éditeur moodboard enrichi (références + intention créative) | L |
| 19 | **Export & partage** (180-23) | PDF + lien public → débloque la north star « partagés ≥ 60 % dans les 48h » | M |
| — | **Tests + polish v0.7** (180-27) | Parcours treatment end-to-end, fix mineurs | S |

**✅ Sortie v0.7** : Léa crée un treatment complet et le partage à son client via lien.

---

## 🔭 Backlog post-MVP

- Scan multi-sources : **Vimeo** (API ouverte) → **site web** (scraping embeds) → **Instagram** (décision API).
- Agents de dev custom (review PR vs DoD, curation semi-autonome).
- Instrumentation métriques curation (ratio publié/rejeté, coût Claude/session).
- Trancher BullMQ/Redis : implémenter ou retirer du stack documenté.
- **180-26** — Checklist bêta privée Léa (compte prod, 20 refs qualifiées, monitoring Railway).
- **180-25** — Tests + polish v0.6 (parcours Léa end-to-end, mobile 375px).

---

## 📅 Vue calendrier

```
Sem. 1-2   ████ v0.4   ✅ Structure propre + sécu JWT
Sem. 3-4   ████ v0.5A  ✅ Dette · taxonomie · structured output · découpe service
Sem. 5-6   ████ v0.5B  ✅ Tri amont · lot+compteur · règles · smart search back-office
Sem. 7     ██   v0.5C  🟠 UX audit · Sprint S (180-40/41/42/43/47) + wireframe Marie
Sem. 8     ██   v0.5C  ⬜  Sprint S+1 (180-44/45/46) + test utilisabilité Camille (180-48)
Sem. 8     ─    v0.6↗  ⬜  180-49 prérequis taxonomie (peut démarrer en parallèle de S+1)
Sem. 9-12  ████ v0.6   ⬜  Auth Léa · feed · digest · email Resend
Sem.13-17  ████ v0.7   ⬜  JTBD · treatment CRUD · builder · export PDF · partage
```

---

## ▶️ Par où commencer maintenant

**Le train MVP est mergé ; le pivot front Explorer/Bibliothèque est la priorité NOW.** Ordre recommandé :

1. **180-64** (data N-N/type/awards + migration 9 sections) — fondation de tout le reste
2. **180-67** (mécanique Save) — le geste pivot, prérequis carte/modale/bibliothèque
3. **180-65 + 180-66** (ReferenceCard + ReferenceModal uniques) — socle UI réutilisé partout
4. **180-70** (page Explorer) puis **180-72** (recherche) — la valeur visible
5. **180-73 + 180-74** (Bibliothèque grille + annotations) · **180-68/69/71** en parallèle
6. En // : **180-75/76** (refonte tags + enrichissement) — débloque v0.9
7. Sécu/RGPD avant ouverture publique : **180-59/61/62**. Humain : **180-48**, **180-24** (périmètres à revoir post-pivot)

---

## 🔄 PIVOT FRONT — Explorer / Bibliothèque (décidé 2026-06-14, **priorité NOW**)

> Refonte profonde façon Spotify/Netflix. **Remplace** la priorité v0.6.1. PRD : [`prd/refonte-front-explorer.md`](./prd/refonte-front-explorer.md) · Challenge équipe : [`90-journal/2026-06-14-challenge-refonte-front.md`](../90-journal/2026-06-14-challenge-refonte-front.md).
> ⚠️ Finding data : **97% des refs publiées ont 0 tag de taxonomie** → v0.8 conçu pour ne pas en dépendre ; reco (v0.9) gated sur un track d'enrichissement.

**Track 0 + v0.8 — « Explorer & Save »** (ne dépend pas des tags — démarrable tout de suite)
- 180-64 data N-N/type/awards · 180-65 ReferenceCard · 180-66 ReferenceModal · 180-67 Save (absorbe 180-60) · 180-68 réf→projet (limite 20 supprimée)
- 180-69 nav (suppr. Veille, `/`=Explorer) · 180-70 page Explorer · 180-71 backoffice sections · 180-72 recherche (absorbe 180-58) · 180-73 Bibliothèque grille (absorbe 180-63) · 180-74 annotations perso

**Track « Refonte tags & enrichissement catalogue »** (prérequis v0.9, en // de v0.8)
- 180-75 refonte système taxonomie · 180-76 enrichissement des 478 refs

**v0.9 — « Créateurs & Reco »** (après enrichissement)
- 180-77 FK créateur+migration · 180-78 fiches créateur · 180-79 page créateur · 180-80 algo similarité · 180-81 reco perso · 180-82 onboarding

**v0.10 — « Raffinements front »**
- 180-83 moteur sections configurable · 180-84 NL bibliothèque · 180-85 sections-par-tag · 180-86 Trendy par save

**Ordre de démarrage v0.8** : 180-64 (data) → 180-67 (Save) → 180-65/66 (carte+modale) → 180-70 (Explorer) → 180-72 (recherche) → 180-73/74 (Bibliothèque+annotations) → 180-68/69/71 en parallèle.

---

## 🩹 v0.6.1 — Colmatage audit parcours (réduit par le pivot)

> Source : [`audit-parcours-mvp-2026-06-12.md`](../30-tech/audit/audit-parcours-mvp-2026-06-12.md) — relecture code réel des 3 parcours nominaux après merge du train. Parcours back ✅ et treatment ✅ complets ; parcours veille **cassé au milieu**.

| Ticket | Finding | Quoi | Priorité | Quand |
|---|---|---|---|---|
| [**180-57**](https://linear.app/180degre/issue/180-57) | F1 🔴 | Bibliothèque cassée — fetch sans JWT + localhost en dur → 401 silencieux, page vide | Urgent | **Avant toute recette 180-25** |
| [**180-58**](https://linear.app/180degre/issue/180-58) | F2 🔴 | UI smart search côté Léa — le backend tourne, aucune page ne l'appelle | High | Avant beta |
| [**180-59**](https://linear.app/180degre/issue/180-59) | F5 🟠 | Mot de passe oublié (reset email Resend) | High | Avant beta |
| [**180-60**](https://linear.app/180degre/issue/180-60) | F3 🟡 | Favoris persistés **ou** retrait du bouton bookmark (décision liée au JTBD 180-24) | Medium | Avant ouverture publique |
| [**180-61**](https://linear.app/180degre/issue/180-61) | F6 🟡 | Changement de mdp + suppression de compte (RGPD art. 17) | Medium | Avant ouverture publique |
| [**180-62**](https://linear.app/180degre/issue/180-62) | F4 🟡 | Désinscription one-click email (List-Unsubscribe — délivrabilité Gmail/Yahoo) | Medium | Avant ouverture publique |
| [**180-63**](https://linear.app/180degre/issue/180-63) | F7 ⚪ | ~~Pagination serveur bibliothèque~~ — **absorbé par 180-73** | — | Annulé (pivot) |

> **Re-challenge du 2026-06-14 (suite au pivot)** : 180-58 → absorbé par 180-72 · 180-60 → absorbé par 180-67 · 180-63 → absorbé par 180-73 (les 3 **annulés**). **Maintenus** : 180-59 (mdp oublié), 180-61 (RGPD compte), 180-62 (unsubscribe) — requalifiés *prérequis avant ouverture publique payante*. 180-57 livré (mergé main, PR #15).

**Leçon retenue** : le smoke « 9/9 » testait l'API avec token, pas les pages qui l'appellent — un parcours n'est validé que joué depuis l'UI (c'est l'objet des recettes 180-25/27).

---

## ▶️ État au 2026-06-12 — train de PRs MVP ✅ mergé

Le code des trois jalons est livré et **le train est entièrement mergé dans `main`** (2026-06-12, PRs #2→#11 dans l'ordre) :

| PR | Branche | Tickets |
|---|---|---|
| #2 | `feat/admin-curation` → main | v0.5B + v0.5C (180-29→47, 50→55) |
| #3 | `feat/tags-taxonomy-split` | 180-49 (taxonomie ≠ tags YouTube) + ADR 0002 |
| #4 | `feat/user-auth` | 180-16 (auth Léa + claims role stricts) |
| #5 | `feat/feed-veille` | 180-18 (feed du jour + filtres) |
| #6 | `feat/digest` | 180-19 (digest : compose admin + vue Léa) |
| #7 | `feat/digest-email` | 180-20 (Resend + opt-in, ⚠️ clé à configurer) |
| #8 | `feat/projects-crud` | 180-21 + 180-24 (spec treatment draft) |
| #9 | `feat/treatment-builder` | 180-22 (builder intention + réfs annotées) |
| #10 | `feat/treatment-share` | 180-23 (lien public /t/:token + PDF print) |
| #11 | `chore/polish-mvp` | 180-25/27 partiels (42 tests, mockData supprimé) |

Migrations BDD **déjà appliquées** sur Supabase (taxonomy, User, Digest, Project, SessionStatus CANCELLED). Suite : 42/42 verts. Clé Resend configurée en local (`onboarding@resend.dev` — domaine à vérifier pour la prod).

Post-merge : fix annulation d'import livré (**180-56**, commit `bfbe916`) + **audit parcours MVP** → 7 nouveaux tickets (section v0.6.1 ci-dessus).

**Reste** : 180-57/58/59 (code, avant beta) · test utilisabilité (180-48) · session JTBD treatment (180-24) · recette device 375px (180-25/27) · checklist bêta (180-26) · domaine Resend prod.

---

## ✅ DONE (archive datée)

- **2026-06-14** — Décision **pivot front Explorer/Bibliothèque** (façon Spotify/Netflix) : challenge équipe produit (7 tensions), finding data (97% refs sans tag), découpage Track 0/v0.8/v0.9/v0.10 + track tags. 23 tickets créés (180-64→86), 4 projets Linear, backlog v0.6.1 re-challengé. PRD + journal écrits.
- **2026-06-12** — Train de PRs #2→#11 mergé dans `main` · fix annulation d'import (180-56) · audit fonctionnel & technique des 3 parcours nominaux → 7 tickets 180-57→180-63 + [`audit-parcours-mvp-2026-06-12.md`](../30-tech/audit/audit-parcours-mvp-2026-06-12.md).
- **2026-06-07** — Audit UX live `@tobifilmsofficial` + thread équipe produit (9 agents) + v0.5C lancée : 10 tickets 180-40→180-49 créés dans Linear.
- **2026-06-05** — v0.5B close : P1 lot+compteur (180-29), P2 règles (180-30), P3 smart search (180-31), dette totalFiltered (180-32), bugs polling 429 (180-33) + 0 refs (180-34), UX cas non nominaux (180-35→180-39 — tous Done).
- **2026-06-05** — v0.5A close : T-05 taxonomie, T-06 découpe service, T-07 structured output, T-08 zod+logs.
- **2026-06-05** — Disco parcours d'ingestion (entretien + benchmark) → reformulation v0.5 + [`prd/ingestion-espace.md`](./prd/ingestion-espace.md).
- **2026-06-05** — v0.4 close : T-04 (git), T-03 (docs), D13 (arbo), T-01 (sécu JWT), T-02 (CI Vitest).
- **2026-06-04** — Audit transverse + Way of Working + plan de restructuration + recadrage 3 parcours.
- **2026-06-02** — v0.3 : backoffice curation (ingestion tri-modale, qualif Claude, review DRAFT/PUBLISHED).
- **2026-06-04** — Migrations RLS + partial indexes, docs architecture.
- *(antérieur)* — Schéma Prisma + migrations, Supabase Storage CDN, smart search backend, bibliothèque sur API.
