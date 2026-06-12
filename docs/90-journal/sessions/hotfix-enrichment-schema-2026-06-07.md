# Hotfix — `additionalProperties:false` manquant dans enrichment.service.js

> **Date** : 7 juin 2026  
> **Ticket** : 180-13 (post-clôture, lié à 180-11)  
> **Commit** : `5251cb0`  
> **Découvert via** : réunion de crise agents 180° (backoffice KO)

---

## Symptôme

Toute session d'ingestion se terminait en `FAILED`. Le backoffice chargeait mais aucun contenu n'entrait.

```
BadRequestError: 400 {
  "type": "error",
  "error": {
    "type": "invalid_request_error",
    "message": "output_config.format.schema: For 'object' type, 'additionalProperties' must be explicitly set to false"
  }
}
```

## Root cause

L'API Anthropic exige `additionalProperties: false` sur **chaque** objet `type: 'object'` dans `output_config.format.schema`. Sans ça → 400 immédiat.

`enrichment.service.js` avait 5 objets non conformes :

| Fonction | Ligne | Objet |
|---|---|---|
| `enrichVideosBatch()` | 55 | Racine |
| `enrichVideosBatch()` | 61 | `items` de `enriched[]` |
| `generateYouTubeQueries()` | 128 | Racine |
| `scoreVideosWithClaude()` | 169 | Racine |
| `scoreVideosWithClaude()` | 175 | `items` de `scores[]` |

## Fix

Ajout de `additionalProperties: false` à chaque objet concerné.

```diff
  schema: {
    type: 'object',
+   additionalProperties: false,
    properties: { ... }
  }
```

## Leçon

Chaque objet `type: 'object'` dans un schéma `output_config.format` **doit** avoir `additionalProperties: false` — y compris les objets imbriqués dans des tableaux. La contrainte s'applique récursivement.

Référence : `search.service.js` l'avait déjà correctement (modèle à suivre).
