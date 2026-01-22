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
  LayoutGrid,
  List,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { MetricCard } from '@/components/MetricCard'
import { DashboardCard } from '@/components/DashboardCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, Brush } from 'recharts'
import { Link, useOutletContext, useNavigate } from 'react-router-dom'
import api, { getAvailableUshersForEvent } from '@/lib/api'
import { Calendar } from '@/components/ui/calendar'
import { useInterval } from '@/hooks/use-interval'
// Removed useToast - using useModernAlerts instead
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { mockData, isMockMode, getMockData } from '@/lib/mockData'
import { RecentActivity } from '@/components/RecentActivity'
import { EventFilterChips } from '@/components/EventFilterChips'
import { ModernCalendarWidget } from '@/components/ModernCalendarWidget'
import { Spinner } from '@/components/ui/spinner'
import { ReportMetrics } from '@/types/reports'
import { transformToPieChart, transformTopEvents, getChartColorPalette, getChartStyles, getChartColors } from '@/utils/reportTransformers'
import { PieChartComponent } from '@/components/reports/PieChartComponent'
import { BarChartComponent } from '@/components/reports/BarChartComponent'
import { useModernAlerts } from '@/hooks/useModernAlerts'
import { taskApi, Task } from '@/lib/taskApi'
import { CheckCircle2, Circle, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react'
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns'

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
  const [availableUshers, setAvailableUshers] = useState<any[]>([])
  const [ushersLoading, setUshersLoading] = useState(false)
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess, showWarning } = useModernAlerts();

  // Real-time chart data state
  const [guestTypeDistribution, setGuestTypeDistribution] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [eventPopularity, setEventPopularity] = useState<Array<{ name: string; attendees: number }>>([]);
  const [reportMetrics, setReportMetrics] = useState<ReportMetrics | null>(null);

  // Event Performance Chart Zoom State
  const [chartZoomLevel, setChartZoomLevel] = useState<'3months' | '6months' | '1year'>('3months');
  const [showDetailedChart, setShowDetailedChart] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<[number, number]>([0, 0]);

  // Add edit event dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Calendar view state
  const [activeView, setActiveView] = useState<'calendar' | 'list'>(() => {
    return (localStorage.getItem('organizerDashboardView') as 'calendar' | 'list') || 'calendar'
  });
  const [eventFilters, setEventFilters] = useState<string[]>([]);

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  // Recent activities state
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  // Handler to open edit dialog with event data
  const openEditDialog = (event: any) => {
    setEditForm({ ...event });
    setEditDialogOpen(true);
  };

  // Handler for view change with localStorage persistence
  const handleViewChange = (view: 'calendar' | 'list') => {
    setActiveView(view);
    localStorage.setItem('organizerDashboardView', view);
  };

  // Handler for event click in calendar - navigate to event details with error handling
  const handleCalendarEventClick = async (event: any) => {
    console.log('[Dashboard] Clicked event:', event)
    console.log('[Dashboard] Event organizer_id:', event.organizer_id)
    console.log('[Dashboard] User organizer_id:', user?.organizer_id)

    // Pre-check: Verify the event belongs to this organizer
    if (user?.organizer_id && event.organizer_id !== user.organizer_id) {
      console.error('[Dashboard] Event does not belong to this organizer')
      showError('Access Denied', 'This event belongs to another organizer and cannot be accessed.')
      return
    }

    try {
      // Check if user has permission to view this event
      const response = await api.get(`/events/${event.id}`)
      if (response.data) {
        console.log('[Dashboard] Permission check passed, navigating...')
        navigate(`/dashboard/events/${event.id}`)
      }
    } catch (error: any) {
      console.error('[Dashboard] Error accessing event:', error)
      console.error('[Dashboard] Error response:', error.response?.data)

      if (error.response?.status === 403) {
        showError('Access Denied', 'You do not have permission to view this event. It may belong to another organizer.')
      } else if (error.response?.status === 404) {
        showError('Event Not Found', 'This event no longer exists or has been deleted.')
      } else {
        showError('Error', 'Failed to load event details. Please try again.')
      }
    }
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
      showSuccess('Success', 'Event updated successfully!');
      setEditDialogOpen(false);
      fetchDashboardData();
    } catch (err: any) {
      showError('Error', err.response?.data?.error || 'Failed to update event');
    } finally {
      setEditLoading(false);
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Always use real data for organizer dashboard
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
      showError('Error', message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Fetch upcoming tasks
  const fetchTasks = async () => {
    setTasksLoading(true);
    setTasksError(null);
    try {
      // Fetch both pending and in_progress tasks, then combine
      const [pendingResponse, inProgressResponse] = await Promise.all([
        taskApi.getTasks({
          status: 'pending',
          sort_by: 'due_date',
          sort_order: 'asc',
          per_page: 10,
        }).catch(() => ({ data: [] })),
        taskApi.getTasks({
          status: 'in_progress',
          sort_by: 'due_date',
          sort_order: 'asc',
          per_page: 10,
        }).catch(() => ({ data: [] })),
      ]);

      // Handle paginated response - response.data might be the paginated object
      const pendingTasks = pendingResponse.data?.data || pendingResponse.data || [];
      const inProgressTasks = inProgressResponse.data?.data || inProgressResponse.data || [];

      // Combine and sort all tasks
      const allTasks = [...(Array.isArray(pendingTasks) ? pendingTasks : []), ...(Array.isArray(inProgressTasks) ? inProgressTasks : [])];

      // Filter to only show tasks due in the next 30 days or overdue
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      const upcomingTasks = allTasks.filter((task: Task) => {
        if (!task.due_date) return true; // Include tasks without due dates
        try {
          const dueDate = new Date(task.due_date);
          return dueDate <= thirtyDaysFromNow || isPast(dueDate);
        } catch (e) {
          return true; // Include if date parsing fails
        }
      }).sort((a: Task, b: Task) => {
        // Sort by due date, with overdue tasks first
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        try {
          const dateA = new Date(a.due_date);
          const dateB = new Date(b.due_date);
          return dateA.getTime() - dateB.getTime();
        } catch {
          return 0;
        }
      });

      setTasks(upcomingTasks.slice(0, 5)); // Show top 5
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setTasksError(err.response?.data?.message || 'Failed to fetch tasks');
      setTasks([]); // Set empty array on error
    } finally {
      setTasksLoading(false);
    }
  };

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    setActivitiesLoading(true);
    setActivitiesError(null);
    try {
      // Fetch more activities to ensure we get latest from each conversation
      const response = await api.get('/messages/activity', {
        params: { limit: 50 } // Fetch more to ensure we get latest from each conversation
      });

      const allActivities = response.data.activities || [];

      // Group activities by conversation
      // For event chats: group by event_name
      // For direct chats: group by other_user_name
      const conversationMap = new Map<string, any>();

      allActivities.forEach((activity: any) => {
        if (activity.type === 'message') {
          // Create a unique key for each conversation
          let conversationKey: string;

          if (activity.event_name) {
            // Event chat - group by event name (event names should be unique)
            conversationKey = `event_${activity.event_name}`;
          } else {
            // Direct chat - group by other_user_name
            // The backend already sets other_user_name correctly regardless of sender/recipient
            const otherUser = activity.other_user_name || activity.recipient_name || activity.sender_name;
            conversationKey = `direct_${(otherUser || 'unknown').toLowerCase().trim()}`;
          }

          // If this conversation doesn't exist or this message is newer, update it
          const existing = conversationMap.get(conversationKey);
          if (!existing) {
            // First message from this conversation
            conversationMap.set(conversationKey, activity);
          } else {
            // Compare timestamps and keep the newer message
            const existingDate = new Date(existing.created_at).getTime();
            const currentDate = new Date(activity.created_at).getTime();
            if (currentDate > existingDate) {
              conversationMap.set(conversationKey, activity);
            }
          }
        } else {
          // For non-message activities, include them all (they're already unique)
          const uniqueKey = activity.id || `activity_${activity.created_at}_${Math.random()}`;
          if (!conversationMap.has(uniqueKey)) {
            conversationMap.set(uniqueKey, activity);
          }
        }
      });

      // Convert map to array and sort by created_at (newest first)
      const uniqueConversations = Array.from(conversationMap.values()).sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA; // Descending order
      });

      // Take only the top conversations (limit)
      setRecentActivities(uniqueConversations.slice(0, 8));
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      setActivitiesError(err.response?.data?.message || 'Failed to fetch activities');
      // Don't show error to user, just log it
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchRecentActivities();
    }
  }, [user]);

  // Handle task completion
  const handleCompleteTask = async (taskId: number) => {
    try {
      await taskApi.completeTask(taskId);
      showSuccess('Success', 'Task marked as completed!');
      fetchTasks(); // Refresh tasks
      if (selectedTask?.id === taskId) {
        setTaskDialogOpen(false);
      }
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Failed to complete task');
    }
  };

  // Handle task status update
  const handleUpdateTaskStatus = async (taskId: number, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      await taskApi.updateTask(taskId, { status });
      showSuccess('Success', 'Task status updated!');
      fetchTasks();
      if (selectedTask?.id === taskId) {
        setTaskDialogOpen(false);
      }
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Failed to update task');
    }
  };

  // Format due date for display
  const formatDueDate = (dueDate: string | undefined) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dueDateOnly = new Date(date);
    dueDateOnly.setHours(0, 0, 0, 0);

    if (isPast(date) && !isToday(date)) {
      return `Overdue: ${format(date, 'MMM d, yyyy')}`;
    } else if (isToday(date)) {
      return 'Due today';
    } else if (dueDateOnly.getTime() === tomorrow.getTime()) {
      return 'Due tomorrow';
    } else {
      return formatDistanceToNow(date, { addSuffix: true });
    }
  };

  // Get task priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-error/10 text-error border-error/30';
      case 'high':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'medium':
        return 'bg-info/10 text-info border-info/30';
      case 'low':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Get task status icon
  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'in_progress':
        return <Circle className="w-4 h-4 text-info" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-error" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Remove the useInterval for dashboard refresh
  // useInterval(() => {
  //   fetchDashboardData()
  // }, 10000)

  // Fetch all events for the visible month (for calendar markers)
  useEffect(() => {
    const start = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1)
    const end = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0)

    // Always use real data
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
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary mt-0.5"></span>
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

  const fetchEvents = async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      // Always use real data
      const res = await api.get('/events');
        console.log('[Dashboard] Fetched events:', res.data.length)
        console.log('[Dashboard] User organizer_id:', user?.organizer_id)

        // Filter events to only show those belonging to current organizer
        const filteredEvents = res.data.filter((event: any) => {
          // If user has organizer_id, only show events from their organization
          if (user?.organizer_id) {
            const matches = event.organizer_id === user.organizer_id
            if (!matches) {
              console.log('[Dashboard] Filtering out event:', event.id, 'organizer:', event.organizer_id)
            }
            return matches
          }
          // Admin/superadmin can see all events
          console.log('[Dashboard] Admin mode - showing all events')
          return true
        });

        console.log('[Dashboard] Filtered events:', filteredEvents.length)
        setAllEvents(filteredEvents);
    } catch (err: any) {
      console.error('[Dashboard] Error fetching events:', err)
      setEventsError(err.response?.data?.message || 'Failed to fetch events');
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch events after user data is loaded
    if (user) {
      console.log('[Dashboard] User loaded, fetching events for organizer:', user.organizer_id)
      fetchEvents();
    }
    // Temporarily disabled polling to prevent reloading issues
    // eventsIntervalRef.current = setInterval(fetchEvents, 150000);
    return () => {
      if (eventsIntervalRef.current) clearInterval(eventsIntervalRef.current);
    };
  }, [user]);

  // Helper for status color (reuse from Events page)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success border-success/30';
      case 'completed':
        return 'bg-info/10 text-info border-info/30';
      case 'draft':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'cancelled':
        return 'bg-error/10 text-error border-error/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Assign ushers dialog logic
  const openAssignDialog = async (eventId: number) => {
    setSelectedEventId(eventId)
    const event = dashboardData?.events?.find((e: any) => e.id === eventId)
    const assigned = event?.ushers?.map((u: any) => u.id) || []
    setSelectedUshers(assigned)
    setAssignDialogOpen(true)

    // Fetch available ushers for this event
    setUshersLoading(true)
    try {
      const response = await getAvailableUshersForEvent(eventId)
      // Handle paginated response structure
      const ushersData = response.data?.data || response.data || []
      setAvailableUshers(Array.isArray(ushersData) ? ushersData : [])
    } catch (error: any) {
      console.error('Failed to load available ushers:', error)
      showError('Error', error.response?.data?.message || 'Failed to load available ushers')
      setAvailableUshers([])
    } finally {
      setUshersLoading(false)
    }
  }
  const handleAssignUshers = async () => {
    if (!selectedEventId || selectedUshers.length === 0) return
    setAssigning(true)
    try {
      await api.post(`/events/${selectedEventId}/ushers`, {
        ushers: selectedUshers.map(id => ({ id, tasks: [] })),
      })
      showSuccess('Success', 'Ushers assigned successfully!')
      setAssignDialogOpen(false)
      setSelectedUshers([])
      setAvailableUshers([])
      fetchDashboardData() // Refresh after assigning ushers
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to assign ushers'
      showError('Error', errorMessage)
    } finally {
      setAssigning(false)
    }
  }

  // Delete event
  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return
    try {
      await api.delete(`/events/${eventId}`)
      showSuccess('Success', 'Event deleted!')
      fetchDashboardData() // Refresh after deleting event
    } catch (err) {
      showError('Error', 'Failed to delete event.')
    }
  }

  // Fetch real-time chart data from backend
  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async () => {
      try {
        // Always use real data
        const [summaryRes, eventsRes] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/events'),
        ]);

          if (!isMounted) return;

          const metrics = summaryRes.data as ReportMetrics;
          setReportMetrics(metrics);

          // Guest type distribution using transformer - PieChartComponent will use its own theme colors
          if (metrics.guest_type_breakdown) {
            const primaryColors = getChartColorPalette('primary');
            const processedData = transformToPieChart(metrics.guest_type_breakdown, primaryColors);
            setGuestTypeDistribution(processedData);
          } else {
            setGuestTypeDistribution([]);
          }

          // Event popularity (top events by attendance) using transformer
          if (metrics.top_events_by_attendance && Array.isArray(eventsRes.data)) {
            const eventIdToName: Record<string, string> = {};
            eventsRes.data.forEach((event: any) => {
              eventIdToName[String(event.id)] = event.name;
            });
            const topEvents = transformTopEvents(metrics.top_events_by_attendance, eventIdToName);
            setEventPopularity(topEvents.map(e => ({ name: e.name, attendees: e.attendees })));
          } else {
            setEventPopularity([]);
          }
      } catch (err: any) {
        if (!isMounted) return;
        const errorMessage = err.response?.data?.message || 'Failed to fetch analytics data';
        showError('Failed to Load Analytics', errorMessage);
        console.error('Analytics fetch error:', err);
        setGuestTypeDistribution([]);
        setEventPopularity([]);
      }
    };
    fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, [showError]);

  // Loading skeletons
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-1/3 bg-muted rounded mb-4" />
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
  if (error) return <div className="text-destructive">{error}</div>
  if (!dashboardData) return <div className="text-muted-foreground">No dashboard data available.</div>

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
    <div className="min-h-screen bg-background p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-[hsl(var(--color-rich-black))]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome{user && (user as any).name ? `, ${(user as any).name}` : ''}!
            </h1>
            <p className="text-muted-foreground">
              Today is {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mt-6">
          <Link to="/dashboard/events/create">
            <Button className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg">
              <UserPlus className="w-4 h-4 mr-2" />
              Create New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="group relative overflow-hidden bg-card rounded-2xl shadow-sm border border-border p-6 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-10 translate-x-10 bg-[hsl(var(--primary))]/10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-[hsl(var(--color-rich-black))]" />
              </div>
              <div className="text-sm font-medium text-muted-foreground">My Events</div>
            </div>
            <div className="text-3xl font-bold text-card-foreground mb-1">{keyMetrics?.myEvents?.value || 'N/A'}</div>
            <div className="text-xs text-muted-foreground/70">Organized events</div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-card rounded-2xl shadow-sm border border-border p-6 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-10 translate-x-10 bg-success/10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-[hsl(var(--color-rich-black))]" />
              </div>
              <div className="text-sm font-medium text-muted-foreground">Total Attendees</div>
            </div>
            <div className="text-3xl font-bold text-card-foreground mb-1">{keyMetrics?.totalAttendees?.value || 'N/A'}</div>
            <div className="text-xs text-muted-foreground/70">All participants</div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-card rounded-2xl shadow-sm border border-border p-6 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-10 translate-x-10 bg-[hsl(var(--primary))]/10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[hsl(var(--color-rich-black))]" />
              </div>
              <div className="text-sm font-medium text-muted-foreground">Total Revenue</div>
            </div>
            <div className="text-3xl font-bold text-card-foreground mb-1">{keyMetrics?.totalRevenue?.value || 'N/A'}</div>
            <div className="text-xs text-muted-foreground/70">Event earnings</div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-card rounded-2xl shadow-sm border border-border p-6 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-10 translate-x-10 bg-[hsl(var(--color-warning))]/10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[hsl(var(--color-warning))] rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[hsl(var(--color-rich-black))]" />
              </div>
              <div className="text-sm font-medium text-muted-foreground">Unread Messages</div>
            </div>
            <div className="text-3xl font-bold text-card-foreground mb-1">{keyMetrics?.unreadMessages?.value || 'N/A'}</div>
            <div className="text-xs text-muted-foreground/70">Pending messages</div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Events, Tasks, Ushers */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Event Performance Chart */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Event Performance</h3>
                <p className="text-sm text-muted-foreground">
                  Registrations & Attendance Trends - Last {chartZoomLevel === '3months' ? '3' : chartZoomLevel === '6months' ? '6' : '12'} months
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChartZoomLevel('3months')}
                    className={`h-8 px-3 text-xs ${chartZoomLevel === '3months' ? 'bg-card shadow-sm' : 'hover:bg-accent'}`}
                  >
                    3M
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChartZoomLevel('6months')}
                    className={`h-8 px-3 text-xs ${chartZoomLevel === '6months' ? 'bg-card shadow-sm' : 'hover:bg-accent'}`}
                  >
                    6M
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChartZoomLevel('1year')}
                    className={`h-8 px-3 text-xs ${chartZoomLevel === '1year' ? 'bg-card shadow-sm' : 'hover:bg-accent'}`}
                  >
                    1Y
                  </Button>
                </div>

                {/* Detailed View Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetailedChart(true)}
                  className="bg-card border-border hover:bg-accent"
                >
                  <Maximize2 className="w-4 h-4 mr-1" />
                  Details
                </Button>

                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-[hsl(var(--color-rich-black))]" />
                </div>
              </div>
            </div>

            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentChartData}>
                  {(() => {
                    const styles = getChartStyles();
                    const chartColors = getChartColors();

                    return (
                      <>
                        <defs>
                          <linearGradient id="registrationGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColors.info} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={chartColors.info} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColors.success} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={chartColors.success} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
                        <XAxis
                          dataKey="month"
                          stroke={styles.axisStroke}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke={styles.axisStroke}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: styles.tooltipBg,
                            border: `1px solid ${styles.tooltipBorder}`,
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            color: styles.tooltipText,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="registrations"
                          stackId="1"
                          stroke={chartColors.info}
                          fill="url(#registrationGradient)"
                          name="Registrations"
                        />
                        <Area
                          type="monotone"
                          dataKey="attendance"
                          stackId="2"
                          stroke={chartColors.success}
                          fill="url(#attendanceGradient)"
                          name="Attendance"
                        />
                      </>
                    );
                  })()}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Summary */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-info/10 rounded-lg p-3 border border-info/30">
                <div className="text-sm font-medium text-info">Total Registrations</div>
                <div className="text-lg font-bold text-foreground">
                  {currentChartData.reduce((sum, item) => sum + (item.registrations || 0), 0)}
                </div>
              </div>
              <div className="bg-success/10 rounded-lg p-3 border border-success/30">
                <div className="text-sm font-medium text-success">Total Attendance</div>
                <div className="text-lg font-bold text-foreground">
                  {currentChartData.reduce((sum, item) => sum + (item.attendance || 0), 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Events Section with Calendar/List Tabs */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">My Events</h3>
                <p className="text-sm text-muted-foreground">Manage and view your events</p>
              </div>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 text-[hsl(var(--color-rich-black))]" />
              </div>
            </div>

            {/* Event Filters */}
            <div className="mb-6">
              <EventFilterChips
                selectedFilters={eventFilters}
                onFilterChange={setEventFilters}
              />
            </div>

            {/* Tabs for Calendar/List View */}
            <Tabs value={activeView} onValueChange={(val) => handleViewChange(val as 'calendar' | 'list')}>
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  Calendar View
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  List View
                </TabsTrigger>
              </TabsList>

              {/* Calendar View Content */}
              <TabsContent value="calendar" className="mt-0">
                <ModernCalendarWidget
                  events={allEvents.map(event => ({
                    id: event.id,
                    name: event.name,
                    start_date: event.start_date || event.date,
                    start_time: event.start_time,
                    location: event.location,
                    event_type: event.event_type,
                    // Preserve full event object for click handler
                    ...event,
                  }))}
                  onDateSelect={(date) => {
                    setSelectedDate(date);
                    setCalendarMonth(date);
                  }}
                  onEventClick={(event) => {
                    // Pass the full event object which includes organizer_id
                    handleCalendarEventClick(event as any);
                  }}
                  showWeather={false}
                />
              </TabsContent>

              {/* List View Content */}
              <TabsContent value="list" className="mt-0">
                {eventsLoading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Spinner size="md" variant="primary" text="Loading events..." />
                  </div>
                )}
                {eventsError && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 bg-error/10 rounded-full flex items-center justify-center mb-3">
                      <Clock className="w-4 h-4 text-error" />
                    </div>
                    <div className="text-sm text-error">{eventsError}</div>
                  </div>
                )}

                {/* Table for desktop */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className="font-semibold text-foreground text-sm py-4">Name</TableHead>
                        <TableHead className="font-semibold text-foreground text-sm py-4">Status</TableHead>
                        <TableHead className="font-semibold text-foreground text-sm py-4">Date</TableHead>
                        <TableHead className="font-semibold text-foreground text-sm py-4">Location</TableHead>
                        <TableHead className="font-semibold text-foreground text-sm py-4">Attendees</TableHead>
                        <TableHead className="font-semibold text-foreground text-sm py-4">Progress</TableHead>
                        <TableHead className="font-semibold text-foreground text-sm py-4">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allEvents
                        .filter(event => {
                          const matchesFilter = eventFilters.length === 0 || eventFilters.includes(event.status)
                          return matchesFilter
                        })
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map(event => {
                          const attendeeCount = event.attendee_count || 0;
                          const attendeeLimit = event.max_guests || 500;
                          const registrationProgress = Math.min(
                            Math.round((attendeeCount / attendeeLimit) * 100),
                            100
                          );
                          return (
                            <TableRow key={event.id} className="hover:bg-accent transition-colors group border-b border-border">
                              <TableCell className="font-medium text-card-foreground py-4 group-hover:text-primary transition-colors">{event.name}</TableCell>
                              <TableCell className="py-4">
                                <Badge className={`${getStatusColor(event.status)} text-xs font-medium`}>{event.status}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground py-4">{event.date} {event.time}</TableCell>
                              <TableCell className="text-muted-foreground py-4">{event.location || 'Convention Center'}</TableCell>
                              <TableCell className="text-muted-foreground py-4">{attendeeCount}/{attendeeLimit}</TableCell>
                              <TableCell className="py-4">
                                <div className="flex flex-col gap-1">
                                  <div className="flex justify-between text-xs text-muted-foreground/70 mb-1">
                                    <span>{registrationProgress}%</span>
                                  </div>
                                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-2 bg-brand-gradient rounded-full transition-all duration-300" style={{ width: `${registrationProgress}%` }}></div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <Button size="sm" variant="outline" className="bg-card border-border hover:bg-accent" onClick={() => navigate(`/dashboard/events/${event.id}`)}>
                                  <Eye className="w-4 h-4 mr-2" /> View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      {allEvents.filter(event => {
                        const matchesFilter = eventFilters.length === 0 || eventFilters.includes(event.status)
                        return matchesFilter
                      }).length === 0 && !eventsLoading && !eventsError && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center">
                                <Clock className="w-8 h-8 text-muted-foreground/50 mb-2" />
                                <span>No events match the selected filters</span>
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
                    .filter(event => {
                      const matchesFilter = eventFilters.length === 0 || eventFilters.includes(event.status)
                      return matchesFilter
                    })
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map(event => {
                      const attendeeCount = event.attendee_count || 0;
                      const attendeeLimit = event.max_guests || 500;
                      const registrationProgress = Math.min(
                        Math.round((attendeeCount / attendeeLimit) * 100),
                        100
                      );
                      return (
                        <div key={event.id} className="bg-muted/30 rounded-xl p-4 border border-border">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-card-foreground text-sm mb-1">{event.name}</h4>
                              <p className="text-xs text-muted-foreground">{event.date} {event.time} • {event.location || 'Convention Center'}</p>
                            </div>
                            <Badge className={`${getStatusColor(event.status)} text-xs font-medium ml-3`}>{event.status}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                            <div className="w-5 h-5 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Users className="w-3 h-3 text-primary" />
                            </div>
                            <span>{attendeeCount}/{attendeeLimit} Attendees</span>
                          </div>
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-muted-foreground/70 mb-1">
                              <span>Progress:</span>
                              <span>{registrationProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-2 bg-brand-gradient rounded-full transition-all duration-300" style={{ width: `${registrationProgress}%` }}></div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="w-full bg-card border-border hover:bg-accent" onClick={() => navigate(`/dashboard/events/${event.id}`)}>
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </Button>
                        </div>
                      );
                    })}
                  {allEvents.filter(event => {
                    const matchesFilter = eventFilters.length === 0 || eventFilters.includes(event.status)
                    return matchesFilter
                  }).length === 0 && !eventsLoading && !eventsError && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                        <span>No events match the selected filters</span>
                      </div>
                    )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Tasks & Ushers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">Upcoming Tasks</h3>
                  <p className="text-sm text-muted-foreground">Task management</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/dashboard/tasks">
                    <Button variant="ghost" size="sm" className="text-xs">
                      View All
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                  <div className="w-8 h-8 bg-[hsl(var(--color-warning))] rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-[hsl(var(--color-rich-black))]" />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {tasksLoading && (
                  <div className="text-center py-8">
                    <Spinner size="sm" variant="primary" />
                  </div>
                )}
                {tasksError && (
                  <div className="text-center py-4 text-error text-sm">
                    {tasksError}
                  </div>
                )}
                {!tasksLoading && !tasksError && tasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    <span>No upcoming tasks</span>
                    <Link to="/dashboard/tasks">
                      <Button variant="link" size="sm" className="mt-2">
                        Create a task
                      </Button>
                    </Link>
                  </div>
                )}
                {!tasksLoading && !tasksError && tasks.map((task: Task) => {
                  const dueDate = task.due_date ? new Date(task.due_date) : null;
                  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && task.status !== 'completed';

                  return (
                    <div
                      key={task.id}
                      className="flex items-start justify-between p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 cursor-pointer transition-colors group"
                      onClick={() => {
                        setSelectedTask(task);
                        setTaskDialogOpen(true);
                      }}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-0.5">
                          {getTaskStatusIcon(task.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-card-foreground group-hover:text-primary transition-colors">
                              {task.title}
                            </span>
                            {task.priority && (
                              <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </Badge>
                            )}
                          </div>
                          {task.event && (
                            <div className="text-xs text-muted-foreground mb-1">
                              {task.event.title}
                            </div>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${isOverdue ? 'bg-error/10 text-error border-error/30' : 'bg-warning/10 text-warning border-warning/30'}`}
                            >
                              {formatDueDate(task.due_date)}
                            </Badge>
                            {task.status !== 'completed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompleteTask(task.id);
                                }}
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">My Ushers</h3>
                  <p className="text-sm text-muted-foreground">Assigned team members</p>
                </div>
                <div className="w-8 h-8 bg-info rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-[hsl(var(--color-rich-black))]" />
                </div>
              </div>
              <div className="space-y-3">
                {ushers?.filter((usher: any) => usher.organizer_id === user?.organizer_id && usher.role === 'usher')?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    <span>No ushers found</span>
                  </div>
                )}
                {ushers?.filter((usher: any) => usher.organizer_id === user?.organizer_id && usher.role === 'usher')?.map((usher: any) => (
                  <div key={usher.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="w-8 h-8 bg-info/10 rounded-full flex items-center justify-center">
                      <span className="text-info text-sm font-medium">{usher.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-card-foreground">{usher.name}</div>
                      <div className="text-xs text-muted-foreground/70">{usher.email}</div>
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
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Guest Type Distribution</h3>
                <p className="text-sm text-muted-foreground">Attendee categories</p>
              </div>
              <div className="w-8 h-8 bg-info rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-[hsl(var(--color-rich-black))]" />
              </div>
            </div>
            <PieChartComponent
              data={guestTypeDistribution}
              height={250}
              innerRadius={40}
              outerRadius={80}
              showLabels
              colorPalette="primary"
              emptyMessage="No guest type data available"
            />
          </div>

          {/* Bar Chart for Event Popularity */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Event Popularity</h3>
                <p className="text-sm text-muted-foreground">Most attended events</p>
              </div>
              <div className="w-8 h-8 bg-[hsl(var(--color-warning))] rounded-lg flex items-center justify-center">
                <BarChart className="w-4 h-4 text-[hsl(var(--color-rich-black))]" />
              </div>
            </div>
            <BarChartComponent
              data={eventPopularity.map(e => ({ name: e.name, value: e.attendees }))}
              height={250}
              dataKey="value"
              showGradient
              gradientId="popularityGradient"
              emptyMessage="No event popularity data available"
            />
          </div>
          {/* Recent Activity */}
          <RecentActivity
            limit={8}
            activities={recentActivities}
            loading={activitiesLoading}
            error={activitiesError}
            onRefresh={fetchRecentActivities}
          />

          {/* Quick Actions */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Quick Actions</h3>
                <p className="text-sm text-muted-foreground">Common tasks</p>
              </div>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-[hsl(var(--color-rich-black))]" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/dashboard/messages"
                className="block p-4 text-center bg-muted/50 hover:bg-accent rounded-xl border border-border transition-all duration-200"
              >
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-primary" />
                <span className="font-medium text-card-foreground">Messages</span>
              </Link>
              <Link
                to="/dashboard/locate-badges"
                className="block p-4 text-center bg-muted/50 hover:bg-accent rounded-xl border border-border transition-all duration-200"
              >
                <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
                <span className="font-medium text-card-foreground">Locate Badges</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Ushers Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Ushers to Event</DialogTitle>
            <DialogDescription>
              Select ushers to assign to this event. Only available ushers are shown.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="font-medium mb-2 text-foreground">Select ushers:</div>
            {ushersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" text="Loading available ushers..." />
              </div>
            ) : availableUshers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                <p className="font-medium">No available ushers found</p>
                <p className="text-sm mt-1">All ushers may already be assigned to this event.</p>
              </div>
            ) : (
              <ul className="max-h-64 overflow-y-auto divide-y divide-border border rounded-md">
                {availableUshers.map((usher: any) => (
                  <li key={usher.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
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
                      className="w-4 h-4 text-primary rounded border-border"
                    />
                    <label
                      htmlFor={`usher-${usher.id}`}
                      className="flex-1 cursor-pointer text-foreground"
                    >
                      <div className="font-medium">{usher.name}</div>
                      <div className="text-xs text-muted-foreground">{usher.email}</div>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setAssignDialogOpen(false)
                setSelectedUshers([])
                setAvailableUshers([])
              }}
              disabled={assigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignUshers}
              disabled={assigning || selectedUshers.length === 0 || ushersLoading}
            >
              {assigning ? 'Assigning...' : 'Assign Ushers'}
            </Button>
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
                <span className="block mt-2 text-foreground">{eventDetails?.description}</span>
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
        <DialogContent className="max-w-6xl h-[95vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon2 className="w-5 h-5" />
              Detailed Event Performance Analysis
            </DialogTitle>
            <DialogDescription>
              Comprehensive view of registrations and attendance trends with interactive zoom capabilities
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 modern-scrollbar">
            {/* Zoom Controls */}
            <div className="flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Time Range:</span>
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChartZoomLevel('3months')}
                    className={`h-8 px-3 text-xs ${chartZoomLevel === '3months' ? 'bg-card shadow-sm' : 'hover:bg-accent'}`}
                  >
                    3 Months
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChartZoomLevel('6months')}
                    className={`h-8 px-3 text-xs ${chartZoomLevel === '6months' ? 'bg-card shadow-sm' : 'hover:bg-accent'}`}
                  >
                    6 Months
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChartZoomLevel('1year')}
                    className={`h-8 px-3 text-xs ${chartZoomLevel === '1year' ? 'bg-card shadow-sm' : 'hover:bg-accent'}`}
                  >
                    1 Year
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Showing {currentChartData.length} data points
              </div>
            </div>

            {/* Detailed Chart */}
            <div className="w-full h-[400px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentChartData}>
                  {(() => {
                    const styles = getChartStyles();
                    const chartColors = getChartColors();

                    return (
                      <>
                        <defs>
                          <linearGradient id="detailedRegistrationGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColors.info} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={chartColors.info} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="detailedAttendanceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColors.success} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={chartColors.success} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
                        <XAxis
                          dataKey="month"
                          stroke={styles.axisStroke}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke={styles.axisStroke}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: styles.tooltipBg,
                            border: `1px solid ${styles.tooltipBorder}`,
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                            padding: '8px',
                            color: styles.tooltipText,
                          }}
                          labelStyle={{
                            fontWeight: 'bold',
                            color: styles.tooltipText,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="registrations"
                          stackId="1"
                          stroke={chartColors.info}
                          strokeWidth={2}
                          fill="url(#detailedRegistrationGradient)"
                          name="Registrations"
                        />
                        <Area
                          type="monotone"
                          dataKey="attendance"
                          stackId="2"
                          stroke={chartColors.success}
                          strokeWidth={2}
                          fill="url(#detailedAttendanceGradient)"
                          name="Attendance"
                        />
                      </>
                    );
                  })()}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="bg-info/10 rounded-xl p-4 border border-info/30">
                <div className="text-sm font-medium text-info">Total Registrations</div>
                <div className="text-xl font-bold text-foreground">
                  {currentChartData.reduce((sum, item) => sum + (item.registrations || 0), 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">All time periods</div>
              </div>

              <div className="bg-success/10 rounded-xl p-4 border border-success/30">
                <div className="text-sm font-medium text-success">Total Attendance</div>
                <div className="text-xl font-bold text-foreground">
                  {currentChartData.reduce((sum, item) => sum + (item.attendance || 0), 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">All time periods</div>
              </div>

              <div className="bg-primary/10 rounded-xl p-4 border border-primary/30">
                <div className="text-sm font-medium text-primary">Total Events</div>
                <div className="text-xl font-bold text-foreground">
                  {currentChartData.reduce((sum, item) => sum + (item.total_events || 0), 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">All time periods</div>
              </div>

              <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                <div className="text-sm font-medium text-green-600">Total Revenue</div>
                <div className="text-xl font-bold text-foreground">
                  ${currentChartData.reduce((sum, item) => sum + (item.revenue || 0), 0).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">From ticket sales</div>
              </div>

              <div className="bg-primary/10 rounded-xl p-4 border border-primary/30">
                <div className="text-sm font-medium text-primary">Avg. Attendance Rate</div>
                <div className="text-xl font-bold text-foreground">
                  {(() => {
                    const totalReg = currentChartData.reduce((sum, item) => sum + (item.registrations || 0), 0);
                    const totalAtt = currentChartData.reduce((sum, item) => sum + (item.attendance || 0), 0);
                    return totalReg > 0 ? Math.round((totalAtt / totalReg) * 100) : 0;
                  })()}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">Attendance/Registration</div>
              </div>

              <div className="bg-warning/10 rounded-xl p-4 border border-warning/30">
                <div className="text-sm font-medium text-warning">Avg. No-Show Rate</div>
                <div className="text-xl font-bold text-foreground">
                  {(() => {
                    const totalReg = currentChartData.reduce((sum, item) => sum + (item.registrations || 0), 0);
                    const totalAtt = currentChartData.reduce((sum, item) => sum + (item.attendance || 0), 0);
                    const noShow = totalReg - totalAtt;
                    return totalReg > 0 ? Math.round((noShow / totalReg) * 100) : 0;
                  })()}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">No-shows/Registrations</div>
              </div>
            </div>

            {/* Monthly Breakdown Table */}
            <div className="bg-muted/30 rounded-xl p-4 border border-border">
              <h4 className="text-lg font-semibold text-foreground mb-4">Monthly Breakdown</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-card">
                      <TableHead className="font-semibold text-foreground">Month</TableHead>
                      <TableHead className="font-semibold text-foreground">Events</TableHead>
                      <TableHead className="font-semibold text-foreground">Registrations</TableHead>
                      <TableHead className="font-semibold text-foreground">Attendance</TableHead>
                      <TableHead className="font-semibold text-foreground">Attendance Rate</TableHead>
                      <TableHead className="font-semibold text-foreground">No-Show Rate</TableHead>
                      <TableHead className="font-semibold text-foreground">Revenue</TableHead>
                      <TableHead className="font-semibold text-foreground">Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentChartData.map((item, index) => {
                      const attendanceRate = item.registrations > 0 ? Math.round((item.attendance / item.registrations) * 100) : 0;
                      const noShowRate = item.no_show_rate || (item.registrations > 0 ? Math.round(((item.registrations - item.attendance) / item.registrations) * 100) : 0);
                      const prevItem = index > 0 ? currentChartData[index - 1] : null;
                      const trend = prevItem ?
                        (item.registrations > prevItem.registrations ? '↗️' :
                          item.registrations < prevItem.registrations ? '↘️' : '→') : '→';

                      return (
                        <TableRow key={item.month} className="hover:bg-muted/50">
                          <TableCell className="font-medium text-foreground">{item.month}</TableCell>
                          <TableCell className="text-primary font-semibold">{item.total_events || 0}</TableCell>
                          <TableCell className="text-info font-semibold">{item.registrations}</TableCell>
                          <TableCell className="text-success font-semibold">{item.attendance}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold text-foreground">{attendanceRate}%</div>
                              <div className="w-12 bg-muted rounded-full h-2">
                                <div
                                  className="bg-success h-2 rounded-full"
                                  style={{ width: `${attendanceRate}%` }}
                                ></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold text-warning">{noShowRate}%</div>
                              <div className="w-12 bg-muted rounded-full h-2">
                                <div
                                  className="bg-warning h-2 rounded-full"
                                  style={{ width: `${noShowRate}%` }}
                                ></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-green-600 font-semibold">${(item.revenue || 0).toLocaleString()}</TableCell>
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

      {/* Task Details Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTask && getTaskStatusIcon(selectedTask.status)}
              {selectedTask?.title || 'Task Details'}
            </DialogTitle>
            <DialogDescription>
              {selectedTask?.event && (
                <span className="text-muted-foreground">
                  Event: {selectedTask.event.title}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4">
              {/* Task Status and Priority */}
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <select
                      value={selectedTask.status}
                      onChange={(e) => handleUpdateTaskStatus(selectedTask.id, e.target.value as any)}
                      className="dialog-select px-3 py-1.5 text-sm border rounded-md"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Priority</label>
                  <div className="mt-1">
                    <Badge className={getPriorityColor(selectedTask.priority)}>
                      {selectedTask.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {selectedTask.type}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Due Date */}
              {selectedTask.due_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                  <div className="mt-1 text-foreground">
                    {format(new Date(selectedTask.due_date), 'PPP')}
                    {(() => {
                      const dueDate = new Date(selectedTask.due_date);
                      if (isPast(dueDate) && !isToday(dueDate) && selectedTask.status !== 'completed') {
                        return <span className="ml-2 text-error">(Overdue)</span>;
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedTask.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <div className="mt-1 text-foreground bg-muted/30 p-3 rounded-md">
                    {selectedTask.description}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedTask.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <div className="mt-1 text-foreground bg-muted/30 p-3 rounded-md">
                    {selectedTask.notes}
                  </div>
                </div>
              )}

              {/* Vendor */}
              {selectedTask.vendor && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vendor</label>
                  <div className="mt-1 text-foreground">
                    {selectedTask.vendor.name}
                    {selectedTask.vendor.contact_email && (
                      <span className="text-muted-foreground ml-2">
                        ({selectedTask.vendor.contact_email})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Assigned User */}
              {selectedTask.assignedUser && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                  <div className="mt-1 text-foreground">
                    {selectedTask.assignedUser.name}
                    {selectedTask.assignedUser.email && (
                      <span className="text-muted-foreground ml-2">
                        ({selectedTask.assignedUser.email})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-border">
                {selectedTask.event && (
                  <Link to={`/dashboard/events/${selectedTask.event.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Event
                    </Button>
                  </Link>
                )}
                <Link to={`/dashboard/tasks/${selectedTask.id}`}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Task
                  </Button>
                </Link>
                {selectedTask.status !== 'completed' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleCompleteTask(selectedTask.id)}
                    className="bg-success hover:bg-success/90"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTaskDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}