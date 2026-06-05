import { useState, useEffect, useCallback, useRef, useId } from 'react'
import { useAdminStore } from '../../store/useAdminStore'
import { adminFetch } from '../../lib/admin-api'

const API_PATH = '/api/v1/admin'
const STATUSES = ['', 'TRIAGE', 'DRAFT', 'PUBLISHED', 'REJECTED']
const STATUS_LABEL = { TRIAGE: 'À trier', DRAFT: 'Draft', PUBLISHED: 'Publié', REJECTED: 'Rejeté' }
const MOODS = ['romantique', 'épique', 'intime', 'dynamique', 'élégant', 'professionnel', 'vivant', 'sérieux']

// ─── Utilitaires vidéo ────────────────────────────────────────────────────────

function getVideoEmbed(url) {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
  if (yt) return { type: 'youtube', id: yt[1], src: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0` }
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return { type: 'vimeo', id: vm[1], src: `https://player.vimeo.com/video/${vm[1]}?autoplay=1` }
  return null
}

function getYtThumb(url) {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null
}

// ─── API helpers ──────────────────────────────────────────────────────────────

function apiFetch(path, opts = {}) {
  return adminFetch(`${API_PATH}${path}`, opts)
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const styles = {
    DRAFT: 'text-ink-muted',
    PUBLISHED: 'text-ink',
    REJECTED: 'text-ink-faint',
  }
  return (
    <span
      role="status"
      aria-label={`Statut : ${STATUS_LABEL[status] ?? status}`}
      className={`font-mono text-[10px] tracking-widest uppercase ${styles[status] ?? 'text-ink-faint'}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

// ─── TagEditor ────────────────────────────────────────────────────────────────

function TagEditor({ tags, onChange, id }) {
  const [input, setInput] = useState('')

  function addTag() {
    const val = input.trim().toLowerCase().replace(/\s+/g, '-')
    if (!val || tags.includes(val)) { setInput(''); return }
    onChange([...tags, val])
    setInput('')
  }

  return (
    <div role="group" aria-labelledby={`${id}-label`} className="flex flex-wrap gap-1 items-center">
      {tags.map(t => (
        <span key={t} className="flex items-center gap-1 font-mono text-[10px] tracking-widest uppercase text-ink-muted border border-surface-border px-2 py-0.5 group/tag">
          {t}
          <button
            type="button"
            onClick={() => onChange(tags.filter(x => x !== t))}
            aria-label={`Supprimer le tag ${t}`}
            className="opacity-0 group-hover/tag:opacity-100 hover:text-ink transition-opacity ml-0.5 leading-none"
          >×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
          if (e.key === 'Backspace' && !input && tags.length) onChange(tags.slice(0, -1))
        }}
        onBlur={addTag}
        placeholder="+ tag"
        aria-label="Ajouter un tag"
        className="bg-transparent font-mono text-[10px] tracking-widest uppercase text-ink-muted placeholder-ink-faint outline-none w-16 border-b border-surface-border focus:border-ink transition-colors"
      />
    </div>
  )
}

// ─── Modale détail ────────────────────────────────────────────────────────────
// Règle : tout le contenu tient dans la ligne de flottaison — aucun scroll.
// Layout deux colonnes : gauche = player, droite = champs éditoriaux.

function RefModal({ ref, onClose, onUpdate, onDelete }) {
  const { markDirty } = useAdminStore()
  const [tags, setTags] = useState(ref.tags ?? [])
  const [mood, setMood] = useState(ref.mood ?? '')
  const [context, setContext] = useState(ref.context ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [playerActive, setPlayerActive] = useState(false)
  const dialogRef = useRef(null)
  const titleId = useId()

  const embed = getVideoEmbed(ref.url)
  const thumb = ref.thumbnailUrl?.startsWith('http')
    ? ref.thumbnailUrl
    : getYtThumb(ref.url)

  // Focus trap + Escape
  useEffect(() => {
    const prev = document.activeElement
    dialogRef.current?.focus()
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); prev?.focus() }
  }, [onClose])

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await apiFetch(`/references/${ref.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ tags, mood, context }),
      })
      onUpdate(updated)
      markDirty()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  async function handleStatusChange(s) {
    const updated = await apiFetch(`/references/${ref.id}/status`, {
      method: 'PATCH', body: JSON.stringify({ status: s }),
    })
    onUpdate(updated)
    markDirty()
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await apiFetch(`/references/${ref.id}`, { method: 'DELETE' })
    markDirty()
    onDelete(ref.id)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-canvas/90 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      {/* Panneau — deux colonnes, hauteur fixe, pas de scroll */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-4xl bg-surface border border-surface-border outline-none flex flex-col"
        style={{ height: 'min(600px, 88vh)' }}
      >

        {/* ── Topbar ── */}
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-surface-border flex-shrink-0">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9px] tracking-widest uppercase text-ink-muted">{ref.channelName || ref.platform}</p>
            <h2 id={titleId} className="text-sm font-medium text-ink truncate">{ref.title}</h2>
          </div>
          {/* Statut + actions rapides */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={ref.status} />
            {ref.status !== 'PUBLISHED' && (
              <button onClick={() => handleStatusChange('PUBLISHED')}
                className="px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase border border-ink text-ink hover:bg-ink hover:text-canvas transition-colors">
                Publier
              </button>
            )}
            {ref.status !== 'REJECTED' && (
              <button onClick={() => handleStatusChange('REJECTED')}
                className="px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase border border-surface-border text-ink-muted hover:text-ink hover:border-ink transition-colors">
                Rejeter
              </button>
            )}
            {(ref.status === 'PUBLISHED' || ref.status === 'REJECTED') && (
              <button onClick={() => handleStatusChange('DRAFT')}
                className="px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase border border-surface-border text-ink-muted hover:text-ink hover:border-ink transition-colors">
                Draft
              </button>
            )}
            <button onClick={onClose} aria-label="Fermer" className="ml-1 text-ink-muted hover:text-ink transition-colors p-1">
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Corps deux colonnes ── */}
        <div className="flex flex-1 min-h-0">

          {/* Colonne gauche — player */}
          <div className="w-[44%] flex-shrink-0 bg-canvas flex flex-col border-r border-surface-border">
            {/* Player zone — proportions 16:9 dans l'espace disponible */}
            <div className="relative flex-1">
              {playerActive && embed ? (
                <iframe
                  src={embed.src}
                  title={ref.title}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              ) : (
                <button
                  onClick={() => embed ? setPlayerActive(true) : window.open(ref.url, '_blank')}
                  className="absolute inset-0 w-full h-full group focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-inset"
                  aria-label={embed ? `Lire : ${ref.title}` : `Ouvrir sur ${ref.platform}`}
                >
                  {thumb ? (
                    <img src={thumb} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                  ) : (
                    <div className="w-full h-full bg-surface flex items-center justify-center">
                      <span className="font-mono text-[9px] tracking-widest uppercase text-ink-faint">Pas de thumbnail</span>
                    </div>
                  )}
                  <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                    <span className="w-10 h-10 border border-ink/40 flex items-center justify-center bg-canvas/50 group-hover:bg-canvas/70 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 2l9 5-9 5V2z"/></svg>
                    </span>
                  </span>
                </button>
              )}
            </div>

            {/* Lien externe sous le player */}
            <div className="px-4 py-2.5 border-t border-surface-border flex-shrink-0">
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[9px] tracking-widest uppercase text-ink-muted hover:text-ink transition-colors truncate block"
                aria-label={`Ouvrir ${ref.title} sur ${ref.platform} (nouvel onglet)`}
              >
                ↗ Voir sur {ref.platform?.toLowerCase() ?? 'youtube'}
              </a>
            </div>
          </div>

          {/* Colonne droite — champs éditoriaux */}
          <div className="flex-1 flex flex-col min-w-0 px-5 py-4 gap-4 overflow-hidden">

            {/* Tags */}
            <div className="flex-shrink-0">
              <label id="modal-tags-label" className="font-mono text-[9px] tracking-widest uppercase text-ink-muted block mb-1.5">Tags</label>
              <TagEditor id="modal-tags" tags={tags} onChange={setTags} />
            </div>

            {/* Mood — pills compactes */}
            <div className="flex-shrink-0">
              <label htmlFor="modal-mood" className="font-mono text-[9px] tracking-widest uppercase text-ink-muted block mb-1.5">Mood</label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {MOODS.map(m => (
                  <button key={m} type="button" onClick={() => setMood(mood === m ? '' : m)}
                    aria-pressed={mood === m}
                    className={`px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase border transition-colors ${
                      mood === m ? 'border-ink text-ink' : 'border-surface-border text-ink-muted hover:border-ink hover:text-ink'
                    }`}>
                    {m}
                  </button>
                ))}
              </div>
              <input id="modal-mood" value={mood} onChange={e => setMood(e.target.value)}
                placeholder="Autre…"
                className="bg-canvas border border-surface-border text-ink text-xs px-2 py-1 w-36 outline-none focus:border-ink transition-colors placeholder-ink-faint" />
            </div>

            {/* Contexte — remplit l'espace restant */}
            <div className="flex-1 flex flex-col min-h-0">
              <label htmlFor="modal-context" className="font-mono text-[9px] tracking-widest uppercase text-ink-muted block mb-1.5 flex-shrink-0">Contexte éditorial</label>
              <textarea
                id="modal-context"
                value={context}
                onChange={e => setContext(e.target.value)}
                className="flex-1 bg-canvas border border-surface-border text-ink text-xs px-3 py-2 outline-none focus:border-ink transition-colors resize-none placeholder-ink-faint leading-relaxed"
                placeholder="Pourquoi cette vidéo est une référence…"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between flex-shrink-0 pt-3 border-t border-surface-border">
              <button
                onClick={handleDelete}
                onMouseLeave={() => setConfirmDelete(false)}
                className={`px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase border transition-colors ${
                  confirmDelete ? 'border-ink text-ink' : 'border-surface-border text-ink-faint hover:border-ink hover:text-ink'
                }`}>
                {confirmDelete ? 'Confirmer ?' : 'Supprimer'}
              </button>

              <div className="flex items-center gap-2">
                {saved && <span className="font-mono text-[9px] tracking-widest uppercase text-ink-muted" role="status">✓ Enregistré</span>}
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-1.5 text-[10px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 transition-opacity disabled:opacity-40">
                  {saving ? '…' : 'Enregistrer'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Barre d'actions batch ────────────────────────────────────────────────────

function BatchBar({ selected, onClear, onBatchDone }) {
  const { markDirty } = useAdminStore()
  const [action, setAction] = useState('status')
  const [statusVal, setStatusVal] = useState('PUBLISHED')
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const ids = [...selected]

  async function execute() {
    if (loading) return
    setError(null)
    setLoading(true)
    try {
      if (action === 'status') {
        await apiFetch('/references/batch', {
          method: 'POST',
          body: JSON.stringify({ ids, action: 'status', value: statusVal }),
        })
        onBatchDone({ action: 'status', ids, value: statusVal })
        onClear()
      } else if (action === 'addTags') {
        const tags = tagInput.split(',').map(t => t.trim().toLowerCase().replace(/\s+/g, '-')).filter(Boolean)
        if (!tags.length) { setLoading(false); return }
        await apiFetch('/references/batch', {
          method: 'POST',
          body: JSON.stringify({ ids, action: 'addTags', value: tags }),
        })
        onBatchDone({ action: 'addTags', ids, value: tags })
        setTagInput('')
        onClear()
      } else if (action === 'delete') {
        await apiFetch('/references/batch', {
          method: 'POST',
          body: JSON.stringify({ ids, action: 'delete' }),
        })
        onBatchDone({ action: 'delete', ids })
        setDeleteConfirm(false)
        onClear()
      }
      markDirty()
    } catch (e) {
      setError(e.message || 'Erreur lors de l\'action batch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div role="toolbar" aria-label="Actions sur la sélection"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface border border-surface-border shadow-2xl flex flex-col"
      style={{ minWidth: 480 }}>

      {/* Barre principale */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="font-mono text-[10px] tracking-widest uppercase text-ink-muted whitespace-nowrap">
          {ids.length} sél.
        </span>

        <div className="w-px h-4 bg-surface-border flex-shrink-0" aria-hidden="true" />

        {/* Action tabs */}
        <div className="flex gap-1">
          {[
            { key: 'status',   label: 'Statut' },
            { key: 'addTags',  label: 'Tags' },
            { key: 'delete',   label: 'Supprimer' },
          ].map(({ key, label }) => (
            <button key={key}
              onClick={() => { setAction(key); setDeleteConfirm(false); setError(null) }}
              aria-pressed={action === key}
              className={`px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase border transition-colors ${
                action === key ? 'border-ink text-ink' : 'border-surface-border text-ink-muted hover:text-ink'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Valeur selon action */}
        {action === 'status' && (
          <select value={statusVal} onChange={e => setStatusVal(e.target.value)}
            aria-label="Statut à appliquer"
            className="bg-canvas border border-surface-border text-ink text-[10px] font-mono tracking-widest uppercase px-2 py-1 outline-none focus:border-ink">
            <option value="PUBLISHED">Publier</option>
            <option value="REJECTED">Rejeter</option>
            <option value="DRAFT">Draft</option>
          </select>
        )}
        {action === 'addTags' && (
          <input value={tagInput} onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && execute()}
            placeholder="tag1, tag2…"
            aria-label="Tags à ajouter, séparés par des virgules"
            className="bg-canvas border border-surface-border text-ink text-[10px] font-mono px-2 py-1 outline-none focus:border-ink w-36 placeholder-ink-faint" />
        )}

        {/* Bouton d'action */}
        {action !== 'delete' && (
          <button onClick={execute} disabled={loading}
            className="ml-auto px-4 py-1.5 text-[10px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 transition-opacity disabled:opacity-40">
            {loading ? '…' : 'Appliquer'}
          </button>
        )}

        {action === 'delete' && !deleteConfirm && (
          <button onClick={() => setDeleteConfirm(true)}
            className="ml-auto px-4 py-1.5 text-[10px] font-mono tracking-widest uppercase border border-ink text-ink hover:bg-ink hover:text-canvas transition-colors">
            Supprimer {ids.length} réf.
          </button>
        )}

        <button onClick={onClear} aria-label="Annuler la sélection"
          className="text-ink-muted hover:text-ink transition-colors font-mono text-[10px] border border-surface-border px-2 py-1.5">
          ✕
        </button>
      </div>

      {/* Confirmation delete — zone séparée, impossible de manquer */}
      {action === 'delete' && deleteConfirm && (
        <div className="border-t border-surface-border px-4 py-2.5 flex items-center gap-3 bg-canvas">
          <span className="font-mono text-[10px] tracking-widest uppercase text-ink flex-1">
            Supprimer définitivement {ids.length} référence{ids.length > 1 ? 's' : ''} ?
          </span>
          <button onClick={execute} disabled={loading}
            className="px-4 py-1.5 text-[10px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 transition-opacity disabled:opacity-40">
            {loading ? '…' : 'Confirmer'}
          </button>
          <button onClick={() => setDeleteConfirm(false)}
            className="px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase border border-surface-border text-ink-muted hover:text-ink transition-colors">
            Annuler
          </button>
        </div>
      )}

      {/* Erreur visible */}
      {error && (
        <div className="border-t border-surface-border px-4 py-2 bg-canvas" role="alert">
          <span className="font-mono text-[10px] tracking-widest uppercase text-ink-muted">Erreur — {error}</span>
        </div>
      )}
    </div>
  )
}

// ─── RefRow ───────────────────────────────────────────────────────────────────

function RefRow({ ref, selected, onToggle, onOpen }) {
  const checkId = useId()
  const thumb = ref.thumbnailUrl?.startsWith('http')
    ? ref.thumbnailUrl
    : getYtThumb(ref.url)

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 transition-colors border-b border-surface-border last:border-0 ${
        selected ? 'bg-surface-raised' : 'bg-surface hover:bg-surface-raised'
      }`}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        id={checkId}
        checked={selected}
        onChange={() => onToggle(ref.id)}
        aria-label={`Sélectionner : ${ref.title}`}
        className="w-3.5 h-3.5 flex-shrink-0 accent-ink cursor-pointer"
      />

      {/* Thumbnail cliquable → ouvre modale */}
      <button
        onClick={() => onOpen(ref)}
        aria-label={`Voir les détails : ${ref.title}`}
        className="flex-shrink-0 focus-visible:ring-1 focus-visible:ring-ink"
      >
        {thumb ? (
          <img src={thumb} alt="" width={64} height={40} className="w-16 h-10 object-cover opacity-80 hover:opacity-100 transition-opacity" />
        ) : (
          <div className="w-16 h-10 bg-canvas border border-surface-border flex items-center justify-center">
            <span className="font-mono text-[8px] text-ink-faint">—</span>
          </div>
        )}
      </button>

      {/* Titre */}
      <button onClick={() => onOpen(ref)} className="flex-1 min-w-0 text-left hover:opacity-70 transition-opacity focus-visible:underline">
        <p className="text-sm text-ink truncate">{ref.title}</p>
        <p className="text-[11px] text-ink-muted font-mono truncate">{ref.channelName || '—'}</p>
      </button>

      {/* Tags */}
      <div className="hidden lg:flex gap-1 flex-shrink-0 max-w-[200px] overflow-hidden">
        {(ref.tags ?? []).slice(0, 3).map(t => (
          <span key={t} className="font-mono text-[9px] tracking-widest uppercase text-ink-muted border border-surface-border px-1.5 py-0.5 truncate">
            {t}
          </span>
        ))}
        {(ref.tags ?? []).length > 3 && (
          <span className="font-mono text-[9px] text-ink-faint">+{ref.tags.length - 3}</span>
        )}
      </div>

      {/* Statut */}
      <div className="w-16 text-right flex-shrink-0">
        <StatusBadge status={ref.status} />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReferencesAdminPage() {
  const [references, setReferences] = useState([])
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [activeTags, setActiveTags] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [modalRef, setModalRef] = useState(null)
  const searchId = useId()

  const load = useCallback(() => {
    setLoading(true); setError(null)
    const p = new URLSearchParams({ limit: '2000' })
    if (status) p.set('status', status)
    apiFetch(`/references?${p}`)
      .then(d => { setReferences(d.references ?? []); setTotal(d.total ?? 0) })
      .catch(() => setError('Impossible de charger les références.'))
      .finally(() => setLoading(false))
  }, [status])

  useEffect(() => { load() }, [load])

  // Ferme la modale si la ref a été supprimée
  useEffect(() => {
    if (modalRef && !references.find(r => r.id === modalRef.id)) setModalRef(null)
  }, [references, modalRef])

  function toggleSelect(id) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function toggleAll() {
    setSelected(s => s.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)))
  }

  function handleUpdate(updated) {
    setReferences(prev => prev.map(r => r.id === updated.id ? updated : r))
    if (modalRef?.id === updated.id) setModalRef(updated)
  }

  function handleDelete(id) {
    setReferences(prev => prev.filter(r => r.id !== id))
    setSelected(s => { const n = new Set(s); n.delete(id); return n })
    setTotal(t => t - 1)
  }

  function handleBatchDone({ action, ids, value }) {
    if (action === 'delete') {
      setReferences(prev => prev.filter(r => !ids.includes(r.id)))
      setTotal(t => t - ids.length)
    } else if (action === 'status') {
      setReferences(prev => prev.map(r =>
        ids.includes(r.id) ? { ...r, status: value, ...(value === 'PUBLISHED' ? { publishedAt: new Date().toISOString() } : {}) } : r
      ))
    } else if (action === 'addTags') {
      setReferences(prev => prev.map(r =>
        ids.includes(r.id) ? { ...r, tags: [...new Set([...(r.tags ?? []), ...value])] } : r
      ))
    }
  }

  // Tous les tags présents dans les références chargées, triés par fréquence
  const allTags = (() => {
    const freq = new Map()
    references.forEach(r => (r.tags ?? []).forEach(t => freq.set(t, (freq.get(t) ?? 0) + 1)))
    return [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  })()

  function toggleTag(tag) {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const q = search.trim().toLowerCase()
  const filtered = references.filter(r => {
    const matchSearch = !q ||
      r.title.toLowerCase().includes(q) ||
      r.channelName?.toLowerCase().includes(q) ||
      (r.tags ?? []).some(t => t.toLowerCase().includes(q))
    // ET logique : la ref doit porter tous les tags actifs
    const matchTags = activeTags.length === 0 ||
      activeTags.every(t => (r.tags ?? []).includes(t))
    return matchSearch && matchTags
  })

  const counts = references.reduce((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc }, {})
  const allSelected = filtered.length > 0 && filtered.every(r => selected.has(r.id))

  return (
    <>
      <div className="px-8 py-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-1">
              {total} référence{total !== 1 ? 's' : ''}
            </p>
            <h1 className="font-editorial text-3xl text-ink">Médiathèque admin</h1>
          </div>

          <div className="flex flex-col items-end gap-2">
            <label htmlFor={searchId} className="sr-only">Rechercher une référence</label>
            <input
              id={searchId}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Titre, auteur, tag…"
              className="bg-surface border border-surface-border text-ink text-sm px-3 py-1.5 w-60 outline-none focus:border-ink transition-colors placeholder-ink-faint"
            />
            <div role="group" aria-label="Filtrer par statut" className="flex gap-1">
              {STATUSES.map(s => {
                const c = s ? (counts[s] ?? 0) : references.length
                return (
                  <button key={s} onClick={() => { setStatus(s); setSelected(new Set()) }}
                    aria-pressed={status === s}
                    className={`px-3 py-1 text-[11px] font-mono tracking-widest uppercase transition-colors border ${
                      status === s ? 'border-ink text-ink' : 'border-surface-border text-ink-muted hover:text-ink'
                    }`}>
                    {s ? STATUS_LABEL[s] : 'Tous'}{!loading && c > 0 && <span className="ml-1 opacity-40">{c}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Filtre par tags ── */}
        {!loading && !error && allTags.length > 0 && (
          <div role="group" aria-label="Filtrer par tags" className="flex flex-wrap items-center gap-1.5 mb-6">
            {allTags.map(([tag, n]) => {
              const active = activeTags.includes(tag)
              return (
                <button key={tag} onClick={() => toggleTag(tag)} aria-pressed={active}
                  className={`px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase border transition-colors ${
                    active ? 'border-ink text-ink bg-surface-raised' : 'border-surface-border text-ink-muted hover:border-ink hover:text-ink'
                  }`}>
                  {tag}<span className="ml-1 opacity-40">{n}</span>
                </button>
              )
            })}
            {activeTags.length > 0 && (
              <button onClick={() => setActiveTags([])}
                className="px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase text-ink-faint hover:text-ink transition-colors underline underline-offset-2">
                Réinitialiser
              </button>
            )}
          </div>
        )}

        {/* ── États ── */}
        {loading && <p className="text-ink-muted text-sm font-mono" role="status">Chargement…</p>}
        {error && <p className="text-sm text-ink-muted border border-surface-border px-4 py-3" role="alert">{error}</p>}

        {!loading && !error && filtered.length === 0 && (
          <div className="border border-surface-border px-6 py-12 text-center" role="status">
            <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-2">
              {search ? 'Aucun résultat' : 'Aucune référence'}
            </p>
            <p className="text-sm text-ink-muted">
              {search ? `Aucun résultat pour "${search}".` : 'La base est vide.'}
            </p>
          </div>
        )}

        {/* ── Liste ── */}
        {!loading && !error && filtered.length > 0 && (
          <div>
            {/* Select all */}
            <div className="flex items-center gap-3 px-4 py-2 border border-surface-border border-b-0 bg-canvas">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label={allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                className="w-3.5 h-3.5 accent-ink cursor-pointer"
              />
              <span className="font-mono text-[10px] tracking-widest uppercase text-ink-muted">
                {selected.size > 0 ? `${selected.size} sélectionnée${selected.size > 1 ? 's' : ''}` : 'Tout sélectionner'}
              </span>
            </div>

            <div role="list" aria-label="Liste des références" className="border border-surface-border">
              {filtered.map(ref => (
                <RefRow
                  key={ref.id}
                  ref={ref}
                  selected={selected.has(ref.id)}
                  onToggle={toggleSelect}
                  onOpen={setModalRef}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── Batch bar ── */}
      {selected.size > 0 && (
        <BatchBar
          selected={selected}
          onClear={() => setSelected(new Set())}
          onBatchDone={handleBatchDone}
        />
      )}

      {/* ── Modale ── */}
      {modalRef && (
        <RefModal
          ref={modalRef}
          onClose={() => setModalRef(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}
