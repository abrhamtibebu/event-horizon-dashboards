import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  Shield,
  Activity,
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

interface APIKey {
  id: number
  name: string
  key: string
  key_preview: string
  permissions: string[]
  rate_limit: number
  rate_limit_period: 'minute' | 'hour' | 'day'
  status: 'active' | 'suspended' | 'revoked'
  last_used_at?: string
  created_at: string
  expires_at?: string
  ip_whitelist?: string[]
}

interface APIUsage {
  endpoint: string
  method: string
  requests: number
  errors: number
  avg_response_time: number
  last_accessed: string
}

export default function APIManagement() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [apiUsage, setApiUsage] = useState<APIUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([])
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(1000)
  const [newKeyRatePeriod, setNewKeyRatePeriod] = useState<'minute' | 'hour' | 'day'>('hour')
  const [newKeyExpiresAt, setNewKeyExpiresAt] = useState('')
  const [newKeyIpWhitelist, setNewKeyIpWhitelist] = useState('')
  const [showKey, setShowKey] = useState<number | null>(null)

  const {
    currentPage,
    perPage,
    totalRecords,
    setCurrentPage,
    setPerPage,
    setTotalRecords,
  } = usePagination()

  const availablePermissions = [
    'events.read',
    'events.write',
    'users.read',
    'users.write',
    'tickets.read',
    'tickets.write',
    'analytics.read',
    'webhooks.manage',
  ]

  const fetchApiKeys = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/api/keys', {
        params: {
          page: currentPage,
          per_page: perPage,
        },
      })

      const data = response.data.data || response.data
      setApiKeys(Array.isArray(data) ? data : data.data || [])
      setTotalRecords(data.total || data.length || 0)
    } catch (err: any) {
      console.error('Failed to fetch API keys:', err)
      // Use mock data for development
      setApiKeys(getMockApiKeys())
      setTotalRecords(3)
    } finally {
      setLoading(false)
    }
  }

  const fetchApiUsage = async () => {
    try {
      const response = await api.get('/admin/api/usage')
      setApiUsage(response.data.data || response.data || [])
    } catch (err: any) {
      // Use mock data for development
      setApiUsage(getMockApiUsage())
    }
  }

  const getMockApiKeys = (): APIKey[] => {
    return [
      {
        id: 1,
        name: 'Production API Key',
        key: 'sk_live_1234567890abcdef',
        key_preview: 'sk_live_****ef',
        permissions: ['events.read', 'events.write', 'users.read'],
        rate_limit: 1000,
        rate_limit_period: 'hour',
        status: 'active',
        last_used_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        ip_whitelist: ['192.168.1.100', '10.0.0.1'],
      },
      {
        id: 2,
        name: 'Development Key',
        key: 'sk_test_abcdef1234567890',
        key_preview: 'sk_test_****890',
        permissions: ['events.read', 'tickets.read'],
        rate_limit: 100,
        rate_limit_period: 'minute',
        status: 'active',
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
    ]
  }

  const getMockApiUsage = (): APIUsage[] => {
    return [
      {
        endpoint: '/api/events',
        method: 'GET',
        requests: 15420,
        errors: 23,
        avg_response_time: 45,
        last_accessed: new Date().toISOString(),
      },
      {
        endpoint: '/api/tickets',
        method: 'POST',
        requests: 8920,
        errors: 12,
        avg_response_time: 120,
        last_accessed: new Date(Date.now() - 3600000).toISOString(),
      },
    ]
  }

  useEffect(() => {
    fetchApiKeys()
    fetchApiUsage()
  }, [currentPage, perPage])

  const handleCreateKey = async () => {
    try {
      const response = await api.post('/admin/api/keys', {
        name: newKeyName,
        permissions: newKeyPermissions,
        rate_limit: newKeyRateLimit,
        rate_limit_period: newKeyRatePeriod,
        expires_at: newKeyExpiresAt || null,
        ip_whitelist: newKeyIpWhitelist
          ? newKeyIpWhitelist.split(',').map((ip) => ip.trim())
          : [],
      })

      toast.success('API key created successfully')
      setCreateDialogOpen(false)
      setNewKeyName('')
      setNewKeyPermissions([])
      setNewKeyRateLimit(1000)
      setNewKeyRatePeriod('hour')
      setNewKeyExpiresAt('')
      setNewKeyIpWhitelist('')
      fetchApiKeys()
    } catch (err: any) {
      toast.error(`Failed to create API key: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleRevokeKey = async (keyId: number) => {
    if (!confirm('Are you sure you want to revoke this API key?')) {
      return
    }

    try {
      await api.delete(`/admin/api/keys/${keyId}`)
      toast.success('API key revoked successfully')
      fetchApiKeys()
    } catch (err: any) {
      toast.error(`Failed to revoke API key: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleToggleStatus = async (keyId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
      await api.patch(`/admin/api/keys/${keyId}/status`, { status: newStatus })
      toast.success(`API key ${newStatus === 'active' ? 'activated' : 'suspended'}`)
      fetchApiKeys()
    } catch (err: any) {
      toast.error(`Failed to update API key status: ${err.response?.data?.message || err.message}`)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>
      case 'suspended':
        return <Badge className="bg-yellow-500">Suspended</Badge>
      case 'revoked':
        return <Badge variant="destructive">Revoked</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const stats = {
    total_keys: apiKeys.length,
    active_keys: apiKeys.filter((k) => k.status === 'active').length,
    total_requests: apiUsage.reduce((sum, u) => sum + u.requests, 0),
    total_errors: apiUsage.reduce((sum, u) => sum + u.errors, 0),
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
              API Management
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            API Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage API keys and monitor API usage.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create API Key
          </Button>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DashboardCard title="Total Keys">
          <p className="text-3xl font-bold">{stats.total_keys}</p>
        </DashboardCard>
        <DashboardCard title="Active Keys">
          <p className="text-3xl font-bold text-green-500">{stats.active_keys}</p>
        </DashboardCard>
        <DashboardCard title="Total Requests">
          <p className="text-3xl font-bold">{stats.total_requests.toLocaleString()}</p>
        </DashboardCard>
        <DashboardCard title="Total Errors">
          <p className="text-3xl font-bold text-red-500">{stats.total_errors}</p>
        </DashboardCard>
      </div>

      {/* API Keys Table */}
      <DashboardCard title="API Keys">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Rate Limit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <Spinner text="Loading API keys..." />
                </TableCell>
              </TableRow>
            ) : apiKeys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center text-muted-foreground">
                  No API keys found. Create your first API key to get started.
                </TableCell>
              </TableRow>
            ) : (
              apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {showKey === key.id ? key.key : key.key_preview}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowKey(showKey === key.id ? null : key.id)}
                      >
                        {showKey === key.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(key.key)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {key.permissions.slice(0, 2).map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                      {key.permissions.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{key.permissions.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {key.rate_limit} / {key.rate_limit_period}
                  </TableCell>
                  <TableCell>{getStatusBadge(key.status)}</TableCell>
                  <TableCell>
                    {key.last_used_at ? (
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true })}
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
                        onClick={() => {
                          setSelectedKey(key)
                          setViewDialogOpen(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(key.id, key.status)}
                      >
                        {key.status === 'active' ? 'Suspend' : 'Activate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeKey(key.id)}
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

      {/* API Usage */}
      <DashboardCard title="API Usage Statistics">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Endpoint</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Requests</TableHead>
              <TableHead>Errors</TableHead>
              <TableHead>Avg Response Time</TableHead>
              <TableHead>Last Accessed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiUsage.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No API usage data available
                </TableCell>
              </TableRow>
            ) : (
              apiUsage.map((usage, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{usage.endpoint}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{usage.method}</Badge>
                  </TableCell>
                  <TableCell>{usage.requests.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={usage.errors > 0 ? 'text-red-500' : ''}>
                      {usage.errors}
                    </span>
                  </TableCell>
                  <TableCell>{usage.avg_response_time}ms</TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(usage.last_accessed), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DashboardCard>

      {/* Create API Key Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for external integrations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="key_name">Key Name</Label>
              <Input
                id="key_name"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production API Key"
              />
            </div>

            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availablePermissions.map((perm) => (
                  <div key={perm} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={perm}
                      checked={newKeyPermissions.includes(perm)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewKeyPermissions([...newKeyPermissions, perm])
                        } else {
                          setNewKeyPermissions(newKeyPermissions.filter((p) => p !== perm))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={perm} className="text-sm font-normal cursor-pointer">
                      {perm}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rate_limit">Rate Limit</Label>
                <Input
                  id="rate_limit"
                  type="number"
                  value={newKeyRateLimit}
                  onChange={(e) => setNewKeyRateLimit(parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="rate_period">Period</Label>
                <Select
                  value={newKeyRatePeriod}
                  onValueChange={(value: any) => setNewKeyRatePeriod(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minute">Per Minute</SelectItem>
                    <SelectItem value="hour">Per Hour</SelectItem>
                    <SelectItem value="day">Per Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="expires_at">Expires At (Optional)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={newKeyExpiresAt}
                onChange={(e) => setNewKeyExpiresAt(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="ip_whitelist">IP Whitelist (Optional)</Label>
              <Input
                id="ip_whitelist"
                value={newKeyIpWhitelist}
                onChange={(e) => setNewKeyIpWhitelist(e.target.value)}
                placeholder="192.168.1.1, 10.0.0.1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Comma-separated list of allowed IP addresses
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey} disabled={!newKeyName || newKeyPermissions.length === 0}>
              Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View API Key Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Details</DialogTitle>
            <DialogDescription>View detailed information about this API key.</DialogDescription>
          </DialogHeader>

          {selectedKey && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <p className="font-medium">{selectedKey.name}</p>
              </div>
              <div>
                <Label>Key</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded">
                    {showKey === selectedKey.id ? selectedKey.key : selectedKey.key_preview}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowKey(showKey === selectedKey.id ? null : selectedKey.id)}
                  >
                    {showKey === selectedKey.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(selectedKey.key)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedKey.permissions.map((perm) => (
                    <Badge key={perm} variant="secondary">
                      {perm}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rate Limit</Label>
                  <p>
                    {selectedKey.rate_limit} / {selectedKey.rate_limit_period}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div>{getStatusBadge(selectedKey.status)}</div>
                </div>
              </div>
              {selectedKey.ip_whitelist && selectedKey.ip_whitelist.length > 0 && (
                <div>
                  <Label>IP Whitelist</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedKey.ip_whitelist.map((ip) => (
                      <Badge key={ip} variant="outline">
                        {ip}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
