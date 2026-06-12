import { useState, useEffect, useCallback, useMemo } from 'react'
import { adminFetch } from '../../lib/admin-api'

// Lundi de la semaine courante au format YYYY-MM-DD
function mondayOfWeek(d = new Date()) {
  const date = new Date(d)
  const day = date.getDay()
  date.setDate(date.getDate() - ((day + 6) % 7))
  return date.toISOString().slice(0, 10)
}

function weekLabel(weekOf) {
  const d = new Date(weekOf)
  return `Semaine du ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
}

// ─── Composition d'un digest ──────────────────────────────────────────────────

function DigestEditor({ digest, onChange, onBack }) {
  const [title, setTitle] = useState(digest.title)
  const [intro, setIntro] = useState(digest.intro)
  const [items, setItems] = useState(digest.items.map(i => ({ reference: i.reference, note: i.note })))
  const [pool, setPool] = useState([])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    adminFetch('/api/v1/admin/references?status=PUBLISHED&limit=500')
      .then(d => setPool(d.references ?? []))
      .catch(() => setError('Impossible de charger les références publiées.'))
  }, [])

  const selectedIds = useMemo(() => new Set(items.map(i => i.reference.id)), [items])
  const q = search.trim().toLowerCase()
  const candidates = pool.filter(r =>
    !selectedIds.has(r.id) &&
    (!q || r.title.toLowerCase().includes(q) || r.channelName?.toLowerCase().includes(q) ||
      (r.taxonomy ?? []).some(t => t.includes(q)))
  )

  const isDirty =
    title !== digest.title || intro !== digest.intro ||
    JSON.stringify(items.map(i => ({ id: i.reference.id, note: i.note }))) !==
    JSON.stringify(digest.items.map(i => ({ id: i.reference.id, note: i.note })))

  function move(idx, dir) {
    setItems(prev => {
      const next = [...prev]
      const tgt = idx + dir
      if (tgt < 0 || tgt >= next.length) return prev
      ;[next[idx], next[tgt]] = [next[tgt], next[idx]]
      return next
    })
  }

  async function handleSave(publish = false) {
    setSaving(true); setError(null)
    try {
      let updated = await adminFetch(`/api/v1/admin/digests/${digest.id}/items`, {
        method: 'PUT',
        body: JSON.stringify({ items: items.map(i => ({ referenceId: i.reference.id, note: i.note })) }),
      })
      const patch = {}
      if (title !== updated.title) patch.title = title
      if (intro !== updated.intro) patch.intro = intro
      if (publish) patch.status = 'PUBLISHED'
      if (Object.keys(patch).length > 0) {
        updated = await adminFetch(`/api/v1/admin/digests/${digest.id}`, {
          method: 'PATCH', body: JSON.stringify(patch),
        })
      }
      onChange(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      let msg = 'Erreur lors de la sauvegarde.'
      try { msg = JSON.parse(err.message).error ?? msg } catch { /* texte brut */ }
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-8 py-8">
      <button onClick={onBack} className="font-mono text-[10px] tracking-widest uppercase text-ink-muted hover:text-ink mb-6">
        ← Tous les digests
      </button>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="flex-1 min-w-[300px]">
          <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-2">
            {weekLabel(digest.weekOf)} · {digest.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
          </p>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Titre éditorial du digest"
            className="w-full bg-transparent border-b border-surface-border focus:border-ink text-2xl font-editorial text-ink placeholder-ink-faint focus:outline-none pb-1 mb-3"
          />
          <textarea
            value={intro}
            onChange={e => setIntro(e.target.value)}
            placeholder="Intro éditoriale — pourquoi cette sélection cette semaine ?"
            rows={3}
            className="w-full bg-surface border border-surface-border focus:border-ink text-sm text-ink placeholder-ink-faint focus:outline-none p-3 resize-y"
          />
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="font-mono text-[10px] text-ink-muted">Sauvegardé ✓</span>}
          <button
            onClick={() => handleSave(false)}
            disabled={saving || (!isDirty && digest.status === 'PUBLISHED')}
            className="px-4 py-1.5 text-[11px] font-mono tracking-widest uppercase border border-surface-border text-ink hover:border-ink transition-colors disabled:opacity-40"
          >
            {saving ? '…' : 'Sauvegarder'}
          </button>
          {digest.status !== 'PUBLISHED' && (
            <button
              onClick={() => handleSave(true)}
              disabled={saving || items.length === 0}
              className="px-4 py-1.5 text-[11px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              Publier
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-400 font-mono mb-4">{error}</p>}

      <div className="grid grid-cols-2 gap-8">
        {/* ── Sélection ── */}
        <div>
          <h2 className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-3">
            Sélection ({items.length})
          </h2>
          {items.length === 0 && (
            <p className="text-xs text-ink-faint py-8 text-center border border-dashed border-surface-border">
              Ajoute des références publiées depuis la colonne de droite →
            </p>
          )}
          <div className="flex flex-col gap-2">
            {items.map((item, idx) => (
              <div key={item.reference.id} className="flex gap-3 border border-surface-border bg-surface p-2">
                <span className="font-mono text-[10px] text-ink-faint pt-1 w-5">{String(idx + 1).padStart(2, '0')}</span>
                <img src={item.reference.thumbnailUrl} alt="" className="w-20 h-12 object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink truncate">{item.reference.title}</p>
                  <p className="font-mono text-[9px] text-ink-muted truncate mb-1">{item.reference.channelName}</p>
                  <input
                    value={item.note}
                    onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, note: e.target.value } : it))}
                    placeholder="Note éditoriale (optionnelle)"
                    className="w-full bg-canvas border border-surface-border focus:border-ink text-[11px] text-ink placeholder-ink-faint focus:outline-none px-2 py-1"
                  />
                </div>
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Monter" className="text-ink-muted hover:text-ink disabled:opacity-20 text-xs px-1">↑</button>
                  <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} aria-label="Descendre" className="text-ink-muted hover:text-ink disabled:opacity-20 text-xs px-1">↓</button>
                  <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} aria-label="Retirer" className="text-ink-muted hover:text-red-400 text-xs px-1">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Références publiées ── */}
        <div>
          <h2 className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-3">
            Références publiées ({candidates.length})
          </h2>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filtrer par titre, créateur, tag…"
            className="w-full bg-surface border border-surface-border focus:border-ink text-xs text-ink placeholder-ink-faint focus:outline-none px-3 py-2 mb-3"
          />
          <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
            {candidates.slice(0, 60).map(r => (
              <button
                key={r.id}
                onClick={() => setItems(prev => [...prev, { reference: r, note: '' }])}
                disabled={items.length >= 30}
                className="flex items-center gap-3 border border-surface-border bg-surface hover:border-ink transition-colors p-2 text-left disabled:opacity-40"
              >
                <img src={r.thumbnailUrl} alt="" className="w-16 h-10 object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink truncate">{r.title}</p>
                  <p className="font-mono text-[9px] text-ink-muted truncate">{r.channelName}</p>
                </div>
                <span className="font-mono text-[10px] text-ink-faint pr-1">+</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Liste des digests ────────────────────────────────────────────────────────

export default function DigestAdminPage() {
  const [digests, setDigests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    adminFetch('/api/v1/admin/digests')
      .then(d => setDigests(d.digests ?? []))
      .catch(() => setError('Impossible de charger les digests.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (creating) return
    setCreating(true); setError(null)
    try {
      const digest = await adminFetch('/api/v1/admin/digests', {
        method: 'POST',
        body: JSON.stringify({ weekOf: mondayOfWeek(), title: 'Le digest de la semaine' }),
      })
      setDigests(prev => [digest, ...prev])
      setEditing(digest)
    } catch (err) {
      let msg = 'Erreur à la création.'
      try { msg = JSON.parse(err.message).error ?? msg } catch { /* texte brut */ }
      setError(msg)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer ce digest ?')) return
    await adminFetch(`/api/v1/admin/digests/${id}`, { method: 'DELETE' })
    setDigests(prev => prev.filter(d => d.id !== id))
  }

  if (editing) {
    return (
      <DigestEditor
        digest={editing}
        onChange={updated => {
          setDigests(prev => prev.map(d => d.id === updated.id ? updated : d))
          setEditing(updated)
        }}
        onBack={() => setEditing(null)}
      />
    )
  }

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-1">Éditorial</p>
          <h1 className="font-editorial text-3xl text-ink">Digests hebdo</h1>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="px-4 py-1.5 text-[11px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 transition-opacity disabled:opacity-40"
        >
          {creating ? '…' : '+ Digest de la semaine'}
        </button>
      </div>

      {error && <p className="text-xs text-red-400 font-mono mb-4">{error}</p>}
      {loading && <p className="font-mono text-[10px] tracking-widest uppercase text-ink-faint py-8">Chargement…</p>}

      {!loading && digests.length === 0 && (
        <p className="text-xs text-ink-faint py-12 text-center border border-dashed border-surface-border">
          Aucun digest. Crée celui de cette semaine pour composer ta première sélection.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {digests.map(d => (
          <div key={d.id} className="flex items-center gap-4 border border-surface-border bg-surface p-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ink truncate">{d.title}</p>
              <p className="font-mono text-[10px] text-ink-muted">
                {weekLabel(d.weekOf)} · {d.items.length} référence{d.items.length > 1 ? 's' : ''}
              </p>
            </div>
            <span className={`font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 border ${
              d.status === 'PUBLISHED' ? 'border-ink text-ink' : 'border-surface-border text-ink-muted'
            }`}>
              {d.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
            </span>
            <button
              onClick={() => setEditing(d)}
              className="font-mono text-[10px] tracking-widest uppercase text-ink-muted hover:text-ink"
            >
              Composer
            </button>
            <button
              onClick={() => handleDelete(d.id)}
              className="font-mono text-[10px] tracking-widest uppercase text-ink-faint hover:text-red-400"
            >
              Suppr.
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
