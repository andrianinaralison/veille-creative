import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '../lib/api'

const statusLabel = {
  DRAFT: 'Brouillon',
  IN_PROGRESS: 'En cours',
  DONE: 'Terminé',
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.projects.get(id)
      .then(setProject)
      .catch(() => setError('Projet introuvable.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!window.confirm('Supprimer ce projet et son treatment ?')) return
    await api.projects.remove(id)
    navigate('/projects')
  }

  if (loading) {
    return (
      <div className="bg-canvas min-h-screen flex items-center justify-center">
        <span className="font-mono text-[10px] tracking-widest uppercase text-ink-faint">Chargement…</span>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="bg-canvas min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-ink-muted">{error ?? 'Projet introuvable.'}</p>
        <Link to="/projects" className="font-mono text-[10px] tracking-widest uppercase text-ink underline">← Projets</Link>
      </div>
    )
  }

  return (
    <div className="bg-canvas min-h-screen animate-fade-in px-8 py-10 max-w-4xl">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-8 transition-colors">
        <ArrowLeft size={14} /> Projets
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-1">
            {project.client || 'Sans client'} · {statusLabel[project.status]}
            {project.deadline && ` · deadline ${new Date(project.deadline).toLocaleDateString('fr-FR')}`}
          </p>
          <h1 className="font-editorial text-4xl text-ink">{project.title}</h1>
        </div>
        <button
          onClick={handleDelete}
          className="font-mono text-[10px] tracking-widest uppercase text-ink-faint hover:text-red-400 transition-colors flex-shrink-0"
        >
          Supprimer
        </button>
      </div>

      {project.brief && (
        <div className="mb-8">
          <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-2">Brief client</p>
          <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-line">{project.brief}</p>
        </div>
      )}

      <div className="border-t border-surface-border pt-8">
        <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-4">
          Treatment · {project.items.length} référence{project.items.length > 1 ? 's' : ''}
        </p>
        {project.items.length === 0 ? (
          <p className="text-xs text-ink-faint py-10 text-center border border-dashed border-surface-border">
            Le builder de treatment arrive ici — sélection de références, intention créative, partage.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {project.items.map(item => (
              <div key={item.id} className="border border-surface-border">
                <img src={item.reference.thumbnailUrl} alt="" className="w-full aspect-video object-cover" />
                <p className="text-[11px] text-ink truncate px-2 py-1.5">{item.reference.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
