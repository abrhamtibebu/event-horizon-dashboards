import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import {
  Calendar,
  Users,
  Building2,
  BarChart3,
  Settings,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Plus,
  FileText,
  Shield,
  Trash2,
  MapPin,
  MessageSquare,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Link, useOutletContext } from 'react-router-dom'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { RecentActivity } from '@/components/RecentActivity'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trashCount, setTrashCount] = useState(0)
  const { searchQuery } = useOutletContext<{ searchQuery: string }>()

  const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([])
  const [approvedOrganizers, setApprovedOrganizers] = useState<any[]>([])
  const [organizerLoading, setOrganizerLoading] = useState(true)
  const [organizerError, setOrganizerError] = useState<string | null>(null)

  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditLoading, setAuditLoading] = useState(true)
  const [auditError, setAuditError] = useState<string | null>(null)

  const [reportSummary, setReportSummary] = useState<any>(null)
  const [eventsList, setEventsList] = useState<any[]>([])
  const [reportLoading, setReportLoading] = useState(true)
  const [reportError, setReportError] = useState<string | null>(null)

  const [pendingEvents, setPendingEvents] = useState<any[]>([])
  const [pendingEventsLoading, setPendingEventsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const response = await api.get('/dashboard/admin')
        setStats(response.data)
        setError(null)
      } catch (err) {
        setError('Failed to fetch dashboard data. The backend endpoint might not be implemented yet.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    const fetchTrashCount = async () => {
      try {
        const response = await api.get('/trash')
        setTrashCount(response.data.total_items || 0)
      } catch (error) {
        console.error('Failed to fetch trash count:', error)
      }
    }
    
    const fetchPendingEvents = async () => {
      try {
        setPendingEventsLoading(true)
        const response = await api.get('/events')
        // Handle paginated response structure
        const eventsData = response.data.data || response.data || []
        const events = Array.isArray(eventsData) ? eventsData : []
        const pending = events.filter((event: any) => 
          event.advertisement_status === 'pending'
        )
        setPendingEvents(pending.slice(0, 3)) // Show only first 3 pending events
      } catch (error) {
        console.error('Failed to fetch pending events:', error)
        setPendingEvents([])
      } finally {
        setPendingEventsLoading(false)
      }
    }
    
    fetchDashboardData()
    fetchTrashCount()
    fetchPendingEvents()
  }, [])

  const updateAdvertisementStatus = async (eventId: number, status: string) => {
    try {
      await api.put(`/events/${eventId}/advertisement-status`, {
        advertisement_status: status
      })
      
      // Update local state
      setPendingEvents(prev => prev.filter(event => event.id !== eventId))
      
      // Show success message
      console.log(`Event ${eventId} ${status} successfully`)
    } catch (error) {
      console.error('Failed to update advertisement status:', error)
    }
  }

  // Fetch organizers
  useEffect(() => {
    setOrganizerLoading(true)
    Promise.all([
      api.get('/organizers?status=pending'),
      api.get('/organizers?status=active'),
    ])
      .then(([pendingRes, approvedRes]) => {
        // Handle paginated response structure
        const pendingData = pendingRes.data.data || pendingRes.data || []
        const approvedData = approvedRes.data.data || approvedRes.data || []
        
        setPendingOrganizers(Array.isArray(pendingData) ? pendingData : [])
        setApprovedOrganizers(Array.isArray(approvedData) ? approvedData : [])
        setOrganizerError(null)
      })
      .catch((err) => {
        console.error('Failed to fetch organizers:', err)
        setOrganizerError('Failed to fetch organizers')
        setPendingOrganizers([])
        setApprovedOrganizers([])
      })
      .finally(() => setOrganizerLoading(false))
  }, [])

  // Fetch audit logs
  useEffect(() => {
    setAuditLoading(true)
    api.get('/audit-logs')
      .then((res) => setAuditLogs(res.data.data || res.data))
      .catch(() => setAuditError('Failed to fetch audit logs'))
      .finally(() => setAuditLoading(false))
  }, [])

  // Fetch report summary and events
  useEffect(() => {
    setReportLoading(true)
    Promise.all([
      api.get('/reports/summary'),
      api.get('/events'),
    ])
      .then(([summaryRes, eventsRes]) => {
        setReportSummary(summaryRes.data)
        // Handle paginated response structure for events
        const eventsData = eventsRes.data.data || eventsRes.data || []
        setEventsList(Array.isArray(eventsData) ? eventsData : [])
        setReportError(null)
      })
      .catch(() => setReportError('Failed to fetch report summary'))
      .finally(() => setReportLoading(false))
  }, [])

  const filteredActivities =
    searchQuery && stats?.recentActivities
      ? stats.recentActivities.filter(
          (activity: any) =>
            activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.type?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : stats?.recentActivities

  // Organizers donut chart data
  const organizersDonutData = useMemo(() => [
    { name: 'Approved', value: approvedOrganizers.length },
    { name: 'Pending', value: pendingOrganizers.length },
  ], [approvedOrganizers, pendingOrganizers])

  // Audit logs last 30 days
  const auditLogsLast30Days = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    return auditLogs.filter((log) => new Date(log.created_at) >= cutoff)
  }, [auditLogs])

  // Audit logs per day for chart
  const auditLogsPerDay = useMemo(() => {
    const counts: Record<string, number> = {}
    auditLogsLast30Days.forEach((log) => {
      const day = new Date(log.created_at).toISOString().slice(0, 10)
      counts[day] = (counts[day] || 0) + 1
    })
    // Fill missing days
    const days: string[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().slice(0, 10))
    }
    return days.map((day) => ({ day, count: counts[day] || 0 }))
  }, [auditLogsLast30Days])

  // Most popular event and top 5 events
  const topEvents = useMemo(() => {
    if (!reportSummary || !eventsList.length) return []
    const idToName: Record<string, string> = {}
    eventsList.forEach((e) => { idToName[e.id] = e.name })
    return Object.entries(reportSummary.top_events_by_attendance || {})
      .map(([id, count]) => ({ name: idToName[id] || `Event #${id}`, attendees: count }))
      .sort((a, b) => b.attendees - a.attendees)
      .slice(0, 5)
  }, [reportSummary, eventsList])
  const mostPopularEvent = topEvents[0]

  // Peak month calculation
  const peakMonthData = useMemo(() => {
    if (!reportSummary || !reportSummary.registration_timeline) return { chart: [], peak: null }
    const monthCounts: Record<string, number> = {}
    Object.entries(reportSummary.registration_timeline).forEach(([date, count]) => {
      const month = new Date(date).toLocaleString('default', { month: 'short', year: 'numeric' })
      monthCounts[month] = (monthCounts[month] || 0) + count
    })
    const chart = Object.entries(monthCounts).map(([month, events]) => ({ month, events }))
    const peak = chart.reduce((max, cur) => cur.events > (max?.events || 0) ? cur : max, null)
    return { chart, peak }
  }, [reportSummary])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 animate-pulse">
        <div className="h-10 w-1/3 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 w-full bg-white/80 rounded-2xl shadow-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="h-96 w-full col-span-2 bg-white/80 rounded-2xl shadow-xl" />
          <div className="h-96 w-full bg-white/80 rounded-2xl shadow-xl" />
        </div>
      </div>
    )
  }
  if (error) return <div className="text-red-500">{error}</div>
  if (!stats) return <div>No dashboard data available.</div>

  const {
    keyMetrics,
    eventGrowth,
    eventStatusDistribution,
    userRoleDistribution,
    systemAlerts,
    recentActivities,
  } = stats

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Overview and management for all events, users, and system activity</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Link to="/dashboard/events/create">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Create New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="group relative overflow-hidden bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-6 hover:shadow-2xl transition-all duration-200">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm font-medium text-gray-600">Total Events</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{keyMetrics?.totalEvents?.value || 'N/A'}</div>
            <div className="text-xs text-gray-500">All events in the system</div>
          </div>
        </div>
        <div className="group relative overflow-hidden bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-6 hover:shadow-2xl transition-all duration-200">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm font-medium text-gray-600">Total Users</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{keyMetrics?.totalUsers?.value || 'N/A'}</div>
            <div className="text-xs text-gray-500">All users in the system</div>
          </div>
        </div>
        <div className="group relative overflow-hidden bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-6 hover:shadow-2xl transition-all duration-200">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm font-medium text-gray-600">Active Organizers</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{keyMetrics?.activeOrganizers?.value || 'N/A'}</div>
            <div className="text-xs text-gray-500">Organizers with active events</div>
          </div>
        </div>
        <div className="group relative overflow-hidden bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-6 hover:shadow-2xl transition-all duration-200">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm font-medium text-gray-600">Items in Trash</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{trashCount}</div>
            <div className="text-xs text-gray-500">Soft-deleted items</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Charts and Activity */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Event & User Growth Chart */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Event & User Growth</h3>
                <p className="text-sm text-gray-600">Trends in events and user registrations</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
            <LineChart data={eventGrowth}>
                  <defs>
                    <linearGradient id="eventGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Line type="monotone" dataKey="events" stroke="#3b82f6" strokeWidth={3} fill="url(#eventGrowthGradient)" name="Events" />
                  <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={3} fill="url(#userGrowthGradient)" name="Users" />
            </LineChart>
          </ResponsiveContainer>
            </div>
          </div>

          {/* Event Status Distribution Pie Chart */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Event Status Distribution</h3>
                <p className="text-sm text-gray-600">Breakdown of event statuses</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={eventStatusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="value"
                    label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                    labelLine={false}
              >
                {eventStatusDistribution?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
            </div>
          <div className="flex justify-center gap-4 mt-4">
            {eventStatusDistribution?.map((item: any) => (
              <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
          </div>

          {/* Organizers Pending Approval Section */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-yellow-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Organizers Pending Approval</h3>
                <p className="text-sm text-gray-600">Review and approve new organizers</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Donut Chart */}
              <div className="w-full md:w-1/3 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={organizersDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => percent > 0.1 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                    >
                      <Cell fill="#facc15" />
                      <Cell fill="#fde68a" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Pending Organizers List */}
              <div className="w-full md:w-2/3">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-yellow-50">
                        <th className="px-4 py-2 text-left font-semibold text-yellow-800">Name</th>
                        <th className="px-4 py-2 text-left font-semibold text-yellow-800">Email</th>
                        <th className="px-4 py-2 text-left font-semibold text-yellow-800">Requested</th>
                        <th className="px-4 py-2 text-left font-semibold text-yellow-800">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {organizerLoading ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-center">Loading organizers...</td>
                        </tr>
                      ) : organizerError ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-center text-red-500">{organizerError}</td>
                        </tr>
                      ) : pendingOrganizers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-center text-gray-500">No pending organizers.</td>
                        </tr>
                      ) : (
                        pendingOrganizers.map((org, idx) => (
                          <tr key={idx} className="border-b border-yellow-100">
                            <td className="px-4 py-2 font-medium text-gray-900">{org.name}</td>
                            <td className="px-4 py-2 text-gray-600">{org.email}</td>
                            <td className="px-4 py-2 text-gray-600">{org.created_at}</td>
                            <td className="px-4 py-2">
                              <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-50">Approve</Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Log Entries (Last 30 Days) Section */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-blue-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Audit Log Entries (Last 30 Days)</h3>
                <p className="text-sm text-gray-600">System activity trends and recent logs</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Bar Chart */}
              <div className="w-full md:w-1/2 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={auditLogsPerDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" hide />
                    <YAxis hide />
                    <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Recent Audit Log List */}
              <div className="w-full md:w-1/2 max-h-48 overflow-y-auto">
                <ul className="divide-y divide-blue-100">
                  {auditLoading ? (
                    <li className="py-2 text-center text-gray-500">Loading audit logs...</li>
                  ) : auditError ? (
                    <li className="py-2 text-center text-red-500">{auditError}</li>
                  ) : auditLogsLast30Days.length === 0 ? (
                    <li className="py-2 text-center text-gray-500">No recent audit logs.</li>
                  ) : (
                    auditLogsLast30Days.map((log, idx) => (
                      <li key={idx} className="py-2 flex items-center gap-3">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <div>
                          <div className="font-medium text-gray-900">{log.user?.name || log.user?.email || 'System'}</div>
                          <div className="text-xs text-gray-600">{log.action} • {log.created_at}</div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Most Popular Event Section */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-pink-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Most Popular Event</h3>
                <p className="text-sm text-gray-600">Top events by attendance</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-1/2">
                <div className="text-2xl font-bold text-pink-600 mb-2">Annual Tech Expo</div>
                <div className="text-sm text-gray-600 mb-4">Attendance: <span className="font-semibold text-gray-900">1,200</span></div>
                <div className="text-xs text-gray-500">Highest attendance event</div>
              </div>
              <div className="w-full md:w-1/2">
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={[
                    { name: 'Tech Expo', attendees: 1200 },
                    { name: 'Health Summit', attendees: 950 },
                    { name: 'EduCon', attendees: 800 },
                    { name: 'BizForum', attendees: 700 },
                    { name: 'ArtFest', attendees: 600 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <Bar dataKey="attendees" fill="#f472b6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Peak Month Section */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-orange-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Peak Month</h3>
                <p className="text-sm text-gray-600">Events per month (last year)</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="w-full h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakMonthData.chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Bar dataKey="events" fill="#fb923c">
                    {/* Highlight March as peak */}
                    {peakMonthData.peak && (
                      <Cell fill="#f59e42" />
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-700">
              <span className="inline-block bg-orange-100 text-orange-800 rounded px-2 py-1 font-semibold mr-2">Peak: {peakMonthData.peak?.month}</span>
              {peakMonthData.peak?.events} events
            </div>
          </div>
      </div>

        {/* Right: User Roles, Alerts, Activity */}
        <div className="flex flex-col gap-8">
          {/* User Role Distribution */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">User Role Distribution</h3>
                <p className="text-sm text-gray-600">Breakdown of user roles</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
            </div>
          <div className="space-y-4">
            {userRoleDistribution?.map((role: any) => (
              <div key={role.role} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{role.role}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{role.count}</span>
                    {role.growth > 0 && (
                        <Badge className="bg-green-100 text-green-800">+{role.growth}%</Badge>
                    )}
                  </div>
                </div>
                <Progress
                  value={
                      (role.count / (keyMetrics?.totalUsers?.numericValue || 1)) * 100
                  }
                  className="h-2"
                />
              </div>
            ))}
          </div>
          </div>

          {/* System Alerts */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
                <p className="text-sm text-gray-600">Recent system notifications</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
            </div>
          <div className="space-y-3">
            {systemAlerts?.map((alert: any) => (
              <div
                key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.severity === 'warning'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      : alert.severity === 'info'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : alert.severity === 'success'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : alert.severity === 'error'
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs opacity-75 mt-1">{alert.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            View All Alerts
          </Button>
      </div>

          {/* Pending Event Publications */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-orange-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pending Event Publications</h3>
                <p className="text-sm text-gray-600">Events waiting for Evella platform approval</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="space-y-3">
              {pendingEventsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                </div>
              ) : pendingEvents.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <Globe className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No pending events for publication</p>
                </div>
              ) : (
                pendingEvents.map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{event.name}</h4>
                      <p className="text-sm text-gray-600">by {event.organizer?.name}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(event.start_date), 'MMM dd, yyyy')} • {event.location}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateAdvertisementStatus(event.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAdvertisementStatus(event.id, 'rejected')}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {pendingEvents.length > 0 && (
              <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                <Link to="/dashboard/event-publication">
                  View All Events
                </Link>
              </Button>
            )}
          </div>

          {/* Recent Activity */}
          <RecentActivity limit={6} />
        </div>
      </div>
    </div>
  )
}
