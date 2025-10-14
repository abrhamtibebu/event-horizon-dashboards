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
import { useOutletContext } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Checkbox } from '@/components/ui/checkbox'
import { QrReader } from '@blackbox-vision/react-qr-reader';
// Suppress defaultProps warning for QrReader (temporary workaround)
if (QrReader && QrReader.defaultProps) {
  QrReader.defaultProps = undefined;
}
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import axios from 'axios';


export default function UsherDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { searchQuery } = useOutletContext<{ searchQuery: string }>()
  const [taskCompletion, setTaskCompletion] = useState<{ [eventId: string]: { [task: string]: boolean } }>({})
  const [completingTask, setCompletingTask] = useState<{ [eventId: string]: boolean }>({})
  const [qrDialogOpenEventId, setQrDialogOpenEventId] = useState<string | null>(null);
  const [qrScanStatus, setQrScanStatus] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [rejectDialogOpenId, setRejectDialogOpenId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchUsherData = async () => {
      try {
        setLoading(true)
        const response = await api.get('/dashboard/usher')
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
        return 'bg-green-100 text-green-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    return getGuestTypeBadgeClasses(type);
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

  // Handler for QR scan (per event)
  const handleQrScan = async (data: string | null, eventId: string) => {
    if (!data || !eventId) return;
    setQrLoading(true);
    setQrScanStatus(null);
    try {
      // Fetch attendees for this event
      const res = await api.get(`/events/${eventId}/attendees`);
      let attendee = res.data.find((a: any) => a.id?.toString() === data || a.guest?.email === data);
      if (!attendee) {
        setQrScanStatus('No matching attendee found for this QR code.');
        setQrLoading(false);
        return;
      }
      // Mark as checked in
      await api.post(`/events/${eventId}/attendees/${attendee.id}/check-in`, { checked_in: true });
      setQrScanStatus(`Checked in: ${attendee.guest?.name || attendee.id}`);
      // Optionally update dashboardData/recentCheckIns if needed
    } catch (err: any) {
      setQrScanStatus('Failed to check in attendee. Please try again.');
    } finally {
      setQrLoading(false);
    }
  };
  const handleQrError = (err: any) => {
    setQrScanStatus('QR scanner error. Please try again.');
  };

  // Accept job
  const handleAcceptJob = async (eventId: string) => {
    setActionLoading(true);
    try {
      await axios.post(`/api/events/${eventId}/usher/accept`);
      window.location.reload(); // Or refetch events
    } catch (err) {
      alert('Failed to accept job.');
    } finally {
      setActionLoading(false);
    }
  };
  // Reject job
  const handleRejectJob = async (eventId: string) => {
    setActionLoading(true);
    try {
      await axios.post(`/api/events/${eventId}/usher/reject`, { reason: rejectReason });
      setRejectDialogOpenId(null);
      setRejectReason('');
      window.location.reload(); // Or refetch events
    } catch (err) {
      alert('Failed to reject job.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>
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
          icon={<Calendar className="w-6 h-6 text-blue-600" />}
        />
        <MetricCard
          title="Active Events"
          value={keyMetrics?.activeEvents || 'N/A'}
          icon={<Users className="w-6 h-6 text-purple-600" />}
        />
        {/* Additional Stats */}
        <MetricCard
          title="Total Earnings"
          value={keyMetrics?.totalEarnings ? `${keyMetrics.totalEarnings} ETB` : '0.00'}
          icon={<CheckCircle className="w-6 h-6 text-yellow-500" />}
        />
        <MetricCard
          title="Earnings per Event"
          value={keyMetrics?.earningsPerEvent ? `${keyMetrics.earningsPerEvent} ETB` : '0.00'}
          icon={<CheckCircle className="w-6 h-6 text-yellow-500" />}
        />
        {/* More stats coming soon */}
      </div>

      {/* New prominent cards for Total Check-ins Today and Pending Issues */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
        {/* Total Check-ins Today Card */}
        <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl shadow p-6 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-2">
            <UserCheck className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-green-900">{keyMetrics?.totalCheckInsToday?.value || 'N/A'}</span>
          </div>
          <div className="text-lg font-semibold text-green-800">Total Check-ins Today</div>
          {keyMetrics?.totalCheckInsToday?.trend && (
            <div className="text-sm text-green-700 mt-1">{keyMetrics.totalCheckInsToday.trend}</div>
          )}
        </div>
        {/* Pending Issues Card */}
        <div className="bg-orange-50 border-l-4 border-orange-400 rounded-xl shadow p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold text-orange-800">{keyMetrics?.pendingIssues || 'N/A'}</span>
          </div>
          <div className="text-lg font-semibold text-orange-700">Pending Issues</div>
          <div className="text-sm text-orange-600 mt-1">Please review and resolve outstanding issues.</div>
        </div>
      </div>

      {/* Event Overview & Quick Check-in */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <DashboardCard title="My Assigned Events">
          <div className="space-y-4">
            {filteredAssignedEvents?.map((event: any) => {
              const tasks = getTasks(event)
              return (
                <div key={event.id} className="p-4 bg-gray-50 rounded-lg flex flex-col gap-2 sm:gap-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg sm:text-base">
                        {event.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
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

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
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
                    <Link to={`/dashboard/events/${event.id}/messages`} tabIndex={-1} aria-disabled="true" title="Coming Soon!" onClick={e => e.preventDefault()}>
                      <Button className="mt-2 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm py-2">Message (Coming Soon)</Button>
                    </Link>
                  </div>

                  <div className="mt-4">
                    <h5 className="font-semibold mb-2 text-base sm:text-sm">Assigned Tasks</h5>
                    {tasks.length === 0 ? (
                      <div className="text-gray-500 text-sm">No tasks assigned.</div>
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
                            <span className={taskCompletion[event.id]?.[task] ? 'line-through text-gray-400' : ''}>{task}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row gap-2 mt-2">
                    <div className="flex-1">
                      <span className="block text-sm font-medium text-gray-700">Assigned Tasks:</span>
                      <span className="block text-gray-800">
                        {Array.isArray(event.tasks) && event.tasks.length > 0
                          ? event.tasks.join(', ')
                          : 'No tasks assigned.'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="block text-sm font-medium text-gray-700">Daily Rate:</span>
                      <span className="block text-gray-800">{event.daily_rate ? `${event.daily_rate} ETB` : '-'}</span>
                    </div>
                    <div className="flex-1">
                      <span className="block text-sm font-medium text-gray-700">Ushering Days:</span>
                      <span className="block text-gray-800">
                        {event.from_date ? event.from_date : '-'}
                        {event.from_date || event.to_date ? ' to ' : ''}
                        {event.to_date ? event.to_date : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-2 mt-2 items-center">
                    <div className="flex-1">
                      <span className="block text-sm font-medium text-gray-700">Status:</span>
                      <span className="block text-gray-800 capitalize">{event.accepted}</span>
                    </div>
                    {event.accepted === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 text-white" disabled={actionLoading} onClick={() => handleAcceptJob(event.id)}>
                          Accept
                        </Button>
                        <Button size="sm" className="bg-red-600 text-white" disabled={actionLoading} onClick={() => setRejectDialogOpenId(event.id)}>
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
                        <Button onClick={() => handleRejectJob(event.id)} disabled={actionLoading || !rejectReason.trim()} className="bg-red-600 text-white">
                          {actionLoading ? 'Rejecting...' : 'Reject Job'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mt-3 gap-2">
                    <span className="text-sm text-gray-600">
                      Zone: {event.zone}
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Link to={`/dashboard/usher/events?eventId=${event.id}`} className="w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 text-sm py-2"
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Manage
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-sm py-2"
                        onClick={() => {
                          setQrDialogOpenEventId(event.id.toString());
                          setQrScanStatus(null);
                        }}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Check-in
                      </Button>
                      {/* QR Scanner Dialog for this event */}
                      <Dialog open={qrDialogOpenEventId === event.id.toString()} onOpenChange={open => {
                        if (!open) setQrDialogOpenEventId(null);
                      }}>
                        <DialogContent className="max-w-md w-full">
                          <DialogHeader>
                            <DialogTitle>QR Code Check-In</DialogTitle>
                            <DialogDescription>
                              Scan a guest's QR code to check them in.<br />
                              <span className="text-xs text-gray-500">If prompted, please allow camera access. For best results, use your phone's rear camera.</span>
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex flex-col items-center gap-4 py-4">
                            <QrReader
                              constraints={{ facingMode: { ideal: 'environment' } }}
                              onResult={(result, error) => {
                                if (!!result) handleQrScan(result.getText(), event.id.toString());
                                if (!!error) handleQrError(error);
                              }}
                              containerStyle={{ width: '100%' }}
                              videoStyle={{ width: '100%' }}
                              scanDelay={200}
                              videoId={`usher-qr-video-${event.id}`}
                            />
                            {qrLoading && <div className="text-blue-500">Checking in...</div>}
                            {qrScanStatus && <div className="text-center text-sm text-blue-700">{qrScanStatus}</div>}
                            <Button variant="outline" onClick={() => setQrDialogOpenEventId(null)}>Close</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
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

            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">
                Scan QR code or search manually
              </p>
            </div>

            <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-sm py-2">
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
            to="/dashboard/locate-badges"
            className="block p-4 text-center bg-gray-50 hover:bg-gray-100 rounded-lg"
          >
            <MapPin className="w-8 h-8 mx-auto mb-2 text-blue-600" />
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
                <div className="p-2 bg-gray-100 rounded-full">
                  <UserCheck className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{checkIn.name}</p>
                  <p className="text-xs text-gray-500">{checkIn.company}</p>
                </div>
                <div className="text-right">
                  <Badge className={getTypeColor(checkIn.guest_type?.name)}>{checkIn.guest_type?.name || ''}</Badge>
                  <p className="text-xs text-gray-500 mt-1">{checkIn.time}</p>
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
      </div>

      {/* Example usage of filteredAssignedEvents and filteredCheckIns */}
      {filteredAssignedEvents && (
        <DashboardCard title="Assigned Events (Filtered)">
          <ul>
            {filteredAssignedEvents.map((event: any, idx: number) => (
              <li key={idx}>{event.name}</li>
            ))}
          </ul>
        </DashboardCard>
      )}
      {filteredCheckIns && (
        <DashboardCard title="Recent Check-ins (Filtered)">
          <ul>
            {filteredCheckIns.map((checkIn: any, idx: number) => (
              <li key={idx}>{checkIn.name}</li>
            ))}
          </ul>
        </DashboardCard>
      )}
    </div>
  )
}

function calculateEarnings(dailyRate: number|string, fromDate: string, toDate: string) {
  if (!dailyRate || !fromDate || !toDate) return 0;
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  return Number(dailyRate) * days;
}
