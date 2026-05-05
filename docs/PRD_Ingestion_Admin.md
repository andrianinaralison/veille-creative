# PRD — Feature Ingestion Admin (Réf. ING-v1)
**180 Degrés — Plateforme de veille créative pour vidéastes indépendants**

> **Statut :** Draft v1.0  
> **Date :** 2026-05-05  
> **Auteur :** Andri (PM + fondateur)  
> **Stack :** React 19 + Vite + Tailwind · Node.js 22 + Express · Prisma + PostgreSQL · Claude API · Supabase Storage

---

## 1. Executive Summary

Aujourd'hui, alimenter la bibliothèque de références de 180 Degrés est un processus entièrement manuel : l'admin dialogue avec Claude dans un IDE, copie-colle des listes Markdown, exécute des scripts Python locaux pour les thumbnails, et code les références directement dans un fichier `mockData.js`. Ce processus ne se scale pas, produit des données non persistantes, et nécessite un environnement de développement pour la moindre mise à jour de contenu.

Nous construisons une **interface admin intégrée à la plateforme**, propulsée par un agent Claude (API Anthropic), qui permet en quelques clics et prompts de découvrir, enrichir, valider et publier des références vidéo depuis YouTube, Vimeo et des portfolios web — avec persistance réelle en base de données (Prisma + PostgreSQL) et stockage des thumbnails sur Supabase Storage. Objectif : réduire le temps de production d'un batch de 20 références de 3 heures à moins de 15 minutes.

---

## 2. Problem Statement

### Qui a ce problème ?
L'admin de 180 Degrés (Andri, fondateur) — seule personne qui alimente actuellement le contenu de la bibliothèque.

### Quel est le problème ?
Le processus d'ingestion de références est 100% artisanal, fragmenté en 6 étapes manuelles qui exigent un IDE, des scripts locaux, et une connaissance technique du code. Il est impossible à déléguer, non reproductible, et ses résultats ne sont pas persistants.

### Pourquoi c'est douloureux ?

**Impact opérationnel :**
- 3h+ pour produire 20 références (brief → Markdown → thumbnails → mockData.js → deploy)
- Zéro traçabilité : si on ferme l'IDE, les résultats d'une session sont perdus
- Impossible à faire tourner sans Claude Code installé localement
- Toute modification de contenu exige un redéploiement Vercel complet
- Le fichier `mockData.js` dépasse 1000 lignes et devient ingérable

**Impact produit :**
- La bibliothèque ne peut pas atteindre 200–500 refs/mois avec ce process
- L'absence de workflow draft → published empêche toute validation éditoriale
- Les données mock (sans BDD) bloquent la construction du smart search réel

### Processus actuel — les 6 étapes manuelles

```
1. Brief Claude dans l'IDE → liste .md (URLs potentiellement fausses)
2. Vérification manuelle des URLs sur YouTube
3. Script Python local pour télécharger les thumbnails
4. Copier dans /public/thumbnails/ et renommer
5. Coder chaque référence à la main dans mockData.js (tags, mood, context)
6. npm run build + deploy Vercel pour mettre en ligne
```

---

## 3. Target Users & Personas

### Persona principale : l'Admin (Andri)

- **Rôle :** Fondateur + PM + curateur éditorial de 180 Degrés
- **Profil technique :** Dev full-stack, à l'aise avec l'API, mais cherche à sortir le contenu du code
- **Objectif :** Alimenter la bibliothèque en contenu de qualité, rapidement, sans passer par l'IDE
- **Comportement actuel :** Passe 3h+ par session pour produire une vingtaine de refs — insatisfaisant
- **Contrainte :** Volume cible de 200–500 références/mois avec qualité éditoriale maintenue

### Persona secondaire (Phase 2) : le Curateur délégué
Un collaborateur ou freelance qui gère la curation sans accès au code — l'interface doit être utilisable sans compétences techniques.

---

## 4. Strategic Context

### Pourquoi maintenant ?

1. **Blocage produit :** Le `mockData.js` plafonne à ~110 références gérables. Au-delà, la maintenance devient impossible. La bibliothèque ne peut pas croître sans BDD réelle.
2. **Prérequis pour la monétisation :** Les abonnés à 39€/mois attendent un flux continu de nouvelles références. Impossible à tenir manuellement.
3. **Enabler du smart search :** Le smart search Claude (déjà développé) retourne aujourd'hui `results: []` faute de données réelles. Cette feature débloque la boucle complète.
4. **API Console disponible :** Le compte Anthropic Console est actif, l'API key est déjà configurée dans le `.env`. Zéro friction pour démarrer.

### Lien avec les métriques north star

- **Digest read-through ≥ 55%** → dépend d'un contenu riche et varié → nécessite 200+ refs fraîches/mois
- **Moodboards partagés ≥ 60%** → nécessite une bibliothèque suffisamment large pour constituer des boards intéressants

---

## 5. Solution Overview

### Vision en une phrase
Un espace admin intégré à la plateforme où l'admin soumet un brief ou une liste de créateurs, où un agent Claude orchestre la découverte et l'enrichissement des références, et où l'admin valide, édite et publie le tout en quelques clics — sans jamais ouvrir un IDE.

### Les 2 modes de découverte

**Mode A — Topic Discovery**
L'admin décrit un brief thématique (type de contenu, caméra, ambiance, nombre de résultats). L'agent Claude génère des requêtes de recherche optimisées, appelle YouTube Data API v3 ou Vimeo API pour obtenir des vidéos réelles, enrichit chaque résultat avec la taxonomie 180 Degrés (tags, mood, contexte éditorial), et sauvegarde en BDD en statut `draft`.

**Mode B — Creator Scan**
L'admin fournit une liste de créateurs avec leurs URLs (chaîne YouTube, profil Vimeo, ou site portfolio). L'agent détecte automatiquement le type de source et récupère toutes les vidéos du créateur via l'API appropriée. Pour les portfolios web, il scrappe la page à la recherche d'iframes YouTube/Vimeo embarquées. Même enrichissement qu'en Mode A ensuite.

### Pipeline partagé (après découverte)
```
URL vidéo réelle
  → fetch métadonnées complètes (titre, description, chaîne, durée, vues)
  → download thumbnail → Supabase Storage
  → Claude auto-tag (taxonomie 180 Degrés : tags, mood, type_contenu, contexte)
  → INSERT Prisma (status: draft)
```

### Interface admin

**Page `/admin/ingestion`**
- Onglet "Topic Discovery" : formulaire de brief + paramètres + grille de résultats
- Onglet "Creator Scan" : tableau de créateurs (nom + URL) + bouton lancer

**Page `/admin/references`**
- Liste de toutes les références (filtrables par status, type, source)
- Actions : éditer tags/mood/contexte, approuver, rejeter, publier en batch

---

## 6. Success Metrics

### Métrique primaire
**Temps de production d'un batch de 20 références**
- Actuel : ~180 minutes
- Cible : ≤ 15 minutes (hors review éditoriale)
- Mesure : timestamp début du run agent → dernière référence en `published`

### Métriques secondaires
- **Taux d'approbation des drafts :** % de refs générées qui passent en `published` (cible : ≥ 70%)
- **Volume mensuel :** Références publiées/mois (cible : 200+ dès le 2e mois)
- **Zéro déploiement nécessaire :** 100% des publications se font sans `npm run build`
- **Couverture sources :** YouTube + Vimeo + portfolios web opérationnels

### Métriques de garde-fou
- **Qualité tags :** Taux de correction manuelle des tags suggérés par Claude (doit rester < 30%)
- **Coût API Anthropic :** Budget ≤ 30€/mois pour 500 refs (calibrage max_tokens + prompt caching)

---

## 7. User Story Map

### Segment : Admin de plateforme de veille créative
### Persona : Andri — fondateur, curateur, développeur
### Narrative : Découvrir, enrichir et publier un batch de références vidéo de qualité, de la première idée à la mise en ligne, sans quitter la plateforme

---

### Backbone (Activités)

```
A1. Configurer la session    A2. Découvrir les refs    A3. Enrichir & valider    A4. Publier    A5. Piloter
d'ingestion                 via l'agent                les drafts                              le pipeline
```

---

### A1 — Configurer la session d'ingestion

**Steps :**
- S1.1 : Choisir le mode de découverte (Topic ou Creator)
- S1.2 : Saisir les paramètres du brief / la liste de créateurs
- S1.3 : Lancer l'agent

**Tasks — Release 1 (MVP) :**
- [ ] Accéder à `/admin/ingestion` (auth guard ADMIN)
- [ ] Sélectionner le mode via onglets (Topic / Creator)
- [ ] En mode Topic : remplir type_contenu, caméra, ambiance, nb_résultats, source (YouTube/Vimeo)
- [ ] En mode Creator : ajouter des créateurs via un tableau (nom + URL)
- [ ] Valider et déclencher le run agent (bouton "Lancer")
- [ ] Voir un indicateur de progression temps réel (spinner + "X refs trouvées...")

**Tasks — Release 2 :**
- [ ] Sauvegarder un brief fréquent comme "template réutilisable"
- [ ] Planifier un run automatique hebdomadaire par type de contenu

---

### A2 — Découvrir les références via l'agent

**Steps :**
- S2.1 : L'agent génère les requêtes de recherche (Topic) / détecte les sources (Creator)
- S2.2 : Les APIs externes retournent des résultats réels
- S2.3 : L'agent filtre les hors-sujet et déduplique

**Tasks — Release 1 (MVP) :**
- [ ] Agent génère 3–5 requêtes YouTube optimisées depuis le brief (Mode Topic)
- [ ] Agent appelle YouTube Data API v3 (`search.list`) avec les requêtes
- [ ] Agent appelle `videos.list` pour les métadonnées complètes (description, durée, chaîne)
- [ ] Agent appelle Vimeo API `/videos` pour les résultats Vimeo
- [ ] Déduplication : skip si URL déjà en BDD (`prisma.reference.findUnique`)
- [ ] Agent filtre les vidéos manifestement hors-sujet avant d'enrichir

**Tasks — Release 2 :**
- [ ] Mode Creator : détection auto du type d'URL (chaîne YT / profil Vimeo / site web)
- [ ] Mode Creator : récupération de toutes les vidéos d'une chaîne (`playlistItems`)
- [ ] Mode Creator : scraping de portfolios web (détection iframes YT/Vimeo)
- [ ] Gestion des quotas API (retry + backoff si limite YouTube atteinte)

---

### A3 — Enrichir & valider les drafts

**Steps :**
- S3.1 : Claude auto-tag chaque référence (taxonomie 180 Degrés)
- S3.2 : Thumbnail téléchargée et stockée sur Supabase
- S3.3 : Admin review la grille de résultats
- S3.4 : Admin édite les champs incorrects ou incomplets

**Tasks — Release 1 (MVP) :**
- [ ] Claude applique la taxonomie (tags[], mood, type_contenu, contexte éditorial)
- [ ] Thumbnail téléchargée depuis YouTube CDN (maxresdefault → hqdefault fallback)
- [ ] Thumbnail uploadée dans Supabase Storage (`refs/{platform}/{videoId}.jpg`)
- [ ] `thumbnail_url` publique CDN stockée en BDD
- [ ] Grille de résultats : afficher thumbnail + titre + chaîne + tags + mood
- [ ] Édition inline des tags (chips éditables) sans rechargement
- [ ] Édition inline du mood, du contexte (textarea)
- [ ] Champs chaîne et URL chaîne affichés et éditables

**Tasks — Release 2 :**
- [ ] Voir un score de confiance Claude sur les tags suggérés
- [ ] Comparer avec des références déjà publiées similaires
- [ ] Édition batch : appliquer le même tag à plusieurs refs sélectionnées

---

### A4 — Publier les références

**Steps :**
- S4.1 : Sélectionner les drafts validés
- S4.2 : Passer en `published`
- S4.3 : Vérifier disponibilité sur la plateforme

**Tasks — Release 1 (MVP) :**
- [ ] Vue `/admin/references` avec liste filtrée par status (draft / published / rejected)
- [ ] Action "Publier" unitaire sur une référence (PATCH status → published)
- [ ] Action "Rejeter" unitaire (PATCH status → rejected)
- [ ] Publication batch : checkbox "Tout sélectionner" + bouton "Publier (N)"
- [ ] Les références publiées apparaissent immédiatement sur `/library` sans redéploiement
- [ ] Toast de confirmation : "12 références publiées"

**Tasks — Release 2 :**
- [ ] Planification de publication différée (publish_at dans le futur)
- [ ] Notification email récap hebdomadaire du contenu publié

---

### A5 — Piloter le pipeline

**Steps :**
- S5.1 : Consulter l'historique des sessions d'ingestion
- S5.2 : Suivre les métriques (coûts API, taux d'approbation, volume)
- S5.3 : Gérer les créateurs suivis

**Tasks — Release 2 :**
- [ ] Tableau de bord ingestion : nb refs/semaine, taux approbation, sources actives
- [ ] Historique des sessions (table `ingestion_sessions`) : date, mode, nb trouvées/sauvées/rejetées
- [ ] Coût tokens estimé par session (usage API loggé)
- [ ] Table creators : ajouter/supprimer des créateurs à surveiller
- [ ] Alertes si quotas API YouTube proches

---

## 8. Architecture Technique Complète

### 8.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (React 19 + Vite + Tailwind)                      │
│  /admin/ingestion  ·  /admin/references  ·  /library        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP REST
┌──────────────────────────▼──────────────────────────────────┐
│  BACKEND (Node.js 22 + Express)                             │
│                                                             │
│  Routes:                                                    │
│  POST /api/v1/admin/ingestion/topic                         │
│  POST /api/v1/admin/ingestion/creators                      │
│  GET  /api/v1/admin/references                              │
│  PATCH /api/v1/admin/references/:id                         │
│  POST /api/v1/admin/references (import manuel)              │
│  GET  /api/v1/references (public, abonnés)                  │
│                                                             │
│  Services:                                                  │
│  ingestion.service.js  ←── Agent Claude (tool use)          │
│  youtube.service.js    ←── YouTube Data API v3              │
│  vimeo.service.js      ←── Vimeo API                        │
│  web-scraper.service.js←── Fetch + cheerio (portfolios)     │
│  thumbnail.service.js  ←── Download + Supabase Storage      │
│  search.service.js     ←── Existant (smart search)          │
└──────┬───────────────┬──────────────┬───────────────────────┘
       │               │              │
┌──────▼──────┐  ┌─────▼──────┐  ┌───▼───────────────────────┐
│  PostgreSQL  │  │  Anthropic │  │  External APIs            │
│  (Prisma)    │  │  Claude API│  │  YouTube Data API v3      │
│  Railway     │  │  Sonnet 4.6│  │  Vimeo API                │
└─────────────┘  └────────────┘  │  Supabase Storage (CDN)   │
                                 └───────────────────────────┘
```

---

### 8.2 Schema Prisma complet

```prisma
// prisma/schema.prisma

model Reference {
  id                    String   @id @default(cuid())
  
  // Identité & source
  url                   String   @unique
  platform              Platform
  sourceMode            SourceMode @default(MANUAL)
  sourceQuery           String?  // Brief ou URL créateur à l'origine
  ingestionSessionId    String?
  ingestionSession      IngestionSession? @relation(fields: [ingestionSessionId], references: [id])
  
  // Métadonnées vidéo
  title                 String
  description           String   @db.Text
  durationSeconds       Int?
  viewCount             Int?
  videoPublishedAt      DateTime?
  
  // Chaîne / Créateur
  channelName           String
  channelUrl            String
  channelAvatar         String?
  creatorId             String?
  creator               Creator? @relation(fields: [creatorId], references: [id])
  
  // Thumbnail (Supabase Storage)
  thumbnailUrl          String   // URL publique CDN Supabase
  thumbnailSourceUrl    String?  // URL d'origine YouTube/Vimeo (fallback)
  thumbnailStorageKey   String?  // Clé dans le bucket (pour suppression)
  
  // Contenu éditorial (Claude)
  tags                  String[] // Slugs taxonomie 180 Degrés
  mood                  String?
  typeContenu           String?
  context               String   @db.Text @default("")
  
  // Workflow
  status                RefStatus @default(DRAFT)
  
  // Timestamps
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  publishedAt           DateTime?
  
  @@index([status])
  @@index([platform])
  @@index([typeContenu])
  @@index([mood])
}

model IngestionSession {
  id            String     @id @default(cuid())
  mode          SourceMode
  briefOrUrls   String     @db.Text  // JSON du brief ou liste URLs créateurs
  
  // Statistiques du run
  totalFound    Int        @default(0)
  totalSaved    Int        @default(0)
  totalSkipped  Int        @default(0) // doublons
  totalRejected Int        @default(0) // filtrés par Claude
  
  // Coût API (monitoring)
  inputTokens   Int        @default(0)
  outputTokens  Int        @default(0)
  cacheReadTokens Int      @default(0)
  
  status        SessionStatus @default(RUNNING)
  createdAt     DateTime   @default(now())
  completedAt   DateTime?
  
  references    Reference[]
}

model Creator {
  id              String   @id @default(cuid())
  name            String
  portfolioUrl    String?  // Site web
  youtubeChannelId String?
  vimeoUserId     String?
  
  references      Reference[]
  
  createdAt       DateTime @default(now())
}

enum Platform {
  YOUTUBE
  VIMEO
  WEB
}

enum SourceMode {
  TOPIC_DISCOVERY
  CREATOR_SCAN
  MANUAL
}

enum RefStatus {
  DRAFT
  PUBLISHED
  REJECTED
}

enum SessionStatus {
  RUNNING
  COMPLETED
  FAILED
}
```

---

### 8.3 Architecture des services backend

#### `youtube.service.js`
```javascript
// server/src/services/youtube.service.js
export async function searchVideos(query, maxResults = 10) {
  // GET https://www.googleapis.com/youtube/v3/search
  // ?part=snippet&q={query}&type=video&maxResults={n}&key={API_KEY}
  // Retourne : [{ videoId, title, channelTitle, channelId, publishedAt, thumbnailUrl }]
}

export async function fetchVideoDetails(videoId) {
  // GET https://www.googleapis.com/youtube/v3/videos
  // ?part=snippet,contentDetails,statistics&id={videoId}
  // Retourne : { description, durationISO, viewCount, channelUrl }
}

export async function getChannelVideos(channelId, maxResults = 50) {
  // GET https://www.googleapis.com/youtube/v3/playlistItems
  // via uploads playlist du channel
  // Mode Creator Scan
}
```

#### `vimeo.service.js`
```javascript
// server/src/services/vimeo.service.js
export async function fetchVideoByUrl(url) {
  // oEmbed : GET https://vimeo.com/api/oembed.json?url={url}
  // + API : GET https://api.vimeo.com/videos/{id}
  // Retourne : { title, description, thumbnailUrl, channelName, channelUrl, duration }
}

export async function getUserVideos(profileUrl) {
  // GET https://api.vimeo.com/users/{user_id}/videos
  // Mode Creator Scan
}
```

#### `web-scraper.service.js`
```javascript
// server/src/services/web-scraper.service.js
import * as cheerio from 'cheerio';

export async function scrapePortfolio(url) {
  const html = await fetch(url).then(r => r.text());
  const $ = cheerio.load(html);
  
  const results = [];
  
  // Chercher les iframes YouTube embarquées
  $('iframe[src*="youtube.com/embed"]').each((_, el) => {
    const src = $(el).attr('src');
    const videoId = extractYouTubeId(src);
    if (videoId) results.push({ type: 'youtube', videoId });
  });
  
  // Chercher les iframes Vimeo embarquées
  $('iframe[src*="player.vimeo.com"]').each((_, el) => {
    const src = $(el).attr('src');
    const videoId = extractVimeoId(src);
    if (videoId) results.push({ type: 'vimeo', videoId });
  });
  
  // Open Graph fallback pour la page elle-même
  const ogVideo = $('meta[property="og:video"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content');
  
  return { embeds: results, ogImage };
}
```

#### `thumbnail.service.js`
```javascript
// server/src/services/thumbnail.service.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export async function downloadAndStore(sourceUrl, platform, videoId) {
  // 1. Fetch de la thumbnail (avec fallback qualité)
  let buffer;
  if (platform === 'youtube') {
    // Essaie maxresdefault → hqdefault → mqdefault
    buffer = await fetchWithFallback([
      `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    ]);
  } else {
    buffer = await fetch(sourceUrl).then(r => r.arrayBuffer());
  }
  
  // 2. Upload Supabase Storage
  const key = `refs/${platform}/${videoId}.jpg`;
  await supabase.storage.from('thumbnails').upload(key, buffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  
  // 3. URL publique CDN
  const { data } = supabase.storage.from('thumbnails').getPublicUrl(key);
  return { url: data.publicUrl, key };
}
```

---

### 8.4 Architecture de l'agent Claude (Tool Use)

#### Pattern général — boucle agentic
```javascript
// server/src/services/ingestion.service.js
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// Déclaration des tools disponibles pour l'agent
const TOOLS = [
  {
    name: 'search_youtube',
    description: 'Cherche des vidéos YouTube par mots-clés. Retourne titre, chaîne, URL, thumbnail, vues.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Requête de recherche optimisée' },
        maxResults: { type: 'number', default: 10 }
      },
      required: ['query']
    }
  },
  {
    name: 'search_vimeo',
    description: 'Cherche des vidéos Vimeo par mots-clés.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        maxResults: { type: 'number', default: 10 }
      },
      required: ['query']
    }
  },
  {
    name: 'fetch_video_details',
    description: 'Récupère les métadonnées complètes d\'une vidéo (description complète, chaîne, durée, vues).',
    input_schema: {
      type: 'object',
      properties: {
        videoId: { type: 'string' },
        platform: { type: 'string', enum: ['youtube', 'vimeo'] }
      },
      required: ['videoId', 'platform']
    }
  },
  {
    name: 'save_reference',
    description: 'Sauvegarde une référence enrichie en base de données. Retourne "duplicate" si déjà en BDD.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        channelName: { type: 'string' },
        channelUrl: { type: 'string' },
        thumbnailSourceUrl: { type: 'string' },
        platform: { type: 'string', enum: ['youtube', 'vimeo', 'web'] },
        tags: { type: 'array', items: { type: 'string' } },
        mood: { type: 'string' },
        typeContenu: { type: 'string' },
        context: { type: 'string', description: 'Note éditoriale 2-3 phrases expliquant pourquoi cette ref est pertinente' }
      },
      required: ['url', 'title', 'channelName', 'channelUrl', 'tags', 'mood', 'typeContenu', 'context']
    }
  }
];

// Exécution des tools côté serveur Express
async function executeTool(name, input, sessionId) {
  switch (name) {
    case 'search_youtube':
      return await searchVideos(input.query, input.maxResults);
      
    case 'search_vimeo':
      return await searchVimeoVideos(input.query, input.maxResults);
      
    case 'fetch_video_details':
      if (input.platform === 'youtube') return await fetchVideoDetails(input.videoId);
      if (input.platform === 'vimeo') return await fetchVimeoVideoDetails(input.videoId);
      break;
      
    case 'save_reference': {
      // Check doublon
      const existing = await prisma.reference.findUnique({ where: { url: input.url } });
      if (existing) return { status: 'duplicate', id: existing.id };
      
      // Download + store thumbnail
      const videoId = extractVideoId(input.url, input.platform);
      const { url: thumbnailUrl, key } = await downloadAndStore(
        input.thumbnailSourceUrl, input.platform, videoId
      );
      
      // INSERT en BDD
      const ref = await prisma.reference.create({
        data: {
          ...input,
          thumbnailUrl,
          thumbnailStorageKey: key,
          status: 'DRAFT',
          ingestionSessionId: sessionId,
          sourceMode: 'TOPIC_DISCOVERY',
        }
      });
      return { status: 'saved', id: ref.id };
    }
  }
}

// Agent principal — Mode Topic Discovery
export async function runTopicDiscovery(brief, sessionId) {
  const systemPrompt = `Tu es l'agent d'ingestion de 180 Degrés, plateforme de veille créative pour vidéastes indépendants français.

Ton rôle : trouver des références vidéo YouTube/Vimeo de qualité selon le brief fourni, les enrichir avec la taxonomie 180 Degrés, et les sauvegarder en base de données.

TAXONOMIE 180 DEGRÉS (utilise uniquement ces slugs) :

## type_contenu
mariage, corporate, événementiel, publicité-ads, documentaire, court-métrage, clip-musical, portrait, fashion-lifestyle, sport-action, gastronomie, immobilier, travel-voyage, nature, engagement-couple

## mood (ambiance)
cinématique, épuré, dramatique, romantique, luxe, intime, mélancolique, nostalgique, épique, mystérieux, joyeux, poétique, élégant, sombre, énergique, rêveur, brut, sensuel, sérieux, authentique

## tags (max 6 par ref, slugs exacts)
[... taxonomie complète de search.service.js ...]

RÈGLES :
1. Génère 3-5 requêtes de recherche variées et optimisées depuis le brief
2. Pour chaque vidéo trouvée, évalue la pertinence (ignore les hors-sujet)
3. Pour les vidéos pertinentes, fetch les détails complets puis sauvegarde
4. Le contexte doit être une note éditoriale utile pour le vidéaste (2-3 phrases, pourquoi c'est intéressant, quoi observer)
5. Continue jusqu'à atteindre le nombre cible de refs sauvegardées`;

  const messages = [{
    role: 'user',
    content: `Brief d'ingestion :
Type de contenu : ${brief.typeContenu}
Caméra : ${brief.camera ?? 'tous types'}
Ambiance : ${brief.ambiance ?? 'libre'}
Source : ${brief.source ?? 'youtube'}
Nombre cible : ${brief.targetCount ?? 20} références

Lance la découverte.`
  }];

  // Boucle agentic
  while (true) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral', ttl: '1h' } }],
      tools: TOOLS,
      messages
    });

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'end_turn') break;
    if (response.stop_reason !== 'tool_use') break;

    const toolResults = [];
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;
      const result = await executeTool(block.name, block.input, sessionId);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result)
      });
    }
    messages.push({ role: 'user', content: toolResults });
  }

  // Mise à jour session
  await prisma.ingestionSession.update({
    where: { id: sessionId },
    data: { status: 'COMPLETED', completedAt: new Date() }
  });
}
```

---

### 8.5 API Routes Express

```javascript
// server/src/routes/admin/ingestion.route.js
import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { runTopicDiscovery, runCreatorScan } from '../../services/ingestion.service.js';
import { prisma } from '../../db.js';

const router = Router();
router.use(requireAdmin);

// POST /api/v1/admin/ingestion/topic
router.post('/topic', async (req, res) => {
  const { typeContenu, camera, ambiance, source, targetCount } = req.body;
  
  // Créer la session de tracking
  const session = await prisma.ingestionSession.create({
    data: {
      mode: 'TOPIC_DISCOVERY',
      briefOrUrls: JSON.stringify(req.body),
      status: 'RUNNING'
    }
  });

  // Lancer l'agent en arrière-plan (ne pas attendre)
  runTopicDiscovery({ typeContenu, camera, ambiance, source, targetCount }, session.id)
    .catch(err => {
      prisma.ingestionSession.update({
        where: { id: session.id },
        data: { status: 'FAILED' }
      });
    });

  res.json({ sessionId: session.id, status: 'running' });
});

// GET /api/v1/admin/ingestion/sessions/:id — polling status
router.get('/sessions/:id', async (req, res) => {
  const session = await prisma.ingestionSession.findUnique({
    where: { id: req.params.id },
    include: { references: { select: { id: true, title: true, status: true, thumbnailUrl: true } } }
  });
  res.json(session);
});

// GET /api/v1/admin/references
router.get('/references', async (req, res) => {
  const { status, platform, typeContenu, page = 1, limit = 20 } = req.query;
  
  const refs = await prisma.reference.findMany({
    where: {
      ...(status && { status: status.toUpperCase() }),
      ...(platform && { platform: platform.toUpperCase() }),
      ...(typeContenu && { typeContenu }),
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: Number(limit),
  });
  
  res.json(refs);
});

// PATCH /api/v1/admin/references/:id
router.patch('/references/:id', async (req, res) => {
  const allowed = ['tags', 'mood', 'typeContenu', 'context', 'status', 'channelName', 'channelUrl'];
  const data = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );
  
  if (data.status === 'PUBLISHED') {
    data.publishedAt = new Date();
  }
  
  const ref = await prisma.reference.update({
    where: { id: req.params.id },
    data,
  });
  
  res.json(ref);
});

// PATCH /api/v1/admin/references/bulk — publication batch
router.patch('/references/bulk', async (req, res) => {
  const { ids, status } = req.body;
  
  await prisma.reference.updateMany({
    where: { id: { in: ids } },
    data: {
      status: status.toUpperCase(),
      ...(status === 'published' && { publishedAt: new Date() }),
    }
  });
  
  res.json({ updated: ids.length });
});
```

---

### 8.6 Composants Frontend (React)

#### Architecture des pages admin

```
/admin/
├── ingestion/
│   ├── index.jsx          — Layout avec onglets Topic / Creator
│   ├── TopicForm.jsx      — Formulaire de brief Topic Discovery
│   ├── CreatorForm.jsx    — Tableau créateurs Creator Scan
│   ├── SessionProgress.jsx — Polling + affichage progression temps réel
│   └── ResultsGrid.jsx    — Grille de résultats avec édition inline
│
└── references/
    ├── index.jsx          — Liste références avec filtres
    ├── ReferenceRow.jsx   — Ligne avec actions (éditer, publier, rejeter)
    └── BulkActions.jsx    — Actions batch (publish all, reject all)
```

#### `SessionProgress.jsx` — Polling en temps réel
```jsx
// Polling toutes les 2s pendant que l'agent tourne
const [session, setSession] = useState(null);

useEffect(() => {
  if (!sessionId || session?.status === 'COMPLETED') return;
  
  const interval = setInterval(async () => {
    const data = await fetch(`/api/v1/admin/ingestion/sessions/${sessionId}`).then(r => r.json());
    setSession(data);
    if (data.status === 'COMPLETED' || data.status === 'FAILED') {
      clearInterval(interval);
    }
  }, 2000);
  
  return () => clearInterval(interval);
}, [sessionId, session?.status]);
```

---

### 8.7 Variables d'environnement requises

```bash
# À ajouter au .env du serveur
YOUTUBE_API_KEY=AIza...           # Google Cloud Console
VIMEO_ACCESS_TOKEN=...            # Vimeo Developer Apps
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...       # Service role key (pas anon)
SUPABASE_STORAGE_BUCKET=thumbnails

# Déjà présents
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
```

---

## 9. Out of Scope (Release 1)

- **Instagram** — API trop restrictive ; les créateurs publient aussi sur YouTube/Vimeo
- **Import vidéo directe** (upload fichier MP4) — hors périmètre veille
- **Personnalisation des checklists par abonné** — feature utilisateur future
- **Notifications push** au publication — Phase 2
- **Mode multi-admin** — un seul admin pour l'instant ; pas besoin de gestion des droits fins
- **Automatisation complète** (BullMQ scheduler) — Phase 2 ; les runs manuels suffisent à 200 refs/mois
- **Mobile admin** — desktop uniquement pour l'interface admin

---

## 10. Dependencies & Risques

### Dépendances techniques

| Dépendance | Status | Action |
|-----------|--------|--------|
| Prisma configuré + migration | ❌ À faire (P0) | Bloquant absolu |
| Compte Google Cloud + YouTube Data API v3 | ❓ À vérifier | Activer l'API + quota |
| Vimeo Developer App + Access Token | ❓ À créer | Compte gratuit Vimeo |
| Supabase Storage bucket "thumbnails" | ❌ À créer | ~10 min de setup |
| Auth ADMIN (role dans User table) | ❌ À faire | Lié au sprint Auth |

### Risques et mitigations

| Risque | Probabilité | Mitigation |
|--------|------------|------------|
| Quota YouTube Data API v3 épuisé (10k unités/jour) | Moyen | Chaque search = 100 unités, chaque videos.list = 1 unité. 10k/jour = ~100 recherches/jour. Suffisant pour 200 refs/mois. |
| Claude génère des URLs YouTube invalides | Faible | Le tool `search_youtube` appelle la vraie API — Claude n'hallucine pas d'URLs, il génère des requêtes de recherche puis l'API retourne les vrais résultats. |
| Timeout de l'agent sur de gros runs | Moyen | Lancer l'agent en background (non-bloquant) + polling côté frontend. Timeout Express à 60s non applicable. |
| Taux d'approbation des tags < 70% | Moyen | Prompt système avec taxonomie en cache. Monitoring du taux de correction manuelle. Ajustement du prompt si nécessaire. |
| Supabase Storage dépassement free tier | Faible | 1 Go free = ~12 500 thumbnails. À 500 refs/mois = 2 ans de marge. |

---

## 11. Open Questions

- **Vimeo API auth :** Le compte Vimeo actuel est-il un compte Basic (gratuit) ou Plus ? L'API de recherche requiert un compte Vimeo Developer (gratuit). À vérifier.
- **Clé YouTube API :** Existe-t-il déjà une clé Google Cloud dans le projet, ou faut-il en créer une ?
- **Déduplication cross-sessions :** Si on relance le même brief 2 semaines plus tard, les nouvelles vidéos de la même chaîne seront-elles importées ? (Oui, tant que l'URL n'existe pas déjà en BDD — comportement correct.)
- **Longueur max du contexte éditorial :** 2-3 phrases semblent le bon calibre. À valider sur les premières sorties de l'agent.

---

## Annexe — Ordre de développement recommandé

```
Sprint 1 (1 semaine) — P0 : Fondation
├─ Prisma schema + migration (ING-001, ING-002)
├─ Bucket Supabase Storage + migration thumbnails locales (ING-003)
└─ GET /api/v1/references branché Prisma (ING-004)

Sprint 2 (1 semaine) — P1 : Services backend
├─ youtube.service.js — search + video details (P1-010, P1-011)
├─ thumbnail.service.js — download + Supabase upload (P1-040)
├─ vimeo.service.js — oEmbed + API (P1-020)
└─ Tests manuels de chaque service via curl

Sprint 3 (1 semaine) — P2 : Agent Claude
├─ ingestion.service.js — runTopicDiscovery (P2-050)
├─ Routes admin ingestion (P2-053, P2-054)
├─ Déduplication (P2-052)
└─ Test end-to-end agent (Postman → BDD → Supabase)

Sprint 4 (1 semaine) — P3 : Interface admin
├─ Auth ADMIN + middleware (ING-004 auth)
├─ Page /admin/ingestion — formulaire Topic + SessionProgress (P3-060, P3-061)
├─ ResultsGrid avec édition inline (P3-063)
├─ Page /admin/references + publication (P3-064)
└─ Tests utilisateur complet (brief → publish)

Sprint 5 (optionnel) — Creator Scan
├─ web-scraper.service.js (P1-030)
├─ vimeo.service.js getUserVideos (P1-021)
├─ youtube.service.js getChannelVideos (P1-012)
├─ runCreatorScan (P2-051)
└─ UI formulaire Creator (P3-062)
```

---

*PRD généré le 2026-05-05 — 180 Degrés / Feature Ingestion Admin v1.0*
