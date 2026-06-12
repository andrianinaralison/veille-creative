import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

function parseApiError(err) {
  try {
    const parsed = JSON.parse(err.message)
    return parsed.details?.[0]?.message ?? parsed.error
  } catch { return null }
}

export default function SignupPage() {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const signup = useAuthStore(s => s.signup)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signup({ email, password, firstName })
      navigate('/', { replace: true })
    } catch (err) {
      setError(parseApiError(err) || 'Impossible de créer le compte')
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

        <h1 className="text-lg font-bold mb-1">Créer un compte</h1>
        <p className="text-xs text-ink-muted mb-8">Ta veille créative quotidienne, sans le scroll.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="signup-firstname" className="text-xs text-ink-muted font-mono uppercase tracking-widest">Prénom</label>
            <input
              id="signup-firstname"
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              autoFocus
              autoComplete="given-name"
              className="bg-surface border border-surface-border px-3 py-2 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-ink"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="signup-email" className="text-xs text-ink-muted font-mono uppercase tracking-widest">Email</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="bg-surface border border-surface-border px-3 py-2 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-ink"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="signup-password" className="text-xs text-ink-muted font-mono uppercase tracking-widest">Mot de passe</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="bg-surface border border-surface-border px-3 py-2 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-ink"
            />
            <p className="text-[10px] text-ink-faint font-mono">8 caractères minimum</p>
          </div>

          {error && <p className="text-xs text-red-400 font-mono">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 px-4 py-2 text-[11px] font-mono tracking-widest uppercase bg-ink text-canvas hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {loading ? '…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-xs text-ink-muted mt-6">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-ink underline hover:opacity-70">Connexion</Link>
        </p>
      </div>
    </div>
  )
}
