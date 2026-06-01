import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import ReferenceCard from '../components/ReferenceCard'
import ReferenceModal from '../components/ReferenceModal'

const API = 'http://localhost:3001/api/v1'

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
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (state?.refs) return
    fetch(`${API}/references/sections`)
      .then(r => r.json())
      .then(data => {
        const section = (data.sections ?? []).find(s => s.id === id)
        if (section) {
          setLabel(section.title)
          setSub(section.description)
          setRefs((section.references ?? []).filter(r => r.status === 'PUBLISHED'))
        }
      })
      .finally(() => setLoading(false))
  }, [id, state])

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
          Bibliothèque
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
        {!loading && refs.length === 0 && (
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
