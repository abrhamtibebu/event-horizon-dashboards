import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Breadcrumbs from '@/components/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Star, Trash2, ArrowLeft, Pencil, Eye, X, Edit, Mail, Phone, MapPin, Building2, Calendar, User } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'

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
        // Admin list: may be paginated (data.data) or array (data)
        const orgRes = await api.get(`/admin/organizers`, { params: { per_page: 1000 } })
        const list = Array.isArray(orgRes.data) ? orgRes.data : orgRes.data?.data ?? []
        const org = list.find((o: any) => String(o.id) === String(organizerId))
        setOrganizer(org)
        const contactsRes = await api.get(`/organizers/${organizerId}/contacts`)
        setContacts(contactsRes.data)
        const logsRes = await api.get(
          `/audit-logs?target_type=Organizer&target_id=${organizerId}`
        )
        setAuditLogs(logsRes.data.data || [])

        // Frontend role check (defense in depth - backend protection is mandatory)
        if (user && ['admin', 'superadmin'].includes(user.role)) {
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
    // Find the contact to check if it's a primary contact
    const contact = contacts.find((c: any) => c.id === userId)
    
    if (contact?.is_primary_contact) {
      // Count primary contacts for this organizer
      const primaryContactCount = contacts.filter((c: any) => c.is_primary_contact).length
      
      if (primaryContactCount <= 1) {
        toast.error('Cannot remove the only primary contact. Please assign another primary contact first.')
        return
      }
      
      // Show confirmation for removing primary contact
      if (!confirm(`Are you sure you want to remove ${contact.name} as a primary contact? This organizer has ${primaryContactCount} primary contact(s).`)) {
        return
      }
    }
    
    try {
      await api.delete(`/organizers/${organizerId}/contacts/${userId}`)
      toast.success(contact?.is_primary_contact ? 'Primary contact removed successfully!' : 'Contact removed successfully!')
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
      // Frontend validation (UX only - backend validation is mandatory)
      import('@/lib/fileValidation').then(({ validateImageFile }) => {
        const validation = validateImageFile(file)
        
        if (!validation.valid) {
          toast.error(validation.message)
          e.target.value = '' // Clear the input
          return
        }
        
        setCreateForm((prev: any) => ({ ...prev, event_image: file }))
        const reader = new FileReader()
        reader.onloadend = () => setCreateImagePreview(reader.result as string)
        reader.readAsDataURL(file)
      })
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
    // Frontend validation for required fields (match CreateEvent.tsx)
    const requiredFields = [
      'name', 'start_date', 'end_date', 'location', 'max_guests',
      'registration_start_date', 'registration_end_date', 'event_type_id', 'event_category_id'
    ];
    for (const field of requiredFields) {
      if (!createForm[field] || (typeof createForm[field] === 'string' && createForm[field].trim() === '')) {
        toast.error(`Please fill in the required field: ${field.replace(/_/g, ' ')}`);
        return;
      }
    }
    if (isNaN(Number(createForm.max_guests)) || parseInt(createForm.max_guests, 10) < 1) {
      toast.error('Max Guests must be a positive integer.');
      return;
    }
    const guestTypesArr = createForm.guest_types
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
    if (guestTypesArr.length === 0) {
      toast.error('Please provide at least one guest type.');
      return;
    }
    setCreateLoading(true)
    try {
      let payload
      let headers = {}
      // Format dates and max_guests
      const processedForm = {
        ...createForm,
        start_date: new Date(createForm.start_date).toISOString(),
        end_date: new Date(createForm.end_date).toISOString(),
        registration_start_date: new Date(createForm.registration_start_date).toISOString(),
        registration_end_date: new Date(createForm.registration_end_date).toISOString(),
        max_guests: parseInt(createForm.max_guests, 10),
        // Only include organizer_id if not organizer
        ...(user?.role !== 'organizer' && { organizer_id: createForm.organizer_id }),
        guest_types: guestTypesArr,
      }
      if (createForm.event_image) {
        payload = new FormData()
        Object.entries(processedForm).forEach(([key, value]) => {
          if (key === 'event_image' && value)
            payload.append('event_image', value)
          else if (key === 'guest_types')
            (Array.isArray(value) ? value : [value]).forEach((type: string) =>
              payload.append('guest_types[]', type)
            )
          else
            payload.append(key, value as any)
        })
        headers = { 'Content-Type': 'multipart/form-data' }
      } else {
        payload = processedForm
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
      // Normalize guest types to array
      const guestTypesArr = (typeof editForm.guest_types === 'string'
        ? (editForm.guest_types as string).split(',').map((s: string) => s.trim())
        : Array.isArray(editForm.guest_types)
          ? editForm.guest_types
          : []
      ).filter(Boolean)

      // Normalize dates to ISO strings if they look like Date objects
      const toIsoIfDateLike = (val: any) => {
        if (!val) return val
        try {
          // If already ISO string, leave it
          if (typeof val === 'string' && /\d{4}-\d{2}-\d{2}T/.test(val)) return val
          const d = new Date(val)
          if (!isNaN(d.getTime())) return d.toISOString()
          return val
        } catch {
          return val
        }
      }

      const processed = {
        ...editForm,
        start_date: toIsoIfDateLike(editForm.start_date),
        end_date: toIsoIfDateLike(editForm.end_date),
        registration_start_date: toIsoIfDateLike(editForm.registration_start_date),
        registration_end_date: toIsoIfDateLike(editForm.registration_end_date),
        max_guests: editForm.max_guests !== undefined ? Number(editForm.max_guests) : editForm.max_guests,
        guest_types: guestTypesArr,
      }

      let payload: any = processed
      let headers: Record<string, string> = {}

      // If an image file is present, use multipart/form-data
      if (processed.event_image && processed.event_image instanceof File) {
        const formData = new FormData()
        Object.entries(processed).forEach(([key, value]) => {
          if (key === 'event_image') {
            if (value) formData.append('event_image', value as File)
          } else if (key === 'guest_types') {
            (value as string[]).forEach((gt) => formData.append('guest_types[]', gt))
          } else if (value !== undefined && value !== null) {
            formData.append(key, String(value))
          }
        })
        payload = formData
        headers = { 'Content-Type': 'multipart/form-data' }
      }

      await api.put(`/events/${editForm.id}`, payload, { headers })
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
      // Always use the admin endpoint for editing as admin/superadmin
      await api.put(`/organizers/${organizerId}`, editOrganizerForm)
      toast.success('Organizer updated successfully!')
      setEditOrganizerDialogOpen(false)
      const orgRes = await api.get(`/admin/organizers`, { params: { per_page: 1000 } })
      const list = Array.isArray(orgRes.data) ? orgRes.data : orgRes.data?.data ?? []
      const org = list.find((o: any) => String(o.id) === String(organizerId))
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

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm">Loading organizer…</span>
        </div>
      </div>
    )
  }
  if (!organizer) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Organizer not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/organizers')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Organizers
          </Button>
        </Card>
      </div>
    )
  }

  const logoUrl = organizer.logo?.startsWith('http') ? organizer.logo : `${(import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '')}/storage/${organizer.logo}`

  const DetailRow = ({ icon: Icon, label, value }: { icon?: React.ElementType; label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm text-foreground mt-0.5">{value ?? '—'}</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Organizers', href: '/dashboard/organizers' },
          { label: organizer.name || 'Profile' },
        ]}
        className="mb-2"
      />

      {/* Header */}
      <Card className="overflow-hidden border-0 shadow-sm bg-card">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            {organizer.logo && (
              <div className="shrink-0">
                <img
                  src={logoUrl}
                  alt=""
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-cover border border-border bg-muted"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">{organizer.name}</h1>
                <Badge variant={organizer.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                  {organizer.status ?? 'active'}
                </Badge>
                {organizer.active != null && !organizer.active && (
                  <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                )}
              </div>
              {(user?.role === 'admin' || user?.role === 'superadmin') && (
                <Button variant="outline" size="sm" className="mt-3" onClick={openEditOrganizerDialog}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Details grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="p-6 border-0 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" /> Business
          </h2>
          <div className="space-y-0 divide-y divide-border/60">
            <DetailRow icon={Mail} label="Email" value={organizer.email} />
            <DetailRow icon={Phone} label="Phone" value={organizer.phone_number} />
            <DetailRow icon={MapPin} label="Location" value={organizer.location} />
            <DetailRow icon={Building2} label="TIN Number" value={organizer.tin_number} />
            <DetailRow label="Billing Email" value={organizer.billing_email} />
            <DetailRow label="Subscription ID" value={organizer.subscription_id} />
            <DetailRow
              label="Trial ends"
              value={organizer.trial_ends_at ? format(new Date(organizer.trial_ends_at), 'PP') : null}
            />
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" /> Timeline
          </h2>
          <div className="space-y-0 divide-y divide-border/60">
            <DetailRow
              label="Created"
              value={organizer.created_at ? format(new Date(organizer.created_at), 'PP') : null}
            />
            <DetailRow
              label="Updated"
              value={organizer.updated_at ? format(new Date(organizer.updated_at), 'PP') : null}
            />
          </div>
        </Card>
      </div>

      {(organizer.suspended_at || organizer.suspended_reason) && (
        <Card className="p-6 border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
          <h2 className="text-sm font-semibold text-foreground mb-3">Suspension</h2>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Suspended at</p>
              <p className="text-foreground mt-0.5">
                {organizer.suspended_at ? format(new Date(organizer.suspended_at), 'PPpp') : '—'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Reason</p>
              <p className="text-foreground mt-0.5">{organizer.suspended_reason ?? '—'}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Contacts */}
      <Card className="p-6 border-0 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" /> Contacts
        </h2>
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No contacts assigned.</p>
        ) : (
          <ul className="space-y-2">
            {contacts.map((contact) => (
              <li
                key={contact.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {contact.name}
                    {contact.is_primary_contact && (
                      <Badge variant="secondary" className="ml-2 text-xs">Primary</Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!contact.is_primary_contact && (
                    <Button size="sm" variant="ghost" onClick={() => handleSetPrimary(contact.id)} title="Set as primary">
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveContact(contact.id)} title="Remove">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Events */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" /> Events managed
          </h2>
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
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
                        handleCreateInput(
                          'registration_end_date',
                          e.target.value
                        )
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
                    <Label htmlFor="create_event_image" className="hidden">Event Image</Label>
                    <Input
                      id="create_event_image"
                      type="file"
                      onChange={handleCreateFile}
                      ref={createImageInputRef}
                      className="mt-1 hidden"
                      style={{display: 'none'}}
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
        {(user?.role === 'admin' || user?.role === 'superadmin') &&
          (events.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center rounded-lg border border-dashed border-border">
              No events managed by this organizer.
            </p>
          ) : (
            <ul className="space-y-2">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-lg border border-border/60 bg-muted/20 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{event.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {event.location} · {event.start_date && format(new Date(event.start_date), 'PP')} – {event.end_date && format(new Date(event.end_date), 'PP')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => openViewDialog(event)} title="View">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEditDialog(event)} title="Edit">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openDeleteDialog(event)} title="Delete">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ))}
      </Card>
      <Card className="p-6 border-0 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-4">Audit log</h2>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No audit log entries.</p>
        ) : (
          <ul className="space-y-2">
            {auditLogs.map((log) => (
              <li
                key={log.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border/60 bg-muted/20 px-4 py-2 text-sm"
              >
                <span className="font-mono text-muted-foreground text-xs">
                  {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm')}
                </span>
                <span className="font-medium text-foreground">{log.action}</span>
                <span className="text-muted-foreground">by {log.user?.name || 'System'}</span>
              </li>
            ))}
          </ul>
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
