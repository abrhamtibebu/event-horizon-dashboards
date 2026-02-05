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
  Activity,
  DollarSign,
  Flag,
  Database,
  Key,
  Shield,
  Plug,
  Zap,
  FileText,
  Workflow,
  FileCheck,
  Mail,
  CreditCard,
  Package,
  Clock,
  History,
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

// Sidebar items hidden for admin/superadmin
const ADMIN_SIDEBAR_HIDDEN_TITLES = [
  'Create Event',
  'Vendors',
  'Ticket Sales',
  'My Tickets',
  'Tasks',
  'Ushers',
]

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
        roles: ['organizer', 'organizer_admin'],
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
        roles: ['organizer', 'organizer_admin', 'usher', 'event_manager', 'marketing_specialist', 'finance_manager', 'procurement_manager', 'operations_manager', 'purchase_requester', 'purchase_approver', 'proforma_manager', 'proforma_approver', 'purchase_order_issuer', 'payment_requester', 'payment_approver', 'attendee', 'sales'],
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
        roles: ['organizer', 'organizer_admin', 'user'],
        permission: 'ushers.manage',
      },
      {
        title: 'Vendors',
        url: '/dashboard/vendor-management',
        icon: Briefcase,
        roles: ['organizer', 'organizer_admin', 'finance_manager', 'procurement_manager', 'operations_manager', 'purchase_requester', 'purchase_approver', 'proforma_manager', 'proforma_approver', 'purchase_order_issuer', 'payment_requester', 'payment_approver'],
        permission: 'vendors.any',
      },
      {
        title: 'Sales Team',
        url: '/dashboard/salesperson-management',
        icon: Users2,
        roles: ['superadmin', 'admin'],
      },
      {
        title: 'Financials',
        url: '/dashboard/admin/financials',
        icon: DollarSign,
        roles: ['superadmin', 'admin'],
      },
      {
        title: 'Advanced Analytics',
        url: '/dashboard/admin/analytics',
        icon: BarChart3,
        roles: ['superadmin', 'admin'],
      },
      {
        title: 'System Settings',
        url: '/dashboard/admin/settings',
        icon: Settings,
        roles: ['superadmin', 'admin'],
      },
      {
        title: 'API Management',
        url: '/dashboard/admin/api',
        icon: Key,
        roles: ['superadmin', 'admin'],
      },
      {
        title: 'System Logs',
        url: '/dashboard/admin/logs',
        icon: FileText,
        roles: ['superadmin', 'admin'],
      },
      {
        title: 'Roles & Permissions',
        url: '/dashboard/admin/roles',
        icon: Shield,
        roles: ['superadmin', 'admin'],
      },
      {
        title: 'Team',
        url: '/dashboard/team',
        icon: Users2,
        roles: ['organizer', 'organizer_admin'],
        permission: 'team.manage',
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        title: 'Validator',
        url: '/dashboard/ticket-validator',
        icon: UserCheck,
        roles: ['organizer', 'organizer_admin', 'admin', 'superadmin'],
        permission: 'tickets.validate',
      },
      {
        title: 'Guest Management',
        url: '/dashboard/usher/events',
        icon: Users2,
        roles: ['usher'],
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
        roles: ['organizer', 'organizer_admin'],
        permission: 'reports.view',
      },
    ],
  },
  {
    label: 'Subscription',
    items: [
      {
        title: 'My Subscription',
        url: '/dashboard/subscription',
        icon: CreditCard,
        roles: ['organizer', 'organizer_admin'],
      },
      {
        title: 'Plans',
        url: '/dashboard/subscription/plans',
        icon: Package,
        roles: ['organizer', 'organizer_admin'],
      },
    ],
  },
  {
    label: 'Subscription Management',
    items: [
      {
        title: 'Subscriptions',
        url: '/dashboard/admin/subscriptions',
        icon: CreditCard,
        roles: ['superadmin', 'admin'],
      },
      {
        title: 'Plan Management',
        url: '/dashboard/admin/plans',
        icon: Package,
        roles: ['superadmin', 'admin'],
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
        roles: ['superadmin', 'admin', 'organizer', 'organizer_admin'],
        permission: 'trash.view',
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
            user?.role === 'usher' && category.label === 'Operations' ? 'My Duties' :
              user?.role === 'usher' && category.label === 'Connect' ? 'Communicate' :
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

        // Hide specific items from admin/superadmin sidebar
        if ((user.role === 'admin' || user.role === 'superadmin') && ADMIN_SIDEBAR_HIDDEN_TITLES.includes(item.title)) {
          return false
        }

        // System admins see everything (they have all roles) except items above
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

  // Fetch trash count for admin users and organizer_admin
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'organizer_admin') {
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
        "!bg-background border-r border-border/50",
        "[&>div>div]:!bg-background",
        "transition-all duration-300 ease-in-out"
      )}
      collapsible="icon"
    >
      {/* Header */}
      <SidebarHeader className={cn(
        "flex items-center transition-all duration-300 border-b border-border/50 bg-background",
        isCollapsed ? 'p-3 justify-center' : 'px-5 py-5'
      )}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 w-full'}`}>
          <div className={cn(
            "flex items-center justify-center transition-all duration-300 shrink-0",
            isCollapsed ? "w-9 h-9" : "w-10 h-10"
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
                <span className="text-lg font-semibold text-foreground tracking-tight">
                  Evella
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {isOrganizer ? 'Organizer' : 'Admin'}
                </span>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="flex-1 overflow-y-auto px-2 py-3 bg-background">
        {filteredCategories.map((category) => (
          <SidebarGroup key={category.label} className="p-0 mb-6">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-3 mb-2 select-none">
                {category.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
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
                          'group relative w-full transition-colors rounded-md',
                          isActive
                            ? 'bg-muted text-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                          isCollapsed ? 'justify-center p-2 h-9 w-9 mx-auto' : 'px-3 py-2 h-9'
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
                          <div className="flex items-center gap-2.5">
                            <item.icon className={cn(
                              "flex-shrink-0 transition-colors",
                              isActive
                                ? "w-[18px] h-[18px] text-foreground"
                                : "w-[18px] h-[18px] text-muted-foreground group-hover:text-foreground"
                            )} />
                            {!isCollapsed && (
                              <span className="text-sm font-medium">
                                {item.title}
                              </span>
                            )}
                          </div>
                          {isActive && !isCollapsed && (
                            <div className="w-1 h-5 rounded-full bg-primary" />
                          )}
                          {showBadge && (
                            <Badge
                              className={cn(
                                "ml-auto h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-semibold rounded-md",
                                item.title === 'Trash'
                                  ? "bg-destructive text-destructive-foreground"
                                  : isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                              )}
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

      <SidebarFooter className="mt-auto p-3 border-t border-border/50 bg-background">
        {user && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <div className={cn(
                "flex items-center gap-2.5 rounded-md transition-colors group cursor-pointer",
                !isCollapsed && "bg-muted/30 hover:bg-muted/50 p-2",
                isCollapsed && "justify-center p-1.5"
              )}>
                <div className="relative">
                  <Avatar className="w-8 h-8 border border-border/50 transition-transform duration-200 group-hover:scale-105">
                    <AvatarImage src={user.profile_image} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full"></div>
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="font-medium text-sm text-foreground truncate">
                      {user.name || 'User'}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
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
            <DropdownMenuContent align={isCollapsed ? "center" : "end"} side={isCollapsed ? "right" : "bottom"} className="w-56 mb-2 rounded-lg">
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
