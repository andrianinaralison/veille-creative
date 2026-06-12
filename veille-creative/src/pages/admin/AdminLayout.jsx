import { NavLink, Link, Outlet, Navigate, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAdminStore } from '../../store/useAdminStore'
import { adminFetch, getToken, clearToken } from '../../lib/admin-api'

const adminNav = [
  { to: '/admin/curation', label: 'Curation' },
  { to: '/admin/references', label: 'Références' },
  { to: '/admin/sections', label: 'Sections' },
  { to: '/admin/digest', label: 'Digest' },
]

export default function AdminLayout() {
  const { isDirty, reset } = useAdminStore()
  const [publishState, setPublishState] = useState('idle')
  const [runningSession, setRunningSession] = useState(null)
  const navigate = useNavigate()
  const pollRef = useRef(null)

  if (!getToken()) return <Navigate to="/admin/login" replace />

  useEffect(() => {
    async function checkRunning() {
      try {
        const { sessions } = await adminFetch('/api/v1/ingestion/sessions?status=RUNNING')
        setRunningSession(sessions?.[0] ?? null)
      } catch {}
    }
    checkRunning()
    pollRef.current = setInterval(checkRunning, 30000)
    return () => clearInterval(pollRef.current)
  }, [])

  function handleLogout() {
    clearToken()
    window.location.href = '/admin/login'
  }

  async function handlePublish() {
    if (!isDirty || publishState === 'loading') return
    setPublishState('loading')
    try {
      await adminFetch('/api/v1/admin/publish', { method: 'POST' })
    } catch {}
    // Notifie la LibraryPage (même navigateur, onglet différent ou même onglet)
    try {
      const ch = new BroadcastChannel('cms-publish')
      ch.postMessage('refresh')
      ch.close()
    } catch {}
    reset()
    setPublishState('done')
    setTimeout(() => setPublishState('idle'), 2000)
  }

  const btnLabel =
    publishState === 'loading' ? '…' :
    publishState === 'done'    ? 'Published ✓' :
    isDirty                    ? 'Set Live' :
                                 'Make a change'

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">

      {/* ── Topbar admin ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-canvas border-b border-surface-border">
        <div className="flex items-center h-12 px-8 gap-8">

          {/* Logo + badge admin */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 text-ink-muted hover:text-ink transition-colors">
            <div className="w-4 h-4 rounded-sm bg-ink flex items-center justify-center overflow-hidden">
              <span className="text-canvas font-black text-[8px] leading-none">°</span>
            </div>
            <span className="text-xs font-bold tracking-tight">180Degré</span>
          </Link>

          <span className="text-ink-faint text-xs select-none">/</span>

          <span className="font-mono text-[10px] tracking-widest uppercase text-ink-muted border border-surface-border px-2 py-0.5">
            Admin
          </span>

          {/* Nav links */}
          <nav className="flex items-center gap-1 ml-4">
            {adminNav.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-1 text-[13px] transition-colors relative flex items-center gap-1.5 ${
                    isActive ? 'text-ink font-medium' : 'text-ink-muted hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {label}
                    {to === '/admin/curation' && runningSession && (
                      <button
                        type="button"
                        title="Scan en cours — cliquer pour reprendre le monitoring"
                        onClick={e => { e.preventDefault(); navigate('/admin/curation') }}
                        className="relative flex h-2 w-2 flex-shrink-0"
                      >
                        <span className="animate-ping absolute inline-flex h-full w-full bg-ink opacity-50" />
                        <span className="relative inline-flex h-2 w-2 bg-ink" />
                      </button>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-px bg-ink" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Retour front + bouton Publish */}
          <div className="ml-auto flex items-center gap-4">
            <button
              onClick={handlePublish}
              disabled={!isDirty || publishState === 'loading'}
              aria-label="Publier les modifications"
              className={`px-4 py-1.5 text-[11px] font-mono tracking-widest uppercase border transition-all ${
                isDirty && publishState === 'idle'
                  ? 'border-ink bg-ink text-canvas hover:opacity-80 cursor-pointer'
                  : publishState === 'done'
                  ? 'border-surface-border text-ink-muted bg-surface'
                  : 'border-surface-border text-ink-faint cursor-default'
              }`}
            >
              {btnLabel}
            </button>

            <Link
              to="/library"
              className="text-[12px] font-mono tracking-widest uppercase text-ink-muted hover:text-ink transition-colors"
            >
              ← Plateforme
            </Link>

            <button
              onClick={handleLogout}
              className="text-[12px] font-mono tracking-widest uppercase text-ink-faint hover:text-ink transition-colors"
            >
              Logout
            </button>
          </div>

        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 pt-12 overflow-y-auto h-screen">
        <Outlet />
      </main>

    </div>
  )
}
