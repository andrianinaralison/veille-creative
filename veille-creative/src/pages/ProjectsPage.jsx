import { Link } from 'react-router-dom'
import { Plus, ChevronRight } from 'lucide-react'
import { mockProjects } from '../data/mockData'

const statusLabel = {
  'en-cours': { text: 'En cours', color: 'text-gold', dot: 'bg-gold' },
  'brouillon': { text: 'Brouillon', color: 'text-amber-400', dot: 'bg-amber-400' },
  'terminé': { text: 'Terminé', color: 'text-green-400', dot: 'bg-green-400' },
}

export default function ProjectsPage() {
  const active = mockProjects.filter(p => p.status !== 'terminé')
  const done = mockProjects.filter(p => p.status === 'terminé')

  return (
    <div className="bg-canvas min-h-screen animate-fade-in">
      <div className="px-8 pt-8 pb-6 border-b border-surface-border flex items-end justify-between">
        <div>
          <h1 className="font-editorial text-4xl text-ink mb-1">Projets client</h1>
          <p className="text-ink-muted text-sm">{active.length} en cours · {done.length} terminé{done.length > 1 ? 's' : ''}</p>
        </div>
        <Link to="/projects/new" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-canvas text-sm font-semibold transition-colors">
          <Plus size={14} /> Nouveau projet
        </Link>
      </div>

      <div className="px-8 py-8 space-y-10">
        {/* Active */}
        <div>
          <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-widest mb-5">En cours</p>
          <div className="grid grid-cols-2 gap-5">
            {active.map(project => {
              const s = statusLabel[project.status]
              const daysLeft = Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24))
              return (
                <Link key={project.id} to={`/projects/${project.id}`} className="group block rounded-2xl overflow-hidden border border-surface-border hover:border-gold/25 transition-all">
                  <div className="relative aspect-[16/7] overflow-hidden">
                    <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${s.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.text}
                        </span>
                        <span className={`text-[11px] font-medium ${daysLeft < 2 ? 'text-red-400' : 'text-white/50'}`}>
                          {daysLeft <= 0 ? 'Expiré' : `J-${daysLeft}`}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-white truncate">{project.title}</h3>
                      <p className="text-xs text-white/50 mt-0.5">{project.client}</p>
                    </div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
                        <ChevronRight size={14} className="text-canvas" />
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-surface flex items-center gap-2">
                    {project.moodPresets.map(m => (
                      <span key={m} className="text-[11px] px-2.5 py-1 rounded-full border border-surface-border text-ink-muted">{m}</span>
                    ))}
                    {project.moodboard?.generated && (
                      <span className="ml-auto text-[11px] text-gold font-medium">Moodboard prêt</span>
                    )}
                  </div>
                </Link>
              )
            })}
            <Link to="/projects/new" className="rounded-2xl border-2 border-dashed border-surface-border hover:border-gold/30 transition-colors flex flex-col items-center justify-center gap-3 aspect-[16/9] text-ink-muted hover:text-gold">
              <Plus size={20} />
              <span className="text-sm font-medium">Nouveau projet client</span>
            </Link>
          </div>
        </div>

        {/* Done */}
        {done.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-widest mb-4">Terminés</p>
            <div className="space-y-2">
              {done.map(project => (
                <Link key={project.id} to={`/projects/${project.id}`} className="flex items-center gap-4 p-4 rounded-xl border border-surface-border hover:border-gold/20 bg-surface transition-all group">
                  <div className="w-12 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={project.thumbnail} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink-muted truncate">{project.title}</div>
                    <div className="text-xs text-ink-faint">{project.client}</div>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Terminé
                  </span>
                  <ChevronRight size={14} className="text-ink-faint group-hover:text-gold transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
