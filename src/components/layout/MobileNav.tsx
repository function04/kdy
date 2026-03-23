import { NavLink } from 'react-router-dom'
import { Home, Activity, CalendarDays, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/',          icon: Home,          label: '홈' },
  { to: '/activity',  icon: Activity,      label: '활동' },
  { to: '/schedule',  icon: CalendarDays,  label: '일정' },
  { to: '/analytics', icon: BarChart3,     label: '분석' },
  { to: '/settings',  icon: Settings,      label: '설정' },
]

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[56px]',
                isActive
                  ? 'text-blue-400'
                  : 'text-muted hover:text-slate-300'
              )
            }
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
