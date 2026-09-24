import { NavLink, useLocation } from 'react-router-dom'
import { CalendarDays, Inbox, LayoutGrid, type LucideIcon } from 'lucide-react'
import { Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems: { icon: LucideIcon; label: string; path: string }[] = [
  { icon: Home, label: 'Today', path: '/dashboard' },
  { icon: Inbox, label: 'Inbox', path: '/dashboard/venue/inbox' },
  { icon: CalendarDays, label: 'Calendar', path: '/dashboard/venue/calendar' },
  { icon: LayoutGrid, label: 'Spaces', path: '/dashboard/venue/spaces' },
]

function isActive(pathname: string, itemPath: string) {
  if (itemPath === '/dashboard') return pathname === '/dashboard'
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
}

export function VenueBottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border bg-background px-2 md:hidden">
      <div className="mx-auto flex h-full max-w-md items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(pathname, item.path)
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <div className={cn('rounded-lg p-1.5', active && 'bg-primary/10')}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
