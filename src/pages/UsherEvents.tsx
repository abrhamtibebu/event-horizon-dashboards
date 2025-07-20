import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import api from '@/lib/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Printer } from 'lucide-react'
import BadgePrint from '@/components/Badge'
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { QrReader } from '@blackbox-vision/react-qr-reader';
// Suppress defaultProps warning for QrReader (temporary workaround)
if (QrReader && QrReader.defaultProps) {
  QrReader.defaultProps = undefined;
}

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
  const [showPrintArea, setShowPrintArea] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrScanStatus, setQrScanStatus] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

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
        setAttendees(res.data)
        setError(null)
      })
      .catch(err => {
        setError('Failed to fetch guests for this event.')
        setAttendees([])
      })
      .finally(() => setLoading(false))
  }, [selectedEventId])

  // Fetch guest types for selected event
  useEffect(() => {
    if (!selectedEventId) return
    api.get(`/events/${selectedEventId}/guest-types`)
      .then(res => setGuestTypes(res.data))
      .catch(() => setGuestTypes([]))
  }, [selectedEventId])

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
          const all = res.data || []
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
    setAttendees(suggestions)
  }

  // Add attendee handler
  const handleAddAttendee = async (e: any) => {
    e.preventDefault()
    if (!selectedEventId) return
    try {
      setAddAttendeeLoading(true)
      const payload = {
        ...addForm,
        name: `${addForm.first_name} ${addForm.last_name}`.trim(),
      }
      await api.post(`/events/${selectedEventId}/attendees`, payload)
      toast({ title: 'Success', description: 'Attendee added!' })
      setAddDialogOpen(false)
      setAddForm({ first_name: '', last_name: '', email: '', phone: '', company: '', jobtitle: '', gender: '', country: '', guest_type_id: '' })
      // Refresh attendees
      const res = await api.get(`/events/${selectedEventId}/attendees`)
      setAttendees(res.data)
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
      // Refresh attendees
      const res = await api.get(`/events/${selectedEventId}/attendees`)
      setAttendees(res.data)
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
      guest_type_id: attendee.guest_type_id || '',
    })
    setEditDialogOpen(true)
  }

  // Print badge handler (matches system)
  const handlePrintBadge = async (attendee: any) => {
    setSinglePrintAttendee(attendee)
    setShowPrintArea(true)
    setTimeout(() => {
      window.print()
      setShowPrintArea(false)
      setSinglePrintAttendee(null)
    }, 300)
  }

  // Handler for QR scan
  const handleQrScan = async (data: string | null) => {
    if (!data || !selectedEventId) return;
    setQrLoading(true);
    setQrScanStatus(null);
    try {
      // Assume QR contains attendee id or email
      // Try to find attendee by id or email
      let attendee = attendees.find((a) => a.id?.toString() === data || a.guest?.email === data);
      if (!attendee) {
        // Try to fetch all attendees in case not loaded
        const res = await api.get(`/events/${selectedEventId}/attendees`);
        attendee = res.data.find((a: any) => a.id?.toString() === data || a.guest?.email === data);
      }
      if (!attendee) {
        setQrScanStatus('No matching attendee found for this QR code.');
        setQrLoading(false);
        return;
      }
      // Mark as checked in
      await api.post(`/events/${selectedEventId}/attendees/${attendee.id}/check-in`, { checked_in: true });
      setQrScanStatus(`Checked in: ${attendee.guest?.name || attendee.id}`);
      setAttendees((prev) => prev.map((a) => a.id === attendee.id ? { ...a, checked_in: true } : a));
      toast({ title: 'Success', description: `Checked in: ${attendee.guest?.name || attendee.id}` });
    } catch (err: any) {
      setQrScanStatus('Failed to check in attendee. Please try again.');
      toast({ title: 'Error', description: 'Failed to check in attendee.', variant: 'destructive' });
    } finally {
      setQrLoading(false);
    }
  };
  const handleQrError = (err: any) => {
    setQrScanStatus('QR scanner error. Please try again.');
  };

  // Use filteredAttendees for rendering results
  const filteredAttendees = searchPerformed ? attendees : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col items-center py-12 px-2">
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col items-center gap-6 border border-blue-100">
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight mb-2">Guest Management</h1>
          <p className="text-gray-500 text-center mb-4">Search for guests by name, email, phone, or company. Add and edit attendees for your assigned event.</p>

          {/* Event Selection Dropdown */}
          {events.length > 1 && (
            <div className="w-full flex flex-col items-center mb-4">
              <Label htmlFor="event-select" className="mb-1 text-base font-medium text-blue-900">Select Event</Label>
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
                <SelectTrigger id="event-select" className="w-full max-w-md text-base border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" disabled={eventSelectionLocked}>
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

          {/* QR Check-In Button */}
          <div className="w-full flex justify-end mb-4">
            <Button
              variant="outline"
              onClick={() => setQrDialogOpen(true)}
              className="focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95"
              autoFocus
            >
              Scan QR Code for Check-In
            </Button>
          </div>

          {/* QR Scanner Dialog */}
          <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>QR Code Check-In</DialogTitle>
                <DialogDescription>
                  Scan a guest's QR code to check them in.<br />
                  <span className="text-xs text-gray-500">If prompted, allow camera access. For best results, use your phone's rear camera.</span>
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <QrReader
                  constraints={{ facingMode: { ideal: 'environment' } }}
                  onResult={(result, error) => {
                    if (!!result) handleQrScan(result.getText());
                    if (!!error) handleQrError(error);
                  }}
                  containerStyle={{ width: '100%' }}
                  videoStyle={{ width: '100%' }}
                  scanDelay={200}
                  videoId="usher-qr-video"
                />
                {qrLoading && <div className="text-blue-500">Checking in...</div>}
                {qrScanStatus && <div className="text-center text-sm text-blue-700">{qrScanStatus}</div>}
                <Button variant="outline" onClick={() => setQrDialogOpen(false)}>Close</Button>
              </div>
            </DialogContent>
          </Dialog>

          <form onSubmit={handleSearch} className="w-full flex flex-col sm:flex-row gap-3 items-center justify-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 w-5 h-5" />
          <Input
                placeholder="Search guests..."
            value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value)
                  setSearchPerformed(false)
                }}
                className="pl-10 py-3 rounded-full border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-lg shadow-sm"
                autoFocus
              />
              {/* Suggestions dropdown */}
              {searchTerm && suggestions.length > 0 && !searchPerformed && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-blue-100 rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">
                  {suggestions.slice(0, 8).map(s => (
                    <div
                      key={s.id}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex flex-col"
                      onClick={() => {
                        setAttendees([s])
                        setSearchPerformed(true)
                        setSearchTerm(s.guest?.name || s.guest?.email || s.guest?.uuid || '')
                      }}
                    >
                      <span className="font-semibold text-blue-900">{s.guest?.name}</span>
                      <span className="text-xs text-gray-500">{s.guest?.email} {s.guest?.uuid ? `• ${s.guest?.uuid}` : ''}</span>
                    </div>
                  ))}
                </div>
              )}
              {searchTerm && searching && !searchPerformed && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-blue-100 rounded-xl shadow-lg z-20 flex items-center justify-center py-4">
                  <svg className="animate-spin h-6 w-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
              )}
            </div>
            <Button type="submit" className="rounded-full px-6 py-3 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow">
              Search
            </Button>
            <Button onClick={() => setAddDialogOpen(true)} type="button" variant="outline" className="rounded-full px-6 py-3 text-lg border-blue-200 shadow">
              Add Attendee
            </Button>
          </form>
                    </div>
        {/* Results Section */}
        <div className="mt-10">
          {!searchPerformed && (
            <div className="flex flex-col items-center justify-center py-24">
              <Search className="w-16 h-16 text-blue-200 mb-4" />
              <h2 className="text-xl font-semibold text-gray-400 mb-2">Start by searching for a guest</h2>
              <p className="text-gray-400">Enter a name, email, or other info to find a guest for your event.</p>
                    </div>
          )}
          {searchPerformed && loading && (
            <div className="flex flex-col items-center justify-center py-24">
              <svg className="animate-spin h-10 w-10 text-blue-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span className="text-blue-400 text-lg">Searching guests...</span>
                    </div>
          )}
          {searchPerformed && !loading && error && (
            <div className="flex flex-col items-center justify-center py-24">
              <span className="text-red-500 text-lg">{error}</span>
                  </div>
          )}
          {searchPerformed && !loading && !error && filteredAttendees.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24">
              <svg className="w-16 h-16 text-blue-100 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3A2.25 2.25 0 008.25 5.25V9m10.5 0v10.5A2.25 2.25 0 0116.5 21h-9a2.25 2.25 0 01-2.25-2.25V9m13.5 0H4.5m16.5 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0v10.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 19.5V9" /></svg>
              <h2 className="text-xl font-semibold text-gray-400 mb-2">No guests found</h2>
              <p className="text-gray-400">Try a different search term.</p>
                    </div>
                  )}
          {searchPerformed && !loading && !error && filteredAttendees.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mt-4 border border-blue-100">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Guest Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendees.map(attendee => (
                    <TableRow key={attendee.id}>
                      <TableCell>{attendee.guest?.name}</TableCell>
                      <TableCell>{attendee.guest?.email}</TableCell>
                      <TableCell>{attendee.guest?.phone}</TableCell>
                      <TableCell>{attendee.guest?.company}</TableCell>
                      <TableCell>{attendee.guest?.jobtitle}</TableCell>
                      <TableCell>{attendee.guest?.gender}</TableCell>
                      <TableCell>{attendee.guest?.country}</TableCell>
                      <TableCell>{attendee.guest_type?.name || attendee.guest_type || '-'}</TableCell>
                      <TableCell>{attendee.checked_in ? 'Checked In' : 'Not Checked In'}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(attendee)}>
                          Edit
                       </Button>
                        <Button size="sm" variant="outline" onClick={() => handlePrintBadge(attendee)} className="ml-2" title="Print Badge">
                      <Printer className="w-4 h-4" />
                    </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
      {/* Hidden badge print area for single badge printing */}
      {showPrintArea && singlePrintAttendee && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: '100vw',
            height: '100vh',
            background: 'white',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #usher-badge-print-area, #usher-badge-print-area * { visibility: visible !important; }
              #usher-badge-print-area { position: absolute !important; left: 0; top: 0; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: white; }
            }
          `}</style>
          <div id="usher-badge-print-area" style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
            <div style={{ width: '100vw', height: '100vh' }}>
              <BadgePrint attendee={singlePrintAttendee} />
            </div>
                  </div>
        </div>
      )}
      {/* Add Attendee Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Attendee</DialogTitle>
            <DialogDescription>
              Enter the details of the new attendee for this event.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAttendee} className="space-y-4 py-4">
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
                      <SelectItem key={`${country}-${idx}`} value={country}>{country}</SelectItem>
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
                      .map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)} disabled={addAttendeeLoading}>Cancel</Button>
              <Button type="submit" disabled={addAttendeeLoading}>
                {addAttendeeLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Guest</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditAttendee} className="space-y-4">
            <Input required placeholder="Name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            <Input required placeholder="Email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
            <Input placeholder="Phone" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            <Input placeholder="Company" value={editForm.company} onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))} />
            <Input placeholder="Job Title" value={editForm.jobtitle} onChange={e => setEditForm(f => ({ ...f, jobtitle: e.target.value }))} />
            <Input placeholder="Gender" value={editForm.gender} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))} />
            <Input placeholder="Country" value={editForm.country} onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))} />
            <Select required value={editForm.guest_type_id} onValueChange={val => setEditForm(f => ({ ...f, guest_type_id: val }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Guest Type" />
              </SelectTrigger>
              <SelectContent>
                {guestTypes.map(gt => (
                  <SelectItem key={gt.id} value={gt.id.toString()}>{gt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 