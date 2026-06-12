# Hotfix — Zod v4 compat (`err.errors` → `err.issues`)

> **Date** : 7 juin 2026  
> **Ticket** : 180-13 (post-clôture)  
> **Commit** : `b45cc45`  
> **Durée** : ~10 min

---

## Symptôme

```
TypeError: Cannot read properties of undefined (reading 'map')
  at file://…/server/src/middleware/validate.js:20
```

Crash 500 sur `GET /api/v1/admin/references` — et potentiellement toute route avec le middleware `validate()`.

## Cause racine

Zod v4 (installé en `^4.4.3`) a renommé `ZodError.errors` en `ZodError.issues`. En v3 les deux coexistaient ; en v4 `errors` est `undefined`.

Le code de `validate.js` utilisait `err.errors.map(...)` → crash garanti sur toute erreur de validation.

## Fix appliqué

**`server/src/middleware/validate.js` — ligne 20**

```diff
-          details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
+          details: err.issues.map(e => ({ path: e.path.join('.'), message: e.message })),
```

## Comportement avant → après

| | Avant | Après |
|---|---|---|
| Requête avec query invalide | 500 TypeError non catchée | 400 `{ error, details[] }` |
| Requête valide | OK | OK (non impacté) |

## Leçon

Zod v4 est une breaking change sur l'API `ZodError`. Si Zod est upgradé, toujours vérifier `err.issues` vs `err.errors` dans les middlewares de validation.
