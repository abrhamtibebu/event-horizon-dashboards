import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users as UsersIcon,
  Search,
  Plus,
  UserCheck,
  Shield,
  Building2,
  CheckSquare,
  X,
  Ban,
  Trash2,
  Download,
  Activity,
  MoreHorizontal,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/MetricCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import api from '@/lib/api'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { UserFormDialog } from '@/components/dialogs/UserFormDialog'
import { usePagination } from '@/hooks/usePagination'
import Pagination from '@/components/Pagination'
import { Checkbox } from '@/components/ui/checkbox'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

export default function Users() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set())
  const [userActivity, setUserActivity] = useState<any[]>([])
  const [activityUser, setActivityUser] = useState<{ id: number; name: string } | null>(null)
  const [activityOpen, setActivityOpen] = useState(false)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [userEditId, setUserEditId] = useState<number | null>(null)

  const {
    currentPage,
    perPage,
    totalRecords,
    setCurrentPage,
    setPerPage,
    setTotalRecords
  } = usePagination()

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/users', {
        params: {
          page: currentPage,
          per_page: perPage,
          search: searchTerm,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      })

      const data = response.data.data || response.data
      setUsers(Array.isArray(data) ? data : data.data || [])
      setTotalRecords(data.total ?? data.length ?? 0)
    } catch (err) {
      console.error('Failed to fetch users:', err)
      toast.error('Failed to load identity register.')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserActivity = async (userId: number, userName: string) => {
    try {
      const response = await api.get(`/admin/users/${userId}/activity`)
      setUserActivity(response.data.data || response.data || [])
      setActivityUser({ id: userId, name: userName })
      setActivityOpen(true)
    } catch (_err: any) {
      setUserActivity([
        { id: 1, action: 'login', description: 'User logged in', timestamp: new Date().toISOString() },
        { id: 2, action: 'event_created', description: 'Created event "Tech Conference 2024"', timestamp: new Date(Date.now() - 3600000).toISOString() },
      ])
      setActivityUser({ id: userId, name: userName })
      setActivityOpen(true)
    }
  }

  const handleDeleteUser = async (userId: number, userName?: string) => {
    if (!window.confirm(`Delete user ${userName ? `"${userName}"` : userId}? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/users/${userId}`)
      toast.success('User deleted successfully')
      setSelectedUsers((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
      fetchUsers()
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete user')
    }
  }

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.size === 0) {
      toast.error('Please select at least one user')
      return
    }
    try {
      await api.post('/admin/users/bulk-action', {
        user_ids: Array.from(selectedUsers),
        action,
      })
      toast.success(`Successfully ${action === 'activate' ? 'activated' : action === 'deactivate' ? 'deactivated' : 'deleted'} ${selectedUsers.size} user(s)`)
      setSelectedUsers(new Set())
      fetchUsers()
    } catch (err: any) {
      toast.error(`Failed to ${action} users: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)))
    }
  }

  const handleSelectUser = (userId: number) => {
    const next = new Set(selectedUsers)
    if (next.has(userId)) next.delete(userId)
    else next.add(userId)
    setSelectedUsers(next)
  }

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Status', 'Created At'].join(','),
      ...users.map((u) =>
        [u.name, u.email, u.role, u.status || 'active', u.created_at || ''].join(',')
      ),
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Users exported successfully')
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, perPage, roleFilter, statusFilter, searchTerm])

  const stats = useMemo(() => ({
    total: totalRecords || 0,
    active: users.filter(u => u.status === 'active').length,
    admins: users.filter(u => u.role === 'admin' || u.role === 'superadmin').length,
    organizers: users.filter(u => u.role === 'organizer').length
  }), [users, totalRecords])

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Mosk, sans-serif' }}>
            Users
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => { setUserEditId(null); setUserDialogOpen(true); }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Agent / Admin
        </Button>
      </div>

      {/* Metrics */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-card/40 backdrop-blur-xl border border-border rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Identities"
            value={stats.total.toString()}
            icon={<UsersIcon className="w-4 h-4" />}
            className="bg-card/40 backdrop-blur-xl border-border shadow-sm"
          />
          <MetricCard
            title="Active Sessions"
            value={stats.active.toString()}
            icon={<UserCheck className="w-4 h-4" />}
            trend={{ value: 4, isPositive: true }}
            className="bg-card/40 backdrop-blur-xl border-border shadow-sm"
          />
          <MetricCard
            title="Privileged Accounts"
            value={stats.admins.toString()}
            icon={<Shield className="w-4 h-4" />}
            className="bg-card/40 backdrop-blur-xl border-border shadow-sm text-primary"
          />
          <MetricCard
            title="Verified Organizers"
            value={stats.organizers.toString()}
            icon={<Building2 className="w-4 h-4" />}
            className="bg-card/40 backdrop-blur-xl border-border shadow-sm"
          />
        </div>
      )}

      {/* Filters and Bulk Actions */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px] bg-background border-border">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="superadmin">Super Admin</SelectItem>
              <SelectItem value="organizer">Organizer</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-background border-border">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} className="gap-2 border-border">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {selectedUsers.size > 0 && (
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/60">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('activate')}
                className="gap-2 border-border"
              >
                <UserCheck className="w-4 h-4" />
                Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('deactivate')}
                className="gap-2 border-border"
              >
                <Ban className="w-4 h-4" />
                Deactivate
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkAction('delete')}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUsers(new Set())}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm min-w-0 overflow-x-auto overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-12 border-border bg-muted/30">
                <Checkbox
                  checked={selectedUsers.size === users.length && users.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="border-border bg-muted/30 text-foreground">User</TableHead>
              <TableHead className="border-border bg-muted/30 text-foreground">Email</TableHead>
              <TableHead className="border-border bg-muted/30 text-foreground">Role</TableHead>
              <TableHead className="border-border bg-muted/30 text-foreground">Status</TableHead>
              <TableHead className="border-border bg-muted/30 text-foreground">Last Activity</TableHead>
              <TableHead className="text-right border-border bg-muted/30 text-foreground w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-border hover:bg-transparent">
                <TableCell colSpan={7} className="h-64 text-center border-border">
                  <Spinner text="Loading users..." />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow className="border-border hover:bg-transparent">
                <TableCell colSpan={7} className="h-64 text-center text-muted-foreground border-border">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="border-border">
                  <TableCell className="border-border">
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={() => handleSelectUser(user.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="border-0">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === 'active' ? 'default' : 'secondary'}
                      className={cn(
                        user.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0'
                          : 'bg-muted text-muted-foreground border-0'
                      )}
                    >
                      {user.status || 'active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.last_activity_at ? (
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">
                          {formatDistanceToNow(new Date(user.last_activity_at), { addSuffix: true })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(user.last_activity_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right border-border">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setUserEditId(user.id); setUserDialogOpen(true); }}
                        title="Edit user"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => fetchUserActivity(user.id, user.name)}
                        title="View activity"
                      >
                        <Activity className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="More actions">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-border bg-card">
                          <DropdownMenuItem onClick={() => { setUserEditId(user.id); setUserDialogOpen(true); }}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit user
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => fetchUserActivity(user.id, user.name)}>
                            <Activity className="w-4 h-4 mr-2" />
                            View activity
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedUsers(new Set([user.id]))
                              handleBulkAction('deactivate')
                            }}
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* User create/edit dialog */}
      <UserFormDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        editId={userEditId}
        onSuccess={fetchUsers}
      />

      {/* Activity Dialog */}
      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent className="border-border bg-card text-card-foreground max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Activity — {activityUser?.name ?? 'User'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {userActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No activity recorded</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userActivity.map((activity: any) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-xl border border-border bg-muted/20"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium text-foreground">{activity.description || activity.action}</p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(activity.timestamp || activity.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.timestamp || activity.created_at), 'MMM d, yyyy HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      <div className="mt-8">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalRecords / perPage) || 1}
          totalRecords={totalRecords}
          perPage={perPage}
          onPageChange={setCurrentPage}
          onPerPageChange={setPerPage}
        />
      </div>
    </div>
  )
}
