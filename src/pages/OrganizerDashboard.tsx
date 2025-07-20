import { useState, useEffect, useRef } from 'react'
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts'
import { Link, useOutletContext, useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Calendar } from '@/components/ui/calendar'
import { useInterval } from '@/hooks/use-interval'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function OrganizerDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { searchQuery } = useOutletContext<{ searchQuery: string }>()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [eventsForDate, setEventsForDate] = useState<any[]>([])
  const [dateEventsLoading, setDateEventsLoading] = useState(false)
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
  const navigate = useNavigate();

  // Real-time chart data state
  const [guestTypeDistribution, setGuestTypeDistribution] = useState<any[]>([]);
  const [eventPopularity, setEventPopularity] = useState<any[]>([]);

  // Add edit event dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Handler to open edit dialog with event data
  const openEditDialog = (event: any) => {
    setEditForm({ ...event });
    setEditDialogOpen(true);
  };

  // Handler to update edit form fields
  const handleEditInput = (field: string, value: any) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  };

  // Handler to submit edit event
  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await api.put(`/events/${editForm.id}`, editForm);
      toast.toast({ title: 'Success', description: 'Event updated successfully!', variant: 'default' });
      setEditDialogOpen(false);
      fetchDashboardData();
    } catch (err: any) {
      toast.toast({ title: 'Error', description: err.response?.data?.error || 'Failed to update event', variant: 'destructive' });
    } finally {
      setEditLoading(false);
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
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
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Remove the useInterval for dashboard refresh
  // useInterval(() => {
  //   fetchDashboardData()
  // }, 10000)

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
    setDateEventsLoading(true)
    api.get('/organizer/events', {
      params: {
        date: selectedDate.toISOString().slice(0, 10),
      },
    })
      .then((res) => setEventsForDate(res.data))
      .catch(() => setEventsForDate([]))
      .finally(() => setDateEventsLoading(false))
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

  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const eventsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const res = await api.get('/events');
        setAllEvents(res.data);
      } catch (err: any) {
        setEventsError(err.response?.data?.message || 'Failed to fetch events');
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
    eventsIntervalRef.current = setInterval(fetchEvents, 150000);
    return () => {
      if (eventsIntervalRef.current) clearInterval(eventsIntervalRef.current);
    };
  }, []);

  // Helper for status color (reuse from Events page)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
      toast.toast({ title: 'Success', description: 'Ushers assigned successfully!', variant: 'default' })
      setAssignDialogOpen(false)
      fetchDashboardData() // Refresh after assigning ushers
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
      toast.toast({ title: 'Success', description: 'Event deleted!', variant: 'default' })
      fetchDashboardData() // Refresh after deleting event
    } catch (err) {
      toast.toast({ title: 'Error', description: 'Failed to delete event.', variant: 'destructive' })
    }
  }

  // Fetch real-time chart data from backend
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [summaryRes, eventsRes] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/events'),
        ]);
        // Guest type distribution
        if (summaryRes.data.guest_type_breakdown) {
          setGuestTypeDistribution(
            Object.entries(summaryRes.data.guest_type_breakdown).map(([name, value]) => ({ name, value }))
          );
        } else {
          setGuestTypeDistribution([]);
        }
        // Event popularity (top events by attendance)
        if (summaryRes.data.top_events_by_attendance && Array.isArray(eventsRes.data)) {
          const eventIdToName: Record<string, string> = {};
          eventsRes.data.forEach((event: any) => {
            eventIdToName[String(event.id)] = event.name;
          });
          setEventPopularity(
            Object.entries(summaryRes.data.top_events_by_attendance).map(([id, attendees]) => ({
              name: eventIdToName[id] || `Event #${id}`,
              attendees,
            }))
          );
        } else {
          setEventPopularity([]);
        }
      } catch (err) {
        setGuestTypeDistribution([]);
        setEventPopularity([]);
      }
    };
    fetchAnalytics();
  }, []);

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
            Welcome{user && (user as any).name ? `, ${(user as any).name}` : ''}!
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
            <div className="w-full h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={eventPerformance} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="registrations" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Registrations" />
                  <Area type="monotone" dataKey="attendance" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Attendance" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          {/* Upcoming Events (Realtime) */}
          <DashboardCard title="Upcoming Events (Realtime)">
            {eventsLoading && <div className="text-center py-8">Loading events...</div>}
            {eventsError && <div className="text-center py-8 text-red-500">{eventsError}</div>}
            {/* Table for desktop, cards for mobile */}
            <div className="hidden lg:block bg-white shadow-lg rounded-xl overflow-x-auto p-4">
              <Table className="min-w-full">
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="font-bold text-gray-700 text-base">Name</TableHead>
                    <TableHead className="font-bold text-gray-700 text-base">Status</TableHead>
                    <TableHead className="font-bold text-gray-700 text-base">Date</TableHead>
                    <TableHead className="font-bold text-gray-700 text-base">Location</TableHead>
                    <TableHead className="font-bold text-gray-700 text-base">Attendees</TableHead>
                    <TableHead className="font-bold text-gray-700 text-base">Registration Progress</TableHead>
                    <TableHead className="font-bold text-gray-700 text-base">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allEvents
                    .filter(event => event.status === 'active' || event.status === 'upcoming')
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map(event => {
                      const attendeeCount = event.attendee_count || 0;
                      const attendeeLimit = event.max_guests || 500;
                      const registrationProgress = Math.min(
                        Math.round((attendeeCount / attendeeLimit) * 100),
                        100
                      );
                      return (
                        <TableRow key={event.id} className="hover:bg-blue-50 transition-colors group text-gray-900">
                          <TableCell className="font-semibold text-base group-hover:text-blue-700 transition-colors">{event.name}</TableCell>
                          <TableCell><Badge className={getStatusColor(event.status)}>{event.status}</Badge></TableCell>
                          <TableCell>{event.date} {event.time}</TableCell>
                          <TableCell>{event.location || 'Convention Center'}</TableCell>
                          <TableCell>{attendeeCount}/{attendeeLimit}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>{registrationProgress}%</span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-2 bg-purple-400 rounded-full" style={{ width: `${registrationProgress}%` }}></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/events/${event.id}`)}>
                              <Eye className="w-4 h-4" /> View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {allEvents.filter(event => event.status === 'active' || event.status === 'upcoming').length === 0 && !eventsLoading && !eventsError && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-400">No upcoming events.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Card view for mobile/tablet */}
            <div className="lg:hidden flex flex-col gap-4">
              {allEvents
                .filter(event => event.status === 'active' || event.status === 'upcoming')
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(event => {
                  const attendeeCount = event.attendee_count || 0;
                  const attendeeLimit = event.max_guests || 500;
                  const registrationProgress = Math.min(
                    Math.round((attendeeCount / attendeeLimit) * 100),
                    100
                  );
                  return (
                    <div key={event.id} className="rounded-lg border bg-white shadow-sm p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-600 text-lg">{event.name}</span>
                        <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                      </div>
                      <div className="text-sm text-gray-500">{event.date} {event.time} • {event.location || 'Convention Center'}</div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{attendeeCount}/{attendeeLimit} Attendees</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span>Progress:</span>
                        <span>{registrationProgress}%</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-2 bg-purple-400 rounded-full" style={{ width: `${registrationProgress}%` }}></div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/dashboard/events/${event.id}`)}>
                          <Eye className="w-4 h-4" /> View
                        </Button>
                      </div>
                    </div>
                  );
                })}
              {allEvents.filter(event => event.status === 'active' || event.status === 'upcoming').length === 0 && !eventsLoading && !eventsError && (
                <div className="text-center py-8 text-gray-400">No upcoming events.</div>
              )}
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
          {/* Pie Chart for Guest Type Distribution */}
          <DashboardCard title="Guest Type Distribution">
            <div className="w-full h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={guestTypeDistribution.length > 0 ? guestTypeDistribution : []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {['#3b82f6', '#10b981', '#f59e42', '#a21caf', '#ef4444', '#6366f1'].map((color, idx) => (
                      <Cell key={idx} fill={color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>
          {/* Bar Chart for Event Popularity */}
          <DashboardCard title="Event Popularity">
            <div className="w-full h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventPopularity.length > 0 ? eventPopularity : []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="attendees" fill="#3b82f6" name="Attendees" />
                </BarChart>
              </ResponsiveContainer>
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
            <Link to="/messages" className="block mt-4" tabIndex={-1} aria-disabled="true" title="Coming Soon!" onClick={e => e.preventDefault()}>
              <Button variant="outline" size="sm" className="w-full">Messages (Coming Soon)</Button>
            </Link>
          </DashboardCard>
          {/* Quick Actions */}
          <DashboardCard title="Quick Actions">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      {/* Edit Event Dialog removed */}
    </div>
  )
}