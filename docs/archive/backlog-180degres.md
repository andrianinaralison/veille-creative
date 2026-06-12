# Backlog 180 Degrés — Pipeline ingestion admin

> Dernière mise à jour : **2 juin 2026** — Itérations 3 à 6 complétées ✅
> Stack : React 19 + Vite + Tailwind · Node.js + Express + Prisma + PostgreSQL · Supabase Storage · Claude API

---

## Vue d'ensemble

| Itération | Objectif | Statut | Correctifs post |
|---|---|---|---|
| 1 | Prisma schema + migration Supabase | ✅ Validée | Session pooler `aws-1-eu-west-3` requis (IPv6 only) |
| 2 | Shell admin — routes `/admin` + layout + navigation | ✅ Validée | AdminLayout + Outlet, routes imbriquées react-router |
| 3 | Agent Topic Discovery — brief NL → YouTube API → DRAFT | ✅ Validée | Claude génère queries, scoring 0–100, enrichissement tags/mood/context |
| 4 | Review UI — tableau DRAFT, valider / rejeter / éditer tags | ✅ Validée | TagEditor, SectionSelector, StatusDropdown, sauvegarde par ligne |
| 5 | Creator Scan — ajout créateur → scan chaîne YouTube auto | ✅ Validée | playlistItems.list, filtre > 3 min, monitoring live, auto-trigger après ajout |
| 6 | Import liens manuels — URLs YouTube → metadata → DRAFT | ✅ Validée | Même pipeline enrichissement Claude que les autres modes |
| 7 | Auth admin JWT — protéger les routes `/admin` | ⏳ À faire | — |

---

## Ce qui a été livré (session 2 juin 2026)

### Backend
- **Prisma schema complet** : `Reference`, `IngestionSession`, `Creator`, `Section` — migrations appliquées sur Supabase
- **`ingestion.service.js`** — pipeline complet :
  - `runIngestionAgent` : brief NL → Claude génère queries → `search.list` → `videos.list` → scoring Claude → enrichissement Claude (tags/mood/context) → thumbnail Supabase CDN → upsert DRAFT
  - `runCreatorScanAgent` : résolution channelId (handle nu `@x`, URL, `/c/legacy`) → `playlistItems.list` (quota-efficient) → filtre durée > 3 min (`contentDetails`) → enrichissement Claude → DRAFT
  - `fetchAndSaveLinks` : URLs YouTube manuelles → `videos.list` → enrichissement Claude → DRAFT
- **`admin.route.js`** : CRUD complet créateurs (POST/PATCH/DELETE/GET) avec les 4 profils (YouTube, Instagram, Vimeo, site web), dérivation URL depuis `@handle`
- **`ingestion.route.js`** : sessions (POST/GET/:id/GET), creator-scan, links
- **`admin-sections.route.js`** : CRUD sections + assign/unassign références

### Frontend — Backoffice `/admin`
- **AdminLayout** : sidebar nav, outlet React Router
- **CurationPage** : deux tabs (Créateurs / Liens manuels) + monitoring live + tableau de validation
  - **Tab Créateurs** : formulaire nom + dropdown plateforme → champ contextuel (YouTube/Instagram/Vimeo/Site) + récap chips — auto-scan au submit si YouTube renseigné
  - **Tab Liens** : textarea URLs, détection auto, import
  - **MonitoringView** : polling toutes les 2s, compteurs live (trouvées/sauvegardées), liste dernières références
  - **ResultsTable** : TagEditor taxonomie, SectionSelector, StatusDropdown, sauvegarde par ligne
- **ReferencesAdminPage** : liste toutes les références avec filtres
- **SectionsAdminPage** : gestion des sections éditoriales
- **ScrollToTop** : reset scroll sur chaque changement de route

### Modèle Creator — 4 profils
- `youtubeHandle` — scan auto-déclenché après ajout
- `instagramHandle` — stocké, scan à développer (voir backlog secondaire)
- `vimeoUrl` — stocké, scan à développer
- `websiteUrl` — stocké, scraping à développer

---

## Pré-requis complétés (hors itérations)

- ✅ Frontend React avec 60+ mock data
- ✅ Smart search backend (`POST /api/v1/search`) — Claude API + prompt caching
- ✅ Supabase Storage configuré — bucket `thumbnails` public
- ✅ `thumbnail.service.js` — téléchargement + upload CDN
- ✅ `server/.env` complet (SUPABASE_URL, SUPABASE_SERVICE_KEY, YOUTUBE_API_KEY)
- ✅ PRD complet — `docs/PRD_Ingestion_Admin.md`

---

## Itération 1 — Prisma schema + migration Supabase

### Contexte
Première vraie base de données. Tous les appels API retournent `results: []` actuellement.

### Ce qui a été fait
— À venir

### Correctifs post
— À venir

### Fichier associé
`docs/iteration-1-prisma-schema.md`

### Leçons
— À venir

---

## Itération 2 — Auth JWT

### Contexte
— À venir

### Fichier associé
`docs/iteration-2-auth.md`

---

## Itération 3 — GET /references branché sur la vraie BDD

### Contexte
— À venir

### Fichier associé
`docs/iteration-3-references-api.md`

---

## Itération 4 — YouTube service

### Contexte
— À venir

### Fichier associé
`docs/iteration-4-youtube-service.md`

---

## Itération 5 — Agent Claude (Topic Discovery)

### Contexte
— À venir

### Fichier associé
`docs/iteration-5-agent-topic-discovery.md`

---

## Itération 6 — Admin UI

### Contexte
— À venir

### Fichier associé
`docs/iteration-6-admin-ui.md`

---

## Backlog secondaire — Scan multi-sources créateurs

> Actuellement seul YouTube est scannable après ajout d'un créateur (via `playlistItems.list` → filtre > 3 min → Claude enrichissement → DRAFT).
> Les 3 autres sources sont enregistrées dans le profil créateur mais ne déclenchent pas de scan.

| Source | Complexité | Notes techniques |
|---|---|---|
| **Instagram** | Haute | API officielle très restrictive (Graph API nécessite app review). Alternative : scraping Apify/Phantombuster ou ingestion manuelle des Reels. |
| **Vimeo** | Moyenne | API Vimeo publique disponible (`/users/{id}/videos`) — retourne titre, description, thumbnail, durée. Filtre > 3 min déjà applicable. |
| **Site web** | Basse→Moyenne | Scraping HTML de la page (Cheerio / Playwright) pour extraire les embeds YouTube/Vimeo → réinjecter dans le pipeline `fetchAndSaveLinks`. |

### Priorité suggérée
1. **Vimeo** — API ouverte, pipeline très proche du YouTube scan
2. **Site web** — scraper les embeds et réinjecter dans le flux manuel existant
3. **Instagram** — nécessite une décision sur l'approche (API officielle vs tiers payant)

---

## Règles du projet

1. **2 features max par itération** — au-delà les correctifs s'accumulent
2. **Sections validées verrouillées** — mentionner explicitement ce qui ne doit pas bouger
3. **Prompt de validation** après chaque connexion BDD ou modification de schéma
4. **Documenter les correctifs** dans le fichier de l'itération concernée
5. **ESM partout** — pas de `require()`
6. **Pas de prefill Claude API** — interdit sur Sonnet 4.6

---

## Index des fichiers produits

| Fichier | Contenu |
|---|---|
| `docs/PRD_Ingestion_Admin.md` | PRD complet + User Story Map + architecture |
| `docs/backlog-180degres.md` | Ce fichier — backlog et suivi |
| `docs/iteration-1-prisma-schema.md` | Schéma Prisma + migration |
| `server/src/lib/supabase.js` | Client Supabase singleton |
| `server/src/services/thumbnail.service.js` | Service thumbnail (DL + upload CDN) |
| `server/scripts/test-supabase.js` | Script de validation Supabase Storage |
