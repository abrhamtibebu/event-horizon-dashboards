import { useState, useEffect } from 'react'
import {
  Calendar,
  Users,
  QrCode,
  CheckCircle,
  Clock,
  MapPin,
  Bell,
  UserCheck,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react'
import { MetricCard } from '@/components/MetricCard'
import { DashboardCard } from '@/components/DashboardCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import api from '@/lib/api'

export default function UsherDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchUsherData = async () => {
      try {
        setLoading(true)
        const response = await api.get('/dashboard/usher')
        setDashboardData(response.data)
        setError(null)
      } catch (err) {
        setError(
          'Failed to fetch usher dashboard data. The backend endpoint might not be implemented yet.'
        )
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsherData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'VIP':
        return 'bg-purple-100 text-purple-800'
      case 'Speaker':
        return 'bg-blue-100 text-blue-800'
      case 'Staff':
        return 'bg-green-100 text-green-800'
      case 'Visitor':
        return 'bg-gray-100 text-gray-800'
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

  const { keyMetrics, assignedEvents, recentCheckIns, pendingIssues } =
    dashboardData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usher Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage attendee check-ins and event support
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <QrCode className="w-4 h-4 mr-2" />
            QR Scanner
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Assigned Events"
          value={keyMetrics?.assignedEvents || 'N/A'}
          icon={<Calendar className="w-6 h-6 text-blue-600" />}
        />
        <MetricCard
          title="Total Check-ins Today"
          value={keyMetrics?.totalCheckInsToday?.value || 'N/A'}
          icon={<UserCheck className="w-6 h-6 text-green-600" />}
          trend={keyMetrics?.totalCheckInsToday?.trend}
        />
        <MetricCard
          title="Pending Issues"
          value={keyMetrics?.pendingIssues || 'N/A'}
          icon={<AlertTriangle className="w-6 h-6 text-orange-600" />}
        />
        <MetricCard
          title="Active Events"
          value={keyMetrics?.activeEvents || 'N/A'}
          icon={<Users className="w-6 h-6 text-purple-600" />}
        />
      </div>

      {/* Event Overview & Quick Check-in */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="My Assigned Events">
          <div className="space-y-4">
            {assignedEvents?.map((event: any) => (
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
                      {event.checkedIn}/{event.totalAttendees}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Check-in Progress</span>
                    <span>
                      {event.totalAttendees
                        ? Math.round(
                            (event.checkedIn / event.totalAttendees) * 100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      event.totalAttendees
                        ? (event.checkedIn / event.totalAttendees) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-gray-600">
                    Zone: {event.zone}
                  </span>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    <UserCheck className="w-4 h-4 mr-1" />
                    Check-in
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Quick Check-in">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search attendee name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger>
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {assignedEvents?.map((event: any) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">
                Scan QR code or search manually
              </p>
            </div>

            <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600">
              <UserCheck className="w-4 h-4 mr-2" />
              Manual Check-in
            </Button>
          </div>
        </DashboardCard>
      </div>

      {/* Recent Activity & Support Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Recent Check-ins">
          <div className="space-y-3">
            {recentCheckIns?.map((checkIn: any) => (
              <div key={checkIn.id} className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <UserCheck className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{checkIn.name}</p>
                  <p className="text-xs text-gray-500">{checkIn.company}</p>
                </div>
                <div className="text-right">
                  <Badge className={getTypeColor(checkIn.type)}>
                    {checkIn.type}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">{checkIn.time}</p>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Pending Issues">
          <div className="space-y-3">
            {pendingIssues?.map((issue: any) => (
              <div
                key={issue.id}
                className={`p-3 rounded-lg border ${getPriorityColor(
                  issue.priority
                )}`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{issue.issue}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {issue.location} • {issue.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            Report New Issue
          </Button>
        </DashboardCard>
      </div>
    </div>
  )
}
