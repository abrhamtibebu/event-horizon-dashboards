import { useState, useEffect } from 'react'
import { Shield, Search, Filter, Calendar, User, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DashboardCard } from '@/components/DashboardCard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import api from '@/lib/api'

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoading(true)
        const response = await api.get('/audit-logs')
        setLogs(response.data.data)
        setError(null)
      } catch (err) {
        setError('Failed to fetch audit logs.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAuditLogs()
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD'))
      return <User className="w-4 h-4" />
    if (action.includes('UPDATE') || action.includes('EDIT'))
      return <Activity className="w-4 h-4" />
    if (action.includes('DELETE') || action.includes('SUSPEND'))
      return <Shield className="w-4 h-4" />
    return <Activity className="w-4 h-4" />
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAction =
      actionFilter === 'all' ||
      log.action.toLowerCase().includes(actionFilter.toLowerCase())
    const matchesSeverity =
      severityFilter === 'all' || log.severity === severityFilter
    return matchesSearch && matchesAction && matchesSeverity
  })

  const logStats = {
    total: logs.length,
    info: logs.filter((l) => l.severity === 'info').length,
    warning: logs.filter((l) => l.severity === 'warning').length,
    error: logs.filter((l) => l.severity === 'error').length,
    high: logs.filter((l) => l.severity === 'high').length,
  }

  if (loading) return <div>Loading logs...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">
            Monitor system activities and security events
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Calendar className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <DashboardCard title="Total Logs" className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {logStats.total}
          </div>
        </DashboardCard>
        <DashboardCard title="Info" className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {logStats.info}
          </div>
        </DashboardCard>
        <DashboardCard title="Warnings" className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {logStats.warning}
          </div>
        </DashboardCard>
        <DashboardCard title="Errors" className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {logStats.error}
          </div>
        </DashboardCard>
        <DashboardCard title="High Priority" className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {logStats.high}
          </div>
        </DashboardCard>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="login">Login</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="high">High Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Audit Logs Table */}
      <DashboardCard title="System Activity Log">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="hidden md:table-cell">Resource</TableHead>
              <TableHead className="hidden md:table-cell">Severity</TableHead>
              <TableHead className="hidden md:table-cell">IP Address</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-sm text-gray-600">
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900">
                    {log.user?.email}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getActionIcon(log.action)}
                    <span className="font-medium">{log.action}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600 hidden md:table-cell">
                  {log.target_type}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge className={getSeverityColor(log.severity || 'info')}>
                    {log.severity || 'info'}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm text-gray-600 hidden md:table-cell">
                  {log.ip_address}
                </TableCell>
                <TableCell>
                  <pre className="whitespace-pre-wrap break-all">
                    {typeof log.details === 'object'
                      ? JSON.stringify(log.details, null, 2)
                      : log.details}
                  </pre>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DashboardCard>

      {filteredLogs.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No audit logs found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  )
}
