# Way of Working — 180 Degrés

> Comment on développe ce produit. **Ce fichier est la référence process.** Si une autre doc le contredit, c'est lui qui gagne.
> Lié à : [`audit/AUDIT-2026-06-04.md`](./audit/AUDIT-2026-06-04.md) · [`audit/PLAN-RESTRUCTURATION.md`](./audit/PLAN-RESTRUCTURATION.md)
> Dernière révision : 4 juin 2026.

---

## 1. Le principe : simuler une équipe produit, seul

Tu es seul (avec Claude), mais tu veux le **rigueur d'une équipe**. L'astuce : ne pas confondre les rôles. À chaque moment, tu portes **une seule casquette à la fois**, avec ses critères propres. Claude joue les autres rôles à la demande (les skills sont mappées ci-dessous).

| Rôle | Casquette | Sa question | Skill Claude associée |
|---|---|---|---|
| **PM / Product** | Pourquoi & quoi | « Quel problème de Léa on résout, et comment on saura que c'est réussi ? » | `product-management:write-spec`, `prd-development`, `product-management:roadmap-update` |
| **Designer** | Expérience | « C'est utilisable, cohérent, accessible ? » | `design:design-critique`, `design:ux-copy`, `design:design-system` |
| **Tech Lead / Archi** | Comment (structure) | « Ce choix tient dans 6 mois ? Où est le risque ? » | `engineering:architecture`, `engineering:system-design` |
| **Dev** | Comment (exécution) | « Le code est correct, lisible, testé ? » | `engineering:code-review`, `engineering:debug` |
| **QA** | Confiance | « Qu'est-ce qui peut casser, et comment je le prouve ? » | `engineering:testing-strategy` |
| **Delivery / Ops** | Livraison | « C'est déployable, observable, réversible ? » | `engineering:deploy-checklist`, `engineering:tech-debt` |

**Règle d'or** : on ne saute jamais directement du « pourquoi » au code. Le cheminement est : *PM cadre → Tech Lead structure → Dev exécute → QA prouve → Delivery livre.* Même en petit, on respecte l'ordre.

---

## 2. Le cheminement produit : Discovery → Delivery

```
  DISCOVERY (pourquoi)              DELIVERY (comment)
  ┌─────────────────┐              ┌──────────────────────────┐
  │ Problème / JTBD  │             │  Spec → Build → Test →    │
  │ Opportunité      │ ──valide──▶ │  Review → Merge → Deploy  │
  │ Hypothèse        │             │                           │
  └─────────────────┘              └──────────────────────────┘
        ▲                                      │
        └──────────── métriques / feedback ────┘
```

### Discovery (léger, mais réel)
Avant qu'une feature entre dans la roadmap « Next », elle passe un filtre court — **une demi-page max** :
1. **Problème** : quel job-to-be-done de Léa ? (pas « il manque X » mais « Léa n'arrive pas à Y »)
2. **Hypothèse** : on croit que [solution] va produire [résultat mesurable].
3. **Signal de succès** : comment on saura que c'était utile (1 métrique).

Si tu ne peux pas remplir ces 3 lignes, la feature n'est pas prête (Definition of Ready, §5).

### Delivery
Tout passe par le cycle ticket → branche → PR → merge décrit au §4.

---

## 3. Backlog & priorisation : un seul board, Now / Next / Later

**Décision** : on supprime les 4 roadmaps concurrentes. **Une seule source de vérité** pour le « quoi/quand ».

### Option recommandée : un outil de board (Linear / Notion / ClickUp)
Tu as ces connecteurs disponibles. Un vrai board bat un markdown : il ne dérive pas, il a des états, il relie discovery et delivery. **Recommandation : Linear** (le plus léger, fait pour le dev, gratuit en solo).

### Fallback sans outil : `docs/ROADMAP.md` unique
Si tu restes en markdown, **un seul fichier**, structuré Now/Next/Later, et tous les autres (PROJET.md, backlog, CLAUDE.md) **pointent vers lui** au lieu de redéclarer la roadmap.

```
## NOW (sprint courant — ce sur quoi tu codes maintenant)
## NEXT (1-2 sprints — prêt, pas commencé)
## LATER (vision — pas encore raffiné)
## DONE (archive datée, pour la mémoire)
```

### Priorisation : RICE allégé
Quand deux choses se disputent le « Now », trancher avec **Reach × Impact × Confidence / Effort**. Pas besoin de tableur — un ordre de grandeur suffit. La skill `product-management:roadmap-update` peut t'aider à arbitrer.

---

## 4. Git : le nerf de la « reprise en main »

### 4.1 Modèle de branches (simple, trunk-based léger)

| Branche | Rôle | Règle |
|---|---|---|
| `main` | Production, **toujours déployable** | On ne commit jamais directement dessus |
| `feat/xxx`, `fix/xxx`, `chore/xxx` | Travail en cours, **courte durée** | Une branche = un ticket = une PR. Merge < 3 jours. |

**On supprime l'anti-pattern « branches de sauvegarde ».** `2025-05-05_Save`, `2026-06-02_Save`, `ToImprove` → à convertir en **tags** puis supprimer :

```bash
git tag -a v0.2-checkpoint 2025-05-05_Save^{commit} -m "Checkpoint 5 mai"
git tag -a v0.3-checkpoint 2026-06-02_Save^{commit}  -m "Checkpoint 2 juin"
git push origin --tags
git branch -D 2025-05-05_Save 2026-06-02_Save ToImprove
git push origin --delete 2026-06-02_Save ToImprove   # supprimer les remotes correspondants
```

Un tag est un point figé permanent, gratuit, qui n'encombre pas la liste des branches. C'est *exactement* ce que tu cherchais à faire avec les branches Save.

### 4.2 Commits : petits, atomiques, conventionnels

On garde la convention déjà amorcée (`feat:`, `fix:`, `docs:`, `chore:`) mais on **arrête les commits fourre-tout**. Un commit = un changement cohérent. Format :

```
type(scope): résumé impératif court

- détail si nécessaire
```

Exemples : `feat(auth): middleware JWT sur routes admin` · `refactor(ingestion): extraire youtube.client` · `test(references): couvrir GET /references`.

### 4.3 Le flux PR (même en solo)

C'est le point de contrôle qui *simule l'équipe*. Même si tu merges toi-même :

```
1. Créer la branche depuis main          → feat/jwt-admin-auth
2. Coder + commits atomiques
3. Ouvrir une PR vers main
4. Faire passer Claude en code-reviewer   → skill engineering:code-review
5. CI verte (lint + tests)                → obligatoire
6. Cocher la Definition of Done
7. Merge (squash) + supprimer la branche
8. Tag si c'est un jalon (v0.4, etc.)
```

La PR force le moment où QA, review et DoD s'appliquent. Sans elle, tout se mélange.

---

## 5. Definition of Ready (DoR) & Definition of Done (DoD)

### Definition of Ready — un ticket est prêt à être codé quand :
- [ ] Le problème (JTBD) et le « pourquoi » sont écrits (1-3 lignes).
- [ ] Les critères d'acceptation sont listés et testables.
- [ ] L'impact sur l'archi/sécurité est noté (ou « aucun »).
- [ ] C'est découpable en < 3 jours. Sinon, on le splitte.

### Definition of Done — un ticket est terminé quand :
- [ ] Le code respecte les conventions (`CLAUDE.md` : ESM, kebab/Pascal, pas d'abstraction prématurée).
- [ ] **Tests écrits et verts** pour la logique non triviale.
- [ ] **CI verte** (lint + tests).
- [ ] Passé en revue (Claude code-review ou relecture explicite).
- [ ] Pas de secret, pas de route non protégée introduite.
- [ ] La doc impactée est à jour (roadmap, ADR si décision d'archi).
- [ ] PR mergée, branche supprimée.

> Imprime ces deux listes. Tant qu'une case n'est pas cochée, ce n'est ni prêt, ni fini. C'est ce qui te fait « tenir la main » sur la qualité.

---

## 6. Rituels (cadence solo, calibrés pour ne pas être du théâtre)

| Rituel | Quand | Durée | Ce qu'on fait |
|---|---|---|---|
| **Sprint planning** | Début de sprint (1-2 sem.) | 30 min | Choisir 2-4 tickets « Now ». Vérifier qu'ils passent la DoR. Skill `product-management:sprint-planning`. |
| **Daily check** (solo) | Chaque jour de dev | 5 min | « Hier / aujourd'hui / blocage ». Tient le focus. Skill `engineering:standup`. |
| **Revue de fin de sprint** | Fin de sprint | 30 min | Démo perso de ce qui marche. Mettre à jour le board. Archiver en DONE. |
| **Rétro** | Fin de sprint | 15 min | 1 chose à garder, 1 à changer dans le WoW. **Ce fichier évolue ici.** |
| **Grooming** | Au besoin | — | Raffiner « Next » avec la discovery (§2). |

**Règle anti-bureaucratie** : un rituel qui ne change aucune décision est supprimé. On ne fait pas de cérémonie pour la cérémonie.

---

## 7. Documentation : carte de la source de vérité

Le problème actuel : tout se répète et diverge. **Chaque type d'info a UN seul propriétaire.**

| Question | Fichier propriétaire | Les autres font quoi |
|---|---|---|
| C'est quoi le projet ? (pitch, persona, scope) | `docs/PROJET.md` | — |
| Quoi/quand ? (roadmap, priorités) | `docs/ROADMAP.md` *(ou Linear)* | CLAUDE.md & PROJET.md **pointent** vers lui |
| Comment on bosse ? (process) | `docs/WAY-OF-WORKING.md` *(ce fichier)* | — |
| Règles techniques pour Claude/IDE | `CLAUDE.md` (racine) | Ne **duplique pas** la roadmap, juste un lien |
| Pourquoi ce choix d'archi ? | `docs/adr/NNNN-titre.md` (un par décision) | — |
| Spec d'une feature | `docs/specs/feature-xxx.md` | — |
| Mémoire de session / contexte courant | `docs/admin-curation-context.md` | OK, mais une seule par chantier actif |

**Tout le reste** (lean canvas ×3, PRD legacy, journey maps de mars, analyses datées) → `docs/archive/`. On ne supprime pas (valeur historique), on **sort du chemin** pour que le `docs/` actif soit lisible.

---

## 8. Comment Claude (IDE / Cowork) s'insère dans ce WoW

Tu développes via Claude Code dans VS Code. Pour que ça reste structuré et pas « un gros tas de génération » :

1. **Une session Claude = un ticket.** On ouvre la session avec le ticket (DoR remplie), on la ferme quand la DoD est cochée.
2. **Faire jouer les rôles explicitement.** « Mets ta casquette Tech Lead et challenge cette archi » → skill `engineering:architecture`. « Passe en code-review sur cette PR » → `engineering:code-review`. C'est ça, l'équipe simulée.
3. **`CLAUDE.md` est le contrat.** Il dit les invariants (ESM, modèle Claude, pas de prefill, conventions). On le garde court et vrai — pas de roadmap dedans.
4. **Toute décision d'archi non triviale → un ADR** avant de coder, pas après.
5. **Claude ne merge pas sans CI verte + DoD.** C'est la règle qui empêche la dette de revenir.

---

## 9. Métriques : rendre le système observable

Aujourd'hui rien n'est mesuré (cf. audit §10). On instrumente le minimum vital, par ordre :

1. **Santé technique** : CI pass-rate, nombre de tests, couverture des chemins critiques.
2. **Santé curation** (le cœur produit) : ratio DRAFT publiés / rejetés, nb de références PUBLISHED, coût Claude par session d'ingestion.
3. **Santé produit** (post-auth) : activation (1ʳᵉ recherche réussie), rétention, puis les north stars (moodboards partagés ≥ 60 %, NPS > 40).

On ne peut piloter que ce qu'on mesure. Tant que (2) n'est pas suivi, le pilier éditorial est un pari.

---

## 10. En une phrase

> **Un ticket prêt (DoR) → une branche courte → des commits atomiques → une PR avec CI verte et code-review → DoD cochée → merge → board à jour.** Répété, ce cycle *est* la reprise en main.
