# Audit fonctionnel & technique — parcours nominaux MVP

> **Statut** : 📸 Instantané daté · **Domaine** : Tech/Produit · **Date** : 2026-06-12 (post-merge train PRs #2→#11)
> Méthode : relecture croisée routes front (`App.jsx`), wiring back (`app.js`), pages et services — chaque étape des 3 parcours nominaux vérifiée dans le code réel, pas dans la doc.
> Tickets produits : **180-57 → 180-63** (voir roadmap).

---

## Synthèse

| Parcours | État | Verdict |
|---|---|---|
| 🔧 Back — boucle curation | ✅ Complet | Import → monitoring → tri → qualif → publication, annulation incluse (180-56). Rien de bloquant. |
| 🎬 Front 1 — veille + digest | 🔴 **Cassé au milieu** | Feed et digest OK, mais **Bibliothèque vide (bug 401)** et **smart search sans UI**. |
| 🎨 Front 2 — treatment client | ✅ Complet | Création → builder → partage `/t/:token` → impression PDF. Périmètre JTBD ouvert (180-24). |

Transversal : pas de récupération de mot de passe, pas de gestion de compte au-delà de prénom/opt-in, désinscription email non one-click.

---

## 🔧 Parcours back — boucle de curation (admin)

Étapes vérifiées : login admin → import (3 modes) → monitoring live → conflits → triage garder/rejeter → qualification tags/sections → publication → digest compose → envoi email.

| Étape | Code | État |
|---|---|---|
| Login admin (JWT role admin) | `auth.route.js` + `require-admin.js` | ✅ |
| Import topic / creator-scan / liens | `ingestion.route.js` (3 POST) | ✅ |
| Monitoring + survie au refresh (180-40) | `CurationPage` MonitoringView + restore URL | ✅ |
| **Annulation d'un import RUNNING** | `discard` → `CANCELLED` + checkpoint agent | ✅ (180-56, fix du jour) |
| Conflits resolve-batch | `resolve-batch` overwrite/skip/attach | ✅ |
| Triage + smart search admin | `admin-search.route.js` sur `taxonomy` | ✅ |
| Qualification TagEditor 18 axes | 180-44 livré | ✅ |
| Digest compose + envoi Resend | `admin-digests.route.js`, anti double-envoi | ✅ (clé Resend configurée en local) |

**Aucun ticket nouveau.** Reste humain : test utilisabilité 180-48 (critère de sortie v0.5C).

---

## 🎬 Parcours front 1 — Léa : veille quotidienne + digest

Étapes nominales : signup → login → feed du jour → bibliothèque/sections → recherche → fiche référence (lecture vidéo) → digest in-app → email digest → préférences.

| Étape | Code | État |
|---|---|---|
| Signup / login / hydrate session | `user-auth.route.js`, `useAuthStore`, sessionStorage | ✅ |
| Feed du jour + filtres mood/type | `Dashboard.jsx` sur `apiFetch` (limit 20) | ✅ |
| **Bibliothèque + sections** | `LibraryPage.jsx:461`, `CategoryPage.jsx:25` | 🔴 **F1 — fetch nus sans JWT + URL localhost en dur → 401 silencieux, bibliothèque vide** |
| **Smart search (promesse 180-12)** | backend ✅ `POST /search` · front : `api.search.query` défini mais **appelé nulle part** | 🔴 **F2 — aucune UI de recherche côté Léa** |
| Fiche référence + lecture embed | `ReferenceModal.jsx` (YouTube/Vimeo autoplay) | ✅ |
| Bookmark / sauvegarder une réf | `LibraryPage.jsx:206` — `useState` local, zéro persistance | 🟡 **F3 — bouton décoratif** : l'état se perd au refresh, aucune API favoris |
| Digest in-app + archives | `DigestPage.jsx`, `digests.route.js` | ✅ |
| Email digest (opt-in, batch, lien préférences) | `email.service.js` | ✅ |
| **Désinscription depuis l'email** | lien « Gérer mes préférences » → `/settings` **derrière login** | 🟡 **F4 — pas de one-click unsubscribe** (attendu RGPD/délivrabilité ; si Léa ne retrouve pas son mdp, elle ne peut pas se désinscrire) |
| **Mot de passe oublié** | inexistant (ni route, ni page) | 🟡 **F5 — Léa qui perd son mdp est bloquée définitivement** (aucun moyen de récupération) |
| Gestion de compte (Settings) | prénom + opt-in uniquement | 🟡 **F6 — pas de changement de mdp, pas de suppression de compte (RGPD art. 17)** |
| Perf bibliothèque | `?limit=2000` + filtrage client | ⚪ **F7 — dette perf** acceptable en beta (≈640 refs), à paginer avant montée en charge |

### Findings → tickets

| # | Gravité | Finding | Ticket |
|---|---|---|---|
| F1 | 🔴 Bloquant | Bibliothèque cassée : fetch non authentifiés + URL en dur | **180-57** |
| F2 | 🔴 Majeur | Smart search public sans UI — la moitié front de 180-12 n'a jamais existé | **180-58** |
| F5 | 🟠 High | Mot de passe oublié (reset par email Resend) | **180-59** |
| F3 | 🟡 Medium | Favoris persistés (ou retrait du bouton) | **180-60** |
| F6 | 🟡 Medium | Changement de mdp + suppression de compte | **180-61** |
| F4 | 🟡 Medium | Désinscription one-click depuis l'email digest | **180-62** |
| F7 | ⚪ Low | Pagination serveur de la bibliothèque | **180-63** (backlog) |

---

## 🎨 Parcours front 2 — Léa : treatment client

Étapes nominales : créer un projet → composer (intention + réfs annotées ordonnées) → partager le lien → le client consulte `/t/:token` → impression PDF → révocation.

| Étape | Code | État |
|---|---|---|
| Créer un projet (titre, client, brief, deadline) | `ProjectCreate.jsx`, CRUD scopé userId | ✅ |
| Builder (intention, réordonner, notes, picker bibliothèque) | `ProjectDetail.jsx`, PUT items atomique | ✅ |
| Partage : générer / copier / révoquer le lien | `handleShare`/`handleUnshare`, token UUID | ✅ |
| Vue client publique (select minimal, sans brief ni ids) | `shared.route.js`, `TreatmentSharePage.jsx` | ✅ |
| Export PDF (CSS print, sans lib) | `@media print` + `window.print()` | ✅ |

**Aucun ticket nouveau.** Les 5 questions ouvertes (mobile client, intention par section, embed vs thumbnail, nb réfs, PDF nécessaire ?) restent dans `prd/treatment.md` → session JTBD 180-24.

> Edge connu non bloquant : une réf dépubliée (REJECTED) après composition reste visible dans un treatment partagé. À trancher post-JTBD.

---

## Transversal / technique

- **URLs API** : `lib/api.js`, `lib/admin-api.js` et 2 pages utilisent `VITE_API_URL` avec fallback localhost ✅ — mais `LibraryPage`/`CategoryPage` ont leur propre `const API = 'http://localhost:3001/api/v1'` en dur (couvert par 180-57). Après ça, le front est déployable sur Vercel sans autre patch.
- **Auth** : claims `role` stricts des deux côtés ✅ · rate-limit signup/login ✅ · expiry 7 j + redirect 401 → `/login` ✅.
- **Tests** : 42 verts (guards 401, auth, santé). Aucun test sur le chemin bibliothèque — c'est pourquoi F1 est passé inaperçu : les smoke tests appelaient l'API directement avec token, pas via les pages.

## Leçon (5C)

Le smoke « 9/9 parcours Léa » testait **l'API**, pas **les pages qui l'appellent**. Un parcours n'est validé que si on l'exécute depuis l'UI — c'est exactement ce que devront couvrir les recettes device 180-25/27.
