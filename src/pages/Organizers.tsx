import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Search,
  Plus,
  UserPlus,
  Edit,
  Pause,
  Play,
  Trash2,
  Eye,
  Calendar,
  Star,
  Download,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/MetricCard'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import api from '@/lib/api'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { usePagination } from '@/hooks/usePagination'
import Pagination from '@/components/Pagination'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function Organizers() {
  const navigate = useNavigate()
  const [organizers, setOrganizers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteDialog, setDeleteDialog] = useState<{ id: number; name: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const {
    currentPage,
    perPage,
    totalRecords,
    setCurrentPage,
    setPerPage,
    setTotalRecords,
  } = usePagination()

  const fetchOrganizers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/organizers', {
        params: {
          page: currentPage,
          per_page: perPage,
          search: searchTerm,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      })
      const data = response.data.data ?? response.data
      const organizersList = Array.isArray(data) ? data : data.data ?? []

      const organizersWithContacts = await Promise.all(
        organizersList.map(async (org: any) => {
          try {
            const contactsResponse = await api.get(`/organizers/${org.id}/contacts`)
            return { ...org, contacts: contactsResponse.data ?? [] }
          } catch {
            return { ...org, contacts: [] }
          }
        })
      )

      setOrganizers(organizersWithContacts)
      const total = response.data?.total ?? organizersList.length
      setTotalRecords(typeof total === 'number' ? total : organizersList.length)
    } catch (err) {
      console.error('Failed to fetch organizers:', err)
      toast.error('Failed to load organizers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizers()
  }, [currentPage, perPage, statusFilter, searchTerm])

  const handleDelete = async () => {
    if (!deleteDialog) return
    try {
      setActionLoading(true)
      await api.delete(`/organizers/${deleteDialog.id}`)
      toast.success('Organizer deleted successfully.')
      setDeleteDialog(null)
      fetchOrganizers()
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Failed to delete organizer.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleActivate = async (organizerId: number) => {
    try {
      setActionLoading(true)
      await api.post(`/organizers/${organizerId}/activate`)
      toast.success('Organizer activated.')
      fetchOrganizers()
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Failed to activate organizer.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Status', 'Events', 'Contacts', 'Created At']
    const rows = organizers.map((org) => [
      org.name ?? '',
      org.email ?? '',
      org.status ?? 'active',
      String(org.events_count ?? org.events?.length ?? 0),
      String(org.contacts?.length ?? 0),
      org.created_at ? format(new Date(org.created_at), 'yyyy-MM-dd') : '',
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `organizers-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Organizers exported.')
  }

  const stats = useMemo(
    () => ({
      total: totalRecords ?? 0,
      active: organizers.filter((o) => o.status === 'active').length,
      suspended: organizers.filter((o) => o.status === 'suspended').length,
      pending: organizers.filter((o) => o.status === 'pending').length,
    }),
    [organizers, totalRecords]
  )

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0'
      case 'suspended':
        return 'bg-destructive/15 text-destructive border-0'
      case 'pending':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0'
      default:
        return 'bg-muted text-muted-foreground border-0'
    }
  }

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Mosk, sans-serif' }}>
            Organizers
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage organizer accounts and contacts
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => navigate('/dashboard/organizers/add')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Organizer
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
            title="Total Organizers"
            value={stats.total.toString()}
            icon={<Building2 className="w-4 h-4" />}
            className="bg-card/40 backdrop-blur-xl border-border shadow-sm"
          />
          <MetricCard
            title="Active"
            value={stats.active.toString()}
            icon={<Building2 className="w-4 h-4" />}
            className="bg-card/40 backdrop-blur-xl border-border shadow-sm"
          />
          <MetricCard
            title="Suspended"
            value={stats.suspended.toString()}
            icon={<Pause className="w-4 h-4" />}
            className="bg-card/40 backdrop-blur-xl border-border shadow-sm"
          />
          <MetricCard
            title="Pending"
            value={stats.pending.toString()}
            icon={<Building2 className="w-4 h-4" />}
            className="bg-card/40 backdrop-blur-xl border-border shadow-sm"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-background border-border">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleExport} className="gap-2 border-border">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm min-w-0 overflow-x-auto overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="border-border bg-muted/30 text-foreground">Organization</TableHead>
              <TableHead className="border-border bg-muted/30 text-foreground text-center">Status</TableHead>
              <TableHead className="border-border bg-muted/30 text-foreground text-center">Events</TableHead>
              <TableHead className="border-border bg-muted/30 text-foreground">Contacts</TableHead>
              <TableHead className="text-right border-border bg-muted/30 text-foreground w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-border hover:bg-transparent">
                <TableCell colSpan={5} className="h-64 text-center border-border">
                  <Spinner text="Loading organizers..." />
                </TableCell>
              </TableRow>
            ) : organizers.length === 0 ? (
              <TableRow className="border-border hover:bg-transparent">
                <TableCell colSpan={5} className="h-64 text-center text-muted-foreground border-border">
                  No organizers found.
                </TableCell>
              </TableRow>
            ) : (
              organizers.map((org) => (
                <TableRow key={org.id} className="border-border">
                  <TableCell className="border-border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-lg bg-primary/15 border border-border">
                        <AvatarFallback className="rounded-lg bg-primary/15 text-primary font-semibold text-sm">
                          {org.name?.[0]?.toUpperCase() ?? 'O'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium text-foreground">{org.name ?? 'Unnamed Organizer'}</span>
                        {org.email && (
                          <span className="block text-xs text-muted-foreground">{org.email}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center border-border">
                    <Badge variant="secondary" className={cn('border-0', getStatusBadgeClass(org.status ?? 'active'))}>
                      {org.status ?? 'active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center border-border text-foreground tabular-nums">
                    {org.events_count ?? org.events?.length ?? 0}
                  </TableCell>
                  <TableCell className="border-border">
                    <div className="space-y-2">
                      {org.contacts?.length > 0 ? (
                        <>
                          <div className="flex flex-wrap gap-1.5">
                            {org.contacts.slice(0, 3).map((contact: any) => {
                              const contactName =
                                contact.name ?? contact.user?.name ?? contact.email ?? contact.user?.email ?? 'Unknown'
                              const key = contact.id ?? contact.user?.id ?? contactName
                              return (
                                <Badge
                                  key={key}
                                  variant="secondary"
                                  className="border-0 bg-primary/10 text-primary text-xs font-normal"
                                >
                                  {contact.is_primary_contact && <Star className="w-3 h-3 mr-1 fill-current shrink-0" />}
                                  <span className="truncate max-w-[100px]">{contactName}</span>
                                </Badge>
                              )
                            })}
                            {org.contacts.length > 3 && (
                              <Badge variant="secondary" className="border-0 bg-muted text-muted-foreground">
                                +{org.contacts.length - 3}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-border"
                            onClick={() => navigate(`/dashboard/organizers/${org.id}/contacts`)}
                          >
                            Manage Contacts
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-border"
                          onClick={() => navigate(`/dashboard/organizers/${org.id}/contacts`)}
                        >
                          Add Contacts
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right border-border">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/dashboard/organizers/${org.id}`)}
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/dashboard/organizers/${org.id}/contacts`)}
                        title="Contacts"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/dashboard/organizers/${org.id}/edit`)}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/dashboard/organizers/${org.id}`)}
                        title="View events (profile)"
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                      {org.status === 'suspended' ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                          onClick={() => handleActivate(org.id)}
                          disabled={actionLoading}
                          title="Activate"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                          onClick={() => navigate(`/dashboard/organizers/${org.id}/suspend`)}
                          title="Suspend"
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="More actions">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-border bg-card">
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/organizers/${org.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/organizers/${org.id}/edit`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/organizers/${org.id}`)}>
                            <Calendar className="w-4 h-4 mr-2" />
                            View events
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/organizers/${org.id}/contacts`)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Manage contacts
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {org.status === 'suspended' ? (
                            <DropdownMenuItem
                              className="text-emerald-600 dark:text-emerald-400 focus:text-emerald-600 dark:focus:text-emerald-400"
                              onClick={() => handleActivate(org.id)}
                              disabled={actionLoading}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-amber-600 dark:text-amber-400 focus:text-amber-600 dark:focus:text-amber-400"
                              onClick={() => navigate(`/dashboard/organizers/${org.id}/suspend`)}
                            >
                              <Pause className="w-4 h-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteDialog({ id: org.id, name: org.name })}
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

      {/* Pagination */}
      <div className="mt-8">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.max(1, Math.ceil(totalRecords / perPage))}
          totalRecords={totalRecords}
          perPage={perPage}
          onPageChange={setCurrentPage}
          onPerPageChange={setPerPage}
        />
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete organizer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
