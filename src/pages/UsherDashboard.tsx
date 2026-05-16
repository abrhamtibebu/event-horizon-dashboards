import { useState, useEffect } from 'react'
import {
  Calendar,
  Users,
  QrCode,
  CheckCircle,
  Clock,
  MapPin,
  Bell,
  UserCheck,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  ArrowUpRight,
  MessageSquare,
  DollarSign,
  Mic,
  MonitorPlay,
} from 'lucide-react'
import { MetricCard } from '@/components/MetricCard'
import { DashboardCard } from '@/components/DashboardCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import api from '@/lib/api'
import { getGuestTypeBadgeClasses, cn } from '@/lib/utils'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Checkbox } from '@/components/ui/checkbox'
import { RecentActivity } from '@/components/RecentActivity'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast'
import { UsherMobileLayout } from '@/components/UsherMobileLayout'


export default function UsherDashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { searchQuery } = useOutletContext<{ searchQuery: string }>()
  const [taskCompletion, setTaskCompletion] = useState<{ [eventId: string]: { [task: string]: boolean } }>({})
  const [completingTask, setCompletingTask] = useState<{ [eventId: string]: boolean }>({})
  const [rejectDialogOpenId, setRejectDialogOpenId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchUsherData = async () => {
      try {
        setLoading(true)
        const response = await api.get('/dashboard/usher')
        // Deduplicate assignedEvents by ID to prevent duplicate key warnings
        if (response.data?.assignedEvents) {
          const uniqueEvents = response.data.assignedEvents.filter(
            (event: any, index: number, self: any[]) =>
              index === self.findIndex((e: any) => e.id === event.id)
          )
          response.data.assignedEvents = uniqueEvents
        }
        setDashboardData(response.data)
        setError(null)
      } catch (err) {
        setError(
          'Failed to fetch usher dashboard data. The backend endpoint might not be implemented yet.'
        )
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsherData()
  }, [])

  // Helper to parse tasks from event
  const getTasks = (event: any) => {
    if (!event.pivot || !event.pivot.tasks) return []
    try {
      const tasks = typeof event.pivot.tasks === 'string' ? JSON.parse(event.pivot.tasks) : event.pivot.tasks
      return Array.isArray(tasks) ? tasks : []
    } catch {
      return []
    }
  }

  // Initialize taskCompletion state when dashboardData changes
  useEffect(() => {
    if (!dashboardData?.assignedEvents) return
    const initial: { [eventId: string]: { [task: string]: boolean } } = {}
    dashboardData.assignedEvents.forEach((event: any) => {
      const tasks = getTasks(event)
      initial[event.id] = {}
      tasks.forEach((task: string) => {
        initial[event.id][task] = false
      })
    })
    setTaskCompletion(initial)
  }, [dashboardData])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'upcoming':
        return 'bg-blue-500/10 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'completed':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getTypeColor = (type: string) => {
    return getGuestTypeBadgeClasses(type);
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      case 'medium':
        return 'bg-yellow-500/10 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'low':
        return 'bg-green-500/10 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }


  // Handler for navigating to event messaging
  const handleEventMessage = (eventId: string | number) => {
    navigate(`/dashboard/messages?eventId=${eventId}&conversationId=event_${eventId}`)
  }

  // Handler for messaging event organizer directly
  const handleMessageOrganizer = async (event: any) => {
    try {
      // Fetch event details to get organizer_id
      const eventResponse = await api.get(`/events/${event.id}`)
      const fullEvent = eventResponse.data

      if (fullEvent?.organizer_id) {
        // Fetch organizer details
        const organizerResponse = await api.get(`/organizers/${fullEvent.organizer_id}`)
        const organizer = organizerResponse.data

        // Fetch organizer's users to find primary contact or first user
        if (organizer) {
          const usersResponse = await api.get(`/organizers/${fullEvent.organizer_id}/users`)
          const users = Array.isArray(usersResponse.data) ? usersResponse.data : (usersResponse.data?.data || [])

          // Find primary contact or use first user
          const organizerUser = users.find((u: any) => u.is_primary_contact) || users[0]

          if (organizerUser?.id) {
            navigate(`/dashboard/messages?userId=${organizerUser.id}&conversationId=direct_${organizerUser.id}`)
            return
          }
        }
      }

      // Fallback to event conversation if organizer not found
      handleEventMessage(event.id)
    } catch (err) {
      console.error('Failed to get organizer:', err)
      // Fallback to event conversation
      handleEventMessage(event.id)
    }
  }

  // Accept job
  const handleAcceptJob = async (eventId: string) => {
    setActionLoading(true);
    try {
      await api.post(`/events/${eventId}/usher/accept`);
      toast({ title: 'Success', description: 'Job accepted successfully.' });
      // Refetch data
      const response = await api.get('/dashboard/usher');
      setDashboardData(response.data);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to accept job.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  // Reject job
  const handleRejectJob = async (eventId: string) => {
    setActionLoading(true);
    try {
      await api.post(`/events/${eventId}/usher/reject`, { reason: rejectReason });
      setRejectDialogOpenId(null);
      setRejectReason('');
      toast({ title: 'Success', description: 'Job rejected.' });
      // Refetch data
      const response = await api.get('/dashboard/usher');
      setDashboardData(response.data);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to reject job.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-[300px] flex items-center justify-center">
      <Spinner size="lg" variant="primary" text="Loading dashboard..." />
    </div>
  )
  if (error) return <div className="text-red-500">{error}</div>
  if (!dashboardData) return <div>No dashboard data available.</div>

  const { keyMetrics, assignedEvents, recentCheckIns, pendingIssues } =
    dashboardData

  // Example: filter assignedEvents and recentCheckIns by searchQuery
  const filteredAssignedEvents =
    searchQuery && assignedEvents
      ? assignedEvents.filter(
        (event: any) =>
          event.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : assignedEvents
  const filteredCheckIns =
    searchQuery && recentCheckIns
      ? recentCheckIns.filter(
        (checkIn: any) =>
          checkIn.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          checkIn.company?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : recentCheckIns

  return (
    <UsherMobileLayout title="Usher Dashboard">
      <div className="space-y-8 px-4 pb-12">
        {/* Quick Scan Action - The most important button for an usher */}
        <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-blue-600 p-1 shadow-2xl shadow-primary/30">
          <Button 
            onClick={() => navigate('/dashboard/usher/redemption')}
            className="w-full h-24 bg-[#0b1630] hover:bg-[#0b1630]/90 rounded-[22px] flex items-center justify-between px-6 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <QrCode className="w-8 h-8 text-primary" />
              </div>
              <div className="text-left">
                <span className="block text-xl font-black tracking-tight text-white uppercase">Scan QR Code</span>
                <span className="text-sm text-gray-400 font-medium">Instantly check-in guests</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-primary" />
            </div>
          </Button>
        </div>

        {/* Primary Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2 text-green-400">
              <UserCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Today</span>
            </div>
            <span className="text-2xl font-black text-white">{keyMetrics?.totalCheckInsToday?.value || '0'}</span>
            <span className="block text-xs text-gray-500 font-medium mt-1">Check-ins</span>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2 text-orange-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
            </div>
            <span className="text-2xl font-black text-white">{keyMetrics?.pendingIssues || '0'}</span>
            <span className="block text-xs text-gray-500 font-medium mt-1">Issues</span>
          </div>
        </div>

        {/* Active Assignments Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-black uppercase tracking-tight text-white">Your Assignments</h2>
            <Link to="/dashboard/usher/events" className="text-xs font-bold text-primary uppercase">See All</Link>
          </div>
          
          <div className="space-y-4">
            {filteredAssignedEvents?.map((event: any) => (
              <div key={event.id} className="relative group overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm transition-all hover:bg-white/10">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg leading-tight text-white">{event.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  <Badge className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase border-none", getStatusColor(event.status))}>
                    {event.status}
                  </Badge>
                </div>

                {/* Mobile Progress Bar */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <span>Overall Attendance</span>
                    <span className="text-white">
                      {event.totalAttendees ? Math.round((event.checkedIn / event.totalAttendees) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] transition-all duration-500" 
                      style={{ width: `${event.totalAttendees ? (event.checkedIn / event.totalAttendees) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Assigned Sessions - Live Tracking */}
                {event.sessions && event.sessions.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <MonitorPlay className="w-3 h-3 text-primary animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">Live Session Assignments</span>
                    </div>
                    <div className="space-y-2">
                      {event.sessions.map((session: any) => (
                        <div key={session.id} className="bg-white/5 border border-white/5 rounded-xl p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              <span className="text-[11px] font-bold text-white truncate max-w-[120px]">{session.name}</span>
                            </div>
                            <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                              {session.current_attendance || 0} / {session.max_capacity || '∞'}
                            </span>
                          </div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-700",
                                (session.current_attendance / (session.max_capacity || 100)) > 0.9 ? "bg-red-500" : "bg-primary"
                              )}
                              style={{ width: `${Math.min(100, (session.current_attendance / (session.max_capacity || 100)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => navigate(`/dashboard/usher/events?eventId=${event.id}`)}
                    className="bg-primary hover:bg-primary/90 text-white font-bold h-10 rounded-xl text-xs uppercase"
                  >
                    Manage Guests
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleEventMessage(event.id)}
                    className="border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold h-10 rounded-xl text-xs uppercase"
                  >
                    Event Chat
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity Mini-List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-black uppercase tracking-tight text-white">Recent Activity</h2>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm divide-y divide-white/5">
            {filteredCheckIns?.slice(0, 3).map((checkIn: any) => (
              <div key={checkIn.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-white">{checkIn.name}</span>
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{checkIn.time}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] font-bold border-white/10 text-gray-400">
                  {checkIn.guest_type?.name}
                </Badge>
              </div>
            ))}
            {(!filteredCheckIns || filteredCheckIns.length === 0) && (
              <div className="py-4 text-center text-sm text-gray-500 font-medium">No recent activity yet</div>
            )}
          </div>
        </section>
      </div>
    </UsherMobileLayout>
  )
}

function calculateEarnings(dailyRate: number | string, fromDate: string, toDate: string) {
  if (!dailyRate || !fromDate || !toDate) return 0;
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  return Number(dailyRate) * days;
}
