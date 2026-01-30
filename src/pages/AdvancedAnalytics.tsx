import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Download,
  Filter,
  RefreshCw,
  Clock,
  FileText,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardCard } from '@/components/DashboardCard'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'
import { toast } from 'sonner'
import { format, subDays, subMonths, subYears } from 'date-fns'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AnalyticsData {
  overview: {
    total_events: number
    total_users: number
    total_revenue: number
    total_attendees: number
    growth_rate: number
  }
  event_analytics: Array<{
    period: string
    events_created: number
    events_completed: number
    events_cancelled: number
  }>
  user_analytics: Array<{
    period: string
    new_users: number
    active_users: number
    churn_rate: number
  }>
  revenue_analytics: Array<{
    period: string
    revenue: number
    transactions: number
    average_ticket_price: number
  }>
  engagement_metrics: {
    average_check_in_rate: number
    average_registration_rate: number
    average_retention_rate: number
  }
  top_performers: {
    top_events: Array<{
      name: string
      attendees: number
      revenue: number
    }>
    top_organizers: Array<{
      name: string
      events_count: number
      total_revenue: number
    }>
  }
  geographic_distribution: Array<{
    region: string
    events: number
    users: number
    revenue: number
  }>
}

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4']

export default function AdvancedAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'custom'>('30d')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'custom'>('summary')
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setRefreshing(true)
      const params: any = {
        date_range: dateRange,
      }
      if (dateRange === 'custom' && customStartDate && customEndDate) {
        params.start_date = customStartDate
        params.end_date = customEndDate
      }

      const response = await api.get('/admin/analytics/advanced', { params })
      setAnalyticsData(response.data)
      setError(null)
    } catch (err: any) {
      setError('Failed to load analytics data.')
      console.error(err)
      // Use mock data for development
      setAnalyticsData(getMockAnalyticsData())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getMockAnalyticsData = (): AnalyticsData => {
    const periods = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 12 : 12
    const useDaily = dateRange === '7d'

    return {
      overview: {
        total_events: 156,
        total_users: 2847,
        total_revenue: 1250000,
        total_attendees: 8945,
        growth_rate: 12.5,
      },
      event_analytics: Array.from({ length: periods }, (_, i) => ({
        period: useDaily
          ? format(subDays(new Date(), periods - 1 - i), 'MMM d')
          : format(subMonths(new Date(), periods - 1 - i), 'MMM yyyy'),
        events_created: Math.floor(Math.random() * 20 + 5),
        events_completed: Math.floor(Math.random() * 15 + 3),
        events_cancelled: Math.floor(Math.random() * 3),
      })),
      user_analytics: Array.from({ length: periods }, (_, i) => ({
        period: useDaily
          ? format(subDays(new Date(), periods - 1 - i), 'MMM d')
          : format(subMonths(new Date(), periods - 1 - i), 'MMM yyyy'),
        new_users: Math.floor(Math.random() * 50 + 10),
        active_users: Math.floor(Math.random() * 200 + 100),
        churn_rate: Math.random() * 5,
      })),
      revenue_analytics: Array.from({ length: periods }, (_, i) => ({
        period: useDaily
          ? format(subDays(new Date(), periods - 1 - i), 'MMM d')
          : format(subMonths(new Date(), periods - 1 - i), 'MMM yyyy'),
        revenue: Math.floor(Math.random() * 50000 + 10000),
        transactions: Math.floor(Math.random() * 200 + 50),
        average_ticket_price: Math.floor(Math.random() * 50 + 25),
      })),
      engagement_metrics: {
        average_check_in_rate: 78.5,
        average_registration_rate: 65.2,
        average_retention_rate: 82.3,
      },
      top_performers: {
        top_events: [
          { name: 'Tech Conference 2024', attendees: 1250, revenue: 125000 },
          { name: 'Music Festival', attendees: 980, revenue: 98000 },
          { name: 'Business Summit', attendees: 750, revenue: 75000 },
        ],
        top_organizers: [
          { name: 'EventPro Inc', events_count: 45, total_revenue: 450000 },
          { name: 'Celebration Co', events_count: 32, total_revenue: 320000 },
          { name: 'Gatherings Ltd', events_count: 28, total_revenue: 280000 },
        ],
      },
      geographic_distribution: [
        { region: 'Addis Ababa', events: 89, users: 1245, revenue: 450000 },
        { region: 'Dire Dawa', events: 34, users: 567, revenue: 180000 },
        { region: 'Hawassa', events: 23, users: 345, revenue: 120000 },
        { region: 'Mekelle', events: 18, users: 234, revenue: 95000 },
        { region: 'Other', events: 45, users: 456, revenue: 405000 },
      ],
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange, customStartDate, customEndDate])

  const handleGenerateReport = async () => {
    try {
      toast.loading('Generating report...')
      const params: any = {
        report_type: reportType,
        date_range: dateRange,
      }
      if (dateRange === 'custom' && customStartDate && customEndDate) {
        params.start_date = customStartDate
        params.end_date = customEndDate
      }

      const response = await api.get('/admin/analytics/report', {
        params,
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Report generated successfully')
      setReportDialogOpen(false)
    } catch (err: any) {
      toast.error(`Failed to generate report: ${err.response?.data?.message || err.message}`)
    }
  }

  if (loading && !analyticsData) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner size="lg" variant="primary" text="Loading analytics..." />
      </div>
    )
  }

  if (error && !analyticsData) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Failed to Load</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={fetchAnalytics}>Retry</Button>
      </div>
    )
  }

  if (!analyticsData) return null

  return (
    <div className="min-h-screen bg-transparent p-1 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary/80">
              Advanced Analytics
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Advanced Analytics & Reporting
          </h1>
          <p className="text-muted-foreground mt-1">Comprehensive analytics and custom reporting tools.</p>
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
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-[140px]"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-[140px]"
              />
            </div>
          )}

          <Button variant="outline" onClick={fetchAnalytics} disabled={refreshing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button onClick={() => setReportDialogOpen(true)} className="gap-2">
            <FileText className="w-4 h-4" />
            Generate Report
          </Button>
        </motion.div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <DashboardCard title="Total Events">
          <div className="space-y-2">
            <p className="text-3xl font-bold">{analyticsData.overview.total_events.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-sm text-green-500">
              <TrendingUp className="w-4 h-4" />
              <span>+{analyticsData.overview.growth_rate}%</span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Total Users">
          <div className="space-y-2">
            <p className="text-3xl font-bold">{analyticsData.overview.total_users.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-sm text-green-500">
              <TrendingUp className="w-4 h-4" />
              <span>+{analyticsData.overview.growth_rate}%</span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Total Revenue">
          <div className="space-y-2">
            <p className="text-3xl font-bold">ETB {analyticsData.overview.total_revenue.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-sm text-green-500">
              <TrendingUp className="w-4 h-4" />
              <span>+{analyticsData.overview.growth_rate}%</span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Total Attendees">
          <div className="space-y-2">
            <p className="text-3xl font-bold">{analyticsData.overview.total_attendees.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-sm text-green-500">
              <TrendingUp className="w-4 h-4" />
              <span>+{analyticsData.overview.growth_rate}%</span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Growth Rate">
          <div className="space-y-2">
            <p className="text-3xl font-bold">{analyticsData.overview.growth_rate}%</p>
            <p className="text-sm text-muted-foreground">Overall growth</p>
          </div>
        </DashboardCard>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="events" className="space-y-6">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-6">
          <DashboardCard title="Event Analytics">
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={analyticsData.event_analytics}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="period" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="events_created" fill="#3b82f6" name="Created" />
                <Bar dataKey="events_completed" fill="#10b981" name="Completed" />
                <Bar dataKey="events_cancelled" fill="#ef4444" name="Cancelled" />
              </ComposedChart>
            </ResponsiveContainer>
          </DashboardCard>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <DashboardCard title="User Analytics">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={analyticsData.user_analytics}>
                <defs>
                  <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorActiveUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="period" className="text-xs" />
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
                  dataKey="new_users"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorNewUsers)"
                  name="New Users"
                />
                <Area
                  type="monotone"
                  dataKey="active_users"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorActiveUsers)"
                  name="Active Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          </DashboardCard>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <DashboardCard title="Revenue Analytics">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analyticsData.revenue_analytics}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="period" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`ETB ${value.toLocaleString()}`, 'Revenue']}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="average_ticket_price" stroke="#8b5cf6" strokeWidth={2} name="Avg Ticket Price" />
              </LineChart>
            </ResponsiveContainer>
          </DashboardCard>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DashboardCard title="Check-In Rate">
              <div className="text-center space-y-2">
                <p className="text-4xl font-bold text-green-500">
                  {analyticsData.engagement_metrics.average_check_in_rate}%
                </p>
                <p className="text-sm text-muted-foreground">Average check-in rate</p>
              </div>
            </DashboardCard>
            <DashboardCard title="Registration Rate">
              <div className="text-center space-y-2">
                <p className="text-4xl font-bold text-blue-500">
                  {analyticsData.engagement_metrics.average_registration_rate}%
                </p>
                <p className="text-sm text-muted-foreground">Average registration rate</p>
              </div>
            </DashboardCard>
            <DashboardCard title="Retention Rate">
              <div className="text-center space-y-2">
                <p className="text-4xl font-bold text-purple-500">
                  {analyticsData.engagement_metrics.average_retention_rate}%
                </p>
                <p className="text-sm text-muted-foreground">Average retention rate</p>
              </div>
            </DashboardCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardCard title="Top Performing Events">
              <div className="space-y-4">
                {analyticsData.top_performers.top_events.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
                    <div className="flex-1">
                      <p className="font-semibold">{event.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.attendees} attendees • ETB {event.revenue.toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="secondary">#{index + 1}</Badge>
                  </div>
                ))}
              </div>
            </DashboardCard>

            <DashboardCard title="Top Organizers">
              <div className="space-y-4">
                {analyticsData.top_performers.top_organizers.map((organizer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
                    <div className="flex-1">
                      <p className="font-semibold">{organizer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {organizer.events_count} events • ETB {organizer.total_revenue.toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="secondary">#{index + 1}</Badge>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-6">
          <DashboardCard title="Geographic Distribution">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analyticsData.geographic_distribution}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="region" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="events" fill="#3b82f6" name="Events" />
                <Bar dataKey="users" fill="#10b981" name="Users" />
                <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </DashboardCard>
        </TabsContent>
      </Tabs>

      {/* Generate Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Analytics Report</DialogTitle>
            <DialogDescription>
              Select the type of report you want to generate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary Report</SelectItem>
                  <SelectItem value="detailed">Detailed Report</SelectItem>
                  <SelectItem value="custom">Custom Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              {reportType === 'summary' && 'A brief overview of key metrics and trends.'}
              {reportType === 'detailed' && 'Comprehensive report with all analytics and charts.'}
              {reportType === 'custom' && 'Customizable report with selected metrics.'}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateReport}>Generate Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
