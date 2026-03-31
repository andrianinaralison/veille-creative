import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Grid3X3, AlignLeft, Palette, Download,
  Share2, Check, ExternalLink, FileText
} from 'lucide-react'
import { mockProjects, mockReferences } from '../data/mockData'

const layouts = [
  {
    id: 'grid',
    label: 'Grille serrée',
    icon: Grid3X3,
    description: 'Vision d\'ensemble panoramique — idéal pour les ambiances',
  },
  {
    id: 'narrative',
    label: 'Planche narrative',
    icon: AlignLeft,
    description: 'Références ordonnées avec contexte — structure de l\'histoire',
  },
  {
    id: 'color',
    label: 'Focus colorimétrie',
    icon: Palette,
    description: 'Extraction des dominantes couleur — alignement de palette',
  },
]

function GridLayout({ refs }) {
  return (
    <div className="grid grid-cols-3 gap-2 h-full">
      {refs.slice(0, 6).map((ref, i) => (
        <div key={ref.id} className={`rounded-xl overflow-hidden relative ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
          <img src={ref.thumbnail} alt={ref.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex gap-1 flex-wrap">
              {ref.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-black/50 text-white/80">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function NarrativeLayout({ refs }) {
  return (
    <div className="space-y-3 h-full overflow-y-auto">
      {refs.slice(0, 4).map((ref, i) => (
        <div key={ref.id} className="flex gap-4 p-3 rounded-xl bg-surface-raised border border-surface-border">
          <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <img src={ref.thumbnail} alt={ref.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-ink mb-1">
              {String(i + 1).padStart(2, '0')} — {ref.title}
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed line-clamp-2">{ref.context}</p>
            <div className="flex gap-1 mt-1.5">
              {ref.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-surface-raised text-ink-faint border border-surface-border">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ColorLayout({ refs }) {
  const colorGroups = [
    { label: 'Dominante 1', color: '#c4a882', refs: refs.slice(0, 2) },
    { label: 'Dominante 2', color: '#7c9db5', refs: refs.slice(1, 3) },
    { label: 'Accent', color: '#d4956a', refs: refs.slice(2, 4) },
  ]
  return (
    <div className="space-y-4">
      {colorGroups.map(group => (
        <div key={group.label} className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="w-10 h-16 rounded-xl" style={{ backgroundColor: group.color }} />
            <span className="text-[9px] text-ink-muted font-mono">
              {group.color.toUpperCase()}
            </span>
            <span className="text-[9px] text-ink-faint">{group.label}</span>
          </div>
          <div className="flex gap-2 flex-1">
            {group.refs.map(ref => (
              <div key={ref.id} className="flex-1 rounded-lg overflow-hidden" style={{ height: '80px' }}>
                <img src={ref.thumbnail} alt={ref.title} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MoodboardBuilder() {
  const { id } = useParams()
  const project = mockProjects.find(p => p.id === id)
  const [selectedLayout, setSelectedLayout] = useState('grid')
  const [exported, setExported] = useState(false)
  const [copied, setCopied] = useState(false)

  const refs = mockReferences.filter(r => project?.references?.includes(r.id))
  const allRefs = refs.length > 0 ? refs : mockReferences.slice(0, 4)

  const handleExportPDF = () => {
    setExported(true)
    setTimeout(() => setExported(false), 3000)
  }

  const handleCopyLink = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-ink-muted">Projet non trouvé.</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-canvas animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link to={`/projects/${id}`} className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors">
            <ArrowLeft size={14} />
          </Link>
          <div>
            <div className="text-sm font-semibold text-ink">{project.title}</div>
            <div className="text-xs text-ink-muted">Moodboard — {allRefs.length} références</div>
          </div>
        </div>

        {/* Layout selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-raised border border-surface-border">
          {layouts.map(({ id: lId, label, icon: Icon }) => (
            <button
              key={lId}
              onClick={() => setSelectedLayout(lId)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedLayout === lId
                  ? 'bg-gold text-canvas'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Icon size={13} />
              <span className="font-editorial">{label}</span>
            </button>
          ))}
        </div>

        {/* Export actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              copied
                ? 'border-green-500/40 bg-green-500/10 text-green-400'
                : 'border-surface-border text-ink-muted hover:border-gold/30 hover:text-ink'
            }`}
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            {copied ? 'Lien copié !' : 'Lien interactif'}
          </button>
          <button
            onClick={handleExportPDF}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              exported
                ? 'bg-green-500 text-white'
                : 'bg-gold hover:bg-gold-light text-canvas'
            }`}
          >
            {exported ? <Check size={14} /> : <FileText size={14} />}
            {exported ? 'PDF généré !' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* Moodboard header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-editorial text-2xl text-ink">{project.title}</h2>
              <div className="flex items-center gap-3 text-xs text-ink-muted mt-1">
                <span>{project.client}</span>
                <span className="w-1 h-1 rounded-full bg-surface-border" />
                <div className="flex gap-1">
                  {project.moodPresets.map(mood => (
                    <span key={mood} className="px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
                      {mood}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-xs text-ink-faint">VeilleCreative · {new Date().toLocaleDateString('fr-FR')}</div>
          </div>

          {/* Layout preview */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 min-h-96">
            {selectedLayout === 'grid' && <GridLayout refs={allRefs} />}
            {selectedLayout === 'narrative' && <NarrativeLayout refs={allRefs} />}
            {selectedLayout === 'color' && <ColorLayout refs={allRefs} />}
          </div>

          {/* Brief excerpt */}
          <div className="mt-4 p-4 rounded-xl border border-surface-border bg-surface-raised">
            <div className="text-xs text-ink-faint mb-2 font-medium uppercase tracking-wider">Brief</div>
            <p className="text-xs text-ink-muted leading-relaxed">{project.brief}</p>
          </div>
        </div>

        {/* Sidebar — references */}
        <div className="w-64 flex-shrink-0 border-l border-surface-border bg-surface p-4 overflow-y-auto">
          <div className="text-xs font-semibold text-ink-muted mb-3 uppercase tracking-wider">Références ({allRefs.length})</div>
          <div className="space-y-2">
            {allRefs.map(ref => (
              <div key={ref.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-raised transition-all group">
                <div className="w-10 h-8 rounded-md overflow-hidden flex-shrink-0">
                  <img src={ref.thumbnail} alt={ref.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-ink-muted truncate">{ref.title}</div>
                  <div className="text-[10px] text-ink-faint">{ref.platform}</div>
                </div>
                <a href="#" className="text-ink-faint group-hover:text-ink-muted transition-colors">
                  <ExternalLink size={11} />
                </a>
              </div>
            ))}
          </div>

          {/* Share section */}
          <div className="mt-6 pt-4 border-t border-surface-border">
            <div className="text-xs font-semibold text-ink-muted mb-3 uppercase tracking-wider">Partager</div>
            <div className="space-y-2">
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-surface-border text-xs text-ink-muted hover:text-ink hover:border-gold/30 transition-all"
              >
                <Share2 size={12} />
                Lien interactif (sans compte)
              </button>
              <button
                onClick={handleExportPDF}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gold/10 border border-gold/20 text-xs text-gold hover:bg-gold/20 transition-all"
              >
                <Download size={12} />
                Export PDF one-click
              </button>
            </div>
            {exported && (
              <div className="mt-3 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-[11px] text-green-400 flex items-center gap-2">
                <Check size={11} />
                PDF prêt à envoyer au client
              </div>
            )}
          </div>

          {/* Layout info */}
          <div className="mt-4 pt-4 border-t border-surface-border">
            <div className="text-[11px] text-ink-faint">
              {layouts.find(l => l.id === selectedLayout)?.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
