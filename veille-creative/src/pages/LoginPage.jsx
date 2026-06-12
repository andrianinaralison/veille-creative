import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

function parseApiError(err) {
  try { return JSON.parse(err.message).error } catch { return null }
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const login = useAuthStore(s => s.login)
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login({ email, password })
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (err) {
      setError(parseApiError(err) || 'Email ou mot de passe incorrect')
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
        </div>

        <h1 className="text-lg font-bold mb-1">Connexion</h1>
        <p className="text-xs text-ink-muted mb-8">Retrouve ta veille créative.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="text-xs text-ink-muted font-mono uppercase tracking-widest">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              required
              autoComplete="email"
              className="bg-surface border border-surface-border px-3 py-2 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-ink"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-xs text-ink-muted font-mono uppercase tracking-widest">Mot de passe</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="bg-surface border border-surface-border px-3 py-2 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-ink"
            />
          </div>

          {error && <p className="text-xs text-red-400 font-mono">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 px-4 py-2 text-[11px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {loading ? '…' : 'Connexion'}
          </button>
        </form>

        <p className="text-xs text-ink-muted mt-6">
          Pas encore de compte ?{' '}
          <Link to="/signup" className="text-ink underline hover:opacity-70">Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}
