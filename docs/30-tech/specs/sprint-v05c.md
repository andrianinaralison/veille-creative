# Spec technique — Sprint v0.5C

> Rédigé le 7 juin 2026 · Basé sur la lecture du code source + audit live `@tobifilmsofficial`.
> Pour chaque ticket : état actuel du code → diagnostic → implémentation précise → test de validation.

---

## Sprint S — Indépendants

### 180-41 · B3 🔴 `POST /api/v1/admin/search` retourne 500

**Fichier principal :** `server/src/services/search.service.js`

#### Diagnostic

La route `admin-search.route.js` appelle `extractSearchFilters(query)` qui fait un appel Anthropic. Le catch renvoie 500. Trois suspects par ordre de probabilité :

**Suspect #1 — `ttl: '1h'` dans `cache_control` (très probable)**

```js
// search.service.js ligne 99 — ACTUEL
cache_control: { type: 'ephemeral', ttl: '1h' },
```

Le champ `ttl` est une feature bêta Anthropic qui exige le header `anthropic-beta: extended-cache-ttl-2025-04-11`. Sans ce header, l'API répond `400 BadRequest`. Le SDK lance une exception, le catch dans `admin-search.route.js` la transforme en `500 Erreur serveur`.

> La route publique `search.route.js` utilise le même `search.service.js` — vérifier si elle fonctionne pour isoler.

**Suspect #2 — Clé API non injectée sur Railway**

`client = new Anthropic()` lit `ANTHROPIC_API_KEY` au démarrage. Si la variable n'est pas dans Railway → `401 AuthenticationError` → catch → 500.

**Suspect #3 — Version SDK incompatible avec `output_config.format`**

`output_config.format` avec `json_schema` est une feature récente. Vérifier la version du SDK installée.

```bash
# Dans server/
grep '"@anthropic-ai/sdk"' package.json
```

#### Implémentation

**Fix #1 (à faire en premier)** — Supprimer le champ `ttl` ou ajouter le header beta.

Option A — retirer `ttl` (simple, TTL par défaut = 5 min, suffisant) :

```js
// server/src/services/search.service.js
// AVANT
cache_control: { type: 'ephemeral', ttl: '1h' },

// APRÈS
cache_control: { type: 'ephemeral' },
```

Option B — activer le TTL long avec le header beta (si les sessions admin durent > 5 min) :

```js
// server/src/services/search.service.js
const client = new Anthropic({
  defaultHeaders: {
    'anthropic-beta': 'extended-cache-ttl-2025-04-11',
  },
});
```

**Fix #2 — Améliorer le logging pour debug futur**

```js
// admin-search.route.js — remplacer le catch
} catch (err) {
  console.error('[admin-search] POST / — type:', err.constructor.name, '— message:', err.message);
  if (err.status) console.error('[admin-search] status HTTP Anthropic:', err.status);
  res.status(500).json({ error: 'Erreur serveur', ...(process.env.NODE_ENV !== 'production' && { detail: err.message }) });
}
```

#### Checklist de validation

- [ ] Ouvrir les logs Railway pendant le test : `railway logs --tail`
- [ ] Depuis TriageView → saisir « vlogs de cette chaîne » → cliquer FILTRER → réponse ≠ 500
- [ ] Vérifier dans les logs que `cache_creation_tokens` ou `cache_read_tokens` apparaissent (preuve que le prompt caching fonctionne)
- [ ] Tester avec une requête invalide (`query` vide) → doit retourner `400`, pas `500`

---

### 180-40 · B2 🔴 Session RUNNING perdue au refresh

**Fichier :** `veille-creative/src/pages/admin/CurationPage.jsx`

#### Diagnostic

`CurationPage` gère la phase avec `useState('idle')`. Au refresh, React repart de `'idle'`, `sessionId` est `null`, et le monitoring s'arrête silencieusement. L'endpoint pour récupérer une session en cours existe côté backend :

```
GET /api/v1/ingestion/sessions?status=RUNNING&limit=1
```

Réponse : `{ sessions: [{ id, status, totalFound, totalSaved, ... }] }`

#### Implémentation

Ajouter un `useEffect` de recovery au montage du composant principal `CurationPage`. S'il trouve une session `RUNNING`, il bascule directement en phase `'running'`.

```jsx
// CurationPage.jsx — dans export default function CurationPage()
// Ajouter après les useState existants (ligne ~1115)

// ─── Recovery session RUNNING ──────────────────────────────────────────────
useEffect(() => {
  // Ne tenter la recovery que si on est en état idle (pas déjà en cours)
  if (phase !== 'idle') return

  apiFetch(`${ING_API}/sessions?status=RUNNING&limit=1`)
    .then(data => {
      const running = data.sessions?.[0]
      if (running) {
        setSessionId(running.id)
        setScanLabel('Session reprise')
        setPhase('running')
      }
    })
    .catch(err => console.warn('[CurationPage] recovery check failed:', err))
}, []) // eslint-disable-line react-hooks/exhaustive-deps
// [] intentionnel : on ne veut vérifier qu'une fois, au montage
```

> **Pourquoi `[]` et pas `[phase]`** : si on met `[phase]`, l'effet se redéclenche chaque fois que `phase` change, y compris quand l'admin vient de démarrer un scan → boucle. Le `if (phase !== 'idle')` protège dans les autres cas.

#### Checklist de validation

- [ ] Démarrer un scan → attendre que le monitoring s'affiche → F5 → le monitoring doit reprendre automatiquement
- [ ] Ouvrir `/admin/curation` depuis un autre onglet pendant qu'un scan tourne → monitoring doit s'afficher
- [ ] Ouvrir `/admin/curation` sans scan en cours → phase reste `'idle'`, aucun appel inutile (vérifier Network DevTools)
- [ ] Un scan terminé ne doit pas être récupéré (status `COMPLETED` ≠ `RUNNING`)

---

### 180-42 · L1/L2 🟣 Sticky header + état chargement FILTRER

**Fichiers :** `CurationPage.jsx` — composants `MonitoringView` et `TriageView`

#### L1 — Sticky header MonitoringView

**Diagnostic :** Quand un scan produit beaucoup de références, le bloc de statut (`En cours… / Trouvées: 47`) scroll hors du viewport. L'admin perd l'info de contexte.

**Implémentation :** Extraire la topbar de statut dans un bandeau sticky positionné en dehors du conteneur scrollable.

```jsx
// CurationPage.jsx — phase 'running' (ligne ~1180)
// AVANT
{phase === 'running' && sessionId && (
  <div>
    <div className="flex items-center gap-2 mb-6"> ... </div>
    <h1>...</h1>
    <p>Session · {sessionId}</p>
    <MonitoringView sessionId={sessionId} onCompleted={handleCompleted} />
  </div>
)}

// APRÈS — ajouter un bandeau sticky au-dessus du MonitoringView
{phase === 'running' && sessionId && (
  <div>
    {/* Bandeau sticky — reste visible au scroll */}
    <div className="sticky top-0 z-10 bg-canvas border-b border-surface-border -mx-8 px-8 py-3 flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full bg-ink opacity-40" />
          <span className="relative inline-flex h-2 w-2 bg-ink" />
        </span>
        <span className="font-mono text-[10px] tracking-widest uppercase text-ink">
          {scanLabel ? `Scan — ${scanLabel}` : 'Scan en cours'}
        </span>
      </div>
      <span className="font-mono text-[9px] text-ink-faint truncate max-w-xs">{sessionId}</span>
    </div>

    <h1 className="font-editorial text-3xl text-ink mb-2">
      {scanLabel ? `Scan — ${scanLabel}` : 'Récupération en cours'}
    </h1>
    <MonitoringView sessionId={sessionId} onCompleted={handleCompleted} />
  </div>
)}
```

> **Note :** Le `AdminLayout` doit avoir `overflow-y: auto` sur le contenu pour que `sticky` fonctionne. Vérifier `AdminLayout.jsx` — si le container parent a `overflow: hidden`, changer en `overflow-y: auto`.

#### L2 — Spinner bouton FILTRER

**Diagnostic :** Le bouton FILTRER dans `TriageView` change son texte en `…` quand `searching=true` mais n'a pas de `cursor-not-allowed` ni de spinner visuel distinct. Sur connexion lente, l'utilisateur re-clique.

```jsx
// CurationPage.jsx — TriageView, formulaire smart search (ligne ~326)
// AVANT
<button type="submit" disabled={searching}
  className="px-4 py-2 text-[10px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 disabled:opacity-40">
  {searching ? '…' : 'Filtrer'}
</button>

// APRÈS — ajout cursor-not-allowed + aria
<button
  type="submit"
  disabled={searching}
  aria-busy={searching}
  aria-label={searching ? 'Filtrage en cours…' : 'Filtrer'}
  className="px-4 py-2 text-[10px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
>
  {searching
    ? <span className="flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 border border-canvas border-t-transparent rounded-full animate-spin" />
        <span>Filtrage…</span>
      </span>
    : 'Filtrer'
  }
</button>
```

#### Checklist de validation

- [ ] Démarrer un scan avec un créateur ayant > 30 vidéos → scroller vers le bas → le bandeau sticky reste visible en haut
- [ ] Cliquer FILTRER avec une requête NL → le spinner apparaît → le bouton est grisé et `cursor-not-allowed`
- [ ] Accessible : vérifier que le spinner ne crée pas de contenu dupliqué pour le screen reader (`aria-busy` suffit)

---

### 180-43 · M2/M3 🟡 Polling 5 s + error handling réseau

**Fichier :** `veille-creative/src/pages/admin/CurationPage.jsx` — composant `MonitoringView`

#### Diagnostic

```js
// Ligne 473 — ACTUEL
intervalRef.current = setInterval(poll, 1000) // 1 polling/sec = 60 req/min
```

60 requêtes/min pour un scan qui dure 3-5 min = ~270 requêtes inutiles. Sans error handling, si Railway ralentit ou redémarre en cours de scan, la session semble bloquée sans feedback.

#### Implémentation

```jsx
// CurationPage.jsx — MonitoringView, remplacer tout le composant MonitoringView

function MonitoringView({ sessionId, onCompleted }) {
  const [session, setSession]       = useState(null)
  const [netError, setNetError]     = useState(false)   // true = warning banner
  const intervalRef                 = useRef(null)
  const errCountRef                 = useRef(0)          // compteur d'erreurs consécutives

  const POLL_MS      = 5000  // M2 : 5 s au lieu de 1 s
  const WARN_AT      = 3     // 3 erreurs → warning banner
  const STOP_AT      = 10    // 10 erreurs → arrêt polling + message

  const poll = useCallback(async () => {
    try {
      const data = await apiFetch(`${ING_API}/sessions/${sessionId}`)
      errCountRef.current = 0       // reset le compteur sur succès
      setNetError(false)
      setSession(data)
      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        clearInterval(intervalRef.current)
        if (data.status === 'COMPLETED') onCompleted(data)
      }
    } catch (err) {
      errCountRef.current += 1
      console.warn(`[Monitoring] poll error #${errCountRef.current}:`, err)
      if (errCountRef.current >= WARN_AT) setNetError(true)
      if (errCountRef.current >= STOP_AT) {
        clearInterval(intervalRef.current)
        console.error('[Monitoring] polling stopped after', STOP_AT, 'consecutive errors')
      }
    }
  }, [sessionId, onCompleted])

  useEffect(() => {
    poll()
    intervalRef.current = setInterval(poll, POLL_MS)
    return () => clearInterval(intervalRef.current)
  }, [poll])

  const isFailed  = session?.status === 'FAILED'
  const isRunning = session?.status === 'RUNNING' || !session
  const found     = session?.totalFound ?? 0
  const saved     = session?.totalSaved ?? 0
  const isStopped = errCountRef.current >= STOP_AT

  return (
    <div className="border border-surface-border p-8 max-w-lg mt-8">
      {/* Warning réseau */}
      {netError && !isStopped && (
        <div className="mb-4 border border-surface-border px-3 py-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-amber-500 flex-shrink-0" />
          <p className="font-mono text-[9px] tracking-widest uppercase text-ink-muted">
            Connexion instable — nouvelle tentative dans {POLL_MS / 1000} s
          </p>
        </div>
      )}
      {isStopped && (
        <div className="mb-4 border border-surface-border px-3 py-2">
          <p className="font-mono text-[9px] tracking-widest uppercase text-ink-muted">
            Polling interrompu après {STOP_AT} erreurs réseau.{' '}
            <button
              type="button"
              onClick={() => {
                errCountRef.current = 0
                setNetError(false)
                poll()
                intervalRef.current = setInterval(poll, POLL_MS)
              }}
              className="underline hover:text-ink"
            >
              Reprendre
            </button>
          </p>
        </div>
      )}

      {/* Corps inchangé — garder le reste du MonitoringView actuel ici */}
      <div className="flex items-center gap-3 mb-6">
        {isRunning && !isFailed && !isStopped && (
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full bg-ink opacity-40" />
            <span className="relative inline-flex h-2 w-2 bg-ink" />
          </span>
        )}
        <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted">
          {isStopped ? 'Polling interrompu' : isFailed ? 'Échec' : session?.status === 'COMPLETED' ? 'Terminé' : 'En cours…'}
        </p>
      </div>

      <div className="flex gap-8 mb-3">
        <div>
          <p className="font-mono text-[9px] tracking-widest uppercase text-ink-muted mb-1">Trouvées</p>
          <p className="font-editorial text-3xl text-ink">{found}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] tracking-widest uppercase text-ink-muted mb-1">Sauvegardées</p>
          <p className="font-editorial text-3xl text-ink">{saved}</p>
        </div>
      </div>
      <p className="font-mono text-[9px] text-ink-faint mb-4">
        Les vidéos &lt; 3 min (Shorts) sont automatiquement écartées.
      </p>

      {saved > 0 && (
        <div className="border-t border-surface-border pt-4">
          <p className="font-mono text-[9px] tracking-widest uppercase text-ink-muted mb-2">Dernières références</p>
          <div className="flex flex-col gap-2">
            {(session?.references ?? []).slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center gap-2">
                <div className="w-1 h-1 bg-ink flex-shrink-0" />
                <p className="text-[11px] text-ink truncate">{r.title}</p>
              </div>
            ))}
            {saved > 5 && <p className="text-[10px] text-ink-faint font-mono">+{saved - 5} autres…</p>}
          </div>
        </div>
      )}

      {isFailed && (
        <p className="text-[11px] text-ink-muted mt-4 border border-surface-border px-3 py-2">
          {session?.errorMessage ?? 'Erreur inattendue — vérifiez les logs serveur.'}
        </p>
      )}
    </div>
  )
}
```

#### Checklist de validation

- [ ] Démarrer un scan → vérifier dans Network DevTools que les requêtes `/sessions/:id` arrivent toutes les 5 s (pas 1 s)
- [ ] Simuler une erreur réseau (DevTools → Network → Offline pendant 5 s) → le warning bannière apparaît après la 3ᵉ erreur
- [ ] Remettre le réseau → le compteur reset → le warning disparaît
- [ ] Simuler 10 erreurs consécutives → polling s'arrête → bouton "Reprendre" apparaît

---

### 180-47 · Médiathèque admin — accordéon tags

**Fichier :** `veille-creative/src/pages/admin/ReferencesAdminPage.jsx`

#### Diagnostic

```jsx
// ReferencesAdminPage.jsx ligne 603-607 — allTags calculé sans limite
const allTags = (() => {
  const freq = new Map()
  references.forEach(r => (r.tags ?? []).forEach(t => freq.set(t, (freq.get(t) ?? 0) + 1)))
  return [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
})()

// Ligne 669-688 — TOUS les tags rendus en boutons flat
{allTags.map(([tag, n]) => { ... })}
```

Avec 477 références → ~400 tags bruts YouTube → toute la page est submergée avant même la liste.

#### Implémentation

```jsx
// ReferencesAdminPage.jsx

// 1. Ajouter dans export default function ReferencesAdminPage() — après les useState existants
const [tagsOpen, setTagsOpen] = useState(false)

// Lire le param URL ?tag=X pour auto-ouvrir l'accordéon
useEffect(() => {
  const url = new URL(window.location.href)
  const tagFromUrl = url.searchParams.get('tag')
  if (tagFromUrl) {
    setActiveTags([tagFromUrl])
    setTagsOpen(true)
  }
}, [])

// Auto-ouvrir quand un tag devient actif (ex: depuis un autre composant)
useEffect(() => {
  if (activeTags.length > 0) setTagsOpen(true)
}, [activeTags])

// 2. Remplacer le bloc "Filtre par tags" (lignes 668-688)
// AVANT
{!loading && !error && allTags.length > 0 && (
  <div role="group" aria-label="Filtrer par tags" className="flex flex-wrap items-center gap-1.5 mb-6">
    {allTags.map(([tag, n]) => { ... })}
    ...
  </div>
)}

// APRÈS
const TAGS_PREVIEW = 20  // nb de tags visibles quand accordéon fermé

{!loading && !error && allTags.length > 0 && (
  <div className="mb-6">
    {/* Header accordéon */}
    <button
      type="button"
      onClick={() => setTagsOpen(v => !v)}
      className="flex items-center gap-2 mb-2 group"
      aria-expanded={tagsOpen}
    >
      <span className="font-mono text-[9px] tracking-widest uppercase text-ink-muted group-hover:text-ink transition-colors">
        {tagsOpen ? '▾' : '▸'} Tags
      </span>
      <span className="font-mono text-[9px] text-ink-faint">
        {allTags.length} tags
        {activeTags.length > 0 && ` · ${activeTags.length} actif${activeTags.length > 1 ? 's' : ''}`}
      </span>
    </button>

    {/* Tags — affiche les N premiers quand fermé, tous quand ouvert */}
    <div role="group" aria-label="Filtrer par tags" className="flex flex-wrap items-center gap-1.5">
      {(tagsOpen ? allTags : allTags.slice(0, TAGS_PREVIEW)).map(([tag, n]) => {
        const active = activeTags.includes(tag)
        return (
          <button key={tag} onClick={() => toggleTag(tag)} aria-pressed={active}
            className={`px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase border transition-colors ${
              active
                ? 'border-ink text-ink bg-surface-raised'
                : 'border-surface-border text-ink-muted hover:border-ink hover:text-ink'
            }`}>
            {tag}<span className="ml-1 opacity-40">{n}</span>
          </button>
        )
      })}
      {/* Bouton "Voir plus / moins" si besoin */}
      {!tagsOpen && allTags.length > TAGS_PREVIEW && (
        <button
          type="button"
          onClick={() => setTagsOpen(true)}
          className="px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase border border-dashed border-surface-border text-ink-faint hover:text-ink hover:border-ink transition-colors"
        >
          +{allTags.length - TAGS_PREVIEW} autres…
        </button>
      )}
      {tagsOpen && (
        <button
          type="button"
          onClick={() => setTagsOpen(false)}
          className="px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase text-ink-faint hover:text-ink transition-colors underline underline-offset-2"
        >
          Réduire ↑
        </button>
      )}
      {activeTags.length > 0 && (
        <button onClick={() => setActiveTags([])}
          className="px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase text-ink-faint hover:text-ink transition-colors underline underline-offset-2">
          Réinitialiser
        </button>
      )}
    </div>
  </div>
)}
```

#### Checklist de validation

- [ ] Ouvrir `/admin/references` → seulement 20 tags visibles + bouton `+380 autres…`
- [ ] Cliquer le header `▸ Tags` → accordéon s'ouvre, tous les tags visibles
- [ ] Cliquer un tag → l'accordéon s'auto-ouvre (si fermé) et le tag s'active
- [ ] Naviguer vers `/admin/references?tag=mariage` → accordéon ouvert, tag `mariage` actif
- [ ] Réinitialiser → accordéon reste ouvert (mais les filtres sont effacés)

---

## Sprint S+1 — Après wireframe Marie

### 180-44 · B1 🔴 TagEditor groupé par axe taxonomique

**Fichiers :**
- `veille-creative/src/pages/admin/CurationPage.jsx` — `TagEditor` + `ALLOWED_TAGS`
- À créer : `veille-creative/src/config/taxonomy.js`
- `server/src/config/taxonomy.js` — source de vérité (lecture seule)

#### Diagnostic

```js
// CurationPage.jsx lignes 31-37 — PROBLÈME
const ALLOWED_TAGS = [
  'Sony-FX3','Sony-A7SIII','Sony-A1','Canon-C70','Canon-C80','Lumix-S5ii','Lumix-S1','Blackmagic','RED','ARRI',
  'slow-motion','handheld','travelling','drone','stabilisé','anamorphique','BTS',
  // ... 30 tags hardcodés, déconnectés de config/taxonomy.js
]
```

Ces tags sont des anciens noms non normalisés, complètement différents de la taxonomie 180° réelle (qui utilise des slugs comme `sony-a7siii`, `handheld`, `slow-motion`). L'admin tague avec des valeurs qui ne matchent jamais les filtres du smart search.

#### Implémentation

**Étape 1 — Créer `veille-creative/src/config/taxonomy.js`**

```js
// veille-creative/src/config/taxonomy.js
// Miroir structuré de server/src/config/taxonomy.js
// À mettre à jour manuellement si la taxonomie backend change.
// Ne pas importer depuis le backend (pas de partage cross-process).

export const TAXONOMY_AXES = [
  {
    id: 'ambiance',
    label: 'Ambiance',
    tags: [
      'cinématique','épuré','dramatique','romantique','luxe','intime',
      'mélancolique','nostalgique','épique','mystérieux','joyeux','poétique',
      'élégant','sombre','énergique','rêveur','brut','sensuel','sérieux','authentique',
    ],
  },
  {
    id: 'colorimetrie',
    label: 'Colorimétrie',
    tags: [
      'chaud','froid','teal-orange','désaturé','contrasté','pastel',
      'monochrome','film-grain','vintage','moody-dark','natural-light',
      'high-key','low-key','rose-tinted','vert-forêt','sépia',
    ],
  },
  {
    id: 'narration',
    label: 'Narration',
    tags: [
      'émotionnel','rythmé','beat-sync','contemplatif','documentaire','voix-off',
      'non-linéaire','poétique','flashback','jump-cuts','long-takes',
      'slow-burn','punch-cuts','transitions-créatives',
    ],
  },
  {
    id: 'type_contenu',
    label: 'Type de contenu',
    tags: [
      'mariage','corporate','événementiel','publicité-ads','documentaire',
      'court-métrage','clip-musical','portrait','fashion-lifestyle',
      'sport-action','gastronomie','immobilier','travel-voyage','nature','engagement-couple',
    ],
  },
  {
    id: 'camera',
    label: 'Caméra',
    tags: [
      'sony-fx3','sony-fx6','sony-fx9','sony-a7siii','sony-a1','sony-zve1',
      'canon-c70','canon-c300iii','canon-r5c',
      'bmpcc4k','bmpcc6k','bm-ursa',
      'lumix-s5ii','lumix-s1h',
      'red-komodo','red-monstro','arri-alexa',
      'dji-ronin4d','iphone-smartphone','gopro-action',
    ],
  },
  {
    id: 'technique_tournage',
    label: 'Technique',
    tags: [
      'handheld','gimbal-stabilisé','trépied','drone-aérien','fpv',
      'steadicam','slider','jib-grue','sous-marin','caméra-embarquée',
      'macro','timelapse','hyperlapse','slow-motion','double-exposition','tilt-shift','360',
    ],
  },
  {
    id: 'mouvement_camera',
    label: 'Mouvement caméra',
    tags: [
      'statique','panoramique','travelling-avant','travelling-arrière','travelling-latéral',
      'push-in','pull-out','rotation','plongée','contre-plongée',
      'dutch-angle','low-angle','high-angle','crane-up','crane-down',
      'zoom-optique','dézoom',
    ],
  },
  {
    id: 'eclairage',
    label: 'Éclairage',
    tags: [
      'natural-light','golden-hour','blue-hour','midi-lumière-dure','nuit-low-light',
      'contre-jour','backlight','studio','softbox','lumière-dure','fenêtre',
      'feu-flamme','néon-led-coloré','high-key','low-key','practicals',
      'haze-fumée','silhouette','sous-exposé-intentionnel',
    ],
  },
  {
    id: 'lieu',
    label: 'Lieu',
    tags: [
      'intérieur','extérieur','urbain','campagne','montagne','mer-plage',
      'forêt','désert','château-domaine','loft-industriel','église',
      'salle-réception','rooftop','studio','destination-international','jardin','sous-marin',
    ],
  },
  {
    id: 'post_production',
    label: 'Post-prod',
    tags: [
      'film-grain','light-leaks-flares','transitions-morphing','split-screen',
      'texte-titrage','vfx-léger','color-grading-prononcé','lut-cinéma',
      'letterbox-animé','glitch','double-exposition','slow-ramp',
    ],
  },
]

// Tous les slugs valides — pour validation rapide
export const ALL_VALID_TAGS = TAXONOMY_AXES.flatMap(a => a.tags)
```

**Étape 2 — Remplacer `TagEditor` dans `CurationPage.jsx`**

```jsx
// CurationPage.jsx
// Supprimer ALLOWED_TAGS (lignes 31-37)
// Ajouter import
import { TAXONOMY_AXES } from '../../config/taxonomy.js'

// Remplacer le composant TagEditor (lignes 41-88)
function TagEditor({ tags, onChange }) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const [activeAxis, setActiveAxis] = useState(null) // id de l'axe déplié
  const ref = useRef(null)

  // Fermer au clic extérieur
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Fermer à Escape
  useEffect(() => {
    if (!open) return
    const h = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open])

  const toggle = tag => onChange(tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag])

  const addCustom = () => {
    const v = custom.trim().toLowerCase().replace(/\s+/g, '-')
    if (v && !tags.includes(v)) onChange([...tags, v])
    setCustom('')
  }

  return (
    <div ref={ref} className="relative">
      {/* Tags sélectionnés + bouton ouvrir */}
      <div className="flex flex-wrap gap-1 min-h-[24px]">
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase text-ink border border-surface-border px-1.5 py-0.5">
            {t}
            <button type="button" onClick={() => toggle(t)} className="text-ink-faint hover:text-ink transition-colors leading-none">×</button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="font-mono text-[9px] tracking-widest uppercase text-ink-muted hover:text-ink border border-dashed border-surface-border px-1.5 py-0.5 transition-colors"
        >
          + tag
        </button>
      </div>

      {/* Dropdown groupé par axe */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-surface border border-surface-border shadow-xl w-80 max-h-96 overflow-y-auto">

          {/* Axes — liste verticale */}
          {TAXONOMY_AXES.map(axis => (
            <div key={axis.id} className="border-b border-surface-border last:border-0">
              {/* Header axe — clic pour déplier/replier */}
              <button
                type="button"
                onClick={() => setActiveAxis(activeAxis === axis.id ? null : axis.id)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface-raised transition-colors"
              >
                <span className="font-mono text-[9px] tracking-widest uppercase text-ink-muted">
                  {axis.label}
                </span>
                <span className="font-mono text-[9px] text-ink-faint">
                  {/* Badge : nb de tags sélectionnés dans cet axe */}
                  {axis.tags.filter(t => tags.includes(t)).length > 0 && (
                    <span className="border border-ink text-ink px-1 mr-1">
                      {axis.tags.filter(t => tags.includes(t)).length}
                    </span>
                  )}
                  {activeAxis === axis.id ? '▾' : '▸'}
                </span>
              </button>

              {/* Tags de l'axe — visibles seulement si axe actif */}
              {activeAxis === axis.id && (
                <div className="flex flex-wrap gap-1 px-3 pb-3">
                  {axis.tags.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggle(t)}
                      className={`font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5 border transition-colors ${
                        tags.includes(t)
                          ? 'border-ink text-ink bg-surface-raised'
                          : 'border-surface-border text-ink-muted hover:border-ink hover:text-ink'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Tag custom — toujours en bas */}
          <div className="flex gap-1 p-3 border-t border-surface-border bg-canvas sticky bottom-0">
            <input
              value={custom}
              onChange={e => setCustom(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
              placeholder="Tag custom (hors taxonomie)…"
              className="flex-1 bg-surface border border-surface-border text-ink text-[10px] font-mono px-2 py-1 outline-none focus:border-ink placeholder-ink-faint"
            />
            <button
              type="button"
              onClick={addCustom}
              disabled={!custom.trim()}
              className="px-2 py-1 text-[10px] font-mono bg-ink text-canvas hover:opacity-80 disabled:opacity-30 transition-opacity"
            >↵</button>
          </div>
        </div>
      )}
    </div>
  )
}
```

> **Note sur `ReferencesAdminPage.jsx`** : Ce fichier a son propre `TagEditor` (lignes 53-90), plus simple, utilisé dans la modale. Celui-là n'a pas de dropdown — il accepte du texte libre. Il n'est **pas** concerné par 180-44 (il ne sert qu'à l'édition inline, pas à la qualification de référence). Si Marie souhaite étendre la taxonomie groupée à la modale aussi, c'est une décision de design à prendre en S+1.

#### Checklist de validation

- [ ] Ouvrir la vue Tri (TriageView) → cliquer `+ tag` sur une référence → dropdown s'ouvre avec les 10 axes
- [ ] Cliquer sur "Caméra" → les tags de caméra s'affichent, les autres axes restent fermés
- [ ] Sélectionner `sony-a7siii` → tag apparaît dans la ligne, badge `1` s'affiche sur l'axe Caméra
- [ ] Appuyer Escape → dropdown se ferme
- [ ] Cliquer en dehors → dropdown se ferme
- [ ] Sauvegarder → PATCH `/admin/references/:id` avec les bons slugs normalisés

---

### 180-45 · M1/M4 🟡 Confirmation inline publication + dirty indicator

**Fichier :** `veille-creative/src/pages/admin/CurationPage.jsx` — composant `RefRow`

#### M4 — Dirty indicator (orange dot)

**Diagnostic :** `isDirtyLocal` est calculé (ligne 373) mais pas visualisé. L'admin oublie des lignes non sauvées.

```jsx
// CurationPage.jsx — RefRow, modifier le <tr>
// AVANT
<tr className="border-b border-surface-border hover:bg-surface-raised transition-colors group">

// APRÈS — ajouter l'indicateur visuel
<tr className={`border-b border-surface-border hover:bg-surface-raised transition-colors group ${isDirtyLocal ? 'border-l-2 border-l-amber-600' : ''}`}>
```

Et dans la cellule bouton Sauver, ajouter le dot :

```jsx
// Cellule bouton Sauver — avant le <button>
<td className="p-2 w-24">
  <div className="flex items-center gap-1.5">
    {isDirtyLocal && (
      <span
        className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"
        title="Modifications non sauvegardées"
        aria-label="Modifications non sauvegardées"
      />
    )}
    {saved ? (
      <span className="font-mono text-[9px] tracking-widest uppercase text-ink-muted" role="status">✓ Enreg.</span>
    ) : (
      <button ...>{saving ? '…' : 'Sauver'}</button>
    )}
  </div>
</td>
```

#### M1 — Confirmation inline avant publication

**Diagnostic :** Cliquer `StatusDropdown → Publier` puis `Sauver` publie immédiatement. Sur 100 lignes en bulk, il est facile de publier un contenu non qualifié par erreur.

```jsx
// CurationPage.jsx — RefRow, modifier handleSave
// Ajouter un state de confirmation
const [confirmPublish, setConfirmPublish] = useState(false)
const confirmTimeoutRef = useRef(null)

async function handleSave() {
  if (saving) return

  // Si le status passe à PUBLISHED et qu'on n'a pas encore confirmé → intercepter
  if (status === 'PUBLISHED' && ref.status !== 'PUBLISHED' && !confirmPublish) {
    setConfirmPublish(true)
    // Auto-annuler la confirmation après 3 s (retour à l'état normal)
    confirmTimeoutRef.current = setTimeout(() => setConfirmPublish(false), 3000)
    return
  }

  // Nettoyer le timeout si l'admin a cliqué Sauver une 2ème fois
  clearTimeout(confirmTimeoutRef.current)
  setConfirmPublish(false)

  setSaving(true)
  try {
    const patch = { tags }
    if (status !== ref.status) patch.status = status
    if (sectionId !== (ref.sectionId ?? null)) patch.sectionId = sectionId ?? null
    await apiFetch(`${ADMIN_API}/references/${ref.id}`, { method: 'PATCH', body: JSON.stringify(patch) })
    markDirty()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onSaved?.({ ...ref, tags, sectionId, status })
  } catch (err) {
    console.error('[RefRow] save error', err)
  } finally {
    setSaving(false)
  }
}

// Dans le rendu du bouton Sauver :
{saved ? (
  <span ...>✓ Enreg.</span>
) : confirmPublish ? (
  // Confirmation inline — s'auto-annule en 3 s
  <button
    type="button"
    onClick={handleSave}
    className="px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase border border-ink bg-ink text-canvas hover:opacity-80 animate-pulse"
    aria-live="polite"
  >
    Confirmer ?
  </button>
) : (
  <button
    type="button"
    onClick={handleSave}
    disabled={saving || !isDirtyLocal}
    className={...}
  >
    {saving ? '…' : 'Sauver'}
  </button>
)}
```

#### Navigation guard (M4 — complément)

```jsx
// CurationPage.jsx — dans le composant ResultsTable
// Ajouter un useEffect pour prévenir la navigation avec des modifications non sauvées
// (uniquement si l'admin a des refs dirty dans la table)

// Dans RefRow, exposer isDirtyLocal via un callback
// Dans ResultsTable, tracker les dirty IDs
const [dirtyIds, setDirtyIds] = useState(new Set())

// Dans le onSaved de chaque RefRow → retirer l'ID du Set
// Dans le onChange tags/section/status de chaque RefRow → ajouter l'ID au Set

// Guard global
useEffect(() => {
  const handler = e => {
    if (dirtyIds.size > 0) {
      e.preventDefault()
      e.returnValue = '' // Chrome exige ce pattern
    }
  }
  window.addEventListener('beforeunload', handler)
  return () => window.removeEventListener('beforeunload', handler)
}, [dirtyIds])
```

> **Simplification acceptable :** si le tracking inter-composants est trop lourd pour S+1, implémenter uniquement le dot indicator (M4) et la confirmation inline (M1). Le navigation guard peut être reporté en polish.

#### Checklist de validation

- [ ] Modifier les tags d'une ligne → dot orange apparaît, bordure gauche ambrée
- [ ] Changer status → PUBLISHED puis cliquer Sauver → bouton "Confirmer ?" apparaît (pulsé)
- [ ] Ne rien faire pendant 3 s → bouton revient à "Sauver" (annulation auto)
- [ ] Cliquer "Confirmer ?" → la ref est publiée, dot disparaît
- [ ] Modifier plusieurs lignes puis tenter de naviguer → dialog natif "modifications non sauvegardées"

---

### 180-46 · M5/M6 🟡 Pagination table + `duration_max` FilterRules

#### M5 — Pagination côté serveur

**Fichiers :** `server/src/routes/references.route.js` + `veille-creative/src/pages/admin/ReferencesAdminPage.jsx`

**Diagnostic :**

```js
// references.route.js ligne 12 — actuel
const { sectionId, limit = '200', offset = '0' } = req.query;

// ReferencesAdminPage.jsx ligne 553 — actuel
const p = new URLSearchParams({ limit: '2000' })
```

Le frontend charge 2000 refs en une seule requête. Avec 477 refs × payload (title + tags + url + ...) ≈ 500 KB par requête.

**Implémentation backend :**

```js
// server/src/routes/references.route.js
// Remplacer le destructuring de query params
const {
  sectionId,
  status,
  limit = '50',   // M5 : 50/page par défaut
  page  = '1',    // M5 : page (1-indexed)
  q,              // recherche textuelle optionnelle côté serveur (future)
} = req.query;

const pageN  = Math.max(1, parseInt(page, 10) || 1)
const limitN = Math.min(200, Math.max(1, parseInt(limit, 10) || 50))
const skip   = (pageN - 1) * limitN

// Dans la requête Prisma, ajouter skip et remplacer take
const [references, total] = await prisma.$transaction([
  prisma.reference.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limitN,
    skip,
    select: { ... },
  }),
  prisma.reference.count({ where }),
])

res.json({
  references,
  total,
  page: pageN,
  limit: limitN,
  totalPages: Math.ceil(total / limitN),
})
```

**Implémentation frontend :**

```jsx
// ReferencesAdminPage.jsx — ajouter state de pagination
const [page, setPage] = useState(1)
const PAGE_SIZE = 50

// Modifier load()
const load = useCallback(() => {
  setLoading(true); setError(null)
  const p = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page) })
  if (status) p.set('status', status)
  apiFetch(`/references?${p}`)
    .then(d => {
      setReferences(d.references ?? [])
      setTotal(d.total ?? 0)
    })
    .catch(() => setError('Impossible de charger les références.'))
    .finally(() => setLoading(false))
}, [status, page])

// Reset page quand le filtre status change
useEffect(() => { setPage(1) }, [status])

// Composant de pagination — ajouter après la liste
{!loading && !error && total > PAGE_SIZE && (
  <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-border">
    <span className="font-mono text-[9px] tracking-widest uppercase text-ink-muted">
      {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total}
    </span>
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={page === 1}
        className="px-3 py-1 text-[10px] font-mono tracking-widest uppercase border border-surface-border text-ink-muted hover:text-ink hover:border-ink disabled:opacity-30 transition-colors"
      >
        ← Préc.
      </button>
      <span className="px-3 py-1 font-mono text-[10px] text-ink-muted border border-surface-border">
        {page} / {Math.ceil(total / PAGE_SIZE)}
      </span>
      <button
        type="button"
        onClick={() => setPage(p => Math.min(Math.ceil(total / PAGE_SIZE), p + 1))}
        disabled={page >= Math.ceil(total / PAGE_SIZE)}
        className="px-3 py-1 text-[10px] font-mono tracking-widest uppercase border border-surface-border text-ink-muted hover:text-ink hover:border-ink disabled:opacity-30 transition-colors"
      >
        Suiv. →
      </button>
    </div>
  </div>
)}
```

> **Impact sur le batch select** : `toggleAll` sélectionne les refs de la page courante uniquement. Ajouter un message "Sélectionner les {total} refs de toutes les pages" si besoin bulk complet — décision à prendre avec Marie.

#### M6 — `duration_max` dans FilterRules

**Fichier :** `server/src/routes/filter-rules.route.js`

**Diagnostic :**
```js
// filter-rules.route.js ligne 6
const VALID_TYPES = ['keyword_title', 'channel_name'];
// duration_max absent
```

**Implémentation backend :**

```js
// filter-rules.route.js
const VALID_TYPES = ['keyword_title', 'channel_name', 'duration_max'];

// Dans le POST — ajouter validation spécifique pour duration_max
if (type === 'duration_max') {
  const dur = parseInt(pattern, 10)
  if (isNaN(dur) || dur <= 0) {
    return res.status(400).json({ error: 'duration_max doit être un entier positif (secondes)' })
  }
  // Normaliser : stocker en secondes sous forme de string
  // Le filtrage dans ingestion.service.js utilisera ce type
}
```

**Implémentation frontend — `FilterRulesPanel` dans `CurationPage.jsx`** :

```jsx
// FilterRulesPanel — modifier le <select> type (ligne ~651)
<select value={type} onChange={e => setType(e.target.value)} ...>
  <option value="keyword_title">Titre contient</option>
  <option value="channel_name">Chaîne contient</option>
  <option value="duration_max">Durée max (secondes)</option>
</select>

// Modifier le placeholder selon le type
<input
  value={pattern}
  onChange={e => setPattern(e.target.value)}
  placeholder={
    type === 'duration_max'
      ? 'ex : 180 (3 min)'
      : type === 'channel_name'
        ? 'ex : Léa Martin'
        : 'ex : vlog, behind the scenes…'
  }
  type={type === 'duration_max' ? 'number' : 'text'}
  min={type === 'duration_max' ? 1 : undefined}
  ...
/>
```

**Implémentation backend — appliquer le filtre dans `ingestion.service.js`** :

```js
// ingestion.service.js — dans la fonction qui applique les FilterRules
// Trouver l'endroit où les règles sont appliquées (chercher filterRules ou filter-rules)
// Ajouter le cas duration_max :

case 'duration_max': {
  const maxSec = parseInt(rule.pattern, 10)
  // video.duration est en secondes (champ Prisma)
  if (!isNaN(maxSec) && video.duration > maxSec) return false
  break
}
```

> **Note :** vérifier dans `ingestion.service.js` comment `duration` est stocké (ISO 8601 `PT3M22S` ou secondes ?). Si ISO 8601, utiliser une fonction de parsing déjà présente ou ajouter `parseDurationToSeconds(str)`.

#### Checklist de validation M5

- [ ] Ouvrir `/admin/references` avec 477 refs → seulement 50 chargées, pagination affichée
- [ ] Cliquer "Suiv. →" → page 2 se charge, les refs sont différentes
- [ ] Filtrer par statut DRAFT → page revient à 1
- [ ] Vérifier Network : requêtes `?limit=50&page=1`, pas de `limit=2000`

#### Checklist de validation M6

- [ ] Ouvrir les règles d'un créateur → le select affiche "Durée max (secondes)"
- [ ] Saisir `180` → cliquer `+ Règle` → règle créée en base avec `type: duration_max`, `pattern: "180"`
- [ ] Lancer un scan → les vidéos > 3 min issues de ce créateur doivent être écartées
- [ ] Saisir `-10` → doit retourner `400 : duration_max doit être un entier positif`

---

## Rappel DoD commun à tous les tickets

Avant de fermer un ticket dans Linear :

1. **Commit** — format Conventional Commits avec corps détaillé (`feat(scope):\n\n- Fichier : raison`)
2. **Commentaire Linear** — ce qui a été fait, hash du commit, comportement avant/après
3. **Test manuel** — chaque item de la checklist cochée

```bash
# Vérification imports après refacto — OBLIGATOIRE pour 180-44
grep -r "ALLOWED_TAGS\|from.*config/taxonomy" veille-creative/src/

# Test endpoint admin search — OBLIGATOIRE pour 180-41
curl -X POST http://localhost:3001/api/v1/admin/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"query":"vlogs corporate","status":"TRIAGE"}' | jq .

# Vérifier le polling dans DevTools
# Network → filter "/sessions/" → confirmer ~5s entre chaque requête
```
