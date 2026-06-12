import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '../lib/api'

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'DONE', label: 'Terminé' },
]

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ── État du builder ──
  const [intention, setIntention] = useState('')
  const [status, setStatus] = useState('DRAFT')
  const [items, setItems] = useState([])
  const [pool, setPool] = useState([])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.projects.get(id),
      api.references.list({ limit: 500 }),
    ])
      .then(([p, refs]) => {
        setProject(p)
        setIntention(p.intention)
        setStatus(p.status)
        setItems(p.items.map(i => ({ reference: i.reference, note: i.note })))
        setPool(refs.references ?? [])
      })
      .catch(() => setError('Projet introuvable.'))
      .finally(() => setLoading(false))
  }, [id])

  const selectedIds = useMemo(() => new Set(items.map(i => i.reference.id)), [items])
  const q = search.trim().toLowerCase()
  const candidates = pool.filter(r =>
    !selectedIds.has(r.id) &&
    (!q || r.title.toLowerCase().includes(q) || r.channelName?.toLowerCase().includes(q) ||
      (r.taxonomy ?? []).some(t => t.includes(q)))
  )

  const isDirty = project && (
    intention !== project.intention ||
    status !== project.status ||
    JSON.stringify(items.map(i => ({ id: i.reference.id, note: i.note }))) !==
    JSON.stringify(project.items.map(i => ({ id: i.reference.id, note: i.note })))
  )

  function move(idx, dir) {
    setItems(prev => {
      const next = [...prev]
      const tgt = idx + dir
      if (tgt < 0 || tgt >= next.length) return prev
      ;[next[idx], next[tgt]] = [next[tgt], next[idx]]
      return next
    })
  }

  async function handleSave() {
    if (saving) return
    setSaving(true); setSaveError(null)
    try {
      await api.projects.setItems(id, items.map(i => ({ referenceId: i.reference.id, note: i.note })))
      const updated = await api.projects.update(id, { intention, status })
      setProject(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setSaveError('Erreur de sauvegarde. Réessaie.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Supprimer ce projet et son treatment ?')) return
    await api.projects.remove(id)
    navigate('/projects')
  }

  if (loading) {
    return (
      <div className="bg-canvas min-h-screen flex items-center justify-center">
        <span className="font-mono text-[10px] tracking-widest uppercase text-ink-faint">Chargement…</span>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="bg-canvas min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-ink-muted">{error ?? 'Projet introuvable.'}</p>
        <Link to="/projects" className="font-mono text-[10px] tracking-widest uppercase text-ink underline">← Projets</Link>
      </div>
    )
  }

  return (
    <div className="bg-canvas min-h-screen animate-fade-in px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors">
          <ArrowLeft size={14} /> Projets
        </Link>
        <div className="flex items-center gap-3">
          {saved && <span className="font-mono text-[10px] text-ink-muted">Sauvegardé ✓</span>}
          {isDirty && !saved && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Modifications non sauvegardées" />}
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            aria-label="Statut du projet"
            className="bg-surface border border-surface-border text-xs text-ink px-2 py-1.5 focus:outline-none focus:border-ink"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="px-4 py-1.5 text-[11px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {saving ? '…' : 'Sauvegarder'}
          </button>
          <button
            onClick={handleDelete}
            className="font-mono text-[10px] tracking-widest uppercase text-ink-faint hover:text-red-400 transition-colors"
          >
            Suppr.
          </button>
        </div>
      </div>

      <div className="mb-8 max-w-3xl">
        <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-1">
          {project.client || 'Sans client'}
          {project.deadline && ` · deadline ${new Date(project.deadline).toLocaleDateString('fr-FR')}`}
        </p>
        <h1 className="font-editorial text-4xl text-ink mb-4">{project.title}</h1>
        {project.brief && (
          <details className="mb-4">
            <summary className="font-mono text-[10px] tracking-widest uppercase text-ink-muted cursor-pointer hover:text-ink">Brief client</summary>
            <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-line mt-2">{project.brief}</p>
          </details>
        )}
        <label htmlFor="proj-intention" className="font-mono text-[10px] tracking-widest uppercase text-ink-muted block mb-2">
          Intention créative
        </label>
        <textarea
          id="proj-intention"
          value={intention}
          onChange={e => setIntention(e.target.value)}
          rows={4}
          placeholder="Le parti pris : ton, rythme, lumière, narration. C'est ce que le client lira en premier."
          className="w-full bg-surface border border-surface-border focus:border-ink text-sm text-ink placeholder-ink-faint focus:outline-none p-3 resize-y"
        />
      </div>

      {saveError && <p className="text-xs text-red-400 font-mono mb-4">{saveError}</p>}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* ── Treatment (sélection ordonnée) ── */}
        <div>
          <h2 className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-3">
            Treatment ({items.length}/20)
          </h2>
          {items.length === 0 && (
            <p className="text-xs text-ink-faint py-10 text-center border border-dashed border-surface-border">
              Pioche des références dans la bibliothèque → chaque réf porte une note : ce que tu en retiens pour CE projet.
            </p>
          )}
          <div className="flex flex-col gap-2">
            {items.map((item, idx) => (
              <div key={item.reference.id} className="flex gap-3 border border-surface-border bg-surface p-2">
                <span className="font-mono text-[10px] text-ink-faint pt-1 w-5">{String(idx + 1).padStart(2, '0')}</span>
                <img src={item.reference.thumbnailUrl} alt="" className="w-24 h-14 object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink truncate">{item.reference.title}</p>
                  <p className="font-mono text-[9px] text-ink-muted truncate mb-1">{item.reference.channelName}</p>
                  <input
                    value={item.note}
                    onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, note: e.target.value } : it))}
                    placeholder="Ce qu'on retient : « ce traveling d'ouverture »…"
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

        {/* ── Bibliothèque ── */}
        <div>
          <h2 className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-3">
            Bibliothèque ({candidates.length})
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
                disabled={items.length >= 20}
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
