import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  ArrowLeft,
  BarChart3,
  PieChart,
  Download,
} from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import api from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface RevenueData {
  totalRevenue: number
  monthlyRevenue: Array<{
    month: string
    revenue: number
    events: number
  }>
  eventRevenue: Array<{
    eventName: string
    revenue: number
    tickets: number
    date: string
  }>
  revenueByTicketType: Array<{
    type: string
    revenue: number
    percentage: number
  }>
  growthRate: number
  averageEventRevenue: number
  topPerformingEvents: Array<{
    name: string
    revenue: number
    tickets: number
  }>
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function OrganizerRevenueAnalytics() {
  const { organizerId } = useParams<{ organizerId: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true)
        // For now, we'll use mock data since we don't have the backend endpoint yet
        // In production, this would be: const response = await api.get(`/organizers/${organizerId}/revenue-analytics`)

        // Mock data for demonstration
        const mockData: RevenueData = {
          totalRevenue: 285000,
          monthlyRevenue: [
            { month: 'Jan', revenue: 15000, events: 3 },
            { month: 'Feb', revenue: 22000, events: 4 },
            { month: 'Mar', revenue: 35000, events: 5 },
            { month: 'Apr', revenue: 28000, events: 3 },
            { month: 'May', revenue: 42000, events: 6 },
            { month: 'Jun', revenue: 38000, events: 4 },
            { month: 'Jul', revenue: 51000, events: 7 },
            { month: 'Aug', revenue: 47000, events: 5 },
          ],
          eventRevenue: [
            { eventName: 'Summer Music Festival', revenue: 75000, tickets: 1500, date: '2024-07-15' },
            { eventName: 'Tech Conference 2024', revenue: 45000, tickets: 900, date: '2024-06-20' },
            { eventName: 'Business Networking Gala', revenue: 35000, tickets: 350, date: '2024-08-10' },
            { eventName: 'Startup Pitch Competition', revenue: 28000, tickets: 400, date: '2024-07-25' },
            { eventName: 'Art Exhibition', revenue: 18000, tickets: 600, date: '2024-08-05' },
          ],
          revenueByTicketType: [
            { type: 'VIP', revenue: 95000, percentage: 33.3 },
            { type: 'Premium', revenue: 76000, percentage: 26.7 },
            { type: 'Standard', revenue: 68500, percentage: 24.0 },
            { type: 'Student', revenue: 34200, percentage: 12.0 },
            { type: 'Early Bird', revenue: 12300, percentage: 4.0 },
          ],
          growthRate: 15.7,
          averageEventRevenue: 28500,
          topPerformingEvents: [
            { name: 'Summer Music Festival', revenue: 75000, tickets: 1500 },
            { name: 'Tech Conference 2024', revenue: 45000, tickets: 900 },
            { name: 'Business Networking Gala', revenue: 35000, tickets: 350 },
          ]
        }

        setData(mockData)
        setError(null)
      } catch (err: any) {
        setError('Failed to load revenue analytics data')
        console.error('Revenue analytics error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRevenueData()
  }, [organizerId])

  const exportData = () => {
    // Mock export functionality
    toast.success('Revenue report exported successfully!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent p-6">
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" text="Loading revenue analytics..." />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-transparent p-6">
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <TrendingDown className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Failed to Load Analytics</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/dashboard/organizers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Organizers
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Organizers', href: '/dashboard/organizers' },
          { label: 'Revenue Analytics' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary/80">Revenue Analytics</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Financial Performance</h1>
          <p className="text-muted-foreground mt-1">Comprehensive revenue insights and performance metrics.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportData} className="bg-card/50 backdrop-blur-md border-border/50">
            <Download className="w-4 h-4 mr-2" /> Export Report
          </Button>
          <Button onClick={() => navigate('/dashboard/organizers')} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Organizers
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +{data.growthRate}% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Event Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.averageEventRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Per event average</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.monthlyRevenue.reduce((acc, month) => acc + month.events, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Events this year</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+{data.growthRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Monthly growth</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-card/50 backdrop-blur-md">
          <TabsTrigger value="overview">Revenue Overview</TabsTrigger>
          <TabsTrigger value="events">Event Performance</TabsTrigger>
          <TabsTrigger value="breakdown">Revenue Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle>Monthly Revenue Trend</CardTitle>
              <CardDescription>Revenue performance over the past 8 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.monthlyRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle>Top Performing Events</CardTitle>
                <CardDescription>Highest revenue generating events</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.topPerformingEvents}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle>Event Revenue Details</CardTitle>
                <CardDescription>Detailed breakdown by event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.eventRevenue.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <div>
                      <p className="font-medium text-sm">{event.eventName}</p>
                      <p className="text-xs text-muted-foreground">{event.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${event.revenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{event.tickets} tickets</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle>Revenue by Ticket Type</CardTitle>
                <CardDescription>Distribution across different ticket categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={data.revenueByTicketType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="revenue"
                    >
                      {data.revenueByTicketType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle>Ticket Type Performance</CardTitle>
                <CardDescription>Detailed breakdown with percentages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.revenueByTicketType.map((type, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{type.type}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${type.revenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{type.percentage}%</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
