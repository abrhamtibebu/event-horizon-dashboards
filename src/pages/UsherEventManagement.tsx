import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Users,
  UserPlus,
  Printer,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  MoreHorizontal,
  CheckCircle,
  X,
  Plus,
  FileText,
  QrCode,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import api from '@/lib/api'
import { useReactToPrint } from 'react-to-print'
import BadgePrint from '@/components/Badge'
import BadgeTest from '@/components/BadgeTest'
import {
  getOfficialBadgeTemplate,
  getBadgeTemplates,
} from '@/lib/badgeTemplates'
import { BadgeTemplate } from '@/types/badge'
import dynamic from 'next/dynamic'
import React, { Suspense } from 'react'

const QrReader = React.lazy(() =>
  import('@blackbox-vision/react-qr-reader').then((mod) => ({
    default: mod.QrReader,
  }))
)

export default function UsherEventManagement() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  // Event data
  const [eventData, setEventData] = useState<any>(null)
  const [eventLoading, setEventLoading] = useState(true)
  const [eventError, setEventError] = useState<string | null>(null)

  // Attendees
  const [attendees, setAttendees] = useState<any[]>([])
  const [attendeesLoading, setAttendeesLoading] = useState(true)
  const [attendeesError, setAttendeesError] = useState<string | null>(null)
  const [guestTypes, setGuestTypes] = useState<any[]>([])

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [guestTypeFilter, setGuestTypeFilter] = useState('all')
  const [checkedInFilter, setCheckedInFilter] = useState('all')

  // Selected attendees for batch operations
  const [selectedAttendees, setSelectedAttendees] = useState<Set<number>>(
    new Set()
  )

  // Add attendee dialog
  const [addAttendeeDialogOpen, setAddAttendeeDialogOpen] = useState(false)
  const [addAttendeeForm, setAddAttendeeForm] = useState<any>({
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

  // Badge printing
  const [badgeTemplate, setBadgeTemplate] = useState<BadgeTemplate | null>(null)
  const [singlePrintAttendee, setSinglePrintAttendee] = useState<any>(null)
  const [printing, setPrinting] = useState(false)
  const [showTestBadge, setShowTestBadge] = useState(false)
  const [testAttendee, setTestAttendee] = useState<any>(null)

  // QR Check-In state
  const [qrScanResult, setQrScanResult] = useState<string | null>(null)
  const [qrScanStatus, setQrScanStatus] = useState<string | null>(null)
  const [qrScannerOpen, setQrScannerOpen] = useState(false)

  const singlePrintRef = useRef<HTMLDivElement>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const handleSinglePrint = useReactToPrint({
    content: () => singlePrintRef.current,
    onAfterPrint: () => {
      setSinglePrintAttendee(null)
      if (singlePrintRef.current) {
        singlePrintRef.current.style.visibility = 'hidden'
      }
    },
    onPrintError: (error) => {
      console.error('Single print error:', error)
      toast({
        title: 'Print Error',
        description: 'Failed to print badge. Please try again.',
        variant: 'destructive',
      })
      setSinglePrintAttendee(null)
      if (singlePrintRef.current) {
        singlePrintRef.current.style.visibility = 'hidden'
      }
    },
    removeAfterPrint: true,
    suppressErrors: false,
  })

  const handlePrintBadges = useReactToPrint({
    content: () => printRef.current,
    onAfterPrint: () => {
      setPrinting(false)
      if (printRef.current) {
        printRef.current.style.visibility = 'hidden'
      }
    },
    onPrintError: (error) => {
      console.error('Batch print error:', error)
      toast({
        title: 'Print Error',
        description: 'Failed to print badges. Please try again.',
        variant: 'destructive',
      })
      setPrinting(false)
      if (printRef.current) {
        printRef.current.style.visibility = 'hidden'
      }
    },
    removeAfterPrint: true,
    suppressErrors: false,
  })

  // Fetch event data
  useEffect(() => {
    if (!eventId) return

    const fetchEventData = async () => {
      try {
        setEventLoading(true)
        const response = await api.get(`/events/${eventId}`)
        setEventData(response.data)
        setEventError(null)
      } catch (err: any) {
        setEventError(err.response?.data?.error || 'Failed to fetch event data')
        console.error(err)
      } finally {
        setEventLoading(false)
      }
    }

    fetchEventData()
  }, [eventId])

  // Fetch attendees
  useEffect(() => {
    if (!eventId) return

    const fetchAttendees = async () => {
      try {
        setAttendeesLoading(true)
        const response = await api.get(`/events/${eventId}/attendees`)
        setAttendees(response.data)
        setAttendeesError(null)
      } catch (err: any) {
        setAttendeesError(
          err.response?.data?.error || 'Failed to fetch attendees'
        )
        console.error(err)
      } finally {
        setAttendeesLoading(false)
      }
    }

    fetchAttendees()
  }, [eventId])

  // Fetch guest types
  useEffect(() => {
    if (!eventId) return

    const fetchGuestTypes = async () => {
      try {
        const response = await api.get(`/events/${eventId}/guest-types`)
        setGuestTypes(response.data)
      } catch (err) {
        console.error('Failed to fetch guest types:', err)
      }
    }

    fetchGuestTypes()
  }, [eventId])

  // Fetch badge template
  useEffect(() => {
    if (!eventId) return

    const fetchBadgeTemplate = async () => {
      try {
        // First try to get the official template
        const response = await getOfficialBadgeTemplate(Number(eventId))
        setBadgeTemplate(response.data)
      } catch (err) {
        try {
          // If no official template, try to get any template
          const response = await getBadgeTemplates(Number(eventId))
          if (Array.isArray(response.data) && response.data.length > 0) {
            setBadgeTemplate(response.data[0])
          }
        } catch (err2) {
          console.error('Failed to fetch badge template:', err2)
        }
      }
    }

    fetchBadgeTemplate()
  }, [eventId])

  // Handle add attendee form input changes
  const handleAddAttendeeInput = (field: string, value: string) => {
    setAddAttendeeForm((prev) => ({ ...prev, [field]: value }))
  }

  // Handle add attendee submission
  const handleAddAttendee = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddAttendeeLoading(true)

    const payload = {
      ...addAttendeeForm,
      name: `${addAttendeeForm.first_name} ${addAttendeeForm.last_name}`.trim(),
    }

    try {
      const response = await api.post(`/events/${eventId}/attendees`, payload)
      const newAttendee = response.data

      setAttendees((prevAttendees) => [...prevAttendees, newAttendee])

      toast({
        title: 'Success',
        description: 'Attendee added successfully!',
      })
      setAddAttendeeDialogOpen(false)
      setAddAttendeeForm({
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
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.error) {
        toast({
          title: 'Error',
          description: err.response.data.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: err.response?.data?.error || 'Failed to add attendee',
          variant: 'destructive',
        })
      }
    } finally {
      setAddAttendeeLoading(false)
    }
  }

  // Handle attendee selection
  const handleAttendeeSelection = (attendeeId: number, checked: boolean) => {
    setSelectedAttendees((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(attendeeId)
      } else {
        newSet.delete(attendeeId)
      }
      return newSet
    })
  }

  // Handle select all attendees
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAttendees(new Set(attendees.map((a) => a.id)))
    } else {
      setSelectedAttendees(new Set())
    }
  }

  // Filter attendees
  const filteredAttendees = attendees.filter((attendee) => {
    const matchesSearch =
      !searchTerm ||
      attendee.guest?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.guest?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.guest?.company?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesGuestType =
      guestTypeFilter === 'all' ||
      attendee.guest_type_id?.toString() === guestTypeFilter

    const matchesCheckIn =
      checkedInFilter === 'all' ||
      (checkedInFilter === 'checked-in' && attendee.checked_in) ||
      (checkedInFilter === 'not-checked-in' && !attendee.checked_in)

    return matchesSearch && matchesGuestType && matchesCheckIn
  })

  // Validate badge template
  const validateBadgeTemplate = (template: BadgeTemplate | null): boolean => {
    if (!template) {
      toast({
        title: 'Error',
        description:
          'No badge template available. Please create a badge template first.',
        variant: 'destructive',
      })
      return false
    }

    if (!template.template_json) {
      toast({
        title: 'Error',
        description: 'Badge template is invalid. Please recreate the template.',
        variant: 'destructive',
      })
      return false
    }

    const templateData = template.template_json
    if (!templateData.front && !templateData.back) {
      toast({
        title: 'Error',
        description:
          'Badge template is missing design elements. Please recreate the template.',
        variant: 'destructive',
      })
      return false
    }

    return true
  }

  // Generate single badge
  const generateBadge = (attendee: any) => {
    if (!validateBadgeTemplate(badgeTemplate)) {
      return
    }

    if (!attendee || !attendee.guest) {
      toast({
        title: 'Error',
        description: 'Invalid attendee data. Please try again.',
        variant: 'destructive',
      })
      return
    }

    setSinglePrintAttendee(attendee)

    setTimeout(() => {
      if (singlePrintRef.current) {
        const badgeElement = singlePrintRef.current.querySelector(
          '.printable-badge-batch'
        )
        if (badgeElement && badgeElement.children.length > 0) {
          singlePrintRef.current.style.visibility = 'visible'
          handleSinglePrint()
        } else {
          toast({
            title: 'Error',
            description: 'Failed to generate badge. Please try again.',
            variant: 'destructive',
          })
          setSinglePrintAttendee(null)
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to generate badge. Please try again.',
          variant: 'destructive',
        })
        setSinglePrintAttendee(null)
      }
    }, 1500)
  }

  // Test badge
  const testBadge = (attendee: any) => {
    setTestAttendee(attendee)
    setShowTestBadge(true)
  }

  // Handle batch print badges
  const handleBatchPrintBadges = () => {
    if (!validateBadgeTemplate(badgeTemplate)) {
      return
    }
    if (selectedAttendees.size === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one attendee to print badges for.',
        variant: 'destructive',
      })
      return
    }

    const selectedAttendeeList = attendees.filter((attendee) =>
      selectedAttendees.has(attendee.id)
    )
    const invalidAttendees = selectedAttendeeList.filter(
      (attendee) => !attendee.guest
    )

    if (invalidAttendees.length > 0) {
      toast({
        title: 'Error',
        description: `${invalidAttendees.length} attendees have invalid data. Please check and try again.`,
        variant: 'destructive',
      })
      return
    }

    setPrinting(true)

    setTimeout(() => {
      if (printRef.current) {
        const badgeElements = printRef.current.querySelectorAll(
          '.printable-badge-batch'
        )
        if (badgeElements.length > 0) {
          printRef.current.style.visibility = 'visible'
          handlePrintBadges()
        } else {
          toast({
            title: 'Error',
            description: 'Failed to print badges. Please try again.',
            variant: 'destructive',
          })
          setPrinting(false)
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to print badges. Please try again.',
          variant: 'destructive',
        })
        setPrinting(false)
      }
    }, 1500)
  }

  // Handler for QR scan
  const handleQrScan = async (data: string | null) => {
    if (data) {
      setQrScanResult(data)
      // Try to match QR data to an attendee (assume QR contains attendee ID or email)
      let attendee = attendees.find(
        (a) => a.qr_code === data || a.guest?.email === data
      )
      if (!attendee) {
        setQrScanStatus('No matching attendee found for this QR code.')
        return
      }
      // Mark as checked in
      try {
        await api.post(`/events/${eventId}/attendees/${attendee.id}/check-in`, {
          checked_in: true,
        })
        setQrScanStatus(`Checked in: ${attendee.guest?.name || attendee.id}`)
        // Update local state
        setAttendees((prev) =>
          prev.map((a) =>
            a.id === attendee.id ? { ...a, checked_in: true } : a
          )
        )
      } catch (err) {
        setQrScanStatus('Failed to check in attendee. Please try again.')
      }
    }
  }
  const handleQrError = (err: any) => {
    setQrScanStatus('QR scanner error. Please try again.')
  }

  if (eventLoading)
    return <div className="p-8 text-center">Loading event...</div>
  if (eventError)
    return <div className="p-8 text-center text-red-500">{eventError}</div>
  if (!eventData) return <div className="p-8 text-center">Event not found.</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{eventData.name}</h1>
          <p className="text-gray-600 mt-1">Event Management for Ushers</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      {/* Event Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Event Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Date</Label>
              <p className="text-sm">
                {new Date(eventData.start_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">
                Location
              </Label>
              <p className="text-sm">{eventData.location}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">
                Total Attendees
              </Label>
              <p className="text-sm">{attendees.length}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">
                Status
              </Label>
              <Badge
                variant={
                  eventData.status === 'active' ? 'default' : 'secondary'
                }
              >
                {eventData.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="attendees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
          <TabsTrigger value="registration">Registration</TabsTrigger>
          <TabsTrigger value="badges">Badge Printing</TabsTrigger>
          <TabsTrigger value="onsite-checkin">
            Onsite Check-In & Walk-In Handling
          </TabsTrigger>
        </TabsList>

        {/* Attendees Tab */}
        <TabsContent value="attendees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Attendees ({attendees.length})
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleBatchPrintBadges}
                    disabled={selectedAttendees.size === 0 || !badgeTemplate}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Badges ({selectedAttendees.size})
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="mb-4 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by name, email, company..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={guestTypeFilter}
                  onValueChange={setGuestTypeFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Guest Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {guestTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={checkedInFilter}
                  onValueChange={setCheckedInFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Check-in Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="checked-in">Checked In</SelectItem>
                    <SelectItem value="not-checked-in">
                      Not Checked In
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Attendees Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedAttendees.size === attendees.length &&
                            attendees.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Guest Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendeesLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading attendees...
                        </TableCell>
                      </TableRow>
                    ) : attendeesError ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-red-500"
                        >
                          {attendeesError}
                        </TableCell>
                      </TableRow>
                    ) : filteredAttendees.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-gray-500"
                        >
                          No attendees found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAttendees.map((attendee) => (
                        <TableRow key={attendee.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedAttendees.has(attendee.id)}
                              onCheckedChange={(checked) =>
                                handleAttendeeSelection(
                                  attendee.id,
                                  checked as boolean
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {attendee.guest?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {attendee.guest?.email || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {attendee.guest?.company || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {attendee.guestType?.name || attendee.guest_type || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                attendee.checked_in ? 'default' : 'secondary'
                              }
                              className={
                                attendee.checked_in
                                  ? 'bg-green-100 text-green-800'
                                  : ''
                              }
                            >
                              {attendee.checked_in
                                ? 'Checked In'
                                : 'Registered'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => generateBadge(attendee)}
                                disabled={!badgeTemplate}
                                title="Print badge"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => testBadge(attendee)}
                                disabled={!badgeTemplate}
                                title="Preview badge"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Registration Tab */}
        <TabsContent value="registration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Register New Attendee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setAddAttendeeDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Attendee
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badge Printing Tab */}
        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Badge Printing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant={badgeTemplate ? 'default' : 'secondary'}>
                    {badgeTemplate ? 'Template Available' : 'No Template'}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {badgeTemplate
                      ? badgeTemplate.name
                      : 'No badge template found for this event'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Single Badge</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Print individual badges for specific attendees
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={!badgeTemplate}
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Print Single Badge
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Batch Printing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Print multiple badges for selected attendees
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleBatchPrintBadges}
                        disabled={
                          selectedAttendees.size === 0 || !badgeTemplate
                        }
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Print Selected ({selectedAttendees.size})
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onsite Check-In Tab */}
        <TabsContent value="onsite-checkin">
          <DashboardCard title="Onsite Check-In & Walk-In Handling">
            <div className="mb-6">
              <h4 className="font-semibold mb-2">QR Code Check-In</h4>
              <Button
                onClick={() => setQrScannerOpen((v) => !v)}
                variant="outline"
              >
                {qrScannerOpen ? 'Close Scanner' : 'Open QR Scanner'}
              </Button>
              {qrScannerOpen && (
                <div className="my-4">
                  <Suspense fallback={<div>Loading QR scanner...</div>}>
                    <QrReader
                      delay={300}
                      onError={handleQrError}
                      onScan={handleQrScan}
                      style={{ width: '100%' }}
                    />
                  </Suspense>
                  {qrScanStatus && (
                    <div className="mt-2 text-sm text-blue-700">
                      {qrScanStatus}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Manual Check-In */}
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Manual Check-In</h4>
              <Input
                type="search"
                placeholder="Search by name, email, or company..."
                className="mb-3 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="max-h-72 overflow-y-auto border rounded bg-gray-50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendees
                      .filter((a) => {
                        const q = searchTerm.toLowerCase()
                        return (
                          a.guest?.name?.toLowerCase().includes(q) ||
                          a.guest?.email?.toLowerCase().includes(q) ||
                          a.guest?.company?.toLowerCase().includes(q)
                        )
                      })
                      .map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.guest?.name}</TableCell>
                          <TableCell>{a.guest?.email}</TableCell>
                          <TableCell>{a.guest?.company}</TableCell>
                          <TableCell>
                            {a.checked_in ? (
                              <span className="text-green-600 font-semibold">
                                Present
                              </span>
                            ) : (
                              <span className="text-gray-400">Absent</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {a.checked_in ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  await api.post(
                                    `/events/${eventId}/attendees/${a.id}/check-in`,
                                    { checked_in: false }
                                  )
                                  setAttendees((prev) =>
                                    prev.map((att) =>
                                      att.id === a.id
                                        ? { ...att, checked_in: false }
                                        : att
                                    )
                                  )
                                }}
                              >
                                Mark Absent
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={async () => {
                                  await api.post(
                                    `/events/${eventId}/attendees/${a.id}/check-in`,
                                    { checked_in: true }
                                  )
                                  setAttendees((prev) =>
                                    prev.map((att) =>
                                      att.id === a.id
                                        ? { ...att, checked_in: true }
                                        : att
                                    )
                                  )
                                }}
                              >
                                Mark Present
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Walk-In Registration */}
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Walk-In Registration</h4>
              <form
                className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded border"
                onSubmit={async (e) => {
                  e.preventDefault()
                  setAddAttendeeLoading(true)
                  try {
                    const payload = {
                      ...addAttendeeForm,
                      name: `${addAttendeeForm.first_name} ${addAttendeeForm.last_name}`.trim(),
                    }
                    const response = await api.post(
                      `/events/${eventId}/attendees`,
                      payload
                    )
                    const newAttendee = response.data
                    setAttendees((prev) => [...prev, newAttendee])
                    setAddAttendeeForm({
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
                    setAddAttendeeDialogOpen(false)
                    setSinglePrintAttendee(newAttendee)
                    setTimeout(() => {
                      if (singlePrintRef.current) {
                        singlePrintRef.current.style.visibility = 'visible'
                        handleSinglePrint()
                      }
                    }, 500)
                    toast({
                      title: 'Walk-in registered!',
                      description:
                        'Badge is printing and attendee list updated.',
                      variant: 'success',
                    })
                  } catch (err: any) {
                    toast({
                      title: 'Failed to register walk-in',
                      description:
                        err.response?.data?.error || 'Please try again.',
                      variant: 'destructive',
                    })
                  } finally {
                    setAddAttendeeLoading(false)
                  }
                }}
              >
                <Input
                  placeholder="First Name"
                  value={addAttendeeForm.first_name}
                  onChange={(e) =>
                    setAddAttendeeForm((f: any) => ({
                      ...f,
                      first_name: e.target.value,
                    }))
                  }
                  required
                />
                <Input
                  placeholder="Last Name"
                  value={addAttendeeForm.last_name}
                  onChange={(e) =>
                    setAddAttendeeForm((f: any) => ({
                      ...f,
                      last_name: e.target.value,
                    }))
                  }
                  required
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={addAttendeeForm.email}
                  onChange={(e) =>
                    setAddAttendeeForm((f: any) => ({
                      ...f,
                      email: e.target.value,
                    }))
                  }
                  required
                />
                <Input
                  placeholder="Phone"
                  value={addAttendeeForm.phone}
                  onChange={(e) =>
                    setAddAttendeeForm((f: any) => ({
                      ...f,
                      phone: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Company"
                  value={addAttendeeForm.company}
                  onChange={(e) =>
                    setAddAttendeeForm((f: any) => ({
                      ...f,
                      company: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Job Title"
                  value={addAttendeeForm.jobtitle}
                  onChange={(e) =>
                    setAddAttendeeForm((f: any) => ({
                      ...f,
                      jobtitle: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Gender"
                  value={addAttendeeForm.gender}
                  onChange={(e) =>
                    setAddAttendeeForm((f: any) => ({
                      ...f,
                      gender: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Country"
                  value={addAttendeeForm.country}
                  onChange={(e) =>
                    setAddAttendeeForm((f: any) => ({
                      ...f,
                      country: e.target.value,
                    }))
                  }
                />
                <Select
                  value={addAttendeeForm.guest_type_id}
                  onValueChange={(value) =>
                    setAddAttendeeForm((f: any) => ({
                      ...f,
                      guest_type_id: value,
                    }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Guest Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {guestTypes.map((type: any) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="submit"
                  className="col-span-1 md:col-span-2 mt-2"
                  disabled={addAttendeeLoading}
                >
                  {addAttendeeLoading
                    ? 'Registering...'
                    : 'Register & Print Badge'}
                </Button>
              </form>
            </div>
          </DashboardCard>
        </TabsContent>
      </Tabs>

      {/* Add Attendee Dialog */}
      <Dialog
        open={addAttendeeDialogOpen}
        onOpenChange={setAddAttendeeDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Attendee</DialogTitle>
            <DialogDescription>
              Enter the details of the new attendee for {eventData.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAttendee} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={addAttendeeForm.first_name}
                  onChange={(e) =>
                    handleAddAttendeeInput('first_name', e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={addAttendeeForm.last_name}
                  onChange={(e) =>
                    handleAddAttendeeInput('last_name', e.target.value)
                  }
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
                  value={addAttendeeForm.email}
                  onChange={(e) =>
                    handleAddAttendeeInput('email', e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={addAttendeeForm.phone}
                  onChange={(e) =>
                    handleAddAttendeeInput('phone', e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={addAttendeeForm.company}
                  onChange={(e) =>
                    handleAddAttendeeInput('company', e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="jobtitle">Job Title</Label>
                <Input
                  id="jobtitle"
                  value={addAttendeeForm.jobtitle}
                  onChange={(e) =>
                    handleAddAttendeeInput('jobtitle', e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  onValueChange={(value) =>
                    handleAddAttendeeInput('gender', value)
                  }
                  value={addAttendeeForm.gender}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="Prefer not to say">
                      Prefer not to say
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Select
                  onValueChange={(value) =>
                    handleAddAttendeeInput('country', value)
                  }
                  value={addAttendeeForm.country}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Afghanistan">Afghanistan</SelectItem>
                    <SelectItem value="Albania">Albania</SelectItem>
                    <SelectItem value="Algeria">Algeria</SelectItem>
                    <SelectItem value="Andorra">Andorra</SelectItem>
                    <SelectItem value="Angola">Angola</SelectItem>
                    <SelectItem value="Antigua and Barbuda">
                      Antigua and Barbuda
                    </SelectItem>
                    <SelectItem value="Argentina">Argentina</SelectItem>
                    <SelectItem value="Armenia">Armenia</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="Austria">Austria</SelectItem>
                    <SelectItem value="Azerbaijan">Azerbaijan</SelectItem>
                    <SelectItem value="Bahamas">Bahamas</SelectItem>
                    <SelectItem value="Bahrain">Bahrain</SelectItem>
                    <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                    <SelectItem value="Barbados">Barbados</SelectItem>
                    <SelectItem value="Belarus">Belarus</SelectItem>
                    <SelectItem value="Belgium">Belgium</SelectItem>
                    <SelectItem value="Belize">Belize</SelectItem>
                    <SelectItem value="Benin">Benin</SelectItem>
                    <SelectItem value="Bhutan">Bhutan</SelectItem>
                    <SelectItem value="Bolivia">Bolivia</SelectItem>
                    <SelectItem value="Bosnia and Herzegovina">
                      Bosnia and Herzegovina
                    </SelectItem>
                    <SelectItem value="Botswana">Botswana</SelectItem>
                    <SelectItem value="Brazil">Brazil</SelectItem>
                    <SelectItem value="Brunei">Brunei</SelectItem>
                    <SelectItem value="Bulgaria">Bulgaria</SelectItem>
                    <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                    <SelectItem value="Burundi">Burundi</SelectItem>
                    <SelectItem value="Cabo Verde">Cabo Verde</SelectItem>
                    <SelectItem value="Cambodia">Cambodia</SelectItem>
                    <SelectItem value="Cameroon">Cameroon</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Central African Republic">
                      Central African Republic
                    </SelectItem>
                    <SelectItem value="Chad">Chad</SelectItem>
                    <SelectItem value="Chile">Chile</SelectItem>
                    <SelectItem value="China">China</SelectItem>
                    <SelectItem value="Colombia">Colombia</SelectItem>
                    <SelectItem value="Comoros">Comoros</SelectItem>
                    <SelectItem value="Congo">Congo</SelectItem>
                    <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                    <SelectItem value="Croatia">Croatia</SelectItem>
                    <SelectItem value="Cuba">Cuba</SelectItem>
                    <SelectItem value="Cyprus">Cyprus</SelectItem>
                    <SelectItem value="Czech Republic">
                      Czech Republic
                    </SelectItem>
                    <SelectItem value="Democratic Republic of the Congo">
                      Democratic Republic of the Congo
                    </SelectItem>
                    <SelectItem value="Denmark">Denmark</SelectItem>
                    <SelectItem value="Djibouti">Djibouti</SelectItem>
                    <SelectItem value="Dominica">Dominica</SelectItem>
                    <SelectItem value="Dominican Republic">
                      Dominican Republic
                    </SelectItem>
                    <SelectItem value="Ecuador">Ecuador</SelectItem>
                    <SelectItem value="Egypt">Egypt</SelectItem>
                    <SelectItem value="El Salvador">El Salvador</SelectItem>
                    <SelectItem value="Equatorial Guinea">
                      Equatorial Guinea
                    </SelectItem>
                    <SelectItem value="Eritrea">Eritrea</SelectItem>
                    <SelectItem value="Estonia">Estonia</SelectItem>
                    <SelectItem value="Eswatini">Eswatini</SelectItem>
                    <SelectItem value="Ethiopia">Ethiopia</SelectItem>
                    <SelectItem value="Fiji">Fiji</SelectItem>
                    <SelectItem value="Finland">Finland</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Gabon">Gabon</SelectItem>
                    <SelectItem value="Gambia">Gambia</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="Ghana">Ghana</SelectItem>
                    <SelectItem value="Greece">Greece</SelectItem>
                    <SelectItem value="Grenada">Grenada</SelectItem>
                    <SelectItem value="Guatemala">Guatemala</SelectItem>
                    <SelectItem value="Guinea">Guinea</SelectItem>
                    <SelectItem value="Guinea-Bissau">Guinea-Bissau</SelectItem>
                    <SelectItem value="Guyana">Guyana</SelectItem>
                    <SelectItem value="Haiti">Haiti</SelectItem>
                    <SelectItem value="Honduras">Honduras</SelectItem>
                    <SelectItem value="Hungary">Hungary</SelectItem>
                    <SelectItem value="Iceland">Iceland</SelectItem>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="Indonesia">Indonesia</SelectItem>
                    <SelectItem value="Iran">Iran</SelectItem>
                    <SelectItem value="Iraq">Iraq</SelectItem>
                    <SelectItem value="Ireland">Ireland</SelectItem>
                    <SelectItem value="Israel">Israel</SelectItem>
                    <SelectItem value="Italy">Italy</SelectItem>
                    <SelectItem value="Jamaica">Jamaica</SelectItem>
                    <SelectItem value="Japan">Japan</SelectItem>
                    <SelectItem value="Jordan">Jordan</SelectItem>
                    <SelectItem value="Kazakhstan">Kazakhstan</SelectItem>
                    <SelectItem value="Kenya">Kenya</SelectItem>
                    <SelectItem value="Kiribati">Kiribati</SelectItem>
                    <SelectItem value="Kuwait">Kuwait</SelectItem>
                    <SelectItem value="Kyrgyzstan">Kyrgyzstan</SelectItem>
                    <SelectItem value="Laos">Laos</SelectItem>
                    <SelectItem value="Latvia">Latvia</SelectItem>
                    <SelectItem value="Lebanon">Lebanon</SelectItem>
                    <SelectItem value="Lesotho">Lesotho</SelectItem>
                    <SelectItem value="Liberia">Liberia</SelectItem>
                    <SelectItem value="Libya">Libya</SelectItem>
                    <SelectItem value="Liechtenstein">Liechtenstein</SelectItem>
                    <SelectItem value="Lithuania">Lithuania</SelectItem>
                    <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                    <SelectItem value="Madagascar">Madagascar</SelectItem>
                    <SelectItem value="Malawi">Malawi</SelectItem>
                    <SelectItem value="Malaysia">Malaysia</SelectItem>
                    <SelectItem value="Maldives">Maldives</SelectItem>
                    <SelectItem value="Mali">Mali</SelectItem>
                    <SelectItem value="Malta">Malta</SelectItem>
                    <SelectItem value="Marshall Islands">
                      Marshall Islands
                    </SelectItem>
                    <SelectItem value="Mauritania">Mauritania</SelectItem>
                    <SelectItem value="Mauritius">Mauritius</SelectItem>
                    <SelectItem value="Mexico">Mexico</SelectItem>
                    <SelectItem value="Micronesia">Micronesia</SelectItem>
                    <SelectItem value="Moldova">Moldova</SelectItem>
                    <SelectItem value="Monaco">Monaco</SelectItem>
                    <SelectItem value="Mongolia">Mongolia</SelectItem>
                    <SelectItem value="Montenegro">Montenegro</SelectItem>
                    <SelectItem value="Morocco">Morocco</SelectItem>
                    <SelectItem value="Mozambique">Mozambique</SelectItem>
                    <SelectItem value="Myanmar">Myanmar</SelectItem>
                    <SelectItem value="Namibia">Namibia</SelectItem>
                    <SelectItem value="Nauru">Nauru</SelectItem>
                    <SelectItem value="Nepal">Nepal</SelectItem>
                    <SelectItem value="Netherlands">Netherlands</SelectItem>
                    <SelectItem value="New Zealand">New Zealand</SelectItem>
                    <SelectItem value="Nicaragua">Nicaragua</SelectItem>
                    <SelectItem value="Niger">Niger</SelectItem>
                    <SelectItem value="Nigeria">Nigeria</SelectItem>
                    <SelectItem value="North Korea">North Korea</SelectItem>
                    <SelectItem value="North Macedonia">
                      North Macedonia
                    </SelectItem>
                    <SelectItem value="Norway">Norway</SelectItem>
                    <SelectItem value="Oman">Oman</SelectItem>
                    <SelectItem value="Pakistan">Pakistan</SelectItem>
                    <SelectItem value="Palau">Palau</SelectItem>
                    <SelectItem value="Panama">Panama</SelectItem>
                    <SelectItem value="Papua New Guinea">
                      Papua New Guinea
                    </SelectItem>
                    <SelectItem value="Paraguay">Paraguay</SelectItem>
                    <SelectItem value="Peru">Peru</SelectItem>
                    <SelectItem value="Philippines">Philippines</SelectItem>
                    <SelectItem value="Poland">Poland</SelectItem>
                    <SelectItem value="Portugal">Portugal</SelectItem>
                    <SelectItem value="Qatar">Qatar</SelectItem>
                    <SelectItem value="Romania">Romania</SelectItem>
                    <SelectItem value="Russia">Russia</SelectItem>
                    <SelectItem value="Rwanda">Rwanda</SelectItem>
                    <SelectItem value="Saint Kitts and Nevis">
                      Saint Kitts and Nevis
                    </SelectItem>
                    <SelectItem value="Saint Lucia">Saint Lucia</SelectItem>
                    <SelectItem value="Saint Vincent and the Grenadines">
                      Saint Vincent and the Grenadines
                    </SelectItem>
                    <SelectItem value="Samoa">Samoa</SelectItem>
                    <SelectItem value="San Marino">San Marino</SelectItem>
                    <SelectItem value="Sao Tome and Principe">
                      Sao Tome and Principe
                    </SelectItem>
                    <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                    <SelectItem value="Senegal">Senegal</SelectItem>
                    <SelectItem value="Serbia">Serbia</SelectItem>
                    <SelectItem value="Seychelles">Seychelles</SelectItem>
                    <SelectItem value="Sierra Leone">Sierra Leone</SelectItem>
                    <SelectItem value="Singapore">Singapore</SelectItem>
                    <SelectItem value="Slovakia">Slovakia</SelectItem>
                    <SelectItem value="Slovenia">Slovenia</SelectItem>
                    <SelectItem value="Solomon Islands">
                      Solomon Islands
                    </SelectItem>
                    <SelectItem value="Somalia">Somalia</SelectItem>
                    <SelectItem value="South Africa">South Africa</SelectItem>
                    <SelectItem value="South Korea">South Korea</SelectItem>
                    <SelectItem value="South Sudan">South Sudan</SelectItem>
                    <SelectItem value="Spain">Spain</SelectItem>
                    <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                    <SelectItem value="Sudan">Sudan</SelectItem>
                    <SelectItem value="Suriname">Suriname</SelectItem>
                    <SelectItem value="Sweden">Sweden</SelectItem>
                    <SelectItem value="Switzerland">Switzerland</SelectItem>
                    <SelectItem value="Syria">Syria</SelectItem>
                    <SelectItem value="Taiwan">Taiwan</SelectItem>
                    <SelectItem value="Tajikistan">Tajikistan</SelectItem>
                    <SelectItem value="Tanzania">Tanzania</SelectItem>
                    <SelectItem value="Thailand">Thailand</SelectItem>
                    <SelectItem value="Timor-Leste">Timor-Leste</SelectItem>
                    <SelectItem value="Togo">Togo</SelectItem>
                    <SelectItem value="Tonga">Tonga</SelectItem>
                    <SelectItem value="Trinidad and Tobago">
                      Trinidad and Tobago
                    </SelectItem>
                    <SelectItem value="Tunisia">Tunisia</SelectItem>
                    <SelectItem value="Turkey">Turkey</SelectItem>
                    <SelectItem value="Turkmenistan">Turkmenistan</SelectItem>
                    <SelectItem value="Tuvalu">Tuvalu</SelectItem>
                    <SelectItem value="Uganda">Uganda</SelectItem>
                    <SelectItem value="Ukraine">Ukraine</SelectItem>
                    <SelectItem value="United Arab Emirates">
                      United Arab Emirates
                    </SelectItem>
                    <SelectItem value="United Kingdom">
                      United Kingdom
                    </SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Uruguay">Uruguay</SelectItem>
                    <SelectItem value="Uzbekistan">Uzbekistan</SelectItem>
                    <SelectItem value="Vanuatu">Vanuatu</SelectItem>
                    <SelectItem value="Vatican City">Vatican City</SelectItem>
                    <SelectItem value="Venezuela">Venezuela</SelectItem>
                    <SelectItem value="Vietnam">Vietnam</SelectItem>
                    <SelectItem value="Yemen">Yemen</SelectItem>
                    <SelectItem value="Zambia">Zambia</SelectItem>
                    <SelectItem value="Zimbabwe">Zimbabwe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="guest_type_id">Guest Type</Label>
              <Select
                onValueChange={(value) =>
                  handleAddAttendeeInput('guest_type_id', value)
                }
                value={addAttendeeForm.guest_type_id}
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddAttendeeDialogOpen(false)}
                disabled={addAttendeeLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addAttendeeLoading}>
                {addAttendeeLoading ? 'Adding...' : 'Add Attendee'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hidden single badge print area */}
      <div
        ref={singlePrintRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          visibility: 'hidden',
          zIndex: -1,
          width: '100%',
          height: '100%',
        }}
        className="printable-badge-container"
      >
        {singlePrintAttendee && (
          <div className="printable-badge-batch">
            <BadgePrint
              template={badgeTemplate}
              attendee={singlePrintAttendee}
            />
          </div>
        )}
      </div>

      {/* Hidden batch badge print area */}
      <div
        ref={printRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          visibility: 'hidden',
          zIndex: -1,
          width: '100%',
          height: '100%',
        }}
        className="printable-badge-container"
      >
        {printing &&
          attendees
            .filter((attendee) => selectedAttendees.has(attendee.id))
            .map((attendee) => (
              <div key={attendee.id} className="printable-badge-batch">
                <BadgePrint template={badgeTemplate} attendee={attendee} />
              </div>
            ))}
      </div>

      {/* Test badge display */}
      {showTestBadge && testAttendee && (
        <Dialog open={showTestBadge} onOpenChange={setShowTestBadge}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Badge Preview</DialogTitle>
              <DialogDescription>
                This is a preview of how the badge will look when printed.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center">
              <BadgeTest attendee={testAttendee} template={badgeTemplate} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTestBadge(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowTestBadge(false)
                  generateBadge(testAttendee)
                }}
              >
                Print Badge
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
