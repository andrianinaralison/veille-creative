# VeilleCreative — Documentation Technique
**Version**: 1.0 | **Date**: 3 avril 2026 | **Statut**: MVP Release 1

---

## 1. Stack Technique

### Frontend
| Couche | Technologie | Justification |
|--------|------------|---------------|
| Framework | React 19 | Déjà en place, composants réutilisables |
| Build tool | Vite 8 | Dev server rapide, HMR natif |
| Routing | React Router DOM v7 | SPA multi-pages |
| Styles | Tailwind CSS | Design system variables déjà configurées |
| State | Zustand | Léger, sans boilerplate — remplace les mocks |
| PDF export | react-pdf / html2canvas | Rendu client-side du moodboard |
| Icons | Lucide React | Déjà intégré |

### Backend
| Couche | Technologie | Justification |
|--------|------------|---------------|
| Runtime | Node.js 22 (Express) | Cohérence JS full-stack |
| ORM | Prisma | Migrations, typage, schéma déclaratif |
| Base de données | PostgreSQL 16 | Requêtes JSON, full-text search natif |
| Auth | JWT (jose) + bcrypt | Stateless, mobile-ready |
| File storage | Supabase Storage ou S3 | Thumbnails + exports PDF |
| CDN | Cloudflare R2 | Servir les thumbnails statiques |
| Email | Resend | Simple API, templates React Email |
| Queue | BullMQ + Redis | Jobs d'ingestion asynchrones |

### Pipeline Data
| Couche | Technologie | Justification |
|--------|------------|---------------|
| Langage | Python 3.12 | Bibliothèques data/scraping matures |
| YouTube | YouTube Data API v3 | Déjà opérationnel, priorité 1 |
| Vimeo | Vimeo API v3.4 | Priorité 2 — à tester |
| Instagram | Embed public (dégradé) | Thumbnail + lien externe uniquement |
| Scheduler | APScheduler ou cron | Ingestion quotidienne |
| Normalisation | Pydantic | Validation du schéma avant import BDD |

### IA
| Couche | Technologie | Justification |
|--------|------------|---------------|
| Smart search | Claude API (claude-sonnet-4-6) | Compréhension brief → filtres sur BDD |
| Classification | MVP : règles + tags manuels | ML différé à R5/R6 |

### Infra / DevOps
| Couche | Technologie |
|--------|------------|
| Hébergement frontend | Vercel |
| Hébergement backend | Railway ou Render |
| CI/CD | GitHub Actions |
| Variables d'env | `.env` + secrets GitHub |

---

## 2. Modèle Conceptuel Relationnel (MCR)

### Schéma entité-relation

```
users
  └──< projects (1 user → N projets)
  └──< user_saves (1 user → N références sauvegardées)
  └──< digest_reads (1 user → N lectures de digest)

projects
  └──< moodboards (1 projet → 1 moodboard)

moodboards
  └──< moodboard_items (1 moodboard → N références positionnées)

references (catalogue global, ingéré par le pipeline)
  └──< user_saves
  └──< moodboard_items
  └──< digest_items

digests
  └──< digest_sections
       └──< digest_items

tags (taxonomie centralisée)
  └──< reference_tags (M:N entre references et tags)
```

---

### Tables

#### `users`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
email         TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL
display_name  TEXT
specialization TEXT[] -- ['mariage', 'corporate', 'evenementiel', 'ads', 'doc', 'short']
created_at    TIMESTAMPTZ DEFAULT now()
updated_at    TIMESTAMPTZ DEFAULT now()
```

#### `projects`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
title       TEXT NOT NULL
client_name TEXT
brief       TEXT
deadline    DATE
status      TEXT DEFAULT 'active' -- 'active' | 'archived'
created_at  TIMESTAMPTZ DEFAULT now()
updated_at  TIMESTAMPTZ DEFAULT now()
```

#### `references`
> Catalogue global alimenté par le pipeline data. Non modifiable par les users.

```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
external_id   TEXT UNIQUE NOT NULL -- ID YouTube/Vimeo
platform      TEXT NOT NULL -- 'youtube' | 'vimeo' | 'instagram' | 'website'
title         TEXT NOT NULL
author        TEXT
thumbnail_url TEXT
source_url    TEXT NOT NULL
description   TEXT -- scrapée depuis la source
duration_sec  INT
view_count    INT
is_active     BOOLEAN DEFAULT true
ingested_at   TIMESTAMPTZ DEFAULT now()
updated_at    TIMESTAMPTZ DEFAULT now()
```

#### `tags`
> Taxonomie centralisée v3 — issue de la session du 3 avril 2026 + benchmark Shotdeck / Frameset.

```sql
id         UUID PRIMARY KEY DEFAULT gen_random_uuid()
slug       TEXT UNIQUE NOT NULL  -- ex: 'sony-fx3', 'slow-motion', 'golden-hour'
label      TEXT NOT NULL         -- ex: 'Sony FX3'
category   TEXT NOT NULL         -- voir enum ci-dessous
layer      TEXT NOT NULL         -- 'L1' | 'L2' | 'L3' (source d'enrichissement)
is_chip    BOOLEAN DEFAULT false  -- affiché dans la modale (artistique)
is_filter  BOOLEAN DEFAULT true   -- disponible dans le panneau filtre
```

---

### Taxonomie complète des tags

#### Affichage
- **Cartes galerie** : aucun chip affiché — expérience visuelle pure
- **Modale** : 3–4 chips max, catégories artistiques uniquement (`is_chip = true`)
- **Panneau filtre** : toutes catégories techniques + structurantes (`is_filter = true`)

---

#### CHIPS — Catégories artistiques / subjectives (`is_chip = true`, L2 curation)

**`ambiance`**
Cinématique · Épuré · Dramatique · Romantique · Luxe · Intime · Mélancolique · Nostalgique · Épique · Mystérieux · Joyeux · Poétique · Élégant · Sombre · Énergique · Rêveur · Brut · Sensuel · Sérieux · Authentique

**`colorimetrie`**
Chaud · Froid · Teal & Orange · Désaturé · Contrasté · Pastel · Monochrome · Film grain · Vintage · Moody dark · Natural light · High key · Low key · Rose tinted · Vert / Forêt · Sépia

**`narration`**
Émotionnel · Rythmé · Beat-sync · Contemplatif · Documentaire · Voix off · Non-linéaire · Poétique · Flashback · Jump cuts · Long takes · Slow burn · Punch cuts · Transitions créatives

**`format_image`** *(chip + filtre)*
16:9 · 2.35:1 Scope · 2.39:1 Ultra Scope · 1.85:1 · Open Gate · 4:3 · 1:1 Carré · 9:16 Vertical · 6:5 · Super 8 / 16mm

---

#### FILTRES PANNEAU — Catégories techniques / structurantes (`is_filter = true`)

**`type_contenu`** — filtre structurant, L2 curation
Mariage · Corporate · Événementiel · Publicité / Ads · Documentaire · Court métrage · Clip musical · Portrait · Fashion / Lifestyle · Sport / Action · Gastronomie · Immobilier · Travel / Voyage · Nature · Engagement / Couple

**`camera`** — L1 pipeline (titre/description source)
Sony FX3 · Sony FX6 · Sony FX9 · Sony A7S III · Sony A1 · Sony ZV-E1 · Canon EOS C70 · Canon EOS C300 III · Canon R5C · Blackmagic Pocket 4K · Blackmagic Pocket 6K · Blackmagic URSA Mini · Lumix S5 II · Lumix S1H · RED Komodo · RED Monstro · ARRI Alexa · DJI Ronin 4D · iPhone / Smartphone · GoPro / Action cam

**`optique`** — L2 curation / L3 user (R5+)
Anamorphique · Sphérique · Prime · Zoom · Macro · Grand angle · Téléobjectif · Vintage dézoomé · Tilt-shift · Fisheye

**`focale`** — L3 user (R5+)
14mm · 24mm · 28mm · 35mm · 50mm · 85mm · 100mm · 135mm · 200mm+

**`technique_tournage`** — L2 curation
Handheld · Gimbal / Stabilisé · Trépied · Drone / Aérien · FPV · Steadicam · Slider · Jib / Grue · Sous-marin · Caméra embarquée · Macro · Timelapse · Hyperlapse · Slow motion · Double exposition · Tilt-shift · 360°

**`mouvement_camera`** — L2 curation
Statique · Panoramique · Travelling avant · Travelling arrière · Travelling latéral · Push in · Pull out · Rotation · Plongée · Contre-plongée · Dutch angle · Low angle · High angle · Crane up · Crane down · Zoom optique · Dézoom

**`cadrage`** — L2 curation
Plan large · Plan d'ensemble · Plan moyen · Plan américain · Plan rapproché · Gros plan · Insert / Détail · POV subjectif · Over the shoulder · Two shot · Bird's eye · Worm's eye · Symétrique · Règle des tiers · Cadre dans le cadre · Leading lines · Silhouette

**`eclairage`** — L2 curation
Natural light · Golden hour · Blue hour · Midi / Lumière dure · Nuit / Low light · Contre-jour · Backlight · Studio · Softbox · Lumière dure · Fenêtre · Feu / Flamme · Néon / LED coloré · High key · Low key · Practicals · Haze / Fumée · Silhouette · Sous-exposé intentionnel

**`lieu`** — L1 pipeline + L2 curation
Intérieur · Extérieur · Urbain · Campagne · Montagne · Mer / Plage · Forêt · Désert · Château / Domaine · Loft / Industriel · Église · Salle de réception · Rooftop · Studio · Destination / International · Jardin · Sous-marin

**`saison_meteo`** — L2 curation
Été · Automne · Hiver · Printemps · Soleil · Nuageux · Pluie · Neige · Brouillard · Crépuscule

**`post_production`** — L2 curation
Film grain · Light leaks / Flares · Transitions morphing · Split screen · Texte / Titrage · VFX léger · Color grading prononcé · LUT cinéma · Letterbox animé · Glitch · Double exposition · Slow ramp

**`nb_sujets`** — L1 pipeline (détection future) / L2 curation MVP
Solo · Duo · Groupe < 10 · Groupe > 10 · Foule · Sans sujet humain

**`niveau_production`** — L2 curation
Solo / One man band · Petite équipe 2–3 · Équipe complète · Production cinéma

**`auteur`** — L1 pipeline (champ `author` de la source)
*(recherche texte libre — pas de valeurs fixes)*

---

#### MÉTADONNÉES INTERNES — jamais affichées, usage curation & scoring

| Champ BDD | Source | Usage |
|-----------|--------|-------|
| `view_count` | L1 pipeline | Scoring popularité, top trends |
| `like_count` | L1 pipeline | Qualité perçue |
| `comment_count` | L1 pipeline | Engagement |
| `published_at` | L1 pipeline | Détection tendances récentes |
| `duration_sec` | L1 pipeline | Slider durée |
| `platform` | L1 pipeline | Filtre technique interne |
| `description_raw` | L1 pipeline | Source pour extraction tags L1 |
| `search_history` | Comportemental | Personnalisation reco (R5+) |
| `save_count` | Agrégé | Popularité interne VeilleCreative |
- `narration` — émotionnel, rythmé, documentaire, poétique

#### `reference_tags`
```sql
reference_id UUID REFERENCES references(id) ON DELETE CASCADE
tag_id       UUID REFERENCES tags(id) ON DELETE CASCADE
PRIMARY KEY (reference_id, tag_id)
```

#### `user_saves`
> Bibliothèque personnelle d'un user — une référence sauvegardée avec son contexte.

```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
reference_id UUID NOT NULL REFERENCES references(id)
project_id   UUID REFERENCES projects(id) ON DELETE SET NULL
context_note TEXT   -- note contextuelle auto-générée ou saisie
custom_tags  TEXT[] -- tags ajoutés manuellement par le user (max 5)
saved_at     TIMESTAMPTZ DEFAULT now()
UNIQUE (user_id, reference_id)
```

#### `moodboards`
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id   UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE
user_id      UUID NOT NULL REFERENCES users(id)
layout_type  TEXT DEFAULT 'grid' -- 'grid' | 'narrative' | 'color'
share_token  TEXT UNIQUE  -- slug public pour partage read-only
share_expires_at TIMESTAMPTZ
created_at   TIMESTAMPTZ DEFAULT now()
updated_at   TIMESTAMPTZ DEFAULT now()
```

#### `moodboard_items`
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
moodboard_id UUID NOT NULL REFERENCES moodboards(id) ON DELETE CASCADE
reference_id UUID NOT NULL REFERENCES references(id)
position     INT NOT NULL -- ordre dans le layout
created_at   TIMESTAMPTZ DEFAULT now()
UNIQUE (moodboard_id, reference_id)
```

#### `digests`
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
title        TEXT NOT NULL
slug         TEXT UNIQUE NOT NULL
published_at TIMESTAMPTZ
is_published BOOLEAN DEFAULT false
created_at   TIMESTAMPTZ DEFAULT now()
```

#### `digest_sections`
```sql
id        UUID PRIMARY KEY DEFAULT gen_random_uuid()
digest_id UUID NOT NULL REFERENCES digests(id) ON DELETE CASCADE
title     TEXT NOT NULL  -- ex: 'Couleur', 'Format', 'Narrative', 'Tendance'
theme     TEXT
position  INT NOT NULL
```

#### `digest_items`
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
section_id   UUID NOT NULL REFERENCES digest_sections(id) ON DELETE CASCADE
reference_id UUID NOT NULL REFERENCES references(id)
editorial_note TEXT -- contexte créatif rédigé pour ce digest
position     INT NOT NULL
```

#### `digest_reads`
> Tracking lecture digest par user (pour calcul rétention).

```sql
id        UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
digest_id UUID NOT NULL REFERENCES digests(id)
read_at   TIMESTAMPTZ DEFAULT now()
UNIQUE (user_id, digest_id)
```

---

## 3. API REST

**Base URL** : `/api/v1`
**Auth** : Bearer JWT dans le header `Authorization`
**Format** : JSON

---

### Auth

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/auth/signup` | Créer un compte | Non |
| POST | `/auth/login` | Obtenir un JWT | Non |
| POST | `/auth/logout` | Invalider le token | Oui |
| GET | `/auth/me` | Profil utilisateur courant | Oui |

#### `POST /auth/signup`
```json
// Request
{ "email": "alex@studio.fr", "password": "...", "display_name": "Alex", "specialization": ["mariage"] }

// Response 201
{ "token": "eyJ...", "user": { "id": "uuid", "email": "...", "display_name": "..." } }
```

#### `POST /auth/login`
```json
// Request
{ "email": "alex@studio.fr", "password": "..." }

// Response 200
{ "token": "eyJ...", "user": { ... } }
```

---

### References (catalogue global)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/references` | Liste filtrée + paginée | Oui |
| GET | `/references/:id` | Détail d'une référence | Oui |

#### `GET /references`
**Query params** :
- `tags` — slug de tags séparés par virgule : `?tags=sony-fx3,slow-motion`
- `platform` — `youtube | vimeo | instagram`
- `mood` — ex: `romantique`
- `q` — full-text search sur titre/description
- `page` — défaut `1`
- `limit` — défaut `24`, max `100`

```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "title": "Cinematic Wedding Film...",
      "platform": "youtube",
      "author": "Adel Wed Films",
      "thumbnail_url": "https://cdn.veillecreative.com/thumbs/...",
      "source_url": "https://youtube.com/watch?v=...",
      "tags": [{ "slug": "sony-fx3", "label": "Sony FX3", "category": "camera" }],
      "is_saved": true,      // contextualisé à l'utilisateur courant
      "saved_project_id": "uuid-or-null"
    }
  ],
  "meta": { "page": 1, "limit": 24, "total": 312 }
}
```

---

### Library (références sauvegardées par le user)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/library` | Bibliothèque du user connecté | Oui |
| POST | `/library` | Sauvegarder une référence | Oui |
| PATCH | `/library/:save_id` | Modifier contexte ou tags | Oui |
| DELETE | `/library/:save_id` | Supprimer de la bibliothèque | Oui |

#### `POST /library`
```json
// Request
{
  "reference_id": "uuid",
  "project_id": "uuid-or-null",
  "context_note": "Pour le plan d'ouverture",
  "custom_tags": ["émotion", "golden-hour"]
}

// Response 201
{ "id": "uuid", "reference_id": "uuid", "saved_at": "2026-04-03T..." }
```

---

### Projects

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/projects` | Liste des projets du user | Oui |
| POST | `/projects` | Créer un projet | Oui |
| GET | `/projects/:id` | Détail + références liées | Oui |
| PATCH | `/projects/:id` | Modifier brief/titre/deadline | Oui |
| DELETE | `/projects/:id` | Archiver un projet | Oui |

#### `POST /projects`
```json
// Request
{
  "title": "Mariage Dupont — Été 2026",
  "client_name": "Sophie & Thomas Dupont",
  "brief": "Film cinématique, style Golden Hour, 5 min, ambiance romantique et épurée",
  "deadline": "2026-07-15"
}

// Response 201
{ "id": "uuid", "title": "...", "created_at": "..." }
```

---

### Moodboards

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/projects/:id/moodboard` | Récupérer le moodboard | Oui |
| POST | `/projects/:id/moodboard` | Créer le moodboard | Oui |
| PATCH | `/moodboards/:id` | Modifier layout ou items | Oui |
| POST | `/moodboards/:id/items` | Ajouter une référence | Oui |
| DELETE | `/moodboards/:id/items/:item_id` | Retirer une référence | Oui |
| POST | `/moodboards/:id/share` | Générer un lien partageable (48h) | Oui |
| GET | `/share/:token` | Viewer read-only (public) | Non |
| POST | `/moodboards/:id/export` | Générer le PDF | Oui |

#### `POST /moodboards/:id/share`
```json
// Response 200
{
  "share_url": "https://veillecreative.com/share/abc123xyz",
  "expires_at": "2026-04-05T18:00:00Z"
}
```

#### `POST /moodboards/:id/export`
```json
// Response 200
{ "pdf_url": "https://cdn.veillecreative.com/exports/moodboard-abc123.pdf" }
```

---

### Smart Search (IA)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/search` | Requête libre ou brief client → filtres IA | Oui |

#### `POST /search`
```json
// Request
{
  "query": "je cherche des références pour un mariage en extérieur, style cinématique, lumière dorée, Sony FX3"
}

// Response 200
{
  "mode": "brief",          // 'brief' | 'search' (détection automatique)
  "filters_applied": {
    "tags": ["sony-fx3", "golden-hour", "mariage", "cinématique"],
    "mood": "romantique"
  },
  "results": [ /* même format que GET /references */ ]
}
```

**Logique** : Claude API reçoit le texte + la taxonomie des tags → extrait les filtres → requête SQL sur la BDD existante. Pas de recherche à la volée.

---

### Digests

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/digests/latest` | Digest le plus récent publié | Oui |
| GET | `/digests/:id` | Un digest par ID | Oui |
| POST | `/digests/:id/read` | Marquer comme lu | Oui |

---

### Pipeline (interne / admin)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/admin/ingest` | Lancer une ingestion manuelle | Admin token |

```json
// Request
{
  "source": "youtube",
  "keywords": ["cinematic wedding film sony fx3", "corporate aftermovie 4k"],
  "max_results": 50
}
```

---

## 4. Variables d'environnement

```env
# Base
DATABASE_URL=postgresql://user:pass@host:5432/veillecreative
JWT_SECRET=...
JWT_EXPIRES_IN=7d

# Storage
S3_BUCKET=...
S3_REGION=...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
CDN_BASE_URL=https://cdn.veillecreative.com

# APIs externes
YOUTUBE_API_KEY=...
VIMEO_ACCESS_TOKEN=...
ANTHROPIC_API_KEY=...

# Email
RESEND_API_KEY=...
EMAIL_FROM=digest@veillecreative.com

# Queue
REDIS_URL=redis://...

# App
FRONTEND_URL=https://veillecreative.com
```

---

## 5. Décisions d'architecture ouvertes

| # | Décision | Options | Bloquant |
|---|----------|---------|---------|
| D1 | Taxonomie des tags | Voir session 1er avril 2026 | Oui — bloque pipeline + search |
| D2 | PDF : client-side vs server-side | html2canvas (client) vs Puppeteer (server) | Non |
| D3 | Digest : universel vs personnalisé | Universel MVP, personnalisé R2 | Non |
| D4 | Export moodboard : Discovery (gratuit) vs Pro | Impact taux conversion | Non |
| D5 | Vimeo API accessible ? | À tester avant de builder le connecteur | Pipeline |

---

## 6. Migrations prioritaires avant bêta

```
1. Setup PostgreSQL + Prisma schema
2. Migrer mockData.js → seed SQL (références + tags)
3. Auth (signup/login/me)
4. CRUD Projects
5. Library (save/unsave)
6. Moodboard + export PDF
7. Smart Search (Claude API)
8. Pipeline ingestion YouTube
```
