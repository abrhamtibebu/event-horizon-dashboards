import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Lock,
  Key,
  Globe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Ban,
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import api from '@/lib/api'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePagination } from '@/hooks/usePagination'
import Pagination from '@/components/Pagination'

interface IPWhitelist {
  id: number
  ip_address: string
  description: string
  created_at: string
  last_used?: string
}

interface TwoFactorAuth {
  enabled: boolean
  required_for_admins: boolean
  backup_codes_count: number
}

interface SecurityPolicy {
  password_min_length: number
  password_require_uppercase: boolean
  password_require_lowercase: boolean
  password_require_numbers: boolean
  password_require_symbols: boolean
  session_timeout: number
  max_login_attempts: number
  lockout_duration: number
}

export default function AdvancedSecurity() {
  const [ipWhitelist, setIpWhitelist] = useState<IPWhitelist[]>([])
  const [twoFactorAuth, setTwoFactorAuth] = useState<TwoFactorAuth | null>(null)
  const [securityPolicy, setSecurityPolicy] = useState<SecurityPolicy | null>(null)
  const [loading, setLoading] = useState(true)
  const [addIpDialogOpen, setAddIpDialogOpen] = useState(false)
  const [newIpAddress, setNewIpAddress] = useState('')
  const [newIpDescription, setNewIpDescription] = useState('')

  const {
    currentPage,
    perPage,
    totalRecords,
    setCurrentPage,
    setPerPage,
    setTotalRecords,
  } = usePagination()

  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      const [ipResponse, twoFactorResponse, policyResponse] = await Promise.all([
        api.get('/admin/security/ip-whitelist', {
          params: { page: currentPage, per_page: perPage },
        }),
        api.get('/admin/security/two-factor'),
        api.get('/admin/security/policy'),
      ])

      const ipData = ipResponse.data.data || ipResponse.data
      setIpWhitelist(Array.isArray(ipData) ? ipData : ipData.data || [])
      setTotalRecords(ipData.total || ipData.length || 0)
      setTwoFactorAuth(twoFactorResponse.data)
      setSecurityPolicy(policyResponse.data)
    } catch (err: any) {
      console.error('Failed to fetch security data:', err)
      // Use mock data for development
      setIpWhitelist(getMockIpWhitelist())
      setTotalRecords(3)
      setTwoFactorAuth({
        enabled: true,
        required_for_admins: true,
        backup_codes_count: 10,
      })
      setSecurityPolicy({
        password_min_length: 8,
        password_require_uppercase: true,
        password_require_lowercase: true,
        password_require_numbers: true,
        password_require_symbols: false,
        session_timeout: 120,
        max_login_attempts: 5,
        lockout_duration: 30,
      })
    } finally {
      setLoading(false)
    }
  }

  const getMockIpWhitelist = (): IPWhitelist[] => {
    return [
      {
        id: 1,
        ip_address: '192.168.1.100',
        description: 'Office Network',
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        last_used: new Date().toISOString(),
      },
      {
        id: 2,
        ip_address: '10.0.0.0/24',
        description: 'VPN Network',
        created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
      },
    ]
  }

  useEffect(() => {
    fetchSecurityData()
  }, [currentPage, perPage])

  const handleAddIp = async () => {
    try {
      await api.post('/admin/security/ip-whitelist', {
        ip_address: newIpAddress,
        description: newIpDescription,
      })
      toast.success('IP address added to whitelist')
      setAddIpDialogOpen(false)
      setNewIpAddress('')
      setNewIpDescription('')
      fetchSecurityData()
    } catch (err: any) {
      toast.error(`Failed to add IP: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleDeleteIp = async (ipId: number) => {
    if (!confirm('Are you sure you want to remove this IP from the whitelist?')) {
      return
    }

    try {
      await api.delete(`/admin/security/ip-whitelist/${ipId}`)
      toast.success('IP address removed from whitelist')
      fetchSecurityData()
    } catch (err: any) {
      toast.error(`Failed to remove IP: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleUpdateTwoFactor = async (field: string, value: boolean) => {
    try {
      await api.patch('/admin/security/two-factor', { [field]: value })
      toast.success('Two-factor authentication settings updated')
      fetchSecurityData()
    } catch (err: any) {
      toast.error(`Failed to update 2FA settings: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleUpdateSecurityPolicy = async (field: string, value: any) => {
    if (!securityPolicy) return

    try {
      const updated = { ...securityPolicy, [field]: value }
      await api.put('/admin/security/policy', updated)
      setSecurityPolicy(updated)
      toast.success('Security policy updated')
    } catch (err: any) {
      toast.error(`Failed to update security policy: ${err.response?.data?.message || err.message}`)
    }
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
              Advanced Security
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Advanced Security
          </h1>
          <p className="text-muted-foreground mt-1">Manage advanced security settings and policies.</p>
        </motion.div>
      </div>

      {/* Security Tabs */}
      <Tabs defaultValue="ip-whitelist" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ip-whitelist">IP Whitelist</TabsTrigger>
          <TabsTrigger value="two-factor">Two-Factor Auth</TabsTrigger>
          <TabsTrigger value="security-policy">Security Policy</TabsTrigger>
        </TabsList>

        {/* IP Whitelist */}
        <TabsContent value="ip-whitelist" className="space-y-6">
          <DashboardCard
            title="IP Whitelist"
            action={
              <Button onClick={() => setAddIpDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add IP
              </Button>
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <Spinner text="Loading IP whitelist..." />
                    </TableCell>
                  </TableRow>
                ) : ipWhitelist.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                      No IP addresses whitelisted.
                    </TableCell>
                  </TableRow>
                ) : (
                  ipWhitelist.map((ip) => (
                    <TableRow key={ip.id}>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{ip.ip_address}</code>
                      </TableCell>
                      <TableCell>{ip.description}</TableCell>
                      <TableCell>
                        {ip.last_used ? (
                          <span className="text-sm">
                            {formatDistanceToNow(new Date(ip.last_used), { addSuffix: true })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(ip.created_at), 'MMM d, yyyy')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteIp(ip.id)}
                          className="text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
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

        {/* Two-Factor Authentication */}
        <TabsContent value="two-factor" className="space-y-6">
          {twoFactorAuth && (
            <DashboardCard title="Two-Factor Authentication">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all user accounts
                    </p>
                  </div>
                  <Switch
                    checked={twoFactorAuth.enabled}
                    onCheckedChange={(checked) => handleUpdateTwoFactor('enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require for Admins</Label>
                    <p className="text-sm text-muted-foreground">
                      Mandatory 2FA for admin and superadmin accounts
                    </p>
                  </div>
                  <Switch
                    checked={twoFactorAuth.required_for_admins}
                    onCheckedChange={(checked) =>
                      handleUpdateTwoFactor('required_for_admins', checked)
                    }
                    disabled={!twoFactorAuth.enabled}
                  />
                </div>

                <div className="p-4 rounded-lg border border-border bg-card/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Backup Codes Available</p>
                      <p className="text-sm text-muted-foreground">
                        {twoFactorAuth.backup_codes_count} backup codes generated
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Regenerate
                    </Button>
                  </div>
                </div>
              </div>
            </DashboardCard>
          )}
        </TabsContent>

        {/* Security Policy */}
        <TabsContent value="security-policy" className="space-y-6">
          {securityPolicy && (
            <DashboardCard title="Security Policy">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="password_min_length">Minimum Password Length</Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    value={securityPolicy.password_min_length}
                    onChange={(e) =>
                      handleUpdateSecurityPolicy('password_min_length', parseInt(e.target.value))
                    }
                    className="mt-2"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Uppercase</Label>
                      <p className="text-sm text-muted-foreground">Password must contain uppercase letters</p>
                    </div>
                    <Switch
                      checked={securityPolicy.password_require_uppercase}
                      onCheckedChange={(checked) =>
                        handleUpdateSecurityPolicy('password_require_uppercase', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Lowercase</Label>
                      <p className="text-sm text-muted-foreground">Password must contain lowercase letters</p>
                    </div>
                    <Switch
                      checked={securityPolicy.password_require_lowercase}
                      onCheckedChange={(checked) =>
                        handleUpdateSecurityPolicy('password_require_lowercase', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Numbers</Label>
                      <p className="text-sm text-muted-foreground">Password must contain numbers</p>
                    </div>
                    <Switch
                      checked={securityPolicy.password_require_numbers}
                      onCheckedChange={(checked) =>
                        handleUpdateSecurityPolicy('password_require_numbers', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Symbols</Label>
                      <p className="text-sm text-muted-foreground">Password must contain special characters</p>
                    </div>
                    <Switch
                      checked={securityPolicy.password_require_symbols}
                      onCheckedChange={(checked) =>
                        handleUpdateSecurityPolicy('password_require_symbols', checked)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session_timeout"
                      type="number"
                      value={securityPolicy.session_timeout}
                      onChange={(e) =>
                        handleUpdateSecurityPolicy('session_timeout', parseInt(e.target.value))
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                    <Input
                      id="max_login_attempts"
                      type="number"
                      value={securityPolicy.max_login_attempts}
                      onChange={(e) =>
                        handleUpdateSecurityPolicy('max_login_attempts', parseInt(e.target.value))
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lockout_duration">Lockout Duration (minutes)</Label>
                    <Input
                      id="lockout_duration"
                      type="number"
                      value={securityPolicy.lockout_duration}
                      onChange={(e) =>
                        handleUpdateSecurityPolicy('lockout_duration', parseInt(e.target.value))
                      }
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </DashboardCard>
          )}
        </TabsContent>
      </Tabs>

      {/* Add IP Dialog */}
      <Dialog open={addIpDialogOpen} onOpenChange={setAddIpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add IP Address to Whitelist</DialogTitle>
            <DialogDescription>
              Add an IP address or CIDR range to the whitelist.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="ip_address">IP Address or CIDR</Label>
              <Input
                id="ip_address"
                value={newIpAddress}
                onChange={(e) => setNewIpAddress(e.target.value)}
                placeholder="e.g., 192.168.1.100 or 10.0.0.0/24"
              />
            </div>

            <div>
              <Label htmlFor="ip_description">Description</Label>
              <Input
                id="ip_description"
                value={newIpDescription}
                onChange={(e) => setNewIpDescription(e.target.value)}
                placeholder="e.g., Office Network"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddIpDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddIp} disabled={!newIpAddress}>
              Add IP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
