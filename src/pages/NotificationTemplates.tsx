import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  Plus,
  Edit,
  Trash2,
  Eye,
  Send,
  Copy,
  RefreshCw,
  FileText,
  Bell,
  MessageSquare,
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import api from '@/lib/api'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'
import { usePagination } from '@/hooks/usePagination'
import Pagination from '@/components/Pagination'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface NotificationTemplate {
  id: number
  name: string
  type: 'email' | 'sms' | 'push' | 'in_app'
  subject?: string
  content: string
  variables: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  usage_count: number
}

export default function NotificationTemplates() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateType, setNewTemplateType] = useState<'email' | 'sms' | 'push' | 'in_app'>('email')
  const [newTemplateSubject, setNewTemplateSubject] = useState('')
  const [newTemplateContent, setNewTemplateContent] = useState('')
  const [newTemplateActive, setNewTemplateActive] = useState(true)

  const {
    currentPage,
    perPage,
    totalRecords,
    setCurrentPage,
    setPerPage,
    setTotalRecords,
  } = usePagination()

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/notifications/templates', {
        params: {
          page: currentPage,
          per_page: perPage,
        },
      })

      const data = response.data.data || response.data
      setTemplates(Array.isArray(data) ? data : data.data || [])
      setTotalRecords(data.total || data.length || 0)
    } catch (err: any) {
      console.error('Failed to fetch templates:', err)
      // Use mock data for development
      setTemplates(getMockTemplates())
      setTotalRecords(5)
    } finally {
      setLoading(false)
    }
  }

  const getMockTemplates = (): NotificationTemplate[] => {
    return [
      {
        id: 1,
        name: 'Welcome Email',
        type: 'email',
        subject: 'Welcome to Evella!',
        content: 'Hello {{user_name}}, welcome to Evella! We\'re excited to have you.',
        variables: ['user_name', 'user_email'],
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        usage_count: 1245,
      },
      {
        id: 2,
        name: 'Event Reminder',
        type: 'email',
        subject: 'Reminder: {{event_name}} starts soon',
        content: 'Hi {{user_name}}, don\'t forget that {{event_name}} starts on {{event_date}}.',
        variables: ['user_name', 'event_name', 'event_date'],
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        usage_count: 892,
      },
      {
        id: 3,
        name: 'Payment Confirmation SMS',
        type: 'sms',
        content: 'Payment of {{amount}} received for {{event_name}}. Thank you!',
        variables: ['amount', 'event_name'],
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        usage_count: 567,
      },
    ]
  }

  useEffect(() => {
    fetchTemplates()
  }, [currentPage, perPage])

  const handleCreateTemplate = async () => {
    try {
      await api.post('/admin/notifications/templates', {
        name: newTemplateName,
        type: newTemplateType,
        subject: newTemplateType === 'email' ? newTemplateSubject : undefined,
        content: newTemplateContent,
        is_active: newTemplateActive,
      })
      toast.success('Template created successfully')
      setCreateDialogOpen(false)
      resetForm()
      fetchTemplates()
    } catch (err: any) {
      toast.error(`Failed to create template: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return

    try {
      await api.put(`/admin/notifications/templates/${selectedTemplate.id}`, {
        name: newTemplateName,
        type: newTemplateType,
        subject: newTemplateType === 'email' ? newTemplateSubject : undefined,
        content: newTemplateContent,
        is_active: newTemplateActive,
      })
      toast.success('Template updated successfully')
      setEditDialogOpen(false)
      resetForm()
      setSelectedTemplate(null)
      fetchTemplates()
    } catch (err: any) {
      toast.error(`Failed to update template: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      await api.delete(`/admin/notifications/templates/${templateId}`)
      toast.success('Template deleted successfully')
      fetchTemplates()
    } catch (err: any) {
      toast.error(`Failed to delete template: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleToggleStatus = async (templateId: number, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/notifications/templates/${templateId}/status`, {
        is_active: !currentStatus,
      })
      toast.success(`Template ${!currentStatus ? 'activated' : 'deactivated'}`)
      fetchTemplates()
    } catch (err: any) {
      toast.error(`Failed to update template status: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleTestTemplate = async (templateId: number) => {
    try {
      toast.loading('Sending test notification...')
      await api.post(`/admin/notifications/templates/${templateId}/test`)
      toast.success('Test notification sent successfully')
    } catch (err: any) {
      toast.error(`Failed to send test: ${err.response?.data?.message || err.message}`)
    }
  }

  const resetForm = () => {
    setNewTemplateName('')
    setNewTemplateType('email')
    setNewTemplateSubject('')
    setNewTemplateContent('')
    setNewTemplateActive(true)
  }

  const openEditDialog = (template: NotificationTemplate) => {
    setSelectedTemplate(template)
    setNewTemplateName(template.name)
    setNewTemplateType(template.type)
    setNewTemplateSubject(template.subject || '')
    setNewTemplateContent(template.content)
    setNewTemplateActive(template.is_active)
    setEditDialogOpen(true)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />
      case 'sms':
        return <MessageSquare className="w-4 h-4" />
      case 'push':
        return <Bell className="w-4 h-4" />
      case 'in_app':
        return <FileText className="w-4 h-4" />
      default:
        return <Mail className="w-4 h-4" />
    }
  }

  const getTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      email: { label: 'Email', color: 'bg-blue-500' },
      sms: { label: 'SMS', color: 'bg-green-500' },
      push: { label: 'Push', color: 'bg-purple-500' },
      in_app: { label: 'In-App', color: 'bg-orange-500' },
    }
    const typeInfo = types[type] || { label: type, color: 'bg-gray-500' }
    return <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
  }

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{(\w+)\}\}/g)
    if (!matches) return []
    return matches.map((match) => match.replace(/\{\{|\}\}/g, ''))
  }

  const stats = {
    total: templates.length,
    active: templates.filter((t) => t.is_active).length,
    email: templates.filter((t) => t.type === 'email').length,
    sms: templates.filter((t) => t.type === 'sms').length,
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
              Notification Templates
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Notification Templates
          </h1>
          <p className="text-muted-foreground mt-1">Manage email, SMS, and push notification templates.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Template
          </Button>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DashboardCard title="Total Templates">
          <p className="text-3xl font-bold">{stats.total}</p>
        </DashboardCard>
        <DashboardCard title="Active">
          <p className="text-3xl font-bold text-green-500">{stats.active}</p>
        </DashboardCard>
        <DashboardCard title="Email">
          <p className="text-3xl font-bold text-blue-500">{stats.email}</p>
        </DashboardCard>
        <DashboardCard title="SMS">
          <p className="text-3xl font-bold text-green-500">{stats.sms}</p>
        </DashboardCard>
      </div>

      {/* Templates Table */}
      <DashboardCard
        title="Templates"
        action={
          <Button variant="outline" size="sm" onClick={fetchTemplates} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Variables</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <Spinner text="Loading templates..." />
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center text-muted-foreground">
                  No templates found. Create your first template to get started.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(template.type)}
                      {getTypeBadge(template.type)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {template.subject ? (
                      <span className="text-sm">{template.subject}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.slice(0, 2).map((variable) => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                      {template.variables.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.variables.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {template.is_active ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{template.usage_count.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatDistanceToNow(new Date(template.updated_at), { addSuffix: true })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template)
                          setPreviewDialogOpen(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestTemplate(template.id)}
                        className="gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Test
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(template)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
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

      {/* Create/Edit Template Dialog */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false)
          setEditDialogOpen(false)
          resetForm()
          setSelectedTemplate(null)
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialogOpen ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              {editDialogOpen ? 'Update the notification template.' : 'Create a new notification template.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="template_name">Template Name</Label>
              <Input
                id="template_name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g., Welcome Email"
              />
            </div>

            <div>
              <Label htmlFor="template_type">Type</Label>
              <Select value={newTemplateType} onValueChange={(value: any) => setNewTemplateType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push Notification</SelectItem>
                  <SelectItem value="in_app">In-App Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newTemplateType === 'email' && (
              <div>
                <Label htmlFor="template_subject">Subject</Label>
                <Input
                  id="template_subject"
                  value={newTemplateSubject}
                  onChange={(e) => setNewTemplateSubject(e.target.value)}
                  placeholder="e.g., Welcome to Evella!"
                />
              </div>
            )}

            <div>
              <Label htmlFor="template_content">Content</Label>
              <Textarea
                id="template_content"
                value={newTemplateContent}
                onChange={(e) => setNewTemplateContent(e.target.value)}
                placeholder="Use {{variable_name}} for dynamic content"
                rows={8}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Available variables: {extractVariables(newTemplateContent).join(', ') || 'None detected'}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">Enable this template</p>
              </div>
              <Switch
                checked={newTemplateActive}
                onCheckedChange={setNewTemplateActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false)
                setEditDialogOpen(false)
                resetForm()
                setSelectedTemplate(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editDialogOpen ? handleUpdateTemplate : handleCreateTemplate}
              disabled={!newTemplateName || !newTemplateContent}
            >
              {editDialogOpen ? 'Update' : 'Create'} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>Preview of {selectedTemplate?.name}</DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <Label>Type</Label>
                <div className="mt-1">{getTypeBadge(selectedTemplate.type)}</div>
              </div>
              {selectedTemplate.subject && (
                <div>
                  <Label>Subject</Label>
                  <p className="mt-1 p-2 bg-muted rounded-lg">{selectedTemplate.subject}</p>
                </div>
              )}
              <div>
                <Label>Content</Label>
                <div className="mt-1 p-4 bg-muted rounded-lg whitespace-pre-wrap">
                  {selectedTemplate.content}
                </div>
              </div>
              <div>
                <Label>Variables</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedTemplate.variables.map((variable) => (
                    <Badge key={variable} variant="outline">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
