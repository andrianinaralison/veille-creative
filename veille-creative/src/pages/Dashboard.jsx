import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import { mockProjects, mockReferences, mockDigest } from '../data/mockData'
import ReferenceModal from '../components/ReferenceModal'

// ─── Mini card (Frameset style) ───────────────────────────────────────────

function FrameCard({ reference, onClick }) {
  return (
    <div
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-video rounded-sm overflow-hidden bg-surface-raised mb-2">
        <img
          src={reference.thumbnail}
          alt={reference.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300" />
      </div>
      <div>
        <p className="text-[10px] text-ink-muted mb-0.5 truncate">
          {reference.author || reference.platform} &middot;{' '}
          <span className="italic">{reference.platform}</span>
        </p>
        <p className="text-[12px] text-ink leading-snug line-clamp-2">{reference.title}</p>
      </div>
    </div>
  )
}

// ─── Project card ────────────────────────────────────────────────────────

function ProjectCard({ project }) {
  const daysLeft = Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24))
  return (
    <Link to={`/projects/${project.id}`} className="group cursor-pointer">
      <div className="relative aspect-video rounded-sm overflow-hidden bg-surface-raised mb-2">
        <img
          src={project.thumbnail}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
          <div className="flex gap-1">
            {project.moodPresets.slice(0, 2).map(m => (
              <span key={m} className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 backdrop-blur-sm">
                {m}
              </span>
            ))}
          </div>
          {daysLeft > 0 && (
            <span className={`text-[9px] font-semibold ${daysLeft < 2 ? 'text-red-400' : 'text-white/50'}`}>
              J-{daysLeft}
            </span>
          )}
        </div>
      </div>
      <div>
        <p className="text-[10px] text-ink-muted mb-0.5 truncate">{project.client}</p>
        <p className="text-[12px] text-ink leading-snug line-clamp-2">{project.title}</p>
      </div>
    </Link>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [selectedRef, setSelectedRef] = useState(null)
  const [tab, setTab] = useState('references')

  const hero = mockReferences[0]
  const refs = mockReferences.slice(1)
  const activeProjects = mockProjects.filter(p => p.status !== 'terminé')

  return (
    <div className="bg-canvas min-h-screen animate-fade-in">

      {/* ── Hero ── */}
      <div className="relative w-full" style={{ aspectRatio: '21/8' }}>
        <img
          src={hero.thumbnail}
          alt={mockDigest.week}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas/30 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-[11px] font-semibold text-gold uppercase tracking-[0.3em] mb-3">
            Digest · {mockDigest.week}
          </p>
          <h1 className="font-editorial text-5xl text-white mb-4 max-w-xl leading-tight">
            {mockDigest.sections[0]?.items[0]?.title || 'Tendances créatives de la semaine'}
          </h1>
          <Link
            to="/digest"
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white text-sm font-medium transition-all"
          >
            <Play size={13} fill="currentColor" />
            Lire le digest — {mockDigest.readTime}
          </Link>
        </div>
      </div>

      {/* ── Description (like Frameset) ── */}
      <div className="max-w-xl mx-auto text-center px-8 py-8 border-b border-surface-border">
        <p className="text-[13px] text-ink-muted leading-relaxed">
          Votre veille créative hebdomadaire. Des références curéees par IA, filtrées par intention créative,
          disponibles au bon moment de votre workflow — pas dans le bruit du scroll.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-6 px-8 py-4 border-b border-surface-border">
        {[
          { id: 'references', label: 'Références' },
          { id: 'projects', label: 'Projets actifs' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative text-[13px] pb-1 transition-colors ${
              tab === t.id ? 'text-ink font-medium' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
            {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-px bg-ink" />}
          </button>
        ))}
      </div>

      {/* ── Grid (Frameset-style 4 cols) ── */}
      <div className="px-8 py-8">
        {tab === 'references' && (
          <div className="grid grid-cols-4 gap-x-4 gap-y-8">
            {refs.map(ref => (
              <FrameCard
                key={ref.id}
                reference={ref}
                onClick={() => setSelectedRef(ref)}
              />
            ))}
          </div>
        )}

        {tab === 'projects' && (
          <div className="grid grid-cols-4 gap-x-4 gap-y-8">
            {activeProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
            <Link
              to="/projects/new"
              className="flex flex-col items-center justify-center aspect-video rounded-sm border border-dashed border-surface-border hover:border-gold/30 text-ink-muted hover:text-gold text-sm transition-all"
            >
              + Nouveau projet
            </Link>
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
