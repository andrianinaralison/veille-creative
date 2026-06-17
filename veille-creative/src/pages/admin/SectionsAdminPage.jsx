import { useState, useEffect, useId } from 'react'
import { useAdminStore } from '../../store/useAdminStore'
import { adminFetch } from '../../lib/admin-api'

const API_SECTIONS = '/api/v1/admin/sections'
const API_REFS     = '/api/v1/admin/references'

function apiFetch(path, opts = {}) {
  return adminFetch(path, opts)
}

// ─── Formulaire nouvelle section ─────────────────────────────────────────────

function NewSectionForm({ onCreated }) {
  const { markDirty } = useAdminStore()
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const id = useId()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const section = await apiFetch(API_SECTIONS, {
        method: 'POST',
        body: JSON.stringify({ title }),
      })
      onCreated(section)
      markDirty()
      setTitle('')
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <label htmlFor={id} className="sr-only">Titre de la nouvelle section</label>
      <input
        id={id}
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Titre de la section…"
        className="bg-surface border border-surface-border text-ink text-sm px-3 py-1.5 w-56 outline-none focus:border-ink transition-colors placeholder-ink-faint"
      />
      <button
        type="submit"
        disabled={saving || !title.trim()}
        className="px-4 py-1.5 text-[11px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 transition-opacity disabled:opacity-40"
      >
        {saving ? '…' : '+ Créer'}
      </button>
    </form>
  )
}

// ─── Carte section ────────────────────────────────────────────────────────────

function SectionCard({ section, refs, index, total, onUpdate, onDelete, onAssign, onUnassign, onMove }) {
  const { markDirty } = useAdminStore()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(section.title)
  const [description, setDescription] = useState(section.description)
  const [saving, setSaving] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const isAuto = section.type === 'AUTO'

  // N-N (180-64) : une réf peut appartenir à plusieurs sections
  const sectionRefs = refs.filter(r => (r.sectionIds ?? []).includes(section.id))
  const availableRefs = refs.filter(r => !(r.sectionIds ?? []).includes(section.id))

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await apiFetch(`${API_SECTIONS}/${section.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title, description }),
      })
      onUpdate(updated)
      markDirty()
      setEditing(false)
    } finally { setSaving(false) }
  }

  async function handleToggleActive() {
    const updated = await apiFetch(`${API_SECTIONS}/${section.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !section.active }),
    })
    onUpdate(updated)
    markDirty()
  }

  async function handleDelete() {
    if (isAuto) return
    if (!confirm(`Supprimer la section "${section.title}" ? Les références ne seront pas supprimées.`)) return
    await apiFetch(`${API_SECTIONS}/${section.id}`, { method: 'DELETE' })
    markDirty()
    onDelete(section.id)
  }

  async function handleRemoveRef(refId) {
    await apiFetch(`${API_SECTIONS}/unassign`, {
      method: 'POST',
      body: JSON.stringify({ refIds: [refId], sectionId: section.id }),
    })
    markDirty()
    onUnassign(section.id, refId)
  }

  async function handleAddRef(refId) {
    await apiFetch(`${API_SECTIONS}/${section.id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ refIds: [refId] }),
    })
    markDirty()
    onAssign(section.id, refId)
    setShowPicker(false)
  }

  return (
    <div className={`border border-surface-border bg-surface flex flex-col ${!section.active ? 'opacity-50' : ''}`}>

      {/* En-tête section */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border">
        {editing ? (
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
            className="flex-1 bg-canvas border border-surface-border text-ink text-sm px-2 py-1 outline-none focus:border-ink"
          />
        ) : (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-editorial text-base text-ink truncate">{section.title}</h3>
              <span className={`font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5 border flex-shrink-0 ${
                isAuto ? 'border-ink text-ink' : 'border-surface-border text-ink-faint'
              }`}>
                {isAuto ? 'auto' : 'manuel'}
              </span>
            </div>
            {section.description && (
              <p className="text-[11px] text-ink-muted truncate">{section.description}</p>
            )}
          </div>
        )}

        <span className="font-mono text-[9px] tracking-widest uppercase text-ink-muted flex-shrink-0">
          {sectionRefs.length} réf.
        </span>

        {/* Ordre */}
        {!editing && (
          <div className="flex flex-col flex-shrink-0">
            <button onClick={() => onMove(index, -1)} disabled={index === 0}
              aria-label="Monter la section"
              className="text-ink-faint hover:text-ink disabled:opacity-20 disabled:hover:text-ink-faint transition-colors leading-none text-[10px]">▲</button>
            <button onClick={() => onMove(index, 1)} disabled={index === total - 1}
              aria-label="Descendre la section"
              className="text-ink-faint hover:text-ink disabled:opacity-20 disabled:hover:text-ink-faint transition-colors leading-none text-[10px]">▼</button>
          </div>
        )}

        <div className="flex gap-1.5 flex-shrink-0">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving}
                className="px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 disabled:opacity-40">
                {saving ? '…' : 'OK'}
              </button>
              <button onClick={() => { setEditing(false); setTitle(section.title) }}
                className="px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase border border-surface-border text-ink-muted hover:text-ink">
                Annuler
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)}
                className="px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase border border-surface-border text-ink-muted hover:text-ink transition-colors">
                Renommer
              </button>
              <button onClick={handleToggleActive}
                className="px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase border border-surface-border text-ink-muted hover:text-ink transition-colors">
                {section.active ? 'Masquer' : 'Activer'}
              </button>
              {!isAuto && (
                <button onClick={handleDelete}
                  className="px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase border border-surface-border text-ink-faint hover:border-ink hover:text-ink transition-colors">
                  ✕
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Liste des refs dans cette section */}
      <div className="flex flex-col">
        {sectionRefs.length === 0 && (
          <p className="text-[11px] text-ink-faint font-mono px-4 py-3">Aucune référence assignée</p>
        )}
        {sectionRefs.map(ref => (
          <div key={ref.id} className="flex items-center gap-3 px-4 py-2 border-b border-surface-border last:border-0 hover:bg-surface-raised transition-colors">
            {ref.thumbnailUrl?.startsWith('http') && (
              <img src={ref.thumbnailUrl} alt="" className="w-12 h-8 object-cover flex-shrink-0 opacity-70" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-ink truncate">{ref.title}</p>
              <p className="text-[10px] text-ink-muted font-mono truncate">{ref.channelName || '—'}</p>
            </div>
            <span className="font-mono text-[9px] tracking-widest uppercase text-ink-muted flex-shrink-0">
              {ref.status}
            </span>
            <button
              onClick={() => handleRemoveRef(ref.id)}
              aria-label={`Retirer ${ref.title} de cette section`}
              className="text-ink-faint hover:text-ink transition-colors flex-shrink-0 font-mono text-[10px]"
            >
              ✕
            </button>
          </div>
        ))}

        {/* Ajouter une ref */}
        <div className="px-4 py-2.5 border-t border-surface-border">
          {showPicker ? (
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[9px] tracking-widest uppercase text-ink-muted">
                Références hors de cette section ({availableRefs.length})
              </p>
              <div className="max-h-48 overflow-y-auto flex flex-col gap-px border border-surface-border">
                {availableRefs.length === 0 && (
                  <p className="text-[11px] text-ink-faint px-3 py-2">Toutes les refs sont déjà dans cette section</p>
                )}
                {availableRefs.map(ref => (
                  <button
                    key={ref.id}
                    onClick={() => handleAddRef(ref.id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-left hover:bg-surface-raised transition-colors text-xs text-ink"
                  >
                    {ref.thumbnailUrl?.startsWith('http') && (
                      <img src={ref.thumbnailUrl} alt="" className="w-10 h-6 object-cover flex-shrink-0 opacity-70" />
                    )}
                    <span className="truncate">{ref.title}</span>
                    <span className="font-mono text-[9px] text-ink-muted ml-auto flex-shrink-0">{ref.status}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowPicker(false)}
                className="text-[10px] font-mono text-ink-muted hover:text-ink transition-colors self-start">
                Fermer
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowPicker(true)}
              className="font-mono text-[10px] tracking-widest uppercase text-ink-muted hover:text-ink transition-colors"
            >
              + Ajouter une référence
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Panel suggestions Claude ─────────────────────────────────────────────────

function SuggestionsPanel({ refs, onSectionCreated, onRefsAssigned }) {
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [suggestions, setSuggestions] = useState([])
  const [creating, setCreating] = useState(null) // suggestion index en cours de création
  const [created, setCreated] = useState(new Set()) // indices déjà créés

  async function handleAnalyze() {
    setState('loading')
    try {
      const data = await apiFetch(`${API_SECTIONS}/suggest`, { method: 'POST' })
      setSuggestions(data.suggestions ?? [])
      setState('done')
    } catch (err) {
      console.error(err)
      setState('error')
    }
  }

  async function handleCreate(suggestion, idx) {
    setCreating(idx)
    try {
      // 1. Créer la section
      const section = await apiFetch(API_SECTIONS, {
        method: 'POST',
        body: JSON.stringify({ title: suggestion.title, description: suggestion.description }),
      })
      // 2. Assigner les refs
      if (suggestion.refIds.length > 0) {
        await apiFetch(`${API_SECTIONS}/${section.id}/assign`, {
          method: 'POST',
          body: JSON.stringify({ refIds: suggestion.refIds }),
        })
      }
      setCreated(prev => new Set([...prev, idx]))
      onSectionCreated(section)
      onRefsAssigned(section.id, suggestion.refIds)
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(null)
    }
  }

  if (state === 'idle') {
    return (
      <div className="mb-10 border border-dashed border-surface-border p-6 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-0.5">Moteur IA</p>
          <h2 className="font-editorial text-lg text-ink">Sections suggérées</h2>
          <p className="text-[12px] text-ink-muted mt-0.5">
            Claude analyse toutes tes références et propose des sections thématiques.
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          className="px-5 py-2 text-[11px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 transition-opacity flex-shrink-0"
        >
          Analyser mes références →
        </button>
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <div className="mb-10 border border-dashed border-surface-border p-6">
        <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-1">Moteur IA</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="font-mono text-xs text-ink-muted animate-pulse">
            Claude analyse {refs.length} références…
          </span>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="mb-10 border border-dashed border-surface-border p-6 flex items-center justify-between">
        <p className="text-xs text-ink-muted">Erreur lors de l'analyse. Réessaie.</p>
        <button onClick={handleAnalyze} className="font-mono text-[10px] tracking-widest uppercase text-ink-muted hover:text-ink">
          Réessayer
        </button>
      </div>
    )
  }

  // state === 'done'
  const pending = suggestions.filter((_, i) => !created.has(i))

  return (
    <div className="mb-10">
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-0.5">Moteur IA — {suggestions.length} propositions</p>
          <h2 className="font-editorial text-lg text-ink">Sections suggérées</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-ink-faint">{created.size} créée{created.size > 1 ? 's' : ''}</span>
          <button
            onClick={handleAnalyze}
            className="font-mono text-[10px] tracking-widest uppercase text-ink-muted hover:text-ink transition-colors border border-surface-border px-3 py-1.5"
          >
            Relancer
          </button>
        </div>
      </div>

      {pending.length === 0 && (
        <p className="text-[12px] text-ink-muted font-mono">Toutes les suggestions ont été créées.</p>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {suggestions.map((s, i) => {
          if (created.has(i)) return null
          const isCreating = creating === i
          return (
            <div key={i} className="border border-surface-border bg-surface">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 px-4 py-3 border-b border-surface-border">
                <div className="flex-1 min-w-0">
                  <h3 className="font-editorial text-base text-ink">{s.title}</h3>
                  {s.description && (
                    <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">{s.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-mono text-[9px] tracking-widest uppercase text-ink-muted">{s.refIds.length} réf.</span>
                  <button
                    onClick={() => handleCreate(s, i)}
                    disabled={isCreating}
                    className="px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 transition-opacity disabled:opacity-40"
                  >
                    {isCreating ? '…' : '+ Créer'}
                  </button>
                </div>
              </div>
              {/* Aperçu thumbnails */}
              <div className="flex gap-0">
                {s.previewRefs.map(ref => (
                  <div key={ref.id} className="flex-1 relative overflow-hidden" style={{ maxWidth: '25%' }}>
                    {ref.thumbnailUrl?.startsWith('http') ? (
                      <img
                        src={ref.thumbnailUrl}
                        alt={ref.title}
                        className="w-full aspect-video object-cover opacity-70"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-surface-raised" />
                    )}
                    <div className="absolute inset-0 bg-canvas/40" />
                    <p className="absolute bottom-1 left-1 right-1 text-[9px] font-mono text-ink-muted truncate leading-tight">
                      {ref.channelName}
                    </p>
                  </div>
                ))}
                {s.previewRefs.length < 4 && Array.from({ length: 4 - s.previewRefs.length }).map((_, j) => (
                  <div key={`empty-${j}`} className="flex-1 aspect-video bg-surface-raised opacity-30" style={{ maxWidth: '25%' }} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SectionsAdminPage() {
  const { markDirty } = useAdminStore()
  const [sections, setSections] = useState([])
  const [refs, setRefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiFetch(API_SECTIONS),
      apiFetch(`${API_REFS}?limit=2000`),
    ])
      .then(([sectionsData, refsData]) => {
        setSections(sectionsData.sections ?? [])
        setRefs(refsData.references ?? [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handleCreated(section) {
    setSections(prev => [...prev, { ...section, _count: { references: 0 } }])
  }

  function handleUpdate(updated) {
    setSections(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s))
  }

  function handleDelete(id) {
    setSections(prev => prev.filter(s => s.id !== id))
  }

  // N-N (180-64) : on ajoute / retire l'id de section dans r.sectionIds
  function handleAssign(sectionId, refId) {
    setRefs(prev => prev.map(r =>
      r.id === refId ? { ...r, sectionIds: [...new Set([...(r.sectionIds ?? []), sectionId])] } : r
    ))
  }

  function handleUnassign(sectionId, refId) {
    setRefs(prev => prev.map(r =>
      r.id === refId ? { ...r, sectionIds: (r.sectionIds ?? []).filter(id => id !== sectionId) } : r
    ))
  }

  function handleBulkAssign(sectionId, refIds) {
    const idSet = new Set(refIds)
    setRefs(prev => prev.map(r =>
      idSet.has(r.id) ? { ...r, sectionIds: [...new Set([...(r.sectionIds ?? []), sectionId])] } : r
    ))
  }

  // Réordonnancement optimiste : on échange la section avec sa voisine puis on persiste l'ordre.
  async function handleMove(index, delta) {
    const target = index + delta
    if (target < 0 || target >= sections.length) return
    const reordered = [...sections]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    const withPositions = reordered.map((s, i) => ({ ...s, position: i }))
    const prev = sections
    setSections(withPositions)
    try {
      await apiFetch(`${API_SECTIONS}/reorder`, {
        method: 'POST',
        body: JSON.stringify({ orderedIds: reordered.map(s => s.id) }),
      })
      markDirty()
    } catch {
      setSections(prev) // rollback si l'API échoue
    }
  }

  const unassigned = refs.filter(r => !(r.sectionIds ?? []).length)

  return (
    <div className="px-8 py-8">

      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-1">
            {sections.length} section{sections.length !== 1 ? 's' : ''} · {unassigned.length} réf. non assignées · ordre = affichage Explorer
          </p>
          <h1 className="font-editorial text-3xl text-ink">Sections Explorer</h1>
        </div>
        <NewSectionForm onCreated={handleCreated} />
      </div>

      {loading && <p className="text-ink-muted text-sm font-mono">Chargement…</p>}
      {error && <p className="text-sm text-ink-muted border border-surface-border px-4 py-3" role="alert">{error}</p>}

      {!loading && !error && (
        <>
          <SuggestionsPanel
            refs={refs}
            onSectionCreated={handleCreated}
            onRefsAssigned={handleBulkAssign}
          />

          <div className="flex flex-col gap-4">
            {sections.length === 0 && (
              <p className="text-ink-muted text-sm">
                Aucune section. Créez-en une pour composer les rangées d'Explorer.
              </p>
            )}
            {sections.map((section, i) => (
              <SectionCard
                key={section.id}
                section={section}
                refs={refs}
                index={i}
                total={sections.length}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onAssign={handleAssign}
                onUnassign={handleUnassign}
                onMove={handleMove}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
