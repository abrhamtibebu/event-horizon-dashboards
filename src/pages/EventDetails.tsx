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
  Pencil,
  Trash2,
  User,
  UserCog,
  Eye,
  UserCheck,
  Image,
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
  DialogClose,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import api, {
  getUshers,
  getEventUshers,
  assignUshersToEvent,
  updateUsherTasks,
  getAvailableUshersForEvent,
} from '@/lib/api'
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
import { UsherAssignmentDialog } from '@/components/UsherAssignmentDialog'
import React from 'react'
import { useReactToPrint } from 'react-to-print'
import BadgePrint from '@/components/Badge'
import BadgeTest from '@/components/BadgeTest'
import { getOfficialBadgeTemplate, getBadgeTemplates } from '@/lib/badgeTemplates'
import { BadgeTemplate } from '@/types/badge'
import { DateRange } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'

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

  // Add state for edit form date ranges
  const [showEditEventRange, setShowEditEventRange] = useState(false)
  const [showEditRegRange, setShowEditRegRange] = useState(false)
  const [editEventRange, setEditEventRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    },
  ])
  const [editRegRange, setEditRegRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    },
  ])

  // Add state for dropdowns
  const [eventTypes, setEventTypes] = useState<any[]>([])
  const [eventCategories, setEventCategories] = useState<any[]>([])
  const [editLoadingStates, setEditLoadingStates] = useState({
    eventTypes: true,
    eventCategories: true,
  })
  const [editErrors, setEditErrors] = useState({
    eventTypes: null,
    eventCategories: null,
  })

  const [eventData, setEventData] = useState<any>(null)
  const [eventLoading, setEventLoading] = useState(true)
  const [eventError, setEventError] = useState<string | null>(null)
  const [attendees, setAttendees] = useState<any[]>([])
  const [attendeesLoading, setAttendeesLoading] = useState(true)
  const [attendeesError, setAttendeesError] = useState<string | null>(null)
  const [guestTypes, setGuestTypes] = useState<any[]>([])

  const { user } = useAuth()
  const [isUsherAssigned, setIsUsherAssigned] = useState(false)

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
    onAfterPrint: () => {
      setSinglePrintAttendee(null)
      if (singlePrintRef.current) {
        singlePrintRef.current.style.visibility = 'hidden'
      }
    },
    onBeforeGetContent: () => {
      console.log('Before getting content for single print')
      console.log('Single print ref:', singlePrintRef.current)
      return new Promise((resolve) => {
        setTimeout(resolve, 200)
      })
    },
    onPrintError: (error) => {
      console.error('Single print error:', error)
      toast.error('Failed to print badge. Please try again.')
      setSinglePrintAttendee(null)
      if (singlePrintRef.current) {
        singlePrintRef.current.style.visibility = 'hidden'
      }
    },
    removeAfterPrint: true,
    suppressErrors: false,
  })
  const [printing, setPrinting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const handlePrintBadges = useReactToPrint({
    content: () => printRef.current,
    onAfterPrint: () => {
      setPrinting(false)
      if (printRef.current) {
        printRef.current.style.visibility = 'hidden'
      }
    },
    onBeforeGetContent: () => {
      console.log('Before getting content for batch print')
      console.log('Print ref:', printRef.current)
      return new Promise((resolve) => {
        setTimeout(resolve, 200)
      })
    },
    onPrintError: (error) => {
      console.error('Batch print error:', error)
      toast.error('Failed to print badges. Please try again.')
      setPrinting(false)
      if (printRef.current) {
        printRef.current.style.visibility = 'hidden'
      }
    },
    removeAfterPrint: true,
    suppressErrors: false,
  })

  const [users, setUsers] = useState<any[]>([])
  const [usherAssignments, setUsherAssignments] = useState([
    { usherId: '', tasks: '' },
  ])
  const [assigningUsher, setAssigningUsher] = useState(false)
  const [createUsherDialogOpen, setCreateUsherDialogOpen] = useState(false)
  const [newUsher, setNewUsher] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [creatingUsher, setCreatingUsher] = useState(false)
  const [addUsherDialogOpen, setAddUsherDialogOpen] = useState(false)
  const [addingUsher, setAddingUsher] = useState(false)

  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [teamLoading, setTeamLoading] = useState(false)
  const [editMember, setEditMember] = useState<any>(null)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [removeMember, setRemoveMember] = useState<any>(null)
  const [removeLoading, setRemoveLoading] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [roleMember, setRoleMember] = useState<any>(null)
  const [roleLoading, setRoleLoading] = useState(false)
  const [newRole, setNewRole] = useState('usher')

  // Badge template state
  const [badgeTemplate, setBadgeTemplate] = useState<BadgeTemplate | null>(null)
  const [badgeTemplateLoading, setBadgeTemplateLoading] = useState(false)
  const [badgeTemplateError, setBadgeTemplateError] = useState<string | null>(null)
  const [showTestBadge, setShowTestBadge] = useState(false)
  const [testAttendee, setTestAttendee] = useState<any>(null)

  // Check if usher is assigned to this event
  useEffect(() => {
    if (!eventId || !user || user.role !== 'usher') return

    const checkUsherAssignment = async () => {
      try {
        const response = await api.get(`/usher/events`)
        const assignedEvents = response.data
        const isAssigned = assignedEvents.some((event: any) => event.id.toString() === eventId)
        setIsUsherAssigned(isAssigned)
      } catch (err) {
        console.error('Failed to check usher assignment:', err)
        setIsUsherAssigned(false)
      }
    }

    checkUsherAssignment()
  }, [eventId, user])

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
      .catch((err) => setAnalyticsError('Failed to fetch analytics.'))
      .finally(() => setAnalyticsLoading(false))
  }, [eventId, activeTab])

  // Load dropdown data for edit form
  useEffect(() => {
    const loadEditDropdownData = async () => {
      try {
        const [typesRes, categoriesRes] = await Promise.all([
          api.get('/event-types'),
          api.get('/event-categories'),
        ])
        setEventTypes(typesRes.data)
        setEventCategories(categoriesRes.data)
        setEditLoadingStates({ eventTypes: false, eventCategories: false })
      } catch (err: any) {
        setEditErrors({
          eventTypes: 'Failed to load event types',
          eventCategories: 'Failed to load event categories',
        })
        setEditLoadingStates({ eventTypes: false, eventCategories: false })
      }
    }
    loadEditDropdownData()
  }, [])

  // Utility to filter valid select options
  const filterValidOptions = <T extends { id?: any }>(arr: T[]) => {
    return arr.filter(
      (item) => item.id !== undefined && item.id !== null && item.id !== ''
    )
  }

  // Custom purple theme for react-date-range
  const customRangeStyles = `
    .rdrCalendarWrapper, .rdrDateDisplayWrapper, .rdrMonthAndYearWrapper, .rdrMonthPicker, .rdrYearPicker {
      background: white;
    }
    .rdrDayNumber span {
      color: #6d28d9;
      font-weight: 500;
    }
    .rdrDay.rdrDaySelected, .rdrDay.rdrDayInRange, .rdrDay.rdrDayStartPreview, .rdrDay.rdrDayEndPreview {
      background: #a21caf !important;
      color: white !important;
      border-radius: 9999px !important;
    }
    .rdrDay.rdrDayStartOfMonth, .rdrDay.rdrDayEndOfMonth {
      border-radius: 9999px !important;
    }
    .rdrDay.rdrDayToday .rdrDayNumber span {
      border: 1.5px solid #a21caf;
      border-radius: 9999px;
    }
    .rdrMonthAndYearPickers select {
      color: #a21caf;
      font-weight: 600;
    }
    .rdrDefinedRangesWrapper { display: none; }
    .rdrDateRangePickerWrapper { box-shadow: 0 8px 32px rgba(80,0,80,0.12); border-radius: 1.5rem; }
  `

  // Fetch all ushers for assigning ushers
  const fetchUsers = () => {
    getUshers()
      .then((res) => setUsers(res.data))
      .catch(() => toast.error('Failed to fetch ushers'))
  }
  useEffect(() => {
    fetchUsers()
  }, [])

  // Fetch badge template for the event
  useEffect(() => {
    if (!eventId) return
    setBadgeTemplateLoading(true)
    setBadgeTemplateError(null)
    
    // First try to get the official template
    getOfficialBadgeTemplate(Number(eventId))
      .then(res => {
        setBadgeTemplate(res.data)
      })
      .catch(() => {
        // If no official template, try to get any template
        getBadgeTemplates(Number(eventId))
          .then(res => {
            if (Array.isArray(res.data) && res.data.length > 0) {
              setBadgeTemplate(res.data[0])
            } else {
              setBadgeTemplateError('No badge templates found for this event.')
            }
          })
          .catch(() => {
            setBadgeTemplateError('Failed to load badge templates.')
          })
          .finally(() => setBadgeTemplateLoading(false))
      })
      .finally(() => setBadgeTemplateLoading(false))
  }, [eventId])

  useEffect(() => {
    if (!user?.organizer_id) return
    setTeamLoading(true)
    api
      .get(`/organizers/${user.organizer_id}/contacts`)
      .then((res) => setTeamMembers(res.data))
      .catch(() => setTeamMembers([]))
      .finally(() => setTeamLoading(false))
  }, [user?.organizer_id])

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

  const validateBadgeTemplate = (template: BadgeTemplate | null): boolean => {
    if (!template) {
      toast.error('No badge template available. Please create a badge template first.')
      return false
    }
    
    if (!template.template_json) {
      toast.error('Badge template is invalid. Please recreate the template.')
      return false
    }
    
    const templateData = template.template_json
    if (!templateData.front && !templateData.back) {
      toast.error('Badge template is missing design elements. Please recreate the template.')
      return false
    }
    
    return true
  }

  const generateBadge = (attendee: (typeof attendees)[0]) => {
    if (!validateBadgeTemplate(badgeTemplate)) {
      return
    }
    
    // Validate attendee data
    if (!attendee || !attendee.guest) {
      toast.error('Invalid attendee data. Please try again.')
      return
    }
    
    console.log('Generating badge for:', attendee)
    console.log('Badge template:', badgeTemplate)
    console.log('Template JSON:', badgeTemplate?.template_json)
    
    setSinglePrintAttendee(attendee)
    
    // Use a longer timeout to ensure the component is fully rendered
    setTimeout(() => {
      console.log('Single print ref:', singlePrintRef.current)
      console.log('Single print ref children:', singlePrintRef.current?.children?.length)
      
      if (singlePrintRef.current) {
        // Check if the badge component is actually rendered
        const badgeElement = singlePrintRef.current.querySelector('.printable-badge-batch')
        if (badgeElement && badgeElement.children.length > 0) {
          console.log('Badge element found, initiating print...')
          // Make the element visible for printing
          singlePrintRef.current.style.visibility = 'visible'
      handleSinglePrint()
        } else {
          console.error('Badge element not found or empty in print ref')
          toast.error('Failed to generate badge. Please try again.')
          setSinglePrintAttendee(null)
        }
      } else {
        console.error('Print ref not available')
        toast.error('Failed to generate badge. Please try again.')
        setSinglePrintAttendee(null)
      }
    }, 1500) // Increased timeout for better reliability
  }

  const testBadge = (attendee: (typeof attendees)[0]) => {
    console.log('Testing badge for:', attendee)
    console.log('Badge template:', badgeTemplate)
    setTestAttendee(attendee)
    setShowTestBadge(true)
  }

  const exportCSV = () => {
    if (filteredAttendees.length === 0) {
      toast.info('No attendees to export.')
      return
    }

    const dataToExport = filteredAttendees.map((attendee) => ({
      'Attendee ID': attendee.id,
      'Name': attendee.guest?.name || 'N/A',
      'Email': attendee.guest?.email || 'N/A',
      'Phone': attendee.guest?.phone || 'N/A',
      'Company': attendee.guest?.company || 'N/A',
      'Job Title': attendee.guest?.jobtitle || 'N/A',
      'Gender': attendee.guest?.gender || 'N/A',
      'Country': attendee.guest?.country || 'N/A',
      'Guest Type': attendee.guestType?.name || 'N/A',
      'Registration Date': attendee.created_at 
        ? format(parseISO(attendee.created_at), 'MMM d, yyyy, h:mm a')
        : 'N/A',
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
    if (!validateBadgeTemplate(badgeTemplate)) {
      return
    }
    if (selectedAttendees.size === 0) {
      toast.error('Please select at least one attendee to print badges for.')
      return
    }
    
    // Validate that selected attendees have valid data
    const selectedAttendeeList = attendees.filter(attendee => selectedAttendees.has(attendee.id))
    const invalidAttendees = selectedAttendeeList.filter(attendee => !attendee.guest)
    
    if (invalidAttendees.length > 0) {
      toast.error(`${invalidAttendees.length} attendees have invalid data. Please check and try again.`)
      return
    }
    
    console.log('Batch printing badges for:', selectedAttendees.size, 'attendees')
    console.log('Badge template:', badgeTemplate)
    console.log('Template JSON:', badgeTemplate?.template_json)
    
    setPrinting(true)
    
    // Use a longer timeout to ensure the components are fully rendered
    setTimeout(() => {
      console.log('Print ref:', printRef.current)
      console.log('Print ref children:', printRef.current?.children?.length)
      
      if (printRef.current) {
        // Check if badge components are actually rendered
        const badgeElements = printRef.current.querySelectorAll('.printable-badge-batch')
        if (badgeElements.length > 0) {
          console.log(`${badgeElements.length} badge elements found, initiating batch print...`)
          // Make the element visible for printing
          printRef.current.style.visibility = 'visible'
      handlePrintBadges()
        } else {
          console.error('No badge elements found in print ref')
          toast.error('Failed to print badges. Please try again.')
          setPrinting(false)
        }
      } else {
        console.error('Print ref not available')
        toast.error('Failed to print badges. Please try again.')
        setPrinting(false)
      }
    }, 1500) // Increased timeout for better reliability
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
            // Refetch the attendee list from the backend to ensure it's up-to-date
            const res = await api.get(`/events/${eventId}/attendees`)
            setAttendees(res.data)
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
    const eventDataForEdit = { ...eventData }
    
    // Set up date ranges for edit form
    const startDate = eventData.start_date ? new Date(eventData.start_date) : new Date()
    const endDate = eventData.end_date ? new Date(eventData.end_date) : new Date()
    const regStartDate = eventData.registration_start_date ? new Date(eventData.registration_start_date) : new Date()
    const regEndDate = eventData.registration_end_date ? new Date(eventData.registration_end_date) : new Date()
    
    setEditEventRange([{ startDate, endDate, key: 'selection' }])
    setEditRegRange([{ startDate: regStartDate, endDate: regEndDate, key: 'selection' }])
    
    setEditForm(eventDataForEdit)
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
      
      // Convert date objects to ISO strings for API
      const processedEditForm = {
        ...editForm,
        start_date: editEventRange[0].startDate.toISOString(),
        end_date: editEventRange[0].endDate.toISOString(),
        registration_start_date: editRegRange[0].startDate.toISOString(),
        registration_end_date: editRegRange[0].endDate.toISOString(),
      }
      
      if (processedEditForm.event_image && processedEditForm.event_image instanceof File) {
        payload = new FormData()
        Object.entries(processedEditForm).forEach(([key, value]) => {
          if (key === 'event_image' && value) {
            payload.append('event_image', value)
          } else if (key === 'guest_types') {
            const guestTypesArr = (value as string)
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
            guestTypesArr.forEach((type) =>
              payload.append('guest_types[]', type)
            )
          } else {
            payload.append(key, value as any)
          }
        })
        headers = { 'Content-Type': 'multipart/form-data' }
      } else {
        const guestTypesArr = (processedEditForm.guest_types as string)
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
        payload = { ...processedEditForm, guest_types: guestTypesArr }
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

  const handleEditMember = (member: any) => {
    setEditMember({ ...member })
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditLoading(true)
    try {
      await api.put(`/users/${editMember.id}`, {
        name: editMember.name,
        email: editMember.email,
        status: editMember.status,
      })
      toast.success('Team member updated!')
      setEditDialogOpen(false)
      setEditMember(null)
      // Refresh team list
      const res = await api.get(`/organizers/${user.organizer_id}/contacts`)
      setTeamMembers(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update team member')
    } finally {
      setEditLoading(false)
    }
  }

  const handleRemoveMember = (member: any) => {
    setRemoveMember(member)
    setRemoveDialogOpen(true)
  }

  const handleRemoveConfirm = async () => {
    setRemoveLoading(true)
    try {
      await api.delete(
        `/organizers/${user.organizer_id}/contacts/${removeMember.id}`
      )
      toast.success('Team member removed!')
      setRemoveDialogOpen(false)
      setRemoveMember(null)
      // Refresh team list
      const res = await api.get(`/organizers/${user.organizer_id}/contacts`)
      setTeamMembers(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to remove team member')
    } finally {
      setRemoveLoading(false)
    }
  }

  const handleRoleMember = (member: any) => {
    setRoleMember(member)
    setNewRole(member.role)
    setRoleDialogOpen(true)
  }

  const handleRoleChange = async () => {
    setRoleLoading(true)
    try {
      await api.put(`/users/${roleMember.id}`, { role: newRole })
      toast.success('Role updated!')
      setRoleDialogOpen(false)
      setRoleMember(null)
      // Refresh team list
      const res = await api.get(`/organizers/${user.organizer_id}/contacts`)
      setTeamMembers(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update role')
    } finally {
      setRoleLoading(false)
    }
  }

  const handleSetPrimary = async (member: any) => {
    try {
      await api.post(
        `/organizers/${user.organizer_id}/contacts/${member.id}/primary`
      )
      toast.success('Primary contact updated!')
      // Refresh team list
      const res = await api.get(`/organizers/${user.organizer_id}/contacts`)
      setTeamMembers(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to set primary contact')
    }
  }

  const handleAddUsher = async () => {
    setAddingUsher(true)
    try {
      await api.post('/organizer/ushers', { ...newUsher, role: 'usher' })
      toast.success('Usher added!')
      setAddUsherDialogOpen(false)
      setNewUsher({ name: '', email: '', password: '' })
      // Refresh ushers list
      const [allRes, eventRes] = await Promise.all([
        getUshers(),
        getEventUshers(Number(eventId)),
      ])
      setAllUshers(allRes.data)
      setEventUshers(eventRes.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add usher')
    } finally {
      setAddingUsher(false)
    }
  }

  // Check-in attendee function
  const handleCheckIn = async (attendeeId: number, checkedIn: boolean) => {
    try {
      const response = await api.post(`/events/${eventId}/attendees/${attendeeId}/check-in`, {
        checked_in: !checkedIn
      })
      
      // Update the attendee in the local state
      setAttendees(prev => prev.map(attendee => 
        attendee.id === attendeeId 
          ? { ...attendee, checked_in: !checkedIn }
          : attendee
      ))
      
      toast.success(checkedIn ? 'Attendee checked out successfully!' : 'Attendee checked in successfully!')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update check-in status.')
    }
  }

  // Edit attendee function
  const handleEditAttendee = async (attendeeId: number, updatedData: any) => {
    try {
      const response = await api.put(`/events/${eventId}/attendees/${attendeeId}`, updatedData)
      
      // Update the attendee in the local state
      setAttendees(prev => prev.map(attendee => 
        attendee.id === attendeeId 
          ? { ...attendee, ...response.data }
          : attendee
      ))
      
      toast.success('Attendee updated successfully!')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update attendee.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Fancy Hero Banner */}
      <div className="relative w-full h-72 rounded-2xl overflow-hidden mb-8 shadow-lg">
        {eventData.event_image && (
          <img
            src={
              eventData.event_image.startsWith('http')
                ? eventData.event_image
                : `${import.meta.env.VITE_API_BASE_URL || ''}/storage/${eventData.event_image}`
            }
            alt={eventData.name}
            className="object-cover w-full h-full"
          />
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-purple-800/60 to-transparent" />
        {/* Event Info */}
        <div className="absolute left-0 top-0 w-full h-full flex flex-col justify-end p-8">
          <div className="flex items-center gap-4 mb-2">
            <Link
              to="/dashboard/events"
              className="text-yellow-400 hover:text-yellow-300 text-base font-semibold flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm shadow"
            >
              <span className="text-lg">←</span> Back to Events
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-2">{eventData.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-white/90 text-lg font-medium">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-300" />
              {eventData.start_date && format(parseISO(eventData.start_date), 'MMM d, yyyy, h:mm a')}
              {eventData.end_date && (
                <>
                  <span className="mx-1">-</span>
                  {format(parseISO(eventData.end_date), 'MMM d, yyyy, h:mm a')}
                </>
              )}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-pink-300" />
              {eventData.location}
            </span>
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-300" />
              {attendees.length} Registered
            </span>
            <span className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-200" />
              Organized by <span className="font-bold text-yellow-200 ml-1">{user?.organizer?.name || eventData.organizer?.name}</span>
            </span>
          </div>
        </div>
      </div>

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
          {user?.role !== 'usher' && (
            <>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <QrCode className="w-4 h-4 mr-2" />
                Public Registration
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Public Registration Link</DialogTitle>
                <DialogDescription>
                  Share this link or QR code to allow public registration for this event.
                </DialogDescription>
              </DialogHeader>
              {eventData?.status?.toLowerCase().trim() === 'active' && eventData?.uuid ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      value={`${window.location.origin}/register/${eventData.uuid}`}
                      readOnly
                      className="text-xs bg-white"
                      onClick={e => (e.target as HTMLInputElement).select()}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/register/${eventData.uuid}`)
                        toast.success('Registration link copied to clipboard!')
                      }}
                      variant="outline"
                      className="bg-white hover:bg-green-50"
                    >
                      Copy Link
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-700">QR Code:</span>
                    </div>
                    <img 
                      id="public-registration-qr"
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/register/${eventData.uuid}`)}`} 
                      alt="QR Code for registration" 
                      className="w-32 h-32 border border-green-200 rounded" 
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(`${window.location.origin}/register/${eventData.uuid}`)}`
                        link.download = `registration-qr-${eventData.name}.png`
                        link.click()
                      }}
                      className="bg-white hover:bg-green-50"
                    >
                      Download QR
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">The event must be active to share the public registration link.</div>
              )}
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={generateReport}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
            </>
          )}
          {user?.role === 'usher' && (
            <Button
              variant="outline"
              onClick={() => setActiveTab('attendees')}
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Manage Attendees
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="flex gap-2 bg-white border-b border-gray-200 mb-6 px-2">
          {user?.role === 'usher' ? (
            <>
              <TabsTrigger
                value="attendees"
                className={`px-4 py-2 text-base font-medium transition-all duration-150 border-b-2 border-transparent rounded-none bg-transparent shadow-none
                  ${activeTab === 'attendees' ? 'border-blue-600 text-blue-700 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:border-blue-200'}
                `}
              >
                Attendees
              </TabsTrigger>
              <TabsTrigger
                value="badges"
                className={`px-4 py-2 text-base font-medium transition-all duration-150 border-b-2 border-transparent rounded-none bg-transparent shadow-none
                  ${activeTab === 'badges' ? 'border-blue-600 text-blue-700 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:border-blue-200'}
                `}
              >
                Badges
              </TabsTrigger>
              <TabsTrigger
                value="checkins"
                className={`px-4 py-2 text-base font-medium transition-all duration-150 border-b-2 border-transparent rounded-none bg-transparent shadow-none
                  ${activeTab === 'checkins' ? 'border-blue-600 text-blue-700 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:border-blue-200'}
                `}
              >
                Check-ins
              </TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger
                value="details"
                className={`px-4 py-2 text-base font-medium transition-all duration-150 border-b-2 border-transparent rounded-none bg-transparent shadow-none
                  ${activeTab === 'details' ? 'border-blue-600 text-blue-700 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:border-blue-200'}
                `}
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="badges"
                className={`px-4 py-2 text-base font-medium transition-all duration-150 border-b-2 border-transparent rounded-none bg-transparent shadow-none
                  ${activeTab === 'badges' ? 'border-blue-600 text-blue-700 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:border-blue-200'}
                `}
              >
                Badges
              </TabsTrigger>
              <TabsTrigger
                value="attendees"
                className={`px-4 py-2 text-base font-medium transition-all duration-150 border-b-2 border-transparent rounded-none bg-transparent shadow-none
                  ${activeTab === 'attendees' ? 'border-blue-600 text-blue-700 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:border-blue-200'}
                `}
              >
                Attendees
              </TabsTrigger>
              <TabsTrigger
                value="ushers"
                className={`px-4 py-2 text-base font-medium transition-all duration-150 border-b-2 border-transparent rounded-none bg-transparent shadow-none
                  ${activeTab === 'ushers' ? 'border-blue-600 text-blue-700 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:border-blue-200'}
                `}
              >
                Ushers & Tasks
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className={`px-4 py-2 text-base font-medium transition-all duration-150 border-b-2 border-transparent rounded-none bg-transparent shadow-none
                  ${activeTab === 'team' ? 'border-blue-600 text-blue-700 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:border-blue-200'}
                `}
              >
                Team
              </TabsTrigger>
              <TabsTrigger
                value="checkins"
                className={`px-4 py-2 text-base font-medium transition-all duration-150 border-b-2 border-transparent rounded-none bg-transparent shadow-none
                  ${activeTab === 'checkins' ? 'border-blue-600 text-blue-700 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:border-blue-200'}
                `}
              >
                Check-ins
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className={`px-4 py-2 text-base font-medium transition-all duration-150 border-b-2 border-transparent rounded-none bg-transparent shadow-none
                  ${activeTab === 'analytics' ? 'border-blue-600 text-blue-700 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:border-blue-200'}
                `}
              >
                Analytics
              </TabsTrigger>
            </>
          )}
        </TabsList>
        {/* Only render the relevant tab content for ushers */}
        {user?.role === 'usher' ? (
          <>
            <TabsContent value="attendees">
              <DashboardCard
                title="Event Attendees"
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
                      disabled={selectedAttendees.size === 0 || !badgeTemplate}
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
                    {user?.role !== 'usher' && (
                      <>
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
                      </>
                    )}
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
                            <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => generateBadge(attendee)}
                                disabled={!badgeTemplate}
                                title="Print badge using template design"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => testBadge(attendee)}
                                disabled={!badgeTemplate}
                                title="Preview badge design"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {user?.role === 'usher' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCheckIn(attendee.id, attendee.checked_in)}
                                    title={attendee.checked_in ? "Check out attendee" : "Check in attendee"}
                                    className={attendee.checked_in ? "text-green-600" : "text-blue-600"}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {/* TODO: Open edit dialog */}}
                                    title="Edit attendee information"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {user?.role !== 'usher' && (
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </DashboardCard>
            </TabsContent>
            <TabsContent value="badges">
              <DashboardCard title="Print Badges for Attendees">
                {/* Badge Template Status */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Badge Template Status:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {badgeTemplateLoading ? (
                        <span className="text-sm text-gray-500">Loading template...</span>
                      ) : badgeTemplateError ? (
                        <span className="text-sm text-red-600">{badgeTemplateError}</span>
                      ) : badgeTemplate ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {badgeTemplate.status === 'official' ? 'Official Template' : 'Draft Template'}
                          </Badge>
                          <span className="text-sm text-gray-600">{badgeTemplate.name}</span>
                          {badgeTemplate.template_json && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Ready for Printing
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-orange-600">No template found</span>
                      )}
                    </div>
                  </div>
                  {!badgeTemplate && !badgeTemplateLoading && (
                    <div className="mt-2 text-sm text-gray-600">
                      Create a badge template in the Badge Designer tab to enable badge printing.
                    </div>
                  )}
                </div>
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
                      disabled={selectedAttendees.size === 0 || !badgeTemplate}
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
                            {attendee.checked_in ? (
                              <span className="text-green-600 font-semibold">
                                Checked In
                              </span>
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
            <TabsContent value="checkins">
              <div className="p-6 text-center text-gray-500">
                Check-ins content coming soon.
              </div>
            </TabsContent>
          </>
        ) : (
          <>
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
                          {attendees.filter((a) => a.checked_in).length}
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
                      {/* Event Status Control for Organizers/Admins */}
                      {(user?.role === 'organizer' || user?.role === 'admin') && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Event Status:</span>
                            <Select 
                              value={eventData?.status || 'draft'} 
                              onValueChange={async (status) => {
                                try {
                                  await api.patch(`/events/${eventId}/status`, { status })
                                  // Refetch event details from backend for latest status/uuid
                                  const res = await api.get(`/events/${eventId}`)
                                  setEventData(res.data)
                                  toast.success('Event status updated!')
                                } catch (err) {
                                  toast.error('Failed to update status')
                                }
                              }}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {/* Public Registration Link - Show for all users when event is active */}
                      {eventData?.status === 'active' && eventData?.uuid && (
                        <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 text-green-800">
                            <UserPlus className="w-4 h-4" />
                            <span className="text-sm font-medium">Share this link for public registration</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                value={`${window.location.origin}/register/${eventData.uuid}`}
                                readOnly
                                className="text-xs bg-white"
                                onClick={e => (e.target as HTMLInputElement).select()}
                              />
                              <Button
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/register/${eventData.uuid}`)
                                  toast.success('Registration link copied to clipboard!')
                                }}
                                variant="outline"
                                className="bg-white hover:bg-green-50"
                              >
                                Copy Link
                              </Button>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <QrCode className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-green-700">QR Code:</span>
                              </div>
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${window.location.origin}/register/${eventData.uuid}`)}`} 
                                alt="QR Code for registration" 
                                className="w-20 h-20 border border-green-200 rounded" 
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const link = document.createElement('a')
                                  link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/register/${eventData.uuid}`)}`
                                  link.download = `registration-qr-${eventData.name}.png`
                                  link.click()
                                }}
                                className="bg-white hover:bg-green-50"
                              >
                                Download QR
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <UsherAssignmentDialog
                        eventId={Number(eventId)}
                        eventName={eventData.name}
                        onSuccess={() => {
                          // Refresh event ushers after assignment
                          fetchEventUshers()
                        }}
                      />

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
                {/* Badge Template Status */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Badge Template Status:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {badgeTemplateLoading ? (
                        <span className="text-sm text-gray-500">Loading template...</span>
                      ) : badgeTemplateError ? (
                        <span className="text-sm text-red-600">{badgeTemplateError}</span>
                      ) : badgeTemplate ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {badgeTemplate.status === 'official' ? 'Official Template' : 'Draft Template'}
                          </Badge>
                          <span className="text-sm text-gray-600">{badgeTemplate.name}</span>
                          {badgeTemplate.template_json && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Ready for Printing
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-orange-600">No template found</span>
                      )}
                    </div>
                  </div>
                  {!badgeTemplate && !badgeTemplateLoading && (
                    <div className="mt-2 text-sm text-gray-600">
                      Create a badge template in the Badge Designer tab to enable badge printing.
                    </div>
                  )}
                </div>
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
                      disabled={selectedAttendees.size === 0 || !badgeTemplate}
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
                            {attendee.checked_in ? (
                              <span className="text-green-600 font-semibold">
                                Checked In
                              </span>
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
                      disabled={selectedAttendees.size === 0 || !badgeTemplate}
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
                    {user?.role !== 'usher' && (
                      <>
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
                      </>
                    )}
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
                            <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => generateBadge(attendee)}
                                disabled={!badgeTemplate}
                                title="Print badge using template design"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => testBadge(attendee)}
                                disabled={!badgeTemplate}
                                title="Preview badge design"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {user?.role === 'usher' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCheckIn(attendee.id, attendee.checked_in)}
                                    title={attendee.checked_in ? "Check out attendee" : "Check in attendee"}
                                    className={attendee.checked_in ? "text-green-600" : "text-blue-600"}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {/* TODO: Open edit dialog */}}
                                    title="Edit attendee information"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {user?.role !== 'usher' && (
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </DashboardCard>
            </TabsContent>
            <TabsContent value="ushers">
              <DashboardCard title="Ushers & Task Assignment">
                <UshersTasksSection eventId={eventId} />
              </DashboardCard>
            </TabsContent>
            <TabsContent value="team">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Team Members</h3>
                {teamLoading ? (
                  <div>Loading team members...</div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-gray-400">No team members found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border text-sm">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 border">Name</th>
                          <th className="px-4 py-2 border">Email</th>
                          <th className="px-4 py-2 border">Role</th>
                          <th className="px-4 py-2 border">Status</th>
                          <th className="px-4 py-2 border">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamMembers.map((member) => (
                          <tr key={member.id}>
                            <td className="px-4 py-2 border">
                              {member.name}
                              {member.is_primary_contact &&
                                member.role === 'organizer' && (
                                  <span className="ml-2 text-yellow-600 font-bold">
                                    (Primary)
                                  </span>
                                )}
                            </td>
                            <td className="px-4 py-2 border">{member.email}</td>
                            <td className="px-4 py-2 border">{member.role}</td>
                            <td className="px-4 py-2 border">{member.status}</td>
                            <td className="px-4 py-2 border">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditMember(member)}
                              >
                                <Pencil className="w-4 h-4" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveMember(member)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" /> Remove
                              </Button>
                              {!(
                                member.is_primary_contact &&
                                member.role === 'organizer'
                              ) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRoleMember(member)}
                                >
                                  <UserCog className="w-4 h-4 text-blue-500" />{' '}
                                  Change Role
                                </Button>
                              )}
                              {member.role === 'organizer' &&
                                !member.is_primary_contact && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSetPrimary(member)}
                                  >
                                    <Star className="w-4 h-4 text-yellow-500" /> Set
                                    Primary
                                  </Button>
                                )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Role</DialogTitle>
                    </DialogHeader>
                    {roleMember && (
                      <div className="space-y-4">
                        <div>
                          <span className="font-semibold">{roleMember.name}</span> (
                          {roleMember.email})
                        </div>
                        <Select value={newRole} onValueChange={setNewRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="usher">Usher</SelectItem>
                            <SelectItem value="organizer">Organizer</SelectItem>
                          </SelectContent>
                        </Select>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setRoleDialogOpen(false)}
                            disabled={roleLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleRoleChange}
                            disabled={roleLoading || newRole === roleMember.role}
                          >
                            {roleLoading ? 'Saving...' : 'Save Role'}
                          </Button>
                        </DialogFooter>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
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
                        {Object.keys(analytics.country_breakdown || {}).length > 0 ? (
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
                        ) : (
                          <div className="flex items-center justify-center h-64 text-gray-500">
                            No country data available
                          </div>
                        )}
                      </DashboardCard>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <DashboardCard title="Gender Breakdown">
                        {Object.keys(analytics.gender_breakdown || {}).length > 0 ? (
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
                        ) : (
                          <div className="flex items-center justify-center h-64 text-gray-500">
                            No gender data available
                          </div>
                        )}
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
          </>
        )}
      </Tabs>

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <style>{customRangeStyles}</style>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Edit Event
            </DialogTitle>
            <DialogDescription>
              Update the event details below.
            </DialogDescription>
          </DialogHeader>
          {editForm && (
            <form onSubmit={handleEditEvent} className="flex-1 overflow-y-auto space-y-6">
              {/* Event Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-lg text-gray-900">
                    Event Information
                  </h3>
                  <span className="text-gray-400 text-sm ml-2">
                    Event details and logistics
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_name" className="flex items-center gap-2 text-gray-700">
                      <Tag className="w-4 h-4" /> Event Name
                    </Label>
                    <Input
                      id="edit_name"
                      value={editForm.name}
                      onChange={(e) => handleEditInput('name', e.target.value)}
                      placeholder="Enter event name"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_location" className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4" /> Location
                    </Label>
                    <Input
                      id="edit_location"
                      value={editForm.location}
                      onChange={(e) => handleEditInput('location', e.target.value)}
                      placeholder="e.g. Grand Convention Center"
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="edit_description" className="flex items-center gap-2 text-gray-700">
                      <FileText className="w-4 h-4" /> Description
                    </Label>
                    <Textarea
                      id="edit_description"
                      value={editForm.description}
                      onChange={(e) => handleEditInput('description', e.target.value)}
                      placeholder="Describe your event..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_event_type_id" className="flex items-center gap-2 text-gray-700">
                      <Tag className="w-4 h-4" /> Event Type
                    </Label>
                    <Select
                      value={editForm.event_type_id}
                      onValueChange={(value) => handleEditInput('event_type_id', value)}
                      disabled={editLoadingStates.eventTypes}
                      required
                    >
                      <SelectTrigger className="mt-1 w-full" id="edit_event_type_id">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        {filterValidOptions(eventTypes).map((type: any) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editErrors.eventTypes && (
                      <div className="text-xs text-red-500 mt-1">
                        {editErrors.eventTypes}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="edit_event_category_id" className="flex items-center gap-2 text-gray-700">
                      <Tag className="w-4 h-4" /> Event Category
                    </Label>
                    <Select
                      value={editForm.event_category_id}
                      onValueChange={(value) => handleEditInput('event_category_id', value)}
                      disabled={editLoadingStates.eventCategories}
                      required
                    >
                      <SelectTrigger className="mt-1 w-full" id="edit_event_category_id">
                        <SelectValue placeholder="Select event category" />
                      </SelectTrigger>
                      <SelectContent>
                        {filterValidOptions(eventCategories).map((cat: any) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editErrors.eventCategories && (
                      <div className="text-xs text-red-500 mt-1">
                        {editErrors.eventCategories}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="edit_max_guests" className="flex items-center gap-2 text-gray-700">
                      <Users className="w-4 h-4" /> Max Guests
                    </Label>
                    <Input
                      id="edit_max_guests"
                      type="number"
                      value={editForm.max_guests}
                      onChange={(e) => handleEditInput('max_guests', e.target.value)}
                      placeholder="e.g. 500"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_guest_types" className="flex items-center gap-2 text-gray-700">
                      <Users className="w-4 h-4" /> Guest Types
                    </Label>
                    <Input
                      id="edit_guest_types"
                      value={editForm.guest_types || ''}
                      onChange={(e) => handleEditInput('guest_types', e.target.value)}
                      placeholder="e.g. VIP, Regular, Staff"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Comma-separated list of guest types.
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="edit_event_image" className="flex items-center gap-2 text-gray-700">
                      <Image className="w-4 h-4" /> Event Image
                    </Label>
                    <div className="flex items-center gap-3 mt-1">
                      <input
                        type="file"
                        id="edit_event_image"
                        ref={editImageInputRef}
                        accept="image/*"
                        onChange={handleEditFile}
                        className="hidden"
                      />
                      <label htmlFor="edit_event_image" className="inline-block">
                        <span className="inline-block px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded cursor-pointer border border-blue-200 hover:bg-blue-100 transition">
                          Choose File
                        </span>
                      </label>
                      <span className="text-gray-600 text-sm">
                        {editForm.event_image instanceof File
                          ? editForm.event_image.name
                          : editForm.event_image
                          ? 'Current image'
                          : 'No file chosen'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Upload your event banner (PNG, JPG, SVG)
                    </p>
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
                </div>
              </div>

              {/* Date Ranges */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold text-lg text-gray-900">
                    Event & Registration Dates
                  </h3>
                  <span className="text-gray-400 text-sm ml-2">
                    Set event and registration periods
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4" /> Event Date Range
                    </Label>
                    <Button
                      type="button"
                      className="w-full mt-1 mb-2 bg-purple-100 text-purple-700 hover:bg-purple-200"
                      onClick={() => setShowEditEventRange(true)}
                    >
                      {editForm.start_date && editForm.end_date
                        ? `${editEventRange[0].startDate.toLocaleDateString()} - ${editEventRange[0].endDate.toLocaleDateString()}`
                        : 'Select event date range'}
                    </Button>
                    {showEditEventRange && (
                      <div className="absolute z-50 bg-white border rounded-lg shadow-lg p-4">
                        <DateRange
                          ranges={editEventRange}
                          onChange={(item) => setEditEventRange([item.selection])}
                          minDate={new Date()}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowEditEventRange(false)}
                            className="rounded-full px-6"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            className="bg-purple-700 text-white rounded-full px-6"
                            onClick={() => {
                              setEditForm((prev: any) => ({
                                ...prev,
                                start_date: editEventRange[0].startDate,
                                end_date: editEventRange[0].endDate,
                              }))
                              setShowEditEventRange(false)
                            }}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4" /> Registration Date Range
                    </Label>
                    <Button
                      type="button"
                      className="w-full mt-1 mb-2 bg-green-100 text-green-700 hover:bg-green-200"
                      onClick={() => setShowEditRegRange(true)}
                    >
                      {editForm.registration_start_date && editForm.registration_end_date
                        ? `${editRegRange[0].startDate.toLocaleDateString()} - ${editRegRange[0].endDate.toLocaleDateString()}`
                        : 'Select registration date range'}
                    </Button>
                    {showEditRegRange && (
                      <div className="absolute z-50 bg-white border rounded-lg shadow-lg p-4">
                        <DateRange
                          ranges={editRegRange}
                          onChange={(item) => setEditRegRange([item.selection])}
                          minDate={new Date()}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowEditRegRange(false)}
                            className="rounded-full px-6"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            className="bg-green-700 text-white rounded-full px-6"
                            onClick={() => {
                              setEditForm((prev: any) => ({
                                ...prev,
                                registration_start_date: editRegRange[0].startDate,
                                registration_end_date: editRegRange[0].endDate,
                              }))
                              setShowEditRegRange(false)
                            }}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold text-lg text-gray-900">
                    Additional Information
                  </h3>
                  <span className="text-gray-400 text-sm ml-2">
                    Requirements and agenda
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="edit_requirements" className="flex items-center gap-2 text-gray-700">
                      <FileText className="w-4 h-4" /> Requirements & Prerequisites
                    </Label>
                    <Textarea
                      id="edit_requirements"
                      value={editForm.requirements || ''}
                      onChange={(e) => handleEditInput('requirements', e.target.value)}
                      placeholder="Any requirements or prerequisites for attendees..."
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="edit_agenda" className="flex items-center gap-2 text-gray-700">
                      <FileText className="w-4 h-4" /> Event Agenda
                    </Label>
                    <Textarea
                      id="edit_agenda"
                      value={editForm.agenda || ''}
                      onChange={(e) => handleEditInput('agenda', e.target.value)}
                      placeholder="Detailed event schedule and agenda..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-6 py-2 rounded-lg shadow"
                >
                  {editLoading ? (
                    <span className="flex items-center">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Updating...
                    </span>
                  ) : (
                    'Update Event'
                  )}
                </Button>
              </div>
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
                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
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
                    <SelectItem value="Antigua and Barbuda">Antigua and Barbuda</SelectItem>
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
                    <SelectItem value="Bosnia and Herzegovina">Bosnia and Herzegovina</SelectItem>
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
                    <SelectItem value="Central African Republic">Central African Republic</SelectItem>
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
                    <SelectItem value="Czech Republic">Czech Republic</SelectItem>
                    <SelectItem value="Democratic Republic of the Congo">Democratic Republic of the Congo</SelectItem>
                    <SelectItem value="Denmark">Denmark</SelectItem>
                    <SelectItem value="Djibouti">Djibouti</SelectItem>
                    <SelectItem value="Dominica">Dominica</SelectItem>
                    <SelectItem value="Dominican Republic">Dominican Republic</SelectItem>
                    <SelectItem value="Ecuador">Ecuador</SelectItem>
                    <SelectItem value="Egypt">Egypt</SelectItem>
                    <SelectItem value="El Salvador">El Salvador</SelectItem>
                    <SelectItem value="Equatorial Guinea">Equatorial Guinea</SelectItem>
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
                    <SelectItem value="Marshall Islands">Marshall Islands</SelectItem>
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
                    <SelectItem value="North Macedonia">North Macedonia</SelectItem>
                    <SelectItem value="Norway">Norway</SelectItem>
                    <SelectItem value="Oman">Oman</SelectItem>
                    <SelectItem value="Pakistan">Pakistan</SelectItem>
                    <SelectItem value="Palau">Palau</SelectItem>
                    <SelectItem value="Panama">Panama</SelectItem>
                    <SelectItem value="Papua New Guinea">Papua New Guinea</SelectItem>
                    <SelectItem value="Paraguay">Paraguay</SelectItem>
                    <SelectItem value="Peru">Peru</SelectItem>
                    <SelectItem value="Philippines">Philippines</SelectItem>
                    <SelectItem value="Poland">Poland</SelectItem>
                    <SelectItem value="Portugal">Portugal</SelectItem>
                    <SelectItem value="Qatar">Qatar</SelectItem>
                    <SelectItem value="Romania">Romania</SelectItem>
                    <SelectItem value="Russia">Russia</SelectItem>
                    <SelectItem value="Rwanda">Rwanda</SelectItem>
                    <SelectItem value="Saint Kitts and Nevis">Saint Kitts and Nevis</SelectItem>
                    <SelectItem value="Saint Lucia">Saint Lucia</SelectItem>
                    <SelectItem value="Saint Vincent and the Grenadines">Saint Vincent and the Grenadines</SelectItem>
                    <SelectItem value="Samoa">Samoa</SelectItem>
                    <SelectItem value="San Marino">San Marino</SelectItem>
                    <SelectItem value="Sao Tome and Principe">Sao Tome and Principe</SelectItem>
                    <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                    <SelectItem value="Senegal">Senegal</SelectItem>
                    <SelectItem value="Serbia">Serbia</SelectItem>
                    <SelectItem value="Seychelles">Seychelles</SelectItem>
                    <SelectItem value="Sierra Leone">Sierra Leone</SelectItem>
                    <SelectItem value="Singapore">Singapore</SelectItem>
                    <SelectItem value="Slovakia">Slovakia</SelectItem>
                    <SelectItem value="Slovenia">Slovenia</SelectItem>
                    <SelectItem value="Solomon Islands">Solomon Islands</SelectItem>
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
                    <SelectItem value="Trinidad and Tobago">Trinidad and Tobago</SelectItem>
                    <SelectItem value="Tunisia">Tunisia</SelectItem>
                    <SelectItem value="Turkey">Turkey</SelectItem>
                    <SelectItem value="Turkmenistan">Turkmenistan</SelectItem>
                    <SelectItem value="Tuvalu">Tuvalu</SelectItem>
                    <SelectItem value="Uganda">Uganda</SelectItem>
                    <SelectItem value="Ukraine">Ukraine</SelectItem>
                    <SelectItem value="United Arab Emirates">United Arab Emirates</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
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
      <Dialog
        open={createUsherDialogOpen}
        onOpenChange={setCreateUsherDialogOpen}
      >
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
                onChange={(e) =>
                  setNewUsher({ ...newUsher, name: e.target.value })
                }
                placeholder="Full Name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={newUsher.email}
                onChange={(e) =>
                  setNewUsher({ ...newUsher, email: e.target.value })
                }
                placeholder="Email Address"
                type="email"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                value={newUsher.password}
                onChange={(e) =>
                  setNewUsher({ ...newUsher, password: e.target.value })
                }
                placeholder="Password"
                type="password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateUsherDialogOpen(false)}
              disabled={creatingUsher}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600"
              disabled={
                creatingUsher ||
                !newUsher.name ||
                !newUsher.email ||
                !newUsher.password
              }
              onClick={async () => {
                setCreatingUsher(true)
                try {
                  await api.post('/users', {
                    name: newUsher.name,
                    email: newUsher.email,
                    password: newUsher.password,
                    role: 'usher',
                  })
                  toast.success('Usher account created!')
                  setCreateUsherDialogOpen(false)
                  setNewUsher({ name: '', email: '', password: '' })
                } catch (err) {
                  toast.error('Failed to create usher')
                } finally {
                  setCreatingUsher(false)
                }
              }}
            >
              {creatingUsher ? 'Creating...' : 'Create Usher'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden single badge print area */}
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
          height: '100%'
        }}
        className="printable-badge-container"
      >
      {singlePrintAttendee && (
            <div className="printable-badge-batch">
            <BadgePrint template={badgeTemplate} attendee={singlePrintAttendee} />
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
          height: '100%'
        }}
        className="printable-badge-container"
      >
        {printing && attendees
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
              <DialogTitle>Test Badge Preview</DialogTitle>
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
              <Button onClick={() => {
                setShowTestBadge(false)
                generateBadge(testAttendee)
              }}>
                Print Badge
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function UshersTasksSection({ eventId }: { eventId: string | undefined }) {
  const [allUshers, setAllUshers] = useState<any[]>([])
  const [eventUshers, setEventUshers] = useState<any[]>([])
  const [usherTaskStatuses, setUsherTaskStatuses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<{ [usherId: number]: boolean }>({})
  const [taskInputs, setTaskInputs] = useState<{ [usherId: number]: string }>(
    {}
  )
  const [assigning, setAssigning] = useState(false)
  const { user } = useAuth()
  const [editingUsherId, setEditingUsherId] = useState<number | null>(null)
  const [editTasks, setEditTasks] = useState<string>('')

  useEffect(() => {
    if (!eventId) return
    setLoading(true)
    Promise.all([
      getUshers(),
      getEventUshers(Number(eventId)),
      api.get(`/events/${eventId}/usher-tasks`),
    ])
      .then(([allRes, eventRes, statusRes]) => {
        setAllUshers(allRes.data)
        setEventUshers(eventRes.data)
        setUsherTaskStatuses(statusRes.data)
        // Initialize task inputs for assigned ushers
        const taskMap: { [usherId: number]: string } = {}
        eventRes.data.forEach((usher: any) => {
          taskMap[usher.id] = Array.isArray(usher.pivot?.tasks)
            ? usher.pivot.tasks.join(', ')
            : usher.pivot?.tasks
            ? JSON.parse(usher.pivot.tasks).join(', ')
            : ''
        })
        setTaskInputs(taskMap)
      })
      .catch(() => toast.error('Failed to fetch ushers'))
      .finally(() => setLoading(false))
  }, [eventId])

  const assignedUsherIds = new Set(eventUshers.map((u: any) => u.id))
  const organizerUshers = allUshers.filter(
    (u) => u.organizer_id === user?.organizer_id
  )

  const handleAssign = async (usherId: number) => {
    setAssigning(true)
    try {
      await assignUshersToEvent(Number(eventId), [
        {
          id: usherId,
          tasks: (taskInputs[usherId] || '')
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        },
      ])
      toast.success('Usher assigned!')
      // Refresh event ushers
      const eventRes = await getEventUshers(Number(eventId))
      setEventUshers(eventRes.data)
      setEditing((prev) => ({ ...prev, [usherId]: false }))
    } catch {
      toast.error('Failed to assign usher')
    } finally {
      setAssigning(false)
    }
  }

  const handleUpdateTasks = async (usherId: number) => {
    setAssigning(true)
    try {
      await updateUsherTasks(
        Number(eventId),
        usherId,
        (taskInputs[usherId] || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      )
      toast.success('Tasks updated!')
      // Refresh event ushers
      const eventRes = await getEventUshers(Number(eventId))
      setEventUshers(eventRes.data)
      setEditing((prev) => ({ ...prev, [usherId]: false }))
    } catch {
      toast.error('Failed to update tasks')
    } finally {
      setAssigning(false)
    }
  }

  if (loading) return <div>Loading ushers...</div>
  if (organizerUshers.length === 0)
    return <div>No ushers registered to your organizer.</div>

  return (
    <div className="space-y-4">
      {/* Show current usher assignments */}
      {eventUshers.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="font-semibold mb-2">Currently Assigned Ushers:</div>
          <ul className="space-y-2">
            {eventUshers.map((usher: any) => {
              const usherStatus = usherTaskStatuses.find((u: any) => u.usher_id === usher.id)
              let statusBadge = null
              if (usherStatus && usherStatus.tasks.length > 0) {
                const completion = usherStatus.task_completion || {}
                const allComplete = usherStatus.tasks.length > 0 && Object.values(completion).length > 0 && Object.values(completion).every((v: any) => v)
                const anyComplete = Object.values(completion).some((v: any) => v)
                if (allComplete) {
                  statusBadge = <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />All Tasks Complete</Badge>
                } else if (anyComplete) {
                  statusBadge = <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>
                } else {
                  statusBadge = <Badge className="bg-blue-100 text-blue-800"><UserCheck className="w-3 h-3 mr-1" />Assigned</Badge>
                }
              } else {
                statusBadge = <Badge className="bg-gray-100 text-gray-800"><UserCheck className="w-3 h-3 mr-1" />No Tasks Assigned</Badge>
              }
              return (
                <li key={usher.id} className="flex flex-col md:flex-row md:items-center md:gap-4">
                  <span className="font-medium">{usher.name} ({usher.email})</span>
                  {statusBadge}
                  {editingUsherId === usher.id ? (
                    <>
                      <input
                        className="border rounded px-2 py-1 ml-2"
                        value={editTasks}
                        onChange={e => setEditTasks(e.target.value)}
                      />
                      <Button size="sm" variant="outline" onClick={async () => {
                        await updateUsherTasks(eventId, usher.id, editTasks.split(',').map(t => t.trim()).filter(Boolean))
                        const eventRes = await getEventUshers(Number(eventId))
                        setEventUshers(eventRes.data)
                        setEditingUsherId(null)
                      }}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingUsherId(null)}>Cancel</Button>
                    </>
                  ) : (
                    usher.pivot?.tasks && (
                      <span className="text-sm text-gray-600">Tasks: {Array.isArray(usher.pivot.tasks) ? usher.pivot.tasks.join(', ') : (typeof usher.pivot.tasks === 'string' ? JSON.parse(usher.pivot.tasks).join(', ') : '')}</span>
                    )
                  )}
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingUsherId(usher.id)
                    setEditTasks(Array.isArray(usher.pivot?.tasks) ? usher.pivot.tasks.join(', ') : (typeof usher.pivot?.tasks === 'string' ? JSON.parse(usher.pivot.tasks).join(', ') : ''))
                  }}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={async () => {
                    await api.delete(`/events/${eventId}/ushers/${usher.id}`)
                    const eventRes = await getEventUshers(Number(eventId))
                    setEventUshers(eventRes.data)
                  }}>Remove</Button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      <div className="flex justify-end mb-2">
        <Button onClick={() => setAddUsherDialogOpen(true)} variant="outline">
          Add Usher
        </Button>
      </div>
      <Dialog open={addUsherDialogOpen} onOpenChange={setAddUsherDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Usher</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new usher to your team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Full Name"
              value={newUsher.name}
              onChange={(e) =>
                setNewUsher({ ...newUsher, name: e.target.value })
              }
            />
            <Input
              placeholder="Email Address"
              type="email"
              value={newUsher.email}
              onChange={(e) =>
                setNewUsher({ ...newUsher, email: e.target.value })
              }
            />
            <Input
              placeholder="Password"
              type="password"
              value={newUsher.password}
              onChange={(e) =>
                setNewUsher({ ...newUsher, password: e.target.value })
              }
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddUsherDialogOpen(false)}
              disabled={addingUsher}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUsher}
              disabled={
                addingUsher ||
                !newUsher.name ||
                !newUsher.email ||
                !newUsher.password
              }
            >
              {addingUsher ? 'Adding...' : 'Add Usher'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="space-y-4">
        {organizerUshers.map((usher) => (
          <div
            key={usher.id}
            className="border rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <div className="font-semibold">
                {usher.name}{' '}
                <span className="text-xs text-gray-500">({usher.email})</span>
              </div>
              <div className="text-xs text-gray-500">Usher ID: {usher.id}</div>
            </div>
            <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
              <input
                className="border rounded px-2 py-1 w-full md:w-64"
                placeholder="Enter tasks, comma separated"
                value={taskInputs[usher.id] || ''}
                onChange={(e) =>
                  setTaskInputs((prev) => ({
                    ...prev,
                    [usher.id]: e.target.value,
                  }))
                }
                disabled={
                  assigning ||
                  (!assignedUsherIds.has(usher.id) &&
                    editing[usher.id] !== true)
                }
              />
              {assignedUsherIds.has(usher.id) ? (
                <>
                  <Button
                    variant="outline"
                    disabled={assigning}
                    onClick={() => handleUpdateTasks(usher.id)}
                  >
                    Update Tasks
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  disabled={assigning}
                  onClick={() => handleAssign(usher.id)}
                >
                  Assign to Event
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
