import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Users,
  Building2,
  TrendingUp,
  AlertCircle,
  Download,
  RefreshCw,
  Activity,
  Shield,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/MetricCard'
import { DashboardCard } from '@/components/DashboardCard'
import api from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { exportDashboardToCSV, exportDashboardToPDF } from '@/utils/dashboardExport'

// Color palette for charts
const CHART_COLORS = {
  primary: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'],
  status: {
    draft: '#3b82f6',
    active: '#16a34a',
    completed: '#6b7280',
    cancelled: '#ef4444',
  },
}

// Quick Actions Component
function QuickActionsPanel({ navigate }: { navigate: (path: string) => void }) {
  const actions = [
    {
      title: 'View Organizers',
      description: 'Manage organizer accounts',
      icon: Building2,
      path: '/dashboard/organizers',
      color: 'bg-blue-500',
    },
    {
      title: 'View Users',
      description: 'Manage user accounts',
      icon: Users,
      path: '/dashboard/users',
      color: 'bg-purple-500',
    },
    {
      title: 'Audit Logs',
      description: 'View system activity',
      icon: FileText,
      path: '/dashboard/audit-logs',
      color: 'bg-green-500',
    },
    {
      title: 'Subscriptions',
      description: 'Manage subscriptions',
      icon: Shield,
      path: '/dashboard/admin/subscriptions',
      color: 'bg-orange-500',
    },
  ]

  return (
    <DashboardCard title="Quick Actions">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.title}
              onClick={() => navigate(action.path)}
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors text-left group"
            >
              <div className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </DashboardCard>
  )
}

// Recent Activity Feed Component
function RecentActivityFeed({ activities }: { activities: any[] }) {
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'event':
        return <Calendar className="w-4 h-4" />
      case 'user':
        return <Users className="w-4 h-4" />
      case 'organizer':
        return <Building2 className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  if (!activities || activities.length === 0) {
    return (
      <DashboardCard title="Recent Activity">
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No recent activity</p>
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard title="Recent Activity">
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
          >
            <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {activity.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {activity.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  )
}

// System Alerts Component
function SystemAlertsPanel({ alerts }: { alerts: any[] }) {
  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />
      default:
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'error':
        return <Badge variant="destructive">Critical</Badge>
      case 'warning':
        return <Badge className="bg-yellow-500">Warning</Badge>
      case 'info':
        return <Badge variant="secondary">Info</Badge>
      default:
        return <Badge className="bg-green-500">Normal</Badge>
    }
  }

  if (!alerts || alerts.length === 0) {
    return (
      <DashboardCard title="System Alerts">
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500 opacity-50" />
          <p className="text-sm">All systems operational</p>
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard title="System Alerts">
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
          >
            <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                {getSeverityBadge(alert.severity)}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {alert.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setRefreshing(true)
      const response = await api.get('/dashboard/admin', {
        params: {
          date_range: dateRange,
        },
      })
      setStats(response.data)
      setError(null)
      setLastRefresh(new Date())
    } catch (err: any) {
      setError('Failed to load Command Center data.')
      console.error(err)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [dateRange])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchDashboardData()
    }, 60000) // Refresh every 60 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, dateRange])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchDashboardData()
      setLastRefresh(new Date())
    }, 60000) // Refresh every 60 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, dateRange])

  // Update last refresh time when data is fetched
  useEffect(() => {
    if (stats && !lastRefresh) {
      setLastRefresh(new Date())
    }
  }, [stats])

  const handleExport = async (exportFormat: 'csv' | 'pdf') => {
    try {
      if (!stats) {
        toast.error('No data available to export')
        return
      }

      toast.loading(`Exporting dashboard data as ${exportFormat.toUpperCase()}...`)

      // Small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 300))

      if (exportFormat === 'csv') {
        exportDashboardToCSV(stats, dateRange)
        toast.success('Dashboard data exported as CSV')
      } else if (exportFormat === 'pdf') {
        exportDashboardToPDF(stats, dateRange)
        toast.success('Dashboard data exported as PDF')
      }
    } catch (err: any) {
      console.error('Export error:', err)
      toast.error(`Failed to export data: ${err.message || 'Unknown error'}`)
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner size="lg" variant="primary" text="Initializing Command Center..." />
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry Connection</Button>
      </div>
    )
  }

  const eventGrowthData = stats?.eventGrowth || []
  const eventStatusData = stats?.eventStatusDistribution || []
  const userRoleData = stats?.userRoleDistribution || []
  const systemAlerts = stats?.systemAlerts || []
  const recentActivities = stats?.recentActivities || []

  return (
    <div className="min-h-screen bg-transparent p-1 sm:p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary/80">
              Platform Status: Optimal
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Command Center
          </h1>
          <p className="text-muted-foreground mt-1">Real-time oversight and administrative control.</p>
          {lastRefresh && (
            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last updated: {format(lastRefresh, 'MMM d, yyyy HH:mm:ss')}
              {autoRefresh && (
                <span className="ml-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block shrink-0" />
                  Auto-refresh enabled
                </span>
              )}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 flex-wrap"
        >
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              fetchDashboardData()
              setLastRefresh(new Date())
            }}
            disabled={refreshing}
            className="gap-2"
            title={lastRefresh ? `Last refreshed: ${format(lastRefresh, 'HH:mm:ss')}` : ''}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
            title={autoRefresh ? 'Auto-refresh enabled (every 60s)' : 'Enable auto-refresh'}
          >
            <Activity className={`w-4 h-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>

          <Button variant="outline" onClick={() => handleExport('csv')} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')} className="gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </motion.div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Events',
            ...stats?.keyMetrics?.totalEvents,
            icon: <Calendar />,
            link: '/dashboard/events',
          },
          {
            title: 'Platform Users',
            ...stats?.keyMetrics?.totalUsers,
            icon: <Users />,
            link: '/dashboard/users',
          },
          {
            title: 'Active Organizers',
            ...stats?.keyMetrics?.activeOrganizers,
            icon: <Building2 />,
            link: '/dashboard/organizers',
          },
          {
            title: 'Monthly Revenue',
            ...stats?.keyMetrics?.monthlyRevenue,
            icon: <TrendingUp />,
          },
        ].map((metric, idx) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <MetricCard
              title={metric.title}
              value={metric.value || '0'}
              trend={metric.trend}
              icon={metric.icon}
              className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl"
              link={metric.link}
            />
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event & User Growth Chart */}
        <DashboardCard title="Event & User Growth">
          {eventGrowthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={eventGrowthData}>
                <defs>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="events"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorEvents)"
                  name="Events"
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                  name="Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No growth data available</p>
              </div>
            </div>
          )}
        </DashboardCard>

        {/* Event Status Distribution */}
        <DashboardCard title="Event Status Distribution">
          {eventStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {eventStatusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS.primary[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {eventStatusData.map((item: any, index: number) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color || CHART_COLORS.primary[index] }}
                      />
                      <span className="text-sm text-foreground">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No status data available</p>
              </div>
            </div>
          )}
        </DashboardCard>
      </div>

      {/* User Role Distribution */}
      <DashboardCard title="User Role Distribution">
        {userRoleData.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={userRoleData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="role" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Total Users" />
                <Bar dataKey="growth" fill="#8b5cf6" name="New (30d)" />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {userRoleData.map((role: any) => (
                <div
                  key={role.role}
                  className="p-3 rounded-lg border border-border bg-card/50"
                >
                  <p className="text-xs text-muted-foreground mb-1">{role.role}</p>
                  <p className="text-2xl font-bold">{role.count}</p>
                  {role.growth > 0 && (
                    <p className="text-xs text-green-500 mt-1">+{role.growth} this month</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No user role data available</p>
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Insights Summary Card */}
      {stats && (
        <DashboardCard title="Platform Insights">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">Growth Rate</p>
              </div>
              <p className="text-2xl font-bold">
                {eventGrowthData.length > 1
                  ? `${Math.round(
                      ((eventGrowthData[eventGrowthData.length - 1]?.events || 0) -
                        (eventGrowthData[0]?.events || 0)) /
                        Math.max(1, eventGrowthData[0]?.events || 1) *
                        100
                    )}%`
                  : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Event growth trend</p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card/50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">Active Users</p>
              </div>
              <p className="text-2xl font-bold">
                {userRoleData.reduce((sum: number, role: any) => sum + (role.growth || 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">New users (30 days)</p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card/50">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">System Health</p>
              </div>
              <p className="text-2xl font-bold">
                {systemAlerts.length === 0 ? '100%' : `${Math.max(0, 100 - systemAlerts.length * 10)}%`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {systemAlerts.length === 0 ? 'All systems operational' : `${systemAlerts.length} active alerts`}
              </p>
            </div>
          </div>
        </DashboardCard>
      )}

      {/* Bottom Section: Quick Actions, Alerts, and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickActionsPanel navigate={navigate} />
        <SystemAlertsPanel alerts={systemAlerts} />
        <RecentActivityFeed activities={recentActivities} />
      </div>
    </div>
  )
}
