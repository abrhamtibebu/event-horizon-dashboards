import { Bell, Menu, PanelRight, Search, Sparkles } from 'lucide-react'
import { ReactNode } from 'react'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import type { User } from '../../types/message'
import { cn } from '@/lib/utils'

interface MessagingHeaderProps {
  user?: User | null
  unreadCount: number
  isSidebarOpen: boolean
  isInspectorOpen: boolean
  onToggleSidebar: () => void
  onToggleInspector: () => void
  onOpenSearch: () => void
  onOpenNotifications: () => void
  onOpenAutomation?: () => void
  newMessageButton?: ReactNode
}

export const MessagingHeader = ({
  user,
  unreadCount,
  isSidebarOpen,
  isInspectorOpen,
  onToggleSidebar,
  onToggleInspector,
  onOpenSearch,
  onOpenNotifications,
  onOpenAutomation,
  newMessageButton,
}: MessagingHeaderProps) => {
  const initials = user?.name
    ? user.name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'ME'

  return (
    <header className="relative z-10 border-b border-border bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-slate-950 text-white shadow-lg">
      <div className="flex items-center justify-between px-4 py-3 lg:px-8">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleSidebar}
            className={cn(
              'text-white/80 hover:text-white hover:bg-white/10 border border-white/20 lg:hidden',
              isSidebarOpen && 'bg-white/10'
            )}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs uppercase tracking-widest text-white/60">Messaging Command Hub</p>
            <h1 className="font-semibold text-lg">
              {user?.name ? `Hello, ${user.name.split(' ')[0]}` : 'Messaging'}
            </h1>
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          {unreadCount > 0 && (
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-white shadow-sm backdrop-blur">
              {unreadCount} unread
            </span>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSearch}
            className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/15"
            title="Search conversations"
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenNotifications}
            className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/15"
            title="Notification settings"
          >
            <Bell className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenAutomation}
            className="hidden rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/15 lg:inline-flex"
            title="Open automations"
          >
            <Sparkles className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleInspector}
            className={cn(
              'rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/15',
              isInspectorOpen && 'bg-white/20'
            )}
            title="Toggle insights panel"
          >
            <PanelRight className="h-5 w-5" />
          </Button>

          {newMessageButton}

          <div className="ml-2 flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 shadow-sm backdrop-blur">
            <Avatar className="h-8 w-8 border border-white/30">
              <AvatarImage src={user?.profile_image} />
              <AvatarFallback className="bg-white/10 text-sm font-medium text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left lg:block">
              <p className="text-xs font-semibold leading-tight">{user?.name || 'Unknown user'}</p>
              <p className="text-[11px] uppercase tracking-widest text-white/60">
                {user?.role || 'member'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

