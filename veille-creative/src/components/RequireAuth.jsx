import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export default function RequireAuth({ children }) {
  const { status, hydrate } = useAuthStore()
  const location = useLocation()

  useEffect(() => { if (status === 'idle') hydrate() }, [status, hydrate])

  if (status === 'idle') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <span className="font-mono text-[10px] tracking-widest uppercase text-ink-faint">Chargement…</span>
      </div>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}
