import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { api } from '../lib/api'

export default function SettingsPage() {
  const user = useAuthStore(s => s.user)
  const setUser = useAuthStore(s => s.setUser)
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [digestOptIn, setDigestOptIn] = useState(user?.digestOptIn ?? true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const isDirty = firstName !== (user?.firstName ?? '') || digestOptIn !== (user?.digestOptIn ?? true)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      const { user: updated } = await api.auth.updateMe({ firstName, digestOptIn })
      setUser(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Impossible de sauvegarder. Réessaie.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-canvas min-h-screen animate-fade-in px-8 py-10 max-w-xl">
      <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-1">Compte</p>
      <h1 className="font-editorial text-4xl text-ink mb-10">Réglages</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-8">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="settings-firstname" className="text-xs text-ink-muted font-mono uppercase tracking-widest">Prénom</label>
          <input
            id="settings-firstname"
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className="bg-surface border border-surface-border px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink max-w-xs"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted font-mono uppercase tracking-widest">Email</span>
          <p className="text-sm text-ink-faint">{user?.email}</p>
        </div>

        <div className="border-t border-surface-border pt-8">
          <p className="font-mono text-[10px] tracking-widest uppercase text-ink-muted mb-4">Digest hebdo</p>
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={digestOptIn}
              onChange={e => setDigestOptIn(e.target.checked)}
              className="mt-0.5 accent-current"
            />
            <span>
              <span className="text-sm text-ink block">Recevoir le digest par email</span>
              <span className="text-xs text-ink-muted">La sélection éditoriale de la semaine, dans ta boîte mail.</span>
            </span>
          </label>
        </div>

        {error && <p className="text-xs text-red-400 font-mono">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="px-4 py-2 text-[11px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 transition-opacity disabled:opacity-40 w-fit"
          >
            {saving ? '…' : 'Sauvegarder'}
          </button>
          {saved && <span className="font-mono text-[10px] text-ink-muted">Sauvegardé ✓</span>}
        </div>
      </form>
    </div>
  )
}
