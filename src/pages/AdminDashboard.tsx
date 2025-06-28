import { useState, useEffect } from 'react'
import {
  Calendar,
  Users,
  Building2,
  BarChart3,
  Settings,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Plus,
  FileText,
  Shield,
  Trash2,
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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import { Link } from 'react-router-dom'
import api from '@/lib/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trashCount, setTrashCount] = useState(0)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        // NOTE: This assumes a single /dashboard/admin endpoint exists.
        // If data comes from multiple endpoints, this needs to be adjusted.
        const response = await api.get('/dashboard/admin')
        setStats(response.data)
        setError(null)
      } catch (err) {
        setError(
          'Failed to fetch dashboard data. The backend endpoint might not be implemented yet.'
        )
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    const fetchTrashCount = async () => {
      try {
        const response = await api.get('/trash')
        setTrashCount(response.data.total_items || 0)
      } catch (error) {
        console.error('Failed to fetch trash count:', error)
      }
    }

    fetchDashboardData()
    fetchTrashCount()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-4 h-4" />
      case 'user':
        return <Users className="w-4 h-4" />
      case 'approval':
        return <UserCheck className="w-4 h-4" />
      case 'report':
        return <FileText className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return <div>Loading dashboard...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (!stats) {
    return <div>No dashboard data available.</div>
  }

  // Destructure stats from the API response
  const {
    keyMetrics,
    eventGrowth,
    eventStatusDistribution,
    userRoleDistribution,
    systemAlerts,
    recentActivities,
  } = stats

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            System overview and management center
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/events/create">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </Link>
          <Link to="/dashboard/settings">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Events"
          value={keyMetrics?.totalEvents?.value || 'N/A'}
          icon={<Calendar className="w-6 h-6 text-blue-600" />}
          trend={keyMetrics?.totalEvents?.trend}
        />
        <MetricCard
          title="Total Users"
          value={keyMetrics?.totalUsers?.value || 'N/A'}
          icon={<Users className="w-6 h-6 text-purple-600" />}
          trend={keyMetrics?.totalUsers?.trend}
        />
        <MetricCard
          title="Active Organizers"
          value={keyMetrics?.activeOrganizers?.value || 'N/A'}
          icon={<Building2 className="w-6 h-6 text-green-600" />}
          trend={keyMetrics?.activeOrganizers?.trend}
        />
        <MetricCard
          title="Items in Trash"
          value={trashCount.toString()}
          icon={<Trash2 className="w-6 h-6 text-red-600" />}
          trend={null}
          link="/dashboard/trash"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Event & User Growth">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={eventGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="events"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Events"
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#8b5cf6"
                strokeWidth={3}
                name="Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </DashboardCard>

        <DashboardCard title="Event Status Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={eventStatusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="value"
              >
                {eventStatusDistribution?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {eventStatusDistribution?.map((item: any) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      {/* User Analytics & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="User Role Distribution">
          <div className="space-y-4">
            {userRoleDistribution?.map((role: any) => (
              <div key={role.role} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{role.role}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{role.count}</span>
                    {role.growth > 0 && (
                      <Badge className="bg-green-100 text-green-800">
                        +{role.growth}%
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress
                  value={
                    (role.count / (keyMetrics?.totalUsers?.numericValue || 1)) *
                    100
                  }
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="System Alerts">
          <div className="space-y-3">
            {systemAlerts?.map((alert: any) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getSeverityColor(
                  alert.severity
                )}`}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs opacity-75 mt-1">{alert.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            View All Alerts
          </Button>
        </DashboardCard>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Recent Activity">
          <div className="space-y-4">
            {recentActivities?.map((activity: any) => (
              <div key={activity.id} className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  {getActivityIcon(activity.type)}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {activity.action} by{' '}
                    <span className="font-semibold">{activity.user}</span>
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Quick Actions">
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/users/add"
              className="block p-4 text-center bg-gray-50 hover:bg-gray-100 rounded-lg"
            >
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <span className="font-medium">Add User</span>
            </Link>
            <Link
              to="/organizers/add"
              className="block p-4 text-center bg-gray-50 hover:bg-gray-100 rounded-lg"
            >
              <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <span className="font-medium">Add Organizer</span>
            </Link>
            <Link
              to="/reports"
              className="block p-4 text-center bg-gray-50 hover:bg-gray-100 rounded-lg"
            >
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <span className="font-medium">View Reports</span>
            </Link>
            <Link
              to="/audit-logs"
              className="block p-4 text-center bg-gray-50 hover:bg-gray-100 rounded-lg"
            >
              <Shield className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <span className="font-medium">Audit Logs</span>
            </Link>
          </div>
        </DashboardCard>
      </div>
    </div>
  )
}
