import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { api } from '../lib/api'
import { useAuthStore } from '../store/useAuthStore'
import { TAXONOMY_AXES } from '../config/taxonomy'
import ReferenceCard from '../components/ReferenceCard'
import ReferenceModal from '../components/ReferenceModal'

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

const MOODS = TAXONOMY_AXES.find(a => a.id === 'ambiance')?.tags ?? []
const TYPES = TAXONOMY_AXES.find(a => a.id === 'type_contenu')?.tags ?? []

function FilterChips({ label, options, active, onToggle }) {
  const [open, setOpen] = useState(false)
  const visible = open ? options : options.slice(0, 8)
  return (
    <div className="flex items-start gap-3">
      <span className="font-mono text-[10px] tracking-widest uppercase text-ink-faint pt-1 w-16 flex-shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {visible.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(active === opt ? null : opt)}
            className={`font-mono text-[10px] tracking-wide px-2 py-0.5 border transition-colors ${
              active === opt
                ? 'border-ink text-ink bg-surface-raised'
                : 'border-surface-border text-ink-muted hover:border-ink hover:text-ink'
            }`}
          >
            {opt}
          </button>
        ))}
        {options.length > 8 && (
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className="font-mono text-[10px] text-ink-faint hover:text-ink px-1"
          >
            {open ? '− réduire' : `+${options.length - 8}`}
          </button>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const user = useAuthStore(s => s.user)
  const [references, setReferences] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mood, setMood] = useState(null)
  const [typeContenu, setTypeContenu] = useState(null)
  const [selectedRef, setSelectedRef] = useState(null)

  useEffect(() => {
    setLoading(true); setError(null)
    const params = { limit: 20 }
    if (mood) params.mood = mood
    if (typeContenu) params.typeContenu = typeContenu
    api.references.list(params)
      .then(d => { setReferences(d.references ?? []); setTotal(d.total ?? 0) })
      .catch(() => setError('Impossible de charger ta veille. Réessaie dans un instant.'))
      .finally(() => setLoading(false))
  }, [mood, typeContenu])

  const now = new Date()
  const dateLabel = `· ${DAYS_FR[now.getDay()].toUpperCase()} · ${now.getDate()} ${MONTHS_FR[now.getMonth()].toUpperCase()}`

  return (
    <div className="bg-canvas min-h-screen animate-fade-in">

      {/* ── Header ── */}
      <div className="px-8 pt-10 pb-8 border-b border-surface-border">
        <p className="font-mono text-[11px] font-semibold text-ink-muted uppercase tracking-[0.22em] mb-4">
          {dateLabel}
        </p>
        <h1 className="font-editorial text-5xl text-ink leading-[0.95] mb-2">
          Bonjour {user?.firstName || 'toi'}.<br />
          <em className="not-italic text-ink-muted">Voilà ta veille du jour.</em>
        </h1>
        <p className="text-xs text-ink-muted">
          {total} référence{total > 1 ? 's' : ''} publiée{total > 1 ? 's' : ''}
          {(mood || typeContenu) ? ' pour ces filtres' : ' dans ta veille'}
        </p>
      </div>

      {/* ── Filtres ── */}
      <div className="px-8 py-5 border-b border-surface-border flex flex-col gap-3">
        <FilterChips label="Ambiance" options={MOODS} active={mood} onToggle={setMood} />
        <FilterChips label="Type" options={TYPES} active={typeContenu} onToggle={setTypeContenu} />
      </div>

      {/* ── Feed ── */}
      <div className="px-8 py-8">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-editorial text-3xl text-ink">Dernières publications</h2>
          <Link to="/library" className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors">
            Explorer la bibliothèque <ArrowRight size={12} />
          </Link>
        </div>

        {loading && (
          <p className="font-mono text-[10px] tracking-widest uppercase text-ink-faint py-12 text-center">Chargement…</p>
        )}

        {error && (
          <p className="text-xs text-red-400 font-mono py-12 text-center">{error}</p>
        )}

        {!loading && !error && references.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-editorial text-xl text-ink-muted mb-2">Rien pour ces filtres.</p>
            <button
              type="button"
              onClick={() => { setMood(null); setTypeContenu(null) }}
              className="font-mono text-[10px] tracking-widest uppercase text-ink underline hover:opacity-70"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {!loading && !error && references.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {references.map(ref => (
              <div key={ref.id} onClick={() => setSelectedRef(ref)}>
                <ReferenceCard reference={ref} />
              </div>
            ))}
          </div>
        )}
      </div>

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
