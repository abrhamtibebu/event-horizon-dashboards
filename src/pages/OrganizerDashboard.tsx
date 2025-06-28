import { useState, useEffect } from 'react'
import {
  Calendar,
  Users,
  MessageSquare,
  TrendingUp,
  Plus,
  Eye,
  Mail,
  Phone,
  BarChart3,
  Clock,
  MapPin,
  DollarSign,
} from 'lucide-react'
import { MetricCard } from '@/components/MetricCard'
import { DashboardCard } from '@/components/DashboardCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { Link } from 'react-router-dom'
import api from '@/lib/api'

export default function OrganizerDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrganizerData = async () => {
      try {
        setLoading(true)
        // NOTE: This assumes a single /dashboard/organizer endpoint.
        const response = await api.get('/dashboard/organizer')
        setDashboardData(response.data)
        setError(null)
      } catch (err: any) {
        let message = 'Failed to fetch organizer dashboard data.'
        if (err.response && err.response.data && err.response.data.error) {
          message = err.response.data.error
        } else if (err.message) {
          message = err.message
        }
        setError(message)
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizerData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) return <div>Loading dashboard...</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (!dashboardData) return <div>No dashboard data available.</div>

  const {
    keyMetrics,
    eventPerformance,
    myEvents,
    recentMessages,
    upcomingTasks,
  } = dashboardData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Organizer Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your events and engage with attendees
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/events/create">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </Link>
          <Link to="/messages">
            <Button variant="outline">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="My Events"
          value={keyMetrics?.myEvents?.value || 'N/A'}
          icon={<Calendar className="w-6 h-6 text-blue-600" />}
          trend={keyMetrics?.myEvents?.trend}
        />
        <MetricCard
          title="Total Attendees"
          value={keyMetrics?.totalAttendees?.value || 'N/A'}
          icon={<Users className="w-6 h-6 text-purple-600" />}
          trend={keyMetrics?.totalAttendees?.trend}
        />
        <MetricCard
          title="Total Revenue"
          value={keyMetrics?.totalRevenue?.value || 'N/A'}
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          trend={keyMetrics?.totalRevenue?.trend}
        />
        <MetricCard
          title="Unread Messages"
          value={keyMetrics?.unreadMessages?.value || 'N/A'}
          icon={<MessageSquare className="w-6 h-6 text-orange-600" />}
        />
      </div>

      {/* Performance Chart */}
      <DashboardCard title="Event Performance Overview">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={eventPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="registrations"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
              name="Registrations"
            />
            <Area
              type="monotone"
              dataKey="attendance"
              stackId="2"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
              name="Attendance"
            />
          </AreaChart>
        </ResponsiveContainer>
      </DashboardCard>

      {/* My Events & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="My Upcoming Events">
          <div className="space-y-4">
            {myEvents?.map((event: any) => (
              <div key={event.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {event.name}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{event.time}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>
                      {event.attendees}/{event.maxAttendees}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>${event.revenue}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Registration Progress</span>
                    <span>{event.registrationProgress}%</span>
                  </div>
                  <Progress
                    value={event.registrationProgress}
                    className="h-2"
                  />
                </div>

                <div className="flex gap-2 mt-3">
                  <Link to={`/events/${event.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Upcoming Tasks">
          <div className="space-y-3">
            {upcomingTasks?.map((task: any) => (
              <div
                key={task.id}
                className={`flex justify-between items-center p-3 rounded-lg ${getPriorityColor(
                  task.priority
                )}`}
              >
                <span className="font-medium">{task.task}</span>
                <Badge variant="secondary">{task.due}</Badge>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            View All Tasks
          </Button>
        </DashboardCard>
      </div>

      {/* Recent Messages */}
      <DashboardCard title="Recent Messages">
        <div className="space-y-4">
          {recentMessages?.map((message: any) => (
            <div key={message.id} className="flex items-start gap-4">
              {message.unread && (
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
              )}
              <div className={!message.unread ? 'ml-5' : ''}>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{message.from}</p>
                  <p className="text-xs text-gray-500">{message.time}</p>
                </div>
                <p className="text-sm text-gray-600">{message.message}</p>
              </div>
            </div>
          ))}
        </div>
        <Link to="/messages" className="block mt-4">
          <Button variant="outline" size="sm" className="w-full">
            View All Messages
          </Button>
        </Link>
      </DashboardCard>
    </div>
  )
}
