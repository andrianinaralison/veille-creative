import { useEffect, useState } from 'react'
import { X, Bookmark, BookmarkCheck, ExternalLink, Play } from 'lucide-react'

function getEmbedUrl(url) {
  if (!url) return null
  // YouTube: watch?v=ID or youtu.be/ID
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
  return null
}

// Derive a few "spec" fields from the reference data
function deriveSpecs(reference) {
  const tags = reference.tags || []

  const camera = tags.find(t =>
    ['Sony-FX3','Sony-A1','Canon-C70','Canon-C80','Lumix-S5ii','Lumix-S1','Blackmagic-BMPCC'].includes(t)
  ) || '—'

  const technique = tags.find(t =>
    ['slow-motion','handheld','travelling','drone','anamorphique','BTS'].includes(t)
  ) || '—'

  const lumiere = tags.find(t =>
    ['golden-hour','basse-lumière','extérieur','lumière naturelle','contre-jour'].includes(t)
  ) || '—'

  const colorimetrie = tags.find(t =>
    ['V-Log','S-Log','LUT','grain','vintage','colorimétrie','S-Cinetone'].includes(t)
  ) || '—'

  return [
    { label: 'Caméra', value: camera.replace(/-/g,' ') },
    { label: 'Technique', value: technique.replace(/-/g,' ') },
    { label: 'Lumière', value: lumiere.replace(/-/g,' ') },
    { label: 'Colorimétrie', value: colorimetrie },
  ]
}

export default function ReferenceModal({ reference, onClose }) {
  const [saved, setSaved] = useState(reference.saved ?? !!reference.savedAt)
  const [isPlaying, setIsPlaying] = useState(false)
  const embedUrl = getEmbedUrl(reference.url)
  const specs = deriveSpecs(reference)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // Extract display tags (non-camera, non-technical identifiers)
  const displayTags = (reference.tags || [])
    .filter(t => !['Sony-FX3','Sony-A1','Canon-C70','Canon-C80','Lumix-S5ii','Lumix-S1','Blackmagic-BMPCC'].includes(t))
    .slice(0, 4)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-5xl mx-6 rounded-sm overflow-hidden border border-surface-border shadow-[0px_0px_80px_rgba(0,0,0,0.9)] animate-slide-up"
        style={{ background: '#000000' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-ink-muted hover:text-ink transition-colors"
        >
          <X size={14} />
        </button>

        <div className="grid grid-cols-[1fr_340px]" style={{ minHeight: 520 }}>

          {/* ── LEFT: Video / Thumbnail ──────────────────────────── */}
          <div className="relative bg-black overflow-hidden">
            {isPlaying && embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                style={{ aspectRatio: '16/10', minHeight: 360 }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                {/* Thumbnail */}
                <img
                  src={reference.thumbnail}
                  alt={reference.title}
                  className="w-full h-full object-cover opacity-80"
                  style={{ aspectRatio: '16/10' }}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Play button */}
                <button
                  className="absolute inset-0 flex items-center justify-center"
                  onClick={() => embedUrl ? setIsPlaying(true) : window.open(reference.url, '_blank')}
                >
                  <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Play size={28} fill="white" className="text-white ml-1" />
                  </div>
                </button>

                {/* Tech label top-left */}
                <div className="absolute top-5 left-6">
                  <span className="text-[10px] text-white/40 uppercase tracking-[0.1em] font-mono">
                    {reference.platform} · {reference.type || 'video'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* ── RIGHT: Structured Sidebar ───────────────────────── */}
          <div className="flex flex-col border-l border-surface-border" style={{ background: '#000000' }}>

            {/* Identification */}
            <div className="px-8 py-8 border-b border-surface-border flex flex-col gap-4">
              {/* Type badge + platform */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold bg-ink text-canvas px-2 py-0.5 tracking-[-0.02em]">
                  {reference.mood?.toUpperCase() || 'REF'}
                </span>
                <span className="text-[10px] text-ink-muted uppercase tracking-[0.15em] font-medium">
                  {reference.author || reference.platform}
                </span>
              </div>

              {/* Title */}
              <h2 className="font-editorial text-[22px] text-ink leading-[1.1] tracking-[-0.03em]">
                {reference.title}
              </h2>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {displayTags.map(tag => (
                  <span
                    key={tag}
                    className="text-[9px] font-semibold uppercase tracking-[0.08em] px-3 py-1 border border-surface-border text-ink-muted"
                  >
                    {tag.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Analyse Technique */}
            {reference.context && (
              <div className="px-8 py-7 border-b border-surface-border flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-ink block" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-ink">
                    Analyse Technique
                  </span>
                </div>
                <p className="text-[12px] text-ink-muted leading-[1.65] opacity-90">
                  {reference.context}
                </p>
              </div>
            )}

            {/* Specs grid */}
            <div className="grid grid-cols-2 flex-1">
              {specs.map((spec, i) => {
                const isRightCol = i % 2 === 1
                const isLastRow  = i >= specs.length - 2
                return (
                  <div
                    key={spec.label}
                    className={[
                      'flex flex-col gap-1.5 px-6 py-6',
                      !isRightCol ? 'border-r border-surface-border' : '',
                      !isLastRow  ? 'border-b border-surface-border' : '',
                    ].join(' ')}
                  >
                    <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                      {spec.label}
                    </span>
                    <span className="text-[14px] font-semibold text-ink capitalize">
                      {spec.value}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Footer actions */}
            <div className="px-8 py-7 flex items-center gap-3 border-t border-surface-border" style={{ background: '#0a0a0a' }}>
              <button
                onClick={() => setSaved(!saved)}
                className={`flex flex-1 items-center justify-center gap-2.5 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] transition-all ${
                  saved
                    ? 'bg-gold text-canvas'
                    : 'bg-ink text-canvas hover:bg-ink/90'
                }`}
              >
                {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                {saved ? 'Sauvegardé' : 'Sauvegarder'}
              </button>
              <a
                href={reference.url}
                target="_blank"
                rel="noreferrer"
                className="w-12 h-12 flex items-center justify-center border border-surface-border text-ink-muted hover:text-ink hover:border-ink-muted transition-all"
              >
                <ExternalLink size={15} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
