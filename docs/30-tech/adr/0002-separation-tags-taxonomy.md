# ADR 0002 — Séparation tags YouTube bruts / taxonomie éditoriale

**Date** : 2026-06-12
**Statut** : Accepté
**Ticket** : 180-49

## Contexte

`Reference.tags` mélangeait deux familles sémantiquement incompatibles :
les slugs de la taxonomie 180° (18 axes, produits par l'enrichissement Claude
ou la qualification admin) et les tags YouTube bruts (métadonnées API,
hashtags sociaux, noms propres). L'ingestion écrivait
`tags: meta.tags?.length ? meta.tags : video.tags` — selon que Claude avait
répondu ou non, la même colonne contenait l'une ou l'autre famille.
Conséquence : TagEditor, filtres Médiathèque et smart search exposaient du
bruit YouTube comme options de qualification (cause racine du finding B1 de
l'audit UX 2026-06-07).

## Décision

1. **Deux colonnes distinctes** sur `Reference` :
   - `tags String[]` — tags YouTube bruts, conservés pour traçabilité
     uniquement. Jamais exposés par défaut dans les réponses API
     (`?includeTags=true` côté admin pour les voir).
   - `taxonomy String[]` — slugs taxonomie 180° exclusivement
     (enrichissement Claude + qualification admin).
2. **La liste des slugs valides est dérivée du prompt** : `taxonomy.js`
   parse `TAG_TAXONOMY` (le texte envoyé à Claude) pour produire
   `TAXONOMY_AXES` / `ALL_VALID_TAGS`. Une seule source, aucune dérive
   possible entre ce que Claude voit et ce que le code valide.
3. **Filtre de sécurité à l'enrichissement** : la sortie Claude est filtrée
   sur `ALL_VALID_TAGS` — un slug halluciné ne peut plus polluer `taxonomy`.
4. **Backfill SQL en migration** : les valeurs de `tags` appartenant à la
   taxonomie migrent vers `taxonomy`, le reste demeure dans `tags`
   (639 refs : 174 → taxonomy, 484 gardent des tags bruts, 0 perte).

## Conséquences

- Le front (admin + public) lit et écrit `taxonomy` ; `tags` disparaît des
  réponses API par défaut.
- Le smart search (public + admin) filtre sur `taxonomy` — les requêtes NL
  ne matchent plus le bruit YouTube.
- La qualification batch (`addTags`) alimente `taxonomy`.
- Migration nettoyage des tags orphelins YouTube : reportée post-v0.5
  (les tags bruts restent en base, invisibles).

## Notes d'application

La migration a nécessité deux interventions sur la base Supabase :
baseline de 5 migrations historiques appliquées via `db push` mais jamais
enregistrées dans `_prisma_migrations`, et terminaison d'une connexion
zombie `idle in transaction` (4 jours) qui bloquait l'`ALTER TABLE`
(statement_timeout 2 min).
