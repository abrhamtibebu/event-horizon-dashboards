import { useState, useEffect, useRef } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import {
  Calendar,
  Users,
  MapPin,
  Clock,
  Mail,
  Phone,
  MessageSquare,
  Download,
  Printer,
  QrCode,
  UserPlus,
  Plus,
  Edit,
  Settings,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  MoreHorizontal,
  Send,
  FileText,
  BarChart3,
  Upload,
  Star,
  Shield,
  Award,
  Tag,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DashboardCard } from '@/components/DashboardCard'
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
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import api, { getUshers } from '@/lib/api'
import { format, parseISO } from 'date-fns'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { Checkbox } from '@/components/ui/checkbox'
import Papa from 'papaparse'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import { BadgeDesignerTab } from '@/components/BadgeDesignerTab'
import React from 'react'
import { useReactToPrint } from 'react-to-print'
import BadgePrint from '@/components/Badge'

export default function EventDetails() {
  const { eventId } = useParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [guestTypeFilter, setGuestTypeFilter] = useState('all')
  const [checkedInFilter, setCheckedInFilter] = useState('all')
  const [isAssignUsherDialogOpen, setIsAssignUsherDialogOpen] = useState(false)
  const [isNewConversationDialogOpen, setIsNewConversationDialogOpen] =
    useState(false)
  const [isCommunicationDialogOpen, setIsCommunicationDialogOpen] =
    useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)
  const [editLoading, setEditLoading] = useState(false)
  const editImageInputRef = useRef<HTMLInputElement>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)

  const [eventData, setEventData] = useState<any>(null)
  const [eventLoading, setEventLoading] = useState(true)
  const [eventError, setEventError] = useState<string | null>(null)
  const [attendees, setAttendees] = useState<any[]>([])
  const [attendeesLoading, setAttendeesLoading] = useState(true)
  const [attendeesError, setAttendeesError] = useState<string | null>(null)
  const [guestTypes, setGuestTypes] = useState<any[]>([])

  const { user } = useAuth()

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
  const [selectedAttendees, setSelectedAttendees] = useState<Set<number>>(
    new Set()
  )
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [analytics, setAnalytics] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  const [singlePrintAttendee, setSinglePrintAttendee] = useState<any>(null)
  const singlePrintRef = useRef<HTMLDivElement>(null)
  const handleSinglePrint = useReactToPrint({
    content: () => singlePrintRef.current,
    onAfterPrint: () => setSinglePrintAttendee(null),
  })
  const [printing, setPrinting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const handlePrintBadges = useReactToPrint({
    content: () => printRef.current,
    onAfterPrint: () => setPrinting(false),
  })

  const [users, setUsers] = useState<any[]>([]);
  const [usherAssignments, setUsherAssignments] = useState([
    { usherId: '', tasks: '' }
  ]);
  const [assigningUsher, setAssigningUsher] = useState(false);
  const [createUsherDialogOpen, setCreateUsherDialogOpen] = useState(false);
  const [newUsher, setNewUsher] = useState({ name: '', email: '', password: '' });
  const [creatingUsher, setCreatingUsher] = useState(false);

  // Fetch event details
  useEffect(() => {
    if (!eventId) return
    setEventLoading(true)
    setEventError(null)
    api
      .get(`/events/${eventId}`)
      .then((res) => setEventData(res.data))
      .catch((err) => setEventError('Failed to fetch event details.'))
      .finally(() => setEventLoading(false))
  }, [eventId])

  // Fetch attendees
  useEffect(() => {
    if (!eventId) return
    setAttendeesLoading(true)
    setAttendeesError(null)
    api
      .get(`/events/${eventId}/attendees`)
      .then((res) => setAttendees(res.data))
      .catch((err) => setAttendeesError('Failed to fetch attendees.'))
      .finally(() => setAttendeesLoading(false))
  }, [eventId])

  // Fetch guest types
  useEffect(() => {
    if (!eventId) return
    api
      .get(`/events/${eventId}/guest-types`)
      .then((res) => setGuestTypes(res.data))
      .catch((err) => toast.error('Failed to fetch guest types.'))
  }, [eventId])

  useEffect(() => {
    if (!eventId || activeTab !== 'analytics') return
    setAnalyticsLoading(true)
    setAnalyticsError(null)
    api
      .get(`/events/${eventId}/report`)
      .then((res) => setAnalytics(res.data))
      .catch(() => setAnalyticsError('Failed to fetch analytics.'))
      .finally(() => setAnalyticsLoading(false))
  }, [eventId, activeTab])

  // Fetch all ushers for assigning ushers
  const fetchUsers = () => {
    getUshers()
      .then(res => setUsers(res.data))
      .catch(() => toast.error('Failed to fetch ushers'));
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  if (eventLoading) {
    return <div className="text-center py-12">Loading event details...</div>
  }
  if (eventError || !eventData) {
    return <Navigate to="/dashboard/events" replace />
  }

  const getGuestTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'speaker':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'vip':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'staff':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'visitor':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getGuestTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'speaker':
        return <Star className="w-3 h-3" />
      case 'vip':
        return <Award className="w-3 h-3" />
      case 'staff':
        return <Shield className="w-3 h-3" />
      default:
        return <Users className="w-3 h-3" />
    }
  }

  const filteredAttendees = attendees.filter((attendee) => {
    const matchesSearch =
      attendee.guest?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.guest?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.guest?.company?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGuestType =
      guestTypeFilter === 'all' ||
      attendee.guestType?.name?.toLowerCase() === guestTypeFilter
    const matchesCheckedIn =
      checkedInFilter === 'all' ||
      (checkedInFilter === 'checked-in' && attendee.checked_in) ||
      (checkedInFilter === 'not-checked-in' && !attendee.checked_in)
    return matchesSearch && matchesGuestType && matchesCheckedIn
  })

  const generateBadge = (attendee: (typeof attendees)[0]) => {
    setSinglePrintAttendee(attendee)
    setTimeout(() => {
      handleSinglePrint()
    }, 100)
  }

  const exportCSV = () => {
    if (filteredAttendees.length === 0) {
      toast.info('No attendees to export.')
      return
    }

    const dataToExport = filteredAttendees.map((attendee) => ({
      Name: attendee.guest?.name,
      Email: attendee.guest?.email,
      Company: attendee.guest?.company,
      'Job Title': attendee.guest?.jobtitle,
      'Guest Type': attendee.guestType?.name,
      'Checked In': attendee.checked_in ? 'Yes' : 'No',
      'Check-In Time': attendee.check_in_time
        ? format(parseISO(attendee.check_in_time), 'MMM d, yyyy, h:mm a')
        : 'N/A',
    }))

    const csv = Papa.unparse(dataToExport)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${eventData.name}_attendees.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Attendee data exported successfully.')
  }

  const generateReport = () => {
    toast.success('Event summary report generated')
    // In a real application, this would generate a comprehensive report
  }

  const exportLogs = () => {
    toast.success('Event logs exported')
    // In a real application, this would export audit logs
  }

  const handleSelectAttendee = (id: number) => {
    setSelectedAttendees((prev) => {
      const newSelected = new Set(prev)
      if (newSelected.has(id)) {
        newSelected.delete(id)
      } else {
        newSelected.add(id)
      }
      return newSelected
    })
  }

  const handleSelectAllAttendees = () => {
    if (selectedAttendees.size === filteredAttendees.length) {
      setSelectedAttendees(new Set())
    } else {
      setSelectedAttendees(new Set(filteredAttendees.map((a) => a.id)))
    }
  }

  const handleBatchPrintBadges = () => {
    setPrinting(true)
    setTimeout(() => {
      handlePrintBadges()
    }, 100) // Give time for badges to render
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const requiredHeaders = ['name', 'email', 'guest_type_name']
        const headers = results.meta.fields || []
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h)
        )

        if (missingHeaders.length > 0) {
          toast.error(
            `CSV is missing required headers: ${missingHeaders.join(', ')}`
          )
          setIsImporting(false)
          return
        }

        // Map guest_type_name to guest_type_id
        const guestTypeMap = new Map(
          guestTypes.map((gt) => [gt.name.toLowerCase(), gt.id])
        )
        const attendeesToImport = results.data.map((row: any) => ({
          ...row,
          guest_type_id: guestTypeMap.get(row.guest_type_name?.toLowerCase()),
        }))

        const invalidRows = attendeesToImport.filter((a) => !a.guest_type_id)
        if (invalidRows.length > 0) {
          toast.error(
            `Some rows have invalid Guest Types: ${invalidRows
              .map((r) => r.guest_type_name)
              .join(', ')}. Make sure they match existing guest types.`
          )
          setIsImporting(false)
          return
        }

        try {
          const response = await api.post(
            `/events/${eventId}/attendees/batch`,
            { attendees: attendeesToImport }
          )
          const { created, errors } = response.data

          if (created && created.length > 0) {
            setAttendees((prev) => [...prev, ...created])
            toast.success(`${created.length} attendees imported successfully.`)
          }
          if (errors && errors.length > 0) {
            toast.warning(`${errors.length} attendees failed to import.`, {
              description: `Reasons: ${errors
                .map((e: any) => `${e.email}: ${e.error}`)
                .join('; ')}`,
            })
          }
        } catch (err: any) {
          toast.error(err.response?.data?.error || 'Failed to import CSV.')
        } finally {
          setIsImporting(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      },
      error: () => {
        toast.error('Failed to parse CSV file.')
        setIsImporting(false)
      },
    })
  }

  const openEditDialog = () => {
    setEditForm({ ...eventData })
    setEditImagePreview(
      eventData.event_image
        ? eventData.event_image.startsWith('http')
          ? eventData.event_image
          : `${import.meta.env.VITE_API_BASE_URL || ''}/storage/${
              eventData.event_image
            }`
        : null
    )
    setEditDialogOpen(true)
  }

  const handleEditInput = (field: string, value: any) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleEditFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEditForm((prev: any) => ({ ...prev, event_image: file }))
      const reader = new FileReader()
      reader.onloadend = () => setEditImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveEditImage = () => {
    setEditForm((prev: any) => ({ ...prev, event_image: null }))
    setEditImagePreview(null)
    if (editImageInputRef.current) {
      editImageInputRef.current.value = ''
    }
  }

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditLoading(true)
    try {
      let payload
      let headers = {}
      if (editForm.event_image && editForm.event_image instanceof File) {
        payload = new FormData()
        Object.entries(editForm).forEach(([key, value]) => {
          if (key === 'event_image' && value)
            payload.append('event_image', value)
          else payload.append(key, value as any)
        })
        headers = { 'Content-Type': 'multipart/form-data' }
      } else {
        payload = { ...editForm }
      }
      await api.put(`/events/${eventId}`, payload, { headers })
      toast.success('Event updated successfully!')
      setEditDialogOpen(false)
      // Refresh event details
      const res = await api.get(`/events/${eventId}`)
      setEventData(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update event')
    } finally {
      setEditLoading(false)
    }
  }

  const handleAddAttendeeInput = (field: string, value: any) => {
    setAddAttendeeForm((prev: any) => ({ ...prev, [field]: value }))
  }

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

      toast.success('Attendee added successfully!')
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
      // Show a user-friendly error for duplicate phone/email
      if (err.response?.status === 409 && err.response?.data?.error) {
        toast.error(err.response.data.error)
      } else {
        toast.error(err.response?.data?.error || 'Failed to add attendee')
      }
    } finally {
      setAddAttendeeLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Event Image */}
      {eventData.event_image && (
        <div className="w-full h-64 rounded-lg overflow-hidden mb-4 bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
          <img
            src={
              eventData.event_image.startsWith('http')
                ? eventData.event_image
                : `${import.meta.env.VITE_API_BASE_URL || ''}/storage/${
                    eventData.event_image
                  }`
            }
            alt={eventData.name}
            className="object-cover w-full h-full"
          />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              to="/dashboard/events"
              className="text-yellow-500 hover:text-yellow-600 text-sm"
            >
              ← Back to Events
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{eventData.name}</h1>
          <p className="text-gray-600 mt-1">Event ID: {eventData.id}</p>
          <p className="text-gray-600 mt-1">
            Organized by{' '}
            <span className="font-semibold text-blue-600">
              {user?.organizer?.name || eventData.organizer?.name}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={exportLogs}>
            <FileText className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
          <Button variant="outline" onClick={generateReport}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={openEditDialog}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Event
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          {/* Event Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DashboardCard title="Event Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Date & Time</p>
                        <p className="font-medium">
                          {eventData.start_date &&
                            format(
                              parseISO(eventData.start_date),
                              'MMM d, yyyy, h:mm a'
                            )}{' '}
                          -{' '}
                          {eventData.end_date &&
                            format(
                              parseISO(eventData.end_date),
                              'MMM d, yyyy, h:mm a'
                            )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium">{eventData.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Tag className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Category & Type</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">
                            {eventData.event_category?.name}
                          </Badge>
                          <Badge variant="secondary">
                            {eventData.event_type?.name}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {eventData.description}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Guest Types</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {eventData.guest_types?.map((gt: any) => (
                          <Badge key={gt.id} variant="outline">
                            {gt.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </DashboardCard>
            </div>

            <div className="space-y-4">
              <DashboardCard title="Quick Stats" className="text-center">
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold text-blue-600">
                      {attendees.length}
                    </div>
                    <div className="text-sm text-gray-600">Registered</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">
                      {attendees.filter(a => a.checked_in).length}
                    </div>
                    <div className="text-sm text-gray-600">Checked In</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-600">
                      {eventData.maxGuests}
                    </div>
                    <div className="text-sm text-gray-600">Max Capacity</div>
                  </div>
                </div>
              </DashboardCard>

              <DashboardCard title="Quick Actions">
                <div className="space-y-2">
                  <Dialog
                    open={isAssignUsherDialogOpen}
                    onOpenChange={setIsAssignUsherDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Assign Usher
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign Ushers to Event</DialogTitle>
                        <DialogDescription>
                          Select ushers and assign tasks for this event. You can add multiple ushers.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {usherAssignments.map((assignment, idx) => (
                          <div key={idx} className="flex flex-col gap-2 border-b pb-4 mb-2">
                            <div className="flex items-center gap-2">
                              <Label>Select Usher</Label>
                              <Select
                                value={assignment.usherId}
                                onValueChange={val => {
                                  const updated = [...usherAssignments];
                                  updated[idx].usherId = val;
                                  setUsherAssignments(updated);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose an usher" />
                                </SelectTrigger>
                                <SelectContent>
                                  {users.filter(user => user.role === 'usher').map(user => (
                                    <SelectItem key={user.id} value={String(user.id)}>
                                      {user.name} ({user.email})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button size="icon" variant="ghost" onClick={() => {
                                setUsherAssignments(assignments => assignments.filter((_, i) => i !== idx));
                              }} disabled={usherAssignments.length === 1}>
                                <X className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                            <div>
                              <Label>Assign Tasks</Label>
                              <Textarea
                                placeholder="Enter tasks separated by commas"
                                value={assignment.tasks}
                                onChange={e => {
                                  const updated = [...usherAssignments];
                                  updated[idx].tasks = e.target.value;
                                  setUsherAssignments(updated);
                                }}
                              />
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => setUsherAssignments(assignments => [...assignments, { usherId: '', tasks: '' }])}
                        >
                          + Add Another Usher
                        </Button>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsAssignUsherDialogOpen(false)}
                          disabled={assigningUsher}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="bg-gradient-to-r from-blue-600 to-purple-600"
                          disabled={usherAssignments.some(a => !a.usherId || !a.tasks) || assigningUsher}
                          onClick={async () => {
                            setAssigningUsher(true);
                            try {
                              const ushers = usherAssignments.map(a => ({
                                id: Number(a.usherId),
                                tasks: a.tasks.split(',').map(t => t.trim()).filter(Boolean)
                              }));
                              await api.post(`/events/${eventId}/ushers`, { ushers });
                              toast.success('Ushers assigned successfully!');
                              setIsAssignUsherDialogOpen(false);
                              setUsherAssignments([{ usherId: '', tasks: '' }]);
                            } catch (err) {
                              toast.error('Failed to assign ushers');
                            } finally {
                              setAssigningUsher(false);
                            }
                          }}
                        >
                          {assigningUsher ? 'Assigning...' : 'Assign Ushers'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={isNewConversationDialogOpen}
                    onOpenChange={setIsNewConversationDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        New Conversation
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Start New Conversation</DialogTitle>
                        <DialogDescription>
                          Send a message to attendees or ushers.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Recipients</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select recipients" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all-attendees">
                                All Attendees
                              </SelectItem>
                              <SelectItem value="speakers">
                                Speakers Only
                              </SelectItem>
                              <SelectItem value="vips">VIP Guests</SelectItem>
                              <SelectItem value="ushers">Ushers</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Subject</Label>
                          <Input placeholder="Message subject" />
                        </div>
                        <div>
                          <Label>Message</Label>
                          <Textarea placeholder="Type your message here..." />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsNewConversationDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={isCommunicationDialogOpen}
                    onOpenChange={setIsCommunicationDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Broadcast
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Communication Broadcast</DialogTitle>
                        <DialogDescription>
                          Send email, SMS, or voice broadcast to attendees.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Communication Type</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                              <SelectItem value="voice">
                                Voice Broadcast
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Target Audience</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select audience" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Attendees</SelectItem>
                              <SelectItem value="checked-in">
                                Checked-in Only
                              </SelectItem>
                              <SelectItem value="not-checked-in">
                                Not Checked-in
                              </SelectItem>
                              <SelectItem value="speakers">Speakers</SelectItem>
                              <SelectItem value="vips">VIPs</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Message Content</Label>
                          <Textarea placeholder="Enter your message content..." />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsCommunicationDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                          Send Broadcast
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </DashboardCard>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="badges">
          <DashboardCard title="Print Badges for Attendees">
            <div className="mb-4 flex justify-between items-center">
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by name, email, company..."
                    className="pl-8 sm:w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBatchPrintBadges}
                  disabled={selectedAttendees.size === 0}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Badges ({selectedAttendees.size})
                </Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredAttendees.length > 0 && selectedAttendees.size === filteredAttendees.length}
                      onCheckedChange={handleSelectAllAttendees}
                      aria-label="Select all attendees"
                    />
                  </TableHead>
                  <TableHead>Attendee</TableHead>
                  <TableHead className="hidden md:table-cell">Company</TableHead>
                  <TableHead>Guest Type</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendeesLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Loading attendees...
                    </TableCell>
                  </TableRow>
                ) : filteredAttendees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No attendees found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttendees.map((attendee) => (
                    <TableRow key={attendee.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedAttendees.has(attendee.id)}
                          onCheckedChange={() => handleSelectAttendee(attendee.id)}
                          aria-label={`Select ${attendee.guest?.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            src={
                              attendee.guest?.profile_image_url ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(attendee.guest?.name || 'A')}&background=random`
                            }
                            alt={attendee.guest?.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <div className="font-medium">{attendee.guest?.name}</div>
                            <div className="text-sm text-muted-foreground">{attendee.guest?.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{attendee.guest?.company || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getGuestTypeColor(attendee.guestType?.name)}>
                          {getGuestTypeIcon(attendee.guestType?.name)}
                          <span className="ml-1">{attendee.guestType?.name || 'N/A'}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {attendee.checked_in ? (
                          <span className="text-green-600 font-semibold">Checked In</span>
                        ) : (
                          <span className="text-gray-400">Not Checked In</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DashboardCard>
        </TabsContent>
        <TabsContent value="attendees">
          <DashboardCard
            title="Event Attendees"
            description={`Manage and view all attendees for ${eventData.name}`}
          >
            <div className="mb-4 flex justify-between items-center">
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by name, email, company..."
                    className="pl-8 sm:w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {/* Add filter dropdowns here if needed */}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBatchPrintBadges}
                  disabled={selectedAttendees.size === 0}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Badges ({selectedAttendees.size})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAddAttendeeDialogOpen(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Attendee
                </Button>
                <Button
                  variant="outline"
                  onClick={handleImportClick}
                  disabled={isImporting}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isImporting ? 'Importing...' : 'Import CSV'}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileImport}
                  className="hidden"
                  accept=".csv"
                />
                <Button variant="outline" onClick={exportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredAttendees.length > 0 &&
                        selectedAttendees.size === filteredAttendees.length
                      }
                      onCheckedChange={handleSelectAllAttendees}
                      aria-label="Select all attendees"
                    />
                  </TableHead>
                  <TableHead>Attendee</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Company
                  </TableHead>
                  <TableHead>Guest Type</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendeesLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Loading attendees...
                    </TableCell>
                  </TableRow>
                ) : filteredAttendees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No attendees found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttendees.map((attendee) => (
                    <TableRow key={attendee.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedAttendees.has(attendee.id)}
                          onCheckedChange={() =>
                            handleSelectAttendee(attendee.id)
                          }
                          aria-label={`Select ${attendee.guest?.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            src={
                              attendee.guest?.profile_image_url ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                attendee.guest?.name || 'A'
                              )}&background=random`
                            }
                            alt={attendee.guest?.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <div className="font-medium">
                              {attendee.guest?.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {attendee.guest?.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {attendee.guest?.company || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getGuestTypeColor(
                            attendee.guestType?.name
                          )}
                        >
                          {getGuestTypeIcon(attendee.guestType?.name)}
                          <span className="ml-1">
                            {attendee.guestType?.name || 'N/A'}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
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
                          {attendee.checked_in ? 'Checked In' : 'Registered'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => generateBadge(attendee)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DashboardCard>
        </TabsContent>
        <TabsContent value="checkins">
          <div className="p-6 text-center text-gray-500">
            Check-ins content coming soon.
          </div>
        </TabsContent>
        <TabsContent value="analytics">
          <DashboardCard title="Event Analytics">
            {analyticsLoading ? (
              <div>Loading analytics...</div>
            ) : analyticsError ? (
              <div className="text-red-500">{analyticsError}</div>
            ) : analytics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                  <div className="bg-blue-50 rounded p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.total_attendees}
                    </div>
                    <div className="text-sm text-gray-600">Total Attendees</div>
                  </div>
                  <div className="bg-green-50 rounded p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.checked_in_attendees}
                    </div>
                    <div className="text-sm text-gray-600">Checked In</div>
                  </div>
                  <div className="bg-yellow-50 rounded p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {analytics.no_show_attendees}
                    </div>
                    <div className="text-sm text-gray-600">No Show</div>
                  </div>
                  <div className="bg-purple-50 rounded p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Object.keys(analytics.by_guest_type || {}).length}
                    </div>
                    <div className="text-sm text-gray-600">Guest Types</div>
                  </div>
                  <div className="bg-green-50 rounded p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Object.values(analytics.country_breakdown || {}).reduce(
                        (a, b) => a + b,
                        0
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Countries</div>
                  </div>
                  <div className="bg-yellow-50 rounded p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {Object.values(analytics.gender_breakdown || {}).reduce(
                        (a, b) => a + b,
                        0
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Genders</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DashboardCard title="Attendance Status Breakdown">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: 'Checked In',
                              value: analytics.checked_in_attendees,
                            },
                            {
                              name: 'No Show',
                              value: analytics.no_show_attendees,
                            },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          <Cell key="checked-in" fill="#10b981" />
                          <Cell key="no-show" fill="#f59e0b" />
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </DashboardCard>
                  <DashboardCard title="Guest Type Breakdown">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={Object.entries(
                            analytics.by_guest_type || {}
                          ).map(([name, value]) => ({ name, value }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {Object.entries(analytics.by_guest_type || {})
                            .filter(
                              (type) =>
                                type.id !== undefined &&
                                type.id !== null &&
                                type.id !== ''
                            )
                            .map(([name], idx) => (
                              <Cell
                                key={name}
                                fill={
                                  [
                                    '#3b82f6',
                                    '#8b5cf6',
                                    '#06d6a0',
                                    '#f59e0b',
                                    '#ef4444',
                                  ][idx % 5]
                                }
                              />
                            ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </DashboardCard>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DashboardCard title="Registration Timeline">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart
                        data={Object.entries(
                          analytics.registration_timeline || {}
                        ).map(([date, value]) => ({ date, value }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis allowDecimals={false} />
                        <RechartsTooltip />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#3b82f6"
                          strokeWidth={3}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </DashboardCard>
                  <DashboardCard title="Country Breakdown">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={Object.entries(
                          analytics.country_breakdown || {}
                        ).map(([country, value]) => ({ country, value }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="country" />
                        <YAxis allowDecimals={false} />
                        <RechartsTooltip />
                        <Bar dataKey="value" fill="#06d6a0" />
                      </BarChart>
                    </ResponsiveContainer>
                  </DashboardCard>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DashboardCard title="Gender Breakdown">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={Object.entries(
                          analytics.gender_breakdown || {}
                        ).map(([gender, value]) => ({ gender, value }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="gender" />
                        <YAxis allowDecimals={false} />
                        <RechartsTooltip />
                        <Bar dataKey="value" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </DashboardCard>
                  <DashboardCard title="Most Active Ushers">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={Object.entries(
                          analytics.most_active_ushers || {}
                        ).map(([usher, value]) => ({ usher, value }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="usher" />
                        <YAxis allowDecimals={false} />
                        <RechartsTooltip />
                        <Bar dataKey="value" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </DashboardCard>
                </div>
              </div>
            ) : (
              <div>No analytics data available.</div>
            )}
          </DashboardCard>
        </TabsContent>
      </Tabs>

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update the event details below.
            </DialogDescription>
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
                  value={editForm.start_date?.slice(0, 10) || ''}
                  onChange={(e) =>
                    handleEditInput('start_date', e.target.value)
                  }
                  required
                />
                <Input
                  type="date"
                  placeholder="End Date"
                  value={editForm.end_date?.slice(0, 10) || ''}
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
                  value={editForm.registration_start_date?.slice(0, 10) || ''}
                  onChange={(e) =>
                    handleEditInput('registration_start_date', e.target.value)
                  }
                  required
                />
                <Input
                  type="date"
                  placeholder="Registration End Date"
                  value={editForm.registration_end_date?.slice(0, 10) || ''}
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
              <div>
                <Label htmlFor="edit_event_image">Event Image</Label>
                <Input
                  id="edit_event_image"
                  type="file"
                  onChange={handleEditFile}
                  ref={editImageInputRef}
                  className="mt-1"
                />
                {editImagePreview && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={editImagePreview}
                      alt="Event image preview"
                      className="h-24 rounded shadow border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 rounded-full h-6 w-6"
                      onClick={handleRemoveEditImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <Input
                placeholder="Guest Types (comma separated)"
                value={editForm.guest_types || ''}
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
                <Input
                  id="gender"
                  value={addAttendeeForm.gender}
                  onChange={(e) =>
                    handleAddAttendeeInput('gender', e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={addAttendeeForm.country}
                  onChange={(e) =>
                    handleAddAttendeeInput('country', e.target.value)
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1">
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
                {addAttendeeLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  'Add Attendee'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Usher Dialog */}
      <Dialog open={createUsherDialogOpen} onOpenChange={setCreateUsherDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Usher</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new usher account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={newUsher.name}
                onChange={e => setNewUsher({ ...newUsher, name: e.target.value })}
                placeholder="Full Name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={newUsher.email}
                onChange={e => setNewUsher({ ...newUsher, email: e.target.value })}
                placeholder="Email Address"
                type="email"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                value={newUsher.password}
                onChange={e => setNewUsher({ ...newUsher, password: e.target.value })}
                placeholder="Password"
                type="password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUsherDialogOpen(false)} disabled={creatingUsher}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600"
              disabled={creatingUsher || !newUsher.name || !newUsher.email || !newUsher.password}
              onClick={async () => {
                setCreatingUsher(true);
                try {
                  await api.post('/users', {
                    name: newUsher.name,
                    email: newUsher.email,
                    password: newUsher.password,
                    role: 'usher',
                  });
                  toast.success('Usher account created!');
                  setCreateUsherDialogOpen(false);
                  setNewUsher({ name: '', email: '', password: '' });
                } catch (err) {
                  toast.error('Failed to create usher');
                } finally {
                  setCreatingUsher(false);
                }
              }}
            >
              {creatingUsher ? 'Creating...' : 'Create Usher'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden single badge print area */}
      {singlePrintAttendee && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div ref={singlePrintRef}>
            <div className="printable-badge-batch">
              <BadgePrint attendee={singlePrintAttendee} />
            </div>
          </div>
        </div>
      )}

      {/* Hidden batch badge print area */}
      {printing && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div ref={printRef}>
            {attendees
              .filter((attendee) => selectedAttendees.has(attendee.id))
              .map((attendee) => (
                <div key={attendee.id} className="printable-badge-batch">
                  <BadgePrint attendee={attendee} />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
