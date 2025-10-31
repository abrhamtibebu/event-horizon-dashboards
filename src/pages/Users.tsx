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
  Plus,
  Shield,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  Phone,
  Edit,
  Trash2,
  Eye as ViewIcon,
  Power,
  PlayCircle,
  PauseCircle,
  UserPlus,
  Settings,
  Key,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Pagination from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Pagination hook
  const {
    currentPage,
    perPage,
    totalPages,
    totalRecords,
    setTotalPages,
    setTotalRecords,
    handlePageChange,
    handlePerPageChange,
    resetPagination
  } = usePagination({ defaultPerPage: 15, searchParamPrefix: 'users' });
  
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
        // Build query parameters for pagination and filtering
        const params = new URLSearchParams({
          page: currentPage.toString(),
          per_page: perPage.toString(),
        });
        
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        
        if (roleFilter !== 'all') {
          params.append('role', roleFilter);
        }
        
        if (statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        
        const res = await api.get(`/users?${params.toString()}`)
        
        // Handle paginated response
        if (res.data.data) {
          setUsers(res.data.data)
          setTotalPages(res.data.last_page || 1)
          setTotalRecords(res.data.total || 0)
        } else {
          // Fallback for non-paginated response
          setUsers(res.data)
          setTotalPages(1)
          setTotalRecords(res.data.length || 0)
        }
      } catch (err: any) {
        setError(
          'Failed to fetch users. This feature may not be implemented in the backend.'
        )
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [currentPage, perPage, searchTerm, roleFilter, statusFilter])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'organizer':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'usher':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Handle search and filter changes with pagination reset
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    resetPagination();
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    resetPagination();
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    resetPagination();
  };

  // Since we're now using server-side pagination, we don't need client-side filtering
  const filteredUsers = users;

  const userStats = {
    total: users.length,
    superadmins: users.filter((u) => u.role === 'superadmin').length,
    admins: users.filter((u) => u.role === 'admin').length,
    organizers: users.filter((u) => u.role === 'organizer').length,
    ushers: users.filter((u) => u.role === 'usher').length,
    active: users.filter((u) => u.status === 'active').length,
    inactive: users.filter((u) => u.status === 'inactive').length,
    suspended: users.filter((u) => u.status === 'suspended').length,

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
      toast.success('User added successfully!')
    } catch (err: any) {
      setAddError(err.response?.data?.error || 'Failed to add user')
      toast.error('Failed to add user')
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
      toast.success('User updated successfully!')
    } catch (err: any) {
      setEditError(err.response?.data?.error || 'Failed to update user')
      toast.error('Failed to update user')
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
      toast.success(`User status updated to ${status}`)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.status?.[0] || 'Failed to update user status'
      toast.error(errorMessage)
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
  const canManageUsers = isCurrentSuperAdmin || isCurrentAdmin;

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
      toast.error('Failed to reset password')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-2 sm:px-6 lg:px-12">
      {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
            <h1 className="text-4xl font-extrabold text-gray-900 drop-shadow-sm">User Management</h1>
            <p className="text-lg text-gray-600 mt-2">Manage users, roles, permissions, and access control</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg text-lg px-6 py-3 rounded-xl">
                <UserPlus className="w-5 h-5 mr-2" /> Add User
            </Button>
          </DialogTrigger>
            <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="text-xl font-bold">Add New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
              <Input
                name="name"
                    placeholder="Enter full name"
                value={addForm.name ?? ''}
                onChange={handleAddChange}
                required
              />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
              <Input
                name="email"
                type="email"
                    placeholder="Enter email address"
                value={addForm.email ?? ''}
                onChange={handleAddChange}
                required
              />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input
                  name="password"
                  type={showAddPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                  value={addForm.password ?? ''}
                  onChange={handleAddChange}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  onClick={() => setShowAddPassword((v) => !v)}
                >
                  {showAddPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm Password</label>
              <div className="relative">
                <Input
                  name="password_confirmation"
                  type={showAddPasswordConfirm ? 'text' : 'password'}
                      placeholder="Confirm password"
                  value={addForm.password_confirmation ?? ''}
                  onChange={handleAddChange}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  onClick={() => setShowAddPasswordConfirm((v) => !v)}
                >
                  {showAddPasswordConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
              <Select value={addForm.role} onValueChange={handleAddRole}>
                <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
                  <SelectItem value="usher">Usher</SelectItem>
                </SelectContent>
              </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone (Optional)</label>
              <Input
                name="phone"
                    placeholder="Enter phone number"
                value={addForm.phone ?? ''}
                onChange={handleAddChange}
              />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bio (Optional)</label>
              <Input
                name="bio"
                    placeholder="Enter bio"
                value={addForm.bio ?? ''}
                onChange={handleAddChange}
              />
                </div>
              {addError && (
                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{addError}</div>
              )}
              <DialogFooter>
                  <Button type="submit" disabled={addLoading} className="w-full">
                    {addLoading ? 'Adding User...' : 'Add User'}
                  </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-blue-200 text-center">
            <CardHeader>
              <CardTitle className="text-blue-600 text-lg font-semibold">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userStats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-purple-200 text-center">
            <CardHeader>
              <CardTitle className="text-purple-600 text-lg font-semibold">Administrators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userStats.admins + userStats.superadmins}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-green-200 text-center">
            <CardHeader>
              <CardTitle className="text-green-600 text-lg font-semibold">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userStats.active}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-orange-200 text-center">
            <CardHeader>
              <CardTitle className="text-orange-600 text-lg font-semibold">Organizers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userStats.organizers}</div>
            </CardContent>
          </Card>
      </div>

      {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 w-full mb-8">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search users..."
            value={searchTerm ?? ''}
            onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-12 w-full py-3 rounded-xl text-lg shadow-md"
          />
        </div>
          <div className="w-full sm:w-48">
        <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
              <SelectTrigger className="w-full py-3 rounded-xl text-lg shadow-md">
                <Filter className="w-5 h-5 mr-2" />
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="organizer">Organizer</SelectItem>
            <SelectItem value="usher">Usher</SelectItem>
          </SelectContent>
        </Select>
          </div>
          <div className="w-full sm:w-48">
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full py-3 rounded-xl text-lg shadow-md">
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
      </div>

      {/* Loading/Error States */}
        {loading && (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            <span className="ml-4 text-xl text-gray-500">Loading users...</span>
          </div>
        )}
        {error && <div className="text-center py-12 text-red-500 text-xl">{error}</div>}

        {/* Users Table View */}
      {!loading && !error && (
          <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-0 overflow-x-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 px-6 pt-6 pb-2">Users</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Join Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                    const showActions = canManageUsers && !isSuperAdmin(user)
                    const canEdit = showActions && (isCurrentSuperAdmin || !isAdmin(user))
                const canDelete = isCurrentSuperAdmin && user.id !== currentUser.id;
                    const canChangeStatus = showActions && (isCurrentSuperAdmin || !isAdmin(user))
                    
                return (
                      <tr key={user.id} className="hover:bg-blue-50/40 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-lg font-bold shadow-md">
                          {user.avatar ||
                            user.name
                              ?.split(' ')
                              .map((n: string) => n[0])
                              .join('')
                                  .toUpperCase() || 'U'}
                        </div>
                        <div>
                              <div className="font-semibold text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              {user.phone && (
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {user.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getRoleColor(user.role) + ' text-xs px-2 py-1 rounded-full'}>
                        {user.role}
                      </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                      {canChangeStatus ? (
                        <Select
                              value={user.status || 'active'}
                          onValueChange={(v) => handleStatusChange(user, v)}
                          disabled={statusLoading === user.id}
                        >
                              <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                            <Badge className={getStatusColor(user.status || 'active') + ' text-xs px-2 py-1 rounded-full'}>
                              {user.status || 'active'}
                        </Badge>
                      )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {user.created_at || user.createdAt || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-2">
                            {canEdit && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="icon" onClick={() => openEdit(user)} className="shadow-sm">
                                    <Edit className="w-5 h-5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit User</TooltipContent>
                              </Tooltip>
                            )}
                            {isCurrentSuperAdmin && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                                    size="icon" 
                                    onClick={() => setResetUserId(String(user.id))} 
                                    className="shadow-sm"
                                  >
                                    <Key className="w-5 h-5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reset Password</TooltipContent>
                              </Tooltip>
                            )}
                            {canDelete && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="icon" onClick={() => setDeleteUserId(user.id)} className="shadow-sm">
                                    <Trash2 className="w-5 h-5 text-red-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete User</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Pagination Component */}
        {!loading && !error && filteredUsers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            perPage={perPage}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
          />
        )}

        {filteredUsers.length === 0 && !loading && (
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Edit User</DialogTitle>
            </DialogHeader>
            {editForm && (
              <form onSubmit={handleEdit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    name="name"
                    placeholder="Enter full name"
                    value={editForm.name ?? ''}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="Enter email address"
                    value={editForm.email ?? ''}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={editForm.role} onValueChange={handleEditRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="organizer">Organizer</SelectItem>
                      <SelectItem value="usher">Usher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone (Optional)</label>
                  <Input
                    name="phone"
                    placeholder="Enter phone number"
                    value={editForm.phone ?? ''}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bio (Optional)</label>
                  <Input
                    name="bio"
                    placeholder="Enter bio"
                    value={editForm.bio ?? ''}
                    onChange={handleEditChange}
                  />
                </div>
                {editError && (
                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{editError}</div>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={editLoading} className="w-full">
                    {editLoading ? 'Saving Changes...' : 'Save Changes'}
                          </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Reset Password Modal */}
        <Dialog open={resetUserId !== null} onOpenChange={(open) => {
                            if (!open) {
                              setResetUserId(null)
                              setResetPassword('')
                              setResetPasswordConfirm('')
                              setResetError(null)
                            }
                          }}>
          <DialogContent className="max-w-md">
                              <DialogHeader>
              <DialogTitle className="text-xl font-bold">Reset Password</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={e => { e.preventDefault(); handleResetPassword(); }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                                <Input
                                  type="password"
                  placeholder="Enter new password"
                                  value={resetPassword ?? ''}
                                  onChange={e => setResetPassword(e.target.value)}
                                  required
                                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm New Password</label>
                                <Input
                                  type="password"
                  placeholder="Confirm new password"
                                  value={resetPasswordConfirm ?? ''}
                                  onChange={e => setResetPasswordConfirm(e.target.value)}
                                  required
                                />
              </div>
              {resetError && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{resetError}</div>
              )}
                                <DialogFooter>
                <Button type="submit" disabled={resetLoading} className="w-full">
                  {resetLoading ? 'Resetting Password...' : 'Reset Password'}
                                    </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>

        {/* Delete User Confirmation */}
        <AlertDialog open={deleteUserId !== null} onOpenChange={(open) => {
          if (!open) setDeleteUserId(null)
        }}>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                              </AlertDialogHeader>
                              <div>
              Are you sure you want to delete this user? This action cannot be undone.
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
                      </div>
    </TooltipProvider>
  )
}
