import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, ChevronDown, Bookmark, BookmarkCheck, SlidersHorizontal, X, Play } from 'lucide-react'
import ReferenceModal from '../components/ReferenceModal'
import { api } from '../lib/api'
import { useSavedStore } from '../store/useSavedStore'

// ─── Filter config ────────────────────────────────────────────────────────────

const FILTER_GROUPS = [
  {
    id: 'categorie',
    label: 'Catégorie',
    options: [
      { id: 'mariage',      label: 'Mariage',         match: r => r.mood === 'romantique' || (r.taxonomy ?? []).includes('mariage') },
      { id: 'corporate',    label: 'Corporate & B2B',  match: r => (r.taxonomy ?? []).some(t => ['corporate','B2B'].includes(t)) },
      { id: 'evenementiel', label: 'Événementiel',     match: r => (r.taxonomy ?? []).includes('événementiel') },
      { id: 'gala',         label: 'Gala & Awards',    match: r => (r.taxonomy ?? []).some(t => ['gala','awards'].includes(t)) },
      { id: 'startup',      label: 'Startup',          match: r => (r.taxonomy ?? []).includes('startup') },
    ],
  },
  {
    id: 'ambiance',
    label: 'Ambiance',
    options: [
      { id: 'romantique',    label: 'Romantique',    match: r => r.mood === 'romantique' },
      { id: 'professionnel', label: 'Professionnel', match: r => r.mood === 'professionnel' },
      { id: 'vivant',        label: 'Vivant',        match: r => r.mood === 'vivant' },
      { id: 'elegant',       label: 'Élégant',       match: r => r.mood === 'élégant' },
      { id: 'serieux',       label: 'Sérieux',       match: r => r.mood === 'sérieux' },
      { id: 'epique',        label: 'Épique',        match: r => r.mood === 'épique' },
    ],
  },
  {
    id: 'camera',
    label: 'Caméra',
    options: [
      { id: 'sony',       label: 'Sony FX3 / A1',      match: r => (r.taxonomy ?? []).includes('Sony-FX3') },
      { id: 'canon',      label: 'Canon C70 / C80',     match: r => (r.taxonomy ?? []).includes('Canon-C70') },
      { id: 'lumix',      label: 'Lumix S5ii / S1',     match: r => (r.taxonomy ?? []).includes('Lumix-S5ii') },
      { id: 'blackmagic', label: 'Blackmagic BMPCC',    match: r => (r.taxonomy ?? []).includes('Blackmagic') },
    ],
  },
  {
    id: 'colorimetrie',
    label: 'Colorimétrie',
    options: [
      { id: 'golden-hour',  label: 'Golden hour',    match: r => (r.taxonomy ?? []).includes('golden-hour') },
      { id: 'vlog',         label: 'V-Log',          match: r => (r.taxonomy ?? []).includes('V-Log') },
      { id: 'lut',          label: 'LUT',            match: r => (r.taxonomy ?? []).includes('LUT') },
      { id: 'grain',        label: 'Grain film',     match: r => (r.taxonomy ?? []).includes('grain') },
      { id: 'vintage',      label: 'Vintage',        match: r => (r.taxonomy ?? []).includes('vintage') },
      { id: 'anamorphique', label: 'Anamorphique',   match: r => (r.taxonomy ?? []).includes('anamorphique') },
    ],
  },
  {
    id: 'technique',
    label: 'Technique de prise de vue',
    options: [
      { id: 'slow-motion',  label: 'Slow motion',    match: r => (r.taxonomy ?? []).includes('slow-motion') },
      { id: 'handheld',     label: 'Handheld',       match: r => (r.taxonomy ?? []).includes('handheld') },
      { id: 'travelling',   label: 'Travelling',     match: r => (r.taxonomy ?? []).includes('travelling') },
      { id: 'bts',          label: 'Making-of / BTS',match: r => (r.taxonomy ?? []).includes('BTS') },
    ],
  },
  {
    id: 'lumiere',
    label: 'Lumière',
    options: [
      { id: 'basse-lumiere',     label: 'Basse lumière',      match: r => (r.taxonomy ?? []).includes('basse-lumière') },
      { id: 'exterieur',         label: 'Extérieur',          match: r => (r.taxonomy ?? []).includes('extérieur') },
      { id: 'lumiere-naturelle', label: 'Lumière naturelle',  match: r => (r.taxonomy ?? []).some(t => ['lumière','lumière-naturelle'].includes(t)) },
    ],
  },
  {
    id: 'montage',
    label: 'Montage & Narration',
    options: [
      { id: 'transitions', label: 'Transitions',        match: r => (r.taxonomy ?? []).some(t => ['transitions','transition'].includes(t)) },
      { id: 'montage',     label: 'Montage rythmé',     match: r => (r.taxonomy ?? []).includes('montage') },
      { id: 'narrative',   label: 'Structure narrative', match: r => (r.taxonomy ?? []).some(t => ['narrative','structure'].includes(t)) },
    ],
  },
]

// Quick pills — mapped to filter groups
const QUICK_PILLS = [
  { label: 'Tout',         clear: true },
  { label: 'Mariage',      groupId: 'categorie',   optId: 'mariage' },
  { label: 'Corporate',    groupId: 'categorie',   optId: 'corporate' },
  { label: 'Événementiel', groupId: 'categorie',   optId: 'evenementiel' },
  { label: 'Anamorphique', groupId: 'colorimetrie', optId: 'anamorphique' },
  { label: 'Golden hour',  groupId: 'colorimetrie', optId: 'golden-hour' },
  { label: 'Vintage',      groupId: 'colorimetrie', optId: 'vintage' },
  { label: 'Lumix S5ii',   groupId: 'camera',      optId: 'lumix' },
  { label: 'Sony FX3',     groupId: 'camera',      optId: 'sony' },
]

// ─── Categories fallback (si aucune section configurée) ──────────────────────

const buildFallbackCategories = (refs) => [
  {
    id: 'recent',
    label: 'Récemment ajoutés',
    sub: 'Les dernières références publiées',
    refs: [...refs].sort((a, b) => new Date(b.publishedAt ?? b.createdAt) - new Date(a.publishedAt ?? a.createdAt)).slice(0, 14),
  },
  {
    id: 'mariage',
    label: 'Mariage & Cinéma',
    sub: 'Films de mariage cinématiques',
    refs: refs.filter(r => r.mood === 'romantique' || (r.taxonomy ?? []).includes('mariage')),
  },
  {
    id: 'corporate',
    label: 'Corporate & Conférences',
    sub: 'Aftermovies et films d\'entreprise',
    refs: refs.filter(r => r.mood === 'professionnel' || (r.taxonomy ?? []).some(t => ['corporate','B2B'].includes(t))),
  },
  {
    id: 'evenementiel',
    label: 'Événementiel & Galas',
    sub: 'Captations d\'événements',
    refs: refs.filter(r => (r.taxonomy ?? []).some(t => ['gala','awards','événementiel'].includes(t))),
  },
  {
    id: 'colorimetrie',
    label: 'Colorimétrie & Lumière',
    sub: 'Golden hour, grain, V-Log',
    refs: refs.filter(r => (r.taxonomy ?? []).some(t => ['colorimétrie','golden-hour','LUT','V-Log','grain','vintage'].includes(t))),
  },
  {
    id: 'technique',
    label: 'Technique & Workflow',
    sub: 'BTS, slow motion, anamorphique',
    refs: refs.filter(r => (r.taxonomy ?? []).some(t => ['BTS','handheld','slow-motion','anamorphique'].includes(t))),
  },
]

// ─── Hero Cinema Marquee ──────────────────────────────────────────────────────

function Hero({ reference, allRefs, onSelect }) {
  const weekCount = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    return allRefs.filter(r => new Date(r.publishedAt ?? r.createdAt).getTime() >= cutoff).length
  }, [allRefs])
  return (
    <div className="relative flex-shrink-0" style={{ height: 360 }}>
      <img
        src={reference.thumbnailUrl}
        alt={reference.title}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.52) saturate(1.05)' }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.96) 95%)' }} />

      <div className="absolute inset-0 px-8 pb-10 flex flex-col justify-end">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted mb-3">
          · EN VEDETTE · CETTE SEMAINE
        </div>
        <h1 className="font-editorial text-[52px] leading-[0.96] tracking-tight mb-3.5 max-w-2xl text-ink">
          {reference.title}
        </h1>
        <div className="flex gap-3.5 items-center text-ink-muted text-xs mb-5 font-mono">
          <span>{reference.channelName}</span>
          <span>·</span>
          <span>{reference.platform}</span>
          <span>·</span>
          <span>{(reference.taxonomy || []).slice(0, 2).join(' / ')}</span>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => window.open(reference.url, '_blank')}
            className="flex items-center gap-2 px-4 py-2.5 bg-ink text-canvas text-[13px] font-semibold transition-opacity hover:opacity-90"
          >
            <Play size={11} fill="currentColor" /> Aperçu cinéma
          </button>
          <button
            onClick={() => onSelect(reference)}
            className="flex items-center gap-2 px-4 py-2.5 border border-ink/25 text-ink text-[13px] transition-colors hover:border-ink/60"
          >
            <Bookmark size={11} /> Sauvegarder
          </button>
          <button
            onClick={() => onSelect(reference)}
            className="flex items-center gap-2 px-4 py-2.5 text-ink-muted text-[13px] transition-colors hover:text-ink"
          >
            Détail →
          </button>
        </div>
      </div>

      {weekCount > 0 && (
        <div className="absolute top-16 right-8 text-right font-mono">
          <div className="text-[10px] text-ink-muted">CETTE SEMAINE</div>
          <div className="text-[10px] text-ink">{weekCount} nouvelle{weekCount > 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  )
}

// ─── Portrait Card (cinema shelf) ────────────────────────────────────────────

function ShelfCard({ reference, onClick }) {
  const saved = useSavedStore(s => s.ids.has(reference.id))
  const toggle = useSavedStore(s => s.toggle)

  return (
    <div
      className="group relative flex-shrink-0 cursor-pointer overflow-hidden rounded-sm"
      style={{ width: 164, aspectRatio: '4/5' }}
      onClick={onClick}
    >
      <img
        src={reference.thumbnailUrl}
        alt={reference.title}
        className="w-full h-full object-cover scale-[1.35] transition-transform duration-500 group-hover:scale-[1.42]"
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.88))' }} />

      {/* Saved indicator top-left */}
      {saved && (
        <span className="absolute top-2 left-2 w-[18px] h-[18px] bg-ink text-canvas grid place-items-center">
          <BookmarkCheck size={9} />
        </span>
      )}

      {/* Save button on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); toggle(reference.id).catch(() => {}) }}
        className={`absolute top-2 right-2 w-7 h-7 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
          saved ? 'bg-ink text-canvas' : 'bg-black/50 text-white hover:bg-ink hover:text-canvas'
        }`}
      >
        {saved ? <BookmarkCheck size={10} /> : <Bookmark size={10} />}
      </button>

      {/* Bottom overlay */}
      <div className="absolute left-2.5 right-2.5 bottom-2.5">
        <div className="font-mono text-[8px] text-white/45 uppercase tracking-widest mb-1 truncate">
          {reference.channelName}
        </div>
        <div className="text-[11px] text-white leading-tight font-medium line-clamp-2 mb-1.5">
          {reference.title}
        </div>
        <div className="flex gap-1 flex-wrap">
          {(reference.taxonomy || []).slice(0, 2).map(t => (
            <span key={t} className="text-[8px] px-1.5 py-0.5 bg-white/10 text-white/60 lowercase">
              {t.replace(/-/g, ' ')}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Cinema Row ───────────────────────────────────────────────────────────────

function CinemaRow({ category, onSelect }) {
  const navigate = useNavigate()
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const scroll = (dir) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * 164 * 4, behavior: 'smooth' })
  }

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  const handleViewAll = () => {
    navigate(`/library/section/${category.id}`, {
      state: { label: category.label, sub: category.sub, refs: category.refs },
    })
  }

  if (!category.refs.length) return null

  return (
    <div className="group/row mb-12">
      <div className="flex items-baseline gap-3 px-8 mb-4">
        <h2 className="font-editorial text-[22px] font-normal text-ink">{category.label}</h2>
        {category.sub && (
          <span className="text-[11px] text-ink-muted">{category.sub}</span>
        )}
        <span className="flex-1" />
        <button
          onClick={handleViewAll}
          className="font-mono text-[10px] text-ink-muted hover:text-ink transition-colors opacity-0 group-hover/row:opacity-100"
        >
          VOIR TOUT ({category.refs.length}) →
        </button>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-canvas/90 border border-surface-border flex items-center justify-center text-ink opacity-0 group-hover/row:opacity-100 transition-all hover:bg-surface-raised shadow-lg"
          >
            <ChevronLeft size={14} />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-canvas/90 border border-surface-border flex items-center justify-center text-ink opacity-0 group-hover/row:opacity-100 transition-all hover:bg-surface-raised shadow-lg"
          >
            <ChevronRight size={14} />
          </button>
        )}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex gap-2.5 px-8 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {category.refs.map(ref => (
            <ShelfCard key={ref.id} reference={ref} onClick={() => onSelect(ref)} />
          ))}
          <div className="flex-shrink-0 w-4" />
        </div>
      </div>
    </div>
  )
}

// ─── Filter Sidebar ───────────────────────────────────────────────────────────

function FilterSidebar({ open, onClose, activeFilters, onToggle, onClearAll }) {
  const [openGroups, setOpenGroups] = useState({ categorie: true })

  const toggleGroup = (id) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const totalActive = Object.values(activeFilters).reduce((acc, set) => acc + set.size, 0)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-fade-in"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed right-0 top-0 h-full w-[340px] z-50 bg-surface border-l border-surface-border flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-ink-muted" />
            <span className="text-sm font-semibold text-ink">Filtres</span>
            {totalActive > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-ink text-canvas font-semibold">
                {totalActive}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {totalActive > 0 && (
              <button onClick={onClearAll} className="text-[11px] text-ink-muted hover:text-ink transition-colors">
                Effacer tout
              </button>
            )}
            <button onClick={onClose} className="text-ink-muted hover:text-ink transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {FILTER_GROUPS.map(group => {
            const groupSelected = activeFilters[group.id] ?? new Set()
            const isOpen = openGroups[group.id]

            return (
              <div key={group.id} className="border-b border-surface-border">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-surface-raised transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-ink">{group.label}</span>
                    {groupSelected.size > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-ink/15 text-ink font-medium">
                        {groupSelected.size}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={13}
                    className={`text-ink-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-4 flex flex-wrap gap-2">
                    {group.options.map(opt => {
                      const isActive = groupSelected.has(opt.id)
                      return (
                        <button
                          key={opt.id}
                          onClick={() => onToggle(group.id, opt.id)}
                          className={`text-[11px] px-3 py-1.5 border transition-all ${
                            isActive
                              ? 'border-ink/30 bg-ink/10 text-ink'
                              : 'border-surface-border text-ink-muted hover:border-ink/25 hover:text-ink'
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="px-6 py-4 border-t border-surface-border flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-ink text-canvas text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Voir les résultats
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const [allRefs, setAllRefs] = useState([])
  const [sections, setSections] = useState([]) // sections depuis l'API
  const [loadingData, setLoadingData] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState({})
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedRef, setSelectedRef] = useState(null)

  const fetchData = useCallback(() => {
    setLoadingData(true)
    setLoadError(null)
    Promise.all([
      api.references.sections(),
      api.references.list({ limit: 2000 }),
    ]).then(([sectionsData, refsData]) => {
      useSavedStore.getState().mergeFlags(refsData.references ?? [])
      setSections(sectionsData.sections ?? [])
      setAllRefs(refsData.references ?? [])
    }).catch(() => {
      setLoadError('Impossible de charger la bibliothèque. Vérifie ta connexion et réessaie.')
    }).finally(() => setLoadingData(false))
  }, [])

  // Chargement initial
  useEffect(() => { fetchData() }, [fetchData])

  // Écoute les publications admin (BroadcastChannel)
  useEffect(() => {
    const ch = new BroadcastChannel('cms-publish')
    ch.onmessage = () => fetchData()
    return () => ch.close()
  }, [fetchData])

  const heroRef = allRefs[0] ?? null

  const toggleFilter = (groupId, optId) => {
    setActiveFilters(prev => {
      const current = new Set(prev[groupId] ?? [])
      if (current.has(optId)) current.delete(optId)
      else current.add(optId)
      return { ...prev, [groupId]: current }
    })
  }

  const removeFilter = (groupId, optId) => {
    setActiveFilters(prev => {
      const current = new Set(prev[groupId] ?? [])
      current.delete(optId)
      return { ...prev, [groupId]: current }
    })
  }

  const clearAllFilters = () => setActiveFilters({})

  const activeChips = useMemo(() => {
    const chips = []
    FILTER_GROUPS.forEach(group => {
      const selected = activeFilters[group.id]
      if (!selected || selected.size === 0) return
      group.options.forEach(opt => {
        if (selected.has(opt.id)) chips.push({ groupId: group.id, optId: opt.id, label: opt.label })
      })
    })
    return chips
  }, [activeFilters])

  const totalActiveFilters = activeChips.length

  const filtered = useMemo(() => {
    let refs = allRefs
    if (search) {
      const q = search.toLowerCase()
      refs = refs.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.taxonomy ?? []).some(t => t.toLowerCase().includes(q)) ||
        r.channelName?.toLowerCase().includes(q) ||
        r.context?.toLowerCase().includes(q)
      )
    }
    FILTER_GROUPS.forEach(group => {
      const selected = activeFilters[group.id]
      if (!selected || selected.size === 0) return
      refs = refs.filter(r =>
        [...selected].some(optId => {
          const opt = group.options.find(o => o.id === optId)
          return opt ? opt.match(r) : false
        })
      )
    })
    return refs
  }, [search, activeFilters, allRefs])

  const isFiltering = !!search || totalActiveFilters > 0

  // Si des sections sont configurées, les utiliser ; sinon fallback par tags
  const categories = useMemo(() => {
    if (sections.length > 0 && !isFiltering) {
      return sections
        .filter(s => s.active !== false)
        .map(s => ({
          id: s.id,
          label: s.title,
          sub: s.description,
          refs: (s.references ?? []).filter(r => r.status === 'PUBLISHED'),
        }))
        .filter(c => c.refs.length > 0)
    }
    return buildFallbackCategories(filtered)
  }, [sections, filtered, isFiltering])

  const isPillActive = (pill) => {
    if (pill.clear) return !isFiltering
    const group = activeFilters[pill.groupId]
    return group?.has(pill.optId) ?? false
  }

  const handlePill = (pill) => {
    if (pill.clear) {
      clearAllFilters()
      setSearch('')
    } else {
      toggleFilter(pill.groupId, pill.optId)
    }
  }

  if (loadingData) {
    return (
      <div className="bg-canvas min-h-screen flex items-center justify-center">
        <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted">Chargement…</p>
      </div>
    )
  }

  // État d'erreur — distinct de l'état vide : panne ≠ bibliothèque en cours de remplissage
  if (loadError) {
    return (
      <div className="bg-canvas min-h-screen flex flex-col items-center justify-center gap-5 px-8">
        <p className="text-xs text-red-400 font-mono text-center">{loadError}</p>
        <button
          type="button"
          onClick={fetchData}
          className="px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase border border-surface-border text-ink-muted hover:text-ink hover:border-ink transition-colors"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="bg-canvas min-h-screen animate-fade-in">

      {/* ── Cinema Marquee Hero ── */}
      {!isFiltering && heroRef && (
        <Hero reference={heroRef} allRefs={allRefs} onSelect={setSelectedRef} />
      )}

      {/* ── Filter bar ── */}
      <div className="px-8 border-b border-surface-border">
        {/* Quick pills + search */}
        <div className="flex items-center gap-2 py-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {QUICK_PILLS.map(pill => (
            <button
              key={pill.label}
              onClick={() => handlePill(pill)}
              className={`flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${
                isPillActive(pill)
                  ? 'border-ink/30 bg-ink/10 text-ink'
                  : 'border-surface-border text-ink-muted hover:border-ink/20 hover:text-ink'
              }`}
            >
              {pill.label}
            </button>
          ))}

          <span className="flex-1 min-w-4" />

          {/* Search input */}
          <div className="relative flex-shrink-0 w-72">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Titre, technique, intention..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-surface border border-surface-border text-[12px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink/20 transition-colors rounded-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter sidebar button */}
          <button
            onClick={() => setFilterOpen(true)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 border text-[12px] font-medium transition-all ${
              totalActiveFilters > 0
                ? 'border-ink/30 bg-ink/10 text-ink'
                : 'border-surface-border text-ink-muted hover:border-ink/20 hover:text-ink'
            }`}
          >
            <SlidersHorizontal size={12} />
            Affiner
            {totalActiveFilters > 0 && (
              <span className="text-[9px] px-1 py-0.5 bg-ink text-canvas font-semibold">
                {totalActiveFilters}
              </span>
            )}
          </button>
        </div>

        {/* Active chips row */}
        {activeChips.length > 0 && (
          <div className="flex items-center gap-2 pb-3 flex-wrap">
            {activeChips.map(chip => (
              <button
                key={`${chip.groupId}-${chip.optId}`}
                onClick={() => removeFilter(chip.groupId, chip.optId)}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1 border border-ink/25 bg-ink/8 text-ink hover:bg-ink/15 transition-colors whitespace-nowrap rounded-full"
                style={{ background: 'rgba(240,235,228,0.08)' }}
              >
                {chip.label}
                <X size={9} />
              </button>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-[11px] px-3 py-1 border border-surface-border text-ink-muted hover:text-ink hover:border-ink/20 transition-colors rounded-full"
            >
              Tout effacer
            </button>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-ink-muted">
          <Search size={32} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm mb-1">Aucune référence ne correspond</p>
          <button
            onClick={() => { setSearch(''); clearAllFilters() }}
            className="mt-3 text-xs text-ink hover:text-ink-muted transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : isFiltering ? (
        <div className="px-8 py-10">
          <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-7">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
            {search ? ` pour « ${search} »` : ''}
          </p>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(164px, 1fr))' }}
          >
            {filtered.map(ref => (
              <ShelfCard key={ref.id} reference={ref} onClick={() => setSelectedRef(ref)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="pt-10 pb-16">
          {categories.map(cat => (
            <CinemaRow key={cat.id} category={cat} onSelect={setSelectedRef} />
          ))}
        </div>
      )}

      <FilterSidebar
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        activeFilters={activeFilters}
        onToggle={toggleFilter}
        onClearAll={clearAllFilters}
      />

      {selectedRef && (
        <ReferenceModal
          reference={selectedRef}
          onClose={() => setSelectedRef(null)}
        />
      )}
    </div>
  )
}
