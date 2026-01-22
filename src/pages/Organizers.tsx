import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Search,
  Plus,
  UserPlus,
  Edit,
  Pause,
  Trash2,
  Eye,
  Calendar,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import api from '@/lib/api'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { usePagination } from '@/hooks/usePagination'
import { cn } from '@/lib/utils'

export default function Organizers() {
  const navigate = useNavigate()
  const [organizers, setOrganizers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const {
    currentPage,
    perPage,
    totalRecords,
    setCurrentPage,
    setPerPage,
    setTotalRecords
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
      const data = response.data.data || response.data
      const organizersList = Array.isArray(data) ? data : data.data || []
      
      // Fetch contacts for each organizer
      const organizersWithContacts = await Promise.all(
        organizersList.map(async (org: any) => {
          try {
            const contactsResponse = await api.get(`/organizers/${org.id}/contacts`)
            return {
              ...org,
              contacts: contactsResponse.data || []
            }
          } catch (err) {
            // If contacts fetch fails, just return organizer without contacts
            return { ...org, contacts: [] }
          }
        })
      )
      
      setOrganizers(organizersWithContacts)
      setTotalRecords(data.total || organizersList.length || 0)
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

  const filteredOrganizers = useMemo(() => {
    return organizers.filter(org => {
      const matchesSearch = org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.email?.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }, [organizers, searchTerm])

  const handleSuspend = (organizerId: number) => {
    navigate(`/dashboard/organizers/${organizerId}/suspend`)
  }

  const handleDelete = async (organizerId: number, organizerName: string) => {
    if (!confirm(`Are you sure you want to delete "${organizerName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await api.delete(`/organizers/${organizerId}`)
      toast.success('Organizer deleted successfully!')
      fetchOrganizers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete organizer')
    }
  }

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Organizers</h1>
        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={() => navigate('/dashboard/organizers/add')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Organizer
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ORGANIZATION</TableHead>
              <TableHead className="text-center">STATUS</TableHead>
              <TableHead className="text-center">EVENTS MANAGED</TableHead>
              <TableHead>CONTACTS</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <Spinner text="Loading organizers..." />
                </TableCell>
              </TableRow>
            ) : filteredOrganizers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                  No organizers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrganizers.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 bg-yellow-100">
                        <AvatarFallback className="bg-yellow-100 text-black font-semibold">
                          {org.name?.[0]?.toUpperCase() || 'O'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{org.name || 'Unnamed Organizer'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={org.status === 'active' ? 'default' : 'secondary'}
                      className={cn(
                        org.status === 'active' && 'bg-green-100 text-green-800 hover:bg-green-100',
                        org.status === 'suspended' && 'bg-red-100 text-red-800 hover:bg-red-100',
                        org.status === 'pending' && 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                      )}
                    >
                      {org.status || 'active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {org.events_count || org.events?.length || 0}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {org.contacts && org.contacts.length > 0 ? (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {org.contacts.map((contact: any) => {
                              const contactName = contact.name || contact.user?.name || contact.email || contact.user?.email || 'Unknown'
                              return (
                                <Badge
                                  key={contact.id || contact.user?.id}
                                  variant="secondary"
                                  className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-0"
                                >
                                  {contact.is_primary_contact && <Star className="w-3 h-3 mr-1 fill-current" />}
                                  {contactName}
                                  {!contact.is_primary_contact && (
                                    <UserPlus className="w-3 h-3 ml-1 text-orange-500" />
                                  )}
                                </Badge>
                              )
                            })}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-gray-300"
                            onClick={() => navigate(`/dashboard/organizers/${org.id}/contacts`)}
                          >
                            Manage Contacts
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-muted-foreground">No contacts</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-gray-300"
                            onClick={() => navigate(`/dashboard/organizers/${org.id}/contacts`)}
                          >
                            Add Contacts
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/dashboard/organizers/${org.id}/contacts`)}
                        title="Add Contact"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/dashboard/organizers/${org.id}/edit`)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleSuspend(org.id)}
                        title="Suspend"
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(org.id, org.name)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/dashboard/organizers/${org.id}`)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/dashboard/organizers/${org.id}/events`)}
                        title="View Events"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}