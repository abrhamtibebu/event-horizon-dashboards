import { useLocation, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  CalendarDays,
  Users2,
  Store,
  BarChart3,
  MessageCircleMore,
  ShieldCheck,
  MapPin,
  ClipboardCheck,
  Ticket,
  UserCheck,
  Archive,
  UserPlus2,
  Briefcase,
  Send,
  ChevronRight,
  ChevronLeft,
  PanelLeft,
  LogOut,
  Settings,
  UserCircle,
  MessageCircle,
  LayoutDashboard,
  Fingerprint,
  CheckSquare,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useUnreadCount } from '@/hooks/use-messages'
import { useOrganizerPermissions } from '@/hooks/use-organizer-permissions'
import { usePermissionCheck } from '@/hooks/use-permission-check'
import api from '@/lib/api'

// Helper function to get user initials
const getInitials = (name?: string) => {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Organized navigation items by category
const navigationCategories = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
        roles: ['superadmin', 'admin', 'organizer', 'organizer_admin', 'usher', 'event_manager', 'marketing_specialist', 'finance_manager', 'procurement_manager', 'operations_manager', 'purchase_requester', 'purchase_approver', 'proforma_manager', 'proforma_approver', 'purchase_order_issuer', 'payment_requester', 'payment_approver'],
        permission: 'dashboard.view',
      },
    ],
  },
  {
    label: 'Events & Tickets',
    items: [
      {
        title: 'Events',
        url: '/dashboard/events',
        icon: CalendarDays,
        roles: ['superadmin', 'admin', 'organizer', 'organizer_admin', 'event_manager'],
        permission: 'events.view',
      },
      {
        title: 'Create Event',
        url: '/dashboard/events/create',
        icon: ClipboardCheck,
        roles: ['superadmin', 'organizer', 'organizer_admin', 'event_manager'],
        permission: 'events.create',
      },
      {
        title: 'Ticket Sales',
        url: '/dashboard/ticket-management',
        icon: Ticket,
        roles: ['organizer', 'organizer_admin', 'admin', 'superadmin'],
        permission: 'tickets.manage',
      },
      {
        title: 'My Tickets',
        url: '/dashboard/tickets',
        icon: Ticket,
        roles: ['attendee'],
      },
    ],
  },
  {
    label: 'Management',
    items: [
      {
        title: 'Tasks',
        url: '/dashboard/tasks',
        icon: CheckSquare,
        roles: ['superadmin', 'admin', 'organizer', 'organizer_admin', 'usher', 'event_manager', 'marketing_specialist', 'finance_manager', 'procurement_manager', 'operations_manager', 'purchase_requester', 'purchase_approver', 'proforma_manager', 'proforma_approver', 'purchase_order_issuer', 'payment_requester', 'payment_approver', 'attendee', 'sales'],
        accessibleToAll: true,
        permission: 'tasks.view',
      },
      {
        title: 'Users',
        url: '/dashboard/users',
        icon: Users2,
        roles: ['superadmin', 'admin'],
      },
      {
        title: 'Organizers',
        url: '/dashboard/organizers',
        icon: Store,
        roles: ['superadmin', 'admin'],
      },
      {
        title: 'Guests',
        url: '/dashboard/guests',
        icon: Users2,
        roles: ['organizer', 'organizer_admin'],
        permission: 'guests.manage',
      },
      {
        title: 'Ushers',
        url: '/dashboard/usher-management',
        icon: UserPlus2,
        roles: ['superadmin', 'admin', 'organizer', 'organizer_admin', 'user'],
        permission: 'ushers.manage',
      },
      {
        title: 'Vendors',
        url: '/dashboard/vendor-management',
        icon: Briefcase,
        roles: ['superadmin', 'admin', 'organizer', 'organizer_admin', 'finance_manager', 'procurement_manager', 'operations_manager', 'purchase_requester', 'purchase_approver', 'proforma_manager', 'proforma_approver', 'purchase_order_issuer', 'payment_requester', 'payment_approver'],
        permission: 'vendors.any',
      },
      {
        title: 'Sales Team',
        url: '/dashboard/salesperson-management',
        icon: Users2,
        roles: ['superadmin', 'admin'],
      },
      {
        title: 'Admin Subs',
        url: '/dashboard/admin/subscriptions',
        icon: ShieldCheck,
        roles: ['superadmin', 'admin'],
      },
      {
        title: 'Subscription',
        url: '/dashboard/subscription',
        icon: ShieldCheck,
        roles: ['organizer', 'organizer_admin'],
        permission: 'subscription.view',
      },
      {
        title: 'Team',
        url: '/dashboard/team',
        icon: Users2,
        roles: ['superadmin', 'organizer', 'organizer_admin'],
        permission: 'team.manage',
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        title: 'Check-in',
        url: '/dashboard/check-in',
        icon: UserCheck,
        roles: ['usher'],
      },
      {
        title: 'Validator',
        url: '/dashboard/ticket-validator',
        icon: UserCheck,
        roles: ['usher', 'organizer', 'organizer_admin', 'admin', 'superadmin'],
        permission: 'tickets.validate',
      },
      {
        title: 'Locate Badges',
        url: '/dashboard/locate-badges',
        icon: MapPin,
        roles: ['admin', 'organizer', 'organizer_admin', 'usher'],
        permission: 'badges.locate',
      },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        title: 'Analytics',
        url: '/dashboard/reports',
        icon: BarChart3,
        roles: ['superadmin', 'organizer', 'organizer_admin'],
        permission: 'reports.view',
      },
    ],
  },
  {
    label: 'Connect',
    items: [
      {
        title: 'Messages',
        url: '/dashboard/messages',
        icon: MessageCircleMore,
        roles: ['superadmin', 'admin', 'organizer', 'organizer_admin', 'usher', 'event_manager', 'marketing_specialist', 'finance_manager', 'procurement_manager', 'operations_manager', 'purchase_requester', 'purchase_approver', 'proforma_manager', 'proforma_approver', 'purchase_order_issuer', 'payment_requester', 'payment_approver', 'attendee', 'sales'],
        accessibleToAll: true,
        permission: 'messages.manage',
      },
      {
        title: 'Marketing',
        url: '/dashboard/marketing',
        icon: Send,
        roles: ['superadmin', 'admin', 'organizer', 'organizer_admin', 'marketing_specialist'],
        permission: 'marketing.manage',
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        title: 'Audit Logs',
        url: '/dashboard/audit-logs',
        icon: Fingerprint,
        roles: ['superadmin', 'admin'],
      },
      {
        title: 'Trash',
        url: '/dashboard/trash',
        icon: Archive,
        roles: ['superadmin', 'admin'],
      },
    ],
  },
]

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar()
  const { user, logout } = useAuth()
  const { hasPermission, isOrganizerAdmin } = useOrganizerPermissions()
  const { hasRole } = usePermissionCheck()
  const isCollapsed = state === 'collapsed'
  const [trashCount, setTrashCount] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()

  // Get unread message count
  const { data: unreadData } = useUnreadCount()
  const unreadCount = unreadData?.unread_count || 0

  // Simplified navigation for organizers
  const isOrganizer = user?.role === 'organizer' || user?.role === 'organizer_admin'

  // Filter categories and items based on user role and permissions
  const filteredCategories = navigationCategories
    .map((category) => ({
      ...category,
      // Simplify category labels for organizers
      label: isOrganizer && category.label === 'Management' ? 'Manage' :
        isOrganizer && category.label === 'Operations' ? 'Tools' :
          isOrganizer && category.label === 'Connect' ? 'Communicate' :
            category.label,
      items: category.items.filter((item) => {
        if (!user) return false

        // Items accessible to all authenticated users
        if (item.accessibleToAll) {
          return true
        }

        // Guests menu is only for organizers, not for admin/superadmin
        if (item.title === 'Guests' && (user.role === 'admin' || user.role === 'superadmin')) {
          return false
        }

        // System admins see everything (they have all roles)
        if (user.role === 'admin' || user.role === 'superadmin') {
          return true
        }

        // Check role-based access using hasRole which checks both user.role and user.roles array
        if (!hasRole(item.roles)) {
          return false
        }

        // For organizer and organizer_admin users, check permissions
        if ((user.role === 'organizer' || user.role === 'organizer_admin') && item.permission) {
          if (isOrganizerAdmin || user.role === 'organizer_admin') return true

          if (item.permission === 'vendors.any') {
            const vendorPermissions = [
              'vendors.view', 'vendors.manage', 'vendors.create', 'vendors.edit', 'vendors.delete',
              'vendors.discovery', 'vendors.onboard', 'vendors.lookup',
              'vendors.requirements', 'vendors.rfq.create', 'vendors.rfq.send', 'vendors.rfq.invite', 'vendors.rfq.view',
              'vendors.quotations.view', 'vendors.quotations.manage', 'vendors.quotations.approve', 'vendors.quotations.compare',
              'vendors.contracts.view', 'vendors.contracts.create', 'vendors.contracts.edit', 'vendors.contracts.manage',
              'vendors.contracts.milestones', 'vendors.contracts.po',
              'vendors.deliverables.view', 'vendors.deliverables.manage', 'vendors.deliverables.track',
              'vendors.payments.view', 'vendors.payments.manage', 'vendors.payments.process',
              'vendors.reviews.view', 'vendors.reviews.create', 'vendors.reviews.manage',
              'vendors.ratings.view', 'vendors.ratings.create',
            ]
            return vendorPermissions.some(perm => hasPermission(perm))
          }
          return hasPermission(item.permission)
        }

        return true
      }),
    }))
    .filter((category) => {
      // Hide Operations section for admin and superadmin
      if (category.label === 'Operations' && user && (user.role === 'admin' || user.role === 'superadmin')) {
        return false
      }
      return category.items.length > 0
    })

  // Fetch trash count for admin users
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      const fetchTrashCount = async () => {
        try {
          const response = await api.get('/trash')
          setTrashCount(response.data.total_items || 0)
        } catch (error: any) {
          if (error?.response?.status !== 403) {
            console.error('Failed to fetch trash count:', error)
          }
        }
      }
      fetchTrashCount()
    }
  }, [user?.role])

  return (
    <Sidebar
      className={cn(
        "!bg-background border-r border-border/40 z-50",
        "[&>div>div]:!bg-background",
        "transition-all duration-300 ease-in-out",
        "shadow-none"
      )}
      collapsible="icon"
    >
      {/* Header with Logo */}
      <SidebarHeader className={cn(
        "flex items-center transition-all duration-300 border-b border-border/40 bg-background",
        isCollapsed ? 'p-4 justify-center' : 'px-6 py-6'
      )}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4 w-full'}`}>
          <div className={cn(
            "flex items-center justify-center transition-all duration-300",
            isCollapsed ? "w-10 h-10" : "w-12 h-12",
            "bg-transparent"
          )}>
            <img
              src="/evella-logo.png"
              alt="Evella Logo"
              className="w-full h-full object-contain"
            />
          </div>
          {!isCollapsed && (
            <>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xl font-semibold text-foreground" style={{ fontFamily: 'Mosk, sans-serif' }}>
                  Evella
                </span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-0.5" style={{ fontFamily: 'Mosk, sans-serif' }}>
                  {isOrganizer ? 'Organizer' : 'Admin Console'}
                </span>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent className="flex-1 overflow-y-auto px-3 gap-4 pb-4 bg-background">
        {filteredCategories.map((category) => (
          <SidebarGroup key={category.label} className="p-0">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2 mt-4 select-none" style={{ fontFamily: 'Mosk, sans-serif' }}>
                {category.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {category.items.map((item) => {
                  const isActive =
                    location.pathname === item.url ||
                    (item.url !== '/dashboard' &&
                      location.pathname.startsWith(item.url))

                  const showBadge =
                    !isCollapsed &&
                    ((item.title === 'Trash' && trashCount > 0) ||
                      (item.title === 'Messages' && unreadCount > 0))

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          'group relative w-full transition-all duration-200 rounded-lg',
                          isActive
                            ? 'bg-accent/50 text-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                          isCollapsed ? 'justify-center p-2.5 h-10 w-10 mx-auto' : 'px-3 py-2.5 h-10'
                        )}
                      >
                        <NavLink
                          to={item.url}
                          end={item.url === '/dashboard'}
                          className={cn(
                            "flex items-center w-full",
                            isCollapsed ? 'justify-center' : 'justify-between'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={cn(
                              "flex-shrink-0 transition-colors",
                              isActive
                                ? "w-4 h-4 text-foreground"
                                : "w-4 h-4 text-muted-foreground group-hover:text-foreground"
                            )} />
                            {!isCollapsed && (
                              <span className="text-sm font-medium" style={{ fontFamily: 'Mosk, sans-serif' }}>
                                {item.title}
                              </span>
                            )}
                          </div>
                          {isActive && !isCollapsed && (
                            <div className="w-1 h-6 rounded-full bg-primary" />
                          )}
                          {showBadge && (
                            <Badge
                              className={cn(
                                "ml-auto h-5 min-w-5 px-1.5 flex items-center justify-center text-xs font-semibold shadow-none border-0",
                                item.title === 'Trash'
                                  ? "bg-destructive text-destructive-foreground"
                                  : isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                              )}
                              style={{ fontFamily: 'Mosk, sans-serif' }}
                            >
                              {item.title === 'Trash' ? trashCount : unreadCount}
                            </Badge>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className={cn(
        "mt-auto p-3 border-t border-border/40 bg-background",
      )}>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className={cn(
                "flex items-center gap-3 rounded-lg transition-all duration-200 group cursor-pointer",
                !isCollapsed && "bg-muted/30 hover:bg-muted/50 p-2.5",
                isCollapsed && "justify-center p-2"
              )}>
                <div className="relative">
                  <Avatar className="w-8 h-8 ring-2 ring-background shadow-sm transition-transform duration-200 group-hover:scale-105">
                    <AvatarImage src={user.profile_image} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold" style={{ fontFamily: 'Mosk, sans-serif' }}>
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="font-medium text-sm text-foreground truncate" style={{ fontFamily: 'Mosk, sans-serif' }}>
                      {user.name || 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate" style={{ fontFamily: 'Mosk, sans-serif' }}>
                      {user.email || ''}
                    </span>
                  </div>
                )}

                {!isCollapsed && (
                  <div className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                    <Settings className="w-4 h-4" />
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isCollapsed ? "center" : "end"} side={isCollapsed ? "right" : "bottom"} className="w-56 mb-2 rounded-xl">
              <DropdownMenuItem onClick={() => navigate('/dashboard/profile')} className="cursor-pointer">
                <UserCircle className="mr-2 h-4 w-4 text-primary" />
                <span style={{ fontFamily: 'Mosk, sans-serif' }}>My Profile</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                <span style={{ fontFamily: 'Mosk, sans-serif' }}>Settings</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate('/dashboard/messages')} className="cursor-pointer">
                <MessageCircle className="mr-2 h-4 w-4 text-primary" />
                <span style={{ fontFamily: 'Mosk, sans-serif' }}>Messages</span>
                {unreadCount > 0 && (
                  <Badge className="ml-auto bg-primary text-primary-foreground text-xs" style={{ fontFamily: 'Mosk, sans-serif' }}>
                    {unreadCount}
                  </Badge>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate('/dashboard/events')} className="cursor-pointer">
                <CalendarDays className="mr-2 h-4 w-4 text-primary" />
                <span style={{ fontFamily: 'Mosk, sans-serif' }}>My Events</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate('/dashboard/reports')} className="cursor-pointer">
                <BarChart3 className="mr-2 h-4 w-4 text-primary" />
                <span style={{ fontFamily: 'Mosk, sans-serif' }}>Reports</span>
              </DropdownMenuItem>

              {user?.role === 'organizer' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard/subscription')} className="cursor-pointer">
                    <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                    <span style={{ fontFamily: 'Mosk, sans-serif' }}>Subscription</span>
                  </DropdownMenuItem>
                </>
              )}

              {(user?.role === 'admin' || user?.role === 'superadmin') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                    <ShieldCheck className="mr-2 h-4 w-4 text-destructive" />
                    <span style={{ fontFamily: 'Mosk, sans-serif' }}>Admin Panel</span>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span style={{ fontFamily: 'Mosk, sans-serif' }}>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {isCollapsed && user && (
          <button
            onClick={toggleSidebar}
            className="w-full flex justify-center mt-2 p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
