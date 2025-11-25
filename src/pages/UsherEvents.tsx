import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import Breadcrumbs from '@/components/Breadcrumbs'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import api from '@/lib/api'
import { getGuestTypeBadgeClasses, getCheckInBadgeClasses } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Printer, Search, QrCode } from 'lucide-react'
import { Spinner, SpinnerInline } from '@/components/ui/spinner'
import BadgePrint from '@/components/Badge'
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Label } from '@/components/ui/label'
import { useSearchParams } from 'react-router-dom'

export default function UsherEvents() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [searchParams] = useSearchParams();
  
  // Assigned events for this usher
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [attendees, setAttendees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editAttendee, setEditAttendee] = useState<any>(null)
  const [guestTypes, setGuestTypes] = useState<any[]>([])
  const [singlePrintAttendee, setSinglePrintAttendee] = useState<any>(null)
  const singleBadgePrintRef = useRef<HTMLDivElement>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const [showPrintArea, setShowPrintArea] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  // Add form state
  const [addForm, setAddForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    jobtitle: '',
    gender: '',
    country: '',
    guest_type_id: '',
  })
  const [addAttendeeLoading, setAddAttendeeLoading] = useState(false)
  const [badgeCode, setBadgeCode] = useState('')
  const [badgeInfo, setBadgeInfo] = useState<any>(null)
  const [loadingBadgeInfo, setLoadingBadgeInfo] = useState(false)
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    jobtitle: '',
    gender: '',
    country: '',
    guest_type_id: '',
  })

  // Track if event selection is locked by query param
  const [eventSelectionLocked, setEventSelectionLocked] = useState(false);

  // Fetch assigned events on mount
  useEffect(() => {
    const fetchUsherEvents = async () => {
      try {
        setLoading(true)
        const response = await api.get('/usher/events')
        setEvents(response.data)
        // Check for eventId in query params
        const eventIdFromQuery = searchParams.get('eventId');
        if (eventIdFromQuery && response.data.some((e: any) => e.id.toString() === eventIdFromQuery)) {
          setSelectedEventId(eventIdFromQuery)
          setEventSelectionLocked(true)
        } else if (response.data.length === 1) {
          setSelectedEventId(response.data[0].id.toString())
          setEventSelectionLocked(false)
        } else {
          setEventSelectionLocked(false)
        }
        setError(null)
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch assigned events')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsherEvents()
  }, [searchParams])

  // Fetch attendees for selected event
  useEffect(() => {
    if (!selectedEventId) return
    setLoading(true)
    api.get(`/events/${selectedEventId}/attendees`)
      .then(res => {
        // Handle paginated response
        const data = res.data?.data ? res.data.data : res.data
        const indexed = (Array.isArray(data) ? data : []).map((a: any) => {
          const name = a?.guest?.name ? String(a.guest.name) : ''
          const email = a?.guest?.email ? String(a.guest.email) : ''
          const company = a?.guest?.company ? String(a.guest.company) : ''
          const blob = `${name} ${email} ${company}`.toLowerCase()
          return { ...a, _search: blob }
        })
        setAttendees(indexed)
        setError(null)
      })
      .catch(err => {
        console.error('Failed to fetch attendees:', err)
        const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch guests for this event.'
        setError(errorMessage)
        setAttendees([])
      })
      .finally(() => setLoading(false))
  }, [selectedEventId])

  // Debounce search for smoother UX
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearchTerm(searchTerm.trim().toLowerCase()), 250)
    return () => clearTimeout(handle)
  }, [searchTerm])

  // Fetch guest types for selected event
  useEffect(() => {
    if (!selectedEventId) return
    api.get(`/events/${selectedEventId}/guest-types`)
      .then(res => {
        // Deduplicate guest types by ID to prevent duplicate key warnings
        const uniqueGuestTypes = Array.from(
          new Map(res.data.map((type: any) => [type.id, type])).values()
        )
        setGuestTypes(uniqueGuestTypes)
      })
      .catch(() => setGuestTypes([]))
  }, [selectedEventId])

  // Fetch badge information when badge code is entered
  useEffect(() => {
    if (!selectedEventId || !badgeCode.trim()) {
      setBadgeInfo(null)
      return
    }

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      setLoadingBadgeInfo(true)
      api.get(`/events/${selectedEventId}/pre-generated-badges`, {
        params: { search: badgeCode.trim(), per_page: 1 }
      })
        .then(res => {
          const badges = res.data?.data || res.data
          if (badges && badges.length > 0) {
            const badge = badges[0]
            setBadgeInfo(badge)
            
            // Auto-select the guest type if badge is found and has a guest_type_id
            if (badge.guest_type_id) {
              setAddForm(prev => ({
                ...prev,
                guest_type_id: String(badge.guest_type_id)
              }))
            }
          } else {
            setBadgeInfo(null)
          }
        })
        .catch(err => {
          console.error('Failed to fetch badge info:', err)
          setBadgeInfo(null)
        })
        .finally(() => {
          setLoadingBadgeInfo(false)
        })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [badgeCode, selectedEventId])

  // Instant search handler (debounced)
  useEffect(() => {
    if (!selectedEventId || !searchTerm.trim()) {
      setSuggestions([])
      return
    }
    setSearching(true)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      api.get(`/events/${selectedEventId}/attendees`)
        .then(res => {
          // Handle paginated response
          const data = res.data?.data ? res.data.data : res.data
          const all = Array.isArray(data) ? data : []
          const search = searchTerm.toLowerCase()
          const filtered = all.filter((a: any) =>
            a.guest?.name?.toLowerCase().includes(search) ||
            a.guest?.email?.toLowerCase().includes(search) ||
            a.guest?.phone?.toLowerCase().includes(search) ||
            a.guest?.company?.toLowerCase().includes(search) ||
            a.guest?.jobtitle?.toLowerCase().includes(search) ||
            a.guest?.gender?.toLowerCase().includes(search) ||
            a.guest?.country?.toLowerCase().includes(search) ||
            (a.guest?.uuid && a.guest?.uuid.toLowerCase().includes(search))
          )
          setSuggestions(filtered)
          setSearching(false)
        })
        .catch(() => {
          setSuggestions([])
          setSearching(false)
        })
    }, 250)
    // eslint-disable-next-line
  }, [searchTerm, selectedEventId])

  // When user submits search, show results area
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchPerformed(true)
    
    // If search term exists, filter the already-loaded attendees
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      const filtered = attendees.filter((a: any) =>
        a._search?.includes(search) || // Use _search blob for faster filtering
        a.guest?.name?.toLowerCase().includes(search) ||
        a.guest?.email?.toLowerCase().includes(search) ||
        a.guest?.phone?.toLowerCase().includes(search) ||
        a.guest?.company?.toLowerCase().includes(search) ||
        a.guest?.jobtitle?.toLowerCase().includes(search) ||
        a.guest?.gender?.toLowerCase().includes(search) ||
        a.guest?.country?.toLowerCase().includes(search) ||
        (a.guest?.uuid && a.guest?.uuid.toLowerCase().includes(search))
      )
      setAttendees(filtered)
    } else {
      // If no search term, use suggestions if available, otherwise show empty
      setAttendees(suggestions.length > 0 ? suggestions : attendees)
    }
  }

  // Add attendee handler
  const handleAddAttendee = async (e: any) => {
    e.preventDefault()
    if (!selectedEventId) return
    try {
      setAddAttendeeLoading(true)
      
      // If badge code is provided, assign badge first
      if (badgeCode.trim()) {
        try {
          await api.post(`/events/${selectedEventId}/pre-generated-badges/assign`, {
            badge_code: badgeCode.trim(),
            first_name: addForm.first_name,
            last_name: addForm.last_name,
            email: addForm.email || undefined,
            phone: addForm.phone || undefined,
            company: addForm.company || undefined,
            job_title: addForm.jobtitle || undefined,
          })
          
          toast({ title: 'Success', description: 'Attendee registered with pre-generated badge!' })
        } catch (badgeErr: any) {
          // If badge assignment fails, try regular attendee creation
          console.warn('Badge assignment failed:', badgeErr)
          toast({
            title: 'Warning',
            description: badgeErr.response?.data?.error || 'Could not assign badge, creating attendee without badge',
          })
          
          // Fall through to regular attendee creation
          const payload = {
            ...addForm,
            name: `${addForm.first_name} ${addForm.last_name}`.trim(),
          }
          
          await api.post(`/events/${selectedEventId}/attendees`, payload)
          toast({ title: 'Success', description: 'Attendee added successfully (without badge)!' })
        }
      } else {
        // No badge code - create attendee normally
        const payload = {
          ...addForm,
          name: `${addForm.first_name} ${addForm.last_name}`.trim(),
        }
        await api.post(`/events/${selectedEventId}/attendees`, payload)
        toast({ title: 'Success', description: 'Attendee added!' })
      }

      setAddDialogOpen(false)
      setBadgeCode('')
      setBadgeInfo(null)
      setAddForm({ first_name: '', last_name: '', email: '', phone: '', company: '', jobtitle: '', gender: '', country: '', guest_type_id: '' })
      
      // Reload attendees and preserve search if it was active
      setLoading(true)
      try {
        const res = await api.get(`/events/${selectedEventId}/attendees`)
        const data = res.data?.data ? res.data.data : res.data
        const indexed = (Array.isArray(data) ? data : []).map((a: any) => {
          const name = a?.guest?.name ? String(a.guest.name) : ''
          const email = a?.guest?.email ? String(a.guest.email) : ''
          const company = a?.guest?.company ? String(a.guest.company) : ''
          const blob = `${name} ${email} ${company}`.toLowerCase()
          return { ...a, _search: blob }
        })
        
        // If there was an active search, re-filter the results
        if (searchPerformed && searchTerm.trim()) {
          const search = searchTerm.toLowerCase()
          const filtered = indexed.filter((a: any) =>
            a._search?.includes(search) ||
            a.guest?.name?.toLowerCase().includes(search) ||
            a.guest?.email?.toLowerCase().includes(search) ||
            a.guest?.phone?.toLowerCase().includes(search) ||
            a.guest?.company?.toLowerCase().includes(search) ||
            a.guest?.jobtitle?.toLowerCase().includes(search) ||
            a.guest?.gender?.toLowerCase().includes(search) ||
            a.guest?.country?.toLowerCase().includes(search) ||
            (a.guest?.uuid && a.guest?.uuid.toLowerCase().includes(search))
          )
          setAttendees(filtered)
        } else {
          // Clear results if no search was performed
          setAttendees([])
        }
      } catch (err) {
        console.error('Failed to reload attendees:', err)
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.error || 'Failed to add attendee' })
    } finally {
      setAddAttendeeLoading(false)
      setLoading(false)
    }
  }

  // Edit attendee handler
  const handleEditAttendee = async (e: any) => {
    e.preventDefault()
    if (!selectedEventId || !editAttendee) return
    try {
      setLoading(true)
      await api.put(`/events/${selectedEventId}/attendees/${editAttendee.id}`, editForm)
      toast({ title: 'Success', description: 'Attendee updated!' })
      setEditDialogOpen(false)
      setEditAttendee(null)
      
      // Reload attendees and preserve search if it was active
      try {
        const res = await api.get(`/events/${selectedEventId}/attendees`)
        const data = res.data?.data ? res.data.data : res.data
        const indexed = (Array.isArray(data) ? data : []).map((a: any) => {
          const name = a?.guest?.name ? String(a.guest.name) : ''
          const email = a?.guest?.email ? String(a.guest.email) : ''
          const company = a?.guest?.company ? String(a.guest.company) : ''
          const blob = `${name} ${email} ${company}`.toLowerCase()
          return { ...a, _search: blob }
        })
        
        // If there was an active search, re-filter the results
        if (searchPerformed && searchTerm.trim()) {
          const search = searchTerm.toLowerCase()
          const filtered = indexed.filter((a: any) =>
            a._search?.includes(search) ||
            a.guest?.name?.toLowerCase().includes(search) ||
            a.guest?.email?.toLowerCase().includes(search) ||
            a.guest?.phone?.toLowerCase().includes(search) ||
            a.guest?.company?.toLowerCase().includes(search) ||
            a.guest?.jobtitle?.toLowerCase().includes(search) ||
            a.guest?.gender?.toLowerCase().includes(search) ||
            a.guest?.country?.toLowerCase().includes(search) ||
            (a.guest?.uuid && a.guest?.uuid.toLowerCase().includes(search))
          )
          setAttendees(filtered)
        } else {
          // Clear results if no search was performed
          setAttendees([])
        }
      } catch (err) {
        console.error('Failed to reload attendees:', err)
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.error || 'Failed to update attendee' })
    } finally {
      setLoading(false)
    }
  }

  // Open edit dialog and populate form
  const openEditDialog = (attendee: any) => {
    setEditAttendee(attendee)
    setEditForm({
      name: attendee.guest?.name || '',
      email: attendee.guest?.email || '',
      phone: attendee.guest?.phone || '',
      company: attendee.guest?.company || '',
      jobtitle: attendee.guest?.jobtitle || '',
      gender: attendee.guest?.gender || '',
      country: attendee.guest?.country || '',
      guest_type_id: attendee.guest_type_id != null ? String(attendee.guest_type_id) : '',
    })
    setEditDialogOpen(true)
  }

  // Print badge handler (matches attendees tab)
  const handlePrintBadge = async (attendee: any) => {
    setSinglePrintAttendee(attendee);
    // Wait for the badge to render in the hidden printRef
    setTimeout(async () => {
      if (printRef.current) {
        const badgeElement = printRef.current.querySelector('.printable-badge-batch');
        if (!badgeElement) {
          toast({
            title: 'Error',
            description: 'No badge found to print.',
            variant: 'destructive',
          });
          setSinglePrintAttendee(null);
          return;
        }
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [400, 400] });
        const canvas = await html2canvas(badgeElement as HTMLElement, { 
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.9); // JPEG for smaller file size
        pdf.addImage(imgData, 'JPEG', 0, 0, 400, 400);
        // We will trigger print manually via iframe to avoid auto-closing behavior
        const blob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.src = blobUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          const cleanup = () => {
            if (iframe.parentNode) document.body.removeChild(iframe);
            URL.revokeObjectURL(blobUrl);
            setSinglePrintAttendee(null);
            document.removeEventListener('visibilitychange', handleVisibility);
          };
          const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
              setTimeout(cleanup, 300);
            }
          };
          document.addEventListener('visibilitychange', handleVisibility);
          try {
            const cw = iframe.contentWindow;
            cw?.focus();
            setTimeout(() => cw?.print(), 400);
          } catch (e) {
            setTimeout(cleanup, 120000);
          }
          setTimeout(() => {
            document.removeEventListener('visibilitychange', handleVisibility);
            if (iframe.parentNode) document.body.removeChild(iframe);
            URL.revokeObjectURL(blobUrl);
        setSinglePrintAttendee(null);
          }, 120000);
        };
      }
    }, 150); // Reduced timeout from 300ms to 150ms for faster response
  }


  // Use filteredAttendees for rendering results
  const filteredAttendees = searchPerformed ? attendees : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs 
            items={[
              { label: 'Usher Events', href: '/dashboard/usher-events' }
            ]}
          />
        </div>
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Search className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Guest Management
              </h1>
              <p className="text-muted-foreground">
                Search for guests by name, email, phone, or company. Add and edit attendees for your assigned event.
              </p>
            </div>
          </div>
        </div>
        
        {/* Main Content Card */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">

          {/* Event Selection Dropdown */}
          {events.length > 1 && (
            <div className="mb-6">
              <Label htmlFor="event-select" className="text-sm font-medium text-foreground mb-2 block">
                Select Event
              </Label>
              <Select
                value={selectedEventId}
                onValueChange={value => {
                  if (eventSelectionLocked) return;
                  setSelectedEventId(value)
                  setSearchPerformed(false)
                  setSearchTerm('')
                  setAttendees([])
                }}
                disabled={eventSelectionLocked}
              >
                <SelectTrigger id="event-select" className="w-full max-w-md" disabled={eventSelectionLocked}>
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}


          {/* Search and Actions */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search guests by name, email, phone, company, or UUID..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value)
                  setSearchPerformed(false)
                }}
                className="pl-10 h-11"
                autoFocus
              />
              {/* Suggestions dropdown */}
              {searchTerm && suggestions.length > 0 && !searchPerformed && (
                <div className="absolute left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                  {suggestions.slice(0, 8).map(s => (
                    <div
                      key={s.id}
                      className="px-4 py-3 hover:bg-accent cursor-pointer flex flex-col border-b border-border last:border-0 transition-colors"
                      onClick={() => {
                        setAttendees([s])
                        setSearchPerformed(true)
                        setSearchTerm(s.guest?.name || s.guest?.email || s.guest?.uuid || '')
                      }}
                    >
                      <span className="font-semibold text-foreground">{s.guest?.name}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {s.guest?.email} {s.guest?.uuid ? `• ${s.guest?.uuid}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {searchTerm && searching && !searchPerformed && (
                <div className="absolute left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-20 flex items-center justify-center py-4">
                  <SpinnerInline />
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              {searchPerformed && (
                <Button 
                  onClick={() => {
                    setSearchPerformed(false)
                    setSearchTerm('')
                    setSuggestions([])
                    setAttendees([])
                  }} 
                  type="button" 
                  variant="outline"
                >
                  Clear
                </Button>
              )}
              <Button 
                onClick={() => setAddDialogOpen(true)} 
                type="button" 
                variant="outline"
                className="ml-auto"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Add Attendee
              </Button>
            </div>
          </form>
        </div>
        {/* Results Section */}
        <div>
          {!searchPerformed && (
            <div className="bg-card rounded-xl border border-border p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Start by searching for a guest</h2>
                <p className="text-muted-foreground max-w-md">
                  Enter a name, email, phone number, company, or UUID to find a guest for your event.
                </p>
              </div>
            </div>
          )}
          {searchPerformed && loading && (
            <div className="bg-card rounded-xl border border-border p-12">
              <div className="flex flex-col items-center justify-center">
                <Spinner size="lg" variant="info" text="Searching guests..." />
              </div>
            </div>
          )}
          {searchPerformed && !loading && error && (
            <div className="bg-card rounded-xl border border-border p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Error loading guests</h2>
                <p className="text-destructive">{error}</p>
              </div>
            </div>
          )}
          {searchPerformed && !loading && !error && filteredAttendees.length === 0 && (
            <div className="bg-card rounded-xl border border-border p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">No guests found</h2>
                <p className="text-muted-foreground">Try a different search term or add a new attendee.</p>
              </div>
            </div>
          )}
          {searchPerformed && !loading && !error && filteredAttendees.length > 0 && (
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Guest Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendees.map(attendee => (
                      <TableRow key={attendee.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{attendee.guest?.name || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{attendee.guest?.email || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{attendee.guest?.phone || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{attendee.guest?.company || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{attendee.guest?.jobtitle || '-'}</TableCell>
                        <TableCell>
                          <Badge className={getGuestTypeBadgeClasses(attendee.guest_type?.name)} variant="outline">
                            {attendee.guest_type?.name || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCheckInBadgeClasses(attendee.checked_in)} variant="outline">
                            {attendee.checked_in ? 'Checked In' : 'Not Checked In'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => openEditDialog(attendee)}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handlePrintBadge(attendee)} 
                              title="Print Badge"
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Hidden badge print area for single badge printing */}
      <div
        ref={printRef}
        style={{
          position: 'absolute',
          top: -9999,
          left: -9999,
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          visibility: singlePrintAttendee ? 'visible' : 'hidden',
          pointerEvents: 'none',
        }}
      >
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #usher-print-area, #usher-print-area * { visibility: visible !important; }
            #usher-print-area { 
              position: absolute !important; 
              left: 0; 
              top: 0; 
              width: 100vw; 
              height: 100vh; 
              background: white; 
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }
        `}</style>
        <div id="usher-print-area">
        {singlePrintAttendee && (
          <div className="printable-badge-batch">
            <BadgePrint 
              attendee={{
                ...singlePrintAttendee,
                guest: {
                  ...singlePrintAttendee.guest,
                  // Ensure we use the latest guest data with complete information
                  name: singlePrintAttendee.guest?.name || 'Participant',
                  company: singlePrintAttendee.guest?.company || '',
                  jobtitle: singlePrintAttendee.guest?.jobtitle || '',
                  email: singlePrintAttendee.guest?.email || '',
                  phone: singlePrintAttendee.guest?.phone || '',
                  country: singlePrintAttendee.guest?.country || '',
                  uuid: singlePrintAttendee.guest?.uuid || '',
                },
                // Include attendee ID for the badge
                id: singlePrintAttendee.id,
              }} 
            />
          </div>
        )}
        </div>
      </div>
      {/* Add Attendee Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => {
        setAddDialogOpen(open)
        if (!open) {
          // Reset form and badge info when dialog closes
          setBadgeCode('')
          setBadgeInfo(null)
          setAddForm({ first_name: '', last_name: '', email: '', phone: '', company: '', jobtitle: '', gender: '', country: '', guest_type_id: '' })
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Add New Attendee</DialogTitle>
            <DialogDescription>
              Enter the details of the new attendee for this event. You can optionally assign a pre-generated badge.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAttendee} className="space-y-4 py-4">
            {/* Badge Code Input */}
            <div>
              <Label htmlFor="badge_code" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Badge QR Code (Optional)
              </Label>
              <div className="relative">
                <Input
                  id="badge_code"
                  value={badgeCode}
                  onChange={(e) => setBadgeCode(e.target.value)}
                  placeholder="Scan or enter badge code to assign pre-generated badge"
                  className="font-mono"
                />
              {loadingBadgeInfo && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <SpinnerInline />
                </div>
              )}
              </div>
              {loadingBadgeInfo && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <SpinnerInline className="w-3 h-3" />
                  Looking up badge...
                </p>
              )}
              {!loadingBadgeInfo && badgeInfo && (
                <div className="mt-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                  <p className="text-sm font-semibold text-success flex items-center gap-2">
                    <span>✓</span> Badge found: {badgeInfo.badge_code}
                  </p>
                  {badgeInfo.guest_type && (
                    <p className="text-xs text-success/80 mt-1">
                      Guest Type auto-selected: {badgeInfo.guest_type.name}
                    </p>
                  )}
                  {badgeInfo.status !== 'available' && (
                    <p className="text-xs text-warning mt-1">Status: {badgeInfo.status}</p>
                  )}
                </div>
              )}
              {!loadingBadgeInfo && badgeCode.trim() && !badgeInfo && (
                <p className="text-xs text-warning mt-2">
                  Badge code not found. You can still proceed without a pre-generated badge.
                </p>
              )}
              {!badgeCode.trim() && (
                <p className="text-xs text-muted-foreground mt-2">
                  Leave blank to register without a pre-generated badge
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={addForm.first_name}
                  onChange={e => setAddForm(f => ({ ...f, first_name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={addForm.last_name}
                  onChange={e => setAddForm(f => ({ ...f, last_name: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={addForm.phone}
                  onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={addForm.company}
                  onChange={e => setAddForm(f => ({ ...f, company: e.target.value }))}
                />
                </div>
              <div>
                <Label htmlFor="jobtitle">Job Title</Label>
                <Input
                  id="jobtitle"
                  value={addForm.jobtitle}
                  onChange={e => setAddForm(f => ({ ...f, jobtitle: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  onValueChange={val => setAddForm(f => ({ ...f, gender: val }))}
                  value={addForm.gender}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Select
                  onValueChange={val => setAddForm(f => ({ ...f, country: val }))}
                  value={addForm.country}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Ethiopia", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Italy", "Spain", "Netherlands", "Belgium", "Switzerland", "Austria", "Sweden", "Norway", "Denmark", "Finland", "Poland", "Czech Republic", "Hungary", "Romania", "Bulgaria", "Greece", "Portugal", "Ireland", "New Zealand", "Japan", "South Korea", "China", "India", "Brazil", "Argentina", "Mexico", "Chile", "Colombia", "Peru", "Venezuela", "Ecuador", "Bolivia", "Paraguay", "Uruguay", "Guyana", "Suriname", "French Guiana", "South Africa", "Egypt", "Nigeria", "Kenya", "Ghana", "Uganda", "Tanzania", "Morocco", "Algeria", "Tunisia", "Libya", "Sudan", "Somalia", "Djibouti", "Eritrea", "Saudi Arabia", "United Arab Emirates", "Qatar", "Kuwait", "Bahrain", "Oman", "Yemen", "Jordan", "Lebanon", "Syria", "Iraq", "Iran", "Afghanistan", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "Bhutan", "Maldives", "Myanmar", "Thailand", "Laos", "Cambodia", "Vietnam", "Malaysia", "Singapore", "Indonesia", "Philippines", "Brunei", "East Timor", "Papua New Guinea", "Fiji", "Solomon Islands", "Vanuatu", "New Caledonia", "French Polynesia", "Samoa", "Tonga", "Kiribati", "Tuvalu", "Nauru", "Palau", "Micronesia", "Marshall Islands", "Cook Islands", "Niue", "Tokelau", "American Samoa", "Guam", "Northern Mariana Islands", "Puerto Rico", "U.S. Virgin Islands", "British Virgin Islands", "Anguilla", "Montserrat", "Saint Kitts and Nevis"
                    ].map((country, idx) => (
                      <SelectItem key={`country-${idx}`} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
                </div>
            <div className="grid grid-cols-1">
              <div>
                <Label htmlFor="guest_type_id">Guest Type</Label>
                <Select
                  onValueChange={val => setAddForm(f => ({ ...f, guest_type_id: val }))}
                  value={addForm.guest_type_id}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a guest type" />
                  </SelectTrigger>
                  <SelectContent>
                    {guestTypes
                      .filter(
                        (type) =>
                          type.id !== undefined &&
                          type.id !== null &&
                          type.id !== ''
                      )
                      .map((type, index) => (
                        <SelectItem key={`guest-type-${type.id}-${index}`} value={String(type.id)}>
                          {type.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setAddDialogOpen(false)} 
                disabled={addAttendeeLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addAttendeeLoading} className="bg-primary hover:bg-primary/90">
                {addAttendeeLoading ? (
                  <>
                    <SpinnerInline className="mr-2" />
                    Adding...
                  </>
                ) : (
                  'Add Attendee'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Edit Attendee Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Edit Guest</DialogTitle>
            <DialogDescription>
              Update guest information and type. All fields are optional unless marked.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditAttendee} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input required value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input required type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Company</Label>
                <Input value={editForm.company} onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))} />
              </div>
              <div>
                <Label>Job Title</Label>
                <Input value={editForm.jobtitle} onChange={e => setEditForm(f => ({ ...f, jobtitle: e.target.value }))} />
              </div>
              <div>
                <Label>Gender</Label>
                <Input value={editForm.gender} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label>Country</Label>
                <Input value={editForm.country} onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label>Guest Type</Label>
            <Select required value={editForm.guest_type_id} onValueChange={val => setEditForm(f => ({ ...f, guest_type_id: val }))}>
              <SelectTrigger className="w-full">
                    <SelectValue placeholder={editForm.guest_type_id ? undefined : 'Select Guest Type'} />
              </SelectTrigger>
              <SelectContent>
                {guestTypes
                  .filter(
                    (gt) =>
                      gt.id !== undefined &&
                      gt.id !== null &&
                      gt.id !== ''
                  )
                  .map((gt, index) => (
                    <SelectItem key={`edit-guest-type-${gt.id}-${index}`} value={gt.id.toString()}>{gt.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 