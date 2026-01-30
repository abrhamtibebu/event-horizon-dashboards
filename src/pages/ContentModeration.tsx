import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Flag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Ban,
  Clock,
  User,
  Calendar,
  MessageSquare,
  Search,
  Filter,
  Download,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import api from '@/lib/api'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'
import { usePagination } from '@/hooks/usePagination'
import Pagination from '@/components/Pagination'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FlaggedContent {
  id: number
  type: 'event' | 'user' | 'message' | 'comment'
  content_id: number
  content_title: string
  reason: string
  reported_by: {
    id: number
    name: string
    email: string
  }
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'removed'
  severity: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
  reviewed_at?: string
  reviewed_by?: {
    id: number
    name: string
  }
  notes?: string
}

export default function ContentModeration() {
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'approved' | 'rejected' | 'removed'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'event' | 'user' | 'message' | 'comment'>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all')
  const [selectedItem, setSelectedItem] = useState<FlaggedContent | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'remove' | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  const {
    currentPage,
    perPage,
    totalRecords,
    setCurrentPage,
    setPerPage,
    setTotalRecords,
  } = usePagination()

  const fetchFlaggedContent = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/moderation/flagged', {
        params: {
          page: currentPage,
          per_page: perPage,
          search: searchTerm,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          severity: severityFilter !== 'all' ? severityFilter : undefined,
        },
      })

      const data = response.data.data || response.data
      setFlaggedContent(Array.isArray(data) ? data : data.data || [])
      setTotalRecords(data.total || data.length || 0)
    } catch (err: any) {
      console.error('Failed to fetch flagged content:', err)
      // Use mock data for development
      setFlaggedContent(getMockFlaggedContent())
      setTotalRecords(5)
    } finally {
      setLoading(false)
    }
  }

  const getMockFlaggedContent = (): FlaggedContent[] => {
    return [
      {
        id: 1,
        type: 'event',
        content_id: 123,
        content_title: 'Tech Conference 2024',
        reason: 'Inappropriate content in event description',
        reported_by: { id: 1, name: 'John Doe', email: 'john@example.com' },
        status: 'pending',
        severity: 'medium',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        type: 'user',
        content_id: 456,
        content_title: 'User Profile: Jane Smith',
        reason: 'Suspicious activity detected',
        reported_by: { id: 2, name: 'Admin User', email: 'admin@example.com' },
        status: 'pending',
        severity: 'high',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ]
  }

  useEffect(() => {
    fetchFlaggedContent()
  }, [currentPage, perPage, statusFilter, typeFilter, severityFilter, searchTerm])

  const handleReview = async (action: 'approve' | 'reject' | 'remove') => {
    if (!selectedItem) return

    try {
      await api.post(`/admin/moderation/${selectedItem.id}/review`, {
        action,
        notes: reviewNotes,
      })
      toast.success(`Content ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'removed'}`)
      setReviewDialogOpen(false)
      setSelectedItem(null)
      setReviewNotes('')
      fetchFlaggedContent()
    } catch (err: any) {
      toast.error(`Failed to ${action} content: ${err.response?.data?.message || err.message}`)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>
      case 'reviewed':
        return <Badge className="bg-blue-500">Reviewed</Badge>
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      case 'removed':
        return <Badge variant="destructive">Removed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-4 h-4" />
      case 'user':
        return <User className="w-4 h-4" />
      case 'message':
        return <MessageSquare className="w-4 h-4" />
      default:
        return <Flag className="w-4 h-4" />
    }
  }

  const stats = {
    total: flaggedContent.length,
    pending: flaggedContent.filter((item) => item.status === 'pending').length,
    reviewed: flaggedContent.filter((item) => item.status === 'reviewed').length,
    critical: flaggedContent.filter((item) => item.severity === 'critical').length,
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
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-yellow-500">
              Content Moderation
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Content Moderation
          </h1>
          <p className="text-muted-foreground mt-1">Review and manage flagged content and user reports.</p>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Flagged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All flagged items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reviewed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.reviewed}</div>
            <p className="text-xs text-muted-foreground mt-1">Processed items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.critical}</div>
            <p className="text-xs text-muted-foreground mt-1">High priority</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search flagged content..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="removed">Removed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="event">Events</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="message">Messages</SelectItem>
            <SelectItem value="comment">Comments</SelectItem>
          </SelectContent>
        </Select>
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

      {/* Table */}
      <DashboardCard title="Flagged Content">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <Spinner text="Loading flagged content..." />
                </TableCell>
              </TableRow>
            ) : flaggedContent.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-12 h-12 opacity-50" />
                    <p>No flagged content found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              flaggedContent.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      <span className="capitalize">{item.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium max-w-xs truncate">{item.content_title}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.reason}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{item.reported_by.name}</span>
                      <span className="text-xs text-muted-foreground">{item.reported_by.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getSeverityBadge(item.severity)}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item)
                          setReviewDialogOpen(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DashboardCard>

      {/* Pagination */}
      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalRecords / perPage)}
          totalRecords={totalRecords}
          perPage={perPage}
          onPageChange={setCurrentPage}
          onPerPageChange={setPerPage}
        />
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Flagged Content</DialogTitle>
            <DialogDescription>
              Review the flagged content and take appropriate action.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border bg-card/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(selectedItem.type)}
                    <span className="font-semibold capitalize">{selectedItem.type}</span>
                  </div>
                  {getSeverityBadge(selectedItem.severity)}
                </div>
                <p className="text-sm font-medium mb-1">{selectedItem.content_title}</p>
                <p className="text-sm text-muted-foreground mb-3">{selectedItem.reason}</p>
                <div className="text-xs text-muted-foreground">
                  <p>Reported by: {selectedItem.reported_by.name} ({selectedItem.reported_by.email})</p>
                  <p>Reported: {format(new Date(selectedItem.created_at), 'MMM d, yyyy HH:mm')}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Review Notes</label>
                <textarea
                  className="w-full min-h-[100px] p-3 border border-border rounded-lg resize-none"
                  placeholder="Add notes about your review decision..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReviewAction('approve')
                    handleReview('approve')
                  }}
                  className="flex-1"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setReviewAction('reject')
                    handleReview('reject')
                  }}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Report
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setReviewAction('remove')
                    handleReview('remove')
                  }}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Content
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
