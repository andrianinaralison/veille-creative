import { useState } from 'react'
import { Sparkles, RefreshCw, Bookmark, BookmarkCheck, ThumbsUp, ThumbsDown } from 'lucide-react'
import { mockSurprises } from '../data/mockData'

export default function SurprisesPage() {
  const [surprises, setSurprises] = useState(mockSurprises.map(s => ({ ...s, reaction: null, saved: false })))
  const [refreshing, setRefreshing] = useState(false)

  const handleReaction = (id, reaction) => {
    setSurprises(prev => prev.map(s => s.id === id ? { ...s, reaction } : s))
  }

  const handleSave = (id) => {
    setSurprises(prev => prev.map(s => s.id === id ? { ...s, saved: !s.saved } : s))
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setSurprises(mockSurprises.map(s => ({ ...s, reaction: null, saved: false })))
      setRefreshing(false)
    }, 1000)
  }

  const liked = surprises.filter(s => s.reaction === 'like').length
  const disliked = surprises.filter(s => s.reaction === 'dislike').length

  return (
    <div className="bg-canvas min-h-screen animate-fade-in">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-surface-border">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-gold" />
              <h1 className="font-editorial text-4xl text-ink">Surprises</h1>
            </div>
            <p className="text-sm text-ink-muted max-w-lg">
              Découvertes hors de votre zone de confort créatif. Délibérément différentes de vos catégories habituelles pour briser les silos créatifs.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-border text-sm text-ink-muted hover:text-ink hover:border-gold/30 transition-all ${refreshing ? 'opacity-50' : ''}`}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Nouvelles surprises
          </button>
        </div>

        {/* Feedback bar */}
        {(liked > 0 || disliked > 0) && (
          <div className="flex items-center gap-4 mt-5 p-3 rounded-xl bg-surface-raised border border-surface-border">
            <div className="text-xs text-ink-muted">Vos retours :</div>
            {liked > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
                <ThumbsUp size={12} /> {liked} aimée{liked > 1 ? 's' : ''}
              </span>
            )}
            {disliked > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
                <ThumbsDown size={12} /> {disliked} pas pour moi
              </span>
            )}
            <span className="ml-auto text-xs text-ink-faint">Vos prochaines suggestions seront affinées</span>
          </div>
        )}
      </div>

      {/* Surprise cards */}
      <div className="px-8 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {surprises.map(surprise => (
            <div key={surprise.id} className="rounded-2xl border border-surface-border bg-surface overflow-hidden animate-slide-up">
              {/* Image — immersive */}
              <div className="relative aspect-[16/7]">
                <img src={surprise.thumbnail} alt={surprise.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Origin badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gold/90 text-canvas">
                    {surprise.origin}
                  </span>
                  <span className="text-[10px] text-white/60">{surprise.platform}</span>
                </div>

                {/* Save button */}
                <button
                  onClick={() => handleSave(surprise.id)}
                  className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-md ${
                    surprise.saved ? 'bg-gold text-canvas' : 'bg-black/40 text-white hover:bg-gold hover:text-canvas'
                  }`}
                >
                  {surprise.saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                </button>

                {/* Title overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-editorial text-xl text-white leading-snug">{surprise.title}</h3>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-sm text-ink-muted leading-relaxed mb-4">{surprise.description}</p>

                {/* Tags */}
                <div className="flex gap-1.5 mb-5 flex-wrap">
                  {surprise.tags.map(tag => (
                    <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-surface-raised text-ink-muted border border-surface-border">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Reaction */}
                <div className="flex items-center gap-3 pt-4 border-t border-surface-border">
                  <span className="text-xs text-ink-muted">Cette référence vous inspire ?</span>
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => handleReaction(surprise.id, 'like')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                        surprise.reaction === 'like'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                          : 'border border-surface-border text-ink-muted hover:border-green-500/30 hover:text-green-400 hover:bg-green-500/5'
                      }`}
                    >
                      <ThumbsUp size={13} />
                      J'aime
                    </button>
                    <button
                      onClick={() => handleReaction(surprise.id, 'dislike')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                        surprise.reaction === 'dislike'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : 'border border-surface-border text-ink-muted hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5'
                      }`}
                    >
                      <ThumbsDown size={13} />
                      Pas pour moi
                    </button>
                  </div>
                </div>

                {surprise.reaction && (
                  <div className="mt-3 p-2.5 rounded-lg bg-surface-raised border border-surface-border text-[11px] text-ink-muted">
                    {surprise.reaction === 'like'
                      ? '✓ Noté — vos prochaines surprises intégreront des directions similaires.'
                      : '✓ Noté — on élargit encore les explorations pour sortir de vos habituels.'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state after all reactions */}
        {surprises.every(s => s.reaction) && (
          <div className="mt-8 max-w-2xl mx-auto text-center p-8 rounded-2xl border border-dashed border-gold/20 bg-gold/5">
            <Sparkles size={24} className="mx-auto text-gold/50 mb-3" />
            <div className="font-editorial text-xl text-ink mb-2">Vous avez évalué toutes les surprises</div>
            <p className="text-xs text-ink-muted mb-4">
              Vos retours nous permettent d'affiner les prochaines suggestions.
            </p>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/20 text-gold text-sm font-medium mx-auto hover:bg-gold/30 transition-all"
            >
              <RefreshCw size={14} />
              Voir de nouvelles surprises
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
