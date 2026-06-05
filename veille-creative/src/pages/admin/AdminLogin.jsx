import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken } from '../../lib/admin-api'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const r = await fetch('http://localhost:3001/api/v1/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!r.ok) {
        const { error: msg } = await r.json().catch(() => ({}))
        throw new Error(msg || 'Mot de passe incorrect')
      }
      const { token } = await r.json()
      setToken(token)
      navigate('/admin/curation')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center">
      <div className="w-full max-w-sm px-8">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-5 h-5 rounded-sm bg-ink flex items-center justify-center">
            <span className="text-canvas font-black text-[10px] leading-none">°</span>
          </div>
          <span className="font-bold tracking-tight">180Degré</span>
          <span className="font-mono text-[10px] tracking-widest uppercase text-ink-muted border border-surface-border px-2 py-0.5 ml-1">
            Admin
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-ink-muted font-mono uppercase tracking-widest">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              required
              className="bg-surface border border-surface-border px-3 py-2 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-ink"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 font-mono">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 px-4 py-2 text-[11px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {loading ? '…' : 'Connexion'}
          </button>
        </form>
      </div>
    </div>
  )
}
