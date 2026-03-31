import { useState } from 'react'
import { Clock, Bookmark, BookmarkCheck, Sparkles, ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react'
import { mockDigest, mockSurprises } from '../data/mockData'

function DigestItem({ item }) {
  const [saved, setSaved] = useState(item.saved)
  return (
    <div className="group grid grid-cols-[1fr_2fr] gap-6 p-5 rounded-2xl border border-surface-border hover:border-gold/20 bg-surface transition-all">
      <div className="relative rounded-xl overflow-hidden aspect-video">
        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="flex flex-col justify-between py-1">
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-editorial text-lg text-ink leading-snug">{item.title}</h3>
            <button
              onClick={() => setSaved(!saved)}
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${saved ? 'bg-gold text-canvas' : 'bg-surface-raised text-ink-muted hover:bg-gold/10 hover:text-gold'}`}
            >
              {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            </button>
          </div>
          <p className="text-sm text-ink-muted leading-relaxed">{item.description}</p>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <span className="text-[10px] text-ink-faint uppercase tracking-wider font-medium">{item.platform}</span>
          <span className="text-ink-faint">·</span>
          <div className="flex gap-1.5">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-surface-raised text-ink-muted border border-surface-border">{tag}</span>
            ))}
          </div>
          {saved && <span className="ml-auto text-[11px] text-gold font-medium">✓ Sauvegardé</span>}
        </div>
      </div>
    </div>
  )
}

const sectionMeta = {
  couleur: { label: 'Tendances couleur', num: '01' },
  formats: { label: 'Formats émergents', num: '02' },
  narrative: { label: 'Structure narrative', num: '03' },
}

export default function DigestPage() {
  const [tab, setTab] = useState('digest')
  const [reactions, setReactions] = useState({})

  return (
    <div className="bg-canvas min-h-screen animate-fade-in">
      {/* Masthead */}
      <div className="px-10 pt-10 pb-8 border-b border-surface-border">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] text-gold uppercase tracking-widest font-semibold mb-3">{mockDigest.week}</p>
            <h1 className="font-editorial text-5xl text-ink leading-none mb-4">Digest<br /><em className="text-ink-muted not-italic">hebdomadaire</em></h1>
            <div className="flex items-center gap-5 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5"><Clock size={12} /> {mockDigest.readTime} de lecture</span>
              <span>{mockDigest.sections.reduce((a, s) => a + s.items.length, 0)} tendances</span>
              <span>{mockDigest.sections.length} catégories</span>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-surface-raised border border-surface-border">
            <button onClick={() => setTab('digest')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'digest' ? 'bg-gold text-canvas' : 'text-ink-muted hover:text-ink'}`}>
              Digest
            </button>
            <button onClick={() => setTab('surprises')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'surprises' ? 'bg-gold text-canvas' : 'text-ink-muted hover:text-ink'}`}>
              <Sparkles size={13} /> Surprises
            </button>
          </div>
        </div>
      </div>

      <div className="px-10 py-10">
        {tab === 'digest' && (
          <div className="space-y-12">
            {mockDigest.sections.map(section => {
              const meta = sectionMeta[section.id] || { label: section.title, num: '—' }
              return (
                <div key={section.id}>
                  <div className="flex items-baseline gap-4 mb-6">
                    <span className="font-editorial text-5xl text-gold/20">{meta.num}</span>
                    <h2 className="font-editorial text-2xl text-ink">{meta.label}</h2>
                  </div>
                  <div className="space-y-4">
                    {section.items.map(item => <DigestItem key={item.id} item={item} />)}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'surprises' && (
          <div className="space-y-8">
            <p className="text-ink-muted text-sm max-w-lg">Découvertes délibérément hors de vos catégories habituelles. Votre feedback affine les prochaines suggestions.</p>
            <div className="grid grid-cols-3 gap-5">
              {mockSurprises.map(s => (
                <div key={s.id} className="rounded-2xl overflow-hidden border border-surface-border bg-surface">
                  <div className="relative aspect-video">
                    <img src={s.thumbnail} alt={s.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-sm font-semibold text-white leading-snug">{s.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-ink-muted leading-relaxed mb-4">{s.description}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReactions(p => ({ ...p, [s.id]: 'like' }))}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all ${reactions[s.id] === 'like' ? 'border-gold bg-gold/10 text-gold' : 'border-surface-border text-ink-muted hover:border-gold/30 hover:text-gold'}`}
                      >
                        <ThumbsUp size={12} /> J'aime
                      </button>
                      <button
                        onClick={() => setReactions(p => ({ ...p, [s.id]: 'dislike' }))}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all ${reactions[s.id] === 'dislike' ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-surface-border text-ink-muted hover:border-red-500/30 hover:text-red-400'}`}
                      >
                        <ThumbsDown size={12} /> Pas pour moi
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
