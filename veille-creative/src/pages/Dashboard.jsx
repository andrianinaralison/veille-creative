import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, BookmarkCheck, Clock } from 'lucide-react'
import { mockProjects, mockReferences, mockDigest } from '../data/mockData'
import ReferenceModal from '../components/ReferenceModal'

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])
  return now
}

function BriefingCard({ num, tag, title, body, cta, to, accent = false }) {
  return (
    <Link
      to={to}
      className={`group flex flex-col border bg-surface hover:border-ink/20 transition-all overflow-hidden ${accent ? 'border-ink/30' : 'border-surface-border'}`}
    >
      {accent && <div className="h-px bg-ink w-full" />}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-[10px] font-semibold text-ink-faint">{num}</span>
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">{tag}</span>
        </div>
        <h3 className="font-editorial text-lg text-ink leading-snug mb-2 flex-1">{title}</h3>
        <p className="text-xs text-ink-muted leading-relaxed mb-4 line-clamp-2">{body}</p>
        <div className="flex items-center gap-1.5 text-xs text-ink font-medium group-hover:gap-2.5 transition-all">
          {cta} <ArrowRight size={12} />
        </div>
      </div>
    </Link>
  )
}

function PortraitThumb({ reference, onClick }) {
  return (
    <div
      className="group relative overflow-hidden cursor-pointer"
      style={{ aspectRatio: '4/5' }}
      onClick={onClick}
    >
      <img
        src={reference.thumbnail}
        alt={reference.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-[10px] text-white leading-tight line-clamp-2">{reference.title}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [selectedRef, setSelectedRef] = useState(null)
  const now = useClock()

  const activeProjects = mockProjects.filter(p => p.status !== 'terminé')
  const activeProject = activeProjects[0]
  const digestItem = mockDigest.sections[0]?.items[0]
  const savedCount = mockReferences.filter(r => r.saved || r.savedAt).length

  const dateLabel = `· ${DAYS_FR[now.getDay()].toUpperCase()} · ${now.getDate()} ${MONTHS_FR[now.getMonth()].toUpperCase()} · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const daysLeft = activeProject ? Math.ceil((new Date(activeProject.deadline) - now) / (1000 * 60 * 60 * 24)) : null

  return (
    <div className="bg-canvas min-h-screen animate-fade-in">

      {/* ── Header ── */}
      <div className="px-8 pt-10 pb-8 border-b border-surface-border">
        <p className="font-mono text-[11px] font-semibold text-ink-muted uppercase tracking-[0.22em] mb-4">
          {dateLabel}
        </p>
        <h1 className="font-editorial text-5xl text-ink leading-[0.95] mb-8">
          Bonjour Andri.<br />
          <em className="not-italic text-ink-muted">Trois choses pour aujourd'hui.</em>
        </h1>

        {/* Briefing cards */}
        <div className="grid grid-cols-3 gap-4">
          <BriefingCard
            num="01"
            tag="Projet actif"
            title={activeProject?.title || 'Aucun projet en cours'}
            body={activeProject?.brief || 'Créez votre premier projet pour voir les suggestions IA ici.'}
            cta={activeProject ? `J-${daysLeft} · Explorer les références` : 'Nouveau projet'}
            to={activeProject ? `/projects/${activeProject.id}` : '/projects/new'}
            accent
          />
          <BriefingCard
            num="02"
            tag="Digest du jour"
            title={digestItem?.title || 'Digest hebdomadaire'}
            body={digestItem?.description || 'Vos références créatives de la semaine, curées par IA.'}
            cta="Lire le digest"
            to="/digest"
          />
          <BriefingCard
            num="03"
            tag="À faire"
            title="Compléter votre bibliothèque"
            body={`${savedCount} références sauvegardées. Continuez à enrichir votre collection pour des suggestions plus précises.`}
            cta="Explorer la bibliothèque"
            to="/library"
          />
        </div>
      </div>

      {/* ── Ta veine du moment ── */}
      <div className="px-8 py-10">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-editorial text-3xl text-ink">
            Ta veine du moment
          </h2>
          <Link to="/library" className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors">
            Voir tout <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-9 gap-2">
          {mockReferences.slice(0, 9).map(ref => (
            <PortraitThumb
              key={ref.id}
              reference={ref}
              onClick={() => setSelectedRef(ref)}
            />
          ))}
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="px-8 py-6 border-t border-surface-border">
        <div className="grid grid-cols-4 gap-8">
          {[
            { value: mockReferences.length, label: 'Références' },
            { value: activeProjects.length, label: 'Projets actifs' },
            { value: mockProjects.filter(p => p.moodboard?.generated).length, label: 'Moodboards' },
            { value: `${mockDigest.sections.reduce((a, s) => a + s.items.length, 0)}`, label: 'Cette semaine' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="font-editorial text-4xl text-ink leading-none mb-1">{value}</div>
              <div className="font-mono text-[10px] text-ink-faint uppercase tracking-widest">{label}</div>
            </div>
          ))}
        </div>
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
