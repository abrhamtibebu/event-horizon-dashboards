import { useLocation, NavLink } from "react-router-dom";
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
} from "lucide-react";
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
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth.tsx";

const allItems = [
  { title: "Dashboard", url: "/dashboard", icon: Activity, roles: ["admin", "organizer", "usher"] },
  { title: "Events", url: "/dashboard/events", icon: Calendar, roles: ["admin", "organizer"] },
  { title: "Create Event", url: "/dashboard/events/create", icon: ClipboardList, roles: ["organizer"] },
  { title: "Users", url: "/dashboard/users", icon: Users, roles: ["admin"] },
  { title: "Organizers", url: "/dashboard/organizers", icon: Building2, roles: ["admin"] },
  { title: "Locate Badges", url: "/dashboard/locate-badges", icon: MapPin, roles: ["admin", "usher"] },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare, roles: ["admin", "organizer"] },
  { title: "Event Analytics", url: "/dashboard/reports", icon: BarChart, roles: ["organizer"] },
  { title: "Attendee Check-in", url: "/dashboard/check-in", icon: UserCheck, roles: ["usher"] },
  { title: "My Tickets", url: "/dashboard/tickets", icon: Ticket, roles: ["attendee"] },
  { title: "System Logs", url: "/dashboard/audit-logs", icon: Shield, roles: ["admin"] },
  { title: "Settings", url: "/dashboard/settings", icon: Settings, roles: ["admin", "organizer"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user } = useAuth();
  const isCollapsed = state === "collapsed";

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-yellow-400 text-black font-semibold shadow-lg"
      : "text-slate-600 hover:bg-white hover:text-yellow-500 hover:shadow-md transition-all duration-200 ease-in-out";

  const filteredItems = allItems.filter(item => user && item.roles.includes(user.role));

  return (
    <Sidebar className={`bg-slate-50 border-r border-slate-200 ${isCollapsed ? "w-14" : "w-64"}`} collapsible="icon">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="VEMS Logo" className="w-10 h-10" />
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-gray-800 text-lg">VEMS</h2>
              <p className="text-xs text-gray-500 font-medium">Event Management</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 text-xs uppercase tracking-wider font-semibold px-4 pt-4 pb-2">
            {!isCollapsed ? "Navigation" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title} className="rounded-lg">
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className={getNavCls}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && <span className="ml-3 font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
