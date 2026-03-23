import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Activity, CalendarDays, BarChart3, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',          icon: Home         },
  { to: '/activity',  icon: Activity     },
  { to: '/schedule',  icon: CalendarDays },
  { to: '/analytics', icon: BarChart3    },
  { to: '/settings',  icon: Settings     },
]

export function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))', paddingLeft: 20, paddingRight: 20 }}
    >
      <nav
        className="pointer-events-auto w-full"
        style={{
          maxWidth: 420,
          background: 'rgba(var(--nav-bg), 0.6)',
          backdropFilter: 'blur(48px) saturate(220%) brightness(1.08)',
          WebkitBackdropFilter: 'blur(48px) saturate(220%) brightness(1.08)',
          border: '0.5px solid rgba(var(--nav-border), 0.22)',
          borderRadius: 32,
          boxShadow: '0 8px 40px rgba(0,0,0,0.22), inset 0 0.5px 0 rgba(255,255,255,0.15), inset 0 -0.5px 0 rgba(0,0,0,0.08)',
        }}
      >
        <div className="flex items-center justify-around px-2" style={{ height: 58 }}>
          {NAV_ITEMS.map(({ to, icon: Icon }) => {
            const isActive = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to)

            return (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="flex items-center justify-center flex-1 h-full transition-all active:scale-[0.82]"
              >
                <Icon
                  size={26}
                  strokeWidth={isActive ? 2.2 : 1.5}
                  style={{
                    color: isActive ? '#007AFF' : 'var(--color-muted)',
                    filter: isActive ? 'drop-shadow(0 0 6px rgba(0,122,255,0.5))' : 'none',
                    transition: 'all 0.2s',
                  }}
                />
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
