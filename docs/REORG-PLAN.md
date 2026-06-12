# Plan de restructuration — Documentation 180 Degrés

> **Statut : PROPOSITION (rien n'est déplacé).** Objectif : rendre l'arborescence des fichiers annexes (cadrage, PM, UX, tech, journal) optimale pour la **consultation par un agent** (Claude Fable 5) et par toi.
> Périmètre : `docs/` + `assets/` + fichiers épars à la racine. **Hors périmètre** : code (`server/`, `veille-creative/`) et `Product-Manager-Skills/` (lib tierce).

---

## 1. Principes d'optimisation « consultation agent »

Un agent qui ouvre le dépôt doit pouvoir répondre à *« où est l'info X ? »* en un seul coup d'œil. Cinq règles :

1. **Un point d'entrée unique** : `docs/README.md` est un INDEX maître (tableau : doc → rôle → statut → quand le consulter). L'agent lit ça en premier, jamais une recherche à l'aveugle.
2. **Dossiers par intention, préfixés et numérotés** (`00-cadrage`, `10-produit`, `20-ux`, `30-tech`, `90-journal`). Le numéro encode l'ordre de lecture *et* trie naturellement. On classe par **rôle**, jamais par date.
3. **Vivant vs daté** séparés nettement : une « source de vérité » qui évolue (roadmap, WoW, journal 5C) ne vit pas au même endroit qu'un instantané (compte-rendu de session, audit ponctuel → `90-journal/`).
4. **Nommage homogène** : `kebab-case`, pas de `MAJUSCULES`, pas d'espaces, dates en suffixe ISO (`-2026-06-04`). Un agent prédit le nom d'un fichier sans le chercher.
5. **Statut explicite** : chaque doc actif porte un en-tête de statut (`Actif` / `Référence vivante` / `Instantané` / `Archivé`) — voir §4. `archive/` reste la zone morte, intouchée.

---

## 2. Arborescence cible

```
docs/
├── README.md                         ← ⭐ INDEX MAÎTRE (point d'entrée agent)
│
├── 00-cadrage/                       ← le POURQUOI (stable, stratégique)
│   ├── projet.md                     (ex docs/PROJET.md)
│   └── business/
│       ├── glossaire-investisseur.md
│       ├── strategie-investisseur.docx
│       ├── modele-financier.xlsx
│       ├── simulation-financiere.jsx (ex 180degres_simulation_v2.jsx)
│       └── decks/
│           ├── pitch-deck.pptx        (ex 180_Degres_Pitch_Deck.pptx)
│           ├── slide-investisseur.pptx
│           ├── deck-180degres.html
│           └── restitution-storytelling.pptx   (ex racine/)
│
├── 10-produit/                       ← le QUOI (PM)
│   ├── roadmap.md                    ← ⭐ source de vérité (ex docs/ROADMAP.md)
│   ├── way-of-working.md
│   ├── prd/
│   │   ├── ingestion-admin.md
│   │   └── ingestion-espace.md
│   ├── discovery/
│   │   └── ingestion-2026-06.md
│   └── contexte/
│       └── admin-curation.md          (⭐ « lire en premier » session admin)
│
├── 20-ux/                            ← UX / Design
│   ├── audit-ingestion-2026-06.md
│   ├── userflow-ingestion-annotated.html
│   ├── digest-reference/
│   │   ├── analyse-pages-digest.md
│   │   └── analyse-digest-reference.html
│   └── inspirations/                 (ex assets/inspirations/ : png, html, jpg)
│
├── 30-tech/                          ← Engineering (specs, ADR, archi, qualité)
│   ├── journal-5c.md                 ← ⭐ référence vivante (ex docs/lean.md)
│   ├── specs/
│   │   └── sprint-v05c.md
│   ├── adr/
│   │   └── 0001-decoupage-ingestion.md
│   ├── architecture/
│   │   ├── architecture-180degres.html
│   │   └── toolstack.html
│   ├── audit/
│   │   ├── audit-2026-06-04.md
│   │   └── plan-restructuration-code.md
│   └── data/
│       └── sample-youtube-wedding.csv (ex assets/youtube_wedding_videos.csv)
│
├── 90-journal/                       ← instantanés datés (pas de source de vérité)
│   ├── sessions/
│   │   ├── sprint-review-v0.4-v0.5-2026-06-06.md
│   │   ├── ingestion-team-review-2026-06-05.md
│   │   ├── hotfix-enrichment-schema-2026-06-07.md
│   │   └── hotfix-zod-v4-2026-06-07.md
│   └── team-thread-audit-ingestion.html
│
└── archive/                          ← INCHANGÉ (legacy, zone morte)
    └── … (tous les fichiers actuels conservés tels quels)
```

**Conséquence : le dossier `assets/` disparaît** — tout le non-code est consolidé sous `docs/`. Restent à la racine uniquement les fichiers conventionnels (`CLAUDE.md`, `README.md`, `CONTRIBUTING.md`) et le code.

---

## 3. Mapping fichier par fichier

| Aujourd'hui | Destination | Catégorie |
|---|---|---|
| `docs/PROJET.md` | `docs/00-cadrage/projet.md` | Cadrage |
| `assets/glossaire_investisseur.md` | `docs/00-cadrage/business/glossaire-investisseur.md` | Cadrage |
| `assets/180degres_strategie_investisseur.docx` | `docs/00-cadrage/business/strategie-investisseur.docx` | Cadrage |
| `assets/180degres_modele_financier.xlsx` | `docs/00-cadrage/business/modele-financier.xlsx` | Cadrage |
| `assets/180degres_simulation_v2.jsx` | `docs/00-cadrage/business/simulation-financiere.jsx` | Cadrage |
| `assets/180_Degres_Pitch_Deck.pptx` | `docs/00-cadrage/business/decks/pitch-deck.pptx` | Cadrage |
| `assets/180degres_slide_investisseur.pptx` | `docs/00-cadrage/business/decks/slide-investisseur.pptx` | Cadrage |
| `assets/deck-180degres.html` | `docs/00-cadrage/business/decks/deck-180degres.html` | Cadrage |
| `restitution-storytelling.pptx` (racine) | `docs/00-cadrage/business/decks/restitution-storytelling.pptx` | Cadrage |
| `docs/ROADMAP.md` | `docs/10-produit/roadmap.md` | Produit ⭐ |
| `docs/WAY-OF-WORKING.md` | `docs/10-produit/way-of-working.md` | Produit |
| `docs/PRD_Ingestion_Admin.md` | `docs/10-produit/prd/ingestion-admin.md` | Produit |
| `docs/PRD_Ingestion_Espace.md` | `docs/10-produit/prd/ingestion-espace.md` | Produit |
| `docs/discovery-ingestion-2026-06.md` | `docs/10-produit/discovery/ingestion-2026-06.md` | Produit |
| `docs/admin-curation-context.md` | `docs/10-produit/contexte/admin-curation.md` | Produit ⭐ |
| `docs/audit-ux-ingestion-2026-06.md` | `docs/20-ux/audit-ingestion-2026-06.md` | UX |
| `docs/userflow-ingestion-annotated.html` | `docs/20-ux/userflow-ingestion-annotated.html` | UX |
| `assets/analyse-pages-digest-reference.md` | `docs/20-ux/digest-reference/analyse-pages-digest.md` | UX |
| `assets/analyse-digest-reference.html` | `docs/20-ux/digest-reference/analyse-digest-reference.html` | UX |
| `assets/inspirations/*` | `docs/20-ux/inspirations/*` | UX |
| `docs/lean.md` | `docs/30-tech/journal-5c.md` | Tech ⭐ vivant |
| `docs/sprint-v05c-tech-spec.md` | `docs/30-tech/specs/sprint-v05c.md` | Tech |
| `docs/adr/0001-decoupage-ingestion.md` | `docs/30-tech/adr/0001-decoupage-ingestion.md` | Tech |
| `assets/architecture-180degres.html` | `docs/30-tech/architecture/architecture-180degres.html` | Tech |
| `docs/toolstack-180.html` | `docs/30-tech/architecture/toolstack.html` | Tech |
| `docs/audit/AUDIT-2026-06-04.md` | `docs/30-tech/audit/audit-2026-06-04.md` | Tech |
| `docs/audit/PLAN-RESTRUCTURATION.md` | `docs/30-tech/audit/plan-restructuration-code.md` | Tech |
| `assets/youtube_wedding_videos.csv` | `docs/30-tech/data/sample-youtube-wedding.csv` | Tech |
| `docs/sessions/*.md` | `docs/90-journal/sessions/*` | Journal |
| `docs/team-thread-audit-ingestion.html` | `docs/90-journal/team-thread-audit-ingestion.html` | Journal |
| `docs/archive/*` | **inchangé** | Archive |

---

## 4. En-tête de statut (à ajouter en tête de chaque doc actif)

Bloc minimal en haut de fichier, pour qu'un agent juge la fraîcheur sans lire tout le doc :

```markdown
> **Statut** : Référence vivante · **Domaine** : Produit · **MàJ** : 2026-06-12 · **Source de vérité** : oui
```

Valeurs de `Statut` : `Référence vivante` (roadmap, WoW, journal-5c, admin-curation) · `Actif` (PRD, specs en cours) · `Instantané` (sessions, audits datés) · `Archivé`.

---

## 5. Renommages notables (pourquoi)

- `lean.md` → `journal-5c.md` : le nom « lean » n'évoque pas son contenu (registre d'incidents 5C). Le nouveau nom est auto-descriptif.
- `PROJET.md` / `ROADMAP.md` / `WAY-OF-WORKING.md` → `kebab-case` : homogénéité, prédictibilité.
- `audit/PLAN-RESTRUCTURATION.md` → `plan-restructuration-code.md` : lève l'ambiguïté avec *ce* plan (qui concerne la doc, pas le code).
- decks regroupés sous `business/decks/` : tous les supports de présentation au même endroit.

---

## 6. Impacts à traiter lors de l'exécution

1. **`CLAUDE.md`** référence des chemins qui changent (et certains déjà périmés). À mettre à jour :
   - `docs/ROADMAP.md` → `docs/10-produit/roadmap.md`
   - `docs/WAY-OF-WORKING.md` → `docs/10-produit/way-of-working.md`
   - `docs/audit/AUDIT-2026-06-04.md` → `docs/30-tech/audit/audit-2026-06-04.md`
   - `docs/audit/PLAN-RESTRUCTURATION.md` → `docs/30-tech/audit/plan-restructuration-code.md`
   - `docs/admin-curation-context.md` → `docs/10-produit/contexte/admin-curation.md`
   - `docs/PRD_Ingestion_Admin.md` → `docs/10-produit/prd/ingestion-admin.md`
   - réf. « 5C #004 » : pointer `docs/30-tech/journal-5c.md`
   - liens déjà cassés dans CLAUDE.md (`docs/backlog-180degres.md`, `docs/iteration-1-prisma-schema.md`) → corriger vers `docs/archive/…`
2. **Liens internes inter-docs** : `grep -rn "docs/" docs/` avant/après pour relinker.
3. **Préserver l'historique git** : utiliser `git mv` (pas delete+create).
4. **`README.md` racine** : ajouter un pointeur « Documentation → `docs/README.md` ».

---

## 7. Contenu proposé pour `docs/README.md` (INDEX maître)

```markdown
# Documentation 180 Degrés — Index

> Point d'entrée unique. Pour toute question « où est X ? », commence ici.
> Convention : dossiers numérotés par intention · `kebab-case` · dates ISO en suffixe.

## 🧭 À lire en premier selon le contexte
| Tu veux… | Ouvre |
|---|---|
| Comprendre le projet | `00-cadrage/projet.md` |
| Savoir quoi/quand on construit | `10-produit/roadmap.md` ⭐ source de vérité |
| Le process (rôles, PR, rituels) | `10-produit/way-of-working.md` |
| Démarrer une session admin/curation | `10-produit/contexte/admin-curation.md` |
| Voir les bugs/incidents connus | `30-tech/journal-5c.md` |

## 00 · Cadrage (le pourquoi)
- `projet.md` — présentation, persona Léa, problème, solution
- `business/` — glossaire, stratégie & modèle financier investisseur, decks

## 10 · Produit (le quoi)
- `roadmap.md` ⭐ — jalons v0.4 → v0.7, source de vérité
- `way-of-working.md` — rôles, DoR/DoD, flux PR, rituels
- `prd/` — ingestion-admin, ingestion-espace
- `discovery/` — ingestion-2026-06
- `contexte/admin-curation.md` ⭐ — contexte backoffice curation

## 20 · UX
- `audit-ingestion-2026-06.md` — audit UI/UX parcours ingestion
- `userflow-ingestion-annotated.html` — userflow annoté
- `digest-reference/` — analyse des pages digest de référence
- `inspirations/` — captures & directions de feed

## 30 · Tech
- `journal-5c.md` ⭐ vivant — registre d'incidents 5C
- `specs/sprint-v05c.md` — spec technique sprint v0.5C
- `adr/` — décisions d'architecture
- `architecture/` — schémas archi & toolstack (HTML)
- `audit/` — audit code 2026-06-04 + plan de restructuration code
- `data/` — échantillons de données

## 90 · Journal (instantanés datés — pas de source de vérité)
- `sessions/` — comptes-rendus de sprints & hotfixes
- `team-thread-audit-ingestion.html` — thread équipe

## 📦 archive/
Legacy conservé pour traçabilité. Ne pas consulter comme source courante.
```

---

## 8. Exécution (sur ton GO)

Quand tu valides, j'exécute en une passe :
1. Création de l'arborescence + `git mv` de tous les fichiers (historique préservé).
2. Génération de `docs/README.md` (index ci-dessus).
3. Ajout des en-têtes de statut sur les docs actifs.
4. MàJ des chemins dans `CLAUDE.md` + relink des liens internes.
5. Vérif : `grep -rn` sur les anciens chemins → zéro occurrence orpheline.
