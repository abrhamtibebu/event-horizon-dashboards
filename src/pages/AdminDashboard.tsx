
import { useState } from "react";
import { 
  Calendar, 
  Users, 
  Building2, 
  BarChart3, 
  Settings, 
  TrendingUp, 
  UserCheck, 
  AlertCircle,
  Plus,
  FileText,
  Shield
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { DashboardCard } from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";
import { Link } from "react-router-dom";

const eventMetrics = [
  { month: "Jan", events: 15, users: 450, revenue: 12500 },
  { month: "Feb", events: 22, users: 680, revenue: 18600 },
  { month: "Mar", events: 18, users: 520, revenue: 15200 },
  { month: "Apr", events: 28, users: 920, revenue: 25400 },
  { month: "May", users: 1150, revenue: 31200 },
  { month: "Jun", events: 32, users: 1280, revenue: 35800 },
];

const eventStatusData = [
  { name: "Active", value: 45, color: "#10b981" },
  { name: "Completed", value: 38, color: "#3b82f6" },
  { name: "Draft", value: 12, color: "#f59e0b" },
  { name: "Cancelled", value: 5, color: "#ef4444" },
];

const userRoleData = [
  { role: "Attendees", count: 2840, growth: 12 },
  { role: "Organizers", count: 145, growth: 8 },
  { role: "Ushers", count: 89, growth: 15 },
  { role: "Admins", count: 12, growth: 0 },
];

const recentActivities = [
  { id: 1, action: "New event created", user: "Sarah Johnson", time: "2 min ago", type: "event" },
  { id: 2, action: "User registered", user: "John Doe", time: "5 min ago", type: "user" },
  { id: 3, action: "Event approved", user: "Mike Davis", time: "15 min ago", type: "approval" },
  { id: 4, action: "Report generated", user: "Admin", time: "1 hour ago", type: "report" },
];

const systemAlerts = [
  { id: 1, message: "Server maintenance scheduled for tonight", severity: "warning", time: "30 min ago" },
  { id: 2, message: "High traffic detected on registration system", severity: "info", time: "1 hour ago" },
  { id: 3, message: "Backup completed successfully", severity: "success", time: "2 hours ago" },
];

export default function AdminDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "event": return <Calendar className="w-4 h-4" />;
      case "user": return <Users className="w-4 h-4" />;
      case "approval": return <UserCheck className="w-4 h-4" />;
      case "report": return <FileText className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "warning": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "info": return "bg-blue-100 text-blue-800 border-blue-200";
      case "success": return "bg-green-100 text-green-800 border-green-200";
      case "error": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">System overview and management center</p>
        </div>
        <div className="flex gap-3">
          <Link to="/events/create">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Events"
          value="287"
          icon={<Calendar className="w-6 h-6 text-blue-600" />}
          trend={{ value: 18, isPositive: true }}
        />
        <MetricCard
          title="Total Users"
          value="3,086"
          icon={<Users className="w-6 h-6 text-purple-600" />}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Active Organizers"
          value="145"
          icon={<Building2 className="w-6 h-6 text-green-600" />}
          trend={{ value: 8, isPositive: true }}
        />
        <MetricCard
          title="Monthly Revenue"
          value="$35,800"
          icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
          trend={{ value: 24, isPositive: true }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Event & User Growth">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={eventMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="events" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Events"
              />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                name="Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </DashboardCard>

        <DashboardCard title="Event Status Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={eventStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="value"
              >
                {eventStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {eventStatusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      {/* User Analytics & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="User Role Distribution">
          <div className="space-y-4">
            {userRoleData.map((role) => (
              <div key={role.role} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{role.role}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{role.count}</span>
                    {role.growth > 0 && (
                      <Badge className="bg-green-100 text-green-800">
                        +{role.growth}%
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress value={(role.count / 3086) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="System Alerts">
          <div className="space-y-3">
            {systemAlerts.map((alert) => (
              <div key={alert.id} className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs opacity-75 mt-1">{alert.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            View All Alerts
          </Button>
        </DashboardCard>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Recent System Activity">
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-600">by {activity.user} • {activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/audit-logs">
            <Button variant="outline" size="sm" className="w-full mt-4">
              View Full Activity Log
            </Button>
          </Link>
        </DashboardCard>

        <DashboardCard title="Quick Actions">
          <div className="grid grid-cols-2 gap-3">
            <Link to="/users" className="block">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Users className="w-6 h-6" />
                <span className="text-sm">Manage Users</span>
              </Button>
            </Link>
            <Link to="/organizers" className="block">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Building2 className="w-6 h-6" />
                <span className="text-sm">Organizers</span>
              </Button>
            </Link>
            <Link to="/reports" className="block">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <BarChart3 className="w-6 h-6" />
                <span className="text-sm">Reports</span>
              </Button>
            </Link>
            <Link to="/settings" className="block">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Shield className="w-6 h-6" />
                <span className="text-sm">Security</span>
              </Button>
            </Link>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
