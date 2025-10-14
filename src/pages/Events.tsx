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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function Events() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pricingFilter, setPricingFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { user } = useAuth()
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debug logging
  console.log('Events component rendered, user:', user?.id)

  useEffect(() => {
    console.log('Events useEffect triggered, user?.id:', user?.id)
    const fetchEvents = async () => {
      setLoading(true)
      setError(null)
      try {
        // All users now use the same endpoint, but the backend handles role-based filtering
        const res = await api.get('/events')
        console.log('[Events] API Response:', res.data)
        setEvents(res.data)
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
  }, [user?.id]) // Only depend on user ID, not the entire user object

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' || event.status === statusFilter
    const matchesPricing =
      pricingFilter === 'all' || event.event_type === pricingFilter
    return matchesSearch && matchesStatus && matchesPricing
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <Tabs defaultValue="all-events" className="space-y-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {user?.role === 'usher' ? 'My Assigned Events' : 'Events'}
              </h1>
              <p className="text-gray-600">
                {user?.role === 'usher' 
                  ? 'View and manage events you are assigned to as an usher'
                  : 'Manage and monitor all your events'
                }
              </p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="mt-6">
            <TabsList className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm">
              <TabsTrigger 
                value="all-events"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                {user?.role === 'usher' ? 'Assigned Events' : 'All Events'}
              </TabsTrigger>
              {user?.role !== 'usher' && (
                <TabsTrigger 
                  value="settings"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {user?.role === 'usher' ? 'Assigned Events' : 'All Events'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                </p>
              </div>
              {user?.role !== 'usher' && (
                <Link to="/dashboard/events/create">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </Link>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search events by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-gray-50 border-gray-200 focus:bg-white">
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
              <Select value={pricingFilter} onValueChange={setPricingFilter}>
                <SelectTrigger className="w-48 bg-gray-50 border-gray-200 focus:bg-white">
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
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Ticketed Events</p>
                    <p className="text-xl font-bold text-purple-900">
                      {events.filter(e => e.event_type === 'ticketed').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">Free Events</p>
                    <p className="text-xl font-bold text-green-900">
                      {events.filter(e => e.event_type === 'free').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Events</p>
                    <p className="text-xl font-bold text-blue-900">
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
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <div className="text-lg font-medium text-gray-600">Loading events...</div>
              <div className="text-sm text-gray-500 mt-2">Gathering your event data</div>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-lg font-medium text-gray-900 mb-2">Failed to load events</div>
              <div className="text-gray-600 mb-6">{error}</div>
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
              {(user?.role === 'organizer' || user?.role === 'usher') ? (
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
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300">
                          {/* Event Image */}
                          <div className="relative h-48 w-full overflow-hidden">
                            {event.event_image ? (
                              <img
                                                src={getImageUrl(event.event_image)}
                                alt={event.name}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-100">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                  <Calendar className="w-8 h-8 text-white" />
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
                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2" title={event.name}>
                              {event.name}
                            </h3>
                            
                            {/* Description */}
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                              {event.description}
                            </p>
                            
                            {/* Event Details */}
                            <div className="space-y-3 mb-4">
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Calendar className="w-4 h-4 text-blue-600" />
                                </div>
                                <span>{event.date} {event.time}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                  <MapPin className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="truncate" title={event.location || 'Convention Center'}>
                                  {event.location || 'Convention Center'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                  <Users className="w-4 h-4 text-purple-600" />
                                </div>
                                <span>{attendeeCount}/{attendeeLimit} attendees</span>
                              </div>
                            </div>
                            
                            {/* Registration Progress */}
                            <div className="mb-4">
                              <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Registration Progress</span>
                                <span className="font-semibold">{registrationProgress}%</span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300"
                                  style={{ width: `${registrationProgress}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            {/* Usher Tasks */}
                            {user?.role === 'usher' && event.pivot?.tasks && (
                              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                <div className="text-sm font-semibold text-blue-800 mb-2">Your Tasks:</div>
                                <div className="space-y-1">
                                  {JSON.parse(event.pivot.tasks).map((task: string, index: number) => (
                                    <div key={index} className="text-sm text-blue-700 flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
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
                                  className="w-full bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
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
                  <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900">All Events Overview</h3>
                      <p className="text-sm text-gray-600 mt-1">Comprehensive view of all events in the system</p>
                    </div>
                    <div className="overflow-x-auto">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold text-gray-700 text-sm py-4">Name</TableHead>
                            <TableHead className="font-semibold text-gray-700 text-sm py-4">Type</TableHead>
                            <TableHead className="font-semibold text-gray-700 text-sm py-4">Category</TableHead>
                            <TableHead className="font-semibold text-gray-700 text-sm py-4">Pricing</TableHead>
                            <TableHead className="font-semibold text-gray-700 text-sm py-4">Organizer</TableHead>
                            <TableHead className="font-semibold text-gray-700 text-sm py-4">Status</TableHead>
                            <TableHead className="font-semibold text-gray-700 text-sm py-4">Date</TableHead>
                            <TableHead className="font-semibold text-gray-700 text-sm py-4">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEvents.map((event) => (
                            <TableRow
                              key={event.id}
                              className="hover:bg-gray-50 transition-colors group border-b border-gray-100"
                            >
                              <TableCell className="font-medium text-gray-900 py-4 group-hover:text-blue-700 transition-colors">
                                {event.name}
                              </TableCell>
                              <TableCell className="text-gray-600 py-4">
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
                              <TableCell className="text-gray-600 py-4">
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
                              <TableCell className="text-gray-600 py-4">{event.organizer?.name || '-'}</TableCell>
                              <TableCell className="py-4">
                                <Badge className={`${getStatusColor(event.status)} text-xs font-medium`}>
                                  {event.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-gray-600 py-4">
                                {event.date} {event.time}
                              </TableCell>
                              <TableCell className="py-4">
                                <Link to={`/dashboard/events/${event.id}`}>
                                  <Button size="sm" variant="outline" className="bg-white border-gray-200 hover:bg-gray-50">
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
                        <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 text-lg mb-1">{event.name}</h3>
                              <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
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
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-3 h-3 text-blue-600" />
                              </div>
                              <span>{event.date} {event.time}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                                <MapPin className="w-3 h-3 text-green-600" />
                              </div>
                              <span>{event.location || 'Convention Center'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Users className="w-3 h-3 text-purple-600" />
                              </div>
                              <span>{event.attendee_count || 0}/{event.max_guests || 500} Attendees</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
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
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span className="font-medium">Category:</span>
                              <span>{event.event_category?.name || '-'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
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
                            <div className="flex items-center gap-3 text-sm text-gray-600">
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

          {!loading && !error && filteredEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                <Calendar className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No events found
              </h3>
              <p className="text-gray-600 text-center max-w-md mb-6">
                Try adjusting your search or filter criteria to find the events you're looking for.
              </p>
              {user?.role !== 'usher' && (
                <Link to="/dashboard/events/create">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Event
                  </Button>
                </Link>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Event Settings</h3>
                <p className="text-sm text-gray-600">Manage event categories and types</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <SettingsIcon className="w-4 h-4 text-white" />
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
