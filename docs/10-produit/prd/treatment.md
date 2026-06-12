# PRD — Treatment client (v0.7)

> **Statut** : Draft — à valider par une session JTBD avec une utilisatrice réelle (180-24)
> **Domaine** : Produit · **MàJ** : 2026-06-12 · **Tickets** : 180-24, 180-21, 180-22, 180-23, 180-27

## JTBD (hypothèse à valider)

> Quand je réponds à un brief client (mariage, corporate, événementiel), je veux
> **assembler rapidement un document créatif qui montre mon intention** — références
> à l'appui — pour que le client comprenne ma vision, valide la direction avant le
> tournage, et que je gagne le devis sans réunion supplémentaire.

**Persona** : Léa, 31 ans, vidéaste indépendante à Lyon (Sony A7SIII), 39€/mois.
**Situation déclencheuse** : un prospect demande « tu verrais ça comment ? ».
**Résultat attendu** : un lien (ou PDF) envoyé en < 30 min qui fait pro et obtient un « ok, partons là-dessus ».

## Qu'est-ce qu'un treatment 180° ?

Un document court, visuel, structuré :

1. **En-tête** — titre du projet, client, date/deadline.
2. **Intention créative** — 3-10 lignes : le parti pris (ton, rythme, lumière, narration).
3. **Références commentées** — 3 à 12 vidéos de la bibliothèque 180°, chacune avec
   une note : *ce qu'on en retient pour CE projet* (« ce traveling d'ouverture »,
   « cette colorimétrie golden hour »).
4. **Pied** — signature vidéaste.

Ce n'est **pas** : un moodboard d'images libres (pas d'upload v0.7), un devis, un planning.

## Modèle de données

- `Project` : userId (propriétaire), title, client, brief (le brief reçu),
  intention (le parti pris rédigé), status (DRAFT / IN_PROGRESS / DONE), deadline?,
  shareToken? (lien public révocable), timestamps.
- `ProjectItem` : référence + note + position — même mécanique éprouvée que `DigestItem`.

## Parcours

1. **Créer** (180-21) : `/projects/new` — titre, client, brief, deadline → projet DRAFT.
2. **Composer** (180-22) : `/projects/:id` — rédiger l'intention, piocher des références
   (recherche dans les PUBLISHED), les ordonner, les annoter. Sauvegarde explicite.
3. **Partager** (180-23) : bouton « Partager » → lien public `/t/:token` (lecture seule,
   sans compte — le client n'a pas de login). Bouton « PDF » → impression navigateur
   avec feuille de style print dédiée (pas de lib PDF lourde en v0.7).
4. **Suivre** : north star — « moodboards partagés ≥ 60 % dans les 48 h ».

## Décisions / arbitrages MVP

| Sujet | Décision v0.7 | Pourquoi |
|---|---|---|
| Sources des références | Bibliothèque 180° uniquement | Le pipeline de curation est la valeur ; l'upload viendra après |
| Export PDF | CSS print sur la vue publique | react-pdf/html2canvas = poids + rendu fragile ; le print navigateur est fidèle et zéro dépendance |
| Lien public | Token opaque révocable, pas d'expiration | Simple ; la révocation couvre le besoin de contrôle |
| Moodboard libre (drag & drop canvas) | Hors scope v0.7 | L'éditeur ordonné + notes couvre le JTBD pitch ; le canvas est une v2 |

## Questions ouvertes pour la session JTBD (à passer avec une vraie Léa)

1. Le client final lit-il sur mobile ou desktop ? (impacte la mise en page publique)
2. Une intention par projet, ou par section (intro / corps / outro) ?
3. Le treatment doit-il montrer les vidéos lisibles (embed) ou les thumbnails suffisent ?
4. Combien de références dans un treatment réel ? (calibre la limite, posée à 20)
5. Le PDF est-il vraiment nécessaire si le lien existe ? (beaucoup de pros n'envoient que le lien)
