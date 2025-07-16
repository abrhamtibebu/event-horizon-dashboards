import { useState, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  Users,
  MessageSquare,
  DollarSign,
  Clock,
  MapPin,
  Eye,
  Edit,
  Trash2,
  X,
  UserPlus,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { MetricCard } from '@/components/MetricCard'
import { DashboardCard } from '@/components/DashboardCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { Link, useOutletContext } from 'react-router-dom'
import api from '@/lib/api'
import { Calendar } from '@/components/ui/calendar'
import { useInterval } from '@/hooks/use-interval'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'

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
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [selectedUshers, setSelectedUshers] = useState<number[]>([])
  const [assigning, setAssigning] = useState(false)
  const toast = useToast()
  const { user } = useAuth();

  // Fetch dashboard data
  useEffect(() => {
    const fetchOrganizerData = async () => {
      try {
        setLoading(true)
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
        toast.toast({ title: 'Error', description: message, variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    fetchOrganizerData()
  }, [])

  // Real-time polling for dashboard data (every 10 seconds)
  useInterval(() => {
    const fetchOrganizerData = async () => {
      try {
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
        toast.toast({ title: 'Error', description: message, variant: 'destructive' })
      }
    }
    fetchOrganizerData()
  }, 10000)

  // Fetch all events for the visible month (for calendar markers)
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

  // Calendar event markers
  // Normalize event dates to midnight for comparison
  const eventDates = monthEvents.map((e) => {
    const d = new Date(e.start_date || e.date)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  })

  // Helper to check if a date has an event
  const hasEvent = (date: Date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return eventDates.includes(d.getTime())
  }

  // Helper to get events for a date
  const getEventsForDay = (date: Date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return monthEvents.filter(e => {
      const ed = new Date(e.start_date || e.date)
      ed.setHours(0, 0, 0, 0)
      return ed.getTime() === d.getTime()
    })
  }

  // Custom day content for calendar
  const dayContent = (date: Date) => {
    const events = getEventsForDay(date)
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative group cursor-pointer">
              <span>{date.getDate()}</span>
              {events.length > 0 && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500 mt-0.5"></span>
              )}
            </div>
          </TooltipTrigger>
          {events.length > 0 && (
            <TooltipContent side="top" align="center">
              <div className="text-xs font-semibold max-w-xs whitespace-pre-line">
                {events.map(ev => ev.name).join(', ')}
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    )
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

  // Assign ushers dialog logic
  const openAssignDialog = (eventId: number) => {
    setSelectedEventId(eventId)
    const event = dashboardData?.events?.find((e: any) => e.id === eventId)
    const assigned = event?.ushers?.map((u: any) => u.id) || []
    setSelectedUshers(assigned)
    setAssignDialogOpen(true)
  }
  const handleAssignUshers = async () => {
    if (!selectedEventId || selectedUshers.length === 0) return
    setAssigning(true)
    try {
      await api.post(`/events/${selectedEventId}/ushers`, {
        ushers: selectedUshers.map(id => ({ id, tasks: [] })),
      })
      toast.toast({ title: 'Success', description: 'Ushers assigned successfully!', variant: 'success' })
      setAssignDialogOpen(false)
    } catch (err: any) {
      toast.toast({ title: 'Error', description: err.response?.data?.error || 'Failed to assign ushers', variant: 'destructive' })
    } finally {
      setAssigning(false)
    }
  }

  // Delete event
  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return
    try {
      await api.delete(`/events/${eventId}`)
      toast.toast({ title: 'Success', description: 'Event deleted!', variant: 'success' })
      // Optionally, refresh dashboardData/myEvents if needed
    } catch (err) {
      toast.toast({ title: 'Error', description: 'Failed to delete event.', variant: 'destructive' })
    }
  }

  // Loading skeletons
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-1/3 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <Skeleton className="h-96 w-full col-span-2" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }
  if (error) return <div className="text-red-500">{error}</div>
  if (!dashboardData) return <div>No dashboard data available.</div>

  const { keyMetrics, eventPerformance, myEvents, recentMessages, upcomingTasks, events, ushers } = dashboardData

  // Filtered events/messages by search
  const filteredEvents = searchQuery && myEvents
    ? myEvents.filter((event: any) => event.name?.toLowerCase().includes(searchQuery.toLowerCase()) || event.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : myEvents
  const filteredMessages = searchQuery && recentMessages
    ? recentMessages.filter((msg: any) => msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || msg.body?.toLowerCase().includes(searchQuery.toLowerCase()))
    : recentMessages

  // Modern dashboard layout
  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Welcome{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-gray-500">Today is {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Link to="/dashboard/events/create"><Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"><UserPlus className="w-4 h-4 mr-2" />Create New Event</Button></Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="My Events" value={keyMetrics?.myEvents?.value || 'N/A'} icon={<CalendarIcon className="w-6 h-6 text-blue-600" />} trend={keyMetrics?.myEvents?.trend} />
        <MetricCard title="Total Attendees" value={keyMetrics?.totalAttendees?.value || 'N/A'} icon={<Users className="w-6 h-6 text-purple-600" />} trend={keyMetrics?.totalAttendees?.trend} />
        <MetricCard title="Total Revenue" value={keyMetrics?.totalRevenue?.value || 'N/A'} icon={<DollarSign className="w-6 h-6 text-green-600" />} trend={keyMetrics?.totalRevenue?.trend} />
        <MetricCard title="Unread Messages" value={keyMetrics?.unreadMessages?.value || 'N/A'} icon={<MessageSquare className="w-6 h-6 text-orange-600" />} />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Events, Tasks, Ushers */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Event Performance Chart */}
          <DashboardCard title="Event Performance (Registrations & Attendance)">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={eventPerformance} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Area type="monotone" dataKey="registrations" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Registrations" />
                <Area type="monotone" dataKey="attendance" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Attendance" />
              </AreaChart>
            </ResponsiveContainer>
          </DashboardCard>

          {/* Upcoming Events */}
          <DashboardCard title="Upcoming Events">
            <div className="space-y-4">
              {filteredEvents?.length === 0 && <div className="text-gray-400">No upcoming events.</div>}
              {filteredEvents?.map((event: any) => (
                <div key={event.id} className="p-4 bg-gray-50 rounded-lg shadow flex flex-col gap-2">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{event.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4" />{event.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{event.time}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{event.location}</span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{event.attendees}/{event.maxAttendees}</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />${event.revenue}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span>Registration Progress</span><span>{event.registrationProgress?.toFixed(0) || 0}%</span></div>
                    <Progress value={event.registrationProgress} className="h-2" />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Link to={`/events/${event.id}`}><Button size="sm" variant="outline"><Eye className="w-4 h-4 mr-1" />View</Button></Link>
                    <Link to={`/events/${event.id}/edit`}><Button size="sm" variant="outline"><Edit className="w-4 h-4 mr-1" />Edit</Button></Link>
                    <Button size="sm" variant="outline" onClick={() => openAssignDialog(event.id)}><UserPlus className="w-4 h-4 mr-1" />Assign Ushers</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteEvent(event.id)}><Trash2 className="w-4 h-4 mr-1" />Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>

          {/* Tasks & Ushers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardCard title="Upcoming Tasks">
              <div className="space-y-3">
                {upcomingTasks?.length === 0 && <div className="text-gray-400">No upcoming tasks.</div>}
                {upcomingTasks?.map((task: any) => (
                  <div key={task.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                    <span className="font-medium">{task.title}</span>
                    <Badge variant="secondary">{task.dueDate}</Badge>
                  </div>
                ))}
              </div>
            </DashboardCard>
            <DashboardCard title="My Ushers">
              <ul className="divide-y divide-gray-200">
                {/* Only show ushers assigned to this organizer by admin (i.e., with correct organizer_id and role) */}
                {ushers?.filter((usher: any) => usher.organizer_id === user?.organizer_id && usher.role === 'usher')?.length === 0 && (
                  <li className="py-2 text-gray-500">No ushers found.</li>
                )}
                {ushers?.filter((usher: any) => usher.organizer_id === user?.organizer_id && usher.role === 'usher')?.map((usher: any) => (
                  <li key={usher.id} className="py-2 flex justify-between items-center">
                    <span>{usher.name} <span className="text-xs text-gray-400">({usher.email})</span></span>
                  </li>
                ))}
              </ul>
            </DashboardCard>
          </div>
        </div>
        {/* Right: Calendar, Recent Activity */}
        <div className="flex flex-col gap-8">
          {/* --- Calendar Redesign --- */}
          {/* Replace the DashboardCard for Calendar with a new design */}
          <DashboardCard title={null} className="p-0 bg-white rounded-2xl shadow-none border-none">
            <div className="flex flex-col items-center p-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between w-full mb-2">
                <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-gray-100">
                  <span className="sr-only">Previous month</span>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <div className="text-lg font-semibold text-gray-900">{calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-gray-100">
                  <span className="sr-only">Next month</span>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
              {/* Calendar Grid */}
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                dayContent={date => {
                  const events = getEventsForDay(date)
                  return (
                    <div className="relative flex flex-col items-center justify-center w-8 h-8">
                      <span>{date.getDate()}</span>
                      {events.length > 0 && (
                        <div className="flex gap-0.5 absolute bottom-1 left-1/2 -translate-x-1/2">
                          {events.slice(0,3).map((ev, i) => (
                            <span key={i} className={`w-1.5 h-1.5 rounded-full ${['bg-green-500','bg-blue-500','bg-red-500'][i%3]}`}></span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }}
                className="rounded-xl bg-gray-50 p-2"
                classNames={{
                  day_selected: "bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-md"
                }}
              />
              {/* Event List for Selected Day */}
              <div className="w-full mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Showing all {eventsForDate.length} events</span>
                  <input type="text" placeholder="Search for events ..." className="border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" onChange={e => {
                    const q = e.target.value.toLowerCase();
                    setEventsForDate(monthEvents.filter(ev => ev.name.toLowerCase().includes(q) && new Date(ev.start_date || ev.date).toDateString() === (selectedDate?.toDateString() || '')))
                  }} />
                </div>
                <div className="bg-white rounded-xl divide-y divide-gray-100 shadow-sm">
                  {eventsForDate.length === 0 ? (
                    <div className="text-gray-400 text-center py-6">No events for this day.</div>
                  ) : eventsForDate.map((event, idx) => (
                    <div key={event.id} className={`flex items-center gap-3 px-4 py-3 ${selectedDate && new Date(event.start_date || event.date).toDateString() === selectedDate.toDateString() ? 'bg-red-50' : ''}`}>
                      <span className={`w-2 h-2 rounded-full ${['bg-green-500','bg-blue-500','bg-red-500'][idx%3]}`}></span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{event.name}</div>
                        <div className="text-xs text-gray-500">{new Date(event.start_date || event.date).toLocaleString([], { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}{event.end_date ? ` - ${new Date(event.end_date).toLocaleString([], { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DashboardCard>
          {/* Recent Activity / Messages */}
          <DashboardCard title="Recent Activity">
            <div className="space-y-4">
              {filteredMessages?.length === 0 && <div className="text-gray-400">No recent messages.</div>}
              {filteredMessages?.map((message: any) => (
                <div key={message.id} className="flex items-start gap-4">
                  {message.unread && <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>}
                  <div className={!message.unread ? 'ml-5' : ''}>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{message.from}</p>
                      <p className="text-xs text-gray-500">{message.time}</p>
                    </div>
                    <p className="text-sm text-gray-600">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/messages" className="block mt-4">
              <Button variant="outline" size="sm" className="w-full">View All Messages</Button>
            </Link>
          </DashboardCard>
          {/* Quick Actions */}
          <DashboardCard title="Quick Actions">
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/dashboard/locate-badges"
                className="block p-4 text-center bg-gray-50 hover:bg-gray-100 rounded-lg"
              >
                <MapPin className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <span className="font-medium">Locate Badges</span>
              </Link>
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* Assign Ushers Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Ushers to Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="font-medium mb-2">Select ushers:</div>
            <ul className="max-h-48 overflow-y-auto divide-y divide-gray-200">
              {ushers?.map((usher: any) => (
                <li key={usher.id} className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id={`usher-${usher.id}`}
                    checked={selectedUshers.includes(usher.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedUshers(prev => [...prev, usher.id])
                      } else {
                        setSelectedUshers(prev => prev.filter(id => id !== usher.id))
                      }
                    }}
                  />
                  <label htmlFor={`usher-${usher.id}`}>{usher.name} <span className="text-xs text-gray-400">({usher.email})</span></label>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)} disabled={assigning}>Cancel</Button>
            <Button onClick={handleAssignUshers} disabled={assigning || selectedUshers.length === 0}>{assigning ? 'Assigning...' : 'Assign Ushers'}</Button>
          </div>
        </DialogContent>
      </Dialog>
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
  )
}