import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Zap, Check } from 'lucide-react'
import { moodPresets } from '../data/mockData'

const steps = ['Brief', 'Ambiance', 'Récap']

export default function ProjectCreate() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ title: '', client: '', brief: '', deadline: '', moodPresets: [] })

  const toggleMood = id => setForm(p => ({
    ...p, moodPresets: p.moodPresets.includes(id) ? p.moodPresets.filter(m => m !== id) : [...p.moodPresets, id].slice(0, 4)
  }))

  const canNext = () => step === 0 ? form.title.trim() && form.brief.trim() : step === 1 ? form.moodPresets.length > 0 : true

  return (
    <div className="bg-canvas min-h-screen flex animate-fade-in">
      {/* Left panel — form */}
      <div className="flex-1 flex items-start justify-center px-16 py-12">
        <div className="w-full max-w-lg">
          <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-10 transition-colors">
            <ArrowLeft size={14} /> Projets
          </Link>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-10">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all ${i < step ? 'bg-gold text-canvas' : i === step ? 'border-2 border-gold text-gold' : 'border border-surface-border text-ink-faint'}`}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className={`text-sm ${i === step ? 'text-ink font-medium' : 'text-ink-muted'}`}>{s}</span>
                {i < steps.length - 1 && <div className="w-6 h-px bg-surface-border" />}
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-5 animate-slide-up">
              <div>
                <h1 className="font-editorial text-3xl text-ink mb-1">Nouveau projet</h1>
                <p className="text-ink-muted text-sm">Brief client en moins de 2 minutes.</p>
              </div>
              {[
                { key: 'title', label: 'Titre du projet', placeholder: 'Film corporate — Startup Lyon', required: true },
                { key: 'client', label: 'Client', placeholder: 'TechSpark SAS' },
              ].map(({ key, label, placeholder, required }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-ink-muted mb-1.5">{label}{required && ' *'}</label>
                  <input type="text" placeholder={placeholder} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-gold/50 transition-colors" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">Brief client *</label>
                <textarea placeholder="Objectif, ton, diffusion, contraintes..." value={form.brief} onChange={e => setForm(p => ({ ...p, brief: e.target.value }))} rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-gold/50 transition-colors resize-none" />
                <p className="mt-1 text-[11px] text-ink-faint">L'IA va analyser ce texte pour générer des références adaptées.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">Deadline</label>
                <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-sm text-ink-muted focus:outline-none focus:border-gold/50 transition-colors" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-slide-up">
              <div className="mb-8">
                <h2 className="font-editorial text-3xl text-ink mb-1">Ambiance</h2>
                <p className="text-ink-muted text-sm">Jusqu'à 4 presets — alignent vos suggestions IA avec le vocabulaire client.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {moodPresets.map(preset => (
                  <button key={preset.id} onClick={() => toggleMood(preset.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.moodPresets.includes(preset.id) ? 'border-gold bg-gold/10 text-gold' : 'border-surface-border text-ink-muted hover:border-gold/30 hover:text-ink'}`}>
                    {form.moodPresets.includes(preset.id) && <Check size={12} />}
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-slide-up">
              <div className="mb-8">
                <h2 className="font-editorial text-3xl text-ink mb-1">Récapitulatif</h2>
                <p className="text-ink-muted text-sm">L'IA va générer 5 références pré-filtrées.</p>
              </div>
              <div className="space-y-4">
                {[['Titre', form.title], ['Client', form.client || '—'], ['Brief', form.brief]].map(([label, val]) => (
                  <div key={label} className="p-4 rounded-xl bg-surface border border-surface-border">
                    <div className="text-[11px] text-ink-muted mb-1 uppercase tracking-wider">{label}</div>
                    <div className="text-sm text-ink">{val}</div>
                  </div>
                ))}
                {form.moodPresets.length > 0 && (
                  <div className="p-4 rounded-xl bg-surface border border-surface-border">
                    <div className="text-[11px] text-ink-muted mb-2 uppercase tracking-wider">Ambiances</div>
                    <div className="flex gap-2 flex-wrap">
                      {form.moodPresets.map(id => {
                        const p = moodPresets.find(x => x.id === id)
                        return <span key={id} className="text-xs px-3 py-1 rounded-full border border-gold/30 bg-gold/10 text-gold">{p?.label}</span>
                      })}
                    </div>
                  </div>
                )}
                <div className="p-4 rounded-xl border border-gold/20 bg-gold/5 flex items-start gap-3">
                  <Zap size={14} className="text-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-gold mb-0.5">Exploration IA prête</div>
                    <p className="text-[11px] text-ink-muted">5 références filtrées par intention créative. Génération en &lt;8s.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-10">
            <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/projects')} className="px-4 py-2.5 rounded-xl border border-surface-border text-sm text-ink-muted hover:text-ink hover:border-ink-faint transition-all">
              {step === 0 ? 'Annuler' : 'Retour'}
            </button>
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)} disabled={!canNext()} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-30 text-canvas text-sm font-semibold transition-all">
                Continuer <ChevronRight size={15} />
              </button>
            ) : (
              <button onClick={() => navigate('/projects/proj-new')} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-canvas text-sm font-semibold transition-all">
                <Zap size={14} /> Créer et explorer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right panel — visual preview */}
      <div className="w-96 flex-shrink-0 relative hidden xl:block">
        <img src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/60 to-transparent" />
      </div>
    </div>
  )
}
