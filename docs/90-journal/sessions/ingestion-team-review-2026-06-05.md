# Point parties prenantes — Parcours d'ingestion

> **Date** : 5 juin 2026 · **Format** : tour d'écrans d'abord (choisi par Andri), pour aligner l'équipe sur les **faits** avant tout débat.
> **Modèle de référence** (donné par Andri) : l'ingestion est un parcours en **4 temps** —
> **① Donner les sources → ② Récolter (moteur back) → ③ Filtrer les imports → ④ Qualifier les retenus.**
> **Le sujet** : on peut largement faire mieux sur le parcours — **optimiser les actions** à chaque étape ; corriger la **porte d'entrée (pollution)** et la **fragmentation des écrans**.
> Base lue dans le code : `CurationPage.jsx`, `ReferencesAdminPage.jsx`, `SectionsAdminPage.jsx`, `ingestion.service.js`, `admin.route.js`.

---

## 0. Mise au point factuelle (corrections actées)

Deux affirmations de mes versions précédentes étaient **fausses**, je les retire :

1. ❌ « L'étape QC n'est matérialisée nulle part » → **FAUX.** Le QC existe à **trois** niveaux :
   - **Automatique** (`ingestion.service.js`) : filtre durée > 3 min, filtre `minViews`, puis **scoring Claude 0-100 qui ne garde que ≥ 65** avant le DRAFT.
   - **Manuel post-scan** : écran « Validation » (Draft / Publier / Rejeter).
   - **Manuel persistant** : « Médiathèque admin » avec **BatchBar** (statut/tags/suppression en masse).
2. ❌ « Tout se fait ligne par ligne, pas de bulk » → **FAUX.** La Médiathèque admin a une vraie **sélection multiple + actions batch**.

Le parcours est donc **plus complet** que je ne l'avais écrit. Le sujet n'est pas « il manque le tri » — c'est « le tri et la qualif sont **mal répartis et mal optimisés** entre les écrans ».

---

## 1. Le parcours réel, mappé sur les 4 étapes

| Étape (modèle Andri) | Écran(s) qui la portent | Statut |
|---|---|---|
| **① Donner les sources** | CurationPage → Tab **Créateurs** + Tab **Liens manuels** | 2 portes distinctes |
| **② Récolter (moteur back)** | Pipeline `ingestion.service.js` + **MonitoringView** (feedback) | auto, peu visible |
| **③ Filtrer les imports** | **ResultsTable** (post-scan) *et* **Médiathèque admin** (BatchBar) | **dédoublé** |
| **④ Qualifier les retenus** | **ResultsTable** *et* **Modale Médiathèque** *et* **Sections admin** | **dédoublé + mélangé à ③** |

> Le point dur saute aux yeux : **③ et ④ sont éclatés sur 2-3 écrans, et mélangés dans le même tableau.** Ton modèle les sépare ; l'UI, non.

---

## 2. Tour d'écrans (ce que chaque écran fait + actions réelles)

### 🖥️ Écran 1 — CurationPage · Tab « Créateurs » → étape ①(+déclenche ②)
**Ce qu'il fait** : liste des créateurs (multi-profils YT/IG/Vimeo/Web), formulaire d'ajout, scan par créateur (« Scrapper »), scan global (« Tout scrapper (N) »).
**Actions clés** : ajouter un créateur = Nom → choisir plateforme → coller handle → Ajouter. **Effet de bord** : si YouTube renseigné, **le scan part automatiquement** au submit (`handleAdd` → `startScan`) et bascule sur le monitoring.
**À creuser (optim actions)** : l'auto-scan au submit = on ne peut pas « juste enregistrer » une chaîne ; pas de filtrage amont au moment de donner la source (le ciblage du *type* de contenu n'existe pas ici).

### 🖥️ Écran 2 — CurationPage · Tab « Liens manuels » → étape ①
**Ce qu'il fait** : coller des URLs YouTube en vrac, parse les lignes en `http…`, importe.
**À creuser** : deuxième porte d'entrée, séparée de la première — même but (« donner des sources »), deux endroits.

### 🖥️ Écran 3 — MonitoringView → étape ②
**Ce qu'il fait** : polling 2s, compteurs **Trouvées / Sauvegardées**, 5 dernières réfs, états RUNNING/COMPLETED/FAILED.
**À creuser** : montre `totalFound` et `totalSaved`, mais **pas** le nombre écarté par le QC auto (durée/views/score) — donc on ne *voit* pas le filtrage amont opérer. Le lien « ce scan → ce lot » s'arrête à la fin du polling.

### 🖥️ Écran 4 — ResultsTable « Validation » (post-scan) → étapes ③ **et** ④ mélangées
**Ce qu'il fait** : grille du lot ; par ligne = thumbnail, titre, créateur, description, **TagEditor**, **SectionSelector**, **StatusDropdown** (Draft/Publier/Rejeter), bouton **Sauver**. Filtres par statut + recherche.
**Inventaire des actions** :
- *Filtrer* (rejeter une réf) = ouvrir le StatusDropdown → Rejeter → **Sauver** = **2 actions/réf**.
- *Qualifier* = ouvrir TagEditor (popover, clics tags) + Section + Statut + Sauver.
- **Pas de sélection multiple ici** → le tri rapide d'un gros lot se fait **réf par réf**.
**À creuser (le cœur du sujet)** : c'est l'écran où ③ (tri rapide) et ④ (qualif lente) sont **collés**, et où le tri n'a **aucun batch** — alors que le batch existe… sur l'autre écran (voir Écran 5). Inversion à corriger.

### 🖥️ Écran 5 — ReferencesAdminPage « Médiathèque admin » → étapes ③ **et** ④ (persistant)
**Ce qu'il fait** : toutes les réfs, filtre par statut (compteurs), **filtre par tags** (fréquence, logique ET), recherche, **sélection multiple + BatchBar** (statut en masse / tags en masse / suppression en masse), **modale** riche (player, tags, mood, contexte, Publier/Rejeter/Draft, supprimer).
**Inventaire des actions** :
- *Filtrer en masse* = cocher → BatchBar → Rejeter → Appliquer = **efficace**.
- *Qualifier* = ouvrir la modale (player + champs) = complet.
**À creuser** : recouvre largement l'Écran 4. **Deux écrans pour ③+④**, l'un (post-scan) sans batch, l'autre (persistant) avec batch. → fragmentation + on ne sait pas lequel utiliser quand.

### 🖥️ Écran 6 — SectionsAdminPage → étape ④ (qualification structurelle)
**Ce qu'il fait** : CRUD sections + assign/unassign de réfs ; un endpoint de **suggestion de sections** (IA) existe côté serveur.
**À creuser** : 3ᵉ endroit où l'on « range » une réf (après ResultsTable et la modale Médiathèque).

---

## 3. Ce que le tour d'écrans révèle (à valider ensemble)

1. **Étape ① fragmentée** : 2 portes (Créateurs / Liens) + auto-scan en effet de bord.
2. **Étape ② aveugle** : le QC auto (durée/views/score ≥ 65) opère mais **ne se voit pas** ; le filtrage amont par `@handle` ne cible pas le *type* de contenu → pollution d'un créateur multi-genres.
3. **Étapes ③ et ④ non séparées** alors que ton modèle les distingue : mélangées dans ResultsTable.
4. **Étapes ③+④ dédoublées** sur 2 écrans aux capacités **incohérentes** : le post-scan n'a pas de batch, le persistant oui.
5. **« Ranger » une réf possible à 3 endroits** (ResultsTable / modale / Sections) → pas de source de vérité d'action.

> **Hypothèse de travail du point** (à débattre, pas tranchée) : aligner l'UI sur ton modèle 4 étapes — une **étape ③ Filtrer** dédiée, rapide, batch/clavier, sur le lot ; puis une **étape ④ Qualifier** distincte sur les seuls retenus — supprimerait à la fois le mélange et le dédoublement.

---

## 3 bis. Verdicts du tour d'écrans (Andri — 5 juin)

| Écran | Étape | Verdict Andri | Action |
|---|---|---|---|
| **1 — Créateurs** | ① | À enrichir : veut **un espace de tous les créateurs enregistrés** + **import en masse de créateurs** | 🔧 **À faire** |
| **2 — Liens manuels** | ① | « Pas mal du tout en vrai » | ✅ Garder tel quel |
| **3 — Monitoring** | ② | OK | ✅ Garder tel quel |
| **4 — Validation (post-scan)** | ③+④ | « Il faut **vraiment améliorer l'UI** » | 🔥 **Priorité** |
| **5 — Médiathèque admin** | ③+④ | OK | ✅ Garder |
| **6 — Sections admin** | ④ | OK | ✅ Garder |

**Périmètre resserré** → deux chantiers seulement : **Écran 4 (refonte UI)** et **Écran 1 (espace créateurs + import masse)**. Tout le reste est gelé/validé.

### Chantier A — Écran 4, « Validation » (priorité)
C'est l'écran qui porte ③ Filtrer + ④ Qualifier mélangés, sans batch. Andri a validé les 4 directions (visuel + repenser de zéro + optimiser les actions + séparer tri/qualif) → **refonte complète**.

**Concept retenu (à valider) — l'écran 4 devient une étape ③ Tri pure :**
- **Planche-contact** (contact-sheet) plutôt que tableau dense : on juge une réf vidéo au thumbnail + titre + score, pas à 8 colonnes. Densité allégée, dark cinema.
- **Compteur « À trier » en grand**, qui descend vers 0 = signal de complétude. Gardées / Rejetées en secondaire.
- **Sas auto rendu visible** : « 18 écartées avant tri (durée/vues/score ≥ 65) » — l'étape ② cesse d'être aveugle.
- **Actions optimisées** : sélection multiple + barre batch (Garder / Rejeter) + **raccourcis clavier** (J/K naviguer, G garder, R rejeter, espace = focus/lecture). Un geste, pas « ouvrir dropdown → choisir → Sauver ».
- **Mode Focus** (une réf à la fois, plein écran, lecture rapide) pour les cas douteux ; mode Grille par défaut.
- **Qualif ④ sortie de l'écran** : un seul CTA « Qualifier les N gardées → » mène à l'étape de qualification (tags/sections/mood), qui ne s'applique **qu'aux gardées**.

> Mockup dark cinema présenté en séance (planche-contact + compteur + batch + clavier + sortie qualif).

### Chantier B — Écran 1, espace créateurs + import masse
- **Espace créateurs** : vue dédiée listant tous les créateurs enregistrés (au-delà du simple panneau d'ajout).
- **Import en masse** : ajouter N créateurs d'un coup (coller une liste de handles/URLs), à l'image du Tab Liens mais pour des **créateurs**, pas des vidéos.

---

## 4. Tour de table (ancré sur les écrans, pas sur des suppositions)

- **Marie (Design)** : le problème est la **répartition** des actions entre écrans, pas leur absence. Je veux mapper chaque action des 4 étapes sur *un* parcours, et décider quel écran porte ③ et quel écran porte ④ — sans les dupliquer.
- **Camille (UX)** : maintenant qu'on a les écrans, l'observation utile = te regarder filtrer **un vrai lot** et compter les actions réelles par réf — pour chiffrer le gain d'un tri batch en ③.
- **Alex (Tech Lead)** : faisable surtout côté front ; le back (scoring, enrichissement) ne bouge pas. Si on rend le QC auto **visible** (étape ②), il faut juste exposer `totalFiltered` proprement (aujourd'hui en `$executeRaw`, client Prisma à régénérer).
- **Sophie (PM)** : le livrable du point n'est pas une feature mais une **carte d'actions cible** par étape, d'où découleront les tickets.
- **Jordan (Ops)** : je chiffre l'« avant » (nb d'actions / lot) pour prouver l'optimisation.

---

## 5. Prochaine étape du point

Le tour d'écrans est fait, les verdicts sont posés (§3 bis). On se concentre sur **Chantier A (Écran 4)** puis **Chantier B (Écran 1)**.

1. **Cadrer la refonte de l'Écran 4** : arbitrer la direction (cf. question en cours) → wireframe du nouveau parcours ③ puis ④ (Marie), avec inventaire des gestes optimisés.
2. **Cadrer l'Écran 1** : espace créateurs + import masse (handles/URLs en lot).
3. **Carte d'actions cible** pour ces deux écrans → tickets v0.5.

> ⚠️ Build dans Claude Code, pas ici. Ce point produit l'alignement + la carte d'actions ; le code suit.

---

### Annexe — pile technique constatée (faits)
- QC auto : `ingestion.service.js` → durée > 180s, `minViews`, `SCORE_THRESHOLD = 65`.
- Statuts réels : `DRAFT | PUBLISHED | REJECTED` (pas d'état « à trier » distinct aujourd'hui).
- Batch : `POST /api/v1/admin/references/batch` (action `status | addTags | delete`).
- Auth admin : `requireAdmin` (JWT) **en place** — corriger le drift doc qui dit l'inverse.
