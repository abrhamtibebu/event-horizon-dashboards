import { NavLink, useLocation } from 'react-router-dom'
import { Home, QrCode, Users, MessageSquare, User, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems: { icon: LucideIcon; label: string; path: string }[] = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: QrCode, label: 'Scan', path: '/dashboard/usher/redemption' },
  { icon: Users, label: 'Guests', path: '/dashboard/usher/events' },
  { icon: MessageSquare, label: 'Chat', path: '/dashboard/messages' },
  { icon: User, label: 'Profile', path: '/dashboard/profile' },
]

export function isUsherNavItemActive(pathname: string, itemPath: string): boolean {
  if (itemPath === '/dashboard') {
    return (
      pathname === '/dashboard' ||
      pathname === '/dashboard/usher/jobs' ||
      pathname.startsWith('/dashboard/usher/jobs/')
    )
  }
  if (itemPath === '/dashboard/usher/events') {
    return pathname.startsWith('/dashboard/usher/events')
  }
  if (itemPath === '/dashboard/usher/redemption') {
    return (
      pathname === '/dashboard/usher/redemption' ||
      pathname === '/dashboard/ticket-validator'
    )
  }
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
}

export function UsherBottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0b1630] border-t border-white/5 px-2 pb-safe-area h-16">
      <div className="flex justify-around items-center max-w-md mx-auto h-full">
        {navItems.map((item) => {
          const active = isUsherNavItemActive(pathname, item.path)
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 transition-colors duration-200 gap-1 relative',
                active ? 'text-primary' : 'text-gray-500 hover:text-gray-300',
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  active ? 'bg-primary/5' : '',
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-bold tracking-wider uppercase">{item.label}</span>
              {active && (
                <span className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
