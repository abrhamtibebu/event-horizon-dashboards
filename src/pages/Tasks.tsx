import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Filter,
  Search,
  User,
  DollarSign,
  Flag,
  FileText,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns'
import api from '@/lib/api'

interface Deliverable {
  id: number
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'
  due_date: string | null
  completed_date: string | null
  amount: number | null
  priority: 1 | 2 | 3
  notes: string | null
  quotation: {
    id: number
    quotation_number: string
  }
  vendor: {
    id: number
    name: string
  }
  event: {
    id: number
    name: string
    start_date: string
  }
  assignedTo: {
    id: number
    name: string
  } | null
  createdBy: {
    id: number
    name: string
  }
}

interface DeliverableFormData {
  title: string
  description: string
  status: string
  due_date: string
  amount: string
  priority: number
  notes: string
  assigned_to: string
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'delayed', label: 'Delayed', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
]

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 2, label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 3, label: 'High', color: 'bg-red-100 text-red-800' },
]

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [eventFilter, setEventFilter] = useState('all')
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editForm, setEditForm] = useState<DeliverableFormData>({
    title: '',
    description: '',
    status: 'pending',
    due_date: '',
    amount: '',
    priority: 1,
    notes: '',
    assigned_to: '',
  })

  const queryClient = useQueryClient()

  // Fetch deliverables
  const { data: deliverables = [], isLoading, refetch } = useQuery({
    queryKey: ['deliverables', { search: searchTerm, status: statusFilter, priority: priorityFilter, vendor: vendorFilter, event: eventFilter }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (vendorFilter !== 'all') params.append('vendor_id', vendorFilter)
      if (eventFilter !== 'all') params.append('event_id', eventFilter)

      const response = await api.get(`/deliverables?${params.toString()}`)
      return response.data.data || []
    },
  })

  // Fetch vendors for filter
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors-for-tasks'],
    queryFn: async () => {
      const response = await api.get('/vendors')
      return response.data.data || []
    },
  })

  // Fetch events for filter
  const { data: events = [] } = useQuery({
    queryKey: ['events-for-tasks'],
    queryFn: async () => {
      const response = await api.get('/events')
      return response.data.data || []
    },
  })

  // Update deliverable mutation
  const updateDeliverableMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DeliverableFormData> }) => {
      const response = await api.put(`/deliverables/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Deliverable updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['deliverables'] })
      setShowEditDialog(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update deliverable')
    },
  })

  // Delete deliverable mutation
  const deleteDeliverableMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/deliverables/${id}`)
      return response.data
    },
    onSuccess: () => {
      toast.success('Deliverable deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['deliverables'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete deliverable')
    },
  })

  // Bulk update status mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: number[]; status: string }) => {
      const response = await api.post('/deliverables/bulk-update-status', {
        deliverable_ids: ids,
        status,
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('Deliverables updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['deliverables'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update deliverables')
    },
  })

  const handleEdit = (deliverable: Deliverable) => {
    setSelectedDeliverable(deliverable)
    setEditForm({
      title: deliverable.title,
      description: deliverable.description || '',
      status: deliverable.status,
      due_date: deliverable.due_date || '',
      amount: deliverable.amount?.toString() || '',
      priority: deliverable.priority,
      notes: deliverable.notes || '',
      assigned_to: deliverable.assignedTo?.id.toString() || '',
    })
    setShowEditDialog(true)
  }

  const handleUpdate = () => {
    if (!selectedDeliverable) return

    const updateData = {
      ...editForm,
      amount: editForm.amount ? Number(editForm.amount) : null,
      assigned_to: editForm.assigned_to ? Number(editForm.assigned_to) : null,
    }

    updateDeliverableMutation.mutate({
      id: selectedDeliverable.id,
      data: updateData,
    })
  }

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this deliverable?')) {
      deleteDeliverableMutation.mutate(id)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status)
    return (
      <Badge className={statusOption?.color || 'bg-gray-100 text-gray-800'}>
        {statusOption?.label || status}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: number) => {
    const priorityOption = PRIORITY_OPTIONS.find(p => p.value === priority)
    return (
      <Badge className={priorityOption?.color || 'bg-gray-100 text-gray-800'}>
        {priorityOption?.label || 'Low'}
      </Badge>
    )
  }

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'completed' || status === 'cancelled') return false
    return isBefore(parseISO(dueDate), new Date())
  }

  const isDueSoon = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'completed' || status === 'cancelled') return false
    const threeDaysFromNow = addDays(new Date(), 3)
    return isAfter(parseISO(dueDate), new Date()) && isBefore(parseISO(dueDate), threeDaysFromNow)
  }

  const filteredDeliverables = Array.isArray(deliverables) ? deliverables.filter((deliverable: Deliverable) => {
    if (priorityFilter !== 'all' && deliverable.priority.toString() !== priorityFilter) {
      return false
    }
    return true
  }) : []

  const stats = {
    total: Array.isArray(deliverables) ? deliverables.length : 0,
    pending: Array.isArray(deliverables) ? deliverables.filter((d: Deliverable) => d.status === 'pending').length : 0,
    inProgress: Array.isArray(deliverables) ? deliverables.filter((d: Deliverable) => d.status === 'in_progress').length : 0,
    completed: Array.isArray(deliverables) ? deliverables.filter((d: Deliverable) => d.status === 'completed').length : 0,
    overdue: Array.isArray(deliverables) ? deliverables.filter((d: Deliverable) => isOverdue(d.due_date, d.status)).length : 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks & Deliverables</h1>
          <p className="text-gray-600">Manage vendor deliverables and track progress</p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search deliverables..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value.toString()}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vendor</Label>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {Array.isArray(vendors) && vendors.map((vendor: any) => (
                    <SelectItem key={vendor.id} value={vendor.id.toString()}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Event</Label>
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {Array.isArray(events) && events.map((event: any) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.name || event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliverables Table */}
      <Card>
        <CardHeader>
          <CardTitle>Deliverables</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(filteredDeliverables) && filteredDeliverables.map((deliverable: Deliverable) => (
                    <TableRow key={deliverable.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{deliverable.title}</div>
                          {deliverable.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {deliverable.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{deliverable.vendor.name}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{deliverable.event.name}</div>
                          <div className="text-sm text-gray-500">
                            {format(parseISO(deliverable.event.start_date), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(deliverable.status)}
                          {isOverdue(deliverable.due_date, deliverable.status) && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          {isDueSoon(deliverable.due_date, deliverable.status) && (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(deliverable.priority)}</TableCell>
                      <TableCell>
                        {deliverable.due_date ? (
                          <div className={`text-sm ${
                            isOverdue(deliverable.due_date, deliverable.status) 
                              ? 'text-red-600 font-medium' 
                              : isDueSoon(deliverable.due_date, deliverable.status)
                              ? 'text-yellow-600 font-medium'
                              : 'text-gray-600'
                          }`}>
                            {format(parseISO(deliverable.due_date), 'MMM d, yyyy')}
                          </div>
                        ) : (
                          <span className="text-gray-400">No due date</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {deliverable.amount ? (
                          <span className="font-medium">
                            ETB {deliverable.amount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {deliverable.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{deliverable.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(deliverable)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(deliverable.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!Array.isArray(filteredDeliverables) || filteredDeliverables.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <FileText className="h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Deliverables Found</h3>
                          <p className="text-gray-600">No deliverables match your current filters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Deliverable</DialogTitle>
            <DialogDescription>
              Update the deliverable details and status
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (ETB)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={editForm.priority.toString()}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value.toString()}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={updateDeliverableMutation.isPending}
            >
              {updateDeliverableMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Update Deliverable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
