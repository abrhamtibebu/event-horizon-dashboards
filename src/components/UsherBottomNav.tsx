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
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0b1630]/90 backdrop-blur-2xl border-t border-white/10 px-2 pt-2 pb-safe-area shadow-[0_-8px_30px_rgb(0,0,0,0.4)]">
      <div className="flex justify-around items-center max-w-md mx-auto h-16">
        {navItems.map((item) => {
          const active = isUsherNavItemActive(pathname, item.path)
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 transition-all duration-300 gap-1 relative',
                active ? 'text-primary scale-110' : 'text-gray-500 hover:text-gray-300',
              )}
            >
              <div
                className={cn(
                  'p-2 rounded-xl transition-all duration-300',
                  active ? 'bg-primary/10' : '',
                )}
              >
                <Icon
                  className={cn(
                    'w-6 h-6',
                    active ? 'drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]' : '',
                  )}
                />
              </div>
              <span className="text-[10px] font-medium tracking-wide uppercase">{item.label}</span>
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
