import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DashboardCard } from '@/components/DashboardCard'
import { Badge } from '@/components/ui/badge'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import api from '@/lib/api'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'
import { usePagination } from '@/hooks/usePagination'
import Pagination from '@/components/Pagination'

interface WorkflowRule {
  id: number
  name: string
  description: string
  trigger: 'event_created' | 'event_updated' | 'ticket_purchased' | 'user_registered' | 'payment_received' | 'custom'
  conditions: Array<{
    field: string
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than'
    value: string
  }>
  actions: Array<{
    type: 'send_email' | 'send_sms' | 'create_task' | 'update_status' | 'webhook' | 'notification'
    config: Record<string, any>
  }>
  status: 'active' | 'inactive' | 'error'
  last_triggered?: string
  trigger_count: number
  created_at: string
}

export default function AutomationWorkflows() {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowRule | null>(null)
  const [newWorkflowName, setNewWorkflowName] = useState('')
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('')
  const [newWorkflowTrigger, setNewWorkflowTrigger] = useState<string>('')
  const [newWorkflowConditions, setNewWorkflowConditions] = useState<Array<{ field: string; operator: string; value: string }>>([])
  const [newWorkflowActions, setNewWorkflowActions] = useState<Array<{ type: string; config: Record<string, any> }>>([])

  const {
    currentPage,
    perPage,
    totalRecords,
    setCurrentPage,
    setPerPage,
    setTotalRecords,
  } = usePagination()

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/automation/workflows', {
        params: {
          page: currentPage,
          per_page: perPage,
        },
      })

      const data = response.data.data || response.data
      setWorkflows(Array.isArray(data) ? data : data.data || [])
      setTotalRecords(data.total || data.length || 0)
    } catch (err: any) {
      console.error('Failed to fetch workflows:', err)
      // Use mock data for development
      setWorkflows(getMockWorkflows())
      setTotalRecords(3)
    } finally {
      setLoading(false)
    }
  }

  const getMockWorkflows = (): WorkflowRule[] => {
    return [
      {
        id: 1,
        name: 'Auto-send Welcome Email',
        description: 'Send welcome email when new user registers',
        trigger: 'user_registered',
        conditions: [],
        actions: [
          {
            type: 'send_email',
            config: { template: 'welcome', subject: 'Welcome to Evella!' },
          },
        ],
        status: 'active',
        last_triggered: new Date().toISOString(),
        trigger_count: 145,
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
      {
        id: 2,
        name: 'Event Reminder',
        description: 'Send reminder 24 hours before event',
        trigger: 'event_created',
        conditions: [
          { field: 'event_date', operator: 'less_than', value: '24h' },
        ],
        actions: [
          {
            type: 'send_email',
            config: { template: 'event_reminder', subject: 'Event Reminder' },
          },
          {
            type: 'send_sms',
            config: { message: 'Your event starts in 24 hours!' },
          },
        ],
        status: 'active',
        last_triggered: new Date(Date.now() - 3600000).toISOString(),
        trigger_count: 89,
        created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
      },
      {
        id: 3,
        name: 'Payment Confirmation',
        description: 'Send confirmation when payment is received',
        trigger: 'payment_received',
        conditions: [
          { field: 'amount', operator: 'greater_than', value: '0' },
        ],
        actions: [
          {
            type: 'send_email',
            config: { template: 'payment_confirmation', subject: 'Payment Confirmed' },
          },
          {
            type: 'create_task',
            config: { title: 'Process payment', assign_to: 'finance_team' },
          },
        ],
        status: 'inactive',
        trigger_count: 234,
        created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
      },
    ]
  }

  useEffect(() => {
    fetchWorkflows()
  }, [currentPage, perPage])

  const handleCreateWorkflow = async () => {
    try {
      await api.post('/admin/automation/workflows', {
        name: newWorkflowName,
        description: newWorkflowDescription,
        trigger: newWorkflowTrigger,
        conditions: newWorkflowConditions,
        actions: newWorkflowActions,
      })
      toast.success('Workflow created successfully')
      setCreateDialogOpen(false)
      resetForm()
      fetchWorkflows()
    } catch (err: any) {
      toast.error(`Failed to create workflow: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleToggleStatus = async (workflowId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      await api.patch(`/admin/automation/workflows/${workflowId}/status`, { status: newStatus })
      toast.success(`Workflow ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      fetchWorkflows()
    } catch (err: any) {
      toast.error(`Failed to update workflow status: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleDeleteWorkflow = async (workflowId: number) => {
    if (!confirm('Are you sure you want to delete this workflow?')) {
      return
    }

    try {
      await api.delete(`/admin/automation/workflows/${workflowId}`)
      toast.success('Workflow deleted successfully')
      fetchWorkflows()
    } catch (err: any) {
      toast.error(`Failed to delete workflow: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleTestWorkflow = async (workflowId: number) => {
    try {
      toast.loading('Testing workflow...')
      await api.post(`/admin/automation/workflows/${workflowId}/test`)
      toast.success('Workflow test completed')
    } catch (err: any) {
      toast.error(`Workflow test failed: ${err.response?.data?.message || err.message}`)
    }
  }

  const resetForm = () => {
    setNewWorkflowName('')
    setNewWorkflowDescription('')
    setNewWorkflowTrigger('')
    setNewWorkflowConditions([])
    setNewWorkflowActions([])
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      event_created: 'Event Created',
      event_updated: 'Event Updated',
      ticket_purchased: 'Ticket Purchased',
      user_registered: 'User Registered',
      payment_received: 'Payment Received',
      custom: 'Custom',
    }
    return labels[trigger] || trigger
  }

  const stats = {
    total: workflows.length,
    active: workflows.filter((w) => w.status === 'active').length,
    inactive: workflows.filter((w) => w.status === 'inactive').length,
    total_triggers: workflows.reduce((sum, w) => sum + w.trigger_count, 0),
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
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-purple-500/80">
              Automation
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Automation & Workflows
          </h1>
          <p className="text-muted-foreground mt-1">Create and manage automated workflows.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Workflow
          </Button>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DashboardCard title="Total Workflows">
          <p className="text-3xl font-bold">{stats.total}</p>
        </DashboardCard>
        <DashboardCard title="Active">
          <p className="text-3xl font-bold text-green-500">{stats.active}</p>
        </DashboardCard>
        <DashboardCard title="Inactive">
          <p className="text-3xl font-bold text-gray-500">{stats.inactive}</p>
        </DashboardCard>
        <DashboardCard title="Total Triggers">
          <p className="text-3xl font-bold">{stats.total_triggers.toLocaleString()}</p>
        </DashboardCard>
      </div>

      {/* Workflows Table */}
      <DashboardCard
        title="Workflows"
        action={
          <Button variant="outline" size="sm" onClick={fetchWorkflows} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Actions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Triggers</TableHead>
              <TableHead>Last Triggered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <Spinner text="Loading workflows..." />
                </TableCell>
              </TableRow>
            ) : workflows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center text-muted-foreground">
                  No workflows found. Create your first workflow to get started.
                </TableCell>
              </TableRow>
            ) : (
              workflows.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{workflow.name}</span>
                      <span className="text-sm text-muted-foreground">{workflow.description}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getTriggerLabel(workflow.trigger)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {workflow.actions.slice(0, 2).map((action, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {action.type.replace('_', ' ')}
                        </Badge>
                      ))}
                      {workflow.actions.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{workflow.actions.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(workflow.status)}</TableCell>
                  <TableCell>
                    <span className="font-medium">{workflow.trigger_count}</span>
                  </TableCell>
                  <TableCell>
                    {workflow.last_triggered ? (
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(workflow.last_triggered), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestWorkflow(workflow.id)}
                        className="gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Test
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(workflow.id, workflow.status)}
                      >
                        {workflow.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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

      {/* Create Workflow Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Workflow</DialogTitle>
            <DialogDescription>
              Create an automated workflow that triggers actions based on events.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="workflow_name">Workflow Name</Label>
              <Input
                id="workflow_name"
                value={newWorkflowName}
                onChange={(e) => setNewWorkflowName(e.target.value)}
                placeholder="e.g., Auto-send Welcome Email"
              />
            </div>

            <div>
              <Label htmlFor="workflow_description">Description</Label>
              <Textarea
                id="workflow_description"
                value={newWorkflowDescription}
                onChange={(e) => setNewWorkflowDescription(e.target.value)}
                placeholder="Describe what this workflow does"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="workflow_trigger">Trigger Event</Label>
              <Select value={newWorkflowTrigger} onValueChange={setNewWorkflowTrigger}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event_created">Event Created</SelectItem>
                  <SelectItem value="event_updated">Event Updated</SelectItem>
                  <SelectItem value="ticket_purchased">Ticket Purchased</SelectItem>
                  <SelectItem value="user_registered">User Registered</SelectItem>
                  <SelectItem value="payment_received">Payment Received</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 rounded-lg border border-border bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Workflow actions and conditions can be configured after creation.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkflow}
              disabled={!newWorkflowName || !newWorkflowTrigger}
            >
              Create Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
