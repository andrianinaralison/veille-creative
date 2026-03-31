import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, ChevronDown, Bookmark, BookmarkCheck, SlidersHorizontal, X, Sparkles } from 'lucide-react'
import { mockReferences } from '../data/mockData'
import ReferenceModal from '../components/ReferenceModal'

// ─── Filter config (inspiré de Frameset, adapté vidéaste) ────────────────────

const FILTER_GROUPS = [
  {
    id: 'categorie',
    label: 'Catégorie',
    options: [
      { id: 'mariage',      label: 'Mariage',         match: r => r.mood === 'romantique' || r.tags.includes('mariage') },
      { id: 'corporate',    label: 'Corporate & B2B',  match: r => r.tags.some(t => ['corporate','B2B'].includes(t)) },
      { id: 'evenementiel', label: 'Événementiel',     match: r => r.tags.includes('événementiel') },
      { id: 'gala',         label: 'Gala & Awards',    match: r => r.tags.some(t => ['gala','awards'].includes(t)) },
      { id: 'startup',      label: 'Startup',          match: r => r.tags.includes('startup') },
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
      { id: 'sony',       label: 'Sony FX3 / A1',      match: r => r.tags.includes('Sony-FX3') },
      { id: 'canon',      label: 'Canon C70 / C80',     match: r => r.tags.includes('Canon-C70') },
      { id: 'lumix',      label: 'Lumix S5ii / S1',     match: r => r.tags.includes('Lumix-S5ii') },
      { id: 'blackmagic', label: 'Blackmagic BMPCC',    match: r => r.tags.includes('Blackmagic') },
    ],
  },
  {
    id: 'colorimetrie',
    label: 'Colorimétrie',
    options: [
      { id: 'golden-hour',  label: 'Golden hour',    match: r => r.tags.includes('golden-hour') },
      { id: 'vlog',         label: 'V-Log',          match: r => r.tags.includes('V-Log') },
      { id: 'lut',          label: 'LUT',            match: r => r.tags.includes('LUT') },
      { id: 'grain',        label: 'Grain film',     match: r => r.tags.includes('grain') },
      { id: 'vintage',      label: 'Vintage',        match: r => r.tags.includes('vintage') },
      { id: 'anamorphique', label: 'Anamorphique',   match: r => r.tags.includes('anamorphique') },
    ],
  },
  {
    id: 'technique',
    label: 'Technique de prise de vue',
    options: [
      { id: 'slow-motion',  label: 'Slow motion',    match: r => r.tags.includes('slow-motion') },
      { id: 'handheld',     label: 'Handheld',       match: r => r.tags.includes('handheld') },
      { id: 'travelling',   label: 'Travelling',     match: r => r.tags.includes('travelling') },
      { id: 'bts',          label: 'Making-of / BTS',match: r => r.tags.includes('BTS') },
    ],
  },
  {
    id: 'lumiere',
    label: 'Lumière',
    options: [
      { id: 'basse-lumiere',   label: 'Basse lumière',    match: r => r.tags.includes('basse-lumière') },
      { id: 'exterieur',       label: 'Extérieur',        match: r => r.tags.includes('extérieur') },
      { id: 'lumiere-naturelle', label: 'Lumière naturelle', match: r => r.tags.some(t => ['lumière','lumière-naturelle'].includes(t)) },
    ],
  },
  {
    id: 'montage',
    label: 'Montage & Narration',
    options: [
      { id: 'transitions', label: 'Transitions',        match: r => r.tags.some(t => ['transitions','transition'].includes(t)) },
      { id: 'montage',     label: 'Montage rythmé',     match: r => r.tags.includes('montage') },
      { id: 'narrative',   label: 'Structure narrative', match: r => r.tags.some(t => ['narrative','structure'].includes(t)) },
    ],
  },
]

// ─── Categories (rows) ────────────────────────────────────────────────────────

const buildCategories = (refs) => [
  {
    id: 'recommande',
    label: 'Recommandé pour vous',
    icon: '✦',
    refs: [
      ...refs.filter(r => r.projectId),
      ...refs.filter(r => !r.projectId).sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt)),
    ].slice(0, 14),
  },
  {
    id: 'mariage',
    label: 'Mariage & Cinéma',
    refs: refs.filter(r => r.mood === 'romantique'),
  },
  {
    id: 'corporate',
    label: 'Corporate & Conférences',
    refs: refs.filter(r => r.mood === 'professionnel' || r.tags.some(t => ['corporate','B2B'].includes(t))),
  },
  {
    id: 'evenementiel',
    label: 'Événementiel & Galas',
    refs: refs.filter(r => r.mood === 'vivant' || r.mood === 'élégant' || r.tags.some(t => ['gala','awards','foule'].includes(t))),
  },
  {
    id: 'colorimetrie',
    label: 'Colorimétrie & Lumière',
    refs: refs.filter(r => r.tags.some(t => ['colorimétrie','golden-hour','LUT','V-Log','grain','vintage'].includes(t))),
  },
  {
    id: 'technique',
    label: 'Technique & Workflow',
    refs: refs.filter(r => r.tags.some(t => ['BTS','technique','workflow','handheld','slow-motion','anamorphique'].includes(t))),
  },
  {
    id: 'narration',
    label: 'Narration & Montage',
    refs: refs.filter(r => r.tags.some(t => ['narrative','structure','montage','transitions','transition'].includes(t))),
  },
]

// ─── Platform colors ──────────────────────────────────────────────────────────

const platformDot = {
  Vimeo: '#1ab7ea',
  Instagram: '#e1306c',
  TikTok: '#ff0050',
  YouTube: '#ff0000',
  Shotdeck: '#f5a623',
  Pinterest: '#bd081c',
}

// ─── Netflix Card ─────────────────────────────────────────────────────────────

function NetflixCard({ reference, onClick }) {
  const [saved, setSaved] = useState(reference.saved ?? !!reference.savedAt)
  const dot = platformDot[reference.platform] || '#888'

  const handleSave = (e) => {
    e.stopPropagation()
    setSaved(!saved)
  }

  return (
    <div className="group flex-shrink-0 w-80 cursor-pointer" onClick={onClick}>
      <div className="relative aspect-video rounded-lg overflow-hidden bg-surface-raised mb-3">
        <img
          src={reference.thumbnail}
          alt={reference.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <button
          onClick={handleSave}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100 ${
            saved ? 'bg-gold text-canvas' : 'bg-black/50 text-white hover:bg-gold hover:text-canvas'
          }`}
        >
          {saved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
        </button>

        <div className="absolute bottom-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <span
            className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${dot}30`, color: dot, border: `1px solid ${dot}50` }}
          >
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: dot }} />
            {reference.platform}
          </span>
        </div>
      </div>

      <div>
        <p className="text-[10px] text-ink-muted mb-0.5 truncate">{reference.author || reference.platform}</p>
        <p className="text-[13px] text-ink leading-snug line-clamp-2">{reference.title}</p>
      </div>
    </div>
  )
}

// ─── Netflix Row ──────────────────────────────────────────────────────────────

function NetflixRow({ category, onSelect }) {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const scroll = (dir) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * 320 * 3, behavior: 'smooth' })
  }

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  if (!category.refs.length) return null

  return (
    <div className="group/row mb-14">
      {/* Row header */}
      <div className="flex items-baseline justify-between px-8 mb-5">
        <div className="flex items-center gap-2.5">
          {category.icon && (
            <span className="text-gold text-sm">{category.icon}</span>
          )}
          <h2 className="text-lg font-semibold text-ink group-hover/row:text-gold transition-colors cursor-default">
            {category.label}
          </h2>
          <span className="text-xs text-gold opacity-0 group-hover/row:opacity-100 transition-opacity">
            Voir tout →
          </span>
        </div>
        <span className="text-[11px] text-ink-faint">
          {category.refs.length} référence{category.refs.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Scroll container */}
      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll(-1)}
            className="absolute left-2 top-[90px] -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-canvas/90 border border-surface-border flex items-center justify-center text-ink hover:bg-surface-raised transition-all opacity-0 group-hover/row:opacity-100 shadow-lg"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll(1)}
            className="absolute right-2 top-[90px] -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-canvas/90 border border-surface-border flex items-center justify-center text-ink hover:bg-surface-raised transition-all opacity-0 group-hover/row:opacity-100 shadow-lg"
          >
            <ChevronRight size={16} />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex gap-4 px-8 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {category.refs.map(ref => (
            <NetflixCard key={ref.id} reference={ref} onClick={() => onSelect(ref)} />
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
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-[340px] z-50 bg-surface border-l border-surface-border flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-ink-muted" />
            <span className="text-sm font-semibold text-ink">Filtres</span>
            {totalActive > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold text-canvas font-semibold">
                {totalActive}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {totalActive > 0 && (
              <button onClick={onClearAll} className="text-[11px] text-ink-muted hover:text-gold transition-colors">
                Effacer tout
              </button>
            )}
            <button onClick={onClose} className="text-ink-muted hover:text-ink transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Groups */}
        <div className="flex-1 overflow-y-auto">
          {FILTER_GROUPS.map(group => {
            const groupSelected = activeFilters[group.id] ?? new Set()
            const isOpen = openGroups[group.id]

            return (
              <div key={group.id} className="border-b border-surface-border">
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-surface-raised transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-ink">{group.label}</span>
                    {groupSelected.size > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold/20 text-gold font-medium">
                        {groupSelected.size}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-ink-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Group options */}
                {isOpen && (
                  <div className="px-6 pb-4 flex flex-wrap gap-2">
                    {group.options.map(opt => {
                      const isActive = groupSelected.has(opt.id)
                      return (
                        <button
                          key={opt.id}
                          onClick={() => onToggle(group.id, opt.id)}
                          className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
                            isActive
                              ? 'border-gold bg-gold/15 text-gold'
                              : 'border-surface-border text-ink-muted hover:border-ink-muted hover:text-ink'
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-border flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-gold text-canvas text-sm font-medium hover:bg-gold-light transition-colors"
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
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState({}) // { groupId: Set<optionId> }
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedRef, setSelectedRef] = useState(null)

  // Typing animation
  const PHRASES = [
    'Bibliothèque',
    'Comment vous inspirer aujourd\'hui ?',
    'Trouvez les meilleures références indé',
    'Un brief ? Promptez et laissez faire la magie',
  ]
  const [typedText, setTypedText] = useState(PHRASES[0])
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(PHRASES[0].length)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const current = PHRASES[phraseIndex]
    let delay = isDeleting ? 35 : 65

    if (!isDeleting && charIndex === current.length) {
      delay = 2200
      const t = setTimeout(() => setIsDeleting(true), delay)
      return () => clearTimeout(t)
    }
    if (isDeleting && charIndex === 0) {
      const nextIndex = (phraseIndex + 1) % PHRASES.length
      setIsDeleting(false)
      setPhraseIndex(nextIndex)
      return
    }

    const t = setTimeout(() => {
      setCharIndex(prev => isDeleting ? prev - 1 : prev + 1)
      setTypedText(current.slice(0, isDeleting ? charIndex - 1 : charIndex + 1))
    }, delay)
    return () => clearTimeout(t)
  }, [charIndex, isDeleting, phraseIndex])

  // Toggle a filter option
  const toggleFilter = (groupId, optId) => {
    setActiveFilters(prev => {
      const current = new Set(prev[groupId] ?? [])
      if (current.has(optId)) current.delete(optId)
      else current.add(optId)
      return { ...prev, [groupId]: current }
    })
  }

  // Remove a single chip
  const removeFilter = (groupId, optId) => {
    setActiveFilters(prev => {
      const current = new Set(prev[groupId] ?? [])
      current.delete(optId)
      return { ...prev, [groupId]: current }
    })
  }

  // Clear all filters
  const clearAllFilters = () => setActiveFilters({})

  // Active filter chips list (flat)
  const activeChips = useMemo(() => {
    const chips = []
    FILTER_GROUPS.forEach(group => {
      const selected = activeFilters[group.id]
      if (!selected || selected.size === 0) return
      group.options.forEach(opt => {
        if (selected.has(opt.id)) chips.push({ groupId: group.id, optId: opt.id, label: opt.label, groupLabel: group.label })
      })
    })
    return chips
  }, [activeFilters])

  const totalActiveFilters = activeChips.length

  // Filter function
  const filtered = useMemo(() => {
    let refs = mockReferences

    // Text search
    if (search) {
      const q = search.toLowerCase()
      refs = refs.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q)) ||
        r.author?.toLowerCase().includes(q) ||
        r.context?.toLowerCase().includes(q)
      )
    }

    // Attribute filters: AND across groups, OR within a group
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
  }, [search, activeFilters])

  const categories = useMemo(() => buildCategories(filtered), [filtered])
  const isFiltering = !!search || totalActiveFilters > 0

  return (
    <div className="bg-canvas min-h-screen animate-fade-in">

      {/* ── Header ── */}
      <div className="px-8 pt-10 pb-0">
        <div className="mb-7">
          <h1 className="font-editorial text-5xl text-ink mb-1">
            {typedText}<span className="animate-pulse">|</span>
          </h1>
          <p className="text-ink-muted text-sm">
            {mockReferences.length} références — {filtered.length} correspondantes
          </p>
        </div>

        {/* Search + Filter button */}
        <div className="flex items-center gap-3 mb-0">
          <div className="relative flex-1 max-w-2xl">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Titre, technique, intention créative, caméra..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3.5 rounded-xl bg-surface border border-surface-border text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-gold/50 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setFilterOpen(true)}
            className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border text-sm font-medium transition-all flex-shrink-0 ${
              totalActiveFilters > 0
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-surface-border text-ink-muted hover:border-ink-muted hover:text-ink'
            }`}
          >
            <SlidersHorizontal size={15} />
            Filtres
            {totalActiveFilters > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold text-canvas font-semibold">
                {totalActiveFilters}
              </span>
            )}
          </button>
        </div>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {activeChips.map(chip => (
              <button
                key={`${chip.groupId}-${chip.optId}`}
                onClick={() => removeFilter(chip.groupId, chip.optId)}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border border-gold bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
              >
                {chip.label}
                <X size={10} />
              </button>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-[11px] px-3 py-1.5 rounded-full border border-surface-border text-ink-muted hover:text-ink hover:border-ink-muted transition-colors"
            >
              Effacer tout
            </button>
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-surface-border mt-7 mb-0" />

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-ink-muted">
          <Search size={36} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm mb-1">Aucune référence ne correspond</p>
          <button
            onClick={() => { setSearch(''); clearAllFilters() }}
            className="mt-3 text-xs text-gold hover:text-gold-light"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : isFiltering ? (
        /* ── Filtered: flat grid responsive ── */
        <div className="px-8 py-10">
          <p className="text-[11px] text-ink-muted mb-6">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
            {search ? ` pour « ${search} »` : ''}
          </p>
          <div
            className="grid gap-5 items-start"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
          >
            {filtered.map(ref => (
              <NetflixCard key={ref.id} reference={ref} onClick={() => setSelectedRef(ref)} />
            ))}
          </div>
        </div>
      ) : (
        /* ── Default: Netflix rows ── */
        <div className="pt-10 pb-16">
          {categories.map(cat => (
            <NetflixRow key={cat.id} category={cat} onSelect={setSelectedRef} />
          ))}
        </div>
      )}

      {/* ── Filter Sidebar ── */}
      <FilterSidebar
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        activeFilters={activeFilters}
        onToggle={toggleFilter}
        onClearAll={clearAllFilters}
      />

      {/* ── Modal ── */}
      {selectedRef && (
        <ReferenceModal
          reference={selectedRef}
          onClose={() => setSelectedRef(null)}
        />
      )}
    </div>
  )
}
