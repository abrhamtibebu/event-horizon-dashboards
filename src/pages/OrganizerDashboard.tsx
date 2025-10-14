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
  ZoomIn,
  ZoomOut,
  Maximize2,
  Calendar as CalendarIcon2,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { MetricCard } from '@/components/MetricCard'
import { DashboardCard } from '@/components/DashboardCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, Brush } from 'recharts'
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
import { mockData, isMockMode, getMockData } from '@/lib/mockData'

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

  // Event Performance Chart Zoom State
  const [chartZoomLevel, setChartZoomLevel] = useState<'3months' | '6months' | '1year'>('3months');
  const [showDetailedChart, setShowDetailedChart] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<[number, number]>([0, 0]);

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
      
      if (isMockMode()) {
        // Use mock data in development mode
        const mockDashboardData = await getMockData(mockData.dashboardData)
        setDashboardData(mockDashboardData)
        setError(null)
      } else {
        const response = await api.get('/dashboard/organizer')
        setDashboardData(response.data)
        setError(null)
      }
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
    
    if (isMockMode()) {
      // Use mock data in development mode
      setMonthEvents(mockData.events)
    } else {
      api.get('/organizer/events', {
        params: {
          start_date: start.toISOString().slice(0, 10),
          end_date: end.toISOString().slice(0, 10),
        },
      })
        .then((res) => setMonthEvents(res.data))
        .catch(() => setMonthEvents([]))
    }
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
        if (isMockMode()) {
          // Use mock data in development mode
          const mockEventsData = await getMockData(mockData.events)
          setAllEvents(mockEventsData);
        } else {
          const res = await api.get('/events');
          setAllEvents(res.data);
        }
      } catch (err: any) {
        setEventsError(err.response?.data?.message || 'Failed to fetch events');
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
    // Temporarily disabled polling to prevent reloading issues
    // eventsIntervalRef.current = setInterval(fetchEvents, 150000);
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
        if (isMockMode()) {
          // Use mock data in development mode
          const mockAnalyticsData = await getMockData(mockData.analytics)
          setGuestTypeDistribution([
            { name: 'VIP', value: 25 },
            { name: 'Standard', value: 75 },
            { name: 'Student', value: 50 }
          ]);
          setEventPopularity(mockAnalyticsData.top_events);
        } else {
          const [summaryRes, eventsRes] = await Promise.all([
            api.get('/reports/summary'),
            api.get('/events'),
          ]);
          // Guest type distribution
          if (summaryRes.data.guest_type_breakdown) {
            const processedData = Object.entries(summaryRes.data.guest_type_breakdown)
              .map(([name, value]) => ({ 
                name: name || 'Unknown', 
                value: typeof value === 'number' ? value : parseInt(value) || 0 
              }))
              .filter(item => item.value > 0); // Only include items with positive values
            setGuestTypeDistribution(processedData);
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

  // Helper function to get chart data based on zoom level
  const getChartDataByZoomLevel = (data: any[], level: '3months' | '6months' | '1year') => {
    const monthsMap = {
      '3months': 3,
      '6months': 6,
      '1year': 12
    };
    
    const monthsToShow = monthsMap[level];
    return data.slice(-monthsToShow);
  };

  // Get current chart data based on zoom level
  const currentChartData = getChartDataByZoomLevel(Array.isArray(eventPerformance) ? eventPerformance : [], chartZoomLevel);

  // Filtered events/messages by search
  const filteredEvents = searchQuery && myEvents
    ? myEvents.filter((event: any) => event.name?.toLowerCase().includes(searchQuery.toLowerCase()) || event.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : myEvents
  const filteredMessages = searchQuery && recentMessages
    ? recentMessages.filter((msg: any) => msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || msg.body?.toLowerCase().includes(searchQuery.toLowerCase()))
    : recentMessages

  // Modern dashboard layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
        <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Welcome{user && (user as any).name ? `, ${(user as any).name}` : ''}!
          </h1>
            <p className="text-gray-600">
              Today is {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
        </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-3 mt-6">
          <Link to="/dashboard/events/create">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <UserPlus className="w-4 h-4 mr-2" />
              Create New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm font-medium text-gray-600">My Events</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{keyMetrics?.myEvents?.value || 'N/A'}</div>
            <div className="text-xs text-gray-500">Organized events</div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm font-medium text-gray-600">Total Attendees</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{keyMetrics?.totalAttendees?.value || 'N/A'}</div>
            <div className="text-xs text-gray-500">All participants</div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm font-medium text-gray-600">Total Revenue</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{keyMetrics?.totalRevenue?.value || 'N/A'}</div>
            <div className="text-xs text-gray-500">Event earnings</div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm font-medium text-gray-600">Unread Messages</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{keyMetrics?.unreadMessages?.value || 'N/A'}</div>
            <div className="text-xs text-gray-500">Pending messages</div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Events, Tasks, Ushers */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Event Performance Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Event Performance</h3>
                <p className="text-sm text-gray-600">
                  Registrations & Attendance Trends - Last {chartZoomLevel === '3months' ? '3' : chartZoomLevel === '6months' ? '6' : '12'} months
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChartZoomLevel('3months')}
                    className={`h-8 px-3 text-xs ${chartZoomLevel === '3months' ? 'bg-white shadow-sm' : 'hover:bg-gray-100'}`}
                  >
                    3M
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChartZoomLevel('6months')}
                    className={`h-8 px-3 text-xs ${chartZoomLevel === '6months' ? 'bg-white shadow-sm' : 'hover:bg-gray-100'}`}
                  >
                    6M
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChartZoomLevel('1year')}
                    className={`h-8 px-3 text-xs ${chartZoomLevel === '1year' ? 'bg-white shadow-sm' : 'hover:bg-gray-100'}`}
                  >
                    1Y
                  </Button>
                </div>
                
                {/* Detailed View Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetailedChart(true)}
                  className="bg-white border-gray-200 hover:bg-gray-50"
                >
                  <Maximize2 className="w-4 h-4 mr-1" />
                  Details
                </Button>
                
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentChartData}>
                  <defs>
                    <linearGradient id="registrationGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="registrations" 
                    stackId="1" 
                    stroke="#3b82f6" 
                    fill="url(#registrationGradient)" 
                    name="Registrations" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="attendance" 
                    stackId="2" 
                    stroke="#10b981" 
                    fill="url(#attendanceGradient)" 
                    name="Attendance" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Chart Summary */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-sm font-medium text-blue-700">Total Registrations</div>
                <div className="text-lg font-bold text-blue-900">
                  {currentChartData.reduce((sum, item) => sum + (item.registrations || 0), 0)}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-sm font-medium text-green-700">Total Attendance</div>
                <div className="text-lg font-bold text-green-900">
                  {currentChartData.reduce((sum, item) => sum + (item.attendance || 0), 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Events (Realtime) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
                <p className="text-sm text-gray-600">Real-time event monitoring</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
            </div>
            
            {eventsLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                <div className="text-sm text-gray-600">Loading events...</div>
              </div>
            )}
            {eventsError && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mb-3">
                  <Clock className="w-4 h-4 text-red-600" />
                </div>
                <div className="text-sm text-red-600">{eventsError}</div>
              </div>
            )}
            
            {/* Table for desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700 text-sm py-4">Name</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-sm py-4">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-sm py-4">Date</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-sm py-4">Location</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-sm py-4">Attendees</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-sm py-4">Progress</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-sm py-4">Actions</TableHead>
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
                        <TableRow key={event.id} className="hover:bg-gray-50 transition-colors group border-b border-gray-100">
                          <TableCell className="font-medium text-gray-900 py-4 group-hover:text-blue-700 transition-colors">{event.name}</TableCell>
                          <TableCell className="py-4">
                            <Badge className={`${getStatusColor(event.status)} text-xs font-medium`}>{event.status}</Badge>
                          </TableCell>
                          <TableCell className="text-gray-600 py-4">{event.date} {event.time}</TableCell>
                          <TableCell className="text-gray-600 py-4">{event.location || 'Convention Center'}</TableCell>
                          <TableCell className="text-gray-600 py-4">{attendeeCount}/{attendeeLimit}</TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>{registrationProgress}%</span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300" style={{ width: `${registrationProgress}%` }}></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Button size="sm" variant="outline" className="bg-white border-gray-200 hover:bg-gray-50" onClick={() => navigate(`/dashboard/events/${event.id}`)}>
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {allEvents.filter(event => event.status === 'active' || event.status === 'upcoming').length === 0 && !eventsLoading && !eventsError && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                        <div className="flex flex-col items-center">
                          <Clock className="w-8 h-8 text-gray-300 mb-2" />
                          <span>No upcoming events</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Card view for mobile/tablet */}
            <div className="lg:hidden space-y-4">
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
                    <div key={event.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">{event.name}</h4>
                          <p className="text-xs text-gray-600">{event.date} {event.time} • {event.location || 'Convention Center'}</p>
                      </div>
                        <Badge className={`${getStatusColor(event.status)} text-xs font-medium ml-3`}>{event.status}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                        <div className="w-5 h-5 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Users className="w-3 h-3 text-purple-600" />
                        </div>
                        <span>{attendeeCount}/{attendeeLimit} Attendees</span>
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress:</span>
                        <span>{registrationProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300" style={{ width: `${registrationProgress}%` }}></div>
                      </div>
                      </div>
                      <Button size="sm" variant="outline" className="w-full bg-white border-gray-200 hover:bg-gray-50" onClick={() => navigate(`/dashboard/events/${event.id}`)}>
                        <Eye className="w-4 h-4 mr-2" /> View Details
                        </Button>
                    </div>
                  );
                })}
              {allEvents.filter(event => event.status === 'active' || event.status === 'upcoming').length === 0 && !eventsLoading && !eventsError && (
                <div className="text-center py-12 text-gray-400">
                  <Clock className="w-8 h-8 mx-auto mb-2" />
                  <span>No upcoming events</span>
                </div>
              )}
            </div>
          </div>

          {/* Tasks & Ushers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
                  <p className="text-sm text-gray-600">Task management</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                {upcomingTasks?.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Clock className="w-8 h-8 mx-auto mb-2" />
                    <span>No upcoming tasks</span>
                  </div>
                )}
                {upcomingTasks?.map((task: any) => (
                  <div key={task.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="font-medium text-gray-900">{task.title}</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">{task.dueDate}</Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">My Ushers</h3>
                  <p className="text-sm text-gray-600">Assigned team members</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                {ushers?.filter((usher: any) => usher.organizer_id === user?.organizer_id && usher.role === 'usher')?.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    <span>No ushers found</span>
                  </div>
                )}
                {ushers?.filter((usher: any) => usher.organizer_id === user?.organizer_id && usher.role === 'usher')?.map((usher: any) => (
                  <div key={usher.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{usher.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{usher.name}</div>
                      <div className="text-xs text-gray-500">{usher.email}</div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
          </div>
        </div>
        {/* Right: Charts and Activity */}
        <div className="flex flex-col gap-8">
          {/* Pie Chart for Guest Type Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Guest Type Distribution</h3>
                <p className="text-sm text-gray-600">Attendee categories</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="w-full h-[250px]">
              {guestTypeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                      data={guestTypeDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                      innerRadius={40}
                    outerRadius={80}
                      label={({ name, value, percent }) => {
                        // Only show labels for segments with > 5% or if it's a small number of segments
                        if (percent > 0.05 || guestTypeDistribution.length <= 3) {
                          return `${name} ${(percent * 100).toFixed(0)}%`;
                        }
                        return '';
                      }}
                      labelLine={false}
                    >
                      {['#3b82f6', '#10b981', '#f59e42', '#a21caf', '#ef4444', '#6366f1', '#8b5cf6', '#06b6d4'].map((color, idx) => (
                      <Cell key={idx} fill={color} />
                    ))}
                  </Pie>
                    <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                </PieChart>
              </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-8 h-8 text-gray-400" />
            </div>
                    <p className="text-sm text-gray-500">No guest type data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Bar Chart for Event Popularity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Event Popularity</h3>
                <p className="text-sm text-gray-600">Most attended events</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <BarChart className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventPopularity.length > 0 ? eventPopularity : []}>
                  <defs>
                    <linearGradient id="popularityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="attendees" 
                    fill="url(#popularityGradient)" 
                    name="Attendees"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Recent Activity / Messages */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-600">Latest messages and updates</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="space-y-4">
              {filteredMessages?.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                  <span>No recent messages</span>
                </div>
              )}
              {filteredMessages?.map((message: any) => (
                <div key={message.id} className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  {message.unread && <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>}
                  <div className={!message.unread ? 'ml-5' : ''}>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{message.from}</p>
                      <p className="text-xs text-gray-500">{message.time}</p>
                    </div>
                    <p className="text-sm text-gray-600">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/messages" className="block mt-4" tabIndex={-1} aria-disabled="true" title="Coming Soon!" onClick={e => e.preventDefault()}>
              <Button variant="outline" size="sm" className="w-full bg-white border-gray-200 hover:bg-gray-50">Messages (Coming Soon)</Button>
            </Link>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                <p className="text-sm text-gray-600">Common tasks</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/dashboard/locate-badges"
                className="block p-4 text-center bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all duration-200"
              >
                <MapPin className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <span className="font-medium text-gray-900">Locate Badges</span>
              </Link>
            </div>
          </div>
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

      {/* Detailed Event Performance Chart Modal */}
      <Dialog open={showDetailedChart} onOpenChange={setShowDetailedChart}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon2 className="w-5 h-5" />
              Detailed Event Performance Analysis
            </DialogTitle>
            <DialogDescription>
              Comprehensive view of registrations and attendance trends with interactive zoom capabilities
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Zoom Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Time Range:</span>
                <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChartZoomLevel('3months')}
                    className={`h-8 px-3 text-xs ${chartZoomLevel === '3months' ? 'bg-white shadow-sm' : 'hover:bg-gray-100'}`}
                  >
                    3 Months
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChartZoomLevel('6months')}
                    className={`h-8 px-3 text-xs ${chartZoomLevel === '6months' ? 'bg-white shadow-sm' : 'hover:bg-gray-100'}`}
                  >
                    6 Months
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChartZoomLevel('1year')}
                    className={`h-8 px-3 text-xs ${chartZoomLevel === '1year' ? 'bg-white shadow-sm' : 'hover:bg-gray-100'}`}
                  >
                    1 Year
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                Showing {currentChartData.length} data points
              </div>
            </div>

            {/* Detailed Chart */}
            <div className="w-full h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentChartData}>
                  <defs>
                    <linearGradient id="detailedRegistrationGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="detailedAttendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b"
                    fontSize={14}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={14}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                    labelStyle={{
                      fontWeight: 'bold',
                      color: '#374151'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="registrations" 
                    stackId="1" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fill="url(#detailedRegistrationGradient)" 
                    name="Registrations" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="attendance" 
                    stackId="2" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fill="url(#detailedAttendanceGradient)" 
                    name="Attendance" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="text-sm font-medium text-blue-700">Total Registrations</div>
                <div className="text-2xl font-bold text-blue-900">
                  {currentChartData.reduce((sum, item) => sum + (item.registrations || 0), 0)}
                </div>
                <div className="text-xs text-blue-600 mt-1">All time periods</div>
              </div>
              
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <div className="text-sm font-medium text-green-700">Total Attendance</div>
                <div className="text-2xl font-bold text-green-900">
                  {currentChartData.reduce((sum, item) => sum + (item.attendance || 0), 0)}
                </div>
                <div className="text-xs text-green-600 mt-1">All time periods</div>
              </div>
              
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <div className="text-sm font-medium text-purple-700">Avg. Attendance Rate</div>
                <div className="text-2xl font-bold text-purple-900">
                  {(() => {
                    const totalReg = currentChartData.reduce((sum, item) => sum + (item.registrations || 0), 0);
                    const totalAtt = currentChartData.reduce((sum, item) => sum + (item.attendance || 0), 0);
                    return totalReg > 0 ? Math.round((totalAtt / totalReg) * 100) : 0;
                  })()}%
                </div>
                <div className="text-xs text-purple-600 mt-1">Attendance/Registration</div>
              </div>
              
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <div className="text-sm font-medium text-orange-700">Peak Month</div>
                <div className="text-lg font-bold text-orange-900">
                  {(() => {
                    if (!currentChartData || currentChartData.length === 0) {
                      return 'N/A';
                    }
                    const peakMonth = currentChartData.reduce((max, item) => 
                      (item.registrations || 0) > (max.registrations || 0) ? item : max
                    );
                    return peakMonth?.month || 'N/A';
                  })()}
                </div>
                <div className="text-xs text-orange-600 mt-1">Highest registrations</div>
              </div>
            </div>

            {/* Monthly Breakdown Table */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Monthly Breakdown</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white">
                      <TableHead className="font-semibold text-gray-700">Month</TableHead>
                      <TableHead className="font-semibold text-gray-700">Registrations</TableHead>
                      <TableHead className="font-semibold text-gray-700">Attendance</TableHead>
                      <TableHead className="font-semibold text-gray-700">Attendance Rate</TableHead>
                      <TableHead className="font-semibold text-gray-700">Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentChartData.map((item, index) => {
                      const attendanceRate = item.registrations > 0 ? Math.round((item.attendance / item.registrations) * 100) : 0;
                      const prevItem = index > 0 ? currentChartData[index - 1] : null;
                      const trend = prevItem ? 
                        (item.registrations > prevItem.registrations ? '↗️' : 
                         item.registrations < prevItem.registrations ? '↘️' : '→') : '→';
                      
                      return (
                        <TableRow key={item.month} className="hover:bg-white">
                          <TableCell className="font-medium text-gray-900">{item.month}</TableCell>
                          <TableCell className="text-blue-600 font-semibold">{item.registrations}</TableCell>
                          <TableCell className="text-green-600 font-semibold">{item.attendance}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold text-gray-700">{attendanceRate}%</div>
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{ width: `${attendanceRate}%` }}
                                ></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-lg">{trend}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}