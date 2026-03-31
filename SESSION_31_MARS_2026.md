# Session VeilleCreative — 31 Mars 2026
**Durée** : ~45 min | **Type** : Review PRD + Décisions produit/archi
**Prochaine session** : 1er Avril 2026 à 18h — Taxonomie des tags

---

## 1. Repositionnement du concept produit

**Avant (PRD v1)** : "Copilote créatif" — 3 piliers équivalents
**Après** : 2 axes + réordonnancement

### Nouveaux axes
- **Inspirationnel** : s'inspirer, organiser son inspiration, communiquer avec le client
- **Se faire voir** : mettre en avant son travail → **Release 2**

### Nouveaux segments ajoutés
Mariage, corporate, événementiel + **Ads, Documentaires indépendants, Shorts films**

### Hiérarchie des piliers (nouveau)
> Bibliothèque curée **>** Gestion des projets + Moodboard **>** Digest

---

## 2. Décisions architecture & fonctionnel

### Définition d'une "Référence"
- Une vidéo sélectionnée depuis une des sources (pas des frames statiques comme Frameset/Shotdeck)
- **Hover** : titre + pastille source (YouTube / Vimeo / Creator Websites / Instagram)
- **Clic → Modale** :
  - Gauche : iframe de la vidéo (ou intégration propre)
  - Droite : H2/H3 titre + chips tags (3-4 max) + description (scrapée depuis la source) + métadonnées
  - Métadonnées enrichies → R2/R3 (plus pertinentes quand les utilisateurs uploadent eux-mêmes)

### Sources de contenu (pipeline data)
- **Priorité 1** : YouTube (API Data V3 — déjà opérationnel)
- **Priorité 2** : Vimeo (si API accessible — à tester)
- **Priorité 3** : Instagram Reels ⚠️ embed public coupé → comportement dégradé : thumbnail + lien externe
- **Fallback Vimeo** : scraping des sites de vidéastes indépendants
- **Mécanisme** : appels API quotidiens avec liste de mots-clés précis → Python (URL + iframe) → import BDD

### Pipeline data (état actuel)
- YouTube API Data V3 existe mais pas encore industrialisé
- Pas encore de logique de scoring/filtrage
- À faire : définir la liste de mots-clés ensemble + industrialiser le process

### Smart Search Bar (US-A2 — Exploration IA)
- Une seule barre qui détecte automatiquement : **brief client** vs **requête de recherche**
- Si brief détecté → la barre se transforme en zone de prompt
- Appel LLM (Claude) qui comprend le brief et applique des filtres sur la **base de contenu déjà ingérée** (pas de recherche à la volée)
- Qualité dépend directement de la richesse de la bibliothèque → cold start à gérer

### Curation du contenu
- **MVP** : curation humaine/concierge (approche concierge validée)
- **R5/R6** : switch vers scoring automatique

### Cold start
- Action prioritaire pré-bêta : ingérer le maximum de références avant le lancement

---

## 3. Décisions User Stories

| US | Statut | Notes |
|----|--------|-------|
| US-A1 Création projet | ⚠️ À revoir | "Mood presets" supprimés — remplacés par tags techniques (à définir) |
| US-A2 Exploration IA | ✏️ Modifié | Smart search bar avec détection brief → LLM Claude sur base ingérée |
| US-A3 Moodboard | ⚠️ À retravailler | Feature pas satisfaisante, à repenser en profondeur (UX + cas d'usage) |
| US-A4 Export | ✅ Validé | PDF one-click + lien partageable |
| US-A5 Feedback guidé | → R2 | Confirmé hors MVP |
| US-A6 (nouveau) | → R2 | — |
| US-B1 Digest | ✅ Validé | Format à décider : universel vs spécialisé ? Fréquence ? |
| US-B2 Sauvegarde contextuelle | ✅ Validé | Max 3-4 tags affichés, contexte auto |
| US-B3 Surprises | ✅ Validé | Hors-profil, toggle J'aime/Pas pour moi |
| US-B4 Résumé session | → R2 | Confirmé |
| US-B5 Streak | → R2 | Confirmé |

---

## 4. Suppressions dans le PRD

- ❌ **"Mood presets"** → bullshit, abandonné partout dans le PRD
- ❌ **Hypothèse H3** (mood presets réduisent les allers-retours) → obsolète à supprimer
- ❌ Formulation "copilote créatif" → à reformuler selon les nouveaux axes

---

## 5. Points structurants identifiés (à traiter avant de coder)

### 🔴 Taxonomie des tags — SESSION À VENIR (1er Avril 18h)
C'est **le point le plus structurant** de tout le projet. Il bloque :
- La recherche et les filtres dans la bibliothèque
- L'exploration IA (Claude filtre sur quels critères ?)
- L'affichage dans la modale (quels chips ?)
- Le pipeline d'ingestion (qu'est-ce qu'on extrait des sources ?)

**Dimensions candidates à débattre :**
- Type de contenu (mariage, corporate, événementiel, ads, doc, short film)
- Caméra (Sony FX3, Canon C70, BMPCC, Lumix S5ii...)
- Style visuel (cinématique, épuré, dramatique, naturel, vintage, anamorphique)
- Technique de tournage (handheld, stabilisé, slow motion, drone, time-lapse)
- Color grading (chaud, froid, désaturé, naturel, contrasté)
- Lumière (naturelle, studio, low-key, golden hour)
- Narration/montage (émotionnel, rythmé, documentaire, poétique)

**Questions posées, pas encore répondues :**
1. Quelles dimensions sont indispensables vs bruit ?
2. La caméra : filtre de recherche ou métadonnée informative ?
3. Manque-t-il une dimension évidente ?

---

## 6. Timeline & contraintes

- **Deadline MVP fonctionnel** : début mai 2026 (~4 semaines)
- **Migration mock → BDD** : à planifier urgemment (contenu bibliothèque + compte user + historisation)
- **Pré-bêta** : ingérer le max de références pour résoudre le cold start

---

## 7. Questions ouvertes (non résolues)

| # | Question | Impact |
|---|----------|--------|
| Q1 | Taxonomie des tags : intention vs technique vs données caméra ? | Bloque tout |
| Q2 | Digest : universel ou personnalisé par spécialisation (mariage vs corporate) ? | Complexité éditoriale |
| Q3 | Digest : fréquence ? Hebdo / bi-hebdo / à la demande ? | KPI rétention |
| Q4 | Export moodboard inclus dans le tier Discovery (gratuit) ou Pro uniquement ? | Taux de conversion |

---

## 8. Risques ajoutés/confirmés

| ID | Risque | Statut |
|----|--------|--------|
| R1 | Instagram embed public coupé | ✅ Confirmé — comportement dégradé acté |
| R2 | API Vimeo inaccessible | ⚠️ À tester en priorité |
| R3 | RGPD/Fair Use scraping contenu tiers | ⚠️ Avis juridique avant bêta |
| R4 | Cold start bibliothèque au lancement | ✅ Mitigé par ingestion pré-bêta |

---

## 9. "Se faire voir" — Vision Release 2

Upload de contenu par les utilisateurs → disponible pour les autres → **tokens de recherche en contrepartie** + visibilité du travail.
Objectif à terme : ne plus avoir à scraper — les vidéastes alimentent eux-mêmes la base.
Modèle type contribution communautaire incentivée.

---

*Session suivante : Taxonomie des tags — Mercredi 1er Avril à 18h*
