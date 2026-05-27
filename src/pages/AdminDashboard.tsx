import { useCallback, useEffect, useState } from 'react'
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
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/MetricCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
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
import api from '@/lib/api'
import {
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

type DateRange = '7d' | '30d' | '90d' | 'all'

type Trend = { value: number; isPositive: boolean } | string

type KeyMetric = { value?: string | number; trend?: Trend }

type GrowthPoint = { month: string; events?: number; users?: number }

type StatusDistributionItem = { name: string; value: number; color?: string }

type UserRoleDistributionItem = { role: string; count: number; growth?: number }

type AlertItem = {
  id: string | number
  title: string
  description?: string
  severity?: string
  timestamp: string
}

type ActivityItem = {
  id: string | number
  type?: string
  description: string
  timestamp: string
}

type DashboardStats = {
  keyMetrics?: {
    totalEvents?: KeyMetric
    totalUsers?: KeyMetric
    activeOrganizers?: KeyMetric
    monthlyRevenue?: KeyMetric
  }
  eventGrowth?: GrowthPoint[]
  eventStatusDistribution?: StatusDistributionItem[]
  userRoleDistribution?: UserRoleDistributionItem[]
  systemAlerts?: AlertItem[]
  recentActivities?: ActivityItem[]
}

const CHART_COLORS = {
  primary: ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'],
  status: {
    draft: 'hsl(var(--chart-1))',
    active: 'hsl(var(--chart-2))',
    completed: 'hsl(var(--muted-foreground))',
    cancelled: 'hsl(var(--destructive))',
  },
}

function QuickActionsPanel({ navigate }: { navigate: (path: string) => void }) {
  const actions = [
    { title: 'View Organizers', description: 'Manage organizer accounts', icon: Building2, path: '/dashboard/organizers' },
    { title: 'View Users', description: 'Manage user accounts', icon: Users, path: '/dashboard/users' },
    { title: 'Audit Logs', description: 'View system activity', icon: FileText, path: '/dashboard/audit-logs' },
    { title: 'Subscriptions', description: 'Manage subscriptions', icon: Shield, path: '/dashboard/admin/subscriptions' },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.title}
                type="button"
                onClick={() => navigate(action.path)}
                className="flex items-start gap-3 rounded-lg border border-border p-4 text-left hover:bg-muted/50 transition-colors w-full"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function RecentActivityFeed({ activities }: { activities: ActivityItem[] }) {
  const getActivityIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'event':
        return <Calendar className="h-4 w-4" />
      case 'user':
        return <Users className="h-4 w-4" />;
      case 'organizer':
        return <Building2 className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  }

  if (!activities?.length) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Activity className="h-10 w-10 opacity-50 mb-2" />
            <p className="text-sm">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[320px] overflow-y-auto">
        {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                {getActivityIcon(activity.type || 'activity')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground line-clamp-2">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0" />
                  {activity.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SystemAlertsPanel({ alerts }: { alerts: AlertItem[] }) {
  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-primary" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'error':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="border-amber-500/50 text-amber-700 dark:text-amber-400">Warning</Badge>;
      case 'info':
        return <Badge variant="secondary">Info</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  }

  if (!alerts?.length) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">System Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mb-2 opacity-80" />
            <p className="text-sm">All systems operational</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">System Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[320px] overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="mt-0.5 shrink-0">{getSeverityIcon(alert.severity)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium">{alert.title}</p>
                  {getSeverityBadge(alert.severity)}
                </div>
                {alert.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0" />
                  {alert.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setRefreshing(true)
      const response = await api.get('/dashboard/admin', {
        params: { date_range: dateRange },
      })
      setStats(response.data as DashboardStats)
      setError(null)
      setLastRefresh(new Date())
    } catch (err: unknown) {
      setError('Failed to load Command Center data.')
      console.error(err)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 60000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchDashboardData])

  const handleExport = async (exportFormat: 'csv' | 'pdf') => {
    try {
      if (!stats) {
        toast.error('No data available to export')
        return
      }
      toast.loading(`Exporting dashboard data as ${exportFormat.toUpperCase()}...`)
      await new Promise((resolve) => setTimeout(resolve, 300))
      if (exportFormat === 'csv') {
        exportDashboardToCSV(stats, dateRange)
        toast.success('Dashboard data exported as CSV')
      } else {
        exportDashboardToPDF(stats, dateRange)
        toast.success('Dashboard data exported as PDF')
      }
    } catch (err: unknown) {
      console.error('Export error:', err)
      toast.error('Failed to export data')
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner size="lg" variant="primary" text="Loading dashboard..." />
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">Unable to load dashboard</h2>
        <p className="text-sm text-muted-foreground max-w-md">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  const eventGrowthData = stats?.eventGrowth || []
  const eventStatusData = stats?.eventStatusDistribution || []
  const userRoleData = stats?.userRoleDistribution || []
  const systemAlerts = stats?.systemAlerts || []
  const recentActivities = stats?.recentActivities || []
  const km = stats?.keyMetrics

  const metricCards = [
    {
      title: 'Total Events',
      value: km?.totalEvents?.value ?? '0',
      trend: km?.totalEvents?.trend,
      icon: Calendar,
      link: '/dashboard/events',
    },
    {
      title: 'Platform Users',
      value: km?.totalUsers?.value ?? '0',
      trend: km?.totalUsers?.trend,
      icon: Users,
      link: '/dashboard/users',
    },
    {
      title: 'Active Organizers',
      value: km?.activeOrganizers?.value ?? '0',
      trend: km?.activeOrganizers?.trend,
      icon: Building2,
      link: '/dashboard/organizers',
    },
    {
      title: 'Monthly Revenue',
      value: km?.monthlyRevenue?.value ?? '—',
      trend: km?.monthlyRevenue?.trend,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={systemAlerts.length > 0 ? 'destructive' : 'secondary'}>
              {systemAlerts.length > 0 ? `${systemAlerts.length} alert(s)` : 'All systems operational'}
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Command Center</h1>
          <p className="text-muted-foreground mt-1">
            Platform overview and administrative controls.
          </p>
          {lastRefresh && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Last updated {format(lastRefresh, 'MMM d, yyyy HH:mm:ss')}
              {autoRefresh && (
                <span className="inline-flex items-center gap-1.5 text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Auto-refresh on
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
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
            size="sm"
            onClick={() => {
              fetchDashboardData()
              setLastRefresh(new Date())
            }}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            {autoRefresh ? 'Auto on' : 'Auto off'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon
          return (
            <MetricCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              trend={metric.trend}
              icon={<Icon className="h-5 w-5" />}
              link={metric.link}
            />
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event & user growth</CardTitle>
          </CardHeader>
          <CardContent>
            {eventGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={eventGrowthData}>
                  <defs>
                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="events" stroke="hsl(var(--primary))" fill="url(#colorEvents)" name="Events" />
                  <Area type="monotone" dataKey="users" stroke="hsl(var(--chart-2))" fill="url(#colorUsers)" name="Users" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                No growth data for this period
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event status</CardTitle>
          </CardHeader>
          <CardContent>
            {eventStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={eventStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {eventStatusData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            entry.color ||
                            CHART_COLORS.status[entry.name as keyof typeof CHART_COLORS.status] ||
                            CHART_COLORS.primary[index % CHART_COLORS.primary.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {eventStatusData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No status breakdown</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">User roles</CardTitle>
        </CardHeader>
        <CardContent>
          {userRoleData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={userRoleData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="role" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Total" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="growth" fill="hsl(var(--chart-3))" name="New (30d)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {userRoleData.map((role) => (
                  <div key={role.role} className="rounded-lg border border-border bg-card/50 p-3">
                    <p className="text-xs text-muted-foreground">{role.role}</p>
                    <p className="text-lg font-semibold tabular-nums">{role.count}</p>
                    {role.growth > 0 && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">+{role.growth} (30d)</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">No role data</p>
          )}
        </CardContent>
      </Card>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InsightBlock
                title="Growth rate"
                value={
                  eventGrowthData.length > 1
                    ? `${Math.round(
                        ((eventGrowthData[eventGrowthData.length - 1]?.events || 0) -
                          (eventGrowthData[0]?.events || 0)) /
                          Math.max(1, eventGrowthData[0]?.events || 1) *
                          100
                      )}%`
                    : 'N/A'
                }
                hint="Event growth vs prior period"
              />
              <InsightBlock
                title="New users (30d)"
                value={userRoleData.reduce((s, r) => s + (r.growth || 0), 0).toString()}
                hint="Users added in last 30 days"
              />
              <InsightBlock
                title="System health"
                value={
                  systemAlerts.length === 0
                    ? '100%'
                    : `${Math.max(0, 100 - systemAlerts.length * 10)}%`
                }
                hint={
                  systemAlerts.length === 0
                    ? 'All systems operational'
                    : `${systemAlerts.length} active alert(s)`
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickActionsPanel navigate={navigate} />
        <SystemAlertsPanel alerts={systemAlerts} />
        <RecentActivityFeed activities={recentActivities} />
      </div>
    </div>
  )
}

function InsightBlock({
  title,
  value,
  hint,
}: {
  title: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}