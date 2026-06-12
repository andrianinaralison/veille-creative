import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import ReferenceModal from '../components/ReferenceModal'

function weekLabel(weekOf) {
  const d = new Date(weekOf)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function DigestItem({ item, index, onOpen }) {
  const ref = item.reference
  return (
    <article className="grid md:grid-cols-2 gap-6 items-center">
      <button
        type="button"
        onClick={() => onOpen(ref)}
        className={`group relative overflow-hidden aspect-video bg-surface ${index % 2 === 1 ? 'md:order-2' : ''}`}
      >
        <img
          src={ref.thumbnailUrl}
          alt={ref.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
      <div className={index % 2 === 1 ? 'md:order-1 md:text-right' : ''}>
        <p className="font-mono text-[10px] tracking-widest uppercase text-ink-faint mb-2">
          {String(index + 1).padStart(2, '0')} · {ref.channelName}
        </p>
        <h3 className="font-editorial text-2xl text-ink leading-snug mb-3">{ref.title}</h3>
        {item.note && (
          <p className="text-sm text-ink-muted leading-relaxed mb-3 italic">« {item.note} »</p>
        )}
        {!item.note && ref.context && (
          <p className="text-sm text-ink-muted leading-relaxed mb-3">{ref.context}</p>
        )}
        <div className={`flex flex-wrap gap-1.5 ${index % 2 === 1 ? 'md:justify-end' : ''}`}>
          {(ref.taxonomy ?? []).slice(0, 4).map(t => (
            <span key={t} className="font-mono text-[9px] tracking-widest uppercase text-ink-muted border border-surface-border px-1.5 py-0.5">
              {t}
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}

export default function DigestPage() {
  const { id } = useParams()
  const [digest, setDigest] = useState(null)
  const [archives, setArchives] = useState([])
  const [loading, setLoading] = useState(true)
  const [empty, setEmpty] = useState(false)
  const [selectedRef, setSelectedRef] = useState(null)

  useEffect(() => {
    setLoading(true); setEmpty(false); setDigest(null)
    const endpoint = id ? `/api/v1/digests/${id}` : '/api/v1/digests/latest'
    Promise.all([
      apiFetch(endpoint).catch(err => {
        if (err.message.includes('404') || err.message.includes('Aucun')) return null
        throw err
      }),
      apiFetch('/api/v1/digests').then(d => d.digests ?? []).catch(() => []),
    ])
      .then(([d, list]) => {
        if (!d) setEmpty(true)
        else setDigest(d)
        setArchives(list)
      })
      .catch(() => setEmpty(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="bg-canvas min-h-screen flex items-center justify-center">
        <span className="font-mono text-[10px] tracking-widest uppercase text-ink-faint">Chargement…</span>
      </div>
    )
  }

  if (empty || !digest) {
    return (
      <div className="bg-canvas min-h-screen flex flex-col items-center justify-center px-8">
        <p className="font-editorial text-2xl text-ink-muted mb-2">Pas encore de digest.</p>
        <p className="text-xs text-ink-faint mb-6">La première sélection hebdo arrive bientôt.</p>
        <Link to="/" className="font-mono text-[10px] tracking-widest uppercase text-ink underline hover:opacity-70">
          ← Retour à la veille
        </Link>
      </div>
    )
  }

  const hero = digest.items[0]?.reference
  const otherArchives = archives.filter(a => a.id !== digest.id)

  return (
    <div className="bg-canvas min-h-screen animate-fade-in">

      {/* ── Hero ── */}
      <div className="px-8 pt-14 pb-10 text-center border-b border-surface-border relative overflow-hidden">
        {hero && (
          <>
            <img src={hero.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.12] blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-canvas" />
          </>
        )}
        <div className="relative">
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-muted mb-4">
            Digest · semaine du {weekLabel(digest.weekOf)}
          </p>
          <h1 className="font-editorial text-5xl md:text-6xl text-ink leading-[0.95] max-w-3xl mx-auto mb-6">
            {digest.title}
          </h1>
          {digest.intro && (
            <p className="max-w-xl mx-auto text-sm text-ink-muted leading-relaxed">
              {digest.intro}
            </p>
          )}
        </div>
      </div>

      {/* ── Sélection ── */}
      <div className="px-8 py-12 max-w-5xl mx-auto flex flex-col gap-14">
        {digest.items.map((item, idx) => (
          <DigestItem key={item.id} item={item} index={idx} onOpen={setSelectedRef} />
        ))}
      </div>

      {/* ── Archives ── */}
      {otherArchives.length > 0 && (
        <div className="px-8 py-10 border-t border-surface-border max-w-5xl mx-auto">
          <h2 className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-4">Éditions précédentes</h2>
          <div className="flex flex-col gap-2">
            {otherArchives.map(a => (
              <Link
                key={a.id}
                to={`/digest/${a.id}`}
                className="flex items-baseline justify-between border-b border-surface-border pb-2 group"
              >
                <span className="text-sm text-ink group-hover:opacity-70 transition-opacity">{a.title}</span>
                <span className="font-mono text-[10px] text-ink-faint">
                  {weekLabel(a.weekOf)} · {a._count.items} réf.
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {selectedRef && (
        <ReferenceModal reference={selectedRef} onClose={() => setSelectedRef(null)} />
      )}
    </div>
  )
}
