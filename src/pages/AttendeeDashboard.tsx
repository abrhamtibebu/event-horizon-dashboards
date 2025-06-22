
import { useState } from "react";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Ticket, 
  Search,
  Filter,
  Star,
  MessageSquare,
  Bell,
  User,
  Heart,
  Share2
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { DashboardCard } from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";

const upcomingEvents = [
  {
    id: 1,
    name: "Tech Innovation Summit 2024",
    description: "Join industry leaders for cutting-edge technology discussions",
    date: "2024-07-15",
    time: "09:00 AM - 06:00 PM",
    location: "Convention Center, Downtown",
    category: "Technology",
    price: 89,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400",
    rating: 4.8,
    attendees: 1200,
    isFavorite: true,
    isRegistered: false
  },
  {
    id: 2,
    name: "Digital Marketing Masterclass",
    description: "Learn advanced digital marketing strategies from experts",
    date: "2024-07-22",
    time: "02:00 PM - 05:00 PM",
    location: "Business Hub, City Center",
    category: "Marketing",
    price: 45,
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400",
    rating: 4.6,
    attendees: 300,
    isFavorite: false,
    isRegistered: true
  },
  {
    id: 3,
    name: "Music Festival 2024",
    description: "Three days of amazing music and entertainment",
    date: "2024-08-05",
    time: "06:00 PM - 11:00 PM",
    location: "City Park Amphitheater",
    category: "Entertainment",
    price: 120,
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
    rating: 4.9,
    attendees: 5000,
    isFavorite: true,
    isRegistered: false
  }
];

const myRegisteredEvents = [
  {
    id: 2,
    name: "Digital Marketing Masterclass",
    date: "2024-07-22",
    time: "02:00 PM",
    location: "Business Hub",
    ticket: "DMM-2024-001",
    status: "confirmed"
  },
  {
    id: 4,
    name: "Leadership Workshop",
    date: "2024-07-28",
    time: "10:00 AM",
    location: "Conference Hall",
    ticket: "LW-2024-045",
    status: "confirmed"
  }
];

const recommendedEvents = [
  {
    id: 5,
    name: "AI & Machine Learning Conference",
    category: "Technology",
    date: "2024-08-12",
    price: 99,
    rating: 4.7
  },
  {
    id: 6,
    name: "Startup Pitch Competition",
    category: "Business",
    date: "2024-08-18",
    price: 25,
    rating: 4.5
  }
];

const networkingOpportunities = [
  { id: 1, name: "Tech Entrepreneurs Group", members: 245, category: "Technology" },
  { id: 2, name: "Digital Marketing Pros", members: 180, category: "Marketing" },
  { id: 3, name: "Creative Professionals", members: 320, category: "Design" }
];

export default function AttendeeDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredEvents = upcomingEvents.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || event.category.toLowerCase() === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
          <p className="text-gray-600 mt-1">Discover amazing events and connect with like-minded people</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Button>
          <Button variant="outline">
            <User className="w-4 h-4 mr-2" />
            Profile
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Events Attended"
          value="15"
          icon={<Calendar className="w-6 h-6 text-blue-600" />}
          trend={{ value: 25, isPositive: true }}
        />
        <MetricCard
          title="Upcoming Events"
          value="3"
          icon={<Ticket className="w-6 h-6 text-purple-600" />}
        />
        <MetricCard
          title="Network Connections"
          value="42"
          icon={<Users className="w-6 h-6 text-green-600" />}
          trend={{ value: 18, isPositive: true }}
        />
        <MetricCard
          title="Favorite Events"
          value="8"
          icon={<Heart className="w-6 h-6 text-red-600" />}
        />
      </div>

      {/* Event Discovery */}
      <DashboardCard title="Discover Events">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="entertainment">Entertainment</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-48 bg-gradient-to-r from-blue-100 to-purple-100 overflow-hidden">
                <img
                  src={event.image}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <Badge variant="outline">{event.category}</Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={event.isFavorite ? "text-red-500" : "text-gray-400"}
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-gray-400">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900">{event.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{event.rating}</span>
                    </div>
                    <span className="text-sm text-gray-500">({event.attendees} attending)</span>
                  </div>
                  <span className="font-bold text-lg text-gray-900">${event.price}</span>
                </div>

                <div className="flex gap-2">
                  <Link to={`/events/${event.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  {event.isRegistered ? (
                    <Button size="sm" disabled className="flex-1">
                      Registered
                    </Button>
                  ) : (
                    <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
                      Register
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* My Events & Networking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="My Registered Events">
          <div className="space-y-4">
            {myRegisteredEvents.map((event) => (
              <div key={event.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{event.name}</h4>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{event.time}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Ticket: {event.ticket}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      View Ticket
                    </Button>
                    <Link to={`/events/${event.id}`}>
                      <Button size="sm">Details</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            View All My Events
          </Button>
        </DashboardCard>

        <DashboardCard title="Networking Opportunities">
          <div className="space-y-4">
            {networkingOpportunities.map((group) => (
              <div key={group.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">{group.name}</h4>
                    <p className="text-sm text-gray-600">{group.members} members • {group.category}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Join
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Start a Conversation</h4>
            <p className="text-sm text-blue-700 mb-3">Connect with other attendees and share experiences</p>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <MessageSquare className="w-4 h-4 mr-2" />
              New Conversation
            </Button>
          </div>
        </DashboardCard>
      </div>

      {/* Recommendations */}
      <DashboardCard title="Recommended for You">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendedEvents.map((event) => (
            <div key={event.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{event.name}</h4>
                <Badge variant="outline">{event.category}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{event.date}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>{event.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">${event.price}</span>
                  <Button size="sm">Register</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>
    </div>
  );
}
