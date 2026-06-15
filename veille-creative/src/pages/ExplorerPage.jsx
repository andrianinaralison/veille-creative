import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Bookmark, Play } from 'lucide-react'
import ReferenceCard from '../components/ReferenceCard'
import ReferenceModal from '../components/ReferenceModal'
import { api } from '../lib/api'
import { useSavedStore } from '../store/useSavedStore'

// ─── Hero ─────────────────────────────────────────────────────────────────────

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
            <Bookmark size={11} /> Détail
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
    navigate(`/explorer/section/${category.id}`, {
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
            <ReferenceCard key={ref.id} reference={ref} variant="shelf" onClick={() => onSelect(ref)} />
          ))}
          <div className="flex-shrink-0 w-4" />
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExplorerPage() {
  const [allRefs, setAllRefs] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRef, setSelectedRef] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.references.sections(),
      api.references.list({ limit: 2000 }),
    ]).then(([sectionsData, refsData]) => {
      const refs = refsData.references ?? []
      useSavedStore.getState().mergeFlags(refs)
      setSections(sectionsData.sections ?? [])
      setAllRefs(refs)
    }).catch(() => {
      setError('Impossible de charger Explorer. Vérifie ta connexion et réessaie.')
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Écoute les publications admin (BroadcastChannel)
  useEffect(() => {
    const ch = new BroadcastChannel('cms-publish')
    ch.onmessage = () => fetchData()
    return () => ch.close()
  }, [fetchData])

  const heroRef = allRefs[0] ?? null

  // Rangées : 1 rangée auto « Dernières publications » + sections MANUAL de l'API.
  // Les sections AUTO calculées (Trendy-vues, Nouveaux créateurs) arrivent avec
  // l'enrichissement catalogue / le moteur de sections (v0.10).
  const rows = useMemo(() => {
    const recent = {
      id: 'recent',
      label: 'Dernières publications',
      sub: 'Fraîchement ajoutées à la veille',
      refs: [...allRefs]
        .sort((a, b) => new Date(b.publishedAt ?? b.createdAt) - new Date(a.publishedAt ?? a.createdAt))
        .slice(0, 18),
    }

    const apiRows = sections
      .filter(s => s.active !== false)
      .map(s => ({
        id: s.id,
        label: s.title,
        sub: s.description,
        refs: (s.references ?? []).filter(r => r.status === 'PUBLISHED'),
      }))
      .filter(c => c.refs.length > 0)

    return [recent, ...apiRows]
  }, [sections, allRefs])

  if (loading) {
    return (
      <div className="bg-canvas min-h-screen flex items-center justify-center">
        <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted">Chargement…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-canvas min-h-screen flex flex-col items-center justify-center gap-5 px-8">
        <p className="text-xs text-red-400 font-mono text-center">{error}</p>
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
      {heroRef && <Hero reference={heroRef} allRefs={allRefs} onSelect={setSelectedRef} />}

      <div className="pt-10 pb-16">
        {rows.map(row => (
          <CinemaRow key={row.id} category={row} onSelect={setSelectedRef} />
        ))}
      </div>

      {selectedRef && (
        <ReferenceModal reference={selectedRef} onClose={() => setSelectedRef(null)} />
      )}
    </div>
  )
}
