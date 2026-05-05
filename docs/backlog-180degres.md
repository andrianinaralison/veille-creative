# Backlog 180 Degrés — Pipeline ingestion admin

> Dernière mise à jour : Supabase Storage configuré ✅
> Stack : React 19 + Vite + Tailwind · Node.js + Express + Prisma + PostgreSQL · Supabase Storage · Claude API

---

## Vue d'ensemble

| Itération | Objectif | Statut | Correctifs post |
|---|---|---|---|
| 1 | Prisma schema + migration Supabase | ⏳ À faire | — |
| 2 | Auth JWT (signup / login / me) | ⏳ À faire | — |
| 3 | GET /references + branchement front sur API réelle | ⏳ À faire | — |
| 4 | YouTube service — extraction metadata + thumbnail | ⏳ À faire | — |
| 5 | Agent Claude — Topic Discovery mode | ⏳ À faire | — |
| 6 | Admin UI — interface de validation des références | ⏳ À faire | — |
| 7 | Creator Scan mode (portfolio web + Vimeo) | ⏳ À faire | — |
| 8 | Digest éditorial + export PDF | ⏳ À faire | — |

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
