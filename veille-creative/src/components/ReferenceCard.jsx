import { useState } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useSaved } from '../store/useSavedStore'

const platformDot = {
  'Vimeo': '#1ab7ea',
  'Instagram': '#e1306c',
  'TikTok': '#ff0050',
  'YouTube': '#ff0000',
  'Shotdeck': '#f5a623',
  'Pinterest': '#bd081c',
  'LinkedIn': '#0077b5',
}

/**
 * Carte de référence unique (180-65) — instanciée par toutes les surfaces.
 * `variant="grid"` : paysage 16:9 (feed, résultats de recherche, Bibliothèque).
 * `variant="shelf"` : portrait 4:5 (rangées Explorer façon Netflix).
 * La carte porte son propre `onClick` (ouverture modale) ; le bouton save stoppe la propagation.
 */
export default function ReferenceCard({ reference, onClick, onSave, variant = 'grid' }) {
  const [saved, toggleSave] = useSaved(reference.id)
  const [flash, setFlash] = useState(false)

  const handleSave = async (e) => {
    e.stopPropagation()
    const next = !saved
    if (next) { setFlash(true); setTimeout(() => setFlash(false), 800) }
    try {
      await toggleSave()
      onSave?.({ ...reference, saved: next })
    } catch { /* rollback géré par le store */ }
  }

  // ── Variante portrait (rangées Explorer) ──────────────────────────────────
  if (variant === 'shelf') {
    return (
      <div
        className="group relative flex-shrink-0 cursor-pointer overflow-hidden rounded-sm"
        style={{ width: 164, aspectRatio: '4/5' }}
        onClick={onClick}
      >
        <img
          src={reference.thumbnailUrl}
          alt={reference.title}
          className="w-full h-full object-cover scale-[1.35] transition-transform duration-500 group-hover:scale-[1.42]"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.88))' }} />

        {saved && (
          <span className="absolute top-2 left-2 w-[18px] h-[18px] bg-ink text-canvas grid place-items-center">
            <BookmarkCheck size={9} />
          </span>
        )}

        <button
          onClick={handleSave}
          className={`absolute top-2 right-2 w-7 h-7 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
            saved ? 'bg-ink text-canvas' : 'bg-black/50 text-white hover:bg-ink hover:text-canvas'
          }`}
        >
          {saved ? <BookmarkCheck size={10} /> : <Bookmark size={10} />}
        </button>

        <div className="absolute left-2.5 right-2.5 bottom-2.5">
          <div className="font-mono text-[8px] text-white/45 uppercase tracking-widest mb-1 truncate">
            {reference.channelName}
          </div>
          <div className="text-[11px] text-white leading-tight font-medium line-clamp-2 mb-1.5">
            {reference.title}
          </div>
          <div className="flex gap-1 flex-wrap">
            {(reference.taxonomy || []).slice(0, 2).map(t => (
              <span key={t} className="text-[8px] px-1.5 py-0.5 bg-white/10 text-white/60 lowercase">
                {t.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Variante paysage (feed / résultats / Bibliothèque) ────────────────────
  return (
    <div
      className="group relative overflow-hidden bg-surface card-cinematic cursor-pointer aspect-video"
      onClick={onClick}
    >
      {/* Image */}
      <img
        src={reference.thumbnailUrl}
        alt={reference.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Top: platform + save */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <span
          className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase px-2 py-1"
          style={{ backgroundColor: `${platformDot[reference.platform] || '#666'}22`, color: platformDot[reference.platform] || '#fff', border: `1px solid ${platformDot[reference.platform] || '#666'}44` }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: platformDot[reference.platform] || '#666' }} />
          {reference.platform}
        </span>
        <button
          onClick={handleSave}
          className={`w-8 h-8 flex items-center justify-center transition-all backdrop-blur-md ${saved ? 'bg-ink text-canvas' : 'bg-black/40 text-white hover:bg-ink hover:text-canvas'}`}
        >
          {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
        </button>
      </div>

      {/* Relevance (IA) */}
      {reference.relevanceScore && (
        <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 bg-ink/90 text-canvas">
          {Math.round(reference.relevanceScore * 100)}%
        </div>
      )}

      {/* Bottom: title + tags */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-sm font-medium text-white leading-snug mb-2 line-clamp-2">{reference.title}</h3>
        <div className="flex gap-1 flex-wrap">
          {(reference.taxonomy ?? []).slice(0, 4).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/70 backdrop-blur-sm">
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
            {(reference.taxonomy ?? []).slice(0, 5).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/60">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Save flash */}
      {flash && (
        <div className="absolute inset-0 bg-ink/10 flex items-center justify-center animate-fade-in pointer-events-none">
          <div className="bg-ink text-canvas text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5">
            <BookmarkCheck size={12} /> Sauvegardé
          </div>
        </div>
      )}
    </div>
  )
}
