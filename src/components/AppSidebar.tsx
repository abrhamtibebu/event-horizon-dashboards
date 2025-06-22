
import { useState } from "react";
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
  MapPin
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: Activity },
  { title: "Events", url: "/events", icon: Calendar },
  { title: "Users", url: "/users", icon: Users },
  { title: "Organizers", url: "/organizers", icon: Building2 },
  { title: "Locate Badges", url: "/locate-badges", icon: MapPin },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Reports", url: "/reports", icon: BarChart },
  { title: "Audit Logs", url: "/audit-logs", icon: Shield },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg border-l-4 border-white" 
      : "text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-l-4 hover:border-blue-300 transition-all duration-300 ease-in-out";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <div className="p-4 border-b bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-gray-900 text-lg">VEMS</h2>
              <p className="text-xs text-gray-600 font-medium">Event Management</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 text-xs uppercase tracking-wider font-semibold px-3 py-2">
            {!isCollapsed ? "Navigation" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
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
