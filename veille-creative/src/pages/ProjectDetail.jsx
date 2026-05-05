import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Zap, Loader2, BookmarkCheck, Bookmark, Layout, ChevronRight, Clock } from 'lucide-react'
import { mockProjects, mockReferences, generateAISuggestions } from '../data/mockData'
import ReferenceCard from '../components/ReferenceCard'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const project = mockProjects.find(p => p.id === id)

  const [tab, setTab] = useState('explore')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState([])
  const [savedRefs, setSavedRefs] = useState(project?.references || [])
  const [generated, setGenerated] = useState(false)

  const projectRefs = mockReferences.filter(r => savedRefs.includes(r.id))

  useEffect(() => {
    if (tab === 'explore' && !generated) {
      setIsGenerating(true)
      const timer = setTimeout(() => {
        setAiSuggestions(generateAISuggestions(project?.brief || ''))
        setIsGenerating(false)
        setGenerated(true)
      }, 1800)
      return () => clearTimeout(timer)
    }
  }, [tab, generated])

  const handleSaveAI = (ref) => {
    if (!savedRefs.includes(ref.id)) setSavedRefs(prev => [...prev, ref.id])
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-ink-muted mb-4">Projet non trouvé.</p>
        <Link to="/projects" className="text-ink hover:text-ink-muted transition-colors">Retour aux projets</Link>
      </div>
    )
  }

  const deadline = new Date(project.deadline)
  const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24))

  return (
    <div className="max-w-5xl mx-auto p-8 animate-fade-in">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-6 transition-colors">
        <ArrowLeft size={14} /> Projets
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 overflow-hidden flex-shrink-0">
            <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink mb-0.5">{project.title}</h1>
            <div className="flex items-center gap-3 text-xs text-ink-muted font-mono">
              <span>{project.client}</span>
              <span className="w-1 h-1 rounded-full bg-ink-faint" />
              <span className={`flex items-center gap-1 ${daysLeft < 2 ? 'text-red-400' : ''}`}>
                <Clock size={11} />
                {daysLeft <= 0 ? 'Deadline dépassée' : `J-${daysLeft}`}
              </span>
            </div>
            <div className="flex gap-1.5 mt-2">
              {project.moodPresets.map(mood => (
                <span key={mood} className="text-[10px] px-2 py-0.5 border border-ink/20 bg-ink/8 text-ink-muted" style={{ background: 'rgba(240,235,228,0.06)' }}>
                  {mood}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate(`/projects/${id}/moodboard`)}
          className="flex items-center gap-2 px-4 py-2 bg-ink hover:opacity-90 text-canvas text-sm font-medium transition-opacity"
        >
          <Layout size={14} /> Moodboard
        </button>
      </div>

      {/* Brief */}
      <div className="mb-6 p-4 bg-surface border border-surface-border">
        <div className="font-mono text-xs font-medium text-ink-muted mb-2 uppercase tracking-wider">Brief client</div>
        <p className="text-sm text-ink-muted leading-relaxed">{project.brief}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-surface-raised border border-surface-border w-fit">
        <button
          onClick={() => setTab('explore')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
            tab === 'explore' ? 'bg-ink text-canvas' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Zap size={13} /> Exploration IA
        </button>
        <button
          onClick={() => setTab('saved')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
            tab === 'saved' ? 'bg-ink text-canvas' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <BookmarkCheck size={13} /> Sélectionnées
          {savedRefs.length > 0 && (
            <span className="w-5 h-5 bg-ink/15 text-[10px] flex items-center justify-center">
              {savedRefs.length}
            </span>
          )}
        </button>
      </div>

      {/* Explore tab */}
      {tab === 'explore' && (
        <div>
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 bg-ink/10 flex items-center justify-center">
                <Loader2 size={22} className="text-ink animate-spin" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-ink">Analyse du brief en cours...</div>
                <div className="text-xs text-ink-muted mt-1">L'IA filtre les références par intention créative</div>
              </div>
              <div className="flex gap-2">
                {['colorimétrie', 'transitions', 'narrative', 'format', 'lumière'].map((tag, i) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2 py-0.5 border border-ink/15 text-ink-muted animate-pulse"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="font-mono text-xs text-ink-muted">
                  <span className="text-ink font-medium">{aiSuggestions.length} références</span> générées pour ce brief
                </div>
                <button
                  onClick={() => { setGenerated(false); setAiSuggestions([]) }}
                  className="text-xs text-ink-muted hover:text-ink transition-colors"
                >
                  Régénérer
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {aiSuggestions.map(ref => (
                  <ReferenceCard key={ref.id} reference={ref} onSave={handleSaveAI} showContext />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved tab */}
      {tab === 'saved' && (
        <div>
          {projectRefs.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {projectRefs.map(ref => (
                  <ReferenceCard key={ref.id} reference={ref} showContext />
                ))}
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => navigate(`/projects/${id}/moodboard`)}
                  className="flex items-center gap-2 px-6 py-3 bg-ink hover:opacity-90 text-canvas text-sm font-medium transition-opacity"
                >
                  <Layout size={15} /> Générer le moodboard <ChevronRight size={15} />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <Bookmark size={32} className="mx-auto text-ink-faint mb-3" />
              <p className="text-ink-muted text-sm mb-3">Aucune référence sélectionnée</p>
              <button onClick={() => setTab('explore')} className="text-ink hover:text-ink-muted text-sm transition-colors">
                Explorer les suggestions IA →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
