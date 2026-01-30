import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Network,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardCard } from '@/components/DashboardCard'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Progress } from '@/components/ui/progress'
import api from '@/lib/api'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface SystemMetrics {
  server: {
    cpu_usage: number
    memory_usage: number
    disk_usage: number
    uptime: number
    status: 'healthy' | 'warning' | 'critical'
  }
  database: {
    connections: number
    max_connections: number
    query_time_avg: number
    slow_queries: number
    status: 'healthy' | 'warning' | 'critical'
  }
  api: {
    response_time_avg: number
    requests_per_minute: number
    error_rate: number
    status: 'healthy' | 'warning' | 'critical'
  }
  queue: {
    pending_jobs: number
    failed_jobs: number
    processed_today: number
    status: 'healthy' | 'warning' | 'critical'
  }
  performance_history: Array<{
    timestamp: string
    cpu: number
    memory: number
    response_time: number
  }>
}

export default function SystemHealth() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchSystemHealth = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/system-health')
      setMetrics(response.data)
      setError(null)
      setLastUpdate(new Date())
    } catch (err: any) {
      setError('Failed to load system health data.')
      console.error(err)
      // For now, use mock data if endpoint doesn't exist
      setMetrics(getMockMetrics())
      setLastUpdate(new Date())
    } finally {
      setLoading(false)
    }
  }

  // Mock data for development
  const getMockMetrics = (): SystemMetrics => ({
    server: {
      cpu_usage: Math.random() * 40 + 20,
      memory_usage: Math.random() * 30 + 40,
      disk_usage: Math.random() * 20 + 50,
      uptime: 86400 * 7 + Math.random() * 86400,
      status: 'healthy',
    },
    database: {
      connections: Math.floor(Math.random() * 50 + 10),
      max_connections: 100,
      query_time_avg: Math.random() * 50 + 10,
      slow_queries: Math.floor(Math.random() * 5),
      status: 'healthy',
    },
    api: {
      response_time_avg: Math.random() * 50 + 50,
      requests_per_minute: Math.floor(Math.random() * 100 + 50),
      error_rate: Math.random() * 2,
      status: 'healthy',
    },
    queue: {
      pending_jobs: Math.floor(Math.random() * 10),
      failed_jobs: Math.floor(Math.random() * 3),
      processed_today: Math.floor(Math.random() * 1000 + 500),
      status: 'healthy',
    },
    performance_history: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      cpu: Math.random() * 40 + 20,
      memory: Math.random() * 30 + 40,
      response_time: Math.random() * 50 + 50,
    })),
  })

  useEffect(() => {
    fetchSystemHealth()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchSystemHealth()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500">Healthy</Badge>
      case 'warning':
        return <Badge className="bg-yellow-500">Warning</Badge>
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  if (loading && !metrics) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner size="lg" variant="primary" text="Loading system health..." />
      </div>
    )
  }

  if (error && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Failed to Load</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={fetchSystemHealth}>Retry</Button>
      </div>
    )
  }

  if (!metrics) return null

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
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-green-500">
              System Status: {metrics.server.status === 'healthy' ? 'Operational' : 'Monitoring'}
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            System Health
          </h1>
          <p className="text-muted-foreground mt-1">Real-time system monitoring and performance metrics.</p>
          {lastUpdate && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last updated: {formatDistanceToNow(lastUpdate, { addSuffix: true })}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <Activity className={`w-4 h-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          <Button variant="outline" onClick={fetchSystemHealth} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </motion.div>
      </div>

      {/* Server Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Server CPU">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{metrics.server.cpu_usage.toFixed(1)}%</span>
              </div>
              {getStatusBadge(metrics.server.status)}
            </div>
            <Progress value={metrics.server.cpu_usage} className="h-2" />
            <p className="text-xs text-muted-foreground">Usage</p>
          </div>
        </DashboardCard>

        <DashboardCard title="Memory">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{metrics.server.memory_usage.toFixed(1)}%</span>
              </div>
              {getStatusBadge(metrics.server.status)}
            </div>
            <Progress value={metrics.server.memory_usage} className="h-2" />
            <p className="text-xs text-muted-foreground">Usage</p>
          </div>
        </DashboardCard>

        <DashboardCard title="Disk Space">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{metrics.server.disk_usage.toFixed(1)}%</span>
              </div>
              {getStatusBadge(metrics.server.status)}
            </div>
            <Progress value={metrics.server.disk_usage} className="h-2" />
            <p className="text-xs text-muted-foreground">Usage</p>
          </div>
        </DashboardCard>

        <DashboardCard title="Uptime">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-lg font-bold">{formatUptime(metrics.server.uptime)}</span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground">System uptime</p>
          </div>
        </DashboardCard>
      </div>

      {/* Database & API Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Database Performance">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold">Connection Pool</span>
              </div>
              {getStatusBadge(metrics.database.status)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border border-border bg-card/50">
                <p className="text-xs text-muted-foreground mb-1">Active Connections</p>
                <p className="text-2xl font-bold">{metrics.database.connections}</p>
                <p className="text-xs text-muted-foreground">of {metrics.database.max_connections}</p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card/50">
                <p className="text-xs text-muted-foreground mb-1">Avg Query Time</p>
                <p className="text-2xl font-bold">{metrics.database.query_time_avg.toFixed(0)}ms</p>
                <p className="text-xs text-muted-foreground">Response time</p>
              </div>
            </div>
            {metrics.database.slow_queries > 0 && (
              <div className="p-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <p className="text-sm font-semibold text-yellow-500">
                    {metrics.database.slow_queries} slow queries detected
                  </p>
                </div>
              </div>
            )}
          </div>
        </DashboardCard>

        <DashboardCard title="API Performance">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold">API Metrics</span>
              </div>
              {getStatusBadge(metrics.api.status)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border border-border bg-card/50">
                <p className="text-xs text-muted-foreground mb-1">Avg Response Time</p>
                <p className="text-2xl font-bold">{metrics.api.response_time_avg.toFixed(0)}ms</p>
                <p className="text-xs text-muted-foreground">Per request</p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card/50">
                <p className="text-xs text-muted-foreground mb-1">Requests/min</p>
                <p className="text-2xl font-bold">{metrics.api.requests_per_minute}</p>
                <p className="text-xs text-muted-foreground">Current rate</p>
              </div>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card/50">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Error Rate</p>
                <p className="text-lg font-bold">{metrics.api.error_rate.toFixed(2)}%</p>
              </div>
              <Progress value={metrics.api.error_rate} className="h-2 mt-2" />
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Queue Status */}
      <DashboardCard title="Queue Status">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border border-border bg-card/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Pending Jobs</p>
              {getStatusBadge(metrics.queue.status)}
            </div>
            <p className="text-3xl font-bold">{metrics.queue.pending_jobs}</p>
            <p className="text-xs text-muted-foreground mt-1">In queue</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Failed Jobs</p>
              {metrics.queue.failed_jobs > 0 ? (
                <Badge variant="destructive">Issues</Badge>
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
            </div>
            <p className="text-3xl font-bold">{metrics.queue.failed_jobs}</p>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card/50">
            <p className="text-sm font-semibold mb-2">Processed Today</p>
            <p className="text-3xl font-bold">{metrics.queue.processed_today.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Total jobs</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card/50">
            <p className="text-sm font-semibold mb-2">Success Rate</p>
            <p className="text-3xl font-bold">
              {metrics.queue.processed_today > 0
                ? ((1 - metrics.queue.failed_jobs / metrics.queue.processed_today) * 100).toFixed(1)
                : 100}
              %
            </p>
            <p className="text-xs text-muted-foreground mt-1">Today</p>
          </div>
        </div>
      </DashboardCard>

      {/* Performance History Chart */}
      <DashboardCard title="Performance History (Last 24 Hours)">
        {metrics.performance_history && metrics.performance_history.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics.performance_history}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy HH:mm')}
              />
              <Area
                type="monotone"
                dataKey="cpu"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorCpu)"
                name="CPU %"
              />
              <Area
                type="monotone"
                dataKey="memory"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#colorMemory)"
                name="Memory %"
              />
              <Area
                type="monotone"
                dataKey="response_time"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorResponse)"
                name="Response Time (ms)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No performance history available</p>
            </div>
          </div>
        )}
      </DashboardCard>
    </div>
  )
}
