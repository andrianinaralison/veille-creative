# Contexte global — Backoffice Curation 180 Degrés

> Document de référence à fournir en tête de chaque itération.
> Mis à jour après chaque itération validée.

---

## 1. Ce qui existe déjà

### Frontend React

- **LibraryPage.jsx** — bibliothèque cinema-style, hero marquee + shelves horizontaux par catégorie. Source de données : `mockData.js` (60+ refs hardcodées). Zéro appel API.
- **ReferenceCard / ReferenceModal** — composants de consultation existants, design système validé
- **Dashboard, DigestPage, MoodboardBuilder, ProjectsPage, SurprisesPage** — pages existantes, non touchées

### Design system (verrouillé)

Palette dark cinema avec tokens Tailwind customs :
- `bg-canvas` — fond principal, très sombre
- `bg-surface` / `bg-surface-raised` — surfaces secondaires
- `text-ink` — texte principal
- `text-ink-muted` — texte secondaire, labels
- `border-surface-border` — séparateurs, bordures
- `font-editorial` — titres, grands corps (serif éditorial)
- `font-mono` — labels, metadata, tracking-widest uppercase
- Aucun arrondi sauf les pills de filtre (`rounded-full`)
- Opacités, hovers en `hover:opacity-90`, transitions `duration-300`

### Backend Express

- `POST /api/v1/search` — smart search Claude API, retourne `results: []` (pas de BDD)
- `GET /health` — health check
- `server/src/lib/supabase.js` — client Supabase singleton (service role key)
- `server/src/services/thumbnail.service.js` — DL thumbnail + upload Supabase CDN

### Supabase Storage

- Bucket `thumbnails` public créé et opérationnel
- Convention clés : `refs/youtube/{videoId}.jpg`, `refs/vimeo/{videoId}.jpg`
- URL publique CDN : `https://fytnuqnxadnsedyxxlzq.supabase.co/storage/v1/object/public/thumbnails/...`

### Données mock

Structure d'une référence mock :
```js
{
  id: 'wed-001',
  title: 'Adrenaline-Fueled Wedding...',
  platform: 'YouTube',
  author: 'Kayode Fabunmi',           // → channelName en BDD
  thumbnail: '/thumbnails/wedding/01.jpg',  // → thumbnailUrl Supabase en prod
  url: 'https://www.youtube.com/watch?v=VLkAMQhx7GY',
  tags: ['Sony-FX3', 'mariage', 'slow-motion', 'golden-hour', 'colorimétrie'],
  mood: 'romantique',
  context: `Texte éditorial...`,      // → enrichi par Claude
  savedAt: '2026-03-29T10:00:00Z',
  projectId: 'proj-002',
  type: 'video',
}
```

---

## 2. Ce qu'on construit — le Backoffice Curation

### Vision

Un espace `/admin/curation` intégré à la plateforme. L'admin (Andri) soumet un brief ou une liste de créateurs, un agent Claude orchestre la découverte et l'enrichissement des références depuis YouTube, et l'admin valide, édite, publie — sans jamais ouvrir un IDE.

Objectif : passer de 3h pour 20 références à **moins de 15 minutes**.

### Les 2 modes de découverte

**Mode A — Topic Discovery**
Brief textuel → Claude génère des requêtes YouTube → YouTube Data API v3 → résultats enrichis (tags, mood, contexte éditorial) → sauvegarde en BDD `status: DRAFT`

**Mode B — Creator Scan** *(itération tardive)*
Liste d'URLs de créateurs → détection du type (YouTube / Vimeo / portfolio web) → API ou scraping → même enrichissement → même workflow de validation

### Workflow de validation

```
DRAFT → (admin valide ou rejette chaque carte) → PUBLISHED / REJECTED
```

Les références `PUBLISHED` apparaissent dans `LibraryPage.jsx` (branché sur l'API réelle).
Les références `DRAFT` et `REJECTED` ne sont visibles que dans le backoffice.

---

## 3. Architecture technique retenue

### Schéma Prisma (3 modèles)

**Reference**
```
id, url (UNIQUE), platform (YOUTUBE|VIMEO|WEB), sourceMode (TOPIC_DISCOVERY|CREATOR_SCAN|MANUAL)
title, description, channelName, channelUrl
thumbnailUrl (CDN Supabase), thumbnailSourceUrl, thumbnailStorageKey
tags (String[]), mood, typeContenu, context (Text)
status (DRAFT|PUBLISHED|REJECTED)
ingestionSessionId (FK), createdAt, publishedAt
```

**IngestionSession**
```
id, mode, status (RUNNING|COMPLETED|FAILED)
brief (Text), totalFound, totalSaved
createdAt, completedAt
references → Reference[]
```

**Creator** *(utilisé en Mode B)*
```
id, name, url (UNIQUE), platform, channelId, active, createdAt
```

### Agent Claude (non-bloquant)

- `POST /api/v1/ingestion/sessions` → crée la session, lance l'agent en background, retourne `{ sessionId }` immédiatement
- L'agent tourne en arrière-plan : Claude appelle les tools (YouTube search, enrich), sauvegarde en BDD
- `GET /api/v1/ingestion/sessions/:id` → status + résultats progressifs, polled toutes les 2s par le frontend
- Quand `status === 'COMPLETED'`, le frontend arrête le polling et affiche les cartes DRAFT

### Tools déclarés à l'agent Claude
- `search_youtube(query, maxResults)` — appel YouTube Data API v3 `search.list`
- `get_video_details(videoId)` — appel `videos.list` pour description, channelId, stats
- `enrich_reference(videoData, brief)` — prompt Claude pour générer tags, mood, typeContenu, context éditorial
- `save_reference(enrichedData)` — Prisma `upsert` sur `url`

---

## 4. Look & feel de l'admin

L'admin respecte le design system existant. **Ce n'est pas un dashboard SaaS blanc.** C'est un workspace dans l'univers dark cinema de 180 Degrés — plus dense et fonctionnel que la bibliothèque, mais visuellement cohérent.

### Principes

- **Fond** : `bg-canvas` partout, `bg-surface` pour les panneaux
- **Pas de couleurs vives** : aucun bleu, vert, rouge flashy. Les accents utilisent `text-ink` avec opacité
- **Statuts visuels** : indicateurs sobres — pas de badges colorés. Utiliser des points, des labels `font-mono` uppercase, des opacités pour distinguer DRAFT / PUBLISHED / REJECTED
- **Actions** : boutons `bg-ink text-canvas` pour les actions primaires, `border border-surface-border` pour les secondaires. Jamais de boutons rounded.
- **Densité** : l'admin peut être dense. Les listes de références en attente de validation peuvent avoir des cards plus compactes que les ShelfCards de la bibliothèque.
- **Feedback d'agent** : quand l'agent tourne, afficher un indicateur discret (compteur de refs trouvées, log d'activité minimal) — pas un gros spinner. L'admin peut continuer à naviguer.

### Routes admin

```
/admin                   → redirect vers /admin/curation
/admin/curation          → interface ingestion (saisie brief + résultats en attente)
/admin/references        → toutes les références (DRAFT + PUBLISHED + REJECTED), filtrable par statut
```

La navigation admin est distincte de la nav principale — barre latérale fine ou topbar minimaliste. **Pas d'accès admin depuis la nav publique** (pour l'instant, pas d'auth — route directe).

---

## 5. Modèle éditorial — taxonomie 180 Degrés

L'agent Claude doit enrichir chaque référence avec cette taxonomie. À fournir dans le system prompt de l'agent.

### Tags autorisés

**Caméra** : Sony-FX3, Sony-A7SIII, Sony-A1, Canon-C70, Canon-C80, Lumix-S5ii, Lumix-S1, Blackmagic, RED, ARRI

**Ambiance (mood)** : romantique, professionnel, vivant, élégant, sérieux, épique, intime, dynamique

**Technique** : slow-motion, handheld, travelling, drone, stabilisé, anamorphique, BTS

**Lumière / Colorimétrie** : golden-hour, basse-lumière, lumière-naturelle, V-Log, LUT, grain, vintage, S-Cinetone

**Montage** : transitions, montage-rythmé, narrative, cut-on-beat

**Catégorie** : mariage, corporate, B2B, événementiel, gala, awards, startup, portrait, clip, documentaire

### Champ `context`

Texte éditorial de 2-4 phrases. Ton expert, première personne du pluriel non requise — style analytique. Doit répondre à : *pourquoi cette vidéo est une référence pour un vidéaste pro ? Quelle technique ou choix esthétique mérite l'attention ?*

Exemple : *"Tourné en 8K sur Sony A1 + FX3 + ZVE1. Trois corps simultanés pour ne manquer aucun moment clé. Le ralenti 120fps sur le premier regard crée un point d'arrêt émotionnel immédiat."*

---

## 6. Contraintes invariables

- **ESM partout** (`"type": "module"`) — pas de `require()`
- **Modèle Claude** : `claude-sonnet-4-6` — spécifié dans CLAUDE.md
- **Pas de prefill** sur les structured outputs Claude (interdit Sonnet 4.6)
- **Ne jamais toucher** à LibraryPage.jsx, ReferenceCard.jsx, ReferenceModal.jsx, mockData.js tant que le branchement BDD n'est pas validé
- **Ne jamais exposer** `SUPABASE_SERVICE_KEY` ou `ANTHROPIC_API_KEY` côté client
- **Nommage** : `kebab-case.js` backend, `PascalCase.jsx` frontend
- **2 features max par itération**

---

## 7. Méthodologie itérative

Chaque itération suit ce format :

```
## CONTEXTE    — ce qui est verrouillé, ce que cette itération ajoute
## TÂCHE       — 1 ou 2 choses à construire, pas plus
## GUIDELINES  — specs détaillées (schéma, comportement, UX)
## CONTRAINTES — ce qui ne doit pas bouger
## PROMPT DE VALIDATION — comment tester que ça marche
## CORRECTIFS POST-GÉNÉRATION — fixes appliqués (documentés après coup)
```

**Règle de validation** : chaque itération est considérée terminée uniquement quand le prompt de validation a été exécuté et ne remonte aucune erreur bloquante.

---

## 8. Plan d'itérations

| N° | Objectif | Prérequis |
|---|---|---|
| 1 | Prisma schema + migration Supabase | DATABASE_URL configurée |
| 2 | Shell admin — routes `/admin` + layout + navigation | Itération 1 |
| 3 | Formulaire brief + Topic Discovery (agent Claude + YouTube API) | Itération 1 |
| 4 | Review UI — cartes DRAFT, valider / rejeter / éditer | Itération 3 |
| 5 | Publish flow — DRAFT → PUBLISHED → LibraryPage branchée sur API | Itération 4 |
| 6 | Creator Scan mode (YouTube channel + Vimeo) | Itération 5 |
| 7 | Auth admin (JWT) — protéger les routes `/admin` | Itération 5 |

---

## 9. État courant

- ✅ Supabase Storage opérationnel — bucket `thumbnails` public
- ✅ `thumbnail.service.js` — DL + upload CDN validé
- ✅ `server/.env` complet
- ⏳ DATABASE_URL manquante — mot de passe DB Supabase requis pour configurer Prisma
- ❌ Prisma non installé, schéma non créé
- ❌ Routes admin inexistantes
- ❌ Agent Claude ingestion inexistant
