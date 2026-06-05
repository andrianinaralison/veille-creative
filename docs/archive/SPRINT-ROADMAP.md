# Sprint Roadmap — 180 Degrés

> Générée le **5 juin 2026** à partir de [`ROADMAP.md`](./ROADMAP.md) (source de vérité).  
> Paramètres : sprints **2 semaines** · capacité **7 j-dev/sprint** (3,5 j/sem, solo founder) · sizing **T-shirt** · bêta cible **1er septembre 2026**.

---

## Conventions de vélocité (T-shirt)

| Taille | Jours-dev | Interprétation |
|--------|-----------|----------------|
| **S** | ~1 j | Tâche simple, peu d'inconnues, pas de dépendances |
| **M** | ~3 j | Tâche significative, quelques inconnues, design à confirmer |
| **L** | ~6 j | Presque un sprint entier — découpe sur 2 sprints si > 5 j réels |
| **XL** | > 7 j | Dépasse la capacité d'un sprint — obligatoirement découpé |

**Capacité par sprint :** 7 j-dev (3,5 j × 2 sem)  
**Tampon cible :** 0,5-1 j par sprint pour imprévus / hotfix.

---

## Jalons & contrainte bêta

| Jalon | Cible | Critère de sortie |
|-------|-------|-------------------|
| **v0.4** Structure propre | Sprint 1 (20 juin) | Git/docs/arbo rangés, aucune route admin publique |
| **v0.5** Boucle back fiable | Sprint 3 (18 juil) | `@handle` → scan → qualif → review → testé et robuste |
| **v0.6** Veille + Digest ⭐ | Sprint 6 (29 août) | Léa s'inscrit, consulte sa veille, reçoit son digest |
| **🚀 Bêta privée** | **1er sept. 2026** | Accès Léa, monitoring, onboarding checklist |
| **v0.7** Treatment client | Sprint 8 (26 sept) | Léa crée et partage un treatment (post-bêta) |

---

## v0.4 — « Structure propre »

### Sprint 1 — 9 au 20 juin 2026

| Ticket | User story | Taille | J-dev | Notes |
|--------|------------|--------|-------|-------|
| **T-04** | En tant que dev, je peux naviguer dans un historique Git propre et utiliser `main` protégé | **S** | 1 j | Branches `*_Save` → tags, suppression des branches mortes, `CONTRIBUTING.md`, protection `main` |
| **T-03** | En tant que dev, je sais quelle doc fait foi (plus de désynchronisation) | **S** | 1 j | `CLAUDE.md` / `PROJET.md` pointent vers `ROADMAP.md` ; resync statut Digest |
| **D13** | En tant que dev, je trouve les fichiers au bon endroit (pas de HTML/CSV en racine) | **S** | 1 j | `assets/`, `docs/archive/` ; sortir les legacy du chemin principal |
| **T-01** | En tant qu'admin, je dois m'authentifier pour accéder à `/admin` et `/ingestion` | **M** | 3 j | Middleware `requireAdmin` JWT, route login admin, `.env.example` racine, rate-limit ingestion |

**Charge sprint : 6 j / 7 j (86 %) · tampon : 1 j**  
**Livrable v0.4 ✅** — base propre et boucle back fermée au public.

---

## v0.5 — « Boucle back fiable »

### Sprint 2 — 23 juin au 4 juillet 2026

| Ticket | User story | Taille | J-dev | Notes |
|--------|------------|--------|-------|-------|
| **T-05** | En tant que dev, je définis les tags/moods/types une seule fois, importés partout | **S** | 1 j | `config/taxonomy.js` source unique — fin du copier-collé |
| **T-07** | En tant que dev, la qualif Claude retourne du JSON valide à chaque appel | **S** | 1 j | Structured output (`json_schema`) au lieu du parsing regex fragile |
| **T-06 ①/②** | En tant que dev, `ingestion.service.js` est découpé en modules cohérents (partie 1) | **L** | 5 j | Extraire `youtube.client.js` + `enrichment.service.js` ; écrire l'ADR avant de commencer |

**Charge sprint : 7 j / 7 j (100 %)**

### Sprint 3 — 7 au 18 juillet 2026

| Ticket | User story | Taille | J-dev | Notes |
|--------|------------|--------|-------|-------|
| **T-06 ②/②** | *(suite)* Découper `ingestion.service.js` (partie 2) | **L** | 1 j | Extraire `orchestrator.js`, nettoyer les imports, vérifier les routes |
| **T-08** | En tant que dev, chaque erreur d'ingestion est loguée et retournée avec le bon code HTTP | **M** | 3 j | Zod sur les entrées, middleware d'erreur unifié, logger structuré (pino) |
| **T-09** | En tant qu'admin, je valide et enrichis les métadata d'une vidéo sans friction | **M** | 3 j | UX tableau de review + enrichissement métadata manuel : polir l'existant |

**Charge sprint : 7 j / 7 j (100 %)**  
**Livrable v0.5 ✅** — réservoir de contenu fiable et opérable.

---

## v0.6 — « Veille quotidienne + Digest »  ⭐ Bêta cible

### Sprint 4 — 21 juillet au 1er août 2026

| Ticket | User story | Taille | J-dev | Notes |
|--------|------------|--------|-------|-------|
| **T-10** | En tant que dev, le chemin critique back est couvert par des tests + CI vert | **M** | 3 j | Tests : résolution `@handle`, filtre > 3 min, qualif, 401 sur routes protégées, pipeline CI |
| **T-11** | En tant qu'utilisatrice, je peux créer un compte et me connecter | **M** | 3 j | signup / login / `/me` — réutilise le socle JWT de T-01 |
| **T-16** | En tant que dev, le code mort est retiré et le modèle Digest est à jour | **S** | 1 j | Supprimer `Surprises` (abandonné) ; aligner Digest sur le vrai modèle éditorial |

**Charge sprint : 7 j / 7 j (100 %)**

### Sprint 5 — 4 au 15 août 2026

| Ticket | User story | Taille | J-dev | Notes |
|--------|------------|--------|-------|-------|
| **T-12** | En tant qu'utilisatrice, la recherche retourne des résultats réels (pas `[]`) | **M** | 3 j | Brancher `/search` sur les vraies données ; tester end-to-end avec les mocks actuels |
| **T-13** | En tant que Léa, j'ouvre l'app et je vois ma veille du jour (vraies vidéos) | **M** | 3 j | Page d'accueil sur API réelle — fin des mocks Dashboard |
| **T-14 ①/②** | En tant qu'admin, je compose la sélection hebdo dans le backoffice (partie 1) | **M** | 1 j | Modèle de sélection dans le backoffice — début |

**Charge sprint : 7 j / 7 j (100 %)**

### Sprint 6 — 18 au 29 août 2026

| Ticket | User story | Taille | J-dev | Notes |
|--------|------------|--------|-------|-------|
| **T-14 ②/②** | *(suite)* Modèle éditorial + vue in-app (partie 2) | **M** | 2 j | Vue digest in-app, navigation, lecture |
| **T-15** | En tant que Léa, je reçois mon digest hebdo par email | **M** | 3 j | Livraison Resend + préférences d'abonnement utilisateur |
| — | Tests + polish v0.6 | **S** | 1 j | Tests bout-en-bout parcours Léa ; fix mineurs |
| — | Checklist bêta | **S** | 1 j | Accès Léa, monitoring Railway/Vercel, onboarding doc |

**Charge sprint : 7 j / 7 j (100 %)**  
**Livrable v0.6 ✅** — premier parcours front vivant.  
**🚀 Bêta privée : 1er septembre 2026**

---

## v0.7 — « Treatment client » *(post-bêta)*

### Sprint 7 — 1er au 12 septembre 2026

| Ticket | User story | Taille | J-dev | Notes |
|--------|------------|--------|-------|-------|
| — | Spec + session JTBD treatment | **S** | 1 j | Définir précisément le treatment : structure, contenu, partage client — avant tout code |
| **T-17** | En tant que Léa, je crée un projet client et j'y rattache des références | **M** | 3 j | CRUD projets/treatments — base de données + UI |
| **T-18 ①/②** | En tant que Léa, j'édite mon treatment dans un builder (partie 1) | **L** | 3 j | Éditeur : layout moodboard, drag-and-drop références, zone d'intention créative |

**Charge sprint : 7 j / 7 j (100 %)**

### Sprint 8 — 15 au 26 septembre 2026

| Ticket | User story | Taille | J-dev | Notes |
|--------|------------|--------|-------|-------|
| **T-18 ②/②** | *(suite)* Builder de treatment (partie 2) | **L** | 3 j | Polish éditeur, états vides, responsive, persistance |
| **T-19** | En tant que Léa, j'exporte mon treatment en PDF et génère un lien client | **M** | 3 j | Export react-pdf / html2canvas + lien de partage → débloque north star « partagés ≥ 60 % » |
| — | Tests + polish v0.7 | **S** | 1 j | Tests end-to-end treatment → export → partage |

**Charge sprint : 7 j / 7 j (100 %)**  
**Livrable v0.7 ✅** — MVP complet.

---

## Vue calendrier synthétique

```
Sprint  Dates                Jalon   Charge   Livrable principal
  S1    09 – 20 juin         v0.4   ██████ 86%   Structure + sécu ✅
  S2    23 juin – 04 juil    v0.5   ███████ 100%  Taxonomie + structured output + découpe (1)
  S3    07 – 18 juillet      v0.5   ███████ 100%  Découpe (2) + logs + UX review ✅
  S4    21 juil – 01 août    v0.6   ███████ 100%  Tests CI + auth + code zombie
  S5    04 – 15 août         v0.6   ███████ 100%  Search réel + feed veille + digest (1)
  S6    18 – 29 août         v0.6   ███████ 100%  Digest (2) + email + bêta prep ✅
                                                  🚀 BÊTA PRIVÉE — 1er septembre 2026
  S7    01 – 12 sept         v0.7   ███████ 100%  Spec JTBD + CRUD + builder (1)
  S8    15 – 26 sept         v0.7   ███████ 100%  Builder (2) + export PDF ✅
```

**Total : 8 sprints (16 semaines) · ~52 j-dev estimés**

---

## Récapitulatif vélocité par épic

| Épic | Tickets couverts | Taille globale | J-dev | Sprints |
|------|-----------------|---------------|-------|---------|
| Structure & sécu | T-01, T-03, T-04, D13 | 2×S + M | 6 j | S1 |
| Fiabilité pipeline | T-05, T-06, T-07 | 2×S + L | 7 j | S2 |
| Robustesse & UX admin | T-08, T-09 | 2×M | 6 j | S3 |
| Tests + Auth + clean | T-10, T-11, T-16 | 2×M + S | 7 j | S4 |
| Search + Veille + Digest | T-12, T-13, T-14 | 3×M | 7 j | S5 |
| Digest email + bêta | T-15 + QA + prep | M + 2×S | 7 j | S6 |
| Treatment CRUD + builder | T-17, T-18 | M + L | 7 j | S7 |
| Builder fin + export | T-18 fin, T-19 + QA | M + S | 7 j | S8 |

---

## Risques & tampons

| Risque | Mitigation |
|--------|------------|
| **T-06 (découpe ingestion)** est un ticket L étalé sur S2-S3 | Sprint 3 a 0 j de tampon — si dérapage, T-09 glisse à S4 (pas bloquant) |
| **T-11 (auth users)** dépend de la propreté de T-01 | Vérifier l'implémentation JWT à la fin de S1 avant de passer à S4 |
| **T-18 (builder)** : scope à risque si le JTBD n'est pas cadré | Session JTBD obligatoire S7 J1 — ne pas coder avant |
| **Bêta S6** : 1 j de tampon seulement pour les fix critiques | Prioriser les tests parcours Léa dès S5 pour ne pas les tasser en S6 |

---

## Prochaine action

**Sprint 1 · T-04 — Nettoyer Git** (S = 1 j, sans risque, premier ticket).  
Exécution dans Claude Code : `*_Save` → tags, branches mortes, `CONTRIBUTING.md`, protection `main`.
