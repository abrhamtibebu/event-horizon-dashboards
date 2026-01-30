import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plug,
  Plus,
  Trash2,
  Settings,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Key,
  Globe,
  Mail,
  MessageSquare,
  CreditCard,
  Calendar,
  Clock,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Integration {
  id: number
  name: string
  type: 'payment' | 'email' | 'sms' | 'analytics' | 'calendar' | 'webhook' | 'other'
  provider: string
  status: 'active' | 'inactive' | 'error'
  last_sync?: string
  config: Record<string, any>
  created_at: string
}

const INTEGRATION_TYPES = {
  payment: { label: 'Payment Gateway', icon: CreditCard, color: 'text-green-500' },
  email: { label: 'Email Service', icon: Mail, color: 'text-blue-500' },
  sms: { label: 'SMS Service', icon: MessageSquare, color: 'text-purple-500' },
  analytics: { label: 'Analytics', icon: Globe, color: 'text-orange-500' },
  calendar: { label: 'Calendar', icon: Calendar, color: 'text-red-500' },
  webhook: { label: 'Webhook', icon: Plug, color: 'text-indigo-500' },
  other: { label: 'Other', icon: Plug, color: 'text-gray-500' },
}

export default function IntegrationManagement() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [newIntegrationType, setNewIntegrationType] = useState<string>('')
  const [newIntegrationProvider, setNewIntegrationProvider] = useState('')
  const [newIntegrationName, setNewIntegrationName] = useState('')
  const [integrationConfig, setIntegrationConfig] = useState<Record<string, string>>({})

  const fetchIntegrations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/integrations')
      setIntegrations(response.data.data || response.data || [])
    } catch (err: any) {
      console.error('Failed to fetch integrations:', err)
      // Use mock data for development
      setIntegrations(getMockIntegrations())
    } finally {
      setLoading(false)
    }
  }

  const getMockIntegrations = (): Integration[] => {
    return [
      {
        id: 1,
        name: 'Telebirr Payment Gateway',
        type: 'payment',
        provider: 'telebirr',
        status: 'active',
        last_sync: new Date().toISOString(),
        config: { api_key: '***', merchant_id: 'MER123' },
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
      {
        id: 2,
        name: 'Gmail SMTP',
        type: 'email',
        provider: 'gmail',
        status: 'active',
        last_sync: new Date(Date.now() - 3600000).toISOString(),
        config: { smtp_host: 'smtp.gmail.com', port: 587 },
        created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
      },
      {
        id: 3,
        name: 'Google Analytics',
        type: 'analytics',
        provider: 'google',
        status: 'inactive',
        config: { tracking_id: 'UA-XXXXX-X' },
        created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
      },
    ]
  }

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const handleCreateIntegration = async () => {
    try {
      await api.post('/admin/integrations', {
        name: newIntegrationName,
        type: newIntegrationType,
        provider: newIntegrationProvider,
        config: integrationConfig,
      })
      toast.success('Integration created successfully')
      setCreateDialogOpen(false)
      setNewIntegrationType('')
      setNewIntegrationProvider('')
      setNewIntegrationName('')
      setIntegrationConfig({})
      fetchIntegrations()
    } catch (err: any) {
      toast.error(`Failed to create integration: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleUpdateConfig = async () => {
    if (!selectedIntegration) return

    try {
      await api.put(`/admin/integrations/${selectedIntegration.id}/config`, {
        config: integrationConfig,
      })
      toast.success('Integration configuration updated')
      setConfigDialogOpen(false)
      setSelectedIntegration(null)
      setIntegrationConfig({})
      fetchIntegrations()
    } catch (err: any) {
      toast.error(`Failed to update configuration: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleToggleStatus = async (integrationId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      await api.patch(`/admin/integrations/${integrationId}/status`, { status: newStatus })
      toast.success(`Integration ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      fetchIntegrations()
    } catch (err: any) {
      toast.error(`Failed to update status: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleDeleteIntegration = async (integrationId: number) => {
    if (!confirm('Are you sure you want to delete this integration?')) {
      return
    }

    try {
      await api.delete(`/admin/integrations/${integrationId}`)
      toast.success('Integration deleted successfully')
      fetchIntegrations()
    } catch (err: any) {
      toast.error(`Failed to delete integration: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleTestIntegration = async (integrationId: number) => {
    try {
      toast.loading('Testing integration...')
      await api.post(`/admin/integrations/${integrationId}/test`)
      toast.success('Integration test successful')
    } catch (err: any) {
      toast.error(`Integration test failed: ${err.response?.data?.message || err.message}`)
    }
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

  const getIntegrationIcon = (type: string) => {
    const integration = INTEGRATION_TYPES[type as keyof typeof INTEGRATION_TYPES]
    if (!integration) return <Plug className="w-5 h-5" />
    const Icon = integration.icon
    return <Icon className={`w-5 h-5 ${integration.color}`} />
  }

  const stats = {
    total: integrations.length,
    active: integrations.filter((i) => i.status === 'active').length,
    inactive: integrations.filter((i) => i.status === 'inactive').length,
    errors: integrations.filter((i) => i.status === 'error').length,
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
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary/80">
              Integrations
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Integration Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage third-party integrations and services.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Integration
          </Button>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DashboardCard title="Total Integrations">
          <p className="text-3xl font-bold">{stats.total}</p>
        </DashboardCard>
        <DashboardCard title="Active">
          <p className="text-3xl font-bold text-green-500">{stats.active}</p>
        </DashboardCard>
        <DashboardCard title="Inactive">
          <p className="text-3xl font-bold text-gray-500">{stats.inactive}</p>
        </DashboardCard>
        <DashboardCard title="Errors">
          <p className="text-3xl font-bold text-red-500">{stats.errors}</p>
        </DashboardCard>
      </div>

      {/* Integrations List */}
      <DashboardCard
        title="Integrations"
        action={
          <Button variant="outline" size="sm" onClick={fetchIntegrations} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner text="Loading integrations..." />
          </div>
        ) : integrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
            <Plug className="w-12 h-12 mb-4 opacity-50" />
            <p>No integrations found. Add your first integration to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {integrations.map((integration) => {
              const integrationType = INTEGRATION_TYPES[integration.type as keyof typeof INTEGRATION_TYPES]
              return (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 rounded-lg bg-primary/10">
                      {getIntegrationIcon(integration.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{integration.name}</p>
                        {getStatusBadge(integration.status)}
                        {integrationType && (
                          <Badge variant="outline">{integrationType.label}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Provider: {integration.provider}</span>
                        {integration.last_sync && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Last sync: {formatDistanceToNow(new Date(integration.last_sync), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestIntegration(integration.id)}
                      className="gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedIntegration(integration)
                        setIntegrationConfig(integration.config || {})
                        setConfigDialogOpen(true)
                      }}
                      className="gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Config
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(integration.id, integration.status)}
                      className="gap-2"
                    >
                      {integration.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteIntegration(integration.id)}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DashboardCard>

      {/* Create Integration Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Integration</DialogTitle>
            <DialogDescription>
              Connect a third-party service to extend functionality.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="integration_type">Integration Type</Label>
              <Select value={newIntegrationType} onValueChange={setNewIntegrationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select integration type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INTEGRATION_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <value.icon className="w-4 h-4" />
                        {value.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="integration_provider">Provider</Label>
              <Input
                id="integration_provider"
                value={newIntegrationProvider}
                onChange={(e) => setNewIntegrationProvider(e.target.value)}
                placeholder="e.g., telebirr, gmail, twilio"
              />
            </div>

            <div>
              <Label htmlFor="integration_name">Integration Name</Label>
              <Input
                id="integration_name"
                value={newIntegrationName}
                onChange={(e) => setNewIntegrationName(e.target.value)}
                placeholder="e.g., Telebirr Payment Gateway"
              />
            </div>

            {newIntegrationType && (
              <div>
                <Label>Configuration</Label>
                <Textarea
                  placeholder="Enter configuration as JSON or key-value pairs"
                  value={JSON.stringify(integrationConfig, null, 2)}
                  onChange={(e) => {
                    try {
                      setIntegrationConfig(JSON.parse(e.target.value))
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateIntegration}
              disabled={!newIntegrationType || !newIntegrationProvider || !newIntegrationName}
            >
              Create Integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Integration Configuration</DialogTitle>
            <DialogDescription>
              Update the configuration for {selectedIntegration?.name}.
            </DialogDescription>
          </DialogHeader>

          {selectedIntegration && (
            <div className="space-y-4">
              <div>
                <Label>Configuration</Label>
                <Textarea
                  value={JSON.stringify(integrationConfig, null, 2)}
                  onChange={(e) => {
                    try {
                      setIntegrationConfig(JSON.parse(e.target.value))
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateConfig}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
