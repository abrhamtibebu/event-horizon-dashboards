import { useState, useEffect, useRef } from 'react'
import {
  Calendar,
  Users,
  MapPin,
  Plus,
  Search,
  Filter,
  Eye,
  DollarSign,
  Settings as SettingsIcon,
} from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DashboardCard } from '@/components/DashboardCard'
import { Link } from 'react-router-dom'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import api from '@/lib/api'
import { getImageUrl } from '@/lib/utils'
import EventCategoryManager from './EventCategoryManager'
import EventTypeManager from './EventTypeManager'
import { useAuth } from '@/hooks/use-auth'
import { usePermissionCheck } from '@/hooks/use-permission-check'
import { ProtectedButton } from '@/components/ProtectedButton'
import { PermissionGuard } from '@/components/PermissionGuard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Pagination from '@/components/Pagination'
import { Spinner } from '@/components/ui/spinner'
import { usePagination } from '@/hooks/usePagination'
import { Star, StarOff } from 'lucide-react'

export default function Events() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pricingFilter, setPricingFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [eventCounts, setEventCounts] = useState({
    ticketed: 0,
    free: 0,
    total: 0
  })

  const { user } = useAuth()
  const { hasPermission } = usePermissionCheck()
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Toggle featured status for admin
  const toggleFeatured = async (eventId: number, currentStatus: boolean) => {
    try {
      await api.put(`/events/${eventId}/toggle-featured`)
      // Refresh events list
      window.location.reload()
    } catch (error: any) {
      console.error('Failed to toggle featured status:', error)
      // Show error toast if available
    }
  }
  
  // Pagination hook
  const {
    currentPage,
    perPage,
    totalPages,
    totalRecords,
    setTotalPages,
    setTotalRecords,
    handlePageChange,
    handlePerPageChange,
    resetPagination
  } = usePagination({ defaultPerPage: 10, searchParamPrefix: 'events' });
  
  // Debug logging
  console.log('Events component rendered, user:', user?.id)

  // Fetch event counts for statistics
  useEffect(() => {
    const fetchEventCounts = async () => {
      if (!user) return
      
      try {
        // Fetch all events without pagination to get accurate counts
        const res = await api.get('/events', {
          params: {
            per_page: 1000, // Large number to get all events
          }
        })
        
        // Handle both paginated and non-paginated responses
        let allEvents: any[] = []
        if (res.data.data) {
          // Paginated response - get all pages if needed
          allEvents = res.data.data
          // If there are more pages, we might need to fetch them, but for now use what we have
          // For organizers, backend returns all events in one response, so this should work
        } else if (Array.isArray(res.data)) {
          // Non-paginated response (organizers)
          allEvents = res.data
        } else {
          allEvents = []
        }
        
        // Count events by type - handle both event_type_column and event_type
        const ticketedCount = allEvents.filter((e: any) => {
          const eventType = e.event_type_column || e.event_type
          // Handle both string and object (relationship) cases
          const eventTypeValue = typeof eventType === 'string' ? eventType : (eventType?.name || 'free')
          return eventTypeValue === 'ticketed'
        }).length
        
        const freeCount = allEvents.filter((e: any) => {
          const eventType = e.event_type_column || e.event_type
          // Handle both string and object (relationship) cases
          const eventTypeValue = typeof eventType === 'string' ? eventType : (eventType?.name || 'free')
          return eventTypeValue === 'free'
        }).length
        
        setEventCounts({
          ticketed: ticketedCount,
          free: freeCount,
          total: allEvents.length
        })
      } catch (err: any) {
        console.error('Failed to fetch event counts:', err)
        // Set default counts on error
        setEventCounts({
          ticketed: 0,
          free: 0,
          total: 0
        })
      }
    }
    
    if (user) {
      fetchEventCounts()
    }
  }, [user?.id])

  useEffect(() => {
    console.log('Events useEffect triggered, user?.id:', user?.id)
    const fetchEvents = async () => {
      setLoading(true)
      setError(null)
      try {
        // Build query parameters for pagination and filtering
        const params = new URLSearchParams({
          page: currentPage.toString(),
          per_page: perPage.toString(),
        });
        
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        
        if (statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        
        if (pricingFilter !== 'all') {
          params.append('pricing', pricingFilter);
        }
        
        const res = await api.get(`/events?${params.toString()}`)
        console.log('[Events] API Response:', res.data)
        
        // Handle paginated response
        if (res.data.data) {
          setEvents(res.data.data)
          setTotalPages(res.data.last_page || 1)
          setTotalRecords(res.data.total || 0)
        } else {
          // Fallback for non-paginated response
          setEvents(res.data)
          setTotalPages(1)
          setTotalRecords(res.data.length || 0)
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch events')
      } finally {
        setLoading(false)
      }
    }
    
    // Only fetch if we have a user
    if (user) {
      fetchEvents()
      // Temporarily disabled polling to prevent reloading issues
      // intervalRef.current = setInterval(fetchEvents, 150000)
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [user?.id, currentPage, perPage, searchTerm, statusFilter, pricingFilter]) // Include pagination dependencies

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success'
      case 'completed':
        return 'bg-info/10 text-info'
      case 'draft':
        return 'bg-[hsl(var(--color-warning))]/10 text-[hsl(var(--color-warning))]'
      case 'cancelled':
        return 'bg-error/10 text-error'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  // Handle search and filter changes with pagination reset
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    resetPagination();
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    resetPagination();
  };

  const handlePricingFilterChange = (value: string) => {
    setPricingFilter(value);
    resetPagination();
  };

  // Since we're now using server-side pagination, we don't need client-side filtering
  const filteredEvents = events;

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs 
        items={[
          { label: 'Events', href: '/dashboard/events' }
        ]}
        className="mb-4"
      />
      
      <Tabs defaultValue="all-events" className="space-y-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[hsl(var(--color-rich-black))]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {user?.role === 'usher' ? 'My Assigned Events' : 'Events'}
              </h1>
              <p className="text-muted-foreground">
                {user?.role === 'usher' 
                  ? 'View and manage events you are assigned to as an usher'
                  : 'Manage and monitor all your events'
                }
              </p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="mt-6">
            <TabsList className="bg-card/80 backdrop-blur-sm border border-border shadow-sm">
              <TabsTrigger 
                value="all-events"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {user?.role === 'usher' ? 'Assigned Events' : 'All Events'}
              </TabsTrigger>
              {user?.role !== 'usher' && (
                <TabsTrigger 
                  value="settings"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              )}
            </TabsList>
          </div>
        </div>

        <TabsContent value="all-events">
          {/* Content Header */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-card-foreground">
                  {user?.role === 'usher' ? 'Assigned Events' : 'All Events'}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <PermissionGuard
                permission="events.create"
                showToast={true}
                actionName="create events"
              >
                {user?.role !== 'usher' && (hasPermission('events.create') || hasPermission('events.manage')) && (
                  <Link to="/dashboard/events/create">
                    <Button className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  </Link>
                )}
              </PermissionGuard>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search events by name or description..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 bg-background border-border focus:bg-card"
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-48 bg-background border-border focus:bg-card">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={pricingFilter} onValueChange={handlePricingFilterChange}>
                <SelectTrigger className="w-48 bg-background border-border focus:bg-card">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by pricing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pricing</SelectItem>
                  <SelectItem value="free">Free Events</SelectItem>
                  <SelectItem value="ticketed">Ticketed Events</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Pricing Statistics */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-info/10 border border-info/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-info/15 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-info" />
                  </div>
                  <div>
                    <p className="text-sm text-info font-medium">Ticketed Events</p>
                    <p className="text-xl font-bold text-card-foreground">
                      {eventCounts.ticketed}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-success/10 border border-success/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-success/15 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-success font-medium">Free Events</p>
                    <p className="text-xl font-bold text-card-foreground">
                      {eventCounts.free}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-info/10 border border-info/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-info/15 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-info" />
                  </div>
                  <div>
                    <p className="text-sm text-info font-medium">Total Events</p>
                    <p className="text-xl font-bold text-card-foreground">
                      {eventCounts.total}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading/Error States */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner size="lg" variant="primary" text="Loading events..." />
              <div className="text-sm text-muted-foreground/70 mt-2">Gathering your event data</div>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-lg font-medium text-foreground mb-2">Failed to load events</div>
              <div className="text-muted-foreground mb-6">{error}</div>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Events Grid or List */}
          {!loading && !error && (
            <div className="mt-6">
              {/* Admin Table View */}
              {(user?.role === 'admin' || user?.role === 'superadmin') && (
                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold text-foreground">Event Name</TableHead>
                        <TableHead className="font-semibold text-foreground">Organizer</TableHead>
                        <TableHead className="font-semibold text-foreground">Type</TableHead>
                        <TableHead className="font-semibold text-foreground">Visibility</TableHead>
                        <TableHead className="font-semibold text-foreground">Status</TableHead>
                        <TableHead className="font-semibold text-foreground">Attendees</TableHead>
                        <TableHead className="font-semibold text-foreground">Featured</TableHead>
                        <TableHead className="font-semibold text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((event) => (
                        <TableRow key={event.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium text-foreground">
                            <div>
                              <div className="font-semibold">{event.name}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">{event.description}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {event.organizer?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${event.event_type === 'ticketed' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'} text-xs font-medium`}>
                              {event.event_type === 'ticketed' ? '🎫 Ticketed' : '🎉 Free'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${event.visibility === 'public' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'} text-xs font-medium`}>
                              {event.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(event.status)} text-xs font-medium`}>
                              {event.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {event.attendee_count || 0}/{event.max_guests || 500}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFeatured(event.id, event.is_featured)}
                              disabled={event.visibility !== 'public' || event.advertisement_status !== 'approved'}
                              className={`p-2 ${event.is_featured ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-yellow-500'}`}
                              title={
                                event.visibility !== 'public' || event.advertisement_status !== 'approved'
                                  ? 'Event must be public and approved to be featured'
                                  : event.is_featured
                                    ? 'Remove from featured'
                                    : 'Mark as featured'
                              }
                            >
                              {event.is_featured ? (
                                <Star className="w-5 h-5 fill-current" />
                              ) : (
                                <StarOff className="w-5 h-5" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Link to={`/dashboard/events/${event.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Organizer/Usher Grid View */}
              {(user?.role === 'organizer' || user?.role === 'organizer_admin' || user?.role === 'usher') ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => {
                    // Calculate registration progress
                    const attendeeCount = event.attendee_count || 0
                    const attendeeLimit = event.max_guests || 500
                    const registrationProgress = Math.min(
                      Math.round((attendeeCount / attendeeLimit) * 100),
                      100
                    )
                    return (
                      <div key={event.id} className="group">
                        <div className="bg-card rounded-2xl shadow-sm border border-border h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300">
                          {/* Event Image */}
                          <div className="relative h-48 w-full overflow-hidden">
                            {event.event_image ? (
                              <img
                                                src={getImageUrl(event.event_image)}
                                alt={event.name}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-[hsl(var(--primary))]/10 via-[hsl(var(--color-warning))]/10 to-[hsl(var(--primary))]/10">
                                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                                  <Calendar className="w-8 h-8 text-foreground dark:text-white" />
                                </div>
                              </div>
                            )}
                            {/* Status Badge */}
                            <div className="absolute top-3 right-3">
                              <span className={`${getStatusColor(event.status)} px-3 py-1 rounded-full text-xs font-semibold shadow-sm`}>
                                {event.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col flex-1 p-6">
                            {/* Event Name */}
                            <h3 className="text-lg font-bold text-card-foreground mb-2 line-clamp-2" title={event.name}>
                              {event.name}
                            </h3>
                            
                            {/* Description */}
                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                              {event.description}
                            </p>
                            
                            {/* Event Details */}
                            <div className="space-y-3 mb-4">
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <div className="w-8 h-8 bg-info/15 rounded-lg flex items-center justify-center">
                                  <Calendar className="w-4 h-4 text-info" />
                                </div>
                                <span>{event.date} {event.time}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                  <MapPin className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="truncate" title={event.location || 'Convention Center'}>
                                  {event.location || 'Convention Center'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <div className="w-8 h-8 bg-info/15 rounded-lg flex items-center justify-center">
                                  <Users className="w-4 h-4 text-info" />
                                </div>
                                <span>{attendeeCount}/{attendeeLimit} attendees</span>
                              </div>
                            </div>
                            
                            {/* Registration Progress */}
                            <div className="mb-4">
                              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                                <span>Registration Progress</span>
                                <span className="font-semibold">{registrationProgress}%</span>
                              </div>
                              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-2 bg-[hsl(var(--primary))] rounded-full transition-all duration-300"
                                  style={{ width: `${registrationProgress}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            {/* Usher Tasks */}
                            {user?.role === 'usher' && event.pivot?.tasks && (
                              <div className="mb-4 p-3 bg-info/10 rounded-lg">
                                <div className="text-sm font-semibold text-info mb-2">Your Tasks:</div>
                                <div className="space-y-1">
                                  {JSON.parse(event.pivot.tasks).map((task: string, index: number) => (
                                    <div key={index} className="text-sm text-info flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 bg-info rounded-full"></div>
                                      {task}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Action Button */}
                            <div className="mt-auto">
                              <Link to={`/dashboard/events/${event.id}`} className="block">
                                <Button
                                  variant="outline"
                                  className="w-full bg-card border-border hover:bg-accent hover:border-border transition-all duration-200"
                                >
                                  <Eye className="w-4 h-4 mr-2" /> 
                                  {user?.role === 'usher' ? 'Manage Event' : 'View Details'}
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Event Settings</h3>
                <p className="text-sm text-muted-foreground">Manage event categories and types</p>
              </div>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <SettingsIcon className="w-4 h-4 text-[hsl(var(--color-rich-black))]" />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <EventCategoryManager />
              <EventTypeManager />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
