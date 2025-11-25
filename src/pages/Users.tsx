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
  Star,
  RefreshCw,
  MoreVertical,
  FileText,
  FileSpreadsheet,
} from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Spinner } from '@/components/ui/spinner'
import Pagination from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<string[]>([])
  
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
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false)
  const [viewUserId, setViewUserId] = useState<string | null>(null)
  const [viewUser, setViewUser] = useState<any>(null)

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
      case 'organizer_admin':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'organizer':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'usher':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-muted text-muted-foreground border-border'
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-muted text-muted-foreground border-border'
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
    organizerAdmins: users.filter((u) => u.role === 'organizer_admin').length,
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
      // Split name into first_name and last_name
      const nameParts = addForm.name.trim().split(/\s+/)
      const first_name = nameParts[0] || ''
      const last_name = nameParts.slice(1).join(' ') || ''
      
      // Prepare form data with required fields for backend
      const formData: any = {
        first_name,
        last_name,
        email: addForm.email,
        password: addForm.password,
        password_confirmation: addForm.password_confirmation,
        role: addForm.role,
        phone: addForm.phone || '',
        bio: addForm.bio || '',
        payment_methods: [{
          method: 'telebirr',
          account_number: '0000000000'
        }]
      }
      
      await api.post('/users', formData)
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
      setAddError(err.response?.data?.error || err.response?.data?.message || 'Failed to add user')
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
    if (resetPassword.length < 6) {
      setResetError('Password must be at least 6 characters')
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
      setResetError(null)
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to reset password'
      setResetError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setResetLoading(false)
    }
  }

  const handleViewUser = async (userId: string) => {
    try {
      const res = await api.get(`/users/${userId}`)
      setViewUser(res.data)
      setViewUserId(userId)
    } catch (err: any) {
      toast.error('Failed to load user details')
    }
  }

  const exportToPDF = () => {
    // Placeholder for PDF export
    toast.info('PDF export functionality coming soon')
  };

  const exportToExcel = () => {
    // Placeholder for Excel export
    toast.info('Excel export functionality coming soon')
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen w-full bg-background p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs 
        items={[
          { label: 'User Management', href: '/dashboard/users' },
          { label: 'Users List' }
        ]}
        className="mb-4"
      />

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-card rounded-lg flex items-center justify-center border border-border">
              <UsersIcon className="w-7 h-7 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Users List
                <Star className="w-5 h-5 text-muted-foreground" />
              </h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <RefreshCw className="w-3 h-3" />
                Auto-updates in 2 min
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-success hover:bg-success/90 text-white">
                  <UserPlus className="w-4 h-4 mr-2" />
                  + Add New User
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
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                        <SelectItem value="organizer_admin">Organizer Admin</SelectItem>
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
            <Button variant="ghost" size="icon" className="hover:bg-accent">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
              <SelectTrigger className="w-[140px] bg-background border-border">
                <SelectValue placeholder="All Staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="organizer_admin">Organizer Admin</SelectItem>
                <SelectItem value="organizer">Organizer</SelectItem>
                <SelectItem value="usher">Usher</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[120px] bg-background border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[120px] bg-background border-border">
                <SelectValue placeholder="Monthly" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="hover:bg-accent">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Search and Export */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search..."
                value={searchTerm ?? ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 bg-background border-border"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
              className="bg-background border-border hover:bg-accent"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
              className="bg-background border-border hover:bg-accent"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
        {loading && (
          <div className="flex justify-center items-center py-24">
            <Spinner size="lg" variant="primary" text="Loading users..." />
          </div>
        )}
        {error && <div className="text-center py-12 text-red-500 text-xl">{error}</div>}

        {/* Users Table View */}
      {!loading && !error && (
          <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 border-b border-border">
                    <TableHead className="font-semibold text-foreground text-xs uppercase py-4 w-12">
                      <Checkbox
                        checked={filteredUsers.length > 0 && filteredUsers.every(u => selected.includes(u.id))}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelected(filteredUsers.map(u => u.id))
                          } else {
                            setSelected([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase py-4">Name of User</TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase py-4">Role</TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase py-4">Date</TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase py-4">Email</TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase py-4">Phone Number</TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase py-4">Status</TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase py-4 w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    // Super admin can manage all users (including other super admins)
                    // Regular admin can manage non-super-admin users (including organizer_admin)
                    const isOrganizerAdmin = user.role === 'organizer_admin'
                    const showActions = canManageUsers && (isCurrentSuperAdmin || !isSuperAdmin(user))
                    const canEdit = showActions && (isCurrentSuperAdmin || (!isAdmin(user) && !isSuperAdmin(user)))
                    const canDelete = isCurrentSuperAdmin && user.id !== currentUser.id
                    const canChangeStatus = showActions && (isCurrentSuperAdmin || (!isAdmin(user) && !isSuperAdmin(user)))
                    const canResetPassword = showActions && (isCurrentSuperAdmin || (!isAdmin(user) && !isSuperAdmin(user)))
                    const canView = canManageUsers // All admins can view user details
                    
                    const statusColors = {
                      'active': 'bg-success/10 text-success border-success/30',
                      'inactive': 'bg-muted text-muted-foreground border-border',
                      'suspended': 'bg-destructive/10 text-destructive border-destructive/30',
                    };
                    
                    return (
                      <TableRow key={user.id} className="hover:bg-accent/50 transition-colors border-b border-border">
                        <TableCell className="py-4">
                          <Checkbox
                            checked={selected.includes(user.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelected([...selected, user.id])
                              } else {
                                setSelected(selected.filter(id => id !== user.id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-foreground text-sm">
                              {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">{user.name}</div>
                              <div className="text-xs text-muted-foreground">{user.role}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge className={`${getRoleColor(user.role)} text-xs px-3 py-1 rounded-full border`}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-sm text-foreground">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB') : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-sm text-foreground">{user.email}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-sm text-foreground">{user.phone || '-'}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          {canChangeStatus ? (
                            <Select
                              value={user.status || 'active'}
                              onValueChange={(v) => handleStatusChange(user, v)}
                              disabled={statusLoading === user.id}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={`${statusColors[user.status as keyof typeof statusColors] || 'bg-muted text-muted-foreground'} text-xs px-3 py-1 rounded-full border`}>
                              {user.status || 'active'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          {showActions ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                {canView && (
                                  <DropdownMenuItem
                                    onClick={() => handleViewUser(user.id)}
                                    className="cursor-pointer"
                                  >
                                    <ViewIcon className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                )}
                                {canEdit && (
                                  <>
                                    {canView && <DropdownMenuSeparator />}
                                    <DropdownMenuItem
                                      onClick={() => openEdit(user)}
                                      className="cursor-pointer"
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit User
                                    </DropdownMenuItem>
                                    {canResetPassword && (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setResetUserId(user.id)
                                          setResetPassword('')
                                          setResetPasswordConfirm('')
                                          setResetError(null)
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <Key className="w-4 h-4 mr-2" />
                                        Reset Password
                                      </DropdownMenuItem>
                                    )}
                                  </>
                                )}
                                {canDelete && (
                                  <>
                                    {(canView || canEdit) && <DropdownMenuSeparator />}
                                    <DropdownMenuItem
                                      onClick={() => setDeleteUserId(user.id)}
                                      className="cursor-pointer text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete User
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" disabled>
                              <MoreVertical className="w-4 h-4 opacity-50" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
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
            <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">
              No users found
            </h3>
            <p className="text-muted-foreground">
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
                      <SelectItem value="organizer_admin">Organizer Admin</SelectItem>
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
            setShowResetPassword(false)
            setShowResetPasswordConfirm(false)
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Reset Password</DialogTitle>
            </DialogHeader>
            <form onSubmit={e => { e.preventDefault(); handleResetPassword(); }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <div className="relative">
                  <Input
                    type={showResetPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min. 6 characters)"
                    value={resetPassword ?? ''}
                    onChange={e => setResetPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowResetPassword((v) => !v)}
                  >
                    {showResetPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm New Password</label>
                <div className="relative">
                  <Input
                    type={showResetPasswordConfirm ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={resetPasswordConfirm ?? ''}
                    onChange={e => setResetPasswordConfirm(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowResetPasswordConfirm((v) => !v)}
                  >
                    {showResetPasswordConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
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

        {/* View User Details Modal */}
        <Dialog open={viewUserId !== null} onOpenChange={(open) => {
          if (!open) {
            setViewUserId(null)
            setViewUser(null)
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">User Details</DialogTitle>
            </DialogHeader>
            {viewUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-foreground text-xl">
                    {viewUser.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{viewUser.name}</h3>
                    <p className="text-sm text-muted-foreground">{viewUser.email}</p>
                    <Badge className={`${getRoleColor(viewUser.role)} text-xs px-3 py-1 rounded-full border mt-2`}>
                      {viewUser.role}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                    <p className="text-sm font-medium">{viewUser.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge className={`${getStatusColor(viewUser.status || 'active')} text-xs px-3 py-1 rounded-full border`}>
                        {viewUser.status || 'active'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Joined Date</label>
                    <p className="text-sm font-medium">
                      {viewUser.created_at ? new Date(viewUser.created_at).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p className="text-sm font-medium">
                      {viewUser.updated_at ? new Date(viewUser.updated_at).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
                {viewUser.bio && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bio</label>
                    <p className="text-sm font-medium mt-1">{viewUser.bio}</p>
                  </div>
                )}
                {canEdit && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setViewUserId(null)
                        openEdit(viewUser)
                      }}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit User
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setViewUserId(null)
                        setResetUserId(viewUser.id)
                        setResetPassword('')
                        setResetPasswordConfirm('')
                        setResetError(null)
                      }}
                      className="flex-1"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Reset Password
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
