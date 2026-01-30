import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileCheck,
  Shield,
  Download,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  User,
  FileText,
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

interface ComplianceRecord {
  id: number
  type: 'gdpr' | 'data_retention' | 'access_log' | 'consent' | 'data_export' | 'deletion'
  status: 'compliant' | 'non_compliant' | 'pending' | 'reviewed'
  description: string
  user_id?: number
  user_name?: string
  data_subject?: string
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
}

interface AuditReport {
  id: number
  name: string
  type: 'gdpr' | 'security' | 'access' | 'data_retention'
  generated_at: string
  file_size: number
  status: 'completed' | 'generating' | 'failed'
}

export default function ComplianceAudit() {
  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>([])
  const [auditReports, setAuditReports] = useState<AuditReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'gdpr' | 'data_retention' | 'access_log' | 'consent' | 'data_export' | 'deletion'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'compliant' | 'non_compliant' | 'pending' | 'reviewed'>('all')
  const [activeTab, setActiveTab] = useState('records')

  const {
    currentPage,
    perPage,
    totalRecords,
    setCurrentPage,
    setPerPage,
    setTotalRecords,
  } = usePagination()

  const fetchComplianceRecords = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/compliance/records', {
        params: {
          page: currentPage,
          per_page: perPage,
          search: searchTerm,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      })

      const data = response.data.data || response.data
      setComplianceRecords(Array.isArray(data) ? data : data.data || [])
      setTotalRecords(data.total || data.length || 0)
    } catch (err: any) {
      console.error('Failed to fetch compliance records:', err)
      // Use mock data for development
      setComplianceRecords(getMockComplianceRecords())
      setTotalRecords(5)
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditReports = async () => {
    try {
      const response = await api.get('/admin/compliance/reports')
      setAuditReports(response.data.data || response.data || [])
    } catch (err: any) {
      // Use mock data for development
      setAuditReports(getMockAuditReports())
    }
  }

  const getMockComplianceRecords = (): ComplianceRecord[] => {
    return [
      {
        id: 1,
        type: 'gdpr',
        status: 'compliant',
        description: 'User data access request processed',
        user_id: 123,
        user_name: 'John Doe',
        data_subject: 'john@example.com',
        created_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'Admin User',
      },
      {
        id: 2,
        type: 'data_retention',
        status: 'pending',
        description: 'Data retention policy review required',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 3,
        type: 'deletion',
        status: 'compliant',
        description: 'User data deletion request completed',
        user_id: 456,
        user_name: 'Jane Smith',
        data_subject: 'jane@example.com',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        reviewed_at: new Date(Date.now() - 172800000).toISOString(),
        reviewed_by: 'Admin User',
      },
    ]
  }

  const getMockAuditReports = (): AuditReport[] => {
    return [
      {
        id: 1,
        name: 'GDPR Compliance Report - Q1 2024',
        type: 'gdpr',
        generated_at: new Date().toISOString(),
        file_size: 5242880, // 5MB
        status: 'completed',
      },
      {
        id: 2,
        name: 'Security Audit Report',
        type: 'security',
        generated_at: new Date(Date.now() - 86400000).toISOString(),
        file_size: 3145728, // 3MB
        status: 'completed',
      },
    ]
  }

  useEffect(() => {
    if (activeTab === 'records') {
      fetchComplianceRecords()
    } else {
      fetchAuditReports()
    }
  }, [currentPage, perPage, typeFilter, statusFilter, searchTerm, activeTab])

  const handleGenerateReport = async (type: string) => {
    try {
      toast.loading('Generating audit report...')
      const response = await api.post('/admin/compliance/reports/generate', { type })
      toast.success('Audit report generated successfully')
      fetchAuditReports()
    } catch (err: any) {
      toast.error(`Failed to generate report: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleDownloadReport = async (reportId: number) => {
    try {
      const response = await api.get(`/admin/compliance/reports/${reportId}/download`, {
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `audit-report-${reportId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Report downloaded successfully')
    } catch (err: any) {
      toast.error(`Failed to download report: ${err.response?.data?.message || err.message}`)
    }
  }

  const getTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      gdpr: { label: 'GDPR', color: 'bg-blue-500' },
      data_retention: { label: 'Data Retention', color: 'bg-purple-500' },
      access_log: { label: 'Access Log', color: 'bg-green-500' },
      consent: { label: 'Consent', color: 'bg-yellow-500' },
      data_export: { label: 'Data Export', color: 'bg-orange-500' },
      deletion: { label: 'Deletion', color: 'bg-red-500' },
    }
    const typeInfo = types[type] || { label: type, color: 'bg-gray-500' }
    return <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-500">Compliant</Badge>
      case 'non_compliant':
        return <Badge variant="destructive">Non-Compliant</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>
      case 'reviewed':
        return <Badge className="bg-blue-500">Reviewed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const stats = {
    total: complianceRecords.length,
    compliant: complianceRecords.filter((r) => r.status === 'compliant').length,
    non_compliant: complianceRecords.filter((r) => r.status === 'non_compliant').length,
    pending: complianceRecords.filter((r) => r.status === 'pending').length,
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
              Compliance & Audit
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Compliance & Audit
          </h1>
          <p className="text-muted-foreground mt-1">Manage compliance records and audit reports.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <Button variant="outline" onClick={activeTab === 'records' ? fetchComplianceRecords : fetchAuditReports} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DashboardCard title="Total Records">
          <p className="text-3xl font-bold">{stats.total}</p>
        </DashboardCard>
        <DashboardCard title="Compliant">
          <p className="text-3xl font-bold text-green-500">{stats.compliant}</p>
        </DashboardCard>
        <DashboardCard title="Non-Compliant">
          <p className="text-3xl font-bold text-red-500">{stats.non_compliant}</p>
        </DashboardCard>
        <DashboardCard title="Pending">
          <p className="text-3xl font-bold text-yellow-500">{stats.pending}</p>
        </DashboardCard>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="records">Compliance Records</TabsTrigger>
          <TabsTrigger value="reports">Audit Reports</TabsTrigger>
        </TabsList>

        {/* Compliance Records */}
        <TabsContent value="records" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search compliance records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="gdpr">GDPR</SelectItem>
                <SelectItem value="data_retention">Data Retention</SelectItem>
                <SelectItem value="access_log">Access Log</SelectItem>
                <SelectItem value="consent">Consent</SelectItem>
                <SelectItem value="data_export">Data Export</SelectItem>
                <SelectItem value="deletion">Deletion</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DashboardCard title="Compliance Records">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Data Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Reviewed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <Spinner text="Loading compliance records..." />
                    </TableCell>
                  </TableRow>
                ) : complianceRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                      No compliance records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  complianceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{getTypeBadge(record.type)}</TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell>
                        {record.data_subject ? (
                          <div className="flex flex-col">
                            <span className="text-sm">{record.data_subject}</span>
                            {record.user_name && (
                              <span className="text-xs text-muted-foreground">{record.user_name}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(record.created_at), 'MMM d, yyyy')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {record.reviewed_at ? (
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {format(new Date(record.reviewed_at), 'MMM d, yyyy')}
                            </span>
                            {record.reviewed_by && (
                              <span className="text-xs text-muted-foreground">by {record.reviewed_by}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not reviewed</span>
                        )}
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

        {/* Audit Reports */}
        <TabsContent value="reports" className="space-y-6">
          <DashboardCard
            title="Audit Reports"
            action={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateReport('gdpr')}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Generate GDPR Report
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateReport('security')}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Generate Security Report
                </Button>
              </div>
            }
          >
            {auditReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                <FileCheck className="w-12 h-12 mb-4 opacity-50" />
                <p>No audit reports found. Generate your first report to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {auditReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <FileCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{report.name}</p>
                          <Badge variant="outline" className="capitalize">
                            {report.type}
                          </Badge>
                          {report.status === 'completed' ? (
                            <Badge className="bg-green-500">Completed</Badge>
                          ) : report.status === 'generating' ? (
                            <Badge className="bg-yellow-500">Generating</Badge>
                          ) : (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Generated: {format(new Date(report.generated_at), 'MMM d, yyyy HH:mm')}
                          </span>
                          <span>Size: {formatFileSize(report.file_size)}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReport(report.id)}
                      disabled={report.status !== 'completed'}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
