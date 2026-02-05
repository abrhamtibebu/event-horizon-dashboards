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
  MessageCircle,
  MessageSquare,
  DollarSign,
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
import { getGuestTypeBadgeClasses } from '@/lib/utils'
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
    <div className="space-y-6 px-2 sm:px-4">
      {/* Removed duplicate <Header onSearch={setSearchQuery} /> */}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Assigned Events"
          value={keyMetrics?.assignedEvents || 'N/A'}
          icon={<Calendar className="w-6 h-6 text-primary" />}
        />
        <MetricCard
          title="Active Events"
          value={keyMetrics?.activeEvents || 'N/A'}
          icon={<Users className="w-6 h-6 text-primary" />}
        />
        {/* Additional Stats */}
        <MetricCard
          title="Total Earnings"
          value={keyMetrics?.totalEarnings ? `${keyMetrics.totalEarnings} ETB` : '0.00'}
          icon={<DollarSign className="w-6 h-6 text-yellow-500" />}
        />
        <MetricCard
          title="Earnings per Event"
          value={keyMetrics?.earningsPerEvent ? `${keyMetrics.earningsPerEvent} ETB` : '0.00'}
          icon={<DollarSign className="w-6 h-6 text-yellow-500" />}
        />
        {/* More stats coming soon */}
      </div>

      {/* New prominent cards for Total Check-ins Today and Pending Issues */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
        {/* Total Check-ins Today Card */}
        <div className="bg-gradient-to-r from-[hsl(var(--color-success))]/10 to-[hsl(var(--primary))]/10 dark:from-[hsl(var(--color-success))]/20 dark:to-[hsl(var(--primary))]/20 rounded-xl shadow p-6 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-2">
            <UserCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            <span className="text-2xl font-bold text-green-800 dark:text-green-300">{keyMetrics?.totalCheckInsToday?.value || 'N/A'}</span>
          </div>
          <div className="text-lg font-semibold text-green-800 dark:text-green-300">Total Check-ins Today</div>
          {keyMetrics?.totalCheckInsToday?.trend && (
            <div className="text-sm text-green-700 dark:text-green-400 mt-1">{keyMetrics.totalCheckInsToday.trend}</div>
          )}
        </div>
        {/* Pending Issues Card */}
        <div className="bg-orange-500/10 dark:bg-orange-900/20 border-l-4 border-orange-400 dark:border-orange-600 rounded-xl shadow p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-8 h-8 text-orange-500 dark:text-orange-400" />
            <span className="text-2xl font-bold text-orange-800 dark:text-orange-300">{keyMetrics?.pendingIssues || 'N/A'}</span>
          </div>
          <div className="text-lg font-semibold text-orange-700 dark:text-orange-300">Pending Issues</div>
          <div className="text-sm text-orange-600 dark:text-orange-400 mt-1">Please review and resolve outstanding issues.</div>
        </div>
      </div>

      {/* Event Overview & Quick Check-in */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <DashboardCard title="My Assigned Events">
          <div className="space-y-4">
            {filteredAssignedEvents?.map((event: any) => {
              const tasks = getTasks(event)
              return (
                <div key={event.id} className="p-4 bg-muted/50 rounded-lg flex flex-col gap-2 sm:gap-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                    <div>
                      <h4 className="font-semibold text-card-foreground text-lg sm:text-base">
                        {event.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
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

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>
                        {event.checkedIn}/{event.totalAttendees}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row justify-between text-xs">
                      <span>Check-in Progress</span>
                      <span>
                        {event.totalAttendees
                          ? Math.round(
                            (event.checkedIn / event.totalAttendees) * 100
                          )
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        event.totalAttendees
                          ? (event.checkedIn / event.totalAttendees) * 100
                          : 0
                      }
                      className="h-2"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        onClick={() => handleEventMessage(event.id)}
                        className="flex-1 bg-brand-gradient bg-brand-gradient-hover text-foreground text-sm py-2"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Event Chat
                      </Button>
                      <Button
                        onClick={() => handleMessageOrganizer(event)}
                        variant="outline"
                        className="flex-1 text-sm py-2 border-[hsl(var(--color-warning))] text-[hsl(var(--color-warning))]"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message Organizer
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h5 className="font-semibold mb-2 text-base sm:text-sm">Assigned Tasks</h5>
                    {tasks.length === 0 ? (
                      <div className="text-muted-foreground text-sm">No tasks assigned.</div>
                    ) : (
                      <ul className="space-y-2">
                        {tasks.map((task: string) => (
                          <li key={task} className="flex items-center gap-2">
                            <Checkbox
                              checked={taskCompletion[event.id]?.[task] || false}
                              onCheckedChange={async (checked) => {
                                setTaskCompletion((prev) => ({
                                  ...prev,
                                  [event.id]: {
                                    ...prev[event.id],
                                    [task]: checked,
                                  },
                                }))
                                if (checked) {
                                  setCompletingTask((prev) => ({ ...prev, [event.id]: true }))
                                  try {
                                    await api.post(`/events/${event.id}/usher/tasks/complete`, {
                                      completed_tasks: [task],
                                    })
                                    // Optionally show a toast or refresh data
                                  } catch {
                                    // Optionally handle error
                                  } finally {
                                    setCompletingTask((prev) => ({ ...prev, [event.id]: false }))
                                  }
                                }
                              }}
                              disabled={completingTask[event.id]}
                            />
                            <span className={taskCompletion[event.id]?.[task] ? 'line-through text-muted-foreground/50' : ''}>{task}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row gap-2 mt-2">
                    <div className="flex-1">
                      <span className="block text-sm font-medium text-foreground">Assigned Tasks:</span>
                      <span className="block text-card-foreground">
                        {Array.isArray(event.tasks) && event.tasks.length > 0
                          ? event.tasks.join(', ')
                          : 'No tasks assigned.'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="block text-sm font-medium text-foreground">Daily Rate:</span>
                      <span className="block text-card-foreground">{event.daily_rate ? `${event.daily_rate} ETB` : '-'}</span>
                    </div>
                    <div className="flex-1">
                      <span className="block text-sm font-medium text-foreground">Ushering Days:</span>
                      <span className="block text-card-foreground">
                        {event.from_date ? event.from_date : '-'}
                        {event.from_date || event.to_date ? ' to ' : ''}
                        {event.to_date ? event.to_date : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-2 mt-2 items-center">
                    <div className="flex-1">
                      <span className="block text-sm font-medium text-foreground">Status:</span>
                      <span className="block text-card-foreground capitalize">{event.accepted}</span>
                    </div>
                    {event.accepted === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 text-foreground" disabled={actionLoading} onClick={() => handleAcceptJob(event.id)}>
                          Accept
                        </Button>
                        <Button size="sm" className="bg-red-600 text-foreground" disabled={actionLoading} onClick={() => setRejectDialogOpenId(event.id)}>
                          Reject
                        </Button>
                      </div>
                    )}
                    {event.accepted === 'accepted' && (
                      <div className="flex-1 text-green-700 font-semibold">
                        Expected Earnings: {event.daily_rate && event.from_date && event.to_date ? `${calculateEarnings(event.daily_rate, event.from_date, event.to_date)} ETB` : '-'}
                      </div>
                    )}
                    {event.accepted === 'rejected' && (
                      <div className="flex-1 text-red-700 font-semibold">
                        Rejected: {event.rejected_reason || 'No reason provided'}
                      </div>
                    )}
                  </div>
                  {/* Reject Reason Dialog */}
                  <Dialog open={rejectDialogOpenId === event.id} onOpenChange={open => { if (!open) setRejectDialogOpenId(null); }}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Reject Job</DialogTitle>
                        <DialogDescription>Provide a reason for rejecting this job assignment.</DialogDescription>
                      </DialogHeader>
                      <textarea
                        className="w-full border rounded px-2 py-1 mt-2"
                        rows={3}
                        placeholder="Reason for rejection"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                      />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpenId(null)} disabled={actionLoading}>Cancel</Button>
                        <Button onClick={() => handleRejectJob(event.id)} disabled={actionLoading || !rejectReason.trim()} className="bg-red-600 text-foreground">
                          {actionLoading ? 'Rejecting...' : 'Reject Job'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mt-3 gap-2">
                    <span className="text-sm text-muted-foreground">
                      Zone: {event.zone}
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Link to={`/dashboard/usher/events?eventId=${event.id}`} className="w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto bg-brand-gradient bg-brand-gradient-hover text-foreground text-sm py-2"
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        </DashboardCard>

        <DashboardCard title="Quick Check-in">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Search attendee name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 min-w-0"
              />
              <Button variant="outline" className="w-full sm:w-auto">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger>
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {assignedEvents?.map((event: any) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="p-4 border-2 border-dashed border-border rounded-lg text-center">
              <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                Scan QR code or search manually
              </p>
            </div>

            <Button
              onClick={() => navigate('/dashboard/ticket-validator')}
              className="w-full bg-brand-gradient bg-brand-gradient-hover text-foreground text-sm py-2"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Manual Check-in
            </Button>
          </div>
        </DashboardCard>
      </div>

      {/* Quick Actions */}
      <DashboardCard title="Quick Actions">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          <Link
            to="/dashboard/messages"
            className="block p-4 text-center bg-muted/50 hover:bg-accent rounded-lg transition-colors"
          >
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-primary" />
            <span className="font-medium">Messages</span>
          </Link>
          <Link
            to="/dashboard/ticket-validator"
            className="block p-4 text-center bg-muted/50 hover:bg-accent rounded-lg transition-colors"
          >
            <QrCode className="w-8 h-8 mx-auto mb-2 text-primary" />
            <span className="font-medium">Ticket Validator</span>
          </Link>
          <Link
            to="/dashboard/usher/events"
            className="block p-4 text-center bg-muted/50 hover:bg-accent rounded-lg transition-colors"
          >
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <span className="font-medium">Guest List</span>
          </Link>
          <Link
            to="/dashboard/locate-badges"
            className="block p-4 text-center bg-muted/50 hover:bg-accent rounded-lg transition-colors"
          >
            <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
            <span className="font-medium">Locate Badges</span>
          </Link>
        </div>
      </DashboardCard>

      {/* Recent Activity & Support Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Recent Check-ins">
          <div className="space-y-3">
            {filteredCheckIns?.map((checkIn: any) => (
              <div key={checkIn.id} className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-full">
                  <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{checkIn.name}</p>
                  <p className="text-xs text-muted-foreground/70">{checkIn.company}</p>
                </div>
                <div className="text-right">
                  <Badge className={getTypeColor(checkIn.guest_type?.name)}>{checkIn.guest_type?.name || ''}</Badge>
                  <p className="text-xs text-muted-foreground/70 mt-1">{checkIn.time}</p>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Pending Issues">
          <div className="space-y-3">
            {pendingIssues?.map((issue: any) => (
              <div
                key={issue.id}
                className={`p-3 rounded-lg border ${getPriorityColor(
                  issue.priority
                )}`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{issue.issue}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {issue.location} • {issue.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            Report New Issue
          </Button>
        </DashboardCard>

        {/* Recent Activity */}
        <div className="col-span-1 lg:col-span-2">
          <RecentActivity limit={6} />
        </div>
      </div>

    </div>
  )
}

function calculateEarnings(dailyRate: number | string, fromDate: string, toDate: string) {
  if (!dailyRate || !fromDate || !toDate) return 0;
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  return Number(dailyRate) * days;
}
