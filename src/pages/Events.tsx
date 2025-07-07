import { useState, useEffect } from 'react'
import {
  Calendar,
  Users,
  MapPin,
  Plus,
  Search,
  Filter,
  Eye,
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { user } = useAuth()

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      setError(null)
      try {
        // All users now use the same endpoint, but the backend handles role-based filtering
        const res = await api.get('/events')
        setEvents(res.data)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch events')
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [user?.role])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
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
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all-events" className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user?.role === 'usher' ? 'My Assigned Events' : 'Events'}
            </h1>
            <p className="text-gray-600 mt-1">
              {user?.role === 'usher' 
                ? 'View and manage events you are assigned to as an usher'
                : 'Manage and monitor all your events'
              }
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="all-events">
              {user?.role === 'usher' ? 'Assigned Events' : 'All Events'}
            </TabsTrigger>
            {user?.role !== 'usher' && (
              <TabsTrigger value="settings">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="all-events">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {user?.role === 'usher' ? 'Assigned Events' : 'All Events'}
            </h2>
            {user?.role !== 'usher' && (
              <Link to="/dashboard/events/create">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </Link>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
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

          {/* Loading/Error States */}
          {loading && (
            <div className="text-center py-12">Loading events...</div>
          )}
          {error && (
            <div className="text-center py-12 text-red-500">{error}</div>
          )}

          {/* Events Grid or List */}
          {!loading && !error && (
            <div className="mt-6">
              {(user?.role === 'organizer' || user?.role === 'usher') ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {filteredEvents.map((event) => {
                    // Calculate registration progress
                    const attendeeCount = event.attendee_count || 0
                    const attendeeLimit = event.attendee_limit || 500
                    const registrationProgress = Math.min(
                      Math.round((attendeeCount / attendeeLimit) * 100),
                      100
                    )
                    return (
                      <div key={event.id} className="">
                        <Card className="h-full flex flex-col justify-between shadow-xl border-0 hover:shadow-2xl transition-shadow duration-300 bg-white/90 backdrop-blur-md">
                          {/* Event Image */}
                          <div className="relative h-40 sm:h-48 w-full rounded-t-2xl overflow-hidden">
                            {event.image ? (
                              <img
                                src={event.image}
                                alt={event.name}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full text-gray-300 bg-gradient-to-br from-blue-100 to-purple-100">
                                <Calendar className="w-16 h-16" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col flex-1 p-4 gap-2">
                            {/* Name and Status */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-1">
                              <h3
                                className="text-base sm:text-lg font-bold text-gray-900 truncate"
                                title={event.name}
                              >
                                {event.name}
                              </h3>
                              <span className="sm:ml-2">
                                <Badge className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                  {event.status}
                                </Badge>
                              </span>
                            </div>
                            {/* Description */}
                            <div className="text-gray-600 text-xs sm:text-sm mb-1 line-clamp-2">
                              {event.description}
                            </div>
                            {/* Date, Location, Attendees */}
                            <div className="flex flex-col gap-1 text-gray-500 text-xs sm:text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {event.date} {event.time}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span
                                  className="truncate"
                                  title={event.location || 'Convention Center'}
                                >
                                  {event.location || 'Convention Center'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>
                                  {attendeeCount}/{attendeeLimit} attendees
                                </span>
                              </div>
                            </div>
                            {/* Registration Progress */}
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Registration Progress</span>
                                <span>{registrationProgress}%</span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-2 bg-purple-400 rounded-full"
                                  style={{ width: `${registrationProgress}%` }}
                                ></div>
                              </div>
                            </div>
                            {/* Organizer */}
                            <div className="text-xs text-gray-500 mt-2">
                              Organized by{' '}
                              <span className="font-semibold text-gray-700">
                                {event.organizer?.name || 'John Smith'}
                              </span>
                            </div>
                            {/* Usher Tasks */}
                            {user?.role === 'usher' && event.pivot?.tasks && (
                              <div className="text-xs text-gray-500 mt-2">
                                <span className="font-semibold text-gray-700">Your Tasks:</span>
                                <div className="mt-1">
                                  {JSON.parse(event.pivot.tasks).map((task: string, index: number) => (
                                    <div key={index} className="text-gray-600">• {task}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-2 p-4 pt-0">
                            <Link
                              to={`/dashboard/events/${event.id}`}
                              className="flex-1"
                            >
                              <Button
                                variant="outline"
                                className="w-full flex items-center justify-center gap-2"
                              >
                                <Eye className="w-4 h-4" /> 
                                {user?.role === 'usher' ? 'Manage Event' : 'View Details'}
                              </Button>
                            </Link>
                          </div>
                        </Card>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white shadow-lg rounded-xl overflow-x-auto p-4">
                  <Table className="min-w-full">
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead className="font-bold text-gray-700 text-base">
                          Name
                        </TableHead>
                        <TableHead className="font-bold text-gray-700 text-base">
                          Type
                        </TableHead>
                        <TableHead className="font-bold text-gray-700 text-base">
                          Category
                        </TableHead>
                        <TableHead className="font-bold text-gray-700 text-base">
                          Organizer
                        </TableHead>
                        <TableHead className="font-bold text-gray-700 text-base">
                          Status
                        </TableHead>
                        <TableHead className="font-bold text-gray-700 text-base">
                          Date
                        </TableHead>
                        <TableHead className="font-bold text-gray-700 text-base">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((event) => (
                        <TableRow
                          key={event.id}
                          className="hover:bg-blue-50 transition-colors group text-gray-900"
                        >
                          <TableCell className="font-semibold text-base group-hover:text-blue-700 transition-colors">
                            {event.name}
                          </TableCell>
                          <TableCell>{event.event_type?.name || '-'}</TableCell>
                          <TableCell>
                            {event.event_category?.name || '-'}
                          </TableCell>
                          <TableCell>{event.organizer?.name || '-'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(event.status)}>
                              {event.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {event.date} {event.time}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Link to={`/dashboard/events/${event.id}`}>
                                <Button size="sm" variant="outline">
                                  <Eye className="w-4 h-4" /> View Details
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
            </div>
          )}

          {!loading && !error && filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No events found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search or filter criteria
              </p>
              <Link to="/dashboard/events/create">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Event
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <DashboardCard title="Event Settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <EventCategoryManager />
              <EventTypeManager />
            </div>
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
