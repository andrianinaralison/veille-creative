# Sprint Review — v0.4 & v0.5

> **Date** : 6 juin 2026 · **Auteur** : PM 180 Degrés
> **Contexte** : Les deux jalons **v0.4 « Structure propre »** et **v0.5 « Curation fiable & sereine »** sont clôturés. Cette revue passe en revue, ticket par ticket, **la valeur produit livrée** — le « pourquoi » et le « qu'est-ce que ça change pour Andri (admin) ou Léa (utilisatrice) ». Elle complète, sans les répéter, les logs techniques de clôture déjà présents sur chaque ticket Linear (fichiers, décisions, commits).
> **Périmètre** : 23 tickets résolus — 6 en v0.4, 17 en v0.5 (dont 4 sous-tickets UX regroupés sous leur parent).

---

## Sprint v0.4 — Structure propre

> **Objectif du jalon** : nettoyer la structure (git, docs, arbo) **et sécuriser la boucle back** avant de poser la moindre feature. « On range le plancher avant de poser les meubles. »
> **Critère de sortie (ROADMAP)** : *« Git/docs/arbo rangés, plus aucune route admin publique. »*
> **Atteint ? ✅ Oui.** Git assaini (branches `*_Save`/`ToImprove` → tags), source de vérité doc unique, racine du repo propre, routes `/admin` + `/ingestion` derrière JWT + rate-limit, et un socle de tests + CI verte. La base de travail est propre et fermée au public.

### 180-5 · T-04 — Nettoyer Git
- **Objectif produit** : sortir du « git comme système de sauvegarde ». Les branches `*_Save`/`ToImprove` brouillaient l'historique et empêchaient un flux de PR sain.
- **Livré** : checkpoints historiques convertis en tags annotés (`v0.2-checkpoint`, `v0.3-checkpoint`), branches mortes supprimées (local + origin), `main` protégée (pas de push direct ni de force-push), `CONTRIBUTING.md` qui fige le modèle de branches/commits/PR. `git branch -a` ne montre plus que `main` + branche de travail active.
- **DoD** : ✅ atteint.
- **Commit** : `e9d9a37`

### 180-6 · T-03 — Source de vérité unique (docs)
- **Objectif produit** : stopper la dérive des docs. Plusieurs roadmaps/PRD concurrents = décisions prises sur des documents périmés (ex. statut Digest « abandonné » alors qu'il est réintégré).
- **Livré** : `docs/archive/` créé, tous les docs legacy (anciens PRD, lean canvas ×3, journey maps de mars, backlog obsolète) déplacés. `docs/` ne contient plus que les documents vivants, `ROADMAP.md` en tête comme unique source de vérité.
- **DoD** : ✅ atteint.
- **Commit** : `19c1edb` (traité conjointement avec D13)

### 180-7 · D13 — Ranger l'arborescence du repo
- **Objectif produit** : la racine mélangeait code, données, présentations investisseur et docs — bruit permanent dans l'IDE et les recherches, friction à chaque session de build.
- **Livré** : `assets/` regroupe désormais HTML/CSV/xlsx/pptx/docx (deck, modèle financier, analyses) ; fichiers temporaires supprimés ; `.gitignore` durci sur les binaires. Racine réduite à `CLAUDE.md`, `CONTRIBUTING.md`, `assets/`, `docs/`, `server/`, `veille-creative/`.
- **DoD** : ✅ atteint.
- **Commit** : `19c1edb`

### 180-8 · T-01 — Sécuriser routes admin & ingestion (JWT + login admin)
- **Objectif produit** : risque critique levé. `/admin/*` et `/ingestion/*` étaient **publiques** — n'importe qui pouvait publier/supprimer des références et déclencher des scans, brûlant le quota YouTube et le budget Claude. Bloquant absolu avant toute mise en ligne.
- **Livré** : middleware `requireAdmin` (JWT `jose`) sur tous les routers sensibles, endpoint de login (`bcrypt`), fail-fast au démarrage si une variable critique manque, rate-limit sur `/ingestion`, et un backoffice front qui porte le token (page de login + guard + helper `adminFetch` centralisé). Appel sans token → 401.
- **DoD** : ⚠️ partiel — la preuve par test d'intégration des 401 est explicitement reportée à **180-9 (T-02)**, qui dépend de cette auth. (Reportée puis livrée dans le même sprint.)
- **Commit** : `3b69f99` (+ hotfix route login `f618665`)

### 180-9 · T-02 — Socle de tests + CI (Vitest + GitHub Actions)
- **Objectif produit** : casser le cercle vicieux de la dette. Zéro test sur ~8 600 lignes rendait toute refacto (notamment le god-file d'ingestion) impossible « en confiance ». Prérequis assumé de tout le sprint v0.5.
- **Livré** : Vitest installé, 17 tests (unitaires sur la logique d'ingestion — durée, extraction d'ID — + intégration prouvant les 401 sur routes protégées), CI GitHub Actions verte sur chaque push/PR. C'est aussi ce ticket qui solde le DoD partiel de 180-8.
- **DoD** : ✅ atteint (CI verte en 23 s, ≥ 6 tests, pipeline rouge si un test casse).
- **Commit** : `ff3e62f` (+ fix env CI `75f85ce`)

### 180-28 · BUG — fetch brut non migré après refacto auth
- **Objectif produit** : régression détectée par l'utilisateur juste après 180-8 — `/admin/references` n'affichait plus aucune référence. Symptôme direct d'un ticket clôturé sans vérification.
- **Livré** : `fetch` orphelin (variable `API` renommée mais non répercutée) corrigé en `apiFetch`, `localhost` hardcodé retiré d'`AdminLogin`. Surtout : règle **« tests obligatoires avant clôture »** (grep des anciens noms + test navigateur) ajoutée à `CLAUDE.md` — la cause process est traitée, pas que le symptôme (analyse 5C #001).
- **DoD** : ✅ atteint.
- **Commit** : `7a6586d`, `b867c12`, `5537624`

---

## Sprint v0.5 — Curation fiable & sereine

> **Objectif du jalon** : rendre la boucle de curation back **production-grade et sereine**. La douleur n'était pas que technique mais **produit** : Andri opérait à l'aveugle, devinait des mots-clés au jugé pour isoler la pollution, et finissait **sans confiance** que le lot était propre.
> **Trois principes structurants** : **(1) séparer le tri** (rapide, garder/rejeter) **de la qualif** (lent, tags/sections) ; **(2) rendre le filtrage réutilisable** ; **(3) donner un signal de complétude fiable** (compteur → 0 = lot propre).
> **Séquence** : *dette d'abord* (elle sécurise et débloque), puis *les 3 paris produit* — **P1** état « lot à trier » + compteur, **P2** règles de filtrage persistantes, **P3** smart search dans le tri.
> **Critère de sortie (ROADMAP)** : *« Import → lot à trier (garder/rejeter, règles persistantes, smart search admin) → compteur à 0 = propre → qualif fiable. »*
> **Atteint ? ✅ Oui.** Le tri est désormais un état distinct (`TRIAGE`) avec compteur, la pollution connue ne revient plus (règles persistantes), le smart search filtre le lot en langage naturel, et les cas non nominaux (créateur non-scannable, 0 résultat, échec) sont enfin lisibles. Réservoir de contenu fiable *et* confiance qu'il est propre.

### Phase A — Dette qui sécurise

### 180-10 · T-05 — Taxonomie source unique
- **Objectif produit** : la taxonomie de tags est LE concept central du produit. Copiée-collée entre `search` et `ingestion`, elle imposait une double maintenance et cassait le prompt caching à la moindre divergence.
- **Livré** : `config/taxonomy.js` unique, importé des deux côtés ; 77 lignes de duplication supprimées ; caching préservé. Un seul endroit à modifier le jour où un tag change.
- **DoD** : ✅ atteint.
- **Commit** : `0a4c296`

### 180-11 · T-07 — Fiabiliser l'enrichissement Claude (structured output)
- **Objectif produit** : l'enrichissement parsait le JSON de Claude à la main avec un fallback regex fragile — source de DRAFT corrompus sur les cas limites, et entorse à la règle `CLAUDE.md`.
- **Livré** : les 3 appels Claude d'ingestion (enrichissement, génération de requêtes, scoring) passent par `output_config.format` + `json_schema`. Plus aucun `text.match` pour parser du JSON Claude : le format est garanti par l'API.
- **DoD** : ✅ atteint.
- **Commit** : `76d313e`

### 180-12 · T-06 — Découper ingestion.service.js (god-file)
- **Objectif produit** : 847 lignes mêlant client YouTube, appels Claude, filtrage, parsing, persistance et gestion de session. Intestable, et **prérequis** avant d'empiler le tri de la Phase B dessus.
- **Livré** : 3 modules < 300 L (`youtube.client`, `enrichment.service`, `ingestion.service`/orchestrateur), ADR `0001` documentant la découpe, 20/20 tests verts après refacto. La boucle back devient évolutive.
- **DoD** : ✅ atteint.
- **Commit** : `2e86487`

### 180-13 · T-08 — Validation + erreurs + logs (zod)
- **Objectif produit** : les routes lisaient `req.body` sans validation (`?limit=abc` → erreur Prisma brute), 12 `try/catch` dupliqués, logs `console.error` non monitorables, health check menteur.
- **Livré** : middleware `validate(zod)` (cap `limit ≤ 200`), `asyncHandler` + middleware d'erreur centralisé, logs structurés, et `/health` qui teste réellement la connexion DB (503 si inaccessible). Un input invalide renvoie un 400 propre.
- **DoD** : ✅ atteint.
- **Commit** : `9485c89`

### 180-14 · T-09 — Migration mock → API (api.js + smart search dashboard)
- **Objectif produit** : le pilier 2 du produit (smart search) renvoyait `results: []`, et le Dashboard tournait encore sur des mocks. La vitrine ne montrait pas de vraies données.
- **Livré** : couche `lib/api.js` centralisée côté front ; smart search branché sur une vraie requête Prisma (filtres tags/mood/type/platform extraits par Claude, scope `PUBLISHED`) ; Dashboard sur l'API réelle avec compteur de références réel. Léa verrait désormais du vrai contenu remonter.
- **DoD** : ⚠️ partiel — `mockProjects`/`mockDigest` volontairement conservés (pages Projets v0.7 et Digest v0.6 non encore construites). Le cœur (smart search + Dashboard réels) est atteint.
- **Commit** : `9c4437f`

### 180-15 · T-10 — Couper le code zombie (Surprises, Digest legacy)
- **Objectif produit** : `SurprisesPage` (feature abandonnée) et `DigestPage` (ancienne version 100 % mock) polluaient la navigation et la base de code, et entretenaient la confusion sur le scope.
- **Livré** : les deux pages supprimées, routes redirigées vers l'accueil, « Découvertes » retiré de la nav. Distinction clarifiée : Surprises = abandonné, Digest = à reconstruire de zéro en v0.6 (conservé dans la nav « à venir »).
- **DoD** : ✅ atteint.
- **Commit** : `8396968`

### 180-32 · Dette — totalFiltered (sortir du $executeRaw)
- **Objectif produit** : le compteur de session `totalFiltered` passait par du SQL brut (`$executeRaw`) faute de client Prisma régénéré — fragile, et prérequis du compteur fiable visé par P1.
- **Livré** : client Prisma régénéré, `totalFiltered` typé, `$executeRaw` remplacé par un `prisma.update`. Le compteur de session repose sur du code typé.
- **DoD** : ✅ atteint (17/17 tests verts).
- **Commit** : `8968bf3`

### Phase B — Les 3 paris produit du tri

### 180-29 · P1 — État « lot à trier » TRIAGE + compteur
- **Objectif produit** : **le keystone du jalon.** Le modèle ne connaissait que `DRAFT/PUBLISHED/REJECTED` : tri et qualif mélangés, aucun état « propre » fiable. Andri ne savait jamais quand un lot était fini.
- **Livré** : statut `TRIAGE` distinct (migration enum + index partiel), les réfs scannées y atterrissent, endpoint compteur `/triage/count`, vue `TriageView` avec compteur décroissant géant, bulk garder/rejeter, et signal non ambigu **« ✓ Lot propre »** à 0 avec lien direct vers la qualif. Le tri est enfin séparé de la qualif, avec un signal de complétude.
- **DoD** : ✅ atteint (19/19 tests verts).
- **Commit** : `b2aeecf`

### 180-30 · P2 — Règles de filtrage persistantes (anti-pollution)
- **Objectif produit** : un même créateur produit plusieurs types de contenu (ex. ~50 % de pollution chez certains). Rien ne retenait la pollution connue : elle revenait à chaque scan et Andri rejouait le jeu de taupe.
- **Livré** : table `FilterRule` (par créateur, sur titre ou nom de chaîne, soft-delete), endpoints CRUD protégés, application automatique des règles pendant le scan (avant dépôt en `TRIAGE`), et panneau de gestion par créateur dans l'admin. La pollution réglée au scan N ne réapparaît plus au scan N+1.
- **DoD** : ✅ atteint (19/19 tests verts).
- **Commit** : `138bb35`

### 180-31 · P3 — Smart search dans le back-office de tri
- **Objectif produit** : pour isoler la pollution, Andri devinait des mots-clés au jugé. Le smart search Claude existait mais n'était branché que sur la biblio publique, pas sur le tri.
- **Livré** : endpoint `POST /admin/search` (Claude + caching + json_schema) scopé sur `TRIAGE`, barre de recherche en langage naturel dans `TriageView` (ex. « montre-moi les vlogs perso de cette chaîne »), résultats actionnables (garder/rejeter par carte ou en bulk). Le jeu de taupe est tué.
- **DoD** : ✅ atteint (20/20 tests verts).
- **Commit** : `f0b5476`

### Bugs de stabilisation de la boucle

### 180-33 · BUG — rate-limit 429 sur polling monitoring
- **Objectif produit** : le monitoring de scan échouait immédiatement en 429 — le rate-limit anti-abus (hérité de 180-8) frappait aussi le polling GET toutes les 2 s, rendant la boucle inutilisable.
- **Livré** : le rate-limit ne s'applique plus qu'aux POST (lancement de scan) ; les GET de polling passent librement. Le monitoring fonctionne de bout en bout.
- **DoD** : ✅ atteint.
- **Commit** : `f74ff5c`

### 180-34 · BUG — 0 références affichées après scan
- **Objectif produit** : un scan réussi côté serveur (8/8 sauvegardées) affichait 0 référence et le mauvais écran côté front — la boucle paraissait cassée au moment le plus critique.
- **Livré** : `ingestionSessionId` désormais mis à jour dans les blocs `update` des upserts (3 modes d'ingestion), pour que les vidéos re-scannées soient rattachées à la session courante et apparaissent dans `TriageView`.
- **DoD** : ✅ atteint.
- **Commit** : `91ec323`

### Les cas non nominaux de l'import créateur

### 180-35 · UX — Cas non nominaux import créateur (parent)
- **Objectif produit** : audit produit du flow d'import (CurationPage → Monitoring → Triage) révélant **8 classes de cas non nominaux** (créateur non-scannable, résultats partiels, 0 résultat sans explication, scan en background) où l'admin restait dans le flou. Ce ticket parent porte la cartographie, l'arbitrage PM et le brief design.
- **Livré** : décisions PM actées (warning + skip plutôt que blocage ; ne pas re-triager le déjà-publié ; message d'erreur lisible sans retry auto), patterns visuels dark cinema définis, et priorisation des sous-tickets. Cadre qui a produit les 4 livrables ci-dessous.
- **DoD** : ✅ atteint (brief + arbitrage ; implémentation déléguée aux sous-tickets).

  #### 180-36 · UX-A1 — Badge créateur non-scannable
  - **Objectif** : un créateur sans handle YouTube (ou hors YouTube) était skippé en silence — Andri croyait le scan réussi.
  - **Livré** : helper `isScanneable`, badge `⚠ Handle YouTube manquant` inline + tooltip explicatif, bouton « Scrapper » désactivé pour ce créateur (« Tout scrapper » non impacté). La raison du skip est visible avant de lancer le scan.
  - **DoD** : ✅ atteint. **Commit** : `1247d63`

  #### 180-37 · UX-C1/C2/C3 — Empty states contextuels TriageView
  - **Objectif** : un lot à 0 sans explication était le cas le plus déroutant (Shorts écartés ? règles trop larges ? déjà publié ?).
  - **Livré** : 3 compteurs backend (`totalFilteredByDuration`, `totalFilteredByRules`, `totalAlreadyPublished`) et 5 empty states contextuels qui nomment la raison du 0 et proposent l'action suivante. Bonus : player YouTube inline dans les cartes, polling resserré (1 s), correctif du compteur `totalSaved` bloqué à 0.
  - **DoD** : ✅ atteint. **Commit** : `d0d3c97`

  #### 180-38 · UX-B2 — Session FAILED message lisible
  - **Objectif** : un scan échoué affichait « Vérifiez les logs serveur » — inutilisable pour un admin non-dev.
  - **Livré** : champ `errorMessage` sur la session + helper `readableError` qui traduit les exceptions (quota YouTube, réseau, Claude, Prisma) en français actionnable, affiché dans le `MonitoringView` avec le compteur de sauvegardes pré-crash conservé.
  - **DoD** : ✅ atteint. **Commit** : `c327bc5`

  #### 180-39 · UX-D1 — LED « scan en cours » topbar admin
  - **Objectif** : quitter la page de curation arrêtait le polling alors que le scan continuait — Andri ne savait pas s'il était fini.
  - **Livré** : `GET /ingestion/sessions?status=RUNNING` polled toutes les 30 s par `AdminLayout`, LED animée à côté de « Curation » tant qu'un scan tourne, clic = retour au monitoring. La LED disparaît à la fin du scan.
  - **DoD** : ✅ atteint. **Commit** : `4607287`

---

## Bilan & next

- **La boucle back est passée de « fonctionne à l'aveugle » à « fiable et sereine »** : import → tri rapide (état `TRIAGE` + compteur) → règles anti-pollution réutilisables → smart search NL sur le lot → signal « lot propre » → qualif. Les 3 paris produit de la disco (P1/P2/P3) sont tous livrés et reliés entre eux.
- **Le réservoir de contenu est désormais alimentable avec confiance** : c'est la précondition explicite des deux parcours front (veille/digest et treatment) — sans contenu propre, ils seraient vides. v0.5 débloque donc tout le reste de la roadmap.
- **La dette structurelle qui bloquait l'évolution est soldée** : god-file découpé, taxonomie unique, structured output partout, validation/erreurs/logs propres, et surtout un socle tests + CI vert qui transforme chaque future refacto en opération sûre (le cercle vicieux de la dette est rompu).
- **Le risque de sécurité majeur est levé** : plus aucune route admin/ingestion publique — la plateforme peut être mise en ligne sans brûler quota YouTube ni budget Claude.
- **Pont vers v0.6 « Veille + Digest »** : le socle JWT de 180-8 est réutilisable tel quel pour l'**Auth utilisateurs (180-16)**, point de départ du prochain jalon. La séquence enchaîne ensuite sur le smart search réel côté Léa, le feed de veille, puis le Digest (modèle éditorial + email Resend). Premier parcours front en vue.
