import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Mail, MousePointer, Users, AlertCircle, Sparkles, Zap, Target } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import api from '@/lib/api'

interface AnalyticsData {
  total_sent: number
  open_rate: number
  click_rate: number
  unsubscribe_rate: number
  total_unsubscribed: number
  active_campaigns: number
  total_campaigns: number
}

export function EnhancedAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30days')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/marketing/analytics/overview')
      const data = response.data.data || response.data
      if (data && data.summary) {
        setAnalytics({
          total_sent: data.summary.total_sent || 0,
          open_rate: data.summary.open_rate || 0,
          click_rate: data.summary.click_rate || 0,
          unsubscribe_rate: data.summary.unsubscribe_rate || 0,
          total_unsubscribed: data.summary.total_unsubscribed || 0,
          active_campaigns: data.summary.active_campaigns || 0,
          total_campaigns: data.summary.total_campaigns || 0,
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mock data for charts
  const trendData = [
    { date: 'Jan 1', opens: 2400, clicks: 120 },
    { date: 'Jan 8', opens: 3200, clicks: 180 },
    { date: 'Jan 15', opens: 2800, clicks: 150 },
    { date: 'Jan 22', opens: 3800, clicks: 220 },
    { date: 'Jan 29', opens: 3500, clicks: 200 },
  ]

  const campaignPerformance = [
    { name: 'Welcome Email', openRate: 42.5, clickRate: 5.2 },
    { name: 'Event Reminder', openRate: 38.3, clickRate: 4.8 },
    { name: 'Promo Campaign', openRate: 35.1, clickRate: 3.9 },
    { name: 'Thank You', openRate: 45.2, clickRate: 6.1 },
    { name: 'Newsletter', openRate: 28.7, clickRate: 2.4 },
  ]

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  const getTrendColor = (value: number, benchmark: number) => {
    return value >= benchmark ? 'text-green-600' : 'text-red-600'
  }

  const getTrendIcon = (value: number, benchmark: number) => {
    return value >= benchmark ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-600">No analytics data available</p>
        </CardContent>
      </Card>
    )
  }

  const isAboveIndustry = analytics.open_rate >= 21.5 && analytics.click_rate >= 2.6

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Mail className="w-5 h-5 text-blue-600" />
              <Badge variant="outline" className="text-xs">
                All Time
              </Badge>
            </div>
            <CardTitle className="text-3xl mt-3">{analytics.total_sent.toLocaleString()}</CardTitle>
            <CardDescription>Total Messages Sent</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Target className="w-5 h-5 text-green-600" />
              <Badge className={`${getTrendColor(analytics.open_rate, 21.5)} bg-transparent border`}>
                <span className="mr-1">{getTrendIcon(analytics.open_rate, 21.5)}</span>
                {analytics.open_rate >= 21.5 ? 'Above' : 'Below'} Average
              </Badge>
            </div>
            <CardTitle className="text-3xl mt-3">{analytics.open_rate.toFixed(1)}%</CardTitle>
            <CardDescription>Avg Open Rate (Industry: 21.5%)</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <MousePointer className="w-5 h-5 text-purple-600" />
              <Badge className={`${getTrendColor(analytics.click_rate, 2.6)} bg-transparent border`}>
                <span className="mr-1">{getTrendIcon(analytics.click_rate, 2.6)}</span>
                {analytics.click_rate >= 2.6 ? 'Above' : 'Below'} Average
              </Badge>
            </div>
            <CardTitle className="text-3xl mt-3">{analytics.click_rate.toFixed(1)}%</CardTitle>
            <CardDescription>Avg Click Rate (Industry: 2.6%)</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <CardTitle className="text-3xl mt-3">{analytics.active_campaigns}</CardTitle>
            <CardDescription>Active Campaigns ({analytics.total_campaigns} total)</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Performance Trends (Last 30 Days)
          </CardTitle>
          <CardDescription>Open rates and click-through rates over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="opens" stroke="#3b82f6" strokeWidth={2} name="Opens" />
              <Line type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} name="Clicks" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Campaign Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Campaign Performance Comparison
          </CardTitle>
          <CardDescription>Top performing campaigns by engagement rate</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="openRate" fill="#3b82f6" name="Open Rate %" />
              <Bar dataKey="clickRate" fill="#10b981" name="Click Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-600" />
            Performance Insights
          </CardTitle>
          <CardDescription>AI-powered recommendations based on your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isAboveIndustry && (
            <Alert className="bg-green-50 border-green-200">
              <Zap className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                🎉 Your open and click rates are above industry average! Your campaigns are performing excellently.
              </AlertDescription>
            </Alert>
          )}
          
          <Alert className={analytics.open_rate < 21.5 ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              {analytics.open_rate >= 21.5 
                ? 'Your open rates are healthy. Consider A/B testing subject lines for even better performance.'
                : 'Your open rates are below industry average. Try improving subject lines to increase engagement.'
              }
            </AlertDescription>
          </Alert>

          <Alert className={analytics.click_rate < 2.6 ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}>
            <Target className="w-4 h-4" />
            <AlertDescription>
              {analytics.click_rate >= 2.6
                ? 'Your click-through rates are strong! Consider adding more call-to-action buttons in your emails.'
                : 'Click-through rates can be improved by adding clear, prominent call-to-action buttons.'
              }
            </AlertDescription>
          </Alert>

          {analytics.unsubscribe_rate > 0.5 && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                ⚠️ Unsubscribe rate is at {analytics.unsubscribe_rate.toFixed(2)}%. Consider reducing email frequency or improving content relevance.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Unsubscribe Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{analytics.unsubscribe_rate.toFixed(2)}%</div>
            <p className="text-sm text-gray-600 mt-2">
              {analytics.total_unsubscribed} total unsubscribes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{analytics.active_campaigns}</div>
            <p className="text-sm text-gray-600 mt-2">
              of {analytics.total_campaigns} total campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Engagement Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {((analytics.open_rate * 0.6) + (analytics.click_rate * 0.4)).toFixed(1)}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Combined engagement metric
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
