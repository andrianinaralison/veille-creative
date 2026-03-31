import { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { Settings } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Bibliothèque', end: true },
  { to: '/digest', label: 'Digest', dot: true },
  { to: '/projects', label: 'Projets' },
  { to: '/surprises', label: 'Découvertes' },
]

const USER_NAME = 'Andri'

export default function Layout({ children }) {
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const mainRef = useRef(null)


  // Reset scroll position on route change
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    el.scrollTop = 0
    setScrolled(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* ── Top nav ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-canvas/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="relative flex items-center h-14 px-8">

          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-5 h-5 rounded-sm bg-gold flex items-center justify-center">
              <span className="text-canvas font-black text-[9px] leading-none tracking-tight">°</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-ink">180Degre</span>
          </Link>

          {/* Center: Nav — absolute so it's truly centered */}
          <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
            {navItems.map(({ to, label, dot, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `relative px-3 py-1 text-[13px] transition-colors rounded ${
                    isActive
                      ? 'text-ink font-medium'
                      : 'text-ink-muted hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {label}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-px bg-ink" />
                    )}
                    {dot && !isActive && (
                      <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-gold" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right: Hey + Prénom → settings */}
          <div className="ml-auto flex items-center gap-3">
            <Link
              to="/settings"
              className="flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink transition-colors group"
            >
              Hey&nbsp;<span className="font-bold text-ink">{USER_NAME}</span>
              <Settings size={13} className="opacity-0 group-hover:opacity-60 transition-opacity" />
            </Link>
          </div>

        </div>

      </header>

      {/* ── Content ── */}
      <main
        ref={mainRef}
        className="flex-1 pt-14 overflow-y-auto h-screen"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 2)}
      >
        {children}
      </main>
    </div>
  )
}
