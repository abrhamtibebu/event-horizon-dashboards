import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Star, Trash2, ArrowLeft, Pencil, Eye, X, Edit } from 'lucide-react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'

export default function OrganizerProfile() {
  const { organizerId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [organizer, setOrganizer] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createImagePreview, setCreateImagePreview] = useState<string | null>(
    null
  )
  const createImageInputRef = useRef<HTMLInputElement>(null)
  const [createForm, setCreateForm] = useState<any>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    max_guests: '',
    registration_start_date: '',
    registration_end_date: '',
    event_type_id: '',
    event_category_id: '',
    event_image: null,
    guest_types: '', // comma separated
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editOrganizerDialogOpen, setEditOrganizerDialogOpen] = useState(false)
  const [editOrganizerForm, setEditOrganizerForm] = useState<any>(null)
  const [editOrganizerLoading, setEditOrganizerLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const orgRes = await api.get(`/organizers`)
        const org = orgRes.data.find(
          (o: any) => String(o.id) === String(organizerId)
        )
        setOrganizer(org)
        const contactsRes = await api.get(`/organizers/${organizerId}/contacts`)
        setContacts(contactsRes.data)
        const logsRes = await api.get(
          `/audit-logs?target_type=Organizer&target_id=${organizerId}`
        )
        setAuditLogs(logsRes.data.data || [])

        if (user?.role === 'admin') {
          const eventsRes = await api.get(
            `/admin/organizers/${organizerId}/events`
          )
          setEvents(eventsRes.data)
        } else {
          // Organizer-specific logic can go here if needed in the future
          setEvents([]) // Or fetch organizer-specific events if an endpoint exists
        }
      } catch (err) {
        toast.error('Failed to load organizer details')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [organizerId, user])

  const handleRemoveContact = async (userId: string) => {
    try {
      await api.delete(`/organizers/${organizerId}/contacts/${userId}`)
      toast.success('Contact removed successfully!')
      const contactsRes = await api.get(`/organizers/${organizerId}/contacts`)
      setContacts(contactsRes.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to remove contact')
    }
  }

  const handleSetPrimary = async (userId: string) => {
    try {
      await api.post(`/organizers/${organizerId}/contacts/${userId}/primary`)
      toast.success('Primary contact set successfully!')
      const contactsRes = await api.get(`/organizers/${organizerId}/contacts`)
      setContacts(contactsRes.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to set primary contact')
    }
  }

  const handleCreateInput = (field: string, value: any) => {
    setCreateForm((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleCreateFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCreateForm((prev: any) => ({ ...prev, event_image: file }))
      const reader = new FileReader()
      reader.onloadend = () => setCreateImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveCreateImage = () => {
    setCreateForm((prev: any) => ({ ...prev, event_image: null }))
    setCreateImagePreview(null)
    if (createImageInputRef.current) {
      createImageInputRef.current.value = ''
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    try {
      let payload
      let headers = {}
      const guestTypesArr = createForm.guest_types
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
      if (createForm.event_image) {
        payload = new FormData()
        Object.entries(createForm).forEach(([key, value]) => {
          if (key === 'event_image' && value)
            payload.append('event_image', value)
          else if (key === 'guest_types')
            payload.append('guest_types', JSON.stringify(guestTypesArr))
          else payload.append(key, value as any)
        })
        headers = { 'Content-Type': 'multipart/form-data' }
      } else {
        payload = { ...createForm, guest_types: guestTypesArr }
      }
      await api.post(`/events`, payload, { headers })
      toast.success('Event created successfully!')
      setCreateDialogOpen(false)
      setCreateForm({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        location: '',
        max_guests: '',
        registration_start_date: '',
        registration_end_date: '',
        event_type_id: '',
        event_category_id: '',
        event_image: null,
        guest_types: '',
      })
      // Refresh events
      const eventsRes = await api.get(`/organizers/${organizerId}/events`)
      setEvents(eventsRes.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create event')
    } finally {
      setCreateLoading(false)
    }
  }

  const openViewDialog = (event: any) => {
    setSelectedEvent(event)
    setViewDialogOpen(true)
  }

  const openEditDialog = (event: any) => {
    setEditForm({
      ...event,
      guest_types: event.guest_types?.map((g: any) => g.name).join(', ') || '',
    })
    setEditDialogOpen(true)
  }

  const handleEditInput = (field: string, value: any) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditLoading(true)
    try {
      const guestTypesArr = editForm.guest_types
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
      const payload = { ...editForm, guest_types: guestTypesArr }
      await api.put(`/events/${editForm.id}`, payload)
      toast.success('Event updated successfully!')
      setEditDialogOpen(false)
      // Refresh events
      const eventsRes = await api.get(`/organizers/${organizerId}/events`)
      setEvents(eventsRes.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update event')
    } finally {
      setEditLoading(false)
    }
  }

  const openDeleteDialog = (event: any) => {
    setSelectedEvent(event)
    setDeleteDialogOpen(true)
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return
    setDeleteLoading(true)
    try {
      await api.delete(`/events/${selectedEvent.id}`)
      toast.success('Event deleted successfully!')
      setDeleteDialogOpen(false)
      // Refresh events
      const eventsRes = await api.get(`/organizers/${organizerId}/events`)
      setEvents(eventsRes.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete event')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleEditOrganizerInput = (field: string, value: any) => {
    setEditOrganizerForm((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleEditOrganizerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditOrganizerLoading(true)
    try {
      await api.put(`/organizers/${organizerId}`, editOrganizerForm)
      toast.success('Organizer updated successfully!')
      setEditOrganizerDialogOpen(false)
      const orgRes = await api.get(`/organizers`)
      const org = orgRes.data.find(
        (o: any) => String(o.id) === String(organizerId)
      )
      setOrganizer(org)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update organizer')
    } finally {
      setEditOrganizerLoading(false)
    }
  }

  const openEditOrganizerDialog = () => {
    setEditOrganizerForm(organizer)
    setEditOrganizerDialogOpen(true)
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!organizer)
    return (
      <div className="p-8 text-center text-red-500">Organizer not found.</div>
    )

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8 w-full">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>
      <Card className="p-4 sm:p-6 mb-6">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold mb-2">{organizer.name}</h2>
          {user?.role === 'admin' && (
            <Button variant="outline" onClick={openEditOrganizerDialog}>
              <Edit className="w-4 h-4 mr-2" /> Edit Organizer
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Email</Label>
            <div>{organizer.email}</div>
          </div>
          <div>
            <Label>Phone</Label>
            <div>{organizer.phone_number}</div>
          </div>
          <div>
            <Label>Location</Label>
            <div>{organizer.location}</div>
          </div>
          <div>
            <Label>TIN Number</Label>
            <div>{organizer.tin_number}</div>
          </div>
          <div>
            <Label>Status</Label>
            <div>{organizer.status || 'active'}</div>
          </div>
        </div>
        {organizer.logo && (
          <div className="mb-4">
            <Label>Logo</Label>
            <img
              src={organizer.logo}
              alt="Logo"
              className="h-16 rounded shadow border mt-2"
            />
          </div>
        )}
      </Card>
      <Card className="p-4 sm:p-6">
        <h3 className="text-xl font-semibold mb-4">Contacts</h3>
        {contacts.length === 0 ? (
          <div className="text-gray-400">No contacts assigned.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
              >
                <span
                  className={
                    contact.is_primary_contact
                      ? 'font-bold text-purple-700'
                      : ''
                  }
                >
                  {contact.name} ({contact.email})
                  {contact.is_primary_contact ? ' (Primary)' : ''}
                </span>
                <div className="flex gap-2">
                  {!contact.is_primary_contact && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => handleSetPrimary(contact.id)}
                    >
                      <Star className="w-4 h-4 text-yellow-500" /> Set Primary
                    </Button>
                  )}
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleRemoveContact(contact.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card className="p-4 sm:p-6 mt-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
          <h3 className="text-xl font-semibold">Events Managed</h3>
          {user?.role === 'admin' && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  variant="outline"
                >
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg w-full">
                <DialogHeader>
                  <DialogTitle>Create Event</DialogTitle>
                  <DialogDescription>
                    Fill in the event details below.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <Input
                    placeholder="Event Name"
                    value={createForm.name}
                    onChange={(e) => handleCreateInput('name', e.target.value)}
                    required
                  />
                  <Textarea
                    placeholder="Description"
                    value={createForm.description}
                    onChange={(e) =>
                      handleCreateInput('description', e.target.value)
                    }
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="date"
                      placeholder="Start Date"
                      value={createForm.start_date}
                      onChange={(e) =>
                        handleCreateInput('start_date', e.target.value)
                      }
                      required
                    />
                    <Input
                      type="date"
                      placeholder="End Date"
                      value={createForm.end_date}
                      onChange={(e) =>
                        handleCreateInput('end_date', e.target.value)
                      }
                      required
                    />
                  </div>
                  <Input
                    placeholder="Location"
                    value={createForm.location}
                    onChange={(e) =>
                      handleCreateInput('location', e.target.value)
                    }
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Max Guests"
                    value={createForm.max_guests}
                    onChange={(e) =>
                      handleCreateInput('max_guests', e.target.value)
                    }
                    required
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="date"
                      placeholder="Registration Start Date"
                      value={createForm.registration_start_date}
                      onChange={(e) =>
                        handleCreateInput(
                          'registration_start_date',
                          e.target.value
                        )
                      }
                      required
                    />
                    <Input
                      type="date"
                      placeholder="Registration End Date"
                      value={createForm.registration_end_date}
                      onChange={(e) =>
                        handleCreateInput('registration_end_date', e.target.value)
                      }
                      required
                    />
                  </div>
                  <Input
                    placeholder="Event Type ID"
                    value={createForm.event_type_id}
                    onChange={(e) =>
                      handleCreateInput('event_type_id', e.target.value)
                    }
                    required
                  />
                  <Input
                    placeholder="Event Category ID"
                    value={createForm.event_category_id}
                    onChange={(e) =>
                      handleCreateInput('event_category_id', e.target.value)
                    }
                    required
                  />
                  <div>
                    <Label htmlFor="create_event_image">Event Image</Label>
                    <Input
                      id="create_event_image"
                      type="file"
                      onChange={handleCreateFile}
                      ref={createImageInputRef}
                      className="mt-1"
                    />
                    {createImagePreview && (
                      <div className="mt-2 relative inline-block">
                        <img
                          src={createImagePreview}
                          alt="Event image preview"
                          className="h-24 rounded shadow border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 rounded-full h-6 w-6"
                          onClick={handleRemoveCreateImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <Input
                    placeholder="Guest Types (comma separated)"
                    value={createForm.guest_types}
                    onChange={(e) =>
                      handleCreateInput('guest_types', e.target.value)
                    }
                    required
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createLoading}>
                      {createLoading ? 'Creating...' : 'Create Event'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        {user?.role === 'admin' &&
          (events.length === 0 ? (
            <div className="text-gray-400">
              No events managed by this organizer.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col sm:flex-row md:items-center md:gap-4 border-b last:border-b-0 py-2"
                >
                  <span className="font-semibold text-gray-800">
                    {event.name}
                  </span>
                  <span className="text-gray-600">{event.location}</span>
                  <span className="text-gray-500">
                    {event.start_date} - {event.end_date}
                  </span>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => openViewDialog(event)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => openEditDialog(event)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => openDeleteDialog(event)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ))}
      </Card>
      <Card className="p-4 sm:p-6 mt-6">
        <h3 className="text-xl font-semibold mb-4">Audit Log</h3>
        {auditLogs.length === 0 ? (
          <div className="text-gray-400">No audit log entries.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm"
              >
                <span className="font-mono text-gray-500">
                  {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm')}
                </span>
                <span className="font-semibold text-gray-800">
                  {log.action}
                </span>
                <span className="text-gray-600">
                  by {log.user?.name || 'System'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
      {/* View Event Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-2">
              <div>
                <b>Name:</b> {selectedEvent.name}
              </div>
              <div>
                <b>Description:</b> {selectedEvent.description}
              </div>
              <div>
                <b>Location:</b> {selectedEvent.location}
              </div>
              <div>
                <b>Start:</b> {selectedEvent.start_date}
              </div>
              <div>
                <b>End:</b> {selectedEvent.end_date}
              </div>
              <div>
                <b>Max Guests:</b> {selectedEvent.max_guests}
              </div>
              <div>
                <b>Registration:</b> {selectedEvent.registration_start_date} -{' '}
                {selectedEvent.registration_end_date}
              </div>
              <div>
                <b>Event Type ID:</b> {selectedEvent.event_type_id}
              </div>
              <div>
                <b>Event Category ID:</b> {selectedEvent.event_category_id}
              </div>
              <div>
                <b>Guest Types:</b>{' '}
                {selectedEvent.guest_types?.map((g: any) => g.name).join(', ')}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {editForm && (
            <form onSubmit={handleEditEvent} className="space-y-4">
              <Input
                placeholder="Event Name"
                value={editForm.name}
                onChange={(e) => handleEditInput('name', e.target.value)}
                required
              />
              <Textarea
                placeholder="Description"
                value={editForm.description}
                onChange={(e) => handleEditInput('description', e.target.value)}
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={editForm.start_date}
                  onChange={(e) =>
                    handleEditInput('start_date', e.target.value)
                  }
                  required
                />
                <Input
                  type="date"
                  placeholder="End Date"
                  value={editForm.end_date}
                  onChange={(e) => handleEditInput('end_date', e.target.value)}
                  required
                />
              </div>
              <Input
                placeholder="Location"
                value={editForm.location}
                onChange={(e) => handleEditInput('location', e.target.value)}
                required
              />
              <Input
                type="number"
                placeholder="Max Guests"
                value={editForm.max_guests}
                onChange={(e) => handleEditInput('max_guests', e.target.value)}
                required
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="date"
                  placeholder="Registration Start Date"
                  value={editForm.registration_start_date}
                  onChange={(e) =>
                    handleEditInput('registration_start_date', e.target.value)
                  }
                  required
                />
                <Input
                  type="date"
                  placeholder="Registration End Date"
                  value={editForm.registration_end_date}
                  onChange={(e) =>
                    handleEditInput('registration_end_date', e.target.value)
                  }
                  required
                />
              </div>
              <Input
                placeholder="Event Type ID"
                value={editForm.event_type_id}
                onChange={(e) =>
                  handleEditInput('event_type_id', e.target.value)
                }
                required
              />
              <Input
                placeholder="Event Category ID"
                value={editForm.event_category_id}
                onChange={(e) =>
                  handleEditInput('event_category_id', e.target.value)
                }
                required
              />
              <Input
                placeholder="Guest Types (comma separated)"
                value={editForm.guest_types}
                onChange={(e) => handleEditInput('guest_types', e.target.value)}
                required
              />
              <DialogFooter>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {/* Delete Event Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the event "{selectedEvent?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleDeleteEvent}
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
      {/* Edit Organizer Dialog */}
      <Dialog
        open={editOrganizerDialogOpen}
        onOpenChange={setEditOrganizerDialogOpen}
      >
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Edit Organizer</DialogTitle>
          </DialogHeader>
          {editOrganizerForm && (
            <form onSubmit={handleEditOrganizerSubmit} className="space-y-4">
              <Input
                placeholder="Organizer Name"
                value={editOrganizerForm.name}
                onChange={(e) =>
                  handleEditOrganizerInput('name', e.target.value)
                }
                required
              />
              <Input
                placeholder="Email"
                value={editOrganizerForm.email}
                onChange={(e) =>
                  handleEditOrganizerInput('email', e.target.value)
                }
                required
              />
              <Input
                placeholder="Phone"
                value={editOrganizerForm.phone_number}
                onChange={(e) =>
                  handleEditOrganizerInput('phone_number', e.target.value)
                }
              />
              <Input
                placeholder="Location"
                value={editOrganizerForm.location}
                onChange={(e) =>
                  handleEditOrganizerInput('location', e.target.value)
                }
              />
              <Input
                placeholder="TIN Number"
                value={editOrganizerForm.tin_number}
                onChange={(e) =>
                  handleEditOrganizerInput('tin_number', e.target.value)
                }
              />
              <DialogFooter>
                <Button type="submit" disabled={editOrganizerLoading}>
                  {editOrganizerLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
