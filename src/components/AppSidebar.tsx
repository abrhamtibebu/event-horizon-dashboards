import { useLocation, NavLink, Link } from 'react-router-dom'
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
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useUnreadCount } from '@/hooks/use-messages'
import api from '@/lib/api'

const allItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Activity,
    roles: ['superadmin', 'admin', 'organizer', 'usher'],
  },
  {
    title: 'Events',
    url: '/dashboard/events',
    icon: Calendar,
    roles: ['superadmin', 'admin', 'organizer'],
  },
  {
    title: 'Create Event',
    url: '/dashboard/events/create',
    icon: ClipboardList,
    roles: ['superadmin', 'organizer'],
  },
  { title: 'Users', url: '/dashboard/users', icon: Users, roles: ['superadmin', 'admin'] },
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
    roles: ['superadmin', 'admin', 'organizer'],
  },
    {
    title: 'Usher Management',
    url: '/dashboard/usher-management',
    icon: UserPlus,
    roles: ['superadmin', 'admin', 'organizer', 'user'],
  },
  {
    title: 'Vendor Management',
    url: '/dashboard/vendor-management',
    icon: Briefcase,
    roles: ['superadmin', 'admin', 'organizer'],
  },
  {
    title: 'Salesperson Management',
    url: '/dashboard/salesperson-management',
    icon: Users,
    roles: ['superadmin', 'admin'],
  },
  {
    title: 'Tasks & Deliverables',
    url: '/dashboard/tasks',
    icon: ClipboardList,
    roles: ['superadmin', 'admin', 'organizer'],
  },
  {
    title: 'Locate Badges',
    url: '/dashboard/locate-badges',
    icon: MapPin,
    roles: ['admin', 'organizer', 'usher'],
  },
  {
    title: 'Badge Designer',
    url: '/badge-designer',
    icon: Palette,
    roles: ['superadmin', 'admin', 'organizer'],
  },
  {
    title: 'Marketing',
    url: '/dashboard/marketing',
    icon: Mail,
    roles: ['superadmin', 'admin', 'organizer'],
  },
  {
    title: 'Messages',
    url: '/dashboard/messages',
    icon: MessageSquare,
    roles: ['superadmin', 'admin', 'organizer', 'usher'],
  },
  {
    title: 'Event Analytics',
    url: '/dashboard/reports',
    icon: BarChart,
    roles: ['superadmin', 'organizer'],
  },
  {
    title: 'Evella Analytics',
    url: '/dashboard/evella-analytics',
    icon: TrendingUp,
    roles: ['superadmin', 'admin'],
  },
  {
    title: 'Attendee Check-in',
    url: '/dashboard/check-in',
    icon: UserCheck,
    roles: ['usher'],
  },
  {
    title: 'Ticket Management',
    url: '/dashboard/ticket-management',
    icon: Ticket,
    roles: ['organizer', 'admin', 'superadmin'],
  },
  {
    title: 'Ticket Validator',
    url: '/dashboard/ticket-validator',
    icon: UserCheck,
    roles: ['usher', 'organizer', 'admin', 'superadmin'],
  },
  {
    title: 'My Tickets',
    url: '/dashboard/tickets',
    icon: Ticket,
    roles: ['attendee'],
  },
  {
    title: 'System Logs',
    url: '/dashboard/audit-logs',
    icon: Shield,
    roles: ['superadmin', 'admin'],
  },
  {
    title: 'Event Publication',
    url: '/dashboard/event-publication',
    icon: Globe,
    roles: ['superadmin', 'admin'],
  },
  { title: 'Trash', url: '/dashboard/trash', icon: Trash2, roles: ['superadmin', 'admin'] },
  {
    title: 'Settings',
    url: '/dashboard/settings',
    icon: Settings,
    roles: ['superadmin', 'admin', 'organizer', 'usher'],
  },
  {
    title: 'My Team',
    url: '/dashboard/team',
    icon: Users,
    roles: ['superadmin', 'organizer'],
  },

]

export function AppSidebar() {
  const { state } = useSidebar()
  const { user } = useAuth()
  const isCollapsed = state === 'collapsed'
  const [trashCount, setTrashCount] = useState(0)
  const location = useLocation()
  
  // Get unread message count
  const { data: unreadData } = useUnreadCount()
  const unreadCount = unreadData?.unread_count || 0

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-text-blue-600 font-semibold shadow-lg'
      : 'text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-md transition-all duration-200 ease-in-out'

  const filteredItems = allItems.filter(
    (item) => user && item.roles.includes(user.role)
  )

  // Fetch trash count for admin users
  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchTrashCount = async () => {
        try {
          const response = await api.get('/trash')
          setTrashCount(response.data.total_items || 0)
        } catch (error) {
          console.error('Failed to fetch trash count:', error)
        }
      }

      fetchTrashCount()
    }
  }, [user?.role])

  return (
    <Sidebar
      className={`bg-slate-50 border-r border-slate-200 ${
        isCollapsed ? 'w-14' : 'w-64'
      }`}
      collapsible="icon"
    >
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <img
              src="/Validity_logo.png"
              alt="VEMS Logo"
              className="w-10 h-10 object-contain"
            />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-gray-800 text-lg">VEMS</h2>
              <p className="text-xs text-gray-500 font-medium">
                Event Management
              </p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 text-xs uppercase tracking-wider font-semibold px-4 pt-4 pb-2">
            {!isCollapsed ? 'Navigation' : ''}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title} className="rounded-lg">
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className={getNavCls}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          {!isCollapsed && (
                            <span className="ml-3 font-medium">
                              {item.title}
                            </span>
                          )}
                        </div>
                        {!isCollapsed && (
                          <>
                            {item.title === 'Trash' && trashCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="ml-2 text-xs"
                              >
                                {trashCount}
                              </Badge>
                            )}
                            {item.title === 'Messages' && unreadCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="ml-2 text-xs"
                              >
                                {unreadCount}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                  {/* Render children if present */}
                  {item.children && !isCollapsed && (
                    <ul className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <SidebarMenuItem key={child.title} className="rounded-lg">
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={child.url}
                              className={getNavCls}
                            >
                              <span className="ml-2 font-normal text-sm">{child.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </ul>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
