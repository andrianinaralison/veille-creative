# PRD — Refonte front « Explorer / Bibliothèque » (pivot Spotify/Netflix)

> **Statut** : ⭐ Spec vivante · **Domaine** : Produit · **Date** : 2026-06-14 · **Décidé par** : Andri + challenge équipe produit
> Remplace la priorité v0.6.1. Découpage validé : **Track 0 → v0.8 → (refonte tags) → v0.9 → v0.10**.
> Liés : [roadmap](../roadmap.md) · [challenge équipe](../../90-journal/2026-06-14-challenge-refonte-front.md) · [PRD treatment](./treatment.md) · [audit parcours](../../30-tech/audit/audit-parcours-mvp-2026-06-12.md)

---

## 1. Intention

Faire passer le front d'un **catalogue par sections figées** à une **expérience de découverte façon Spotify/Netflix** :
- une page **Explorer** (`/`) qui met en avant des rangées de sections (éditoriales + automatiques) et **intègre la recherche** ;
- une **Bibliothèque** qui devient l'**espace personnel** de l'utilisateur (uniquement ses références sauvegardées, qu'il annote lui-même) ;
- des **pages créateur** et de la **recommandation par similarité** pour rebondir d'exploration en exploration ;
- la **sauvegarde** comme geste pivot, et le **push réf→projet** depuis partout.

La page « Veille » disparaît : son rôle (les dernières publications) est absorbé par une rangée d'Explorer.

## 2. Nav cible

`Explorer (/) · Bibliothèque · Projets · Digest`

## 3. Décisions de cadrage (issues du challenge 2026-06-14)

| Sujet | Décision |
|---|---|
| `/` | = Explorer. Page Veille supprimée. |
| Bibliothèque | = uniquement les refs **sauvegardées** par l'utilisateur (vide à l'inscription, modèle Spotify). |
| Save | Geste pivot, possible **partout** (carte hover, modale, page créateur, résultats). |
| Carte / Modale | **Composants uniques** (`ReferenceCard`, `ReferenceModal`) instanciés par toutes les surfaces. |
| Sections | Relation **N-N** réf↔section. Deux natures : `AUTO` / `MANUAL`. |
| Sections AUTO v1 | **Requêtes figées calculées à la lecture + cache**, override manuel persistant. Moteur configurable (triggers/snapshot/pinning) → v0.10. |
| Trendy | = **vues YouTube** en beta (proxy ; bascule vers signal « save » en v0.10). |
| 9 sections actuelles | **Migrées** en sections MANUAL d'Explorer. |
| Primées | Section MANUAL + champ `awards` (texte) sur la réf → **bandeau prix** dans la modale (style Netflix). |
| Reco / similaires | Scoring par **recouvrement de taxonomy** (sans ML). 4 affichés + flèche horizontale qui boucle. |
| Cold-start | Résolu par **onboarding** (préférences + tour produit), pas par un fallback. |
| Limite projet | **Supprimée** (pas de max de refs/projet ; limite marketing éventuelle plus tard). |
| Réf déjà dans projet | Message « Cette référence est déjà dans votre projet » (façon Spotify). |
| NL en Bibliothèque | **Reporté v0.10** ; filtre texte instantané suffit au MVP. |
| Annotations perso | Tags libres + note, **privées**, **réutilisables** dans le builder de treatment. |
| Plateforme | Desktop d'abord, mobile en recette. |

## 4. ⚠️ Contrainte data structurante (mesurée le 2026-06-14)

**465/478 refs publiées (97%) ont 0 tag de taxonomie. mood/typeContenu : 3%.**

Conséquences sur le découpage :
- **v0.8 ne dépend pas de la taxonomie** (sections par date/vues, recherche texte, grille bibliothèque) → livrable tel quel.
- **v0.9 (reco/similaires/perso) est bloqué** tant que le catalogue n'est pas enrichi → un track dédié « **Refonte tags & enrichissement catalogue** » précède v0.9.
- La **qualité du NL** d'Explorer est aussi gated sur l'enrichissement ; en v0.8 la recherche s'appuie d'abord sur le texte.

Bonne nouvelle créateurs : **18 créateurs distincts seulement** (3 déjà en table) → migration FK petite.

## 5. Découpage & tickets

### Track 0 / v0.8 — « Explorer & Save » (ne dépend pas des tags)
| Ticket | Objet |
|---|---|
| 180-64 | data : liaison N-N réf↔section + `Section.type` + `awards` + migration des 9 sections |
| 180-65 | socle UI : `ReferenceCard` unifiée (hover = save + détails) |
| 180-66 | socle UI : `ReferenceModal` universelle (lecture, infos, prix, save, add-projet, lien créateur, emplacement similaires) |
| 180-67 | mécanique **Save** (`SavedReference`, iso partout) — *absorbe 180-60* |
| 180-68 | liaison **réf→projet** depuis la modale + suppression limite 20 |
| 180-69 | refonte nav + suppression page Veille + `/` = Explorer |
| 180-70 | page **Explorer** : rangées sections (manuelles + auto-simples : Dernières publications, Trendy-vues, Nouveaux créateurs) |
| 180-71 | backoffice sections Explorer (CRUD, ordre, N-N, override section auto) |
| 180-72 | **recherche** intégrée Explorer (texte + filtres + NL) — *absorbe 180-58* |
| 180-73 | **Bibliothèque** = grille des refs sauvegardées (50 + lazy-load, filtre texte) — *absorbe 180-63* |
| 180-74 | **annotations** utilisateur (tags libres + note, privées, réutilisables treatment) |

### Track « Refonte tags & enrichissement catalogue » (prérequis v0.9, en // de v0.8)
| Ticket | Objet |
|---|---|
| 180-75 | refonte du système de taxonomie (axes, densité cible, application fiable) |
| 180-76 | enrichissement du catalogue existant (re-run agent Claude sur les 478 refs) |

### v0.9 — « Créateurs & Reco » (après enrichissement)
| Ticket | Objet |
|---|---|
| 180-77 | FK `Reference.creatorId` + migration de rapprochement (dédoublonnage channelId) |
| 180-78 | fiches créateur auto-remplies (thumbnail, description, liens des plateformes scrappées) |
| 180-79 | page créateur (refs + liens + créateurs similaires) |
| 180-80 | algo de similarité (refs + créateurs) par recouvrement de taxonomy |
| 180-81 | reco perso : « Recommandées pour vous » + « Dans la même veine que… » |
| 180-82 | onboarding step-by-step (préférences alignées taxonomie + tour produit) |

### v0.10 — « Raffinements front »
| Ticket | Objet |
|---|---|
| 180-83 | moteur de sections auto configurable (triggers + conditions + snapshot + pinning) |
| 180-84 | NL dans la Bibliothèque |
| 180-85 | sections-par-tag AUTO |
| 180-86 | bascule Trendy → signal « save » |

## 6. Parcours nominaux cibles

**Découverte** : ouvrir `/` Explorer → parcourir les rangées → ouvrir une réf (modale) → save / push projet / voir similaires / aller à la page créateur.

**Recherche** : taper dans la barre Explorer (texte ou NL) → grille de résultats → même modale.

**Création de vivier** : sauvegarder depuis n'importe où → retrouver dans Bibliothèque → annoter (tags + note) → réutiliser en treatment.

**Créateur** : depuis une réf → page créateur → toutes ses refs + liens + créateurs similaires → save / push projet.

**Onboarding (nouvel utilisateur)** : signup → cibler ses goûts (préférences classées, 3 max) → tour produit → Explorer déjà personnalisé.

## 7. Modèle de données (cible)

- `SavedReference` (userId, referenceId, savedAt, `userTags[]`, `note`) — unique (userId, referenceId), scopé user.
- `Section` : + `type AUTO|MANUAL`, `position`.
- Liaison **N-N** `ReferenceSection` (referenceId, sectionId, position) — remplace `Reference.sectionId`.
- `Reference` : + `awards String[]`, + `creatorId` (FK, v0.9).
- `Creator` : enrichi (thumbnail, description, liens dérivés des plateformes scrappées).
- `User` : + préférences d'onboarding (alignées taxonomie).

## 8. Questions ouvertes (à creuser)

1. **Mapping onboarding → taxonomy** (180-82) : secteurs d'activité ≠ axes de taxonomie. Définir le pont, sinon le cold-start reco ne s'amorce pas.
2. **Modèle d'override des sections auto** (180-83) : règles de pinning pour que les retraits manuels survivent aux régénérations (piège Spotify).
3. **Coût Claude** de l'enrichissement (180-76) et du NL (à estimer avant lancement).
4. **JTBD treatment (180-24)** et **test utilisabilité (180-48)** : périmètre à revoir suite au pivot.

## 9. Impact sur le backlog existant

- **Absorbés / annulés** : 180-58 (→180-72), 180-60 (→180-67), 180-63 (→180-73).
- **Maintenus** (sécu/RGPD, prérequis ouverture publique payante) : 180-59 (mdp oublié), 180-61 (RGPD compte), 180-62 (unsubscribe one-click).
- **À revoir** : 180-24 (JTBD), 180-48 (test utilisabilité).
- **180-57** (fix bibliothèque, PR #13) : reste valide — le passage à `apiFetch` et la garde CI servent de base au pivot ; la Bibliothèque sera ensuite remplacée par la grille 180-73.
