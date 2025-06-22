
import { useState } from "react";
import { 
  Calendar, 
  Users, 
  QrCode, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Bell,
  UserCheck,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { DashboardCard } from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const assignedEvents = [
  {
    id: 1,
    name: "Tech Innovation Summit 2024",
    date: "2024-07-15",
    time: "09:00 AM - 05:00 PM",
    location: "Convention Center - Hall A",
    totalAttendees: 300,
    checkedIn: 245,
    status: "active",
    zone: "Main Entrance"
  },
  {
    id: 2,
    name: "Digital Marketing Workshop",
    date: "2024-07-22",
    time: "02:00 PM - 06:00 PM",
    location: "Business Hub - Room 204",
    totalAttendees: 100,
    checkedIn: 78,
    status: "active",
    zone: "Registration Desk"
  },
  {
    id: 3,
    name: "Leadership Conference",
    date: "2024-08-05",
    time: "08:30 AM - 04:00 PM",
    location: "Grand Hotel - Ballroom",
    totalAttendees: 150,
    checkedIn: 0,
    status: "upcoming",
    zone: "VIP Entrance"
  }
];

const recentCheckIns = [
  { id: 1, name: "John Smith", company: "Tech Corp", time: "2 min ago", type: "VIP", zone: "Main Entrance" },
  { id: 2, name: "Sarah Johnson", company: "Marketing Plus", time: "5 min ago", type: "Speaker", zone: "Main Entrance" },
  { id: 3, name: "Mike Davis", company: "Innovation Ltd", time: "8 min ago", type: "Visitor", zone: "Registration Desk" },
  { id: 4, name: "Lisa Wilson", company: "Business Solutions", time: "12 min ago", type: "Visitor", zone: "Main Entrance" }
];

const pendingIssues = [
  { id: 1, issue: "Badge printer malfunction", priority: "high", location: "Registration Desk", time: "10 min ago" },
  { id: 2, issue: "Attendee missing badge", priority: "medium", location: "Main Entrance", time: "15 min ago" },
  { id: 3, issue: "Group registration query", priority: "low", location: "VIP Entrance", time: "30 min ago" }
];

export default function UsherDashboard() {
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "upcoming": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "VIP": return "bg-purple-100 text-purple-800";
      case "Speaker": return "bg-blue-100 text-blue-800";
      case "Staff": return "bg-green-100 text-green-800";
      case "Visitor": return "bg-gray-100 text-gray-800";
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
          <h1 className="text-3xl font-bold text-gray-900">Usher Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage attendee check-ins and event support</p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <QrCode className="w-4 h-4 mr-2" />
            QR Scanner
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Assigned Events"
          value="3"
          icon={<Calendar className="w-6 h-6 text-blue-600" />}
        />
        <MetricCard
          title="Total Check-ins Today"
          value="323"
          icon={<UserCheck className="w-6 h-6 text-green-600" />}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Pending Issues"
          value="3"
          icon={<AlertTriangle className="w-6 h-6 text-orange-600" />}
        />
        <MetricCard
          title="Active Events"
          value="2"
          icon={<Users className="w-6 h-6 text-purple-600" />}
        />
      </div>

      {/* Event Overview & Quick Check-in */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="My Assigned Events">
          <div className="space-y-4">
            {assignedEvents.map((event) => (
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
                    <span>{event.checkedIn}/{event.totalAttendees}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Check-in Progress</span>
                    <span>{Math.round((event.checkedIn / event.totalAttendees) * 100)}%</span>
                  </div>
                  <Progress value={(event.checkedIn / event.totalAttendees) * 100} className="h-2" />
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-gray-600">Zone: {event.zone}</span>
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <UserCheck className="w-4 h-4 mr-1" />
                    Check-in
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Quick Check-in">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Search attendee name or ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger>
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {assignedEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">Scan QR code or search manually</p>
            </div>

            <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600">
              <UserCheck className="w-4 h-4 mr-2" />
              Manual Check-in
            </Button>
          </div>
        </DashboardCard>
      </div>

      {/* Recent Activity & Support Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Recent Check-ins">
          <div className="space-y-3">
            {recentCheckIns.map((checkin) => (
              <div key={checkin.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {checkin.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 text-sm">{checkin.name}</p>
                    <span className="text-xs text-gray-500">{checkin.time}</span>
                  </div>
                  <p className="text-sm text-gray-600">{checkin.company}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getTypeColor(checkin.type)}>
                      {checkin.type}
                    </Badge>
                    <span className="text-xs text-gray-500">{checkin.zone}</span>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Support Issues">
          <div className="space-y-3">
            {pendingIssues.map((issue) => (
              <div key={issue.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 text-sm">{issue.issue}</p>
                    <Badge className={getPriorityColor(issue.priority)}>
                      {issue.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{issue.location}</span>
                    <span>•</span>
                    <span>{issue.time}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Resolve
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            <Bell className="w-4 h-4 mr-2" />
            View All Issues
          </Button>
        </DashboardCard>
      </div>
    </div>
  );
}
