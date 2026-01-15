import { useLocation, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  Calendar,
  Users,
  Building2,
  BarChart,
  MessageSquare,
  Settings,
  Activity,
  Shield,
  MapPin,
  ClipboardList,
  Ticket,
  UserCheck,
  Trash2,
  UserPlus,
  Globe,
  TrendingUp,
  Briefcase,
  Mail,
  Palette,
  ChevronRight,
  ChevronLeft,
  PanelLeft,
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
  SidebarTrigger,
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
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useUnreadCount } from '@/hooks/use-messages'
import { useOrganizerPermissions } from '@/hooks/use-organizer-permissions'
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
    label: 'DASHBOARD',
    items: [
      {
        title: 'Overview',
        url: '/dashboard',
        icon: Activity,
        roles: ['superadmin', 'admin', 'organizer', 'organizer_admin', 'usher'],
        permission: 'dashboard.view',
      },
    ],
  },
  {
    label: 'EVENTS',
    items: [
      {
        title: 'Events',
        url: '/dashboard/events',
        icon: Calendar,
        roles: ['superadmin', 'admin', 'organizer', 'organizer_admin'],
        permission: 'events.view',
      },
      {
        title: 'Create Event',
        url: '/dashboard/events/create',
        icon: ClipboardList,
        roles: ['superadmin', 'organizer', 'organizer_admin'],
        permission: 'events.create',
      },
      {
        title: 'Ticket Management',
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
    label: 'MANAGEMENT',
    items: [
      {
        title: 'Users',
        url: '/dashboard/users',
        icon: Users,
        roles: ['superadmin', 'admin'],
      },
      {
        title: 'Organizers',
        url: '/dashboard/organizers',
        icon: Building2,
        roles: ['superadmin', 'admin'],
      },
      {
        title: 'Guests',
        url: '/dashboard/guests',
        icon: Users,
        roles: ['organizer', 'organizer_admin'],
        permission: 'guests.manage',
      },
      {
        title: 'Usher Management',
        url: '/dashboard/usher-management',
        icon: UserPlus,
        roles: ['superadmin', 'admin', 'organizer', 'organizer_admin', 'user'],
        permission: 'ushers.manage',
      },
      {
        title: 'Vendor Management',
        url: '/dashboard/vendor-management',
        icon: Briefcase,
        roles: ['superadmin', 'admin', 'organizer', 'organizer_admin'],
        // Check for any vendor permission - handled in filtering logic
        permission: 'vendors.any',
      },
      {
        title: 'Salesperson Management',
        url: '/dashboard/salesperson-management',
        icon: Users,
        roles: ['superadmin', 'admin'],
      },
      {
        title: 'Subscription Management',
        url: '/dashboard/admin/subscriptions',
        icon: Shield,
        roles: ['superadmin', 'admin'],
      },
      {
        title: 'Subscription',
        url: '/dashboard/subscription',
        icon: Shield,
        roles: ['organizer', 'organizer_admin'],
        permission: 'subscription.view',
      },
      {
        title: 'My Team',
        url: '/dashboard/team',
        icon: Users,
        roles: ['superadmin', 'organizer', 'organizer_admin'],
        permission: 'team.manage',
      },
      {
        title: 'Role Management',
        url: '/dashboard/role-management',
        icon: Shield,
        roles: ['organizer_admin'],
        permission: 'team.manage',
      },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      {
        title: 'Tasks & Deliverables',
        url: '/dashboard/tasks',
        icon: ClipboardList,
        roles: ['superadmin', 'admin', 'organizer', 'organizer_admin'],
        permission: 'tasks.manage',
      },
      {
        title: 'Attendee Check-in',
        url: '/dashboard/check-in',
        icon: UserCheck,
        roles: ['usher'],
      },
      {
        title: 'Ticket Validator',
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
    label: 'ANALYTICS',
    items: [
      {
        title: 'Event Analytics',
        url: '/dashboard/reports',
        icon: BarChart,
        roles: ['superadmin', 'organizer', 'organizer_admin'],
        permission: 'reports.view',
      },
    ],
  },
  {
    label: 'COMMUNICATION',
    items: [
      {
        title: 'Messages',
        url: '/dashboard/messages',
        icon: MessageSquare,
        roles: ['superadmin', 'admin', 'organizer', 'organizer_admin', 'usher'],
        permission: 'messages.manage',
      },
      {
        title: 'Marketing',
        url: '/dashboard/marketing',
        icon: Mail,
        roles: ['superadmin', 'admin', 'organizer', 'organizer_admin'],
        permission: 'marketing.manage',
      },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      {
        title: 'System Logs',
        url: '/dashboard/audit-logs',
        icon: Shield,
        roles: ['superadmin', 'admin'],
      },
      {
        title: 'Trash',
        url: '/dashboard/trash',
        icon: Trash2,
        roles: ['superadmin', 'admin'],
      },
    ],
  },
]

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar()
  const { user } = useAuth()
  const { hasPermission, isOrganizerAdmin } = useOrganizerPermissions()
  const isCollapsed = state === 'collapsed'
  const [trashCount, setTrashCount] = useState(0)
  const location = useLocation()
  
  // Get unread message count
  const { data: unreadData } = useUnreadCount()
  const unreadCount = unreadData?.unread_count || 0

  // Filter categories and items based on user role and permissions
  const filteredCategories = navigationCategories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => {
        // Guests menu is only for organizers, not for admin/superadmin
        if (item.title === 'Guests' && user && (user.role === 'admin' || user.role === 'superadmin')) {
          return false
        }

        // System admins see everything (except Guests and Messages)
        if (user && (user.role === 'admin' || user.role === 'superadmin')) {
          return true
        }

        // Check role-based access first
        if (user && !item.roles.includes(user.role)) {
          return false
        }

        // For organizer and organizer_admin users, check permissions if specified
        if (user && (user.role === 'organizer' || user.role === 'organizer_admin') && item.permission) {
          // Organizer admin has all permissions
          if (isOrganizerAdmin || user.role === 'organizer_admin') {
            return true
          }
          
          // Special case: Check for any vendor permission
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
      // Hide OPERATIONS section for admin and superadmin
      if (category.label === 'OPERATIONS' && user && (user.role === 'admin' || user.role === 'superadmin')) {
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
          // Suppress 403 errors as they're expected for non-admin users
          // Only log unexpected errors
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
      className="bg-sidebar border-r border-sidebar-border text-sidebar-foreground"
      collapsible="icon"
    >
      {/* Header with Logo and Settings */}
      <SidebarHeader className={`border-b border-sidebar-border ${isCollapsed ? 'p-3 space-y-3' : 'p-4 space-y-3'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {isCollapsed ? (
            /* Collapsed: Just logo centered */
            <div className="w-10 h-10 flex items-center justify-center">
              <img
                src="/evella-logo.png"
                alt="Evella Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
          ) : (
            /* Expanded: Logo with text and settings */
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img
                    src="/evella-logo.png"
                    alt="Evella Logo"
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div>
                  <h2 className="font-bold text-sidebar-foreground text-lg">Evella</h2>
                  <p className="text-xs text-sidebar-foreground/70 font-medium">
                    Event Management
                  </p>
                </div>
              </div>
              <button className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors">
                <Settings className="w-4 h-4 text-sidebar-foreground/70" />
              </button>
            </>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent className="flex-1 overflow-y-auto">
        {filteredCategories.map((category) => (
          <SidebarGroup key={category.label}>
            <SidebarGroupLabel className={`text-sidebar-foreground/70 text-xs uppercase tracking-wider font-semibold ${isCollapsed ? 'px-2 pt-4 pb-2' : 'px-4 pt-4 pb-2'}`}>
              {!isCollapsed ? category.label : ''}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className={`space-y-1 ${isCollapsed ? 'px-1' : 'px-2'}`}>
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
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          'transition-all duration-200 rounded-lg',
                          isCollapsed && 'justify-center'
                        )}
                      >
                        <NavLink
                          to={item.url}
                          end={item.url === '/dashboard'}
                          className="flex items-center justify-between w-full"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!isCollapsed && (
                              <span className="font-medium text-sm">
                                {item.title}
                              </span>
                            )}
                          </div>
                          {showBadge && (
                            <Badge
                              variant="destructive"
                              className="ml-2 text-xs"
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

      {/* Footer with User Profile and Collapse Button */}
      <SidebarFooter className={`border-t border-sidebar-border ${isCollapsed ? 'p-3' : 'p-4'} space-y-3`}>
        {/* User Profile Section */}
        {!isCollapsed && user ? (
          <>
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.profile_image} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-warning text-primary-foreground text-sm font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sidebar-foreground text-sm truncate">
                  {user.name || 'User'}
                </div>
                <div className="text-xs text-sidebar-foreground/70 truncate">
                  {user.email || ''}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-sidebar-foreground/50 flex-shrink-0" />
            </div>
            {/* Collapse Button - Only visible when expanded */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleSidebar}
                    className="w-full flex items-center justify-center p-2 rounded-md hover:bg-sidebar-accent transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-sidebar-foreground/70" />
                  </button>
                </TooltipTrigger>
              </Tooltip>
            </TooltipProvider>
          </>
        ) : (
          user && (
            /* Collapsed: Just avatar, clickable to expand */
            <button
              onClick={toggleSidebar}
              className="flex justify-center w-full"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.profile_image} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-warning text-primary-foreground text-sm font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </button>
          )
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
