import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const HomeIcon  = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
)
const PlusIcon  = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>
  </svg>
)
const ListIcon  = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24">
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
  </svg>
)
const ChartIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24">
    <path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-6"/>
  </svg>
)
const UsersIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
)
const BackIcon  = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
)

const ATHLETE_NAV = [
  { to: '/',         label: 'Home',     Icon: HomeIcon,  end: true },
  { to: '/log',      label: 'Log',      Icon: PlusIcon  },
  { to: '/history',  label: 'History',  Icon: ListIcon  },
  { to: '/progress', label: 'Progress', Icon: ChartIcon },
]
const COACH_NAV = [
  { to: '/coach',              label: 'Dashboard', Icon: HomeIcon,  end: true },
  { to: '/coach/routines/new', label: 'Routine',   Icon: PlusIcon  },
  { to: '/athletes',           label: 'Athletes',  Icon: UsersIcon },
]

export default function AppLayout({ children, title, back = false }) {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const nav              = user?.role === 'coach' ? COACH_NAV : ATHLETE_NAV

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 h-14 pt-safe flex-shrink-0
                         bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          {back && (
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-xl
                         text-gray-400 hover:text-white hover:bg-white/5
                         transition-all duration-150 -ml-1 mr-1"
            >
              <BackIcon />
            </button>
          )}
          <span className="font-bold text-white tracking-tight">{title || 'GymApp'}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] bg-white/5 border border-white/10 text-gray-500
                           px-2.5 py-1 rounded-full capitalize tracking-wide">
            {user?.role}
          </span>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="text-xs text-gray-600 hover:text-gray-300 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto px-4 pt-5 pb-28 page-enter">
        {children}
      </main>

      {/* ── Bottom nav ── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-20
                      bg-[#0d0d0d]/90 backdrop-blur-md border-t border-white/[0.06] pb-safe">
        <div className="flex">
          {nav.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium
                 transition-all duration-150 relative
                 ${isActive ? 'text-brand-400' : 'text-gray-600 hover:text-gray-400'}`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5
                                     bg-brand-500 rounded-full" />
                  )}
                  <Icon />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

    </div>
  )
}