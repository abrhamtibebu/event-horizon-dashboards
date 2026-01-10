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
import { SpinnerInline } from '@/components/ui/spinner'
import { ReportMetrics, Event, TopEvent } from '@/types/reports'
import { transformTopEvents, transformToBarChart, transformTimeline, formatChartDate, getChartStyles, getChartColors, getChartColorPalette } from '@/utils/reportTransformers'
import { BarChartComponent } from '@/components/reports/BarChartComponent'
import { PieChartComponent } from '@/components/reports/PieChartComponent'
import { RevenueLineChart } from '@/components/reports/RevenueLineChart'
import { useModernAlerts } from '@/hooks/useModernAlerts'

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

  const [reportSummary, setReportSummary] = useState<ReportMetrics | null>(null)
  const [eventsList, setEventsList] = useState<Event[]>([])
  const [reportLoading, setReportLoading] = useState(true)
  const [reportError, setReportError] = useState<string | null>(null)


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
    
    fetchDashboardData()
    fetchTrashCount()
  }, [])


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

  const { showError } = useModernAlerts()

  // Fetch report summary and events
  useEffect(() => {
    let isMounted = true
    setReportLoading(true)
    
    Promise.all([
      api.get('/reports/summary'),
      api.get('/events'),
    ])
      .then(([summaryRes, eventsRes]) => {
        if (!isMounted) return
        
        setReportSummary(summaryRes.data as ReportMetrics)
        // Handle paginated response structure for events
        const eventsData = eventsRes.data.data || eventsRes.data || []
        setEventsList(Array.isArray(eventsData) ? eventsData : [])
        setReportError(null)
      })
      .catch((err: any) => {
        if (!isMounted) return
        const errorMessage = err.response?.data?.message || 'Failed to fetch report summary'
        setReportError(errorMessage)
        showError('Failed to Load Reports', errorMessage)
        console.error('Report fetch error:', err)
      })
      .finally(() => {
        if (isMounted) {
          setReportLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [showError])

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
    eventsList.forEach((e) => { 
      idToName[String(e.id)] = e.name 
    })
    return transformTopEvents(reportSummary.top_events_by_attendance || {}, idToName).slice(0, 5)
  }, [reportSummary, eventsList])
  const mostPopularEvent = topEvents[0]

  // Peak month calculation
  const peakMonthData = useMemo(() => {
    if (!reportSummary || !reportSummary.registration_timeline) return { chart: [], peak: null }
    const monthCounts: Record<string, number> = {}
    Object.entries(reportSummary.registration_timeline).forEach(([date, count]) => {
      const month = new Date(date).toLocaleString('default', { month: 'short', year: 'numeric' })
      monthCounts[month] = (monthCounts[month] || 0) + (typeof count === 'number' ? count : 0)
    })
    const chart = Object.entries(monthCounts).map(([month, events]) => ({ 
      name: month, 
      value: events 
    }))
    const peak = chart.reduce((max, cur) => cur.value > (max?.value || 0) ? cur : max, null as { name: string; value: number } | null)
    return { chart, peak }
  }, [reportSummary])

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 animate-pulse">
        <div className="h-10 w-1/3 bg-muted rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 w-full bg-card/80 rounded-2xl shadow-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="h-96 w-full col-span-2 bg-card/80 rounded-2xl shadow-xl" />
          <div className="h-96 w-full bg-card/80 rounded-2xl shadow-xl" />
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
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-foreground dark:text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Overview and management for all events, users, and system activity</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Link to="/dashboard/events/create">
            <Button className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Create New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="group relative overflow-hidden bg-card/80 backdrop-blur-md rounded-2xl shadow-xl border border-border p-6 hover:shadow-2xl transition-all duration-200">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-10 translate-x-10 bg-[hsl(var(--primary))]/10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-foreground dark:text-white" />
              </div>
              <div className="text-sm font-medium text-muted-foreground">Total Events</div>
            </div>
            <div className="text-3xl font-bold text-card-foreground mb-1">{keyMetrics?.totalEvents?.value || 'N/A'}</div>
            <div className="text-xs text-muted-foreground/70">All events in the system</div>
          </div>
        </div>
        <div className="group relative overflow-hidden bg-card/80 backdrop-blur-md rounded-2xl shadow-xl border border-border p-6 hover:shadow-2xl transition-all duration-200">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-10 translate-x-10 bg-[hsl(var(--primary))]/10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-[hsl(var(--color-rich-black))]" />
              </div>
              <div className="text-sm font-medium text-muted-foreground">Total Users</div>
            </div>
            <div className="text-3xl font-bold text-card-foreground mb-1">{keyMetrics?.totalUsers?.value || 'N/A'}</div>
            <div className="text-xs text-muted-foreground/70">All users in the system</div>
          </div>
        </div>
        <div className="group relative overflow-hidden bg-card/80 backdrop-blur-md rounded-2xl shadow-xl border border-border p-6 hover:shadow-2xl transition-all duration-200">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-10 translate-x-10 bg-success/10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[hsl(var(--color-rich-black))]" />
              </div>
              <div className="text-sm font-medium text-muted-foreground">Active Organizers</div>
            </div>
            <div className="text-3xl font-bold text-card-foreground mb-1">{keyMetrics?.activeOrganizers?.value || 'N/A'}</div>
            <div className="text-xs text-muted-foreground/70">Organizers with active events</div>
          </div>
        </div>
        <div className="group relative overflow-hidden bg-card/80 backdrop-blur-md rounded-2xl shadow-xl border border-border p-6 hover:shadow-2xl transition-all duration-200">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-10 translate-x-10 bg-error/10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-error rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-foreground dark:text-white" />
              </div>
              <div className="text-sm font-medium text-muted-foreground">Items in Trash</div>
            </div>
            <div className="text-3xl font-bold text-card-foreground mb-1">{trashCount}</div>
            <div className="text-xs text-muted-foreground/70">Soft-deleted items</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Charts and Activity */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Event & User Growth Chart */}
          <div className="bg-card/80 backdrop-blur-md rounded-2xl shadow-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Event & User Growth</h3>
                <p className="text-sm text-muted-foreground">Trends in events and user registrations</p>
              </div>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[hsl(var(--color-rich-black))]" />
              </div>
            </div>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
            <LineChart data={eventGrowth}>
                  {(() => {
                    const styles = getChartStyles();
                    const chartColors = getChartColors();
                    
                    return (
                      <>
                        <defs>
                          <linearGradient id="eventGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColors.line} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={chartColors.line} stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColors.line} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={chartColors.line} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
                        <XAxis dataKey="month" stroke={styles.axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke={styles.axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={{ backgroundColor: styles.tooltipBg, border: `1px solid ${styles.tooltipBorder}`, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: styles.tooltipText }} />
                        <Line type="monotone" dataKey="events" stroke={chartColors.line} strokeWidth={3} fill="url(#eventGrowthGradient)" name="Events" />
                        <Line type="monotone" dataKey="users" stroke={chartColors.line} strokeWidth={3} fill="url(#userGrowthGradient)" name="Users" />
                      </>
                    );
                  })()}
            </LineChart>
          </ResponsiveContainer>
            </div>
          </div>

          {/* Event Status Distribution Pie Chart */}
          <div className="bg-card/80 backdrop-blur-md rounded-2xl shadow-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Event Status Distribution</h3>
                <p className="text-sm text-muted-foreground">Breakdown of event statuses</p>
              </div>
              <div className="w-8 h-8 bg-[hsl(var(--color-warning))] rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[hsl(var(--color-rich-black))]" />
              </div>
            </div>
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                  {(() => {
                    const styles = getChartStyles();
                    const colors = getChartColorPalette('primary');
                    
                    return (
                      <>
                        <Pie
                          data={eventStatusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          dataKey="value"
                          label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                          labelLine={false}
                          labelStyle={{ fill: styles.labelColor }}
                        >
                          {eventStatusDistribution?.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: styles.tooltipBg, border: `1px solid ${styles.tooltipBorder}`, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: styles.tooltipText }} />
                      </>
                    );
                  })()}
            </PieChart>
          </ResponsiveContainer>
            </div>
          <div className="flex justify-center gap-4 mt-4">
            {eventStatusDistribution?.map((item: any) => (
              <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
          </div>

          {/* Organizers Pending Approval Section */}
          <div className="bg-card/80 backdrop-blur-md rounded-2xl shadow-xl border border-yellow-200 dark:border-yellow-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Organizers Pending Approval</h3>
                <p className="text-sm text-muted-foreground">Review and approve new organizers</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-foreground dark:text-white" />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Donut Chart */}
              <div className="w-full md:w-1/3 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    {(() => {
                      const styles = getChartStyles();
                      const chartColors = getChartColors();
                      
                      return (
                        <>
                          <Pie
                            data={organizersDonutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            fill={chartColors.accent}
                            dataKey="value"
                            label={({ name, percent }) => percent > 0.1 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                            labelStyle={{ fill: styles.labelColor }}
                          >
                            <Cell fill={chartColors.warning} />
                            <Cell fill={chartColors.accent} />
                          </Pie>
                          <RechartsTooltip contentStyle={{ backgroundColor: styles.tooltipBg, border: `1px solid ${styles.tooltipBorder}`, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: styles.tooltipText }} />
                        </>
                      );
                    })()}
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Pending Organizers List */}
              <div className="w-full md:w-2/3">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-yellow-500/10 dark:bg-yellow-900/20">
                        <th className="px-4 py-2 text-left font-semibold text-yellow-800 dark:text-yellow-300">Name</th>
                        <th className="px-4 py-2 text-left font-semibold text-yellow-800 dark:text-yellow-300">Email</th>
                        <th className="px-4 py-2 text-left font-semibold text-yellow-800 dark:text-yellow-300">Requested</th>
                        <th className="px-4 py-2 text-left font-semibold text-yellow-800 dark:text-yellow-300">Action</th>
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
                          <td colSpan={4} className="px-4 py-2 text-center text-muted-foreground">No pending organizers.</td>
                        </tr>
                      ) : (
                        pendingOrganizers.map((org, idx) => (
                          <tr key={idx} className="border-b border-yellow-200 dark:border-yellow-700/50">
                            <td className="px-4 py-2 font-medium text-card-foreground">{org.name}</td>
                            <td className="px-4 py-2 text-muted-foreground">{org.email}</td>
                            <td className="px-4 py-2 text-muted-foreground">{org.created_at}</td>
                            <td className="px-4 py-2">
                              <Button size="sm" variant="outline" className="border-yellow-300 dark:border-yellow-700/50 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/30">Approve</Button>
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
          <div className="bg-card/80 backdrop-blur-md rounded-2xl shadow-xl border border-blue-200 dark:border-blue-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Audit Log Entries (Last 30 Days)</h3>
                <p className="text-sm text-muted-foreground">System activity trends and recent logs</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-foreground dark:text-white" />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Bar Chart */}
              <div className="w-full md:w-1/2 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={auditLogsPerDay}>
                    {(() => {
                      const styles = getChartStyles();
                      const chartColors = getChartColors();
                      
                      return (
                        <>
                          <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
                          <XAxis dataKey="day" hide />
                          <YAxis hide />
                          <Bar dataKey="count" fill={chartColors.info} radius={[4, 4, 0, 0]} />
                        </>
                      );
                    })()}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Recent Audit Log List */}
              <div className="w-full md:w-1/2 max-h-48 overflow-y-auto">
                <ul className="divide-y divide-blue-100">
                  {auditLoading ? (
                    <li className="py-2 text-center text-muted-foreground">Loading audit logs...</li>
                  ) : auditError ? (
                    <li className="py-2 text-center text-red-500">{auditError}</li>
                  ) : auditLogsLast30Days.length === 0 ? (
                    <li className="py-2 text-center text-muted-foreground">No recent audit logs.</li>
                  ) : (
                    auditLogsLast30Days.map((log, idx) => (
                      <li key={idx} className="py-2 flex items-center gap-3">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <div>
                          <div className="font-medium text-card-foreground">{log.user?.name || log.user?.email || 'System'}</div>
                          <div className="text-xs text-muted-foreground">{log.action} • {log.created_at}</div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Most Popular Event Section */}
          <div className="bg-card/80 backdrop-blur-md rounded-2xl shadow-xl border border-pink-200 dark:border-pink-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Most Popular Event</h3>
                <p className="text-sm text-muted-foreground">Top events by attendance</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-foreground dark:text-white" />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-1/2">
                {mostPopularEvent ? (
                  <>
                    <div className="text-2xl font-bold text-pink-600 mb-2">{mostPopularEvent.name}</div>
                    <div className="text-sm text-muted-foreground mb-4">
                      Attendance: <span className="font-semibold text-card-foreground">
                        {mostPopularEvent.attendees.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground/70">Highest attendance event</div>
                  </>
                ) : (
                  <div className="text-muted-foreground">No event data available</div>
                )}
              </div>
              <div className="w-full md:w-1/2">
                {topEvents.length > 0 ? (
                  <BarChartComponent
                    data={topEvents.map(e => ({ name: e.name, value: e.attendees }))}
                    height={120}
                    dataKey="value"
                    emptyMessage="No event data available"
                  />
                ) : (
                  <div className="flex items-center justify-center h-[120px] text-muted-foreground text-sm">
                    No event data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Peak Month Section */}
          <div className="bg-card/80 backdrop-blur-md rounded-2xl shadow-xl border border-orange-200 dark:border-orange-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Peak Month</h3>
                <p className="text-sm text-muted-foreground">Events per month (last year)</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-foreground dark:text-white" />
              </div>
            </div>
            <div className="w-full h-[200px]">
              {peakMonthData.chart.length > 0 ? (
                <BarChartComponent
                  data={peakMonthData.chart}
                  height={200}
                  dataKey="value"
                  showGradient
                  gradientId="peakMonthGradient"
                  emptyMessage="No month data available"
                />
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                  No month data available
                </div>
              )}
            </div>
            {peakMonthData.peak && (
              <div className="mt-4 text-sm text-card-foreground">
                <span className="inline-block bg-orange-500/10 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded px-2 py-1 font-semibold mr-2">
                  Peak: {peakMonthData.peak.name}
                </span>
                {peakMonthData.peak.value} events
              </div>
            )}
          </div>
      </div>

        {/* Right: User Roles, Alerts, Activity */}
        <div className="flex flex-col gap-8">
          {/* User Role Distribution */}
          <div className="bg-card/80 backdrop-blur-md rounded-2xl shadow-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">User Role Distribution</h3>
                <p className="text-sm text-muted-foreground">Breakdown of user roles</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-foreground dark:text-white" />
              </div>
            </div>
          <div className="space-y-4">
            {userRoleDistribution?.map((role: any) => (
              <div key={role.role} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-card-foreground">{role.role}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{role.count}</span>
                    {role.growth > 0 && (
                        <Badge className="bg-green-500/10 dark:bg-green-900/30 text-green-800 dark:text-green-300">+{role.growth}%</Badge>
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
          <div className="bg-card/80 backdrop-blur-md rounded-2xl shadow-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">System Alerts</h3>
                <p className="text-sm text-muted-foreground">Recent system notifications</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-foreground dark:text-white" />
              </div>
            </div>
          <div className="space-y-3">
            {systemAlerts?.map((alert: any) => (
              <div
                key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.severity === 'warning'
                      ? 'bg-yellow-500/10 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/50'
                      : alert.severity === 'info'
                      ? 'bg-blue-500/10 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700/50'
                      : alert.severity === 'success'
                      ? 'bg-green-500/10 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700/50'
                      : alert.severity === 'error'
                      ? 'bg-red-500/10 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700/50'
                      : 'bg-muted text-muted-foreground border-border'
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


          {/* Recent Activity */}
          <RecentActivity limit={6} />
          
          {/* Quick Actions */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/dashboard/messages"
                  className="block p-4 text-center bg-muted/50 hover:bg-accent rounded-xl border border-border transition-all duration-200"
                >
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <span className="font-medium text-card-foreground">Messages</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
