import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardCard } from '@/components/DashboardCard'
import { MetricCard } from '@/components/MetricCard'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'
import { toast } from 'sonner'
import { format, subDays, subMonths } from 'date-fns'
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
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { exportDashboardToCSV, exportDashboardToPDF } from '@/utils/dashboardExport'

interface FinancialData {
  total_revenue: number
  revenue_trend: string
  monthly_revenue: number
  monthly_trend: string
  total_transactions: number
  transactions_trend: string
  average_transaction_value: number
  revenue_by_period: Array<{
    period: string
    revenue: number
    transactions: number
  }>
  revenue_by_event: Array<{
    event_name: string
    revenue: number
    tickets_sold: number
  }>
  payment_methods: Array<{
    method: string
    amount: number
    percentage: number
  }>
  refunds: {
    total_refunded: number
    refund_count: number
    refund_rate: number
  }
}

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444']

export default function FinancialDashboard() {
  const navigate = useNavigate()
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d')
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchFinancialData = async () => {
    try {
      setLoading(true)
      setRefreshing(true)
      const response = await api.get('/admin/financials', {
        params: {
          date_range: dateRange,
        },
      })
      setFinancialData(response.data)
      setError(null)
      setLastUpdate(new Date())
    } catch (err: any) {
      setError('Failed to load financial data.')
      console.error(err)
      // Use mock data for development
      setFinancialData(getMockFinancialData())
      setLastUpdate(new Date())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getMockFinancialData = (): FinancialData => {
    const baseRevenue = 50000
    const periods = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 12 : 12

    return {
      total_revenue: baseRevenue * (dateRange === 'all' ? 12 : periods),
      revenue_trend: '+12.5%',
      monthly_revenue: baseRevenue,
      monthly_trend: '+8.3%',
      total_transactions: Math.floor(baseRevenue / 50),
      transactions_trend: '+15.2%',
      average_transaction_value: 50,
      revenue_by_period: Array.from({ length: periods }, (_, i) => ({
        period:
          dateRange === '7d'
            ? format(subDays(new Date(), periods - 1 - i), 'MMM d')
            : format(subMonths(new Date(), periods - 1 - i), 'MMM yyyy'),
        revenue: baseRevenue + Math.random() * 10000 - 5000,
        transactions: Math.floor((baseRevenue + Math.random() * 10000 - 5000) / 50),
      })),
      revenue_by_event: [
        { event_name: 'Tech Conference 2024', revenue: 25000, tickets_sold: 500 },
        { event_name: 'Music Festival', revenue: 18000, tickets_sold: 360 },
        { event_name: 'Business Summit', revenue: 15000, tickets_sold: 300 },
        { event_name: 'Art Exhibition', revenue: 12000, tickets_sold: 240 },
        { event_name: 'Sports Event', revenue: 10000, tickets_sold: 200 },
      ],
      payment_methods: [
        { method: 'Telebirr', amount: 40000, percentage: 60 },
        { method: 'CBE Birr', amount: 20000, percentage: 30 },
        { method: 'Bank Transfer', amount: 5000, percentage: 7.5 },
        { method: 'Cash', amount: 2000, percentage: 2.5 },
      ],
      refunds: {
        total_refunded: 2500,
        refund_count: 25,
        refund_rate: 2.5,
      },
    }
  }

  useEffect(() => {
    fetchFinancialData()
  }, [dateRange])

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!financialData) {
      toast.error('No data available to export')
      return
    }

    try {
      toast.loading(`Exporting financial data as ${format.toUpperCase()}...`)
      await new Promise((resolve) => setTimeout(resolve, 300))

      if (format === 'csv') {
        exportDashboardToCSV(financialData as any, dateRange)
        toast.success('Financial data exported as CSV')
      } else {
        exportDashboardToPDF(financialData as any, dateRange)
        toast.success('Financial data exported as PDF')
      }
    } catch (err: any) {
      toast.error(`Failed to export: ${err.message || 'Unknown error'}`)
    }
  }

  if (loading && !financialData) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner size="lg" variant="primary" text="Loading financial data..." />
      </div>
    )
  }

  if (error && !financialData) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <DollarSign className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Failed to Load</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={fetchFinancialData}>Retry</Button>
      </div>
    )
  }

  if (!financialData) return null

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
              Financial Overview
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Financial Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Revenue analytics and financial insights.</p>
          {lastUpdate && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last updated: {format(lastUpdate, 'MMM d, yyyy HH:mm:ss')}
            </p>
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
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={fetchFinancialData} disabled={refreshing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`ETB ${financialData.total_revenue.toLocaleString()}`}
          trend={financialData.revenue_trend}
          icon={<DollarSign />}
          className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl"
        />
        <MetricCard
          title="Monthly Revenue"
          value={`ETB ${financialData.monthly_revenue.toLocaleString()}`}
          trend={financialData.monthly_trend}
          icon={<TrendingUp />}
          className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl"
        />
        <MetricCard
          title="Total Transactions"
          value={financialData.total_transactions.toLocaleString()}
          trend={financialData.transactions_trend}
          icon={<CreditCard />}
          className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl"
        />
        <MetricCard
          title="Avg Transaction"
          value={`ETB ${financialData.average_transaction_value.toFixed(2)}`}
          trend="+5.2%"
          icon={<Receipt />}
          className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl"
        />
      </div>

      {/* Revenue Trends Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Revenue Trend">
          {financialData.revenue_by_period.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={financialData.revenue_by_period}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                  formatter={(value: number) => [`ETB ${value.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No revenue data available</p>
              </div>
            </div>
          )}
        </DashboardCard>

        <DashboardCard title="Payment Methods Distribution">
          {financialData.payment_methods.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={financialData.payment_methods}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {financialData.payment_methods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`ETB ${value.toLocaleString()}`, 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {financialData.payment_methods.map((method, index) => (
                  <div
                    key={method.method}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-sm text-foreground">{method.method}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      ETB {method.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No payment data available</p>
              </div>
            </div>
          )}
        </DashboardCard>
      </div>

      {/* Top Revenue Events */}
      <DashboardCard title="Top Revenue Generating Events">
        {financialData.revenue_by_event.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financialData.revenue_by_event}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="event_name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`ETB ${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {financialData.revenue_by_event.map((event, index) => (
                <div
                  key={event.event_name}
                  className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold line-clamp-1">{event.event_name}</p>
                    <Badge variant="secondary">#{index + 1}</Badge>
                  </div>
                  <p className="text-2xl font-bold text-green-500">ETB {event.revenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.tickets_sold} tickets sold
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No event revenue data available</p>
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Refunds & Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title="Refunds">
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-card/50">
              <p className="text-xs text-muted-foreground mb-1">Total Refunded</p>
              <p className="text-2xl font-bold text-red-500">
                ETB {financialData.refunds.total_refunded.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card/50">
              <p className="text-xs text-muted-foreground mb-1">Refund Count</p>
              <p className="text-2xl font-bold">{financialData.refunds.refund_count}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card/50">
              <p className="text-xs text-muted-foreground mb-1">Refund Rate</p>
              <p className="text-2xl font-bold">{financialData.refunds.refund_rate.toFixed(2)}%</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Transaction Volume">
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-card/50">
              <p className="text-xs text-muted-foreground mb-1">Total Transactions</p>
              <p className="text-2xl font-bold">{financialData.total_transactions.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-500">{financialData.transactions_trend}</span>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card/50">
              <p className="text-xs text-muted-foreground mb-1">Avg per Transaction</p>
              <p className="text-2xl font-bold">ETB {financialData.average_transaction_value.toFixed(2)}</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Quick Actions">
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/dashboard/events')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              View All Events
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/dashboard/reports')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Reports
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport('csv')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </DashboardCard>
      </div>
    </div>
  )
}
