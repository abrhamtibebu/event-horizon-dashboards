import { useState, useEffect } from 'react'
import {
  Users as UsersIcon,
  Search,
  Filter,
  Mail,
  User,
  Pencil,
  Trash,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DashboardCard } from '@/components/DashboardCard'
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
import api from '@/lib/api'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/hooks/use-auth'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'usher',
    phone: '',
    bio: '',
  })
  const [editOpen, setEditOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState<string | null>(null)
  const { user: currentUser } = useAuth()
  const [showAddPassword, setShowAddPassword] = useState(false)
  const [showAddPasswordConfirm, setShowAddPasswordConfirm] = useState(false)
  const [searchParams] = useSearchParams()
  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('')
  const [resetError, setResetError] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setAddOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get('/users')
        setUsers(res.data)
      } catch (err: any) {
        setError(
          'Failed to fetch users. This feature may not be implemented in the backend.'
        )
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'organizer':
        return 'bg-blue-100 text-blue-800'
      case 'usher':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'suspended':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const userStats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    organizers: users.filter((u) => u.role === 'organizer').length,
    ushers: users.filter((u) => u.role === 'usher').length,
    active: users.filter((u) => u.status === 'active').length,
  }

  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value })
  }

  const handleAddRole = (value: string) => {
    setAddForm({ ...addForm, role: value })
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddLoading(true)
    setAddError(null)
    try {
      await api.post('/users', addForm)
      setAddOpen(false)
      setAddForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'usher',
        phone: '',
        bio: '',
      })
      // Refresh users
      setLoading(true)
      const res = await api.get('/users')
      setUsers(res.data)
      setLoading(false)
    } catch (err: any) {
      setAddError(err.response?.data?.error || 'Failed to add user')
    } finally {
      setAddLoading(false)
    }
  }

  const openEdit = (user: any) => {
    setEditForm({ ...user, password: '', password_confirmation: '' })
    setEditOpen(true)
    setEditError(null)
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }

  const handleEditRole = (value: string) => {
    setEditForm({ ...editForm, role: value })
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditLoading(true)
    setEditError(null)
    try {
      await api.put(`/users/${editForm.id}`, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        phone: editForm.phone,
        bio: editForm.bio,
      })
      setEditOpen(false)
      setEditForm(null)
      setLoading(true)
      const res = await api.get('/users')
      setUsers(res.data)
      setLoading(false)
    } catch (err: any) {
      setEditError(err.response?.data?.error || 'Failed to update user')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteUserId) return
    setDeleteLoading(true)
    try {
      await api.delete(`/users/${deleteUserId}`)
      setDeleteUserId(null)
      setLoading(true)
      const res = await api.get('/users')
      setUsers(res.data)
      setLoading(false)
      toast.success('User moved to trash!')
    } catch (err) {
      toast.error('Failed to delete user')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleStatusChange = async (user: any, status: string) => {
    setStatusLoading(user.id)
    try {
      await api.patch(`/users/${user.id}/status`, { status })
      setLoading(true)
      const res = await api.get('/users')
      setUsers(res.data)
      setLoading(false)
    } catch (err) {
      // Optionally show error
    } finally {
      setStatusLoading(null)
    }
  }

  // Helper to check if a user is super admin
  const isSuperAdmin = (u: any) => u.role === 'superadmin';
  // Helper to check if a user is admin (not super admin)
  const isAdmin = (u: any) => u.role === 'admin' && u.id !== 1
  // Helper to check if current user is super admin
  const isCurrentSuperAdmin = currentUser && currentUser.role === 'superadmin';
  // Helper to check if current user is admin
  const isCurrentAdmin = currentUser?.role === 'admin'

  const handleResetPassword = async () => {
    if (!resetUserId) return
    setResetLoading(true)
    setResetError(null)
    if (resetPassword !== resetPasswordConfirm) {
      setResetError('Passwords do not match')
      setResetLoading(false)
      return
    }
    try {
      await api.post(`/admin/users/${resetUserId}/reset-password`, {
        new_password: resetPassword,
        new_password_confirmation: resetPasswordConfirm,
      })
      toast.success('Password reset successfully!')
      setResetUserId(null)
      setResetPassword('')
      setResetPasswordConfirm('')
    } catch (err: any) {
      setResetError(err.response?.data?.error || 'Failed to reset password')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <User className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <Input
                name="name"
                placeholder="Name"
                value={addForm.name ?? ''}
                onChange={handleAddChange}
                required
              />
              <Input
                name="email"
                type="email"
                placeholder="Email"
                value={addForm.email ?? ''}
                onChange={handleAddChange}
                required
              />
              <div className="relative">
                <Input
                  name="password"
                  type={showAddPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={addForm.password ?? ''}
                  onChange={handleAddChange}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  tabIndex={-1}
                  onClick={() => setShowAddPassword((v) => !v)}
                >
                  {showAddPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="relative">
                <Input
                  name="password_confirmation"
                  type={showAddPasswordConfirm ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={addForm.password_confirmation ?? ''}
                  onChange={handleAddChange}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  tabIndex={-1}
                  onClick={() => setShowAddPasswordConfirm((v) => !v)}
                >
                  {showAddPasswordConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <Select value={addForm.role} onValueChange={handleAddRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
                  <SelectItem value="usher">Usher</SelectItem>
                </SelectContent>
              </Select>
              <Input
                name="phone"
                placeholder="Phone (optional)"
                value={addForm.phone ?? ''}
                onChange={handleAddChange}
              />
              <Input
                name="bio"
                placeholder="Bio (optional)"
                value={addForm.bio ?? ''}
                onChange={handleAddChange}
              />
              {addError && (
                <div className="text-red-500 text-sm">{addError}</div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={addLoading}>
                  {addLoading ? 'Adding...' : 'Add User'}
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <DashboardCard title="Total Users" className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {userStats.total}
          </div>
        </DashboardCard>
        <DashboardCard title="Admins" className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {userStats.admins}
          </div>
        </DashboardCard>
        <DashboardCard title="Organizers" className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {userStats.organizers}
          </div>
        </DashboardCard>
        <DashboardCard title="Ushers" className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {userStats.ushers}
          </div>
        </DashboardCard>
        <DashboardCard title="Active" className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {userStats.active}
          </div>
        </DashboardCard>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm ?? ''}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="organizer">Organizer</SelectItem>
            <SelectItem value="usher">Usher</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading/Error States */}
      {loading && <div className="text-center py-12">Loading users...</div>}
      {error && <div className="text-center py-12 text-red-500">{error}</div>}

      {/* Users Table */}
      {!loading && !error && (
        <DashboardCard title="Users">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Events Managed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const showActions = isCurrentAdmin && !isSuperAdmin(user)
                const canEdit =
                  showActions && (isCurrentSuperAdmin || !isAdmin(user))
                const canDelete = isCurrentSuperAdmin && user.id !== currentUser.id;
                const canChangeStatus =
                  showActions && (isCurrentSuperAdmin || !isAdmin(user))
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center font-bold text-gray-700">
                          {user.avatar ||
                            user.name
                              ?.split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold">{user.name}</div>
                          <div className="text-xs text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {canChangeStatus ? (
                        <Select
                          value={user.status}
                          onValueChange={(v) => handleStatusChange(user, v)}
                          disabled={statusLoading === user.id}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.created_at || user.createdAt}</TableCell>
                    <TableCell>{user.eventsManaged || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {(canEdit || isCurrentSuperAdmin) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(user)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {isCurrentSuperAdmin && (
                          <Dialog open={resetUserId === String(user.id)} onOpenChange={(open) => {
                            if (!open) {
                              setResetUserId(null)
                              setResetPassword('')
                              setResetPasswordConfirm('')
                              setResetError(null)
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setResetUserId(String(user.id))}>
                                Reset Password
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reset Password for {user.name}</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={e => { e.preventDefault(); handleResetPassword(); }} className="space-y-4">
                                <Input
                                  type="password"
                                  placeholder="New Password"
                                  value={resetPassword ?? ''}
                                  onChange={e => setResetPassword(e.target.value)}
                                  required
                                />
                                <Input
                                  type="password"
                                  placeholder="Confirm New Password"
                                  value={resetPasswordConfirm ?? ''}
                                  onChange={e => setResetPasswordConfirm(e.target.value)}
                                  required
                                />
                                {resetError && <div className="text-red-500 text-sm">{resetError}</div>}
                                <DialogFooter>
                                  <Button type="submit" disabled={resetLoading}>
                                    {resetLoading ? 'Resetting...' : 'Reset Password'}
                                  </Button>
                                  <DialogClose asChild>
                                    <Button type="button" variant="outline" onClick={() => setResetUserId(null)}>
                                      Cancel
                                    </Button>
                                  </DialogClose>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                        )}
                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteUserId(user.id)}
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                              </AlertDialogHeader>
                              <div>
                                Are you sure you want to delete this user?
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel asChild>
                                  <Button variant="outline">Cancel</Button>
                                </AlertDialogCancel>
                                <AlertDialogAction asChild>
                                  <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={deleteLoading}
                                  >
                                    {deleteLoading ? 'Deleting...' : 'Delete'}
                                  </Button>
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </DashboardCard>
      )}

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No users found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Edit User Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editForm && (
            <form onSubmit={handleEdit} className="space-y-4">
              <Input
                name="name"
                placeholder="Name"
                value={editForm.name ?? ''}
                onChange={handleEditChange}
                required
              />
              <Input
                name="email"
                type="email"
                placeholder="Email"
                value={editForm.email ?? ''}
                onChange={handleEditChange}
                required
              />
              <Select value={editForm.role} onValueChange={handleEditRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
                  <SelectItem value="usher">Usher</SelectItem>
                </SelectContent>
              </Select>
              <Input
                name="phone"
                placeholder="Phone (optional)"
                value={editForm.phone ?? ''}
                onChange={handleEditChange}
              />
              <Input
                name="bio"
                placeholder="Bio (optional)"
                value={editForm.bio ?? ''}
                onChange={handleEditChange}
              />
              {editError && (
                <div className="text-red-500 text-sm">{editError}</div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
