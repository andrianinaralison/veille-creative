import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, X, Bookmark, ArrowRight } from 'lucide-react'
import ReferenceCard from '../components/ReferenceCard'
import ReferenceModal from '../components/ReferenceModal'
import { api } from '../lib/api'
import { useSavedStore } from '../store/useSavedStore'

const PAGE_SIZE = 50

/**
 * Bibliothèque (180-73) = vivier personnel : uniquement les références sauvegardées
 * par l'utilisateur, paginées (/library, 50 + lazy-load) avec filtre texte instantané.
 * Vide à l'inscription (modèle Spotify). Une réf dé-sauvegardée disparaît en direct
 * (on filtre sur le store `saved` source de vérité).
 */
export default function LibraryPage() {
  const [refs, setRefs] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedRef, setSelectedRef] = useState(null)

  const savedIds = useSavedStore(s => s.ids)
  const sentinelRef = useRef(null)

  const loadPage = useCallback((nextOffset) => {
    const first = nextOffset === 0
    if (first) { setLoading(true); setError(null) } else { setLoadingMore(true) }
    api.library.list({ limit: PAGE_SIZE, offset: nextOffset })
      .then(d => {
        const page = d.references ?? []
        useSavedStore.getState().mergeFlags(page)
        setTotal(d.total ?? 0)
        setOffset(nextOffset + page.length)
        setRefs(prev => first ? page : [...prev, ...page])
      })
      .catch(() => setError('Impossible de charger ta bibliothèque. Vérifie ta connexion et réessaie.'))
      .finally(() => { setLoading(false); setLoadingMore(false) })
  }, [])

  useEffect(() => { loadPage(0) }, [loadPage])

  // Filtre la vue sur le store `saved` → un unsave retire la carte instantanément
  const visible = useMemo(() => {
    let list = refs.filter(r => savedIds.has(r.id))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.channelName?.toLowerCase().includes(q) ||
        (r.taxonomy ?? []).some(t => t.toLowerCase().includes(q)) ||
        (r.userTags ?? []).some(t => t.toLowerCase().includes(q)) ||
        r.note?.toLowerCase().includes(q)
      )
    }
    return list
  }, [refs, savedIds, search])

  const hasMore = refs.length < total

  // Lazy-load au scroll (sentinelle en bas de grille)
  useEffect(() => {
    if (!hasMore || loading || loadingMore || search) return
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadPage(offset)
    }, { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, loading, loadingMore, search, offset, loadPage])

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
          onClick={() => loadPage(0)}
          className="px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase border border-surface-border text-ink-muted hover:text-ink hover:border-ink transition-colors"
        >
          Réessayer
        </button>
      </div>
    )
  }

  // Compteur vivant : `total` (serveur) ne décrémente pas sur un unsave local.
  // On retranche les refs chargées qui ne sont plus sauvegardées (on ne peut
  // dé-sauvegarder que ce qui est chargé → soustraction exacte).
  const liveTotal = total - refs.filter(r => !savedIds.has(r.id)).length

  return (
    <div className="bg-canvas min-h-screen animate-fade-in">
      {/* ── Header ── */}
      <div className="px-8 pt-10 pb-6 border-b border-surface-border">
        <p className="font-mono text-[11px] font-semibold text-ink-muted uppercase tracking-[0.22em] mb-3">
          · TON VIVIER
        </p>
        <h1 className="font-editorial text-5xl text-ink leading-[0.95] mb-2">Bibliothèque</h1>
        <p className="text-xs text-ink-muted">
          {liveTotal} référence{liveTotal > 1 ? 's' : ''} sauvegardée{liveTotal > 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Barre de recherche ── */}
      {liveTotal > 0 && (
        <div className="px-8 py-4 border-b border-surface-border flex items-center">
          <div className="relative w-72">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Filtrer ta bibliothèque..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-surface border border-surface-border text-[12px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink/20 transition-colors rounded-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
                <X size={12} />
              </button>
            )}
          </div>
          {search && (
            <span className="ml-4 font-mono text-[10px] text-ink-muted uppercase tracking-widest">
              {visible.length} résultat{visible.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* ── Contenu ── */}
      {liveTotal === 0 ? (
        // État vide — jamais rempli, ou tout dé-sauvegardé (modèle Spotify)
        <div className="py-24 text-center flex flex-col items-center gap-4">
          <Bookmark size={32} className="opacity-20" />
          <p className="font-editorial text-xl text-ink-muted">Ta bibliothèque est vide.</p>
          <p className="text-xs text-ink-muted max-w-sm">
            Sauvegarde des références depuis Explorer pour construire ton vivier — tu pourras les annoter et les réutiliser dans tes treatments.
          </p>
          <Link
            to="/"
            className="mt-2 flex items-center gap-1.5 text-xs text-ink hover:opacity-70 transition-opacity font-medium"
          >
            Explorer les références <ArrowRight size={12} />
          </Link>
        </div>
      ) : visible.length === 0 && search ? (
        <div className="py-24 text-center text-ink-muted">
          <Search size={28} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm mb-1">Aucune référence ne correspond</p>
          <button onClick={() => setSearch('')} className="mt-2 text-xs text-ink hover:opacity-70 transition-opacity">
            Réinitialiser
          </button>
        </div>
      ) : (
        <div className="px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map(ref => (
              <ReferenceCard key={ref.id} reference={ref} onClick={() => setSelectedRef(ref)} />
            ))}
          </div>

          {/* Sentinelle lazy-load + fallback bouton */}
          {hasMore && !search && (
            <div ref={sentinelRef} className="py-10 text-center">
              <button
                onClick={() => loadPage(offset)}
                disabled={loadingMore}
                className="px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase border border-surface-border text-ink-muted hover:text-ink hover:border-ink transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Chargement…' : 'Charger plus'}
              </button>
            </div>
          )}
        </div>
      )}

      {selectedRef && (
        <ReferenceModal
          reference={selectedRef}
          onClose={() => setSelectedRef(null)}
          onAnnotated={(id, res) => {
            setRefs(prev => prev.map(r => r.id === id ? { ...r, userTags: res.userTags, note: res.note } : r))
            setSelectedRef(prev => prev && prev.id === id ? { ...prev, userTags: res.userTags, note: res.note } : prev)
          }}
        />
      )}
    </div>
  )
}
