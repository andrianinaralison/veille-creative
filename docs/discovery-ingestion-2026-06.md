# Discovery — Parcours complet d'ingestion de référence
**180 Degrés · Sophie (PM Lead) · Camille (UX Research) · Alex (Tech Lead)**
Compilée le 7 juin 2026 · Sources : entretien Andri (2026-06-05), benchmark Eagle/Air/Feedly/ShotDeck, audit code.

---

## 1. Problem Statement

Le parcours d'ingestion de référence sur 180 Degrés existe et fonctionne techniquement (Creator Scan + scoring Claude + enrichissement + review DRAFT/PUBLISHED/REJECTED). Mais il est **opéré à l'aveugle** : Andri (admin, fondateur, curateur) finit chaque session **sans confiance** que le lot est propre. La cause : tri (garder/rejeter, rapide) et qualification (tags/sections, lente) sont mélangés dans la même interface, le filtrage n'est pas réutilisable d'une session à l'autre, et il n'y a aucun signal fiable de complétude. Résultat : Andri devine des mots-clés au jugé pour isoler la pollution, joue au jeu de taupe, et recommence à chaque scan.

**Segment :** Andri, admin sole-operator, cible 200–500 refs/mois sans pouvoir déléguer.
**Symptôme observable :** Temps de tri non maîtrisé, confiance nulle sur l'état "propre" d'un lot, pollution connue qui revient aux scans suivants.
**Impact business :** Sans lot propre fiable, la qualification est lente et anxieuse → le réservoir de contenu ne grandit pas → Léa ne reçoit pas un flux continu → la rétention 39€/mois est menacée.

---

## 2. Méthode de recherche utilisée

**Entretien fondateur (Switch Interview + Problem Discovery)** — Andri, 1 session, 2026-06-05.
Choix justifié : Andri est l'unique opérateur du parcours d'ingestion. Un seul sujet suffit pour valider les patterns si le vécu est riche et récent (POC bulk chargement quelques jours avant l'entretien).

**Benchmark** — Eagle, Air, Feedly, ShotDeck. Analysés sur deux axes : gestion de lot (statuts, compteurs) et filtrage réutilisable.

**Audit code** — `ingestion.service.js`, `admin-curation-context.md`, schéma Prisma, routes backend. Alignement état décrit ↔ état réel.

---

## 3. Synthèse des insights

### Thème 1 — Tri et qualification sont fondamentalement différents mais traités pareil *(priorité : 5×5 = 25)*

> *"J'ai inventé une étape entre le scrape et la qualification — trier c'est rapide, qualifier c'est lent, mais l'interface ne fait pas cette distinction."*

- Le tri (garder/rejeter) est une décision binaire, rapide, sur le signal brut (titre + thumbnail)
- La qualification (tags, sections, contexte) est lente, réflexive, éditoriale
- Les mélanger dans la même vue force Andri à alterner entre deux modes cognitifs incompatibles
- **Conséquence** : la qualif est pénible, les tags "s'empilent", la confidence sur la qualité baisse
- Topic Discovery a été abandonné pour cette raison (résultats trop pollués, pas de filtre rapide avant enrichissement)

### Thème 2 — Pas d'état "propre" fiable = pas de confiance *(priorité : 5×4 = 20)*

> *"Je finis sans savoir si c'est propre. Il n'y a pas de signal qui dit 'c'est bon, tu peux passer à la suite'."*

- L'état DRAFT recouvre à la fois "en attente de tri" et "en attente de qualif" → ambigu
- Aucun compteur visible du nombre de refs encore à trier
- Impossible de savoir si on a tout vu ou s'il reste des éléments cachés dans la pagination
- Benchmark Eagle/Air : un lot surligné + compteur qui descend → signal de complétude clair

### Thème 3 — Filtrage non persistant = pollution qui revient *(priorité : 4×5 = 20)*

> *"Justin Porter Media fait 50% de contenu hors-sujet. Je l'ai rejeté 30 fois. Il revient au prochain scan."*

- Les règles de rejet (créateur polluant, type de contenu hors-scope) doivent être re-appliquées à chaque session
- Pas de mémoire des exclusions → jeu de taupe sans fin
- Benchmark Feedly : mute filters réutilisables par source → la pollution connue disparaît définitivement

### Thème 4 — Recherche = tâtonnement sans boussole *(priorité : 3×4 = 12)*

> *"Je devine des mots-clés pour isoler la pollution. Ça marche un coup sur deux."*

- Sans NL search sur les refs déjà importées, Andri ne peut pas chercher "montre-moi tous les wedding Sony A7S dans ce lot"
- Le smart search Claude existe déjà côté backend (`/search`) mais retourne `results: []` (non branché BDD)
- Brancher ce search sur les refs en cours de tri tuerait le jeu de taupe à moindre coût

---

## 4. Solutions par insight

### Sur le Thème 1 — Séparer tri et qualification

| Option | Impact | Effort | Verdict |
|---|---|---|---|
| **Statut TRIAGE distinct** (avant DRAFT/PUBLISHED/REJECTED) + vue dédiée tri | H | M | ✅ Retenu — P1 |
| Onglet séparé "À trier" dans l'interface existante | M | S | Alternative si P1 trop lourd |
| Interface admin refaite de zéro | H | L | Hors scope v0.5 |

**Job story :** *Quand j'importe un lot de chaînes, je veux voir uniquement les nouvelles refs à trier (statut TRIAGE), pouvoir les valider ou rejeter en bulk rapidement, afin d'atteindre compteur = 0 et passer sereinement à la qualification.*

### Sur le Thème 2 — Signal de complétude

| Option | Impact | Effort | Verdict |
|---|---|---|---|
| **Compteur "X à trier" dans l'interface** qui descend vers 0 | H | S | ✅ Inclus dans P1 |
| Badge dans la nav admin | M | S | Complémentaire |

**Job story :** *Quand je suis dans la vue tri, je veux voir un compteur décroissant qui atteint 0, afin de savoir avec certitude que j'ai tout vu et que le lot est propre.*

### Sur le Thème 3 — Filtrage persistant

| Option | Impact | Effort | Verdict |
|---|---|---|---|
| **Règles d'exclusion par créateur/source** sauvegardées en BDD, appliquées automatiquement aux scans futurs | H | M | ✅ Retenu — P2 |
| Tags de rejet côté creator (champ `excludeKeywords`) | M | S | Complément de P2 |
| Blacklist globale de créateurs | M | S | Inclus dans P2 |

**Job story :** *Quand je rejette une ref d'un créateur hors-scope, je veux créer une règle d'exclusion persistante, afin que ce type de contenu soit automatiquement filtré aux prochains scans.*

### Sur le Thème 4 — Search dans le back-office

| Option | Impact | Effort | Verdict |
|---|---|---|---|
| **Brancher `/search` Claude sur les refs TRIAGE** (déjà prêt côté infra) | H | M | ✅ Retenu — P3 |
| Filtres manuels par tags/type/créateur | M | S | Déjà partiel dans l'interface |

**Job story :** *Quand je trie un lot, je veux pouvoir chercher en langage naturel "mariage Sony A7S lumière naturelle", afin d'isoler et traiter rapidement les refs d'un même cluster.*

---

## 5. Expérience validante recommandée

> La boucle complète est déjà construite. Ce n'est pas un MVP à tester — c'est un **workflow prod à fiabiliser**. L'expérience de validation est l'usage réel.

**Critère de succès v0.5 :**
- Compteur TRIAGE → 0 en < 20 min pour un lot de 50 refs (vs "inconnu" aujourd'hui)
- Taux de réapparition de la pollution connue = 0 après 3 scans (règles persistantes)
- 0 recours à la pagination pour savoir si tout a été vu

**Mesure :** observation directe d'une session de curation Andri post-v0.5 (30 min, enregistrement écran).

---

## 6. Décision

### ✅ GO — v0.5 "Curation fiable & sereine"

Les 3 paris sont validés par la recherche, faisables sur la stack existante, et séquencés dans la ROADMAP (Phase B, sem. 5-6, après la dette Phase A).

| Pari | Ticket Linear | Statut |
|---|---|---|
| P1 — État TRIAGE + compteur | #180-29 | ✅ Créé |
| P2 — Règles de filtrage persistantes | #180-30 | ✅ Créé |
| P3 — Smart search dans le back-office de tri | #180-31 | ✅ Créé |
| Dette `totalFiltered` | #180-32 | ✅ Créé |

### Zones non encore explorées (hors scope v0.5)

| Question ouverte | Quand la traiter |
|---|---|
| Cadence exacte du digest (hebdo ? quotidien ?) | Session JTBD Léa avant v0.6 |
| Définition précise du "treatment" (vs moodboard) | Session JTBD Léa avant v0.7 |
| Filtrage cassé côté bibliothèque publique (Léa) | À caler en v0.6 (parcours front 1) |
| Délégation de la curation à un freelance (Persona 2) | Post-MVP |

---

## Annexe — Drift doc identifié (à corriger)

`CLAUDE.md` + `admin-curation-context.md` indiquent encore « `/admin` + `/ingestion` sans auth (bloquant) » — **faux**. `requireAdmin` (jose JWT) + rate-limit 10/15 min sont déjà montés dans `server/src/index.js`. Ticket T-01 est ✅ Done. Ces docs doivent être mis à jour pour ne pas polluer les prochaines sessions.
