import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ChevronRight } from 'lucide-react'
import { api } from '../lib/api'

const statusLabel = {
  IN_PROGRESS: { text: 'En cours', color: 'text-ink', dot: 'bg-ink' },
  DRAFT: { text: 'Brouillon', color: 'text-ink-muted', dot: 'bg-ink-muted' },
  DONE: { text: 'Terminé', color: 'text-green-400', dot: 'bg-green-400' },
}

function ProjectCard({ project }) {
  const s = statusLabel[project.status] || statusLabel.DRAFT
  const thumb = project.items?.[0]?.reference?.thumbnailUrl
  const daysLeft = project.deadline
    ? Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group block overflow-hidden border border-surface-border hover:border-ink/20 transition-all"
    >
      <div className="relative aspect-[16/7] overflow-hidden bg-surface">
        {thumb ? (
          <img src={thumb} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-mono text-[10px] tracking-widest uppercase text-ink-faint">Treatment vide</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex items-center justify-between mb-1">
            <span className={`flex items-center gap-1.5 font-mono text-[11px] font-semibold ${s.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.text}
            </span>
            {daysLeft !== null && (
              <span className={`font-mono text-[11px] font-medium ${daysLeft < 2 ? 'text-red-400' : 'text-white/50'}`}>
                {daysLeft <= 0 ? 'Expiré' : `J-${daysLeft}`}
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-white truncate">{project.title}</h3>
          <p className="text-xs text-white/50 mt-0.5">{project.client || '—'}</p>
        </div>
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 bg-ink flex items-center justify-center">
            <ChevronRight size={14} className="text-canvas" />
          </div>
        </div>
      </div>
      <div className="px-5 py-3 bg-surface flex items-center gap-2">
        <span className="text-[11px] text-ink-muted">
          {project._count?.items ?? 0} référence{(project._count?.items ?? 0) > 1 ? 's' : ''}
        </span>
        {project.shareToken && (
          <span className="ml-auto font-mono text-[11px] text-ink font-medium">Partagé</span>
        )}
      </div>
    </Link>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.projects.list()
      .then(d => setProjects(d.projects ?? []))
      .catch(() => setError('Impossible de charger les projets.'))
      .finally(() => setLoading(false))
  }, [])

  const active = projects.filter(p => p.status !== 'DONE')
  const done = projects.filter(p => p.status === 'DONE')

  return (
    <div className="bg-canvas min-h-screen animate-fade-in">
      <div className="px-8 pt-8 pb-6 border-b border-surface-border flex items-end justify-between">
        <div>
          <h1 className="font-editorial text-4xl text-ink mb-1">Projets client</h1>
          <p className="text-ink-muted text-sm">{active.length} en cours · {done.length} terminé{done.length > 1 ? 's' : ''}</p>
        </div>
        <Link
          to="/projects/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-ink hover:opacity-90 text-canvas text-sm font-semibold transition-opacity"
        >
          <Plus size={14} /> Nouveau projet
        </Link>
      </div>

      <div className="px-8 py-8 space-y-10">
        {loading && (
          <p className="font-mono text-[10px] tracking-widest uppercase text-ink-faint py-8 text-center">Chargement…</p>
        )}
        {error && <p className="text-xs text-red-400 font-mono py-8 text-center">{error}</p>}

        {!loading && !error && (
          <div>
            <p className="font-mono text-[10px] font-semibold text-ink-muted uppercase tracking-widest mb-5">En cours</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {active.map(project => <ProjectCard key={project.id} project={project} />)}
              <Link
                to="/projects/new"
                className="border border-dashed border-surface-border hover:border-ink/20 transition-colors flex flex-col items-center justify-center gap-3 aspect-[16/9] text-ink-muted hover:text-ink"
              >
                <Plus size={20} />
                <span className="text-sm font-medium">Nouveau projet client</span>
              </Link>
            </div>
          </div>
        )}

        {!loading && done.length > 0 && (
          <div>
            <p className="font-mono text-[10px] font-semibold text-ink-muted uppercase tracking-widest mb-4">Terminés</p>
            <div className="space-y-2">
              {done.map(project => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center gap-4 p-4 border border-surface-border hover:border-ink/15 bg-surface transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink-muted truncate">{project.title}</div>
                    <div className="text-xs text-ink-faint">{project.client || '—'}</div>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Terminé
                  </span>
                  <ChevronRight size={14} className="text-ink-faint group-hover:text-ink transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
