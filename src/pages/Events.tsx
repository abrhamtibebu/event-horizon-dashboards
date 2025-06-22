import { useState } from "react";
import { Calendar, Users, MapPin, Plus, Search, Filter, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DashboardCard } from "@/components/DashboardCard";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const events = [
  {
    id: 1,
    name: "Tech Conference 2024",
    description: "Annual technology conference featuring the latest innovations",
    date: "2024-06-25",
    time: "09:00 AM",
    location: "Convention Center",
    attendees: 450,
    maxAttendees: 500,
    status: "active",
    organizer: "John Smith",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400"
  },
  {
    id: 2,
    name: "Music Festival",
    description: "Three-day music festival with multiple stages",
    date: "2024-06-28",
    time: "06:00 PM",
    location: "City Park",
    attendees: 1200,
    maxAttendees: 1500,
    status: "active",
    organizer: "Sarah Johnson",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400"
  },
  {
    id: 3,
    name: "Business Summit",
    description: "Networking event for business professionals",
    date: "2024-06-30",
    time: "10:00 AM",
    location: "Hotel Grand",
    attendees: 300,
    maxAttendees: 400,
    status: "draft",
    organizer: "Mike Davis",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400"
  },
  {
    id: 4,
    name: "Art Exhibition",
    description: "Contemporary art showcase",
    date: "2024-07-02",
    time: "02:00 PM",
    location: "Art Gallery",
    attendees: 150,
    maxAttendees: 200,
    status: "completed",
    organizer: "Lisa Wilson",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400"
  },
];

export default function Events() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "draft": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">Manage and monitor all your events</p>
        </div>
        <Link to="/events/create">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <DashboardCard key={event.id} title="" className="overflow-hidden">
            <div className="space-y-4">
              {/* Event Image */}
              <div className="h-48 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg overflow-hidden">
                <img
                  src={event.image}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Event Details */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                </div>

                <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date} at {event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{event.attendees}/{event.maxAttendees} attendees</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Registration Progress</span>
                    <span>{Math.round((event.attendees / event.maxAttendees) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(event.attendees / event.maxAttendees) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500">Organized by {event.organizer}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Link to={`/dashboard/events/${event.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </Link>
                  <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
                    Manage
                  </Button>
                </div>
              </div>
            </div>
          </DashboardCard>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
          <Link to="/events/create">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Event
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
