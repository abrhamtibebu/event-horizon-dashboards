import { useState, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
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
  DollarSign,
  Edit,
  Trash2,
  X,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { MetricCard } from '@/components/MetricCard'
import { DashboardCard } from '@/components/DashboardCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { Link, useOutletContext } from 'react-router-dom'
import api from '@/lib/api'
import { Calendar } from '@/components/ui/calendar'

export default function OrganizerDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { searchQuery } = useOutletContext<{ searchQuery: string }>()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [eventsForDate, setEventsForDate] = useState<any[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [monthEvents, setMonthEvents] = useState<any[]>([])
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
  const [eventDetails, setEventDetails] = useState<any | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  useEffect(() => {
    const fetchOrganizerData = async () => {
      try {
        setLoading(true)
        // NOTE: This assumes a single /dashboard/organizer endpoint.
        const response = await api.get('/dashboard/organizer')
        setDashboardData(response.data)
        setError(null)
      } catch (err: any) {
        let message = 'Failed to fetch organizer dashboard data.'
        if (err.response && err.response.data && err.response.data.error) {
          message = err.response.data.error
        } else if (err.message) {
          message = err.message
        }
        setError(message)
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizerData()
  }, [])

  // Fetch all events for the visible month
  useEffect(() => {
    const start = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1)
    const end = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0)
    api.get('/organizer/events', {
      params: {
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
      },
    })
      .then((res) => setMonthEvents(res.data))
      .catch(() => setMonthEvents([]))
  }, [calendarMonth])

  // Fetch events for selected date
  useEffect(() => {
    if (!selectedDate) {
      setEventsForDate([])
      return
    }
    setEventsLoading(true)
    api.get('/organizer/events', {
      params: {
        date: selectedDate.toISOString().slice(0, 10),
      },
    })
      .then((res) => setEventsForDate(res.data))
      .catch(() => setEventsForDate([]))
      .finally(() => setEventsLoading(false))
  }, [selectedDate])

  // Mark days with events
  const eventDates = monthEvents.map((e) => new Date(e.date))
  const modifiers = {
    hasEvent: eventDates,
  }
  const modifiersClassNames = {
    hasEvent: 'bg-blue-200 border-blue-500 border-2 text-blue-900',
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/events/${eventId}`)
      setEventsForDate((prev) => prev.filter((e) => e.id !== eventId))
      // Optionally, refresh dashboardData/myEvents if needed
    } catch (err) {
      alert('Failed to delete event.')
    }
  }

  if (loading) return <div>Loading dashboard...</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (!dashboardData) return <div>No dashboard data available.</div>

  const {
    keyMetrics,
    eventPerformance,
    myEvents,
    recentMessages,
    upcomingTasks,
  } = dashboardData

  // Example: filter recentMessages and myEvents by searchQuery
  const filteredMessages =
    searchQuery && recentMessages
      ? recentMessages.filter(
          (msg: any) =>
            msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.body?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : recentMessages
  const filteredEvents =
    searchQuery && myEvents
      ? myEvents.filter(
          (event: any) =>
            event.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : myEvents

  return (
    <div className="space-y-6">
      {/* Removed duplicate <Header onSearch={setSearchQuery} /> */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="My Events"
              value={keyMetrics?.myEvents?.value || 'N/A'}
              icon={<CalendarIcon className="w-6 h-6 text-blue-600" />}
              trend={keyMetrics?.myEvents?.trend}
            />
            <MetricCard
              title="Total Attendees"
              value={keyMetrics?.totalAttendees?.value || 'N/A'}
              icon={<Users className="w-6 h-6 text-purple-600" />}
              trend={keyMetrics?.totalAttendees?.trend}
            />
            <MetricCard
              title="Total Revenue"
              value={keyMetrics?.totalRevenue?.value || 'N/A'}
              icon={<DollarSign className="w-6 h-6 text-green-600" />}
              trend={keyMetrics?.totalRevenue?.trend}
            />
            <MetricCard
              title="Unread Messages"
              value={keyMetrics?.unreadMessages?.value || 'N/A'}
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
                {filteredEvents?.map((event: any) => (
                  <div key={event.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {event.name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
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
                        <span>
                          {event.attendees}/{event.maxAttendees}
                        </span>
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
                      <Progress
                        value={event.registrationProgress}
                        className="h-2"
                      />
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Link to={`/events/${event.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>

            <DashboardCard title="Upcoming Tasks">
              <div className="space-y-3">
                {upcomingTasks?.map((task: any) => (
                  <div
                    key={task.id}
                    className={`flex justify-between items-center p-3 rounded-lg ${getPriorityColor(
                      task.priority
                    )}`}
                  >
                    <span className="font-medium">{task.task}</span>
                    <Badge variant="secondary">{task.due}</Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                View All Tasks
              </Button>
            </DashboardCard>
          </div>

          {/* Recent Messages */}
          {filteredMessages && (
            <DashboardCard title="Recent Messages (Filtered)">
              <div className="space-y-4">
                {filteredMessages.map((message: any) => (
                  <div key={message.id} className="flex items-start gap-4">
                    {message.unread && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                    )}
                    <div className={!message.unread ? 'ml-5' : ''}>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {message.from}
                        </p>
                        <p className="text-xs text-gray-500">{message.time}</p>
                      </div>
                      <p className="text-sm text-gray-600">{message.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/messages" className="block mt-4">
                <Button variant="outline" size="sm" className="w-full">
                  View All Messages
                </Button>
              </Link>
            </DashboardCard>
          )}

          {/* Example usage of filteredEvents */}
          {filteredEvents && (
            <DashboardCard title="My Events (Filtered)">
              <ul>
                {filteredEvents.map((event: any, idx: number) => (
                  <li key={idx}>{event.name}</li>
                ))}
              </ul>
            </DashboardCard>
          )}
        </div>
        {/* Calendar Widget */}
        <div className="flex flex-col gap-6">
          <DashboardCard title="Calendar">
            <div className="flex flex-col items-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-lg border shadow-sm"
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
              />
              <div className="mt-4 w-full">
                <h4 className="font-semibold text-gray-800 text-base mb-2 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-500" /> Events on {selectedDate ? selectedDate.toLocaleDateString() : '...'}
                </h4>
                {eventsLoading ? (
                  <div className="text-gray-500 text-sm">Loading events...</div>
                ) : eventsForDate.length === 0 ? (
                  <div className="text-gray-400 text-sm">No scheduled events.</div>
                ) : (
                  <ul className="space-y-2">
                    {eventsForDate.map((event) => (
                      <li
                        key={event.id}
                        className={`border-l-4 p-2 rounded flex flex-col gap-1 ${getStatusColor(event.status)}`}
                        style={{ borderColor: undefined }}
                      >
                        <button
                          className="font-medium text-left underline hover:text-blue-700"
                          onClick={() => { setEventDetails(event); setDetailsDialogOpen(true); }}
                        >
                          {event.name}
                        </button>
                        <span className="text-xs text-gray-600">{event.time} @ {event.location}</span>
                        <div className="flex gap-2 mt-1">
                          <Link to={`/events/${event.id}`}><Button size="xs" variant="outline"><Eye className="w-4 h-4" /> View</Button></Link>
                          <Link to={`/events/${event.id}/edit`}><Button size="xs" variant="outline"><Edit className="w-4 h-4" /> Edit</Button></Link>
                          <Button size="xs" variant="destructive" onClick={() => handleDeleteEvent(event.id)}><Trash2 className="w-4 h-4" /> Delete</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </DashboardCard>
          {/* Event Details Dialog */}
          <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{eventDetails?.name}</DialogTitle>
                <DialogDescription>
                  <div className="flex flex-col gap-2">
                    <span><CalendarIcon className="inline w-4 h-4 mr-1" /> {eventDetails?.date}</span>
                    <span><Clock className="inline w-4 h-4 mr-1" /> {eventDetails?.time}</span>
                    <span><MapPin className="inline w-4 h-4 mr-1" /> {eventDetails?.location}</span>
                    <span><Users className="inline w-4 h-4 mr-1" /> {eventDetails?.attendees} / {eventDetails?.maxAttendees}</span>
                    <span><Badge className={getStatusColor(eventDetails?.status)}>{eventDetails?.status}</Badge></span>
                    <span className="block mt-2 text-gray-700">{eventDetails?.description}</span>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-2 mt-4">
                <Link to={`/events/${eventDetails?.id}`}><Button variant="outline"><Eye className="w-4 h-4" /> View</Button></Link>
                <Link to={`/events/${eventDetails?.id}/edit`}><Button variant="outline"><Edit className="w-4 h-4" /> Edit</Button></Link>
                <Button variant="destructive" onClick={() => { handleDeleteEvent(eventDetails?.id); setDetailsDialogOpen(false); }}><Trash2 className="w-4 h-4" /> Delete</Button>
                <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}><X className="w-4 h-4" /> Close</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
