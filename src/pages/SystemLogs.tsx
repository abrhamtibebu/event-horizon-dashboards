import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
  Trash2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface LogEntry {
  id: number
  level: 'info' | 'warning' | 'error' | 'debug' | 'critical'
  message: string
  context?: Record<string, any>
  user_id?: number
  user_name?: string
  ip_address?: string
  created_at: string
  stack_trace?: string
}

export default function SystemLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'debug' | 'critical'>('all')
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const {
    currentPage,
    perPage,
    totalRecords,
    setCurrentPage,
    setPerPage,
    setTotalRecords,
  } = usePagination()

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/logs', {
        params: {
          page: currentPage,
          per_page: perPage,
          search: searchTerm,
          level: levelFilter !== 'all' ? levelFilter : undefined,
          type: activeTab !== 'all' ? activeTab : undefined,
        },
      })

      const data = response.data.data || response.data
      setLogs(Array.isArray(data) ? data : data.data || [])
      setTotalRecords(data.total || data.length || 0)
    } catch (err: any) {
      console.error('Failed to fetch logs:', err)
      // Use mock data for development
      setLogs(getMockLogs())
      setTotalRecords(10)
    } finally {
      setLoading(false)
    }
  }

  const getMockLogs = (): LogEntry[] => {
    return [
      {
        id: 1,
        level: 'error',
        message: 'Database connection failed',
        context: { database: 'postgres', host: 'localhost' },
        ip_address: '192.168.1.100',
        created_at: new Date().toISOString(),
        stack_trace: 'Error: Connection timeout\n  at Database.connect()\n  at Server.start()',
      },
      {
        id: 2,
        level: 'warning',
        message: 'High memory usage detected',
        context: { memory_usage: '85%', threshold: '80%' },
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 3,
        level: 'info',
        message: 'User logged in successfully',
        context: { user_id: 123, email: 'user@example.com' },
        user_id: 123,
        user_name: 'John Doe',
        ip_address: '192.168.1.101',
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 4,
        level: 'critical',
        message: 'Payment gateway timeout',
        context: { gateway: 'telebirr', timeout: 30 },
        created_at: new Date(Date.now() - 10800000).toISOString(),
      },
    ]
  }

  useEffect(() => {
    fetchLogs()
  }, [currentPage, perPage, levelFilter, searchTerm, activeTab])

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete('/admin/logs')
      toast.success('Logs cleared successfully')
      fetchLogs()
    } catch (err: any) {
      toast.error(`Failed to clear logs: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleExport = () => {
    const csvContent = [
      ['Level', 'Message', 'User', 'IP Address', 'Timestamp'].join(','),
      ...logs.map((log) =>
        [
          log.level,
          `"${log.message.replace(/"/g, '""')}"`,
          log.user_name || 'N/A',
          log.ip_address || 'N/A',
          format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Logs exported successfully')
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />
      case 'debug':
        return <FileText className="w-4 h-4 text-gray-500" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>
      case 'error':
        return <Badge className="bg-red-500">Error</Badge>
      case 'warning':
        return <Badge className="bg-yellow-500">Warning</Badge>
      case 'info':
        return <Badge className="bg-blue-500">Info</Badge>
      case 'debug':
        return <Badge variant="secondary">Debug</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const stats = {
    total: logs.length,
    errors: logs.filter((l) => l.level === 'error' || l.level === 'critical').length,
    warnings: logs.filter((l) => l.level === 'warning').length,
    info: logs.filter((l) => l.level === 'info').length,
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
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-blue-500/80">
              System Logs
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            System Logs
          </h1>
          <p className="text-muted-foreground mt-1">View and manage system logs and events.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchLogs} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="destructive" onClick={handleClearLogs} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Clear Logs
          </Button>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DashboardCard title="Total Logs">
          <p className="text-3xl font-bold">{stats.total}</p>
        </DashboardCard>
        <DashboardCard title="Errors">
          <p className="text-3xl font-bold text-red-500">{stats.errors}</p>
        </DashboardCard>
        <DashboardCard title="Warnings">
          <p className="text-3xl font-bold text-yellow-500">{stats.warnings}</p>
        </DashboardCard>
        <DashboardCard title="Info">
          <p className="text-3xl font-bold text-blue-500">{stats.info}</p>
        </DashboardCard>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={levelFilter} onValueChange={(value: any) => setLevelFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Log Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="debug">Debug</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <DashboardCard title="System Logs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Level</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>User</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <Spinner text="Loading logs..." />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                  No logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getLevelIcon(log.level)}
                      {getLevelBadge(log.level)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate">{log.message}</p>
                  </TableCell>
                  <TableCell>
                    {log.user_name ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{log.user_name}</span>
                        {log.user_id && (
                          <span className="text-xs text-muted-foreground">ID: {log.user_id}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.ip_address ? (
                      <code className="text-sm bg-muted px-2 py-1 rounded">{log.ip_address}</code>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{format(new Date(log.created_at), 'MMM d, yyyy')}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'HH:mm:ss')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedLog(log)
                        setViewDialogOpen(true)
                      }}
                    >
                      View
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

      {/* View Log Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
            <DialogDescription>Detailed information about this log entry.</DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Level</Label>
                <div className="flex items-center gap-2 mt-1">
                  {getLevelIcon(selectedLog.level)}
                  {getLevelBadge(selectedLog.level)}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Message</Label>
                <p className="mt-1 p-3 bg-muted rounded-lg">{selectedLog.message}</p>
              </div>

              {selectedLog.context && Object.keys(selectedLog.context).length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Context</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-sm overflow-auto max-h-48">
                    {JSON.stringify(selectedLog.context, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.stack_trace && (
                <div>
                  <Label className="text-sm font-medium">Stack Trace</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-sm overflow-auto max-h-64 font-mono">
                    {selectedLog.stack_trace}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedLog.user_name && (
                  <div>
                    <Label className="text-sm font-medium">User</Label>
                    <p className="mt-1">{selectedLog.user_name}</p>
                  </div>
                )}
                {selectedLog.ip_address && (
                  <div>
                    <Label className="text-sm font-medium">IP Address</Label>
                    <p className="mt-1 font-mono">{selectedLog.ip_address}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Timestamp</Label>
                <p className="mt-1">
                  {format(new Date(selectedLog.created_at), 'PPpp')}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
