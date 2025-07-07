import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Users,
  MapPin,
  Clock,
  Search,
  Filter,
  UserCheck,
  Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import api from '@/lib/api'

export default function UsherEvents() {
  const { toast } = useToast()
  const { user } = useAuth()
  
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const fetchUsherEvents = async () => {
      try {
        setLoading(true)
        const response = await api.get('/usher/events')
        setEvents(response.data)
        setError(null)
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch assigned events')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsherEvents()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTasks = (event: any) => {
    if (!event.pivot || !event.pivot.tasks) return []
    try {
      const tasks = typeof event.pivot.tasks === 'string' ? JSON.parse(event.pivot.tasks) : event.pivot.tasks
      return Array.isArray(tasks) ? tasks : []
    } catch {
      return []
    }
  }

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchTerm || 
      event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) return <div className="p-8 text-center">Loading your assigned events...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Assigned Events</h1>
          <p className="text-gray-600 mt-1">Manage events you've been assigned to</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search events by name or location..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'No events match your current filters.' 
                : 'You haven\'t been assigned to any events yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const tasks = getTasks(event)
            return (
              <Card key={event.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {event.name}
                    </CardTitle>
                    <Badge className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Event Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{event.attendee_count || 0} attendees</span>
                    </div>
                  </div>

                  {/* Assigned Tasks */}
                  {tasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Your Tasks:</h4>
                      <ul className="space-y-1">
                        {tasks.slice(0, 3).map((task: string, index: number) => (
                          <li key={index} className="text-xs text-gray-600 flex items-center gap-1">
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            {task}
                          </li>
                        ))}
                        {tasks.length > 3 && (
                          <li className="text-xs text-gray-500">
                            +{tasks.length - 3} more tasks
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                                     {/* Action Buttons */}
                   <div className="flex gap-2 pt-2">
                     <Link to={`/dashboard/events/${event.id}`} className="flex-1">
                       <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                         <Users className="w-4 h-4 mr-2" />
                         Manage Event
                       </Button>
                     </Link>
                    <Button variant="outline" size="icon" title="Quick Check-in">
                      <UserCheck className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" title="Print Badges">
                      <Printer className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Summary Stats */}
      {filteredEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{filteredEvents.length}</div>
                <div className="text-sm text-gray-600">Total Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredEvents.filter(e => e.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Active Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredEvents.filter(e => e.status === 'upcoming').length}
                </div>
                <div className="text-sm text-gray-600">Upcoming Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {filteredEvents.reduce((sum, e) => sum + (e.attendee_count || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Attendees</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 