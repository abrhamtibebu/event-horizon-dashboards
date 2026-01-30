import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Users,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  CheckSquare,
  X,
  Lock,
  Unlock,
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
import api from '@/lib/api'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Role {
  id: number
  name: string
  display_name: string
  description: string
  permissions: string[]
  user_count: number
  is_system: boolean
  created_at: string
}

interface Permission {
  id: string
  name: string
  category: string
  description: string
}

const PERMISSION_CATEGORIES = [
  'events',
  'users',
  'tickets',
  'reports',
  'settings',
  'messages',
  'marketing',
  'vendors',
  'subscriptions',
  'admin',
]

export default function RolePermissions() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('')
  const [newRoleDescription, setNewRoleDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/roles')
      setRoles(response.data.data || response.data || [])
    } catch (err: any) {
      console.error('Failed to fetch roles:', err)
      // Use mock data for development
      setRoles(getMockRoles())
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/admin/permissions')
      setPermissions(response.data.data || response.data || [])
    } catch (err: any) {
      // Use mock data for development
      setPermissions(getMockPermissions())
    }
  }

  const getMockRoles = (): Role[] => {
    return [
      {
        id: 1,
        name: 'admin',
        display_name: 'Administrator',
        description: 'Full system access',
        permissions: ['*'],
        user_count: 5,
        is_system: true,
        created_at: new Date(Date.now() - 86400000 * 365).toISOString(),
      },
      {
        id: 2,
        name: 'event_manager',
        display_name: 'Event Manager',
        description: 'Manage events and attendees',
        permissions: ['events.view', 'events.create', 'events.update', 'attendees.manage'],
        user_count: 12,
        is_system: false,
        created_at: new Date(Date.now() - 86400000 * 180).toISOString(),
      },
    ]
  }

  const getMockPermissions = (): Permission[] => {
    return [
      { id: 'events.view', name: 'View Events', category: 'events', description: 'View event listings' },
      { id: 'events.create', name: 'Create Events', category: 'events', description: 'Create new events' },
      { id: 'events.update', name: 'Update Events', category: 'events', description: 'Update existing events' },
      { id: 'events.delete', name: 'Delete Events', category: 'events', description: 'Delete events' },
      { id: 'users.view', name: 'View Users', category: 'users', description: 'View user listings' },
      { id: 'users.create', name: 'Create Users', category: 'users', description: 'Create new users' },
      { id: 'users.update', name: 'Update Users', category: 'users', description: 'Update user information' },
      { id: 'tickets.manage', name: 'Manage Tickets', category: 'tickets', description: 'Manage ticket sales' },
      { id: 'reports.view', name: 'View Reports', category: 'reports', description: 'View analytics and reports' },
      { id: 'settings.manage', name: 'Manage Settings', category: 'settings', description: 'Manage system settings' },
    ]
  }

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  const handleCreateRole = async () => {
    try {
      await api.post('/admin/roles', {
        name: newRoleName,
        display_name: newRoleDisplayName,
        description: newRoleDescription,
        permissions: Array.from(selectedPermissions),
      })
      toast.success('Role created successfully')
      setCreateDialogOpen(false)
      resetForm()
      fetchRoles()
    } catch (err: any) {
      toast.error(`Failed to create role: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedRole) return

    try {
      await api.put(`/admin/roles/${selectedRole.id}`, {
        display_name: newRoleDisplayName,
        description: newRoleDescription,
        permissions: Array.from(selectedPermissions),
      })
      toast.success('Role updated successfully')
      setEditDialogOpen(false)
      resetForm()
      setSelectedRole(null)
      fetchRoles()
    } catch (err: any) {
      toast.error(`Failed to update role: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('Are you sure you want to delete this role? Users with this role will lose access.')) {
      return
    }

    try {
      await api.delete(`/admin/roles/${roleId}`)
      toast.success('Role deleted successfully')
      fetchRoles()
    } catch (err: any) {
      toast.error(`Failed to delete role: ${err.response?.data?.message || err.message}`)
    }
  }

  const resetForm = () => {
    setNewRoleName('')
    setNewRoleDisplayName('')
    setNewRoleDescription('')
    setSelectedPermissions(new Set())
  }

  const openEditDialog = (role: Role) => {
    setSelectedRole(role)
    setNewRoleDisplayName(role.display_name)
    setNewRoleDescription(role.description)
    setSelectedPermissions(new Set(role.permissions))
    setEditDialogOpen(true)
  }

  const togglePermission = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions)
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId)
    } else {
      newSelected.add(permissionId)
    }
    setSelectedPermissions(newSelected)
  }

  const selectAllInCategory = (category: string) => {
    const categoryPermissions = permissions.filter((p) => p.category === category).map((p) => p.id)
    const newSelected = new Set(selectedPermissions)
    const allSelected = categoryPermissions.every((p) => newSelected.has(p))

    if (allSelected) {
      categoryPermissions.forEach((p) => newSelected.delete(p))
    } else {
      categoryPermissions.forEach((p) => newSelected.add(p))
    }
    setSelectedPermissions(newSelected)
  }

  const getPermissionsByCategory = (category: string) => {
    return permissions.filter((p) => p.category === category)
  }

  const stats = {
    total: roles.length,
    system: roles.filter((r) => r.is_system).length,
    custom: roles.filter((r) => !r.is_system).length,
    total_users: roles.reduce((sum, r) => sum + r.user_count, 0),
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
              Roles & Permissions
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Role & Permissions Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage user roles and permissions.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Role
          </Button>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DashboardCard title="Total Roles">
          <p className="text-3xl font-bold">{stats.total}</p>
        </DashboardCard>
        <DashboardCard title="System Roles">
          <p className="text-3xl font-bold text-blue-500">{stats.system}</p>
        </DashboardCard>
        <DashboardCard title="Custom Roles">
          <p className="text-3xl font-bold text-purple-500">{stats.custom}</p>
        </DashboardCard>
        <DashboardCard title="Total Users">
          <p className="text-3xl font-bold">{stats.total_users}</p>
        </DashboardCard>
      </div>

      {/* Roles Table */}
      <DashboardCard
        title="Roles"
        action={
          <Button variant="outline" size="sm" onClick={fetchRoles} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <Spinner text="Loading roles..." />
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                  No roles found. Create your first role to get started.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{role.display_name}</span>
                      <span className="text-sm text-muted-foreground">{role.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{role.description}</span>
                  </TableCell>
                  <TableCell>
                    {role.permissions.includes('*') ? (
                      <Badge variant="destructive">All Permissions</Badge>
                    ) : (
                      <span className="text-sm">{role.permissions.length} permissions</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{role.user_count}</span>
                  </TableCell>
                  <TableCell>
                    {role.is_system ? (
                      <Badge variant="secondary">System</Badge>
                    ) : (
                      <Badge className="bg-purple-500">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(role)}
                        disabled={role.is_system && role.name === 'superadmin'}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={role.is_system}
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

      {/* Create/Edit Role Dialog */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false)
          setEditDialogOpen(false)
          resetForm()
          setSelectedRole(null)
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialogOpen ? 'Edit Role' : 'Create Role'}</DialogTitle>
            <DialogDescription>
              {editDialogOpen ? 'Update role permissions and details.' : 'Create a new role with custom permissions.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!editDialogOpen && (
              <div>
                <Label htmlFor="role_name">Role Name (Internal)</Label>
                <Input
                  id="role_name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  placeholder="e.g., event_manager"
                />
                <p className="text-sm text-muted-foreground mt-1">Lowercase, underscores only</p>
              </div>
            )}

            <div>
              <Label htmlFor="role_display_name">Display Name</Label>
              <Input
                id="role_display_name"
                value={newRoleDisplayName}
                onChange={(e) => setNewRoleDisplayName(e.target.value)}
                placeholder="e.g., Event Manager"
              />
            </div>

            <div>
              <Label htmlFor="role_description">Description</Label>
              <Input
                id="role_description"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                placeholder="Describe this role's purpose"
              />
            </div>

            <div>
              <Label>Permissions</Label>
              <div className="mt-2 space-y-4 max-h-96 overflow-y-auto p-4 border rounded-lg">
                {PERMISSION_CATEGORIES.map((category) => {
                  const categoryPermissions = getPermissionsByCategory(category)
                  if (categoryPermissions.length === 0) return null

                  const allSelected = categoryPermissions.every((p) => selectedPermissions.has(p.id))
                  const someSelected = categoryPermissions.some((p) => selectedPermissions.has(p.id))

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold capitalize">{category}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => selectAllInCategory(category)}
                          className="h-6 text-xs"
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                        {categoryPermissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={permission.id}
                              checked={selectedPermissions.has(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor={permission.id} className="text-sm font-normal cursor-pointer flex-1">
                              <div>
                                <span className="font-medium">{permission.name}</span>
                                <p className="text-xs text-muted-foreground">{permission.description}</p>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedPermissions.size} permission{selectedPermissions.size !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false)
                setEditDialogOpen(false)
                resetForm()
                setSelectedRole(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editDialogOpen ? handleUpdateRole : handleCreateRole}
              disabled={
                !newRoleDisplayName ||
                !newRoleDescription ||
                (!editDialogOpen && !newRoleName) ||
                selectedPermissions.size === 0
              }
            >
              {editDialogOpen ? 'Update' : 'Create'} Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
