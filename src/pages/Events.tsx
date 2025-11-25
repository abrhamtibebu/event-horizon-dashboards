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

export default function Events() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pricingFilter, setPricingFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { user } = useAuth()
  const { hasPermission } = usePermissionCheck()
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
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
                      {events.filter(e => e.event_type === 'ticketed').length}
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
                      {events.filter(e => e.event_type === 'free').length}
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
                      {events.length}
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
              ) : (
                <>
                  {/* Table for desktop */}
                  <div className="hidden lg:block bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="p-6 border-b border-border">
                      <h3 className="text-lg font-semibold text-card-foreground">All Events Overview</h3>
                      <p className="text-sm text-muted-foreground mt-1">Comprehensive view of all events in the system</p>
                    </div>
                    <div className="overflow-x-auto">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow className="bg-muted">
                            <TableHead className="font-semibold text-foreground text-sm py-4">Name</TableHead>
                            <TableHead className="font-semibold text-foreground text-sm py-4">Type</TableHead>
                            <TableHead className="font-semibold text-foreground text-sm py-4">Category</TableHead>
                            <TableHead className="font-semibold text-foreground text-sm py-4">Pricing</TableHead>
                            <TableHead className="font-semibold text-foreground text-sm py-4">Organizer</TableHead>
                            <TableHead className="font-semibold text-foreground text-sm py-4">Status</TableHead>
                            <TableHead className="font-semibold text-foreground text-sm py-4">Date</TableHead>
                            <TableHead className="font-semibold text-foreground text-sm py-4">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEvents.map((event) => (
                            <TableRow
                              key={event.id}
                              className="hover:bg-accent transition-colors group border-b border-border"
                            >
                              <TableCell className="font-medium text-card-foreground py-4 group-hover:text-primary transition-colors">
                                {event.name}
                              </TableCell>
                              <TableCell className="text-muted-foreground py-4">
                                {event.event_type === 'ticketed' ? (
                                  <Badge className="bg-purple-100 text-purple-800 text-xs font-medium">
                                    🎫 Ticketed
                                  </Badge>
                                ) : event.event_type === 'free' ? (
                                  <Badge className="bg-green-100 text-green-800 text-xs font-medium">
                                    🎉 Free
                                  </Badge>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground py-4">
                                {event.event_category?.name || '-'}
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex flex-col gap-1">
                                  {event.event_type === 'ticketed' ? (
                                    <>
                                      <Badge className="bg-purple-100 text-purple-800 text-xs font-medium">
                                        🎫 Ticketed Event
                                      </Badge>
                                      {event.pricing_info?.formatted_price ? (
                                        <span className="text-xs text-purple-700 font-medium">
                                          {event.pricing_info.formatted_price}
                                        </span>
                                      ) : event.ticket_types && event.ticket_types.length > 0 ? (
                                        <span className="text-xs text-purple-700 font-medium">
                                          From ETB {Math.min(...event.ticket_types.map((t: any) => t.price)).toLocaleString()}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-purple-700 font-medium">
                                          Pricing TBD
                                        </span>
                                      )}
                                      {event.ticket_types && event.ticket_types.length > 0 && (
                                        <span className="text-xs text-purple-600">
                                          {event.ticket_types.length} ticket type{event.ticket_types.length > 1 ? 's' : ''}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <Badge className="bg-green-100 text-green-800 text-xs font-medium">
                                        🎉 Free Event
                                      </Badge>
                                      {event.pricing_info?.guest_types && event.pricing_info.guest_types.length > 0 ? (
                                        <span className="text-xs text-green-700">
                                          {event.pricing_info.guest_types.slice(0, 2).join(', ')}
                                          {event.pricing_info.guest_types.length > 2 && '...'}
                                        </span>
                                      ) : event.guest_types && event.guest_types.length > 0 ? (
                                        <span className="text-xs text-green-700">
                                          {event.guest_types.slice(0, 2).join(', ')}
                                          {event.guest_types.length > 2 && '...'}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-green-700">
                                          Open to all
                                        </span>
                                      )}
                                      {event.guest_types && event.guest_types.length > 0 && (
                                        <span className="text-xs text-green-600">
                                          {event.guest_types.length} guest type{event.guest_types.length > 1 ? 's' : ''}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground py-4">{event.organizer?.name || '-'}</TableCell>
                              <TableCell className="py-4">
                                <Badge className={`${getStatusColor(event.status)} text-xs font-medium`}>
                                  {event.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground py-4">
                                {event.date} {event.time}
                              </TableCell>
                              <TableCell className="py-4">
                                <Link to={`/dashboard/events/${event.id}`}>
                                  <Button size="sm" variant="outline" className="bg-card border-border hover:bg-accent">
                                    <Eye className="w-4 h-4 mr-2" /> View Details
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  {/* Card view for mobile/tablet */}
                  <div className="lg:hidden space-y-4">
                    {filteredEvents.map((event) => {
                      return (
                        <div key={event.id} className="bg-card rounded-2xl shadow-sm border border-border p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-bold text-card-foreground text-lg mb-1">{event.name}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                            </div>
                            <div className="flex flex-col gap-2 ml-3">
                              {event.event_type === 'ticketed' ? (
                                <Badge className="bg-purple-100 text-purple-800 text-xs font-medium">
                                  🎫 Ticketed
                                </Badge>
                              ) : event.event_type === 'free' ? (
                                <Badge className="bg-green-100 text-green-800 text-xs font-medium">
                                  🎉 Free
                                </Badge>
                              ) : null}
                              <Badge className={`${getStatusColor(event.status)} text-xs font-medium`}>
                                {event.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-3 h-3 text-blue-600" />
                              </div>
                              <span>{event.date} {event.time}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                                <MapPin className="w-3 h-3 text-green-600" />
                              </div>
                              <span>{event.location || 'Convention Center'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Users className="w-3 h-3 text-purple-600" />
                              </div>
                              <span>{event.attendee_count || 0}/{event.max_guests || 500} Attendees</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="font-medium">Type:</span>
                              {event.event_type === 'ticketed' ? (
                                <Badge className="bg-purple-100 text-purple-800 text-xs font-medium">
                                  🎫 Ticketed
                                </Badge>
                              ) : event.event_type === 'free' ? (
                                <Badge className="bg-green-100 text-green-800 text-xs font-medium">
                                  🎉 Free
                                </Badge>
                              ) : (
                                <span>-</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="font-medium">Category:</span>
                              <span>{event.event_category?.name || '-'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="font-medium">Pricing:</span>
                              <div className="flex flex-col gap-1">
                                {event.event_type === 'ticketed' ? (
                                  <>
                                    <Badge className="bg-purple-100 text-purple-800 text-xs font-medium">
                                      🎫 Ticketed Event
                                    </Badge>
                                    {event.pricing_info?.formatted_price ? (
                                      <span className="text-xs text-purple-700 font-medium">
                                        {event.pricing_info.formatted_price}
                                      </span>
                                    ) : event.ticket_types && event.ticket_types.length > 0 ? (
                                      <span className="text-xs text-purple-700 font-medium">
                                        From ETB {Math.min(...event.ticket_types.map((t: any) => t.price)).toLocaleString()}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-purple-700 font-medium">
                                        Pricing TBD
                                      </span>
                                    )}
                                    {event.ticket_types && event.ticket_types.length > 0 && (
                                      <span className="text-xs text-purple-600">
                                        {event.ticket_types.length} ticket type{event.ticket_types.length > 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <Badge className="bg-green-100 text-green-800 text-xs font-medium">
                                      🎉 Free Event
                                    </Badge>
                                    {event.pricing_info?.guest_types && event.pricing_info.guest_types.length > 0 ? (
                                      <span className="text-xs text-green-700">
                                        {event.pricing_info.guest_types.slice(0, 2).join(', ')}
                                        {event.pricing_info.guest_types.length > 2 && '...'}
                                      </span>
                                    ) : event.guest_types && event.guest_types.length > 0 ? (
                                      <span className="text-xs text-green-700">
                                        {event.guest_types.slice(0, 2).join(', ')}
                                        {event.guest_types.length > 2 && '...'}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-green-700">
                                        Open to all
                                      </span>
                                    )}
                                    {event.guest_types && event.guest_types.length > 0 && (
                                      <span className="text-xs text-green-600">
                                        {event.guest_types.length} guest type{event.guest_types.length > 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="font-medium">Organizer:</span>
                              <span>{event.organizer?.name || '-'}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <Link to={`/dashboard/events/${event.id}`} className="flex-1">
                              <Button variant="outline" className="w-full bg-white border-gray-200 hover:bg-gray-50">
                                <Eye className="w-4 h-4 mr-2" /> View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Pagination Component */}
          {!loading && !error && filteredEvents.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={totalRecords}
              perPage={perPage}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
            />
          )}

          {!loading && !error && filteredEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-[hsl(var(--primary))]/10 rounded-full flex items-center justify-center mb-6">
                <Calendar className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No events found
              </h3>
              <p className="text-gray-600 text-center max-w-md mb-6">
                Try adjusting your search or filter criteria to find the events you're looking for.
              </p>
              {user?.role !== 'usher' && (
                <Link to="/dashboard/events/create">
                  <Button className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Event
                  </Button>
                </Link>
              )}
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
