# Roadmap — 180 Degrés

> **Source de vérité unique** pour le quoi/quand. Si `CLAUDE.md`, `PROJET.md` ou le backlog disent autre chose, c'est **ce fichier** qui fait foi.
> Liés : [`WAY-OF-WORKING.md`](./WAY-OF-WORKING.md) · [`audit/AUDIT-2026-06-04.md`](./audit/AUDIT-2026-06-04.md) · [`audit/PLAN-RESTRUCTURATION.md`](./audit/PLAN-RESTRUCTURATION.md)
> Révisée le : **4 juin 2026** (recadrage autour des 3 parcours).

---

## 🎯 La cible : 2 axes, 3 parcours

**Axe 1 — Nettoyer la structure.** Hygiène qui rend le reste possible (git, docs, arbo, sécu). Rapide, en premier.

**Axe 2 — Brancher les parcours de bout en bout** (front ↔ back, vraies données) :

| | Parcours | Pour qui | En une phrase |
|---|---|---|---|
| 🔧 **Back** | Boucle de curation | Toi (admin) | Ajouter des `@youtube` → le moteur va chercher les vidéos → les qualifie → te les restitue pour check + enrichissement métadata manuel. |
| 🎬 **Front 1** | Veille quotidienne + Digest | Léa | Consulter sa veille créative au quotidien et recevoir un digest éditorial. |
| 🎨 **Front 2** | Création d'un *treatment* client | Léa | Construire le doc créatif (références + intention) d'un projet pour le présenter à son client. |

> Le parcours **back alimente** les deux parcours front : sans contenu qualifié, la veille et les treatments sont vides. D'où l'ordre ci-dessous.
> 🔬 *À cadrer en session JTBD dédiée (plus tard)* : la cadence exacte du digest, et la définition précise du « treatment » (vs simple moodboard).

---

## 🗺️ Les jalons, dans l'ordre

| Jalon | Contenu | Cible | Critère de sortie |
|---|---|---|---|
| **v0.4 — Structure propre** | Axe 1 + sécuriser la boucle back | Sem. 1-2 | Git/docs/arbo rangés, plus aucune route admin publique |
| **v0.5 — Boucle back fiable** | 🔧 Parcours back production-grade | Sem. 3-5 | Ajout `@handle` → scan → qualif → review → métadata : robuste et testé |
| **v0.6 — Veille + Digest** | 🎬 Parcours front 1 | Sem. 6-9 | Léa s'inscrit, consulte sa veille, reçoit un digest |
| **v0.7 — Treatment client** | 🎨 Parcours front 2 | Sem. 10-14 | Léa crée et partage un treatment à partir des références |

---

## 🟢 NOW — v0.4 « Structure propre » (cette semaine + la suivante)

> ⚠️ Aucune feature des parcours ne démarre tant que ce bloc n'est pas vert. On range le plancher avant de poser les meubles.

| # | Ticket | Pourquoi maintenant | Effort |
|---|---|---|---|
| 1 | **Nettoyer Git** (T-04) | Sans risque, remet de l'ordre tout de suite | S |
| 2 | **Source de vérité unique** (T-03) | Stoppe la dérive des docs (resync digest, etc.) | S |
| 3 | **Ranger l'arborescence** (D13) | Sortir HTML/CSV/legacy du chemin, `assets/` + `archive/` | S |
| 4 | **Sécuriser admin + ingestion** (T-01) | La boucle back est ta surface critique : protéger quota YouTube + budget Claude | M |

- **Git** : `*_Save`/`ToImprove` → tags, supprimer branches mortes, protéger `main`, `CONTRIBUTING.md`.
- **Docs** : cette roadmap fait foi ; `CLAUDE.md`/`PROJET.md` pointent vers elle ; **resynchroniser le statut Digest** (n'est plus « abandonné ») ; archiver les redondances.
- **Arbo** : `assets/` (deck, architecture, CSV, thumbnails), `docs/archive/` (legacy, lean canvas ×3, sessions).
- **Sécu** : middleware `requireAdmin` (JWT) + login admin + `.env.example` racine + fail-fast + rate-limit `/ingestion`.

**✅ Sortie** : base de travail propre et fermée au public. Reprise en main effective.

---

## 🟡 NEXT — v0.5 « Boucle back fiable » (sem. 3-5) · 🔧 Parcours back

La boucle existe déjà fonctionnellement (Creator Scan + scoring + enrichissement + review). Objectif ici : la rendre **fiable, testée et agréable à opérer** — c'est ton outil de travail quotidien.

| # | Ticket | Quoi | Effort |
|---|---|---|---|
| 5 | **Taxonomie source unique** (T-05) | `config/taxonomy.js` importé partout (fin du copier-collé) | S |
| 6 | **Fiabiliser la qualif Claude** (T-07) | Structured output au lieu du parsing JSON regex | S |
| 7 | **Découper `ingestion.service.js`** (T-06) | `youtube.client` / `enrichment.service` / `orchestrator` (+ ADR) | L |
| 8 | **Validation + erreurs + logs** (T-08) | zod, middleware d'erreur, logger structuré | M |
| 9 | **Polir la restitution / check** | UX du tableau de review + enrichissement métadata manuel (le moment où *tu* valides) | M |
| 10 | **Tests du chemin critique back** | Résolution `@handle`, filtre > 3 min, qualif, 401 sur routes protégées + CI | M |

**✅ Sortie** : tu ajoutes un `@handle`, le moteur te ramène des vidéos qualifiées que tu checks et enrichis sans friction. Le réservoir de contenu est fiable.

---

## 🔵 NEXT+ — v0.6 « Veille quotidienne + Digest » (sem. 6-9) · 🎬 Parcours front 1

| # | Ticket | Quoi | Effort |
|---|---|---|---|
| 11 | **Auth utilisateurs** | signup / login / me (réutilise le socle JWT de T-01) | M |
| 12 | **Smart search réel** (T-09) | Brancher `/search` sur les vraies données (`results: []` aujourd'hui) | M |
| 13 | **Feed de veille quotidienne** | Page d'accueil Léa = sa veille du jour, sur API (fin des mocks Dashboard) | M |
| 14 | **Digest — modèle éditorial** | Sélection hebdo (s'appuie sur le backoffice), vue in-app | M |
| 15 | **Digest — envoi email** (Resend) | Livraison + préférences d'abonnement | M |
| 16 | **Couper le code zombie** (T-10) | Retirer Surprises (abandonné) ; aligner Digest sur le vrai modèle | S |

**✅ Sortie** : Léa s'inscrit, ouvre l'app pour sa veille du jour, et reçoit son digest. Premier parcours front vivant.

---

## 🟣 LATER — v0.7 « Treatment client » (sem. 10-14) · 🎨 Parcours front 2

> Précédé d'une **spec + session JTBD** (qu'est-ce qu'un bon treatment pour Léa ? que met-elle dedans ? comment le client le reçoit ?).

| # | Ticket | Quoi | Effort |
|---|---|---|---|
| 17 | **Projets / treatments — CRUD** | Créer un projet client, y rattacher des références | M |
| 18 | **Builder de treatment** | L'éditeur (moodboard enrichi : références + intention créative) | L |
| 19 | **Export & partage** | PDF + lien de partage client → débloque la north star « partagés ≥ 60 % » | M |

---

## 🔭 Backlog post-MVP (pas avant validation des parcours)
- Scan multi-sources : **Vimeo** (API ouverte) → **site web** (scraping embeds) → **Instagram** (décision API).
- Agents de dev custom (review PR vs DoD, curation semi-autonome) — *réévaluer une fois v0.5 verte*.
- Instrumentation métriques curation (ratio publié/rejeté, coût Claude/session).
- Trancher BullMQ/Redis : implémenter ou retirer du stack documenté.

---

## 📅 Vue calendrier (cible solo, à ajuster à ton temps réel — l'ordre ne bouge pas)

```
Sem. 1-2   ████ v0.4  Structure propre + sécu back
Sem. 3-5   ████ v0.5  Boucle back fiable           🔧 → réservoir de contenu
Sem. 6-9   ████ v0.6  Veille + Digest              🎬 → parcours front 1
Sem.10-14  ████ v0.7  Treatment client             🎨 → parcours front 2
```

---

## ▶️ Par où commencer maintenant
**v0.4, ticket 1 : nettoyer Git.** Rapide, sans risque, range tout de suite. Puis sécuriser la boucle back (ticket 4).

> Dis « go » et j'enchaîne le ticket 1 : branches `*_Save` → tags, suppression des mortes, `CONTRIBUTING.md`, protection `main`.

---

## ✅ DONE (archive datée)
- **2026-06-04** — Audit transverse + Way of Working + plan de restructuration + recadrage 3 parcours.
- **2026-06-02** — v0.3 : backoffice curation (ingestion tri-modale, qualif Claude, review DRAFT/PUBLISHED).
- **2026-06-04** — Migrations RLS + partial indexes, docs architecture.
- *(antérieur)* — Schéma Prisma + migrations, Supabase Storage CDN, smart search backend, bibliothèque sur API.
