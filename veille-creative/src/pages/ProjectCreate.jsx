import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '../lib/api'

export default function ProjectCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', client: '', brief: '', deadline: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || saving) return
    setSaving(true); setError(null)
    try {
      const project = await api.projects.create({
        title: form.title.trim(),
        client: form.client.trim(),
        brief: form.brief,
        deadline: form.deadline || null,
      })
      navigate(`/projects/${project.id}`)
    } catch {
      setError('Impossible de créer le projet. Réessaie.')
      setSaving(false)
    }
  }

  return (
    <div className="bg-canvas min-h-screen animate-fade-in">
      <div className="max-w-lg mx-auto px-8 py-12">
        <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-10 transition-colors">
          <ArrowLeft size={14} /> Projets
        </Link>

        <h1 className="font-editorial text-3xl text-ink mb-1">Nouveau projet</h1>
        <p className="text-ink-muted text-sm mb-8">Le brief client, puis tu composes le treatment.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="proj-title" className="block text-xs font-medium text-ink-muted mb-1.5">Titre du projet *</label>
            <input
              id="proj-title"
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="Film corporate — Startup Lyon"
              autoFocus
              required
              className="w-full bg-surface border border-surface-border px-3 py-2.5 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-ink"
            />
          </div>

          <div>
            <label htmlFor="proj-client" className="block text-xs font-medium text-ink-muted mb-1.5">Client</label>
            <input
              id="proj-client"
              type="text"
              value={form.client}
              onChange={set('client')}
              placeholder="TechSpark SAS"
              className="w-full bg-surface border border-surface-border px-3 py-2.5 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-ink"
            />
          </div>

          <div>
            <label htmlFor="proj-brief" className="block text-xs font-medium text-ink-muted mb-1.5">Brief reçu</label>
            <textarea
              id="proj-brief"
              value={form.brief}
              onChange={set('brief')}
              rows={5}
              placeholder="Ce que le client a demandé : ton, durée, diffusion, contraintes…"
              className="w-full bg-surface border border-surface-border px-3 py-2.5 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-ink resize-y"
            />
          </div>

          <div>
            <label htmlFor="proj-deadline" className="block text-xs font-medium text-ink-muted mb-1.5">Deadline</label>
            <input
              id="proj-deadline"
              type="date"
              value={form.deadline}
              onChange={set('deadline')}
              className="bg-surface border border-surface-border px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ink"
            />
          </div>

          {error && <p className="text-xs text-red-400 font-mono">{error}</p>}

          <button
            type="submit"
            disabled={saving || !form.title.trim()}
            className="px-5 py-2.5 text-[11px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {saving ? '…' : 'Créer et composer le treatment'}
          </button>
        </form>
      </div>
    </div>
  )
}
