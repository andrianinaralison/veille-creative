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
| **v0.5C — UX audit ingestion** | 8 tickets UX · research · accordéon tags | 🟠 **En cours** | Parcours admin sans friction confirmé en test utilisabilité |
| **v0.6 — Veille + Digest** | Auth Léa · feed · smart search public · digest + email | ⬜ Next | Léa s'inscrit, consulte sa veille, reçoit son digest |
| **v0.7 — Treatment client** | Projets CRUD · builder · export PDF · partage | ⬜ Later | Léa crée et partage un treatment à un client |

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

**On est en v0.5C, sprint S.** Ordre recommandé :

1. **180-41** (B3 — NL search 500) — ouvrir `search.route.js` + logs Railway → diagnostic < 30 min
2. **180-40 + 180-47** en même PR — les deux touchent `CurationPage` / `ReferencesAdminPage`, XS+S, embarquables ensemble
3. **180-42 + 180-43** — CSS sticky + intervalle polling, même PR ou deux commits atomiques
4. Pendant ce temps : **Marie livre le wireframe TagEditor** → débloquer 180-44 → sprint S+1

---

## ✅ DONE (archive datée)

- **2026-06-07** — Audit UX live `@tobifilmsofficial` + thread équipe produit (9 agents) + v0.5C lancée : 10 tickets 180-40→180-49 créés dans Linear.
- **2026-06-05** — v0.5B close : P1 lot+compteur (180-29), P2 règles (180-30), P3 smart search (180-31), dette totalFiltered (180-32), bugs polling 429 (180-33) + 0 refs (180-34), UX cas non nominaux (180-35→180-39 — tous Done).
- **2026-06-05** — v0.5A close : T-05 taxonomie, T-06 découpe service, T-07 structured output, T-08 zod+logs.
- **2026-06-05** — Disco parcours d'ingestion (entretien + benchmark) → reformulation v0.5 + [`prd/ingestion-espace.md`](./prd/ingestion-espace.md).
- **2026-06-05** — v0.4 close : T-04 (git), T-03 (docs), D13 (arbo), T-01 (sécu JWT), T-02 (CI Vitest).
- **2026-06-04** — Audit transverse + Way of Working + plan de restructuration + recadrage 3 parcours.
- **2026-06-02** — v0.3 : backoffice curation (ingestion tri-modale, qualif Claude, review DRAFT/PUBLISHED).
- **2026-06-04** — Migrations RLS + partial indexes, docs architecture.
- *(antérieur)* — Schéma Prisma + migrations, Supabase Storage CDN, smart search backend, bibliothèque sur API.
