import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Zap,
  Database,
  Server,
  Cpu,
  HardDrive,
  Network,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Settings,
  Play,
  Pause,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardCard } from '@/components/DashboardCard'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Clock } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'
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
  Legend,
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PerformanceMetrics {
  cache: {
    hit_rate: number
    miss_rate: number
    size: number
    max_size: number
    enabled: boolean
  }
  database: {
    query_count: number
    slow_queries: number
    connection_pool_usage: number
    avg_query_time: number
  }
  api: {
    avg_response_time: number
    requests_per_second: number
    error_rate: number
    cache_hit_rate: number
  }
  optimization_suggestions: Array<{
    id: number
    type: 'cache' | 'database' | 'api' | 'general'
    priority: 'low' | 'medium' | 'high'
    title: string
    description: string
    action?: string
  }>
  performance_history: Array<{
    timestamp: string
    response_time: number
    cache_hit_rate: number
    query_time: number
  }>
}

export default function PerformanceOptimization() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/performance/metrics')
      setMetrics(response.data)
    } catch (err: any) {
      console.error('Failed to fetch performance metrics:', err)
      // Use mock data for development
      setMetrics(getMockMetrics())
    } finally {
      setLoading(false)
    }
  }

  const getMockMetrics = (): PerformanceMetrics => {
    return {
      cache: {
        hit_rate: 78.5,
        miss_rate: 21.5,
        size: 256 * 1024 * 1024, // 256MB
        max_size: 512 * 1024 * 1024, // 512MB
        enabled: true,
      },
      database: {
        query_count: 15420,
        slow_queries: 23,
        connection_pool_usage: 65,
        avg_query_time: 45,
      },
      api: {
        avg_response_time: 120,
        requests_per_second: 45,
        error_rate: 0.5,
        cache_hit_rate: 78.5,
      },
      optimization_suggestions: [
        {
          id: 1,
          type: 'cache',
          priority: 'high',
          title: 'Enable Redis Cache',
          description: 'Redis caching can improve response times by up to 40%',
          action: 'enable_redis',
        },
        {
          id: 2,
          type: 'database',
          priority: 'medium',
          title: 'Add Database Indexes',
          description: '5 frequently queried columns lack indexes',
          action: 'add_indexes',
        },
        {
          id: 3,
          type: 'api',
          priority: 'low',
          title: 'Enable API Rate Limiting',
          description: 'Rate limiting can prevent abuse and improve stability',
        },
      ],
      performance_history: Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
        response_time: 100 + Math.random() * 50,
        cache_hit_rate: 70 + Math.random() * 20,
        query_time: 40 + Math.random() * 20,
      })),
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchMetrics()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  const handleOptimize = async (action: string) => {
    try {
      setOptimizing(true)
      await api.post('/admin/performance/optimize', { action })
      toast.success('Optimization applied successfully')
      fetchMetrics()
    } catch (err: any) {
      toast.error(`Failed to apply optimization: ${err.response?.data?.message || err.message}`)
    } finally {
      setOptimizing(false)
    }
  }

  const handleToggleCache = async (enabled: boolean) => {
    try {
      await api.post('/admin/performance/cache', { enabled })
      toast.success(`Cache ${enabled ? 'enabled' : 'disabled'}`)
      fetchMetrics()
    } catch (err: any) {
      toast.error(`Failed to toggle cache: ${err.response?.data?.message || err.message}`)
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>
      case 'low':
        return <Badge variant="secondary">Low</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading && !metrics) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner size="lg" variant="primary" text="Loading performance metrics..." />
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
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-yellow-500/80">
              Performance
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Performance Optimization
          </h1>
          <p className="text-muted-foreground mt-1">Monitor and optimize system performance.</p>
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
            {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {autoRefresh ? 'Pause' : 'Auto'}
          </Button>
          <Button variant="outline" onClick={fetchMetrics} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </motion.div>
      </div>

      {/* Performance Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="suggestions">Optimizations</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DashboardCard title="Cache Hit Rate">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-green-500">{metrics.cache.hit_rate.toFixed(1)}%</p>
                <Progress value={metrics.cache.hit_rate} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {metrics.cache.hit_rate > 70 ? 'Excellent' : metrics.cache.hit_rate > 50 ? 'Good' : 'Needs Improvement'}
                </p>
              </div>
            </DashboardCard>

            <DashboardCard title="Avg Response Time">
              <div className="space-y-2">
                <p className="text-3xl font-bold">{metrics.api.avg_response_time}ms</p>
                <div className="flex items-center gap-1">
                  {metrics.api.avg_response_time < 200 ? (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {metrics.api.avg_response_time < 200 ? 'Good' : 'Slow'}
                  </span>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard title="Database Queries">
              <div className="space-y-2">
                <p className="text-3xl font-bold">{metrics.database.query_count.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  {metrics.database.slow_queries} slow queries
                </p>
              </div>
            </DashboardCard>
          </div>

          <DashboardCard title="Performance History (Last 24 Hours)">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics.performance_history}>
                <defs>
                  <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { hour: '2-digit' })}
                  className="text-xs"
                />
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
                  dataKey="response_time"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorResponse)"
                  name="Response Time (ms)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </DashboardCard>
        </TabsContent>

        {/* Cache */}
        <TabsContent value="cache" className="space-y-6">
          <DashboardCard title="Cache Configuration">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cache Enabled</Label>
                  <p className="text-sm text-muted-foreground">Enable or disable caching</p>
                </div>
                <Switch
                  checked={metrics.cache.enabled}
                  onCheckedChange={handleToggleCache}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Cache Hit Rate</Label>
                  <span className="text-2xl font-bold text-green-500">
                    {metrics.cache.hit_rate.toFixed(1)}%
                  </span>
                </div>
                <Progress value={metrics.cache.hit_rate} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Cache Size</Label>
                  <span className="text-sm font-medium">
                    {formatBytes(metrics.cache.size)} / {formatBytes(metrics.cache.max_size)}
                  </span>
                </div>
                <Progress
                  value={(metrics.cache.size / metrics.cache.max_size) * 100}
                  className="h-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border bg-card/50">
                  <p className="text-sm text-muted-foreground mb-1">Hit Rate</p>
                  <p className="text-2xl font-bold text-green-500">{metrics.cache.hit_rate.toFixed(1)}%</p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card/50">
                  <p className="text-sm text-muted-foreground mb-1">Miss Rate</p>
                  <p className="text-2xl font-bold text-red-500">{metrics.cache.miss_rate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </DashboardCard>
        </TabsContent>

        {/* Database */}
        <TabsContent value="database" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardCard title="Query Statistics">
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-border bg-card/50">
                  <p className="text-sm text-muted-foreground mb-1">Total Queries</p>
                  <p className="text-2xl font-bold">{metrics.database.query_count.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card/50">
                  <p className="text-sm text-muted-foreground mb-1">Slow Queries</p>
                  <p className="text-2xl font-bold text-yellow-500">{metrics.database.slow_queries}</p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card/50">
                  <p className="text-sm text-muted-foreground mb-1">Avg Query Time</p>
                  <p className="text-2xl font-bold">{metrics.database.avg_query_time}ms</p>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard title="Connection Pool">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Pool Usage</Label>
                    <span className="text-sm font-medium">{metrics.database.connection_pool_usage}%</span>
                  </div>
                  <Progress value={metrics.database.connection_pool_usage} className="h-2" />
                </div>
              </div>
            </DashboardCard>
          </div>
        </TabsContent>

        {/* API */}
        <TabsContent value="api" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardCard title="Response Time">
              <div className="space-y-2">
                <p className="text-3xl font-bold">{metrics.api.avg_response_time}ms</p>
                <p className="text-sm text-muted-foreground">Average response time</p>
              </div>
            </DashboardCard>
            <DashboardCard title="Requests/Second">
              <div className="space-y-2">
                <p className="text-3xl font-bold">{metrics.api.requests_per_second}</p>
                <p className="text-sm text-muted-foreground">Current rate</p>
              </div>
            </DashboardCard>
            <DashboardCard title="Error Rate">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-red-500">{metrics.api.error_rate}%</p>
                <p className="text-sm text-muted-foreground">Error percentage</p>
              </div>
            </DashboardCard>
            <DashboardCard title="Cache Hit Rate">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-green-500">{metrics.api.cache_hit_rate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">API cache efficiency</p>
              </div>
            </DashboardCard>
          </div>
        </TabsContent>

        {/* Optimization Suggestions */}
        <TabsContent value="suggestions" className="space-y-6">
          <DashboardCard title="Optimization Suggestions">
            <div className="space-y-4">
              {metrics.optimization_suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{suggestion.title}</h4>
                        {getPriorityBadge(suggestion.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                    {suggestion.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOptimize(suggestion.action!)}
                        disabled={optimizing}
                        className="gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Apply
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
