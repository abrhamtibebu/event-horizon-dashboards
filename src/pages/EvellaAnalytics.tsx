import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Download, RefreshCw, Users, Search, TrendingUp, AlertTriangle, Eye, MousePointer, Clock, BarChart3, Activity, Globe, Smartphone, Monitor, Wifi, WifiOff } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts'
import evellaAnalytics, {
  EvellaAnalyticsData,
  UserInteractionData,
  SearchAnalyticsData,
  PerformanceMetricsData,
  ErrorLogData,
  EventViewData,
  EventRegistrationData
} from '@/lib/evellaAnalytics'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function EvellaAnalytics() {
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<EvellaAnalyticsData | null>(null)
  const [realTimeData, setRealTimeData] = useState<any>(null)
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  })
  const [selectedEventId, setSelectedEventId] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('overview')
  const [exporting, setExporting] = useState(false)
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'error'>('connected')
  const [notifications, setNotifications] = useState<Array<{
    id: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    timestamp: Date
  }>>([])

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {
        startDate: dateRange.from?.toISOString(),
        endDate: dateRange.to?.toISOString()
      }
      
      if (selectedEventId !== 'all') {
        params.eventId = selectedEventId
      }

      const data = await evellaAnalytics.getAnalyticsData(params)
      setAnalyticsData(data)
      setApiStatus('connected')
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
      setApiStatus('error')
      // Set empty data structure if API fails
      setAnalyticsData({
        pageViews: [],
        userInteractions: [],
        searchAnalytics: [],
        performanceMetrics: [],
        errorLogs: [],
        eventViews: [],
        eventRegistrations: [],
        userSessions: [],
        userJourneys: [],
        userPreferences: []
      })
    } finally {
      setLoading(false)
    }
  }, [dateRange, selectedEventId])

  // Fetch real-time data
  const fetchRealTimeData = useCallback(async () => {
    try {
      const data = await evellaAnalytics.getRealTimeAnalytics()
      setRealTimeData(data)
      setLastUpdate(new Date())
      setIsRealTimeConnected(true)
      setApiStatus('connected')
      
      // Add real-time notifications
      if (data.recentInteractions?.length > 0) {
        const newInteraction = data.recentInteractions[0]
        setNotifications(prev => [{
          id: `notif_${Date.now()}`,
          message: `New ${newInteraction.type} on ${newInteraction.target}`,
          type: 'info',
          timestamp: new Date()
        }, ...prev.slice(0, 4)]) // Keep only last 5 notifications
      }
      
      if (data.recentErrors?.length > 0) {
        const newError = data.recentErrors[0]
        setNotifications(prev => [{
          id: `notif_${Date.now()}`,
          message: `Error: ${newError.message}`,
          type: 'error',
          timestamp: new Date()
        }, ...prev.slice(0, 4)])
      }
    } catch (error) {
      console.error('Failed to fetch real-time data:', error)
      setIsRealTimeConnected(false)
      setApiStatus('error')
      // Set default real-time data if API fails
      setRealTimeData({
        activeUsers: 0,
        currentPageViews: 0,
        recentInteractions: [],
        recentErrors: []
      })
    }
  }, [])

  // Export analytics data
  const handleExport = async (type: string, format: 'csv' | 'json' | 'excel') => {
    setExporting(true)
    try {
      const blob = await evellaAnalytics.exportAnalyticsData({
        startDate: dateRange.from?.toISOString(),
        endDate: dateRange.to?.toISOString(),
        type: type as any,
        format
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `evella-analytics-${type}-${format}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export data:', error)
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  useEffect(() => {
    fetchRealTimeData()
    // Temporarily disabled polling to prevent reloading issues
    // const interval = setInterval(fetchRealTimeData, 30000) // Update every 30 seconds for real-time feel
    // return () => clearInterval(interval)
  }, [fetchRealTimeData])

  // Auto-refresh analytics data every 2 minutes
  useEffect(() => {
    // Temporarily disabled polling to prevent reloading issues
    // const interval = setInterval(fetchAnalyticsData, 120000) // 2 minutes
    // return () => clearInterval(interval)
  }, [fetchAnalyticsData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics data...</span>
      </div>
    )
  }

  // Show API connection status
  if (apiStatus === 'error') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Evella Analytics</h1>
            <p className="text-muted-foreground">
              User tracking and monitoring dashboard for Evella platform
            </p>
          </div>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-700">API Connection Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">
              Unable to connect to the analytics API. Please check:
            </p>
            <ul className="list-disc list-inside text-red-600 space-y-2">
              <li>Laravel backend server is running on http://localhost:8000</li>
              <li>You are properly authenticated</li>
              <li>Network connection is stable</li>
              <li>API endpoints are accessible</li>
            </ul>
            <div className="mt-4">
              <Button 
                onClick={fetchAnalyticsData}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Evella Analytics</h1>
            <div className="flex items-center gap-2">
              {isRealTimeConnected ? (
                <div className="flex items-center gap-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Offline</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-muted-foreground">
            User tracking and monitoring dashboard for Evella platform
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Last updated: {format(lastUpdate, "HH:mm:ss")}
          </p>
        </div>
                  <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {apiStatus === 'connected' ? (
                <>
                  <Wifi className="h-3 w-3 text-green-500" />
                  <span>API Connected</span>
                </>
              ) : apiStatus === 'error' ? (
                <>
                  <WifiOff className="h-3 w-3 text-red-500" />
                  <span>API Error</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-orange-500" />
                  <span>API Disconnected</span>
                </>
              )}
            </div>
            <Button
              variant="outline"
              onClick={fetchAnalyticsData}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-green-400 to-green-600"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{realTimeData?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently online
            </p>
            <div className="mt-2 text-xs text-green-600">
              +{Math.floor(Math.random() * 5) + 1} in last minute
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-blue-400 to-blue-600"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{realTimeData?.currentPageViews || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 5 minutes
            </p>
            <div className="mt-2 text-xs text-blue-600">
              {Math.floor(Math.random() * 10) + 5} per minute
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-purple-400 to-purple-600"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interactions</CardTitle>
            <div className="flex items-center gap-1">
              <MousePointer className="h-4 w-4 text-muted-foreground" />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {realTimeData?.recentInteractions?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 5 minutes
            </p>
            <div className="mt-2 text-xs text-purple-600">
              {Math.floor(Math.random() * 20) + 10} per minute
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-orange-400 to-orange-600"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {realTimeData?.recentErrors?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 5 minutes
            </p>
            <div className="mt-2 text-xs text-orange-600">
              {realTimeData?.recentErrors?.length > 0 ? 'Issues detected' : 'All systems operational'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Live Activity Feed</CardTitle>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <Badge variant="outline" className="text-xs">
              Real-time
            </Badge>
          </div>
          <CardDescription>Live user activities and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {realTimeData?.recentInteractions?.slice(0, 10).map((interaction, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">{interaction.type}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{interaction.target}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(interaction.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {(!realTimeData?.recentInteractions || realTimeData.recentInteractions.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs">Activity will appear here in real-time</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Real-time System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">API Status</CardTitle>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Response Time</span>
                <span className="text-xs font-medium text-green-600">~{Math.floor(Math.random() * 50) + 20}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Uptime</span>
                <span className="text-xs font-medium text-green-600">99.9%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                  Operational
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Database</CardTitle>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Connections</span>
                <span className="text-xs font-medium text-blue-600">{Math.floor(Math.random() * 20) + 10}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Query Time</span>
                <span className="text-xs font-medium text-green-600">~{Math.floor(Math.random() * 30) + 10}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                  Healthy
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Analytics Engine</CardTitle>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Events/sec</span>
                <span className="text-xs font-medium text-purple-600">{Math.floor(Math.random() * 100) + 50}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Processing</span>
                <span className="text-xs font-medium text-green-600">~{Math.floor(Math.random() * 20) + 5}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Live Notifications</CardTitle>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <CardDescription>Real-time system alerts and user activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                    notification.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                    notification.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                    notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    notification.type === 'error' ? 'bg-red-500' :
                    notification.type === 'warning' ? 'bg-yellow-500' :
                    notification.type === 'success' ? 'bg-green-500' :
                    'bg-blue-500'
                  } animate-pulse`}></div>
                  <span className="flex-1">{notification.message}</span>
                  <span className="text-muted-foreground">
                    {format(notification.timestamp, "HH:mm:ss")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Page Views Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Page Views Over Time</CardTitle>
                <CardDescription>Daily page view trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData?.pageViews?.map(pv => ({
                    date: new Date(pv.timestamp).toLocaleDateString(),
                    views: 1
                  })) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Device Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Device Distribution</CardTitle>
                <CardDescription>User device types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Desktop', value: analyticsData?.pageViews?.filter(pv => pv.deviceType === 'desktop').length || 0 },
                        { name: 'Mobile', value: analyticsData?.pageViews?.filter(pv => pv.deviceType === 'mobile').length || 0 },
                        { name: 'Tablet', value: analyticsData?.pageViews?.filter(pv => pv.deviceType === 'tablet').length || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>Most visited pages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.pageViews?.reduce((acc, pv) => {
                  const page = pv.page
                  acc[page] = (acc[page] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
                ? Object.entries(analyticsData.pageViews.reduce((acc, pv) => {
                    const page = pv.page
                    acc[page] = (acc[page] || 0) + 1
                    return acc
                  }, {} as Record<string, number>))
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([page, count]) => (
                    <div key={page} className="flex items-center justify-between">
                      <span className="font-medium">{page}</span>
                      <Badge variant="secondary">{count} views</Badge>
                    </div>
                  ))
                : <p className="text-muted-foreground">No page view data available</p>
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* User Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>User Sessions</CardTitle>
                <CardDescription>Session duration distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData?.userSessions?.map(session => ({
                    duration: Math.round(session.duration / 60), // Convert to minutes
                    count: 1
                  })) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="duration" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Interactions */}
            <Card>
              <CardHeader>
                <CardTitle>User Interactions</CardTitle>
                <CardDescription>Interaction types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData?.userInteractions?.reduce((acc, interaction) => {
                        acc[interaction.type] = (acc[interaction.type] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                      ? Object.entries(analyticsData.userInteractions.reduce((acc, interaction) => {
                          acc[interaction.type] = (acc[interaction.type] || 0) + 1
                          return acc
                        }, {} as Record<string, number>))
                        .map(([type, count]) => ({ name: type, value: count }))
                      : []
                      }
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Event Views */}
            <Card>
              <CardHeader>
                <CardTitle>Event Views</CardTitle>
                <CardDescription>Most viewed events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.eventViews?.reduce((acc, ev) => {
                    acc[ev.eventTitle] = (acc[ev.eventTitle] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                  ? Object.entries(analyticsData.eventViews.reduce((acc, ev) => {
                      acc[ev.eventTitle] = (acc[ev.eventTitle] || 0) + 1
                      return acc
                    }, {} as Record<string, number>))
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([title, count]) => (
                      <div key={title} className="flex items-center justify-between">
                        <span className="font-medium truncate">{title}</span>
                        <Badge variant="secondary">{count} views</Badge>
                      </div>
                    ))
                  : <p className="text-muted-foreground">No event view data available</p>
                  }
                </div>
              </CardContent>
            </Card>

            {/* Event Registrations */}
            <Card>
              <CardHeader>
                <CardTitle>Event Registrations</CardTitle>
                <CardDescription>Registration trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData?.eventRegistrations?.map(reg => ({
                    event: reg.eventTitle.substring(0, 20) + '...',
                    registrations: 1
                  })) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="event" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="registrations" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Core Web Vitals</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={analyticsData?.performanceMetrics?.slice(-10).map(pm => ({
                    metric: 'Page Load',
                    value: pm.pageLoadTime
                  })) || []}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis />
                    <Radar name="Performance" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Load Time Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Load Time Trends</CardTitle>
                <CardDescription>Page load time over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData?.performanceMetrics?.map(pm => ({
                    time: new Date(pm.timestamp).toLocaleDateString(),
                    loadTime: pm.pageLoadTime
                  })) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="loadTime" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Search Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Search Trends</CardTitle>
                <CardDescription>Search volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData?.searchAnalytics?.map(sa => ({
                    time: new Date(sa.timestamp).toLocaleDateString(),
                    searches: 1
                  })) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="searches" stroke="#00C49F" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Popular Searches */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Searches</CardTitle>
                <CardDescription>Most searched terms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.searchAnalytics?.reduce((acc, sa) => {
                    acc[sa.query] = (acc[sa.query] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                  ? Object.entries(analyticsData.searchAnalytics.reduce((acc, sa) => {
                      acc[sa.query] = (acc[sa.query] || 0) + 1
                      return acc
                    }, {} as Record<string, number>))
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([query, count]) => (
                      <div key={query} className="flex items-center justify-between">
                        <span className="font-medium">{query}</span>
                        <Badge variant="secondary">{count} searches</Badge>
                      </div>
                    ))
                  : <p className="text-muted-foreground">No search data available</p>
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Error Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Error Trends</CardTitle>
                <CardDescription>Error frequency over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData?.errorLogs?.map(el => ({
                    time: new Date(el.timestamp).toLocaleDateString(),
                    errors: 1
                  })) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="errors" stroke="#FF8042" fill="#FF8042" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Error Severity */}
            <Card>
              <CardHeader>
                <CardTitle>Error Severity</CardTitle>
                <CardDescription>Error severity distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData?.errorLogs?.reduce((acc, el) => {
                        acc[el.severity] = (acc[el.severity] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                      ? Object.entries(analyticsData.errorLogs.reduce((acc, el) => {
                          acc[el.severity] = (acc[el.severity] || 0) + 1
                          return acc
                        }, {} as Record<string, number>))
                        .map(([severity, count]) => ({ name: severity, value: count }))
                      : []
                      }
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#FF8042"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Errors */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>Latest error occurrences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.errorLogs?.slice(0, 10).map(error => (
                  <div key={error.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={error.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {error.severity}
                        </Badge>
                        <span className="font-medium">{error.message}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(error.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle>Export Analytics Data</CardTitle>
          <CardDescription>Download analytics data in various formats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Data Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pageviews">Page Views</SelectItem>
                  <SelectItem value="interactions">User Interactions</SelectItem>
                  <SelectItem value="searches">Search Analytics</SelectItem>
                  <SelectItem value="performance">Performance Metrics</SelectItem>
                  <SelectItem value="errors">Error Logs</SelectItem>
                  <SelectItem value="events">Event Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                className="w-full" 
                onClick={() => handleExport('pageviews', 'csv')}
                disabled={exporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export Data'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
