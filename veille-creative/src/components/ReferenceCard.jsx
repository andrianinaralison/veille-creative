import { useState } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'

const platformDot = {
  'Vimeo': '#1ab7ea',
  'Instagram': '#e1306c',
  'TikTok': '#ff0050',
  'YouTube': '#ff0000',
  'Shotdeck': '#f5a623',
  'Pinterest': '#bd081c',
  'LinkedIn': '#0077b5',
}

export default function ReferenceCard({ reference, onSave, size = 'normal' }) {
  const [saved, setSaved] = useState(reference.saved ?? !!reference.savedAt)
  const [flash, setFlash] = useState(false)

  const handleSave = (e) => {
    e.stopPropagation()
    const next = !saved
    setSaved(next)
    if (next) { setFlash(true); setTimeout(() => setFlash(false), 800) }
    onSave?.({ ...reference, saved: next })
  }

  return (
    <div className={`group relative overflow-hidden rounded-xl bg-surface card-cinematic cursor-pointer ${size === 'large' ? 'aspect-[4/3]' : 'aspect-[3/2]'}`}>
      {/* Image */}
      <img
        src={reference.thumbnail}
        alt={reference.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Top: platform + save */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <span
          className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase px-2 py-1 rounded-md"
          style={{ backgroundColor: `${platformDot[reference.platform] || '#666'}22`, color: platformDot[reference.platform] || '#fff', border: `1px solid ${platformDot[reference.platform] || '#666'}44` }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: platformDot[reference.platform] || '#666' }} />
          {reference.platform}
        </span>
        <button
          onClick={handleSave}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-md ${saved ? 'bg-gold text-canvas' : 'bg-black/40 text-white hover:bg-gold hover:text-canvas'}`}
        >
          {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
        </button>
      </div>

      {/* Relevance (IA) */}
      {reference.relevanceScore && (
        <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/90 text-canvas">
          {Math.round(reference.relevanceScore * 100)}%
        </div>
      )}

      {/* Bottom: title + tags */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-sm font-medium text-white leading-snug mb-2 line-clamp-2">{reference.title}</h3>
        <div className="flex gap-1 flex-wrap">
          {reference.tags.slice(0, 4).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 backdrop-blur-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Context tooltip on hover */}
      {reference.context && (
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <p className="text-[11px] text-white/70 leading-relaxed line-clamp-3 mb-2">{reference.context}</p>
          <h3 className="text-xs font-semibold text-white">{reference.title}</h3>
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {reference.tags.slice(0, 5).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Save flash */}
      {flash && (
        <div className="absolute inset-0 bg-gold/10 flex items-center justify-center animate-fade-in pointer-events-none">
          <div className="bg-gold text-canvas text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <BookmarkCheck size={12} /> Sauvegardé
          </div>
        </div>
      )}
    </div>
  )
}
