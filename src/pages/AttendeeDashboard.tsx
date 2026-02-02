import { useState, useEffect } from 'react'
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
  Share2,
} from 'lucide-react'
import { MetricCard } from '@/components/MetricCard'
import { Spinner } from '@/components/ui/spinner'
import { DashboardCard } from '@/components/DashboardCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Link, useOutletContext } from 'react-router-dom'
import api from '@/lib/api'
import { getImageUrl } from '@/lib/utils'

export default function AttendeeDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const { searchQuery } = useOutletContext<{ searchQuery: string }>()

  useEffect(() => {
    const fetchAttendeeData = async () => {
      try {
        setLoading(true)
        const response = await api.get('/dashboard/attendee')
        setDashboardData(response.data)
        setError(null)
      } catch (err) {
        setError(
          'Failed to fetch attendee dashboard data. Backend endpoint may not be implemented.'
        )
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAttendeeData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'pending':
        return 'bg-yellow-500/10 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'cancelled':
        return 'bg-red-500/10 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  if (loading) return (
    <div className="min-h-[300px] flex items-center justify-center">
      <Spinner size="lg" variant="primary" text="Loading dashboard..." />
    </div>
  )
  if (error) return <div className="text-red-500">{error}</div>
  if (!dashboardData) return <div>No dashboard data available.</div>

  const {
    keyMetrics,
    upcomingEvents,
    myRegisteredEvents,
    recommendedEvents,
    networkingOpportunities,
    categories = [],
  } = dashboardData

  const filteredEvents = upcomingEvents?.filter((event: any) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      categoryFilter === 'all' ||
      event.category.toLowerCase() === categoryFilter
    return matchesSearch && matchesCategory
  })

  const filteredUpcomingEvents =
    searchQuery && upcomingEvents
      ? upcomingEvents.filter(
        (event: any) =>
          event.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : upcomingEvents
  const filteredRegisteredEvents =
    searchQuery && myRegisteredEvents
      ? myRegisteredEvents.filter(
        (event: any) =>
          event.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : myRegisteredEvents

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Events Attended"
          value={keyMetrics?.eventsAttended?.value || 'N/A'}
          icon={<Calendar className="w-6 h-6 text-primary" />}
          trend={keyMetrics?.eventsAttended?.trend}
        />
        <MetricCard
          title="Upcoming Events"
          value={keyMetrics?.upcomingEvents || 'N/A'}
          icon={<Ticket className="w-6 h-6 text-orange-600" />}
        />
        <MetricCard
          title="Network Connections"
          value={keyMetrics?.networkConnections?.value || 'N/A'}
          icon={<Users className="w-6 h-6 text-green-600" />}
          trend={keyMetrics?.networkConnections?.trend}
        />
        <MetricCard
          title="Favorite Events"
          value={keyMetrics?.favoriteEvents || 'N/A'}
          icon={<Heart className="w-6 h-6 text-red-600" />}
        />
      </div>

      {/* Locate Badges Quick Action */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <Link
          to="/dashboard/locate-badges"
          className="block p-4 text-center bg-muted/50 hover:bg-accent rounded-lg w-full"
        >
          <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
          <span className="font-medium">Locate Badges</span>
        </Link>
      </div>

      {/* Event Discovery */}
      <DashboardCard title="Discover Events">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
              {categories.map((category: any) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredEvents?.map((event: any) => (
            <div
              key={event.id}
              className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-48 bg-gradient-to-r from-[hsl(var(--color-warning))]/20 to-[hsl(var(--primary))]/20 overflow-hidden">
                {(event.event_image || event.image_url || event.image) ? (
                  <img
                    src={getImageUrl(event.image_url || event.event_image || event.image)}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-muted-foreground/50">
                    <Calendar className="w-16 h-16" />
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <Badge variant="outline">{event.category}</Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={
                        event.isFavorite ? 'text-red-500' : 'text-muted-foreground'
                      }
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-muted-foreground">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-semibold text-card-foreground">{event.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {event.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">
                        {event.rating}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground/70">
                      ({event.attendees} attending)
                    </span>
                  </div>
                  <span className="font-bold text-lg text-card-foreground">
                    ${event.price}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <Link to={`/events/${event.id}`} className="w-full">
                    <Button
                      size="sm"
                      className="w-full bg-brand-gradient bg-brand-gradient-hover text-foreground"
                      disabled={event.isRegistered}
                    >
                      {event.isRegistered ? 'Registered' : 'View Event'}
                    </Button>
                  </Link>
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
            {filteredRegisteredEvents?.map((event: any) => (
              <div key={event.id} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-card-foreground">{event.name}</h4>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{event.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground/70">
                    Ticket: {event.ticket}
                  </span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Link to={`/tickets/${event.ticket}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full">
                        View Ticket
                      </Button>
                    </Link>
                    <Link to={`/events/${event.id}`} className="flex-1">
                      <Button size="sm" className="w-full">Details</Button>
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
            {networkingOpportunities?.map((group: any) => (
              <div key={group.id} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-medium text-card-foreground">{group.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {group.members} members • {group.category}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto">Join</Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-primary/10 rounded-lg">
            <h4 className="font-medium text-primary mb-2">
              Start a Conversation
            </h4>
            <p className="text-sm text-primary/70 mb-3">
              Connect with other attendees and share experiences
            </p>
            <Button size="sm" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <MessageSquare className="w-4 h-4 mr-2" />
              New Conversation
            </Button>
          </div>
        </DashboardCard>
      </div>

      {/* Recommendations */}
      <DashboardCard title="Recommended for You">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {recommendedEvents?.map((event: any) => (
            <div key={event.id} className="p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-card-foreground">{event.name}</h4>
                <Badge variant="outline">{event.category}</Badge>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{event.date}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>{event.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="font-medium">${event.price}</span>
                  <Button size="sm" className="w-full sm:w-auto">Register</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      {filteredUpcomingEvents && (
        <DashboardCard title="Upcoming Events (Filtered)">
          <ul>
            {filteredUpcomingEvents.map((event: any, idx: number) => (
              <li key={idx}>{event.name}</li>
            ))}
          </ul>
        </DashboardCard>
      )}
      {filteredRegisteredEvents && (
        <DashboardCard title="My Registered Events (Filtered)">
          <ul>
            {filteredRegisteredEvents.map((event: any, idx: number) => (
              <li key={idx}>{event.name}</li>
            ))}
          </ul>
        </DashboardCard>
      )}
    </div>
  )
}
