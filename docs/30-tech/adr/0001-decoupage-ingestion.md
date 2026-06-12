# ADR 0001 — Découpage de ingestion.service.js

**Date** : 2026-06-05  
**Statut** : Accepté  
**Ticket** : 180-12 (T-06)

## Contexte

`ingestion.service.js` atteignait 847 lignes mélangeant trois responsabilités distinctes : appels API YouTube, passes Claude, et orchestration pipeline + persistance Prisma. Intestable et difficile à faire évoluer.

## Décision

Découpage en trois modules selon le principe de séparation des responsabilités :

| Fichier | Responsabilité | Lignes |
|---------|---------------|--------|
| `server/src/lib/youtube.client.js` | Appels YouTube Data API v3 (search, videos, channels, playlistItems). Aucun Claude, aucun Prisma. | 163 |
| `server/src/services/enrichment.service.js` | Passes Claude : `enrichVideosBatch`, `generateYouTubeQueries`, `scoreVideosWithClaude`. Aucun Prisma. | 203 |
| `server/src/services/ingestion.service.js` | Orchestrateurs (`runIngestionAgent`, `runCreatorScanAgent`, `fetchAndSaveLinks`). Importe des deux modules ci-dessus. | 284 |

## Conséquences

- Chaque module est testable indépendamment (mock simple des imports)
- `youtube.client.js` peut être réutilisé hors contexte ingestion (ex : enrichissement à la demande)
- `enrichment.service.js` peut évoluer indépendamment de la logique de persistance
- Les exports publics (`parseDurationSeconds`, `extractYouTubeId`) sont re-exportés depuis `ingestion.service.js` pour ne pas casser les tests existants (T-02)
