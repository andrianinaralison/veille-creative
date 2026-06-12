# Audit UI/UX — Parcours d'ingestion de référence
**Marie (Product Designer 180°)**
7 juin 2026 · Code source : `CurationPage.jsx`, `AdminLayout.jsx`, `ReferencesAdminPage.jsx`

> Verdict global : **GO conditionnel** — le parcours est cohérent avec le design system et fluide sur le happy path. Trois problèmes fonctionnels bloquants à corriger avant de considérer v0.5 comme livrée.

---

## Parcours rejoué (point de vue Andri, curateur)

```
AdminLayout (topbar)
  └─ /admin/curation
       ├─ phase:idle → tabs Créateurs | Liens manuels
       │    └─ CreatorsTab → liste créateurs + form ajout + FilterRulesPanel
       ├─ phase:running → MonitoringView (polling)
       └─ phase:results
            ├─ TriageView (si refs TRIAGE > 0)  ← parcours principal
            └─ ResultsTable (fallback liens manuels)
```

Aller-retours comptés sur le parcours cible (scan → lot propre) : **6 actions minimum** (choisir créateur → Scrapper → attendre → trier une à une ou bulk → compteur 0 → cliquer "Qualifier →"). C'est raisonnable.

---

## 🔴 Bloquants — à corriger avant merge

### B1 · `ALLOWED_TAGS` dans `CurationPage.jsx` ≠ taxonomie Claude (ligne 31-37)

Le `TagEditor` de la `TriageView`/`ResultsTable` propose 32 tags codés en dur (`Sony-FX3`, `slow-motion`, `mariage`…) qui ne correspondent pas à la taxonomie 18 axes utilisée par Claude à l'enrichissement (18 dimensions, ~130 slugs dans `admin-curation-context.md`).

**Conséquence** : quand Claude enrichit une ref avec `colorimetrie: teal-orange`, l'admin ne peut pas corriger ce tag via l'éditeur — il ne l'y trouve pas. Il doit le taper en custom, sans validation de format. Les corrections manuelles créent des tags hors-taxonomie non retrouvables par le smart search.

**Correction** : importer `TAXONOMY` depuis `config/taxonomy.js` (ticket T-05) dans `TagEditor`, grouper par dimension, remplacer la liste plate par des groupes collapsibles (ou au moins par la liste complète).

---

### B2 · Impossible de retrouver une session en cours après navigation

`phase` est un état local de `CurationPage`. Si Andri quitte `/admin/curation` pendant un scan (pour aller sur `/admin/references`), l'état passe à `idle` au retour. Le point pulsant dans la topbar navigue bien vers `/admin/curation` mais réinitialise la page — aucun moyen de reprendre le monitoring.

**Scénario réel** : scan de 50 refs en cours (45s) → Andri clique sur "Références" pour checker quelque chose → revient → voit l'interface vide, pas le monitoring. Il ne sait pas si le scan est fini ou plante.

**Correction** : au chargement de `CurationPage`, vérifier si une session est `RUNNING` ou `COMPLETED` récente (< 5 min) via `GET /api/v1/ingestion/sessions?status=RUNNING` (déjà appelé dans `AdminLayout`) et restaurer la phase correspondante.

---

### B3 · Endpoint NL search (`/api/v1/admin/search`) probablement inexistant

`TriageView` appelle `POST /api/v1/admin/search` avec `{ query, status: 'TRIAGE', sessionId }`. Cet endpoint n'est pas documenté dans `admin-curation-context.md` parmi les routes existantes. L'erreur est silencieusement catchée (`console.error`).

**Conséquence** : le bouton "Filtrer" affiche "…" puis revient à "Filtrer" sans résultats — sans message d'erreur visible. L'admin pense que sa recherche est vide, pas que la feature est cassée.

**Correction** : (1) Vérifier/implémenter l'endpoint. (2) En attendant, afficher un message d'erreur visible si la réponse est non-OK.

---

## 🟠 Majeurs — à corriger avant v0.5

### M1 · `confirm()` natif pour suppression d'un créateur

`handleDelete` utilise `window.confirm('Supprimer ce créateur ?')`. Dialog natif du browser : gris système, pas stylisé, casse la charte dark cinema, et bloquant (freeze le thread UI).

**Correction** : remplacer par un pattern inline — ligne du créateur passe en état "Confirmer ?" avec deux boutons "Oui, supprimer" / "Annuler" dans la même rangée. Pattern identique au "Rejeter" dans `TriageCard`.

---

### M2 · MonitoringView : polling à 1s (documentation dit 2s)

`setInterval(poll, 1000)` dans `MonitoringView`. Pour un scan de 60 refs (60s de traitement), cela génère ~60 requêtes GET. La documentation (`admin-curation-context.md`) indique 2s. Incohérence, et charge inutile.

**Correction** : passer à `2000` ms. Ajouter un backoff exponentiel si souhaité (2s → 3s → 5s après 30s sans changement).

---

### M3 · Aucun feedback si `startScan()` échoue

```js
catch (err) { console.error(err); setScanning(null) }
```

Si le serveur renvoie 500 ou si le réseau coupe pendant le lancement, `scanning` repasse à `null` et rien ne s'affiche. Andri voit le bouton "Scrapper" se dégriser sans comprendre ce qui s'est passé.

**Correction** : stocker l'erreur dans un état local et l'afficher sous le bouton (pattern déjà utilisé dans `LinksTab` : `{error && <p ...>Erreur — {error}</p>}`).

---

### M4 · `RefRow` : modifications non sauvées pas suffisamment signalées

Dans la vue qualification (`ResultsTable`), changer tags + section + statut sur 3 lignes différentes et naviguer ailleurs sans sauver = perte silencieuse de données. Le bouton "Sauver" change bien d'état mais dans une table dense de 50 lignes, les lignes modifiées se fondent dans la masse.

**Correction** : ajouter une teinte subtile sur la `<tr>` quand `isDirtyLocal === true` (`bg-surface-raised` ou une bordure gauche `border-l-2 border-ink-muted`). Pattern courant dans les tables admin.

---

### M5 · `ResultsTable` sans pagination — problème à 200+ refs

`session.references` est chargé en entier dans `completedSession`. Pour une session Creator Scan qui retourne 200 refs, l'arbre DOM contient 200 lignes avec `TagEditor`, `SectionSelector`, `StatusDropdown` chacune — soit ~600 composants React contrôlés. Scroll laggy, First Input Delay élevé.

**Correction** : pagination côté serveur (50/page) avec `GET /api/v1/ingestion/sessions/:id?page=X`, ou virtualisation de liste (react-window). Pour v0.5, la pagination simple suffit.

---

### M6 · `FilterRulesPanel` : seulement 2 types de règles

Options disponibles : "Titre contient" et "Chaîne contient". Manquent les cas les plus courants remontés en discovery :
- Durée < N secondes (pour affiner le filtre 3 min)
- Tag contient (ex : exclure tous les BTS d'un créateur)

**Correction** : ajouter `duration_max` (champ numérique en secondes) et `tag_contains` comme types de règle. Peut être une v2 des règles — noter dans le ticket #180-30.

---

## 🟡 Cosmétiques — backloggables

### C1 · "Set Live" / "Make a change" en anglais dans l'AdminLayout

La topbar contient deux labels anglais dans une interface par ailleurs intégralement française. Incohérent.

**Correction** : "Set Live" → "Mettre en ligne", "Make a change" → "Aucun changement" (label inactif).

---

### C2 · Poids visuel identique entre "Tout garder" et "Tout rejeter"

Dans `TriageView`, les deux actions bulk ont le même traitement visuel (sauf légère différence de couleur de border). "Tout rejeter" est une action destructive — elle mérite une hiérarchie moindre.

**Correction** : "Tout garder (N)" = `bg-ink text-canvas` (primaire). "Tout rejeter (N)" = `border-surface-border text-ink-muted` (secondaire). Déjà le cas en fait — vérifier que ce différentiel est suffisamment lisible sur écran sombre.

---

### C3 · `TagEditor` (CurationPage) : pas de fermeture sur `Escape`

Le dropdown de tags s'ouvre au clic mais n'écoute pas `Escape`. Utilisateurs clavier bloqués.

```js
// À ajouter dans l'useEffect du TagEditor
const handleKey = e => { if (e.key === 'Escape') setOpen(false) }
document.addEventListener('keydown', handleKey)
```

---

### C4 · `TriageCard` : boutons sans `aria-label` contextualisé

```html
<button>Garder</button>
<button>Rejeter</button>
```

Pour un lecteur d'écran : "Garder, bouton" sans savoir de quelle vidéo il s'agit.

**Correction** : `aria-label={`Garder — ${r.title}`}` et `aria-label={`Rejeter — ${r.title}`}`.

---

### C5 · `MonitoringView` : pas de région ARIA live

Le compteur "Trouvées / Sauvegardées" se met à jour toutes les secondes mais n'est pas déclaré comme région live pour les lecteurs d'écran.

**Correction** : `<div aria-live="polite" aria-atomic="true">` autour des compteurs.

---

### C6 · `TriageView` : placeholder NL search ambigu

`placeholder="Recherche NL — ex: « vlogs perso de cette chaîne »"` ne précise pas que la recherche est limitée aux refs du lot en cours. L'admin pourrait croire chercher dans toute la bibliothèque.

**Correction** : `placeholder="Filtrer ce lot — ex: « vlogs perso de cette chaîne »"` ou un label au-dessus du champ.

---

### C7 · Tabs Créateurs / Liens manuels : état form réinitialisé au switch

Ouvrir le form d'ajout → changer d'onglet → revenir → form fermé, données perdues.

**Correction** : remonter l'état `showForm` + `form` dans `CurationPage` plutôt que dans `CreatorsTab`. Effort : S.

---

## Résumé priorisé

| # | Sévérité | Localisation | Action |
|---|---|---|---|
| B1 | 🔴 Bloquant | `ALLOWED_TAGS` CurationPage.jsx:31 | Brancher `config/taxonomy.js` |
| B2 | 🔴 Bloquant | `CurationPage` phase local state | Restaurer session au chargement |
| B3 | 🔴 Bloquant | `TriageView` NL search | Vérifier endpoint + afficher erreur |
| M1 | 🟠 Majeur | `handleDelete` CreatorsTab.jsx | Confirmer inline |
| M2 | 🟠 Majeur | `MonitoringView` setInterval | 1000 → 2000 ms |
| M3 | 🟠 Majeur | `startScan` catch | Afficher erreur utilisateur |
| M4 | 🟠 Majeur | `RefRow` dirty state | Highlight ligne modifiée |
| M5 | 🟠 Majeur | `ResultsTable` no pagination | Pagination 50/page |
| M6 | 🟠 Majeur | `FilterRulesPanel` | Ajouter `duration_max` + `tag_contains` |
| C1 | 🟡 Cosmétique | `AdminLayout` topbar | "Set Live" → FR |
| C2 | 🟡 Cosmétique | `TriageView` bulk buttons | Vérifier différentiel visuel |
| C3 | 🟡 Cosmétique | `TagEditor` | Écouter `Escape` |
| C4 | 🟡 Cosmétique | `TriageCard` buttons | `aria-label` contextualisé |
| C5 | 🟡 Cosmétique | `MonitoringView` counters | `aria-live="polite"` |
| C6 | 🟡 Cosmétique | `TriageView` search placeholder | Clarifier scope |
| C7 | 🟡 Cosmétique | Tabs state | Remonter `showForm` + `form` |

---

## Points forts à conserver

- **Design system impeccablement respecté** : `font-mono` / `font-editorial` / tokens dark cinema cohérents partout, zéro bouton arrondi, densité admin assumée.
- **`TriageView` empty state contextuel** : 4 cas distincts (trié manuellement / Shorts filtrés / règles trop larges / déjà publiées) avec messages précis et CTA adaptés — excellent pattern.
- **`MonitoringView` minimaliste et lisible** : compteurs éditoriaux (chiffre géant + label mono), point pulsant discret. Dans le bon ton.
- **`FilterRulesPanel` inline** : le pattern "se déplie sous la ligne" sans modal est parfait pour la densité admin.
- **`StatusDropdown` avec micro-signaux couleur** : PUBLISHED = text-ink fort, REJECTED = text-ink-faint — hiérarchie claire sans couleur vive.

---

## Audit live — Parcours réel @tobifilmsofficial
**Marie (Product Designer 180°) · 7 juin 2026 · Session 578be935**

Test end-to-end complet : ajout créateur → scan → MonitoringView → TriageView → NL search → navigation → FilterRulesPanel.

### Étapes jouées

| Étape | Résultat | Durée observée |
|---|---|---|
| Form ajout créateur (Tobi Films, YT @tobifilmsofficial) | ✅ Validation chip immédiate, champ contextuel apparaît au choix de source | < 5s |
| Clic AJOUTER → transition MonitoringView | ✅ Transition instantanée, session ID visible, "EN COURS..." + carré pulsant | instantané |
| Scan en cours : TROUVÉES=0 → 18 | ✅ Compteur monte en temps réel (polling 1s) | ~10s |
| Transition MonitoringView → TriageView | ✅ Automatique à la fin du scan | automatique |
| TriageView : "8 À TRIER" en serif géant | ✅ Compteur centré, lisible, bonne prise d'information | — |
| GARDER card 1 | ✅ Card disparaît, compteur 8→7, "SET LIVE" s'allume dans la topbar | < 1s |
| REJETER card 2 | ✅ Card disparaît, compteur 7→6, grille repaquetée | < 1s |
| NL search "mariage Asie" → FILTRER | ❌ **B3 CONFIRMÉ** : console `{"error":"Erreur serveur"}`, grille inchangée, 0 feedback visible | — |
| Navigation `/admin/references` → retour `/admin/curation` | ❌ **B2 CONFIRMÉ** : phase reset à idle, 6 refs restantes inaccessibles | — |
| RÈGLES (FilterRulesPanel) | ✅ Panel inline, 2 types : "Titre contient" + "Chaîne contient" — **M6 CONFIRMÉ** | — |

### Confirmations live des findings code

- **B2** ✅ Confirmé : navigation = perte de session. Les 6 refs non triées sont toujours en base (`TRIAGE`) mais invisibles. L'admin doit retrouver sa session manuellement — aucun CTA de reprise.
- **B3** ✅ Confirmé : `POST /api/v1/admin/search` retourne `{"error":"Erreur serveur"}`. Le bouton FILTRER ne montre aucun état de chargement, aucun message d'erreur. L'admin voit le grid inchangé et ne sait pas si la recherche a échoué.
- **M6** ✅ Confirmé : FilterRulesPanel expose 2 types uniquement (radio inline). Pas de `duration_max`, pas de `tag_contains`.

### Nouveaux constats live (non détectés à la lecture du code)

**L1 — Compteur "À TRIER" absent du viewport pendant le tri**

Le grand nombre serif scrolle hors champ au premier scroll vers les cards. La barre NL search est sticky, pas le compteur. Après 3-4 décisions, l'admin perd le signal de complétude — il ne sait plus combien il en reste sans remonter en haut.

**Correction** : rendre le compteur sticky (au-dessus de la NL search), ou dupliquer le nombre dans la barre sticky. Effort : XS.

---

**L2 — Bouton FILTRER sans état de chargement**

Le bouton NL search ne change pas de label pendant la requête (devrait passer à "..." comme le bouton "SCRAPPER" pendant le scan). L'utilisateur appuie, rien ne se passe visuellement — il peut croire que son clic n'a pas été enregistré et cliquer à nouveau.

**Correction** : `setFiltering(true)` → label "..." pendant l'appel async. Pattern déjà en place sur `startScan()`. Effort : XS.

---

**L3 — `isDirty` non mis à jour par les actions de tri**

Après GARDER/REJETER, "SET LIVE" apparaît dans la topbar (isDirty=true). Après navigation et retour, la topbar montre "MAKE A CHANGE" (isDirty=false). Le store Zustand semble réinitialisé ou les actions de tri ne mettent pas à jour `isDirty` de façon persistante.

Conséquence : l'admin peut croire que ses décisions de tri ne nécessitent pas de "publish" alors qu'il a 1 ref PUBLISHED et 1 REJECTED en base.

**Correction** : vérifier le comportement de `isDirty` dans `useAdminStore` après les appels PATCH de tri.

---

**L4 (positif) — Flow ajout → scan : zéro friction**

Le form ne demande que l'essentiel (nom + source + handle). Le clic AJOUTER déclenche immédiatement le scan sans étape intermédiaire. La transition vers MonitoringView est instantanée. C'est le happy path le plus fluide du parcours — à protéger.

---

**L5 (positif) — Grille 5 colonnes et repaquetage**

Après GARDER ou REJETER, la grille se repaquete automatiquement sans rechargement. L'animation n'est pas explicite (pas de transition de position) mais la continuité perceptuelle reste bonne sur un lot de 8 cards. Sur 50+ cards, le repaquetage pourrait désorienner.

### Synthèse qualitative (vue d'ensemble)

Le parcours est **opérationnel et fluide sur le happy path** (ajout → scan → tri unitaire). Les vignettes YouTube sont belles, les titres lisibles, le design system dark cinema tenu à 100%. 

Les 3 bloquants confirmés live (B2, B3 + B1 détectable dès qu'on taguerait une ref) sont réels mais discrets en test sur un petit lot (8 refs). Ils deviendront critiques à l'échelle (50 refs, 3 créateurs en parallèle, navigation multi-onglets). **Ils doivent être corrigés avant d'augmenter le volume de curation.**

Les 2 nouveaux constats live prioritaires (L1 compteur sticky, L2 spinner FILTRER) sont des efforts XS à intégrer dans les mêmes tickets que B3/B2.
