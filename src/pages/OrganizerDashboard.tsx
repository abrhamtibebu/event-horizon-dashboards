
import { useState } from "react";
import { 
  Calendar, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Plus, 
  Eye,
  Mail,
  Phone,
  BarChart3,
  Clock,
  MapPin,
  DollarSign
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
  AreaChart,
  Area
} from "recharts";
import { Link } from "react-router-dom";

const eventPerformance = [
  { month: "Jan", registrations: 120, revenue: 3200, attendance: 110 },
  { month: "Feb", registrations: 180, revenue: 4800, attendance: 165 },
  { month: "Mar", registrations: 150, revenue: 4200, attendance: 140 },
  { month: "Apr", registrations: 220, revenue: 6400, attendance: 200 },
  { month: "May", registrations: 280, revenue: 8200, attendance: 260 },
  { month: "Jun", registrations: 320, revenue: 9600, attendance: 300 },
];

const myEvents = [
  {
    id: 1,
    name: "Tech Innovation Summit 2024",
    date: "2024-07-15",
    time: "09:00 AM",
    location: "Convention Center",
    attendees: 245,
    maxAttendees: 300,
    status: "active",
    revenue: 12500,
    registrationProgress: 82
  },
  {
    id: 2,
    name: "Digital Marketing Workshop",
    date: "2024-07-22",
    time: "02:00 PM",
    location: "Business Hub",
    attendees: 85,
    maxAttendees: 100,
    status: "active",
    revenue: 3400,
    registrationProgress: 85
  },
  {
    id: 3,
    name: "Leadership Conference",
    date: "2024-08-05",
    time: "08:30 AM",
    location: "Grand Hotel",
    attendees: 120,
    maxAttendees: 150,
    status: "draft",
    revenue: 6000,
    registrationProgress: 80
  }
];

const recentMessages = [
  { id: 1, from: "John Smith", message: "Question about event schedule", time: "5 min ago", unread: true },
  { id: 2, from: "Sarah Johnson", message: "Registration confirmation issue", time: "20 min ago", unread: true },
  { id: 3, from: "Mike Davis", message: "Catering requirements update", time: "1 hour ago", unread: false },
  { id: 4, from: "Lisa Wilson", message: "Venue accessibility inquiry", time: "2 hours ago", unread: false }
];

const upcomingTasks = [
  { id: 1, task: "Send pre-event emails to attendees", due: "Today", priority: "high" },
  { id: 2, task: "Confirm catering arrangements", due: "Tomorrow", priority: "medium" },
  { id: 3, task: "Update event website", due: "2 days", priority: "low" },
  { id: 4, task: "Schedule rehearsal session", due: "3 days", priority: "medium" }
];

export default function OrganizerDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your events and engage with attendees</p>
        </div>
        <div className="flex gap-3">
          <Link to="/events/create">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </Link>
          <Link to="/messages">
            <Button variant="outline">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="My Events"
          value="12"
          icon={<Calendar className="w-6 h-6 text-blue-600" />}
          trend={{ value: 20, isPositive: true }}
        />
        <MetricCard
          title="Total Attendees"
          value="1,247"
          icon={<Users className="w-6 h-6 text-purple-600" />}
          trend={{ value: 15, isPositive: true }}
        />
        <MetricCard
          title="Total Revenue"
          value="$28,400"
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          trend={{ value: 32, isPositive: true }}
        />
        <MetricCard
          title="Unread Messages"
          value="8"
          icon={<MessageSquare className="w-6 h-6 text-orange-600" />}
        />
      </div>

      {/* Performance Chart */}
      <DashboardCard title="Event Performance Overview">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={eventPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="registrations" 
              stackId="1"
              stroke="#3b82f6" 
              fill="#3b82f6"
              fillOpacity={0.6}
              name="Registrations"
            />
            <Area 
              type="monotone" 
              dataKey="attendance" 
              stackId="2"
              stroke="#10b981" 
              fill="#10b981"
              fillOpacity={0.6}
              name="Attendance"
            />
          </AreaChart>
        </ResponsiveContainer>
      </DashboardCard>

      {/* My Events & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="My Upcoming Events">
          <div className="space-y-4">
            {myEvents.map((event) => (
              <div key={event.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{event.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{event.time}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{event.attendees}/{event.maxAttendees}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>${event.revenue}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Registration Progress</span>
                    <span>{event.registrationProgress}%</span>
                  </div>
                  <Progress value={event.registrationProgress} className="h-2" />
                </div>

                <div className="flex gap-2 mt-3">
                  <Link to={`/events/${event.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Communication Center">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <Phone className="w-4 h-4 mr-2" />
                SMS Broadcast
              </Button>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Recent Messages</h4>
              {recentMessages.map((message) => (
                <div key={message.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {message.from.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 text-sm">{message.from}</p>
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
            
            <Link to="/messages">
              <Button variant="outline" size="sm" className="w-full">
                View All Messages
              </Button>
            </Link>
          </div>
        </DashboardCard>
      </div>

      {/* Tasks & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Upcoming Tasks">
          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{task.task}</p>
                  <p className="text-xs text-gray-600 mt-1">Due: {task.due}</p>
                </div>
                <Badge className={getPriorityColor(task.priority)} size="sm">
                  {task.priority}
                </Badge>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            View All Tasks
          </Button>
        </DashboardCard>

        <DashboardCard title="Quick Reports">
          <div className="grid grid-cols-2 gap-3">
            <Link to="/reports" className="block">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs">Analytics</span>
              </Button>
            </Link>
            <Button variant="outline" className="w-full h-16 flex-col gap-1">
              <Users className="w-5 h-5" />
              <span className="text-xs">Attendees</span>
            </Button>
            <Button variant="outline" className="w-full h-16 flex-col gap-1">
              <DollarSign className="w-5 h-5" />
              <span className="text-xs">Revenue</span>
            </Button>
            <Button variant="outline" className="w-full h-16 flex-col gap-1">
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs">Growth</span>
            </Button>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
