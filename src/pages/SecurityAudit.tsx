import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  User,
  Search,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Ban,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DashboardCard } from '@/components/DashboardCard'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import api from '@/lib/api'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'
import { usePagination } from '@/hooks/usePagination'
import Pagination from '@/components/Pagination'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface LoginHistory {
  id: number
  user_id: number
  user_name: string
  user_email: string
  ip_address: string
  user_agent: string
  location?: string
  status: 'success' | 'failed' | 'blocked'
  login_at: string
  logout_at?: string
}

interface SecurityEvent {
  id: number
  type: 'login_attempt' | 'password_change' | 'permission_change' | 'suspicious_activity' | 'data_export'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  user_id?: number
  user_name?: string
  ip_address?: string
  metadata?: any
  created_at: string
}

export default function SecurityAudit() {
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([])
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed' | 'blocked'>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all')
  const [activeTab, setActiveTab] = useState('logins')

  const {
    currentPage,
    perPage,
    totalRecords,
    setCurrentPage,
    setPerPage,
    setTotalRecords,
  } = usePagination()

  const fetchLoginHistory = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/security/login-history', {
        params: {
          page: currentPage,
          per_page: perPage,
          search: searchTerm,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      })

      const data = response.data.data || response.data
      setLoginHistory(Array.isArray(data) ? data : data.data || [])
      setTotalRecords(data.total || data.length || 0)
    } catch (err: any) {
      console.error('Failed to fetch login history:', err)
      // Use mock data for development
      setLoginHistory(getMockLoginHistory())
      setTotalRecords(10)
    } finally {
      setLoading(false)
    }
  }

  const fetchSecurityEvents = async () => {
    try {
      const response = await api.get('/admin/security/events', {
        params: {
          page: currentPage,
          per_page: perPage,
          severity: severityFilter !== 'all' ? severityFilter : undefined,
        },
      })

      const data = response.data.data || response.data
      setSecurityEvents(Array.isArray(data) ? data : data.data || [])
    } catch (err: any) {
      // Use mock data for development
      setSecurityEvents(getMockSecurityEvents())
    }
  }

  const getMockLoginHistory = (): LoginHistory[] => {
    return [
      {
        id: 1,
        user_id: 1,
        user_name: 'John Doe',
        user_email: 'john@example.com',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        location: 'Addis Ababa, Ethiopia',
        status: 'success',
        login_at: new Date().toISOString(),
        logout_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 2,
        user_id: 2,
        user_name: 'Jane Smith',
        user_email: 'jane@example.com',
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        location: 'Dire Dawa, Ethiopia',
        status: 'failed',
        login_at: new Date(Date.now() - 7200000).toISOString(),
      },
    ]
  }

  const getMockSecurityEvents = (): SecurityEvent[] => {
    return [
      {
        id: 1,
        type: 'suspicious_activity',
        severity: 'high',
        description: 'Multiple failed login attempts from IP 192.168.1.100',
        ip_address: '192.168.1.100',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        type: 'password_change',
        severity: 'medium',
        description: 'User changed password',
        user_id: 1,
        user_name: 'John Doe',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ]
  }

  useEffect(() => {
    if (activeTab === 'logins') {
      fetchLoginHistory()
    } else {
      fetchSecurityEvents()
    }
  }, [currentPage, perPage, statusFilter, searchTerm, activeTab, severityFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Success</Badge>
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>
      case 'high':
        return <Badge className="bg-red-500">High</Badge>
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>
      case 'low':
        return <Badge variant="secondary">Low</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'login_attempt':
        return <Lock className="w-4 h-4" />
      case 'password_change':
        return <Shield className="w-4 h-4" />
      case 'permission_change':
        return <User className="w-4 h-4" />
      case 'suspicious_activity':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Shield className="w-4 h-4" />
    }
  }

  const stats = {
    total_logins: loginHistory.length,
    successful_logins: loginHistory.filter((l) => l.status === 'success').length,
    failed_logins: loginHistory.filter((l) => l.status === 'failed').length,
    blocked_ips: new Set(loginHistory.filter((l) => l.status === 'blocked').map((l) => l.ip_address)).size,
    critical_events: securityEvents.filter((e) => e.severity === 'critical').length,
  }

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
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-red-500/80">
              Security & Audit
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Security & Audit
          </h1>
          <p className="text-muted-foreground mt-1">Monitor security events and login history.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <Button variant="outline" onClick={() => activeTab === 'logins' ? fetchLoginHistory() : fetchSecurityEvents()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <DashboardCard title="Total Logins">
          <p className="text-3xl font-bold">{stats.total_logins}</p>
        </DashboardCard>
        <DashboardCard title="Successful">
          <p className="text-3xl font-bold text-green-500">{stats.successful_logins}</p>
        </DashboardCard>
        <DashboardCard title="Failed">
          <p className="text-3xl font-bold text-red-500">{stats.failed_logins}</p>
        </DashboardCard>
        <DashboardCard title="Blocked IPs">
          <p className="text-3xl font-bold text-orange-500">{stats.blocked_ips}</p>
        </DashboardCard>
        <DashboardCard title="Critical Events">
          <p className="text-3xl font-bold text-red-500">{stats.critical_events}</p>
        </DashboardCard>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="logins">Login History</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
        </TabsList>

        {/* Login History */}
        <TabsContent value="logins" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, email, or IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DashboardCard title="Login History">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Login Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <Spinner text="Loading login history..." />
                    </TableCell>
                  </TableRow>
                ) : loginHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center text-muted-foreground">
                      No login history found.
                    </TableCell>
                  </TableRow>
                ) : (
                  loginHistory.map((login) => (
                    <TableRow key={login.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{login.user_name}</span>
                          <span className="text-sm text-muted-foreground">{login.user_email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <span>{login.ip_address}</span>
                        </div>
                      </TableCell>
                      <TableCell>{login.location || 'Unknown'}</TableCell>
                      <TableCell>{getStatusBadge(login.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{format(new Date(login.login_at), 'MMM d, yyyy')}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(login.login_at), 'HH:mm:ss')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {login.logout_at ? (
                          <span className="text-sm">
                            {Math.round(
                              (new Date(login.logout_at).getTime() - new Date(login.login_at).getTime()) /
                                60000
                            )}{' '}
                            min
                          </span>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DashboardCard>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalRecords / perPage)}
            totalRecords={totalRecords}
            perPage={perPage}
            onPageChange={setCurrentPage}
            onPerPageChange={setPerPage}
          />
        </TabsContent>

        {/* Security Events */}
        <TabsContent value="events" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={severityFilter} onValueChange={(value: any) => setSeverityFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DashboardCard title="Security Events">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <Spinner text="Loading security events..." />
                    </TableCell>
                  </TableRow>
                ) : securityEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center text-muted-foreground">
                      No security events found.
                    </TableCell>
                  </TableRow>
                ) : (
                  securityEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEventTypeIcon(event.type)}
                          <span className="capitalize">{event.type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>{event.description}</TableCell>
                      <TableCell>
                        {event.user_name ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{event.user_name}</span>
                            {event.user_id && (
                              <span className="text-xs text-muted-foreground">ID: {event.user_id}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </TableCell>
                      <TableCell>{event.ip_address || 'N/A'}</TableCell>
                      <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{format(new Date(event.created_at), 'MMM d, yyyy')}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
