import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Building2, CalendarDays, Inbox, MoreHorizontal, Banknote, Users, MessageCircle, Settings, type LucideIcon } from 'lucide-react'
import { Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'

const navItems: { icon: LucideIcon; label: string; path: string }[] = [
  { icon: Home, label: 'Today', path: '/dashboard' },
  { icon: Inbox, label: 'Inbox', path: '/dashboard/venue/inbox' },
  { icon: CalendarDays, label: 'Schedule', path: '/dashboard/venue/calendar' },
  { icon: Building2, label: 'Venue', path: '/dashboard/venue' },
]

function isActive(pathname: string, itemPath: string) {
  if (itemPath === '/dashboard') return pathname === '/dashboard'
  if (itemPath === '/dashboard/venue') {
    return pathname === '/dashboard/venue' || pathname.startsWith('/dashboard/venue/profile') || pathname.startsWith('/dashboard/venue/spaces')
  }
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
}

export function VenueBottomNav() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreItems = [
    { icon: Banknote, label: 'Money', path: '/dashboard/venue/revenue' },
    ...(user?.role === 'venue_admin' ? [{ icon: Users, label: 'Team', path: '/dashboard/venue/staff' }] : []),
    { icon: MessageCircle, label: 'Messages', path: '/dashboard/messages' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ]

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
        <Button variant="ghost" className="flex h-full flex-1 flex-col gap-1 rounded-none text-muted-foreground" onClick={() => setMoreOpen(true)}>
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">More</span>
        </Button>
      </div>
      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>More</DialogTitle></DialogHeader>
          <div className="mt-5 grid grid-cols-2 gap-3 pb-5">
            {moreItems.map(({ icon: Icon, label, path }) => (
              <NavLink key={path} to={path} onClick={() => setMoreOpen(false)} className="flex items-center gap-3 rounded-xl border border-border p-4 font-medium">
                <Icon className="h-5 w-5 text-primary" />{label}
              </NavLink>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  )
}
