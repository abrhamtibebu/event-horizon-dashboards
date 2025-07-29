import { useState, useEffect } from 'react'
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Power,
  Star,
  PlayCircle,
  PauseCircle,
  UserPlus,
  Eye,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DashboardCard } from '@/components/DashboardCard'
import { Link } from 'react-router-dom'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Organizers() {
  const [organizers, setOrganizers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { toast } = useToast()
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedOrganizer, setSelectedOrganizer] = useState<any>(null)
  const [organizerUsers, setOrganizerUsers] = useState<any[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [primaryContact, setPrimaryContact] = useState<string>('')
  const [assignLoading, setAssignLoading] = useState(false)
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editOrganizer, setEditOrganizer] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [editLoading, setEditLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteOrganizer, setDeleteOrganizer] = useState<any>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [contactsMap, setContactsMap] = useState<Record<string, any[]>>({})
  const [viewUsersDialogOpen, setViewUsersDialogOpen] = useState(false)
  const [viewEventsDialogOpen, setViewEventsDialogOpen] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState<any[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [eventsCountMap, setEventsCountMap] = useState<Record<string, number | undefined>>({});
  const { user: currentUser } = useAuth()
  const isCurrentSuperAdmin = currentUser && currentUser.role === 'superadmin';
  const canDelete = isCurrentSuperAdmin;

  useEffect(() => {
    const fetchOrganizers = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get('/organizers')
        setOrganizers(res.data)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch organizers')
      } finally {
        setLoading(false)
      }
    }
    fetchOrganizers()
  }, [])

  useEffect(() => {
    if (assignDialogOpen) {
      api
        .get('/users')
        .then((res) => {
          setOrganizerUsers(res.data.filter((u: any) => u.role === 'organizer'))
        })
        .catch(() => setOrganizerUsers([]))
    }
  }, [assignDialogOpen])

  useEffect(() => {
    if (!loading && organizers.length > 0) {
      organizers.forEach((org) => {
        api.get(`/organizers/${org.id}/contacts`).then((res) => {
          setContactsMap((prev) => ({ ...prev, [org.id]: res.data }))
        })
        // Fetch events count for each organizer
        api.get(`/admin/organizers/${org.id}/events`).then((res) => {
          setEventsCountMap((prev) => ({ ...prev, [org.id]: Array.isArray(res.data) ? res.data.length : 0 }))
        }).catch(() => {
          setEventsCountMap((prev) => ({ ...prev, [org.id]: 0 }))
        })
      })
    }
  }, [loading, organizers])

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

  const filteredOrganizers = organizers.filter((organizer) => {
    const matchesSearch =
      organizer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      organizer.contactPerson
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      organizer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' || organizer.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const organizerStats = {
    total: organizers.length,
    active: organizers.filter((o) => o.status === 'active').length,
    inactive: organizers.filter((o) => o.status === 'inactive').length,
    suspended: organizers.filter((o) => o.status === 'suspended').length,
    totalEvents: organizers.reduce((sum, o) => sum + (o.eventsManaged || 0), 0),
  }

  // Calculate total events from eventsCountMap
  const totalEvents = Object.values(eventsCountMap).reduce((sum, count) => sum + (count || 0), 0);

  const openAssignDialog = (organizer: any) => {
    setSelectedOrganizer(organizer)
    setAssignDialogOpen(true)
    setSelectedContacts([])
    setPrimaryContact('')
  }

  const handleAssignContacts = async () => {
    if (!selectedOrganizer || selectedContacts.length === 0 || !primaryContact)
      return
    setAssignLoading(true)
    try {
      await api.post(`/organizers/${selectedOrganizer.id}/contacts`, {
        user_ids: selectedContacts,
        primary_contact_id: primaryContact,
      })
      toast({ title: 'Contacts assigned successfully!' })
      setAssignDialogOpen(false)
      // Optionally refresh organizers or contacts here
    } catch (err: any) {
      toast({
        title: 'Failed to assign contacts',
        description: err.response?.data?.error || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setAssignLoading(false)
    }
  }

  const handleSuspend = async (organizer: any) => {
    setStatusLoadingId(organizer.id)
    try {
      const res = await api.post(`/organizers/${organizer.id}/suspend`)
      toast({ title: 'Organizer suspended successfully!' })
      // Update local state instead of refetching
      setOrganizers(
        organizers.map((o) => (o.id === organizer.id ? res.data.organizer : o))
      )
    } catch (err: any) {
      toast({
        title: 'Failed to suspend organizer',
        description: err.response?.data?.error || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setStatusLoadingId(null)
    }
  }

  const handleActivate = async (organizer: any) => {
    setStatusLoadingId(organizer.id)
    try {
      const res = await api.post(`/organizers/${organizer.id}/activate`)
      toast({ title: 'Organizer activated successfully!' })
      // Update local state instead of refetching
      setOrganizers(
        organizers.map((o) => (o.id === organizer.id ? res.data.organizer : o))
      )
    } catch (err: any) {
      toast({
        title: 'Failed to activate organizer',
        description: err.response?.data?.error || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setStatusLoadingId(null)
    }
  }

  const openEditDialog = (organizer: any) => {
    setEditOrganizer(organizer)
    setEditForm({
      name: organizer.name || '',
      email: organizer.email || '',
      phone_number: organizer.phone_number || '',
      location: organizer.location || '',
      tin_number: organizer.tin_number || '',
    })
    setEditDialogOpen(true)
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }

  const handleEditSubmit = async () => {
    if (!editOrganizer) return
    setEditLoading(true)
    try {
      // Always use the admin endpoint for editing as admin/superadmin
      await api.put(`/organizers/${editOrganizer.id}`, editForm)
      toast({ title: 'Organizer updated successfully!' })
      setEditDialogOpen(false)
      // Refresh organizers
      const res = await api.get('/organizers')
      setOrganizers(res.data)
    } catch (err: any) {
      toast({
        title: 'Failed to update organizer',
        description: err.response?.data?.error || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setEditLoading(false)
    }
  }

  const openDeleteDialog = (organizer: any) => {
    setDeleteOrganizer(organizer)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteOrganizer) return
    setDeleteLoading(true)
    try {
      await api.delete(`/organizers/${deleteOrganizer.id}`)
      toast({ title: 'Organizer moved to trash!' })
      setDeleteDialogOpen(false)
      setDeleteOrganizer(null)
      setLoading(true)
      const res = await api.get('/organizers')
      setOrganizers(res.data)
      setLoading(false)
    } catch (err) {
      toast({ title: 'Failed to delete organizer', variant: 'destructive' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleRemoveContact = async (organizerId: string, userId: string) => {
    try {
      await api.delete(`/organizers/${organizerId}/contacts/${userId}`)
      toast({ title: 'Contact removed successfully!' })
      // Refresh contacts for this organizer
      const res = await api.get(`/organizers/${organizerId}/contacts`)
      setContactsMap((prev) => ({ ...prev, [organizerId]: res.data }))
    } catch (err: any) {
      toast({
        title: 'Failed to remove contact',
        description: err.response?.data?.error || 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  const handleSetPrimary = async (organizerId: string, userId: string) => {
    try {
      await api.post(`/organizers/${organizerId}/contacts/${userId}/primary`)
      toast({ title: 'Primary contact set successfully!' })
      // Refresh contacts for this organizer
      const res = await api.get(`/organizers/${organizerId}/contacts`)
      setContactsMap((prev) => ({ ...prev, [organizerId]: res.data }))
    } catch (err: any) {
      toast({
        title: 'Failed to set primary contact',
        description: err.response?.data?.error || 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  const openViewUsersDialog = (organizer: any) => {
    setSelectedOrganizer(organizer)
    setViewUsersDialogOpen(true)
  }

  const openViewEventsDialog = async (organizer: any) => {
    setViewEventsDialogOpen(true)
    setEventsLoading(true)
    setEventsError(null)
    try {
      const res = await api.get(`/admin/organizers/${organizer.id}/events`)
      setSelectedEvents(res.data)
    } catch (err: any) {
      setEventsError('Failed to fetch events for this organizer.')
      setSelectedEvents([])
    } finally {
      setEventsLoading(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-2 sm:px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 drop-shadow-sm">Organizer Management</h1>
            <p className="text-lg text-gray-600 mt-2">Manage event organizers, contacts, and permissions</p>
          </div>
          <Link to="/dashboard/organizers/add">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg text-lg px-6 py-3 rounded-xl">
              <Plus className="w-5 h-5 mr-2" /> Add Organizer
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-blue-200 text-center">
            <CardHeader>
              <CardTitle className="text-blue-600 text-lg font-semibold">Total Organizers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{organizerStats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-green-200 text-center">
            <CardHeader>
              <CardTitle className="text-green-600 text-lg font-semibold">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{organizerStats.active}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 text-center">
            <CardHeader>
              <CardTitle className="text-gray-600 text-lg font-semibold">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{organizerStats.inactive}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-red-200 text-center">
            <CardHeader>
              <CardTitle className="text-red-600 text-lg font-semibold">Suspended</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{organizerStats.suspended}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-purple-200 text-center">
            <CardHeader>
              <CardTitle className="text-purple-600 text-lg font-semibold">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalEvents}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 w-full mb-8">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search organizers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 w-full py-3 rounded-xl text-lg shadow-md"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full py-3 rounded-xl text-lg shadow-md">
                <Filter className="w-5 h-5 mr-2" />
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
            <span className="ml-4 text-xl text-gray-500">Loading organizers...</span>
          </div>
        )}
        {error && <div className="text-center py-12 text-red-500 text-xl">{error}</div>}

        {/* Organizer Table View */}
        {!loading && !error && (
          <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-0 overflow-x-auto mt-8">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 px-6 pt-6 pb-2">Organizers</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Events Managed</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contacts</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 divide-y divide-gray-100">
                  {filteredOrganizers.map((organizer) => (
                    <tr key={organizer.id} className="hover:bg-blue-50/40 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-lg font-bold shadow-md">
                            {organizer.name?.[0] || <Users className="w-6 h-6" />}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{organizer.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(organizer.status) + ' text-xs px-2 py-1 rounded-full'}>{organizer.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {eventsCountMap[organizer.id] === undefined ? (
                          <span className="inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin align-middle" />
                        ) : (
                          eventsCountMap[organizer.id]
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contactsMap[organizer.id]?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {contactsMap[organizer.id].map((contact: any) => (
                              <span key={contact.id} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${contact.is_primary_contact ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-gray-100 text-gray-700'}`}>
                                {contact.name} <span className="text-gray-400">({contact.email})</span>
                                {contact.is_primary_contact && <Star className="w-3 h-3 text-purple-500 ml-1" />}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">No contacts</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => openAssignDialog(organizer)} className="shadow-sm">
                                <UserPlus className="w-5 h-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Assign Contacts</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => openEditDialog(organizer)} className="shadow-sm">
                                <Edit className="w-5 h-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Organizer</TooltipContent>
                          </Tooltip>
                          {canDelete && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={() => openDeleteDialog(organizer)} className="shadow-sm">
                                  <Trash2 className="w-5 h-5 text-red-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete Organizer</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => openViewUsersDialog(organizer)} className="shadow-sm">
                                <Eye className="w-5 h-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Users</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => openViewEventsDialog(organizer)} className="shadow-sm">
                                <Calendar className="w-5 h-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Events</TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Assign Contacts Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Assign Contacts to {selectedOrganizer?.name}
              </DialogTitle>
              <DialogDescription>
                Select users with the organizer role and choose a primary
                contact.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Label>Contacts</Label>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                {organizerUsers.map((user) => (
                  <label key={user.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked)
                          setSelectedContacts([...selectedContacts, user.id])
                        else
                          setSelectedContacts(
                            selectedContacts.filter((id) => id !== user.id)
                          )
                      }}
                    />
                    <span>
                      {user.name} ({user.email})
                    </span>
                  </label>
                ))}
              </div>
              <Label>Primary Contact</Label>
              <div className="flex flex-col gap-2">
                {selectedContacts.map((id) => {
                  const user = organizerUsers.find((u) => u.id === id)
                  if (!user) return null
                  return (
                    <label key={id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="primaryContact"
                        checked={primaryContact === id}
                        onChange={() => setPrimaryContact(id)}
                      />
                      <span>
                        {user.name} ({user.email})
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAssignContacts}
                disabled={
                  assignLoading ||
                  !primaryContact ||
                  selectedContacts.length === 0
                }
              >
                {assignLoading ? 'Assigning...' : 'Assign Contacts'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Organizer Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Organizer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Label>Name</Label>
              <Input
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
              />
              <Label>Email</Label>
              <Input
                name="email"
                value={editForm.email}
                onChange={handleEditChange}
              />
              <Label>Phone Number</Label>
              <Input
                name="phone_number"
                value={editForm.phone_number}
                onChange={handleEditChange}
              />
              <Label>Location</Label>
              <Input
                name="location"
                value={editForm.location}
                onChange={handleEditChange}
              />
              <Label>TIN Number</Label>
              <Input
                name="tin_number"
                value={editForm.tin_number}
                onChange={handleEditChange}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleEditSubmit} disabled={editLoading}>
                {editLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Organizer Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Organizer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete organizer{' '}
                {deleteOrganizer?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Users Dialog */}
        <Dialog
          open={viewUsersDialogOpen}
          onOpenChange={setViewUsersDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contacts for {selectedOrganizer?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedOrganizer &&
              contactsMap[selectedOrganizer.id]?.length > 0 ? (
                contactsMap[selectedOrganizer.id].map((contact: any) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-2 border rounded-md"
                  >
                    <div>
                      <p className="font-semibold">{contact.name}</p>
                      <p className="text-sm text-gray-500">{contact.email}</p>
                    </div>
                    {contact.is_primary_contact && (
                      <Badge variant="secondary">Primary</Badge>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No contacts assigned.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewUsersDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Events Dialog */}
        <Dialog
          open={viewEventsDialogOpen}
          onOpenChange={setViewEventsDialogOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Events for Organizer</DialogTitle>
            </DialogHeader>
            {eventsLoading ? (
              <div className="py-8 text-center">Loading events...</div>
            ) : eventsError ? (
              <div className="py-8 text-center text-red-500">{eventsError}</div>
            ) : selectedEvents.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No events found for this organizer.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedEvents.map((event: any) => (
                      <TableRow key={event.id}>
                        <TableCell>{event.name}</TableCell>
                        <TableCell>{event.event_type?.name || '-'}</TableCell>
                        <TableCell>
                          {event.event_category?.name || '-'}
                        </TableCell>
                        <TableCell>{event.status || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <DialogClose asChild>
              <Button variant="outline" className="mt-4 w-full">
                Close
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
