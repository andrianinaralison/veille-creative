/**
 * CurationPage — /admin/curation
 *
 * Deux parcours d'import :
 *   Tab "Créateurs"  → gérer la liste des créateurs + lancer un scan YouTube de toute leur chaîne
 *   Tab "Liens"      → coller des URLs YouTube en vrac, le serveur fetch les métadonnées
 *
 * Phase partagée : monitoring live → tableau de validation DRAFT / PUBLISHED / REJECTED
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAdminStore } from '../../store/useAdminStore'
import { adminFetch } from '../../lib/admin-api'

const ADMIN_API = '/api/v1/admin'
const ING_API   = '/api/v1/ingestion'

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function ytThumb(url) {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null
}

function apiFetch(path, opts = {}) {
  return adminFetch(path, opts)
}

// ─── Taxonomie tags ───────────────────────────────────────────────────────────

const ALLOWED_TAGS = [
  'Sony-FX3','Sony-A7SIII','Sony-A1','Canon-C70','Canon-C80','Lumix-S5ii','Lumix-S1','Blackmagic','RED','ARRI',
  'slow-motion','handheld','travelling','drone','stabilisé','anamorphique','BTS',
  'golden-hour','basse-lumière','lumière-naturelle','V-Log','LUT','grain','vintage','S-Cinetone',
  'transitions','montage-rythmé','narrative','cut-on-beat',
  'mariage','corporate','B2B','événementiel','gala','awards','startup','portrait','clip','documentaire',
]

// ─── TagEditor ────────────────────────────────────────────────────────────────

function TagEditor({ tags, onChange }) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const toggle = tag => onChange(tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag])
  const addCustom = () => {
    const v = custom.trim().toLowerCase().replace(/\s+/g, '-')
    if (v && !tags.includes(v)) onChange([...tags, v])
    setCustom('')
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex flex-wrap gap-1 min-h-[24px]">
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase text-ink border border-surface-border px-1.5 py-0.5">
            {t}
            <button type="button" onClick={() => toggle(t)} className="text-ink-faint hover:text-ink transition-colors leading-none">×</button>
          </span>
        ))}
        <button type="button" onClick={() => setOpen(v => !v)} className="font-mono text-[9px] tracking-widest uppercase text-ink-muted hover:text-ink border border-dashed border-surface-border px-1.5 py-0.5 transition-colors">+ tag</button>
      </div>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-surface border border-surface-border p-3 w-72 shadow-xl">
          <div className="flex flex-wrap gap-1 mb-2">
            {ALLOWED_TAGS.map(t => (
              <button key={t} type="button" onClick={() => toggle(t)}
                className={`font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5 border transition-colors ${tags.includes(t) ? 'border-ink text-ink bg-surface-raised' : 'border-surface-border text-ink-muted hover:border-ink hover:text-ink'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-1 border-t border-surface-border pt-2">
            <input value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }} placeholder="Tag custom…" className="flex-1 bg-canvas border border-surface-border text-ink text-[10px] font-mono px-2 py-1 outline-none focus:border-ink placeholder-ink-faint" />
            <button type="button" onClick={addCustom} className="px-2 py-1 text-[10px] font-mono bg-ink text-canvas hover:opacity-80 transition-opacity">↵</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SectionSelector ──────────────────────────────────────────────────────────

function SectionSelector({ sectionId, sections, onChange }) {
  return (
    <select value={sectionId ?? ''} onChange={e => onChange(e.target.value || null)}
      className="w-full bg-canvas border border-surface-border text-ink text-[10px] font-mono tracking-wide px-2 py-1 outline-none focus:border-ink appearance-none cursor-pointer">
      <option value="">— Aucune section —</option>
      {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
    </select>
  )
}

// ─── StatusDropdown ───────────────────────────────────────────────────────────

function StatusDropdown({ status, onChange }) {
  return (
    <select value={status} onChange={e => onChange(e.target.value)}
      className={`w-full bg-canvas border text-[10px] font-mono tracking-widest uppercase px-2 py-1 outline-none focus:border-ink appearance-none cursor-pointer ${status === 'PUBLISHED' ? 'border-ink text-ink' : status === 'REJECTED' ? 'border-surface-border text-ink-faint' : 'border-surface-border text-ink-muted'}`}>
      <option value="DRAFT">Draft</option>
      <option value="PUBLISHED">Publier</option>
      <option value="REJECTED">Rejeter</option>
    </select>
  )
}

// ─── RefRow ───────────────────────────────────────────────────────────────────

function RefRow({ ref, sections, onSaved }) {
  const { markDirty } = useAdminStore()
  const [tags, setTags] = useState(ref.tags ?? [])
  const [sectionId, setSectionId] = useState(ref.sectionId ?? null)
  const [status, setStatus] = useState(ref.status ?? 'DRAFT')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [descOpen, setDescOpen] = useState(false)

  const thumb = ref.thumbnailUrl?.startsWith('http') ? ref.thumbnailUrl : ytThumb(ref.url)
  const isDirtyLocal =
    JSON.stringify(tags) !== JSON.stringify(ref.tags ?? []) ||
    sectionId !== (ref.sectionId ?? null) ||
    status !== (ref.status ?? 'DRAFT')

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      await apiFetch(`${ADMIN_API}/references/${ref.id}`, { method: 'PATCH', body: JSON.stringify({ tags }) })
      if (status !== ref.status) {
        await apiFetch(`${ADMIN_API}/references/${ref.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      }
      if (sectionId !== ref.sectionId) {
        if (sectionId) {
          await apiFetch(`${ADMIN_API}/sections/${sectionId}/assign`, { method: 'POST', body: JSON.stringify({ refIds: [ref.id] }) })
        } else {
          await apiFetch(`${ADMIN_API}/sections/unassign`, { method: 'POST', body: JSON.stringify({ refIds: [ref.id] }) })
        }
      }
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

  return (
    <tr className="border-b border-surface-border hover:bg-surface-raised transition-colors group">
      <td className="p-2 w-28 flex-shrink-0">
        <a href={ref.url} target="_blank" rel="noopener noreferrer" className="block relative">
          {thumb ? (
            <img src={thumb} alt="" className="w-24 h-14 object-cover opacity-80 hover:opacity-100 transition-opacity" />
          ) : (
            <div className="w-24 h-14 bg-canvas border border-surface-border flex items-center justify-center">
              <span className="font-mono text-[8px] text-ink-faint">—</span>
            </div>
          )}
        </a>
      </td>
      <td className="p-2 w-48">
        <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-ink leading-snug line-clamp-3 hover:opacity-70 transition-opacity block">{ref.title}</a>
      </td>
      <td className="p-2 w-10">
        {ref.channelAvatarUrl ? (
          <img src={ref.channelAvatarUrl} alt="" className="w-8 h-8 rounded-full object-cover opacity-80" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-surface border border-surface-border flex items-center justify-center">
            <span className="font-mono text-[8px] text-ink-faint uppercase">{ref.channelName?.charAt(0) ?? '?'}</span>
          </div>
        )}
      </td>
      <td className="p-2 w-32">
        <a href={ref.channelUrl || '#'} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] tracking-wide text-ink-muted hover:text-ink transition-colors line-clamp-2">{ref.channelName || '—'}</a>
      </td>
      <td className="p-2 w-56">
        <div className="relative">
          <p className={`text-[11px] text-ink-muted leading-relaxed ${descOpen ? '' : 'line-clamp-3'}`}>{ref.description || '—'}</p>
          {(ref.description?.length ?? 0) > 120 && (
            <button type="button" onClick={() => setDescOpen(v => !v)} className="font-mono text-[9px] tracking-widest uppercase text-ink-faint hover:text-ink transition-colors mt-0.5">
              {descOpen ? 'Réduire ↑' : 'Voir plus ↓'}
            </button>
          )}
        </div>
      </td>
      <td className="p-2 w-52"><TagEditor tags={tags} onChange={setTags} /></td>
      <td className="p-2 w-40"><SectionSelector sectionId={sectionId} sections={sections} onChange={setSectionId} /></td>
      <td className="p-2 w-32"><StatusDropdown status={status} onChange={setStatus} /></td>
      <td className="p-2 w-24">
        {saved ? (
          <span className="font-mono text-[9px] tracking-widest uppercase text-ink-muted" role="status">✓ Enreg.</span>
        ) : (
          <button type="button" onClick={handleSave} disabled={saving || !isDirtyLocal}
            className={`px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase border transition-colors ${isDirtyLocal ? 'border-ink bg-ink text-canvas hover:opacity-80' : 'border-surface-border text-ink-faint cursor-default'} disabled:opacity-40`}>
            {saving ? '…' : 'Sauver'}
          </button>
        )}
      </td>
    </tr>
  )
}

// ─── MonitoringView ───────────────────────────────────────────────────────────

function MonitoringView({ sessionId, onCompleted }) {
  const [session, setSession] = useState(null)
  const intervalRef = useRef(null)

  const poll = useCallback(async () => {
    try {
      const data = await apiFetch(`${ING_API}/sessions/${sessionId}`)
      setSession(data)
      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        clearInterval(intervalRef.current)
        if (data.status === 'COMPLETED') onCompleted(data)
      }
    } catch (err) {
      console.error('[Monitoring] poll error', err)
    }
  }, [sessionId, onCompleted])

  useEffect(() => {
    poll()
    intervalRef.current = setInterval(poll, 2000)
    return () => clearInterval(intervalRef.current)
  }, [poll])

  const isFailed   = session?.status === 'FAILED'
  const isRunning  = session?.status === 'RUNNING' || !session
  const found      = session?.totalFound ?? 0
  const saved      = session?.totalSaved ?? 0

  return (
    <div className="border border-surface-border p-8 max-w-lg mt-8">
      <div className="flex items-center gap-3 mb-6">
        {isRunning && !isFailed && (
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full bg-ink opacity-40" />
            <span className="relative inline-flex h-2 w-2 bg-ink" />
          </span>
        )}
        <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted">
          {isFailed ? 'Échec' : session?.status === 'COMPLETED' ? 'Terminé' : 'En cours…'}
        </p>
      </div>

      <div className="flex gap-8 mb-4">
        <div>
          <p className="font-mono text-[9px] tracking-widest uppercase text-ink-muted mb-1">Trouvées</p>
          <p className="font-editorial text-3xl text-ink">{found}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] tracking-widest uppercase text-ink-muted mb-1">Sauvegardées</p>
          <p className="font-editorial text-3xl text-ink">{saved}</p>
        </div>
      </div>

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
          Erreur — vérifiez les logs serveur.
        </p>
      )}
    </div>
  )
}

// ─── ResultsTable ─────────────────────────────────────────────────────────────

function ResultsTable({ session, sections, onNewImport }) {
  const [refs, setRefs] = useState(session.references ?? [])
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')

  const q        = search.trim().toLowerCase()
  const filtered = refs.filter(r => {
    const matchStatus = !filterStatus || r.status === filterStatus
    const matchSearch = !q || r.title?.toLowerCase().includes(q) || r.channelName?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })
  const counts = refs.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {})

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-1">
            {refs.length} référence{refs.length !== 1 ? 's' : ''} — {session.brief}
          </p>
          <h2 className="font-editorial text-2xl text-ink">Validation</h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Titre, créateur…" className="bg-surface border border-surface-border text-ink text-sm px-3 py-1.5 w-48 outline-none focus:border-ink placeholder-ink-faint" />
          <div className="flex gap-1">
            {[['', 'Tous'], ['DRAFT', 'Draft'], ['PUBLISHED', 'Publiés'], ['REJECTED', 'Rejetés']].map(([val, label]) => (
              <button key={val} onClick={() => setFilterStatus(val)} aria-pressed={filterStatus === val}
                className={`px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase border transition-colors ${filterStatus === val ? 'border-ink text-ink' : 'border-surface-border text-ink-muted hover:text-ink'}`}>
                {label}{val && counts[val] > 0 ? <span className="ml-1 opacity-40">{counts[val]}</span> : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-surface-border px-6 py-12 text-center">
          <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted">Aucune référence</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-surface-border">
                {['Thumbnail','Titre','','Créateur','Description','Tags','Section','Statut',''].map((h, i) => (
                  <th key={i} className="p-2 text-left font-mono text-[9px] tracking-widest uppercase text-ink-muted whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <RefRow key={r.id} ref={r} sections={sections} onSaved={updated => setRefs(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x))} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-surface-border">
        <button type="button" onClick={onNewImport} className="font-mono text-[10px] tracking-widest uppercase text-ink-muted hover:text-ink border border-surface-border px-4 py-2 transition-colors">
          ← Nouvel import
        </button>
      </div>
    </div>
  )
}

// ─── Tab Créateurs ────────────────────────────────────────────────────────────

function CreatorsTab({ onSessionStarted }) {
  const [creators, setCreators]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [scanning, setScanning]     = useState(null) // creatorId en cours ou 'all'
  const [form, setForm]             = useState({ name: '', youtubeHandle: '', instagramHandle: '', vimeoUrl: '', websiteUrl: '' })
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [formErr, setFormErr]       = useState(null)
  const [saving, setSaving]         = useState(false)

  const PLATFORMS = [
    {
      key: 'youtubeHandle',
      id: 'youtube',
      label: 'YouTube',
      placeholder: '@RunawayVows',
      hint: 'Handle (@) ou URL complète — requis pour le scan chaîne',
    },
    {
      key: 'instagramHandle',
      id: 'instagram',
      label: 'Instagram',
      placeholder: '@runawayvows',
      hint: 'Handle Instagram (avec ou sans @)',
    },
    {
      key: 'vimeoUrl',
      id: 'vimeo',
      label: 'Vimeo',
      placeholder: 'https://vimeo.com/runawayvows',
      hint: 'Lien du profil Vimeo',
    },
    {
      key: 'websiteUrl',
      id: 'website',
      label: 'Site web',
      placeholder: 'https://runawayvows.com',
      hint: 'URL du site officiel',
    },
  ]

  const activePlatform = PLATFORMS.find(p => p.id === selectedPlatform)

  useEffect(() => {
    apiFetch(`${ADMIN_API}/creators`)
      .then(d => setCreators(d.creators ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim()) { setFormErr('Nom requis'); return }
    const hasAnyProfile = PLATFORMS.some(p => form[p.key].trim())
    if (!hasAnyProfile) { setFormErr('Renseigne au moins un profil'); return }
    setSaving(true)
    setFormErr(null)
    try {
      const created = await apiFetch(`${ADMIN_API}/creators`, {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setCreators(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setForm({ name: '', youtubeHandle: '', instagramHandle: '', vimeoUrl: '', websiteUrl: '' })
      setSelectedPlatform('')
      setShowForm(false)

      // Si YouTube renseigné → scan immédiat, bascule sur monitoring
      if (created.youtubeHandle || created.url) {
        startScan([created.id], created.name).catch(console.error)
      }
    } catch (err) {
      setFormErr(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(creator) {
    try {
      const updated = await apiFetch(`${ADMIN_API}/creators/${creator.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !creator.active }),
      })
      setCreators(prev => prev.map(c => c.id === updated.id ? updated : c))
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce créateur ?')) return
    try {
      await apiFetch(`${ADMIN_API}/creators/${id}`, { method: 'DELETE' })
      setCreators(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  async function startScan(creatorIds, label = '') {
    setScanning(creatorIds?.length === 1 ? creatorIds[0] : 'all')
    try {
      const { sessionId } = await apiFetch(`${ING_API}/creator-scan`, {
        method: 'POST',
        body: JSON.stringify({ creatorIds }),
      })
      onSessionStarted(sessionId, label)
    } catch (err) {
      console.error(err)
      setScanning(null)
    }
  }

  const activeCreators = creators.filter(c => c.active)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-editorial text-2xl text-ink">Créateurs</h2>
          <p className="text-ink-muted text-xs mt-1 font-mono">{creators.length} enregistré{creators.length !== 1 ? 's' : ''} · {activeCreators.length} actif{activeCreators.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          {activeCreators.length > 0 && (
            <button
              type="button"
              onClick={() => startScan(null)}
              disabled={!!scanning}
              className="px-4 py-2 text-[10px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              {scanning === 'all' ? 'Lancement…' : `Tout scrapper (${activeCreators.length})`}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowForm(v => !v)}
            className="px-4 py-2 text-[10px] font-mono tracking-widest uppercase border border-surface-border text-ink-muted hover:text-ink hover:border-ink transition-colors"
          >
            {showForm ? 'Annuler' : '+ Ajouter'}
          </button>
        </div>
      </div>

      {/* Formulaire ajout */}
      {showForm && (
        <form onSubmit={handleAdd} className="border border-surface-border p-5 mb-6 max-w-lg">
          <p className="font-mono text-[9px] tracking-widest uppercase text-ink-muted mb-4">Nouveau créateur</p>

          {/* Nom */}
          <div className="mb-4">
            <label className="font-mono text-[9px] tracking-widest uppercase text-ink-muted block mb-1">Nom *</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Runaway Vows"
              required
              className="w-full bg-canvas border border-surface-border text-ink text-xs px-3 py-2 outline-none focus:border-ink placeholder-ink-faint"
            />
          </div>

          {/* Sélecteur de profil source */}
          <div className="mb-3">
            <label className="font-mono text-[9px] tracking-widest uppercase text-ink-muted block mb-1">Profil source</label>
            <select
              value={selectedPlatform}
              onChange={e => setSelectedPlatform(e.target.value)}
              className="w-full bg-canvas border border-surface-border text-ink text-xs px-3 py-2 outline-none focus:border-ink appearance-none cursor-pointer"
            >
              <option value="">— Choisir une plateforme —</option>
              {PLATFORMS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.label}{form[p.key] ? ' ✓' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Champ contextuel selon la plateforme choisie */}
          {activePlatform && (
            <div className="mb-4 pl-3 border-l-2 border-surface-border">
              <label className="font-mono text-[9px] tracking-widest uppercase text-ink-muted block mb-1">
                {activePlatform.label}
              </label>
              <input
                key={activePlatform.id}
                autoFocus
                value={form[activePlatform.key]}
                onChange={e => setForm(p => ({ ...p, [activePlatform.key]: e.target.value }))}
                placeholder={activePlatform.placeholder}
                className="w-full bg-canvas border border-surface-border text-ink text-xs px-3 py-2 outline-none focus:border-ink placeholder-ink-faint"
              />
              <p className="font-mono text-[8px] text-ink-faint mt-1">{activePlatform.hint}</p>
            </div>
          )}

          {/* Récap des profils remplis */}
          {PLATFORMS.some(p => form[p.key]) && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {PLATFORMS.filter(p => form[p.key]).map(p => (
                <span
                  key={p.id}
                  className="flex items-center gap-1.5 font-mono text-[9px] tracking-wide border border-surface-border px-2 py-0.5 text-ink-muted"
                >
                  <span className="text-ink">{p.label}</span>
                  {form[p.key]}
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, [p.key]: '' }))}
                    className="text-ink-faint hover:text-ink leading-none"
                  >×</button>
                </span>
              ))}
            </div>
          )}

          {formErr && <p className="mb-3 text-[11px] text-ink-muted border border-surface-border px-3 py-2">{formErr}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-5 py-2 text-[10px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 transition-opacity disabled:opacity-40">
              {saving ? 'Ajout…' : 'Ajouter'}
            </button>
          </div>
        </form>
      )}

      {/* Liste des créateurs */}
      {loading ? (
        <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted">Chargement…</p>
      ) : creators.length === 0 ? (
        <div className="border border-dashed border-surface-border px-6 py-12 text-center">
          <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-2">Aucun créateur enregistré</p>
          <p className="text-xs text-ink-faint">Ajoutez vos premiers créateurs pour commencer le scan.</p>
        </div>
      ) : (
        <div className="border border-surface-border divide-y divide-surface-border">
          {creators.map(creator => (
            <div key={creator.id} className={`flex items-center gap-4 px-4 py-3 transition-colors ${creator.active ? '' : 'opacity-40'}`}>
              {/* Indicateur actif */}
              <span className={`w-1.5 h-1.5 flex-shrink-0 ${creator.active ? 'bg-ink' : 'bg-surface-border'}`} />

              {/* Info créateur */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink font-medium mb-1">{creator.name}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  {creator.youtubeHandle && (
                    <a
                      href={creator.url || `https://youtube.com/@${creator.youtubeHandle.replace(/^@/, '')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 font-mono text-[9px] tracking-wide text-ink-muted hover:text-ink transition-colors"
                    >
                      <span className="text-[8px] border border-surface-border px-1 py-px">YT</span>
                      {creator.youtubeHandle.startsWith('@') ? creator.youtubeHandle : `@${creator.youtubeHandle}`}
                    </a>
                  )}
                  {creator.instagramHandle && (
                    <a
                      href={`https://instagram.com/${creator.instagramHandle.replace(/^@/, '')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 font-mono text-[9px] tracking-wide text-ink-muted hover:text-ink transition-colors"
                    >
                      <span className="text-[8px] border border-surface-border px-1 py-px">IG</span>
                      {creator.instagramHandle.startsWith('@') ? creator.instagramHandle : `@${creator.instagramHandle}`}
                    </a>
                  )}
                  {creator.vimeoUrl && (
                    <a href={creator.vimeoUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 font-mono text-[9px] tracking-wide text-ink-muted hover:text-ink transition-colors"
                    >
                      <span className="text-[8px] border border-surface-border px-1 py-px">VI</span>
                      Vimeo
                    </a>
                  )}
                  {creator.websiteUrl && (
                    <a href={creator.websiteUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 font-mono text-[9px] tracking-wide text-ink-muted hover:text-ink transition-colors"
                    >
                      <span className="text-[8px] border border-surface-border px-1 py-px">WEB</span>
                      {creator.websiteUrl.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => startScan([creator.id], creator.name)}
                  disabled={!!scanning}
                  className="px-3 py-1.5 text-[9px] font-mono tracking-widest uppercase border border-surface-border text-ink-muted hover:text-ink hover:border-ink transition-colors disabled:opacity-40"
                >
                  {scanning === creator.id ? '…' : 'Scrapper'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(creator)}
                  className="px-3 py-1.5 text-[9px] font-mono tracking-widest uppercase border border-surface-border text-ink-muted hover:text-ink hover:border-ink transition-colors"
                  title={creator.active ? 'Désactiver' : 'Activer'}
                >
                  {creator.active ? 'Actif' : 'Inactif'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(creator.id)}
                  className="px-3 py-1.5 text-[9px] font-mono tracking-widest uppercase border border-surface-border text-ink-faint hover:text-ink hover:border-ink transition-colors"
                  title="Supprimer"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab Liens ────────────────────────────────────────────────────────────────

function LinksTab({ onSessionStarted }) {
  const [raw, setRaw]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const urls = raw.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!urls.length || loading) return
    setLoading(true)
    setError(null)
    try {
      const { sessionId } = await apiFetch(`${ING_API}/links`, {
        method: 'POST',
        body: JSON.stringify({ urls }),
      })
      onSessionStarted(sessionId)
    } catch (err) {
      setError(err.message || 'Erreur serveur')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-editorial text-2xl text-ink mb-2">Liens manuels</h2>
      <p className="text-ink-muted text-sm mb-8 leading-relaxed font-mono text-[11px] tracking-wide">
        Collez des URLs YouTube (une par ligne). Le serveur récupère automatiquement le titre, la description, les stats et la thumbnail.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="font-mono text-[9px] tracking-widest uppercase text-ink-muted block mb-2">URLs YouTube — une par ligne</label>
          <textarea
            value={raw}
            onChange={e => setRaw(e.target.value)}
            rows={10}
            placeholder={"https://www.youtube.com/watch?v=...\nhttps://www.youtube.com/watch?v=...\nhttps://youtu.be/..."}
            disabled={loading}
            className="w-full bg-surface border border-surface-border text-ink text-sm px-4 py-3 outline-none focus:border-ink transition-colors resize-none placeholder-ink-faint leading-relaxed disabled:opacity-50 font-mono text-[11px]"
          />
          <p className="font-mono text-[9px] tracking-widest uppercase text-ink-faint mt-1">
            {urls.length > 0 ? `${urls.length} URL${urls.length !== 1 ? 's' : ''} détectée${urls.length !== 1 ? 's' : ''}` : 'Aucune URL détectée'}
          </p>
        </div>

        {error && <p className="text-[11px] text-ink-muted border border-surface-border px-3 py-2" role="alert">Erreur — {error}</p>}

        <button
          type="submit"
          disabled={!urls.length || loading}
          className="self-start px-6 py-2.5 text-sm font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? 'Lancement…' : `Importer ${urls.length || ''} lien${urls.length !== 1 ? 's' : ''}`}
        </button>
      </form>
    </div>
  )
}

// ─── Page principale ───────────────────────────────────────────────────────────

export default function CurationPage() {
  const [tab, setTab]                     = useState('creators')  // 'creators' | 'links'
  const [phase, setPhase]                 = useState('idle')      // 'idle' | 'running' | 'results'
  const [sessionId, setSessionId]         = useState(null)
  const [scanLabel, setScanLabel]         = useState('')
  const [completedSession, setCompletedSession] = useState(null)
  const [sections, setSections]           = useState([])

  useEffect(() => {
    apiFetch(`${ADMIN_API}/sections`)
      .then(d => setSections(d.sections ?? []))
      .catch(console.error)
  }, [])

  function handleSessionStarted(id, label = '') {
    setSessionId(id)
    setScanLabel(label)
    setPhase('running')
  }

  const handleCompleted = useCallback((session) => {
    setCompletedSession(session)
    setPhase('results')
  }, [])

  function handleNewImport() {
    setPhase('idle')
    setSessionId(null)
    setCompletedSession(null)
  }

  return (
    <div className="px-8 py-10">

      {/* ── Header + tabs ── */}
      {phase === 'idle' && (
        <>
          <div className="mb-8">
            <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-1">Admin · Curation</p>
            <h1 className="font-editorial text-3xl text-ink">Import de références</h1>
          </div>

          <div className="flex gap-0 mb-8 border-b border-surface-border">
            {[
              { id: 'creators', label: 'Créateurs' },
              { id: 'links',    label: 'Liens manuels' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase border-b-2 transition-colors -mb-px ${
                  tab === id
                    ? 'border-ink text-ink'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'creators' && <CreatorsTab onSessionStarted={handleSessionStarted} />}
          {tab === 'links'    && <LinksTab    onSessionStarted={handleSessionStarted} />}
        </>
      )}

      {/* ── Phase monitoring ── */}
      {phase === 'running' && sessionId && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <button type="button" onClick={handleNewImport} className="font-mono text-[10px] tracking-widest uppercase text-ink-muted hover:text-ink transition-colors">
              ← Retour
            </button>
            <span className="text-ink-faint text-[10px]">/</span>
            <span className="font-mono text-[10px] tracking-widest uppercase text-ink">Agent en cours</span>
          </div>
          <h1 className="font-editorial text-3xl text-ink mb-2">
            {scanLabel ? `Scan — ${scanLabel}` : 'Récupération en cours'}
          </h1>
          <p className="font-mono text-[9px] tracking-widest uppercase text-ink-faint">Session · {sessionId}</p>
          <MonitoringView sessionId={sessionId} onCompleted={handleCompleted} />
        </div>
      )}

      {/* ── Phase résultats ── */}
      {phase === 'results' && completedSession && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <button type="button" onClick={handleNewImport} className="font-mono text-[10px] tracking-widest uppercase text-ink-muted hover:text-ink transition-colors">
              ← Retour
            </button>
            <span className="text-ink-faint text-[10px]">/</span>
            <span className="font-mono text-[10px] tracking-widest uppercase text-ink">Résultats</span>
          </div>
          <ResultsTable session={completedSession} sections={sections} onNewImport={handleNewImport} />
        </div>
      )}

    </div>
  )
}
