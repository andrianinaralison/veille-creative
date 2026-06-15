import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { BASE } from '../lib/api'

// Vue client final : publique (pas de compte), lisible, imprimable en PDF.
// À l'écran : dark cinema. À l'impression : fond blanc, encre noire.
const PRINT_STYLES = `
@media print {
  body { background: #fff !important; }
  .treatment-screen { background: #fff !important; color: #111 !important; }
  .treatment-screen h1, .treatment-screen h2, .treatment-screen h3,
  .treatment-screen p, .treatment-screen span, .treatment-screen a { color: #111 !important; }
  .treatment-screen .print-muted { color: #555 !important; }
  .treatment-screen .print-border { border-color: #ddd !important; }
  .no-print { display: none !important; }
  .treatment-item { break-inside: avoid; }
}
`

function weekday(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function TreatmentSharePage() {
  const { token } = useParams()
  const [treatment, setTreatment] = useState(null)
  const [state, setState] = useState('loading') // loading | ok | notfound

  useEffect(() => {
    fetch(`${BASE}/api/v1/shared/${token}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(t => { setTreatment(t); setState('ok') })
      .catch(() => setState('notfound'))
  }, [token])

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <span className="font-mono text-[10px] tracking-widest uppercase text-ink-faint">Chargement…</span>
      </div>
    )
  }

  if (state === 'notfound') {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-8 text-center">
        <p className="font-editorial text-2xl text-ink-muted mb-2">Ce treatment n'est plus disponible.</p>
        <p className="text-xs text-ink-faint">Le lien a peut-être été révoqué par son auteur.</p>
      </div>
    )
  }

  return (
    <div className="treatment-screen min-h-screen bg-canvas text-ink">
      <style>{PRINT_STYLES}</style>

      {/* ── Barre d'actions (écran uniquement) ── */}
      <div className="no-print sticky top-0 bg-canvas/90 backdrop-blur border-b border-surface-border print-border px-8 py-3 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-sm bg-ink flex items-center justify-center">
            <span className="text-canvas font-black text-[8px] leading-none">°</span>
          </span>
          <span className="text-xs font-bold tracking-tight">180Degré</span>
          <span className="font-mono text-[9px] tracking-widest uppercase text-ink-muted border border-surface-border px-1.5 py-0.5 ml-1">Treatment</span>
        </span>
        <button
          onClick={() => window.print()}
          className="px-4 py-1.5 text-[10px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 transition-opacity"
        >
          Télécharger en PDF
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-12">

        {/* ── En-tête ── */}
        <header className="mb-12 border-b border-surface-border print-border pb-10">
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-muted print-muted mb-4">
            Proposition créative{treatment.client ? ` · ${treatment.client}` : ''}
          </p>
          <h1 className="font-editorial text-5xl leading-[1.02] mb-4">{treatment.title}</h1>
          <p className="font-mono text-[10px] tracking-widest uppercase text-ink-faint print-muted">
            {weekday(treatment.updatedAt)}
            {treatment.deadline && ` · livraison visée ${weekday(treatment.deadline)}`}
          </p>
        </header>

        {/* ── Intention ── */}
        {treatment.intention && (
          <section className="mb-14">
            <h2 className="font-mono text-[10px] tracking-widest uppercase text-ink-muted print-muted mb-4">L'intention</h2>
            <p className="font-editorial text-xl leading-relaxed whitespace-pre-line">{treatment.intention}</p>
          </section>
        )}

        {/* ── Références ── */}
        <section>
          <h2 className="font-mono text-[10px] tracking-widest uppercase text-ink-muted print-muted mb-8">
            Les références — {treatment.items.length}
          </h2>
          <div className="flex flex-col gap-12">
            {treatment.items.map((item, idx) => (
              <article key={item.id} className="treatment-item">
                <a href={item.reference.url} target="_blank" rel="noopener noreferrer" className="block group">
                  <img
                    src={item.reference.thumbnailUrl}
                    alt={item.reference.title}
                    className="w-full aspect-video object-cover mb-4 group-hover:opacity-90 transition-opacity"
                  />
                </a>
                <p className="font-mono text-[10px] tracking-widest uppercase text-ink-faint print-muted mb-1">
                  {String(idx + 1).padStart(2, '0')} · {item.reference.channelName}
                </p>
                <h3 className="font-editorial text-2xl leading-snug mb-2">
                  <a href={item.reference.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
                    {item.reference.title}
                  </a>
                </h3>
                {item.note && (
                  <p className="text-sm text-ink-muted print-muted leading-relaxed italic">« {item.note} »</p>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* ── Signature ── */}
        <footer className="mt-16 pt-8 border-t border-surface-border print-border">
          <p className="text-sm text-ink-muted print-muted">
            Proposé par <span className="text-ink font-medium">{treatment.user.firstName || 'votre vidéaste'}</span>
            <span className="font-mono text-[10px] tracking-widest uppercase text-ink-faint print-muted"> · avec 180Degré</span>
          </p>
        </footer>
      </div>
    </div>
  )
}
