# Contexte global — Backoffice Curation 180 Degrés

> **Statut** : ⭐ Référence vivante · **Domaine** : Produit · **MàJ** : 2026-06-12 · **Source de vérité** : oui (contexte admin)

> Document de référence à fournir en tête de chaque session de dev.
> Dernière mise à jour : **2 juin 2026**

---

## 1. Ce qui est construit et verrouillé

### Frontend React — pages publiques

- **LibraryPage** (`/`) — bibliothèque dark cinema, grille références, filtres, smart search, sections thématiques. **Branchée sur l'API réelle** (`GET /api/v1/references`). Plus de mock data.
- **CategoryPage** (`/library/section/:id`) — page de section thématique, également branchée API.
- **ReferenceCard / ReferenceModal** — composants de consultation, design système validé et verrouillé.
- **ProjectsPage, ProjectCreate, ProjectDetail, MoodboardBuilder** — encore sur mock data (backend Projets pas encore développé).
- **ScrollToTop** — reset scroll sur chaque changement de route.

### Frontend React — backoffice `/admin`

- **AdminLayout** — sidebar nav, outlet React Router, routes `/admin/curation`, `/admin/references`, `/admin/sections`
- **CurationPage** (`/admin/curation`) — deux tabs :
  - **Tab Créateurs** : liste créateurs + formulaire ajout (Nom → dropdown plateforme → champ contextuel → chips récap) + scan auto-déclenché à l'ajout si YouTube renseigné + monitoring live
  - **Tab Liens manuels** : textarea URLs YouTube → import → monitoring
  - **MonitoringView** : polling toutes les 2s, compteurs live
  - **ResultsTable** : TagEditor, SectionSelector, StatusDropdown, sauvegarde ligne par ligne
- **ReferencesAdminPage** (`/admin/references`) — toutes les références avec filtres statut, prévisualisation vidéo, édition inline
- **SectionsAdminPage** (`/admin/sections`) — CRUD sections + assign/unassign références

### Design system (verrouillé)

Palette dark cinema avec tokens Tailwind :
- `bg-canvas` — fond principal très sombre
- `bg-surface` / `bg-surface-raised` — surfaces secondaires
- `text-ink` — texte principal, `text-ink-muted` — secondaire, `text-ink-faint` — tertiaire
- `border-surface-border` — séparateurs
- `font-editorial` — titres serif éditorial
- `font-mono` — labels, metadata, tracking-widest uppercase
- Pas d'arrondi (sauf pills de filtre)
- Hovers via opacité, transitions 300ms

### Backend Express

- `POST /api/v1/ingestion/sessions` — agent Topic Discovery (brief NL → Claude → YouTube API → DRAFT)
- `POST /api/v1/ingestion/creator-scan` — scan chaîne YouTube d'un ou plusieurs créateurs
- `POST /api/v1/ingestion/links` — import URLs manuelles
- `GET /api/v1/ingestion/sessions/:id` — polling status + références progressives
- `GET/POST/PATCH/DELETE /api/v1/admin/creators` — CRUD créateurs (4 profils)
- `GET/PATCH/DELETE /api/v1/admin/references` — CRUD références avec filtres
- `GET/POST/PATCH/DELETE /api/v1/admin/sections` — CRUD sections
- `POST /api/v1/admin/sections/:id/assign` — assign références à section
- `GET /api/v1/references` — bibliothèque publique (utilisé par LibraryPage)
- `GET /api/v1/references/sections` — sections avec références (utilisé par LibraryPage + CategoryPage)
- `POST /api/v1/search` — smart search Claude (retourne encore `results: []`, non branché BDD)

### Pipeline ingestion — 3 modes

**Mode Topic Discovery** : Brief NL → Claude génère 5-8 requêtes → YouTube `search.list` → `videos.list` + `contentDetails` → filtre durée > 3 min → scoring Claude 0-100 (seuil 65) → enrichissement Claude (tags/mood/typeContenu/context, batch 15, prompt caching) → thumbnails → Supabase CDN → upsert DRAFT

**Mode Creator Scan** : Handle YouTube (`@handle` nu ou URL) → résolution channelId → `playlistItems.list` (quota-efficient) → `videos.list` + `contentDetails` → filtre > 3 min → enrichissement Claude → DRAFT. **Auto-déclenché** dès qu'un créateur avec YouTube est ajouté.

**Mode Liens manuels** : URLs YouTube → `videos.list` → enrichissement Claude → DRAFT

### Modèle Creator — 4 profils

```
id, name
youtubeHandle  — @handle ou URL complète (scan auto au submit)
instagramHandle — @handle (stocké, scan non développé)
vimeoUrl        — URL profil (stocké, scan non développé)
websiteUrl      — URL site (stocké, scraping non développé)
url             — dérivé de youtubeHandle (pour resolveChannelId legacy)
channelId       — résolu et mis en cache après premier scan
platform        — YOUTUBE par défaut
active, createdAt
```

### Base de données (Supabase PostgreSQL 16)

- **Reference** : url (UNIQUE), platform, sourceMode, title, description, channelName, channelUrl, thumbnailUrl (CDN), tags[], mood, typeContenu, context, status (DRAFT|PUBLISHED|REJECTED), sectionId, ingestionSessionId
- **IngestionSession** : mode, status (RUNNING|COMPLETED|FAILED), brief, totalFound, totalFiltered, totalSaved
- **Creator** : voir ci-dessus
- **Section** : title, slug (UNIQUE), description, position, active

### Supabase Storage

- Bucket `thumbnails` public — CDN opérationnel
- Convention clés : `refs/youtube/{videoId}.jpg`

---

## 2. Scope produit ajusté (2 juin 2026)

- **Digest hebdomadaire** → 🔽 déprioritisé post-MVP
- **Découvertes / Surprises** → 🚫 abandonné
- **Scan Instagram/Vimeo/Web** → backlog secondaire (Vimeo en priorité 1)

---

## 3. Prochaines étapes (dans l'ordre)

| Priorité | Feature | Notes |
|---|---|---|
| 1 | **Auth JWT** | Protéger routes `/admin`, signup/login/me utilisateurs |
| 2 | **Smart search branché BDD** | Remplacer `results: []` dans `search.route.js` |
| 3 | **Projets** | CRUD `/api/v1/projects` + UI |
| 4 | **Moodboard** | CRUD + export PDF |
| 5 | **Scan Vimeo** | API Vimeo `/users/{id}/videos`, pipeline proche YouTube |
| 6 | **Scan site web** | Scraper embeds → pipeline liens manuels |

---

## 4. Design system — look & feel admin

L'admin respecte le design system dark cinema. Pas de dashboard SaaS blanc.

- **Fond** : `bg-canvas`, surfaces `bg-surface`
- **Pas de couleurs vives** — accents via `text-ink` + opacités
- **Statuts** : indicateurs sobres, labels `font-mono` uppercase, opacités pour DRAFT/PUBLISHED/REJECTED
- **Actions** : `bg-ink text-canvas` primaire, `border border-surface-border` secondaire. Jamais de boutons rounded.
- **Densité** : l'admin peut être dense, formulaires compacts
- **Feedback agent** : indicateur discret (compteurs), pas de gros spinner

---

## 5. Taxonomie Claude (enrichissement)

```
ambiance : cinématique, épuré, dramatique, romantique, luxe, intime, mélancolique, nostalgique, épique, mystérieux, joyeux, poétique, élégant, sombre, énergique, rêveur, brut, sensuel, sérieux, authentique
colorimetrie : chaud, froid, teal-orange, désaturé, contrasté, pastel, monochrome, film-grain, vintage, moody-dark, natural-light, high-key, low-key, rose-tinted, vert-forêt, sépia
narration : émotionnel, rythmé, beat-sync, contemplatif, documentaire, voix-off, non-linéaire, poétique, flashback, jump-cuts, long-takes, slow-burn, punch-cuts, transitions-créatives
format_image : 16-9, 2.35-scope, 2.39-ultra-scope, 1.85, open-gate, 4-3, 1-1-carré, 9-16-vertical, 6-5, super8-16mm
type_contenu : mariage, corporate, événementiel, publicité-ads, documentaire, court-métrage, clip-musical, portrait, fashion-lifestyle, sport-action, gastronomie, immobilier, travel-voyage, nature, engagement-couple
camera : sony-fx3, sony-fx6, sony-fx9, sony-a7siii, sony-a1, sony-zve1, canon-c70, canon-c300iii, canon-r5c, bmpcc4k, bmpcc6k, bm-ursa, lumix-s5ii, lumix-s1h, red-komodo, red-monstro, arri-alexa, dji-ronin4d, iphone-smartphone, gopro-action
optique : anamorphique, sphérique, prime, zoom, macro, grand-angle, téléobjectif, vintage-dezoomé, tilt-shift, fisheye
technique_tournage : handheld, gimbal-stabilisé, trépied, drone-aérien, fpv, steadicam, slider, jib-grue, sous-marin, caméra-embarquée, macro, timelapse, hyperlapse, slow-motion, double-exposition, tilt-shift, 360
mouvement_camera : statique, panoramique, travelling-avant, travelling-arrière, travelling-latéral, push-in, pull-out, rotation, plongée, contre-plongée, dutch-angle, low-angle, high-angle, crane-up, crane-down, zoom-optique, dézoom
cadrage : plan-large, plan-ensemble, plan-moyen, plan-américain, plan-rapproché, gros-plan, insert-détail, pov-subjectif, over-the-shoulder, two-shot, birds-eye, worms-eye, symétrique, règle-des-tiers, cadre-dans-cadre, leading-lines, silhouette
eclairage : natural-light, golden-hour, blue-hour, midi-lumière-dure, nuit-low-light, contre-jour, backlight, studio, softbox, lumière-dure, fenêtre, feu-flamme, néon-led-coloré, high-key, low-key, practicals, haze-fumée, silhouette, sous-exposé-intentionnel
lieu : intérieur, extérieur, urbain, campagne, montagne, mer-plage, forêt, désert, château-domaine, loft-industriel, église, salle-réception, rooftop, studio, destination-international, jardin, sous-marin
saison_meteo : été, automne, hiver, printemps, soleil, nuageux, pluie, neige, brouillard, crépuscule
post_production : film-grain, light-leaks-flares, transitions-morphing, split-screen, texte-titrage, vfx-léger, color-grading-prononcé, lut-cinéma, letterbox-animé, glitch, double-exposition, slow-ramp
nb_sujets : solo, duo, groupe-moins-10, groupe-plus-10, foule, sans-sujet-humain
niveau_production : solo-one-man-band, petite-équipe-2-3, équipe-complète, production-cinéma
```

---

## 6. Contraintes invariables

- **ESM partout** — pas de `require()`
- **Modèle Claude** : `claude-sonnet-4-6`
- **Prompt caching** : `cache_control: { type: 'ephemeral', ttl: '1h' }` sur tout system prompt stable
- **Pas de prefill** sur structured outputs (interdit Sonnet 4.6)
- **Ne jamais exposer** `SUPABASE_SERVICE_KEY` ou `ANTHROPIC_API_KEY` côté client
- **Nommage** : `kebab-case.js` backend, `PascalCase.jsx` frontend

---

## 7. Artéfacts Figma

- **FigJam parcours** : [180 Degrés — Flux](https://www.figma.com/board/FfMEkOq5ZckDfGt5fLDeJf) — parcours user + parcours admin en flowchart
- **Design file écrans** : [180 Degrés — Écrans](https://www.figma.com/design/4l2a1WxO3MNO7Gjqxkg3Tr) — capture admin/curation + captures à compléter manuellement via toolbar Figma
