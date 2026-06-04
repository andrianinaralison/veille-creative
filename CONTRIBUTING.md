# Contributing — 180 Degrés

> Le build se fait **uniquement dans Claude Code (VS Code)**. Ce guide s'applique à toute contribution au dépôt.

## Modèle de branches

```
main              ← production, toujours déployable — jamais de push direct
feat/xxx          ← nouvelle fonctionnalité
fix/xxx           ← correction de bug
chore/xxx         ← maintenance, refactor, docs
```

**Règle** : une branche = un ticket Linear = une PR. Durée de vie courte (quelques jours max).

Nommage : `feat/admin-auth`, `fix/ingestion-timeout`, `chore/cleanup-git`

## Format de commit (Conventional Commits)

```
<type>(<scope>): <description courte>

[corps optionnel — le WHY, pas le WHAT]
```

| Type | Quand |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `chore` | Maintenance, refactor, mise à jour deps |
| `docs` | Documentation uniquement |
| `test` | Ajout ou modification de tests |

Exemples :
```
feat(auth): add requireAdmin middleware with JWT
fix(ingestion): handle YouTube quota exceeded error
chore(git): convert *_Save branches to tags
docs(roadmap): sync with Linear v0.4 tickets
```

## Flux PR

1. Créer la branche depuis `main` : `git checkout -b feat/xxx main`
2. Commits atomiques au fil du travail
3. Ouvrir une PR vers `main` — titre = message de commit principal
4. Review (auto-review si solo) + merge squash ou rebase
5. Supprimer la branche après merge

## Checkpoints historiques

Les checkpoints sont des **tags annotés**, pas des branches :

```
v0.2-checkpoint   ← 180 Degrés v0.2 (backend Express, mai 2025)
v0.3-checkpoint   ← 180 Degrés v0.3 (backoffice curation, juin 2026)
```

Pour créer un nouveau checkpoint :
```bash
git tag -a v0.X-checkpoint <commit> -m "description"
git push origin v0.X-checkpoint
```

## Protection de main

- Pas de push direct sur `main`
- Toute modification passe par une PR
- CI requise quand elle est configurée
