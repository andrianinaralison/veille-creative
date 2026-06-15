import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import ReferenceCard from '../components/ReferenceCard'
import ReferenceModal from '../components/ReferenceModal'
import { api } from '../lib/api'
import { useSavedStore } from '../store/useSavedStore'

// Hauteur navbar Layout = 56px (top-14), barre catégorie = 48px (h-12)
// Le contenu doit donc partir à 104px du haut (pt-[104px])

export default function CategoryPage() {
  const { id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  const [refs, setRefs]       = useState(state?.refs  ?? [])
  const [label, setLabel]     = useState(state?.label ?? '…')
  const [sub, setSub]         = useState(state?.sub   ?? '')
  const [loading, setLoading] = useState(!state?.refs)
  const [error, setError]     = useState(null)
  const [retryKey, setRetryKey] = useState(0)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (state?.refs) return
    setLoading(true)
    setError(null)

    // Rangée auto « Dernières publications » : pas une section serveur → reconstruite
    // ici pour que le deep link /explorer/section/recent survive à un rechargement.
    if (id === 'recent') {
      api.references.list({ limit: 2000 })
        .then(data => {
          const published = [...(data.references ?? [])]
            .sort((a, b) => new Date(b.publishedAt ?? b.createdAt) - new Date(a.publishedAt ?? a.createdAt))
            .slice(0, 18)
          setLabel('Dernières publications')
          setSub('Fraîchement ajoutées à la veille')
          useSavedStore.getState().mergeFlags(published)
          setRefs(published)
        })
        .catch(() => setError('Impossible de charger cette section. Vérifie ta connexion et réessaie.'))
        .finally(() => setLoading(false))
      return
    }

    api.references.sections()
      .then(data => {
        const section = (data.sections ?? []).find(s => s.id === id)
        if (section) {
          setLabel(section.title)
          setSub(section.description)
          const published = (section.references ?? []).filter(r => r.status === 'PUBLISHED')
          useSavedStore.getState().mergeFlags(published)
          setRefs(published)
        }
      })
      .catch(() => setError('Impossible de charger cette section. Vérifie ta connexion et réessaie.'))
      .finally(() => setLoading(false))
  }, [id, state, retryKey])

  return (
    <div className="bg-canvas min-h-screen">

      {/* Barre fixe sous la navbar — top-14 = 56px = hauteur navbar Layout */}
      <div className="fixed top-14 left-0 right-0 z-40 h-12 bg-canvas border-b border-surface-border flex items-center gap-3 px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-ink-muted hover:text-ink transition-colors text-[11px] font-mono tracking-widest uppercase flex-shrink-0"
        >
          <ChevronLeft size={12} /> Retour
        </button>

        <span className="text-ink-faint font-mono text-[11px]">/</span>

        <Link to="/" className="text-[11px] font-mono text-ink-muted hover:text-ink transition-colors flex-shrink-0">
          Explorer
        </Link>

        <span className="text-ink-faint font-mono text-[11px]">/</span>

        <span className="font-editorial text-base text-ink truncate">{label}</span>

        {sub && (
          <>
            <span className="text-ink-faint font-mono text-[11px] flex-shrink-0">·</span>
            <span className="text-[11px] text-ink-muted truncate hidden sm:block">{sub}</span>
          </>
        )}

        <span className="ml-auto font-mono text-[10px] text-ink-faint tracking-widest uppercase flex-shrink-0">
          {refs.length} réf.
        </span>
      </div>

      {/* Contenu — pt compensant navbar (56px) + barre catégorie (48px) */}
      <div className="pt-[104px] px-8 py-8">
        {loading && (
          <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted">Chargement…</p>
        )}
        {error && (
          <div className="flex flex-col items-start gap-4 py-8">
            <p className="text-xs text-red-400 font-mono">{error}</p>
            <button
              type="button"
              onClick={() => setRetryKey(k => k + 1)}
              className="px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase border border-surface-border text-ink-muted hover:text-ink hover:border-ink transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}
        {!loading && !error && refs.length === 0 && (
          <p className="text-ink-muted text-sm">Aucune référence dans cette section.</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {refs.map(ref => (
            <div key={ref.id} onClick={() => setSelected(ref)}>
              <ReferenceCard reference={ref} />
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <ReferenceModal reference={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
