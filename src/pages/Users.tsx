import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users as UsersIcon,
  Search,
  Plus,
  UserCheck,
  Shield,
  Building2,
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
import api from '@/lib/api'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { usePagination } from '@/hooks/usePagination'
import Pagination from '@/components/Pagination'

export default function Users() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

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
      setTotalRecords(data.total || data.length || 0)
    } catch (err) {
      console.error('Failed to fetch users:', err)
      toast.error('Failed to load identity register.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, perPage, roleFilter, statusFilter, searchTerm])

  const stats = useMemo(() => {
    return {
      total: totalRecords || 0,
      active: users.filter(u => u.status === 'active').length,
      admins: users.filter(u => u.role === 'admin' || u.role === 'superadmin').length,
      organizers: users.filter(u => u.role === 'organizer').length
    }
  }, [users, totalRecords])

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">Manage user accounts and permissions</p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={() => navigate('/dashboard/users/add')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Agent / Admin
        </Button>
      </div>

      {/* Metrics */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-card/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Identities"
            value={stats.total.toString()}
            icon={<UsersIcon className="w-4 h-4" />}
            className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl"
          />
          <MetricCard
            title="Active Sessions"
            value={stats.active.toString()}
            icon={<UserCheck className="w-4 h-4" />}
            trend={{ value: 4, isPositive: true }}
            className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl"
          />
          <MetricCard
            title="Privileged Accounts"
            value={stats.admins.toString()}
            icon={<Shield className="w-4 h-4" />}
            className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl text-primary"
          />
          <MetricCard
            title="Verified Organizers"
            value={stats.organizers.toString()}
            icon={<Building2 className="w-4 h-4" />}
            className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <Spinner text="Loading users..." />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === 'active' ? 'default' : 'secondary'}
                      className={user.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {user.status || 'active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-8">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalRecords / perPage)}
          totalRecords={totalRecords}
          perPage={perPage}
          onPageChange={setCurrentPage}
          onPerPageChange={setPerPage}
        />
      </div>
    </div>
  )
}
