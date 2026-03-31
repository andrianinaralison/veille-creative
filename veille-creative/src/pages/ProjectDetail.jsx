import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Zap, Loader2, BookmarkCheck, Bookmark,
  Layout, ExternalLink, ChevronRight, Clock, Share2
} from 'lucide-react'
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
    if (!savedRefs.includes(ref.id)) {
      setSavedRefs(prev => [...prev, ref.id])
    }
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-white/40 mb-4">Projet non trouvé.</p>
        <Link to="/projects" className="text-violet-400">Retour aux projets</Link>
      </div>
    )
  }

  const deadline = new Date(project.deadline)
  const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24))

  return (
    <div className="max-w-5xl mx-auto p-8 animate-fade-in">
      {/* Back */}
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 mb-6 transition-colors">
        <ArrowLeft size={14} />
        Projets
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
            <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white mb-0.5">{project.title}</h1>
            <div className="flex items-center gap-3 text-xs text-white/40">
              <span>{project.client}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className={`flex items-center gap-1 ${daysLeft < 2 ? 'text-red-400' : 'text-white/40'}`}>
                <Clock size={11} />
                {daysLeft <= 0 ? 'Deadline dépassée' : `J-${daysLeft}`}
              </span>
            </div>
            {/* Mood presets */}
            <div className="flex gap-1.5 mt-2">
              {project.moodPresets.map(mood => (
                <span key={mood} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  {mood}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/projects/${id}/moodboard`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition-colors"
          >
            <Layout size={14} />
            Moodboard
          </button>
        </div>
      </div>

      {/* Brief */}
      <div className="mb-6 p-4 rounded-xl bg-white/3 border border-white/8">
        <div className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Brief client</div>
        <p className="text-sm text-white/65 leading-relaxed">{project.brief}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/3 border border-white/5 w-fit">
        <button
          onClick={() => setTab('explore')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'explore' ? 'bg-violet-500 text-white' : 'text-white/50 hover:text-white/80'
          }`}
        >
          <Zap size={13} />
          Exploration IA
        </button>
        <button
          onClick={() => setTab('saved')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'saved' ? 'bg-violet-500 text-white' : 'text-white/50 hover:text-white/80'
          }`}
        >
          <BookmarkCheck size={13} />
          Sélectionnées
          {savedRefs.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-white/10 text-[10px] flex items-center justify-center">
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
              <div className="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <Loader2 size={22} className="text-violet-400 animate-spin" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-white/70">Analyse du brief en cours...</div>
                <div className="text-xs text-white/35 mt-1">L'IA filtre les références par intention créative</div>
              </div>
              <div className="flex gap-2">
                {['colorimétrie', 'transitions', 'narrative', 'format', 'lumière'].map((tag, i) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400/60 animate-pulse"
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
                <div className="text-sm text-white/50">
                  <span className="text-white font-medium">{aiSuggestions.length} références</span> générées pour ce brief
                </div>
                <button
                  onClick={() => { setGenerated(false); setAiSuggestions([]) }}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  Régénérer
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {aiSuggestions.map(ref => (
                  <ReferenceCard
                    key={ref.id}
                    reference={ref}
                    onSave={handleSaveAI}
                    showContext
                  />
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
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition-colors"
                >
                  <Layout size={15} />
                  Générer le moodboard avec ces références
                  <ChevronRight size={15} />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <Bookmark size={32} className="mx-auto text-white/15 mb-3" />
              <p className="text-white/40 text-sm mb-3">Aucune référence sélectionnée</p>
              <button onClick={() => setTab('explore')} className="text-violet-400 hover:text-violet-300 text-sm">
                Explorer les suggestions IA →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
