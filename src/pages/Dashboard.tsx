
import { Calendar, Users, MessageSquare, BarChart } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { DashboardCard } from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "recharts";

const eventData = [
  { month: "Jan", events: 12, attendees: 1200 },
  { month: "Feb", events: 19, attendees: 1900 },
  { month: "Mar", events: 15, attendees: 1500 },
  { month: "Apr", events: 22, attendees: 2200 },
  { month: "May", events: 28, attendees: 2800 },
  { month: "Jun", events: 25, attendees: 2500 },
];

const eventStatusData = [
  { name: "Active", value: 45, color: "#3b82f6" },
  { name: "Completed", value: 30, color: "#10b981" },
  { name: "Cancelled", value: 5, color: "#ef4444" },
  { name: "Draft", value: 20, color: "#6b7280" },
];

const recentEvents = [
  { id: 1, name: "Tech Conference 2024", date: "2024-06-25", attendees: 450, status: "active" },
  { id: 2, name: "Music Festival", date: "2024-06-28", attendees: 1200, status: "active" },
  { id: 3, name: "Business Summit", date: "2024-06-30", attendees: 300, status: "draft" },
  { id: 4, name: "Art Exhibition", date: "2024-07-02", attendees: 150, status: "completed" },
];

const recentMessages = [
  { id: 1, from: "John Doe", message: "Event setup complete", time: "2 min ago", unread: true },
  { id: 2, from: "Sarah Smith", message: "Need more ushers for gate 3", time: "15 min ago", unread: true },
  { id: 3, from: "Mike Johnson", message: "Registration numbers updated", time: "1 hour ago", unread: false },
];

export default function Dashboard() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "draft": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your events.</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          Create Event
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Events"
          value="142"
          icon={<Calendar className="w-6 h-6 text-blue-600" />}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Total Attendees"
          value="12,847"
          icon={<Users className="w-6 h-6 text-purple-600" />}
          trend={{ value: 8, isPositive: true }}
        />
        <MetricCard
          title="Active Events"
          value="28"
          icon={<Calendar className="w-6 h-6 text-green-600" />}
          trend={{ value: 3, isPositive: false }}
        />
        <MetricCard
          title="Unread Messages"
          value="15"
          icon={<MessageSquare className="w-6 h-6 text-orange-600" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Event Trends">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={eventData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="events" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
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

      {/* Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Recent Events">
          <div className="space-y-4">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{event.name}</h4>
                  <p className="text-sm text-gray-600">{event.date} • {event.attendees} attendees</p>
                </div>
                <Badge className={getStatusColor(event.status)}>
                  {event.status}
                </Badge>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Recent Messages">
          <div className="space-y-4">
            {recentMessages.map((message) => (
              <div key={message.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {message.from.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{message.from}</p>
                    <span className="text-xs text-gray-500">{message.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{message.message}</p>
                  {message.unread && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
