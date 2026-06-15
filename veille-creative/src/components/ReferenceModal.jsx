import { useEffect, useRef, useState } from 'react'
import { X, Bookmark, BookmarkCheck, ExternalLink, Play, Award, FolderPlus, Check, Sparkles, Tag } from 'lucide-react'
import { useSaved } from '../store/useSavedStore'
import { api } from '../lib/api'
import { CAMERA_TAGS } from '../lib/referenceTags'

function getEmbedUrl(url) {
  if (!url) return null
  // YouTube: watch?v=ID or youtu.be/ID
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
  return null
}

// Derive a few "spec" fields from the reference data
function deriveSpecs(reference) {
  const tags = reference.taxonomy || []

  const camera = tags.find(t => CAMERA_TAGS.includes(t)) || '—'

  const technique = tags.find(t =>
    ['slow-motion','handheld','travelling','drone','anamorphique','BTS'].includes(t)
  ) || '—'

  const lumiere = tags.find(t =>
    ['golden-hour','basse-lumière','extérieur','lumière naturelle','contre-jour'].includes(t)
  ) || '—'

  const colorimetrie = tags.find(t =>
    ['V-Log','S-Log','LUT','grain','vintage','colorimétrie','S-Cinetone'].includes(t)
  ) || '—'

  return [
    { label: 'Caméra', value: camera.replace(/-/g,' ') },
    { label: 'Technique', value: technique.replace(/-/g,' ') },
    { label: 'Lumière', value: lumiere.replace(/-/g,' ') },
    { label: 'Colorimétrie', value: colorimetrie },
  ]
}

// ── Menu « Ajouter à un projet » (180-68) ───────────────────────────────────
// Charge les projets à l'ouverture, ajoute la réf au projet choisi en préservant
// les items existants (setItems remplace la sélection → on ré-émet le tableau complet).
function AddToProjectMenu({ referenceId, onClose }) {
  const [projects, setProjects] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [result, setResult] = useState(null) // { id, status: 'added' | 'exists' | 'error' }

  useEffect(() => {
    api.projects.list()
      .then(d => setProjects(d.projects ?? []))
      .catch(() => setProjects([]))
  }, [])

  const addTo = async (projectId) => {
    setBusyId(projectId)
    try {
      const project = await api.projects.get(projectId)
      const items = (project.items ?? []).map(i => ({ referenceId: i.referenceId, note: i.note ?? '' }))
      if (items.some(i => i.referenceId === referenceId)) {
        setResult({ id: projectId, status: 'exists' }); setBusyId(null); return
      }
      items.push({ referenceId, note: '' })
      await api.projects.setItems(projectId, items)
      setResult({ id: projectId, status: 'added' })
    } catch {
      setResult({ id: projectId, status: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div
      className="absolute bottom-full left-0 right-0 mb-2 z-30 bg-surface border border-surface-border shadow-[0_8px_40px_rgba(0,0,0,0.7)] max-h-72 overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border sticky top-0 bg-surface">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-muted">Ajouter à un projet</span>
        <button onClick={onClose} className="text-ink-muted hover:text-ink"><X size={13} /></button>
      </div>

      {projects === null && (
        <p className="px-4 py-5 font-mono text-[10px] tracking-widest uppercase text-ink-faint">Chargement…</p>
      )}
      {projects?.length === 0 && (
        <p className="px-4 py-5 text-[12px] text-ink-muted">Aucun projet. Crée-en un depuis l'onglet Projets.</p>
      )}
      {projects?.map(p => {
        const r = result?.id === p.id ? result.status : null
        return (
          <button
            key={p.id}
            onClick={() => addTo(p.id)}
            disabled={busyId === p.id}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left border-b border-surface-border/60 hover:bg-surface-raised transition-colors disabled:opacity-50"
          >
            <span className="text-[13px] text-ink truncate">{p.title}</span>
            {r === 'added'  && <span className="flex items-center gap-1 text-[10px] text-ink"><Check size={11} /> Ajouté</span>}
            {r === 'exists' && <span className="text-[10px] text-ink-muted">Déjà dans le projet</span>}
            {r === 'error'  && <span className="text-[10px] text-red-400">Erreur</span>}
            {!r && <span className="text-[10px] text-ink-faint">{p._count?.items ?? 0} réf.</span>}
          </button>
        )
      })}
    </div>
  )
}

// ── Annotations privées (180-74) — tags libres + note, réutilisables en treatment ──
function AnnotationPanel({ referenceId, initialTags, initialNote, onSaved }) {
  const [tags, setTags] = useState(initialTags ?? [])
  const [note, setNote] = useState(initialNote ?? '')
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState('idle') // idle | saving | saved | error

  const addTag = () => {
    const t = draft.trim()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setDraft('')
  }
  const removeTag = (t) => setTags(tags.filter(x => x !== t))

  const persist = async () => {
    // Intègre un tag tapé mais non encore validé (Entrée/blur) — sinon le clic sur
    // « Enregistrer » lirait `tags` avant la mise à jour du blur et le perdrait.
    const pending = draft.trim()
    const finalTags = pending && !tags.includes(pending) ? [...tags, pending] : tags
    setTags(finalTags)
    setDraft('')
    setStatus('saving')
    try {
      const res = await api.library.annotate(referenceId, { userTags: finalTags, note })
      setTags(res.userTags ?? tags)
      setNote(res.note ?? note)
      setStatus('saved')
      onSaved?.(res)
      setTimeout(() => setStatus('idle'), 1500)
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="border-t border-surface-border px-6 py-5 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2">
        <Tag size={13} className="text-ink" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink">Mes annotations</span>
        <span className="text-[10px] text-ink-faint">privées</span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 text-[10px] px-2 py-1 bg-surface-raised border border-surface-border text-ink">
            {t}
            <button onClick={() => removeTag(t)} className="text-ink-muted hover:text-ink"><X size={9} /></button>
          </span>
        ))}
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
          onBlur={addTag}
          placeholder="+ tag"
          className="text-[10px] px-2 py-1 bg-transparent border border-dashed border-surface-border text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink/40 w-20"
        />
      </div>

      {/* Note */}
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Une note pour toi (intention, usage, client...)"
        rows={3}
        maxLength={2000}
        className="w-full text-[12px] bg-surface border border-surface-border text-ink placeholder:text-ink-faint px-3 py-2 resize-none focus:outline-none focus:border-ink/30 leading-relaxed"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={persist}
          disabled={status === 'saving'}
          className="px-4 py-2 bg-ink text-canvas text-[10px] font-semibold uppercase tracking-[0.12em] hover:bg-ink/90 transition-colors disabled:opacity-50"
        >
          {status === 'saving' ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {status === 'saved' && <span className="flex items-center gap-1 text-[10px] text-ink"><Check size={11} /> Enregistré</span>}
        {status === 'error' && <span className="text-[10px] text-red-400">Erreur — réessaie</span>}
      </div>
    </div>
  )
}

export default function ReferenceModal({ reference, onClose, onAnnotated }) {
  const [saved, toggleSave] = useSaved(reference.id)
  const [isPlaying, setIsPlaying] = useState(false)
  const [projectMenu, setProjectMenu] = useState(false)
  const embedUrl = getEmbedUrl(reference.url)
  const specs = deriveSpecs(reference)
  const awards = reference.awards ?? []

  // Stable ref to always call the latest onClose without re-running the effect
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current()
    window.addEventListener('keydown', onKey)
    const scrollContainer = document.querySelector('main')
    const savedScrollTop = scrollContainer?.scrollTop ?? 0
    if (scrollContainer) scrollContainer.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      if (scrollContainer) {
        scrollContainer.style.overflow = ''
        scrollContainer.scrollTop = savedScrollTop
      }
    }
  }, [])

  // Extract display tags (non-camera, non-technical identifiers)
  const displayTags = (reference.taxonomy || [])
    .filter(t => !CAMERA_TAGS.includes(t))
    .slice(0, 4)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-5xl mx-6 rounded-sm overflow-hidden border border-surface-border shadow-[0px_0px_80px_rgba(0,0,0,0.9)] animate-slide-up"
        style={{ background: '#000000' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-ink-muted hover:text-ink transition-colors"
        >
          <X size={14} />
        </button>

        <div className="grid grid-cols-[1fr_340px]" style={{ minHeight: 520 }}>

          {/* ── LEFT: Video / Thumbnail ──────────────────────────── */}
          <div className="relative bg-black overflow-hidden flex flex-col">
            <div className="relative flex-1">
              {isPlaying && embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  style={{ aspectRatio: '16/10', minHeight: 360 }}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  {/* Thumbnail */}
                  <img
                    src={reference.thumbnailUrl}
                    alt={reference.title}
                    className="w-full h-full object-cover opacity-80"
                    style={{ aspectRatio: '16/10' }}
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Awards banner (style Netflix) */}
                  {awards.length > 0 && (
                    <div className="absolute top-5 left-6 flex items-center gap-2 bg-ink/95 text-canvas px-3 py-1.5">
                      <Award size={13} />
                      <span className="text-[11px] font-semibold tracking-[0.04em]">{awards.join(' · ')}</span>
                    </div>
                  )}

                  {/* Play button */}
                  <button
                    className="absolute inset-0 flex items-center justify-center"
                    onClick={() => embedUrl ? setIsPlaying(true) : window.open(reference.url, '_blank')}
                  >
                    <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
                      <Play size={28} fill="white" className="text-white ml-1" />
                    </div>
                  </button>

                  {/* Tech label bottom-left */}
                  <div className="absolute bottom-5 left-6">
                    <span className="text-[10px] text-white/40 uppercase tracking-[0.1em] font-mono">
                      {reference.platform} · {reference.typeContenu || 'video'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Annotations privées — uniquement pour une réf sauvegardée (vivier) */}
            {saved && (
              <AnnotationPanel
                referenceId={reference.id}
                initialTags={reference.userTags}
                initialNote={reference.note}
                onSaved={(res) => onAnnotated?.(reference.id, res)}
              />
            )}

            {/* Similaires — emplacement (reco par similarité, v0.9, gated enrichissement) */}
            <div className="border-t border-surface-border px-6 py-4 flex items-center gap-2.5">
              <Sparkles size={13} className="text-ink-muted flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-muted">Dans la même veine</span>
                <span className="text-[11px] text-ink-faint">Recommandations par similarité — bientôt (v0.9)</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Structured Sidebar ───────────────────────── */}
          <div className="flex flex-col border-l border-surface-border" style={{ background: '#000000' }}>

            {/* Identification */}
            <div className="px-8 py-8 border-b border-surface-border flex flex-col gap-4">
              {/* Type badge + creator link */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold bg-ink text-canvas px-2 py-0.5 tracking-[-0.02em]">
                  {reference.mood?.toUpperCase() || 'REF'}
                </span>
                {reference.channelUrl ? (
                  <a
                    href={reference.channelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] text-ink-muted hover:text-ink uppercase tracking-[0.15em] font-medium transition-colors"
                  >
                    {reference.channelName || reference.platform}
                    <ExternalLink size={9} />
                  </a>
                ) : (
                  <span className="text-[10px] text-ink-muted uppercase tracking-[0.15em] font-medium">
                    {reference.channelName || reference.platform}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="font-editorial text-[22px] text-ink leading-[1.1] tracking-[-0.03em]">
                {reference.title}
              </h2>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {displayTags.map(tag => (
                  <span
                    key={tag}
                    className="text-[9px] font-semibold uppercase tracking-[0.08em] px-3 py-1 border border-surface-border text-ink-muted"
                  >
                    {tag.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Analyse Technique */}
            {reference.context && (
              <div className="px-8 py-7 border-b border-surface-border flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-ink block" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-ink">
                    Analyse Technique
                  </span>
                </div>
                <p className="text-[12px] text-ink-muted leading-[1.65] opacity-90">
                  {reference.context}
                </p>
              </div>
            )}

            {/* Specs grid */}
            <div className="grid grid-cols-2 flex-1">
              {specs.map((spec, i) => {
                const isRightCol = i % 2 === 1
                const isLastRow  = i >= specs.length - 2
                return (
                  <div
                    key={spec.label}
                    className={[
                      'flex flex-col gap-1.5 px-6 py-6',
                      !isRightCol ? 'border-r border-surface-border' : '',
                      !isLastRow  ? 'border-b border-surface-border' : '',
                    ].join(' ')}
                  >
                    <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                      {spec.label}
                    </span>
                    <span className="text-[14px] font-semibold text-ink capitalize">
                      {spec.value}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Footer actions */}
            <div className="relative px-8 py-7 flex items-center gap-3 border-t border-surface-border" style={{ background: '#000000' }}>
              {projectMenu && (
                <AddToProjectMenu referenceId={reference.id} onClose={() => setProjectMenu(false)} />
              )}
              <button
                onClick={() => toggleSave().catch(() => {})}
                className={`flex flex-1 items-center justify-center gap-2.5 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] transition-all ${
                  saved
                    ? 'bg-surface-raised text-ink border border-ink/20'
                    : 'bg-ink text-canvas hover:bg-ink/90'
                }`}
              >
                {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                {saved ? 'Sauvegardé' : 'Sauvegarder'}
              </button>
              <button
                onClick={() => setProjectMenu(v => !v)}
                title="Ajouter à un projet"
                className={`w-12 h-12 flex items-center justify-center border transition-all ${
                  projectMenu ? 'border-ink text-ink' : 'border-surface-border text-ink-muted hover:text-ink hover:border-ink-muted'
                }`}
              >
                <FolderPlus size={15} />
              </button>
              <a
                href={reference.url}
                target="_blank"
                rel="noreferrer"
                title="Ouvrir la source"
                className="w-12 h-12 flex items-center justify-center border border-surface-border text-ink-muted hover:text-ink hover:border-ink-muted transition-all"
              >
                <ExternalLink size={15} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
