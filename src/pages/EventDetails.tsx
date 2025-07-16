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
  Loader2,
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
import BadgePrint from '@/components/Badge'
import BadgeTest from '@/components/BadgeTest'
import { getOfficialBadgeTemplate, getBadgeTemplates } from '@/lib/badgeTemplates'
import { BadgeTemplate } from '@/types/badge'
import { DateRange } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { useInterval } from '@/hooks/use-interval'
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

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

  // Badge template state
  const [badgeTemplate, setBadgeTemplate] = useState<BadgeTemplate | null>(null)
  const [badgeTemplateLoading, setBadgeTemplateLoading] = useState(false)

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

  const [printing, setPrinting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

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

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [forceDeleteDialogOpen, setForceDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Edit attendee dialog state
  const [editAttendeeDialogOpen, setEditAttendeeDialogOpen] = useState(false)
  const [editAttendeeForm, setEditAttendeeForm] = useState<any>(null)
  const [editAttendeeLoading, setEditAttendeeLoading] = useState(false)

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
      .get(`/events/${Number(eventId)}`)
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
      .get(`/events/${Number(eventId)}/attendees`)
      .then((res) => {
        console.log('DEBUG - Fetched attendees:', res.data);
        if (res.data && res.data.length > 0) {
          console.log('DEBUG - First attendee:', res.data[0]);
          console.log('DEBUG - First attendee guestType:', res.data[0]?.guestType);
        }
        setAttendees(res.data)
      })
      .catch((err) => setAttendeesError('Failed to fetch attendees.'))
      .finally(() => setAttendeesLoading(false))
  }, [eventId])

  // Fetch guest types
  useEffect(() => {
    if (!eventId) return
    api
      .get(`/events/${Number(eventId)}/guest-types`)
      .then((res) => setGuestTypes(res.data))
      .catch((err) => toast.error('Failed to fetch guest types.'))
  }, [eventId])

  // Fetch badge template
  useEffect(() => {
    if (!eventId) return
    setBadgeTemplateLoading(true)
    getOfficialBadgeTemplate(Number(eventId))
      .then((res) => setBadgeTemplate(res.data))
      .catch(() => {
        // If no official template, try to get any template
        getBadgeTemplates(Number(eventId))
          .then((res) => {
            if (res.data && res.data.length > 0) {
              setBadgeTemplate(res.data[0])
            }
          })
          .catch(() => {
            // No templates available, that's okay
            setBadgeTemplate(null)
          })
      })
      .finally(() => setBadgeTemplateLoading(false))
  }, [eventId])

  useEffect(() => {
    if (!eventId || activeTab !== 'analytics') return
    setAnalyticsLoading(true)
    setAnalyticsError(null)
    api
      .get(`/events/${Number(eventId)}/check-in/stats`)
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

  useEffect(() => {
    if (!user?.organizer_id) return
    setTeamLoading(true)
    api
      .get(`/organizers/${user.organizer_id}/contacts`)
      .then((res) => setTeamMembers(res.data))
      .catch(() => setTeamMembers([]))
      .finally(() => setTeamLoading(false))
  }, [user?.organizer_id])

 

  const filteredAttendees = attendees.filter((attendee) => {
    const matchesSearch =
      attendee.guest?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.guest?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.guest?.company?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Handle guest type filtering properly
    let guestTypeName = '';
    if (attendee.guestType) {
      if (typeof attendee.guestType === 'object' && attendee.guestType !== null) {
        guestTypeName = (attendee.guestType.name || attendee.guestType.id || '').toLowerCase();
      } else if (typeof attendee.guestType === 'string') {
        guestTypeName = attendee.guestType.toLowerCase();
      } else {
        guestTypeName = String(attendee.guestType).toLowerCase();
      }
    }
    
    const matchesGuestType =
      guestTypeFilter === 'all' ||
      guestTypeName === guestTypeFilter
    
    const matchesCheckedIn =
      checkedInFilter === 'all' ||
      (checkedInFilter === 'checked-in' && attendee.checked_in) ||
      (checkedInFilter === 'not-checked-in' && !attendee.checked_in)
    return matchesSearch && matchesGuestType && matchesCheckedIn
  })

  const testBadge = (attendee: (typeof attendees)[0]) => {
    setSinglePrintAttendee(attendee)
    // setSinglePrintDialogOpen(true) // This function does not exist
  }

  const exportCSV = () => {
    if (filteredAttendees.length === 0) {
      toast.info('No attendees to export.')
      return
    }

    const dataToExport = filteredAttendees.map((attendee) => {
      // Handle guest type display properly for CSV export
      let guestTypeName = 'N/A';
      if (attendee.guestType) {
        if (typeof attendee.guestType === 'object' && attendee.guestType !== null) {
          guestTypeName = attendee.guestType.name || attendee.guestType.id || 'N/A';
        } else if (typeof attendee.guestType === 'string') {
          guestTypeName = attendee.guestType;
        } else {
          guestTypeName = String(attendee.guestType);
        }
      }
      
      return {
        'Attendee ID': attendee.id,
        'Name': attendee.guest?.name || 'N/A',
        'Email': attendee.guest?.email || 'N/A',
        'Phone': attendee.guest?.phone || 'N/A',
        'Company': attendee.guest?.company || 'N/A',
        'Job Title': attendee.guest?.jobtitle || 'N/A',
        'Gender': attendee.guest?.gender || 'N/A',
        'Country': attendee.guest?.country || 'N/A',
        'Guest Type': guestTypeName,
        'Registration Date': attendee.created_at 
          ? format(parseISO(attendee.created_at), 'MMM d, yyyy, h:mm a')
          : 'N/A',
        'Checked In': attendee.checked_in ? 'Yes' : 'No',
        'Check-In Time': attendee.check_in_time
          ? format(parseISO(attendee.check_in_time), 'MMM d, yyyy, h:mm a')
          : 'N/A',
      };
    })

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

  const handleBatchPrintBadges = async () => {
    if (selectedAttendees.size === 0) {
      toast.error('No attendees selected for printing.');
      return;
    }
    setPrinting(true);
    // Wait for the badges to render in the hidden printRef
    setTimeout(async () => {
      if (printRef.current) {
        const badgeElements = Array.from(printRef.current.querySelectorAll('.printable-badge-batch'));
        if (badgeElements.length === 0) {
          toast.error('No badges found to print.');
          setPrinting(false);
          return;
        }
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [320, 480] });
        for (let i = 0; i < badgeElements.length; i++) {
          const el = badgeElements[i] as HTMLElement;
          const canvas = await html2canvas(el, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          if (i > 0) pdf.addPage([320, 480], 'portrait');
          pdf.addImage(imgData, 'PNG', 0, 0, 320, 480);
        }
        pdf.autoPrint();
        window.open(pdf.output('bloburl'));
        setPrinting(false);
      }
    }, 300);
  };

  const handleImportClick = () => {
    setCsvUploadDialogOpen(true)
    setCsvUploadStep('upload')
    setCsvUploadData([])
    setCsvUploadErrors([])
    setCsvUploadWarnings([])
    setCsvUploadSuccess([])
  }

  const downloadSampleCSV = () => {
    const sampleData = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'Tech Corp',
        jobtitle: 'Software Engineer',
        gender: 'Male',
        country: 'United States',
        guest_type_name: 'Regular'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567891',
        company: 'Design Studio',
        jobtitle: 'UX Designer',
        gender: 'Female',
        country: 'Canada',
        guest_type_name: 'VIP'
      }
    ]

    const csv = Papa.unparse(sampleData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'sample_attendees.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        console.log('CSV parsing results:', results)
        
        // Check if we have any data
        if (!results.data || results.data.length === 0) {
          toast.error('CSV file is empty or contains no valid data.')
          setIsImporting(false)
          return
        }

        // Check for required headers (case-insensitive)
        const requiredHeaders = ['name', 'email', 'guest_type_name']
        const headers = (results.meta.fields || []).map(h => h.toLowerCase())
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h.toLowerCase())
        )

        if (missingHeaders.length > 0) {
          toast.error(
            `CSV is missing required headers: ${missingHeaders.join(', ')}. Please download the sample CSV template for the correct format.`
          )
          setIsImporting(false)
          return
        }

        // Map guest_type_name to guest_type_id (case-insensitive)
        const guestTypeMap = new Map(
          guestTypes.map((gt) => [gt.name.toLowerCase(), gt.id])
        )
        
        console.log('Available guest types:', guestTypes)
        console.log('Guest type map:', guestTypeMap)

        const attendeesToImport = results.data.map((row: any, index: number) => {
          // Normalize the guest_type_name to lowercase for matching
          const guestTypeName = row.guest_type_name?.toLowerCase()
          const guestTypeId = guestTypeMap.get(guestTypeName)
          
          console.log(`Row ${index + 1}: guest_type_name="${row.guest_type_name}" -> guestTypeId=${guestTypeId}`)
          
          return {
            name: row.name?.trim(),
            email: row.email?.trim(),
            phone: row.phone?.trim() || null,
            company: row.company?.trim() || null,
            jobtitle: row.jobtitle?.trim() || null,
            gender: row.gender?.trim() || null,
            country: row.country?.trim() || null,
            guest_type_id: guestTypeId
          }
        })

        const invalidRows = attendeesToImport.filter((a, index) => {
          const isValid = a.guest_type_id && a.name && a.email
          if (!isValid) {
            console.log(`Invalid row ${index + 1}:`, a)
          }
          return !isValid
        })

        if (invalidRows.length > 0) {
          const invalidEmails = invalidRows.map((r, index) => r.email || `Row ${index + 1}`).join(', ')
          toast.error(
            `Some rows have invalid data. Please check: ${invalidEmails}. Make sure all rows have name, email, and a valid guest type.`
          )
          setIsImporting(false)
          return
        }

        try {
          console.log('Sending attendees to import:', attendeesToImport)
          const response = await api.post(
            `/events/${Number(eventId)}/attendees/batch`,
            { attendees: attendeesToImport }
          )
          const { created, errors } = response.data

          if (created && created.length > 0) {
            // Refetch the attendee list from the backend to ensure it's up-to-date
            const res = await api.get(`/events/${Number(eventId)}/attendees`)
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
          console.error('Import error:', err)
          toast.error(err.response?.data?.error || 'Failed to import CSV.')
        } finally {
          setIsImporting(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error)
        toast.error('Failed to parse CSV file. Please check the file format.')
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
      
      await api.put(`/events/${Number(eventId)}`, payload, { headers })
      toast.success('Event updated successfully!')
      setEditDialogOpen(false)
      // Refresh event details
      const res = await api.get(`/events/${Number(eventId)}`)
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
      const response = await api.post(`/events/${Number(eventId)}/attendees`, payload)
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
      setUsers(allRes.data)
      setEventUshers(eventRes.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add usher')
    } finally {
      setAddingUsher(false)
    }
  }

  // Check-in attendee function
  const handleCheckIn = async (attendeeId: number) => {
    try {
      await api.post(`/events/${Number(eventId)}/attendees/${attendeeId}/check-in`, { checked_in: true })
      setAttendees(prev => prev.map(attendee => attendee.id === attendeeId ? { ...attendee, checked_in: true } : attendee))
      toast.success('Attendee checked in successfully!')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to check in attendee.')
    }
  }

  // Edit attendee function
  const handleEditAttendee = async (attendeeId: number, updatedData: any) => {
    try {
      const response = await api.put(`/events/${Number(eventId)}/attendees/${attendeeId}`, updatedData)
      
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

  // Open edit attendee dialog
  const openEditAttendeeDialog = (attendee: any) => {
    setEditAttendeeForm({
      id: attendee.id,
      name: attendee.guest?.name || '',
      email: attendee.guest?.email || '',
      phone: attendee.guest?.phone || '',
      company: attendee.guest?.company || '',
      jobtitle: attendee.guest?.jobtitle || '',
      gender: attendee.guest?.gender || '',
      country: attendee.guest?.country || '',
      guest_type_id: attendee.guest_type_id || attendee.guestType?.id || '',
    })
    setEditAttendeeDialogOpen(true)
  }

  // Handle edit attendee input changes
  const handleEditAttendeeInput = (field: string, value: any) => {
    setEditAttendeeForm((prev: any) => ({ ...prev, [field]: value }))
  }

  // Handle edit attendee form submission
  const handleEditAttendeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditAttendeeLoading(true)
    try {
      const updatedData = {
        name: editAttendeeForm.name,
        email: editAttendeeForm.email,
        phone: editAttendeeForm.phone,
        company: editAttendeeForm.company,
        jobtitle: editAttendeeForm.jobtitle,
        gender: editAttendeeForm.gender,
        country: editAttendeeForm.country,
        guest_type_id: editAttendeeForm.guest_type_id,
      }
      
      await handleEditAttendee(editAttendeeForm.id, updatedData)
      setEditAttendeeDialogOpen(false)
      setEditAttendeeForm(null)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update attendee.')
    } finally {
      setEditAttendeeLoading(false)
    }
  }

  // CSV Upload Dialog State
  const [csvUploadDialogOpen, setCsvUploadDialogOpen] = useState(false)
  const [csvUploadData, setCsvUploadData] = useState<any[]>([])
  const [csvUploadErrors, setCsvUploadErrors] = useState<any[]>([])
  const [csvUploadWarnings, setCsvUploadWarnings] = useState<any[]>([])
  const [csvUploadSuccess, setCsvUploadSuccess] = useState<any[]>([])
  const [csvUploadStep, setCsvUploadStep] = useState<'upload' | 'review' | 'importing' | 'complete'>('upload')

  // Usher state
  const [eventUshers, setEventUshers] = useState<any[]>([])
  const [editingUsherId, setEditingUsherId] = useState<number | null>(null)
  const [editTasks, setEditTasks] = useState('')

  useEffect(() => {
    if (!eventId) return
    getEventUshers(Number(eventId))
      .then((res) => setEventUshers(res.data))
      .catch((err) => toast.error('Failed to fetch event ushers.'))
  }, [eventId])

  const [checkinSearchTerm, setCheckinSearchTerm] = useState('')
  const [checkinStatusFilter, setCheckinStatusFilter] = useState('all')
  const [showQrScanner, setShowQrScanner] = useState(false)

  const filteredCheckinAttendees = attendees.filter((attendee) => {
    const matchesSearch =
      attendee.guest?.name?.toLowerCase().includes(checkinSearchTerm.toLowerCase()) ||
      attendee.guest?.email?.toLowerCase().includes(checkinSearchTerm.toLowerCase()) ||
      attendee.guest?.phone?.toLowerCase().includes(checkinSearchTerm.toLowerCase())
    const matchesStatus =
      checkinStatusFilter === 'all' ||
      (checkinStatusFilter === 'checkedin' && attendee.checked_in) ||
      (checkinStatusFilter === 'notcheckedin' && !attendee.checked_in)
    return matchesSearch && matchesStatus
  })

  useInterval(() => {
    if (eventId && activeTab === 'analytics') {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      api.get(`/events/${Number(eventId)}/check-in/stats`)
        .then((res) => setAnalytics(res.data))
        .catch((err) => setAnalyticsError('Failed to fetch analytics.'))
        .finally(() => setAnalyticsLoading(false));
    }
  }, 10000); // Poll every 10 seconds

  useEffect(() => {
    if (printing && printRef.current) {
      handleBatchPrintBadges();
    }
  }, [printing, printRef.current]);

  const [showTestBadge, setShowTestBadge] = useState(false)
  const [testAttendee, setTestAttendee] = useState<any>(null)

  // Add a ref for the PDF badge area
  const pdfBadgeRef = useRef<HTMLDivElement>(null);

  const handleDownloadBadgePDF = async (attendee: any) => {
    setSinglePrintAttendee(attendee);
    // Wait for the badge to render
    setTimeout(async () => {
      if (pdfBadgeRef.current) {
        const canvas = await html2canvas(pdfBadgeRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [320, 480] });
        pdf.addImage(imgData, 'PNG', 0, 0, 320, 480);
        pdf.save(`${attendee.guest?.name || 'badge'}.pdf`);
        pdf.autoPrint();
        window.open(pdf.output('bloburl'));
        setSinglePrintAttendee(null);
      }
    }, 300);
  };

  // Add a ref for the hidden badge print area
  const singleBadgePrintRef = useRef<HTMLDivElement>(null)

  const handleSingleBadgePrint = async (attendee: any) => {
    setSinglePrintAttendee(attendee)
    // Wait for the badge to render
    setTimeout(async () => {
      if (singleBadgePrintRef.current) {
        // Use html2canvas to capture the badge
        const canvas = await html2canvas(singleBadgePrintRef.current, { scale: 2 })
        const imgData = canvas.toDataURL('image/png')
        // Create a jsPDF document
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [320, 480] })
        pdf.addImage(imgData, 'PNG', 0, 0, 320, 480)
        pdf.autoPrint()
        window.open(pdf.output('bloburl'))
        setSinglePrintAttendee(null)
      }
    }, 300)
  }

  // Move this state declaration to the top, before any useEffect or code that uses it:
  const [singlePrintAttendee, setSinglePrintAttendee] = useState<any>(null)

  // Soft delete (move to trash)
  const handleDeleteEvent = async () => {
    setDeleteLoading(true)
    try {
      await api.delete(`/events/${Number(eventId)}`)
      toast.success('Event moved to trash!')
      setDeleteDialogOpen(false)
      // Optionally redirect or refresh
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete event')
    } finally {
      setDeleteLoading(false)
    }
  }
  // Force delete (permanent)
  const handleForceDeleteEvent = async () => {
    setDeleteLoading(true)
    try {
      await api.delete(`/events/${Number(eventId)}/force`)
      toast.success('Event permanently deleted!')
      setForceDeleteDialogOpen(false)
      // Optionally redirect or refresh
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to permanently delete event')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Add state for status change
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
  ];

  const handleStatusChange = async (newStatus: string) => {
    if (!eventId) return;
    setStatusLoading(true);
    setStatusError(null);
    try {
      const res = await api.patch(`/events/${Number(eventId)}/status`, { status: newStatus });
      setEventData((prev: any) => ({ ...prev, status: newStatus }));
      toast.success('Event status updated!');
    } catch (err: any) {
      setStatusError(err.response?.data?.error || 'Failed to update status.');
      toast.error(statusError || 'Failed to update status.');
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <>
      <div
        ref={printRef}
        style={{
          position: 'absolute',
          top: -9999,
          left: -9999,
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          visibility: printing ? 'visible' : 'hidden',
          pointerEvents: 'none',
        }}
      >
        {printing && selectedAttendees.size > 0 ? (
          attendees
            .filter(attendee => selectedAttendees.has(attendee.id))
            .map(attendee => (
              <div key={attendee.id} className="printable-badge-batch">
                <BadgePrint attendee={attendee} template={badgeTemplate} />
              </div>
            ))
        ) : (
          <div>No badges selected for printing.</div>
        )}
      </div>
      <div className="space-y-6">
        {!eventData ? (
          <div>Loading...</div>
        ) : (
          <>
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
                <p className="text-gray-600 mt-1">
                  Organized by{' '}
                  <span className="font-semibold text-blue-600">
                    {user?.organizer?.name || eventData.organizer?.name}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {/* Status Change Dropdown for Organizer/Admin */}
                {(user?.role === 'admin' || user?.role === 'superadmin' || (user?.role === 'organizer' && user?.organizer_id === eventData.organizer_id)) && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={eventData.status}
                      onValueChange={handleStatusChange}
                      disabled={statusLoading}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {statusLoading && <Loader2 className="animate-spin w-4 h-4 text-blue-500" />}
                    {statusError && <span className="text-red-500 text-xs ml-2">{statusError}</span>}
                  </div>
                )}
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
                        {/* Social Media Share Buttons */}
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-semibold text-gray-700">Share on Social Media:</span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-blue-600 text-white hover:bg-blue-700"
                              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/register/${eventData.uuid}`)}`, '_blank')}
                            >
                              Facebook
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-blue-400 text-white hover:bg-blue-500"
                              onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/register/${eventData.uuid}`)}&text=${encodeURIComponent('Register for ' + eventData.name)}`, '_blank')}
                            >
                              Twitter
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-500 text-white hover:bg-green-600"
                              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Register for ' + eventData.name + ': ' + window.location.origin + '/register/' + eventData.uuid)}`, '_blank')}
                            >
                              WhatsApp
                            </Button>
                          </div>
                        </div>
                        {/* Embeddable Iframe */}
                        <div className="flex flex-col gap-1 mt-2">
                          <span className="text-xs font-semibold text-gray-700">Embed on your website:</span>
                          <Input
                            value={`<iframe src='${window.location.origin}/register/${eventData.uuid}' width='100%' height='600' style='border:none;'></iframe>`}
                            readOnly
                            className="text-xs bg-white font-mono"
                            onClick={e => (e.target as HTMLInputElement).select()}
                          />
                          <span className="text-xs text-gray-500">Copy and paste this HTML code into your website to embed the registration form.</span>
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
                {/* Event Delete/Trash Actions */}
                {(user?.role === 'admin' || (user?.role === 'organizer' && eventData.organizer_id === user.organizer_id)) && (
                  <div className="flex gap-2 mt-2">
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Move to Trash</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Move Event to Trash</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to move this event to trash? You can restore it later from the Trash page.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteEvent} disabled={deleteLoading} className="bg-red-600 text-white">
                            {deleteLoading ? 'Deleting...' : 'Move to Trash'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    {user?.role === 'admin' && (
                      <AlertDialog open={forceDeleteDialogOpen} onOpenChange={setForceDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">Delete Permanently</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Permanently Delete Event</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. Are you sure you want to permanently delete this event?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleForceDeleteEvent} disabled={deleteLoading} className="bg-red-700 text-white">
                              {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
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
                <TabsContent value="details">
                  <div className="flex flex-col gap-6 md:flex-row md:gap-8">
                    {/* Left: Event Info Card */}
                    <div className="flex-1 bg-white rounded-xl shadow p-6 min-w-[320px]">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold">{eventData.name}</h2>
                      </div>
                      <div className="flex flex-wrap gap-4 items-center mb-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-5 h-5 text-blue-500" />
                          <span>{typeof eventData.start_date === 'string' ? format(parseISO(eventData.start_date), 'yyyy-MM-dd') : ''} - {typeof eventData.end_date === 'string' ? format(parseISO(eventData.end_date), 'yyyy-MM-dd') : ''}</span>
                        </div>
                       
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-5 h-5 text-pink-500" />
                          <span>{eventData.location}</span>
                        </div>
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Description</span>
                        <p className="text-gray-700 mt-1">{eventData.description}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          className={
                            eventData.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-700 uppercase'
                              : eventData.status === 'active'
                              ? 'bg-green-100 text-green-700 uppercase'
                              : eventData.status === 'completed'
                              ? 'bg-blue-100 text-blue-700 uppercase'
                              : 'bg-gray-100 text-gray-700 uppercase'
                          }
                        >
                          {eventData.status}
                        </Badge>
                      </div>
                    </div>
                    {/* Right: Quick Stats & Actions */}
                    <div className="flex flex-col gap-4 min-w-[260px]">
                      {/* Status Change Dropdown for Organizer/Admin */}
                      {/* {(user?.role === 'admin' || user?.role === 'superadmin' || (user?.role === 'organizer' && user?.organizer_id === eventData.organizer_id)) && (
                        <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-2">
                          <div className="font-semibold text-gray-700 mb-2">Change Event Status</div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={eventData.status}
                              onValueChange={handleStatusChange}
                              disabled={statusLoading}
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {statusLoading && <Loader2 className="animate-spin w-4 h-4 text-blue-500" />}
                            {statusError && <span className="text-red-500 text-xs ml-2">{statusError}</span>}
                          </div>
                        </div>
                      )} */}
                      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                        <div className="text-sm text-gray-500 mb-2">Quick Stats</div>
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-3xl font-bold text-blue-700">{attendees.length}</div>
                          <div className="text-xs text-gray-500">Registered</div>
                          <div className="text-2xl font-bold text-green-700">{attendees.filter(a => a.checked_in).length}</div>
                          <div className="text-xs text-gray-500">Checked In</div>
                          <div className="text-xl font-bold text-gray-700">{eventData.max_guests}</div>
                          <div className="text-xs text-gray-500">Max Capacity</div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-2">
                        <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => setIsNewConversationDialogOpen(true)}>
                          <MessageSquare className="w-4 h-4" /> New Conversation
                        </Button>
                        <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => setIsCommunicationDialogOpen(true)}>
                          <Send className="w-4 h-4" /> Broadcast
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button variant="outline" onClick={exportCSV} className="flex items-center gap-2">
                          <Download className="w-4 h-4" /> Export CSV
                        </Button>
                        <Button variant="outline" onClick={exportLogs} className="flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Export Logs
                        </Button>
                        <Button variant="outline" onClick={generateReport} className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" /> Generate Report
                        </Button>
                        <Button variant="default" onClick={openEditDialog} className="flex items-center gap-2">
                          <Edit className="w-4 h-4" /> Edit Event
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="badges">
                  <div className="flex flex-col gap-6">
                    {/* Remove conditional on badgeTemplate, always show badge printing UI */}
                    <>
                      <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Attendee Badges</h3>
                        <Button variant="outline" onClick={handleBatchPrintBadges} className="flex items-center gap-2">
                          <Printer className="w-4 h-4" /> Print Selected Badges
                        </Button>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead><Checkbox checked={selectedAttendees.size === attendees.length && attendees.length > 0} onCheckedChange={handleSelectAllAttendees} /></TableHead>
                              <TableHead>Attendee</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Guest Type</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Badge Preview</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendees.map(attendee => (
                              <TableRow key={attendee.id}>
                                <TableCell><Checkbox checked={selectedAttendees.has(attendee.id)} onCheckedChange={() => handleSelectAttendee(attendee.id)} /></TableCell>
                                <TableCell>{attendee.guest?.name}</TableCell>
                                <TableCell>{attendee.guest?.email}</TableCell>
                                <TableCell>
                                  {(() => {
                                    // Handle guest type display properly
                                    const guestType = attendee.guest_type;
                                    if (guestType) {
                                      if (typeof guestType === 'object' && guestType !== null) {
                                        return guestType.name || guestType.id || 'Unknown';
                                      } else if (typeof guestType === 'string') {
                                        return guestType;
                                      } else {
                                        return String(guestType);
                                      }
                                    }
                                    return 'Unknown';
                                  })()}
                                </TableCell>
                                <TableCell>{attendee.checked_in ? <Badge className="bg-green-100 text-green-700">Checked In</Badge> : <Badge className="bg-gray-100 text-gray-700">Not Checked In</Badge>}</TableCell>
                                <TableCell>
                                  <div className="w-32 h-20 bg-gray-50 border rounded flex items-center justify-center overflow-hidden">
                                    <div style={{ transform: 'scale(0.2)', transformOrigin: 'top left', width: 400, height: 600 }}>
                                      <BadgePrint attendee={attendee} template={badgeTemplate} />
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Button size="sm" variant="outline" onClick={() => {
                                    setSelectedAttendees(new Set([attendee.id]));
                                    setPrinting(true);
                                  }} className="flex items-center gap-1 mb-1">
                                    <Printer className="w-4 h-4" /> Print
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  </div>
                </TabsContent>
                <TabsContent value="attendees">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">Attendee Management</h3>
                      <div className="flex gap-2">
                        <Button variant="default" onClick={() => setAddAttendeeDialogOpen(true)} className="flex items-center gap-2">
                          <Plus className="w-4 h-4" /> Add Attendee
                        </Button>
                        <Button variant="outline" onClick={() => setCsvUploadDialogOpen(true)} className="flex items-center gap-2">
                          <Upload className="w-4 h-4" /> Upload CSV
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Input
                        placeholder="Search attendees..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-64"
                      />
                      <Select value={guestTypeFilter} onValueChange={setGuestTypeFilter}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {guestTypes.map(type => (
                            <SelectItem key={type.id} value={type.name.toLowerCase()}>{type.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={checkedInFilter} onValueChange={setCheckedInFilter}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="checked-in">Checked In</SelectItem>
                          <SelectItem value="not-checked-in">Not Checked In</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Attendee</TableHead>
                            <TableHead>Company & Title</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Guest Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAttendees.map(attendee => (
                            <TableRow key={attendee.id}>
                              <TableCell className="flex items-center gap-2">
                                <img src={attendee.guest?.profile_picture || '/placeholder-avatar.png'} alt={attendee.guest?.name} className="w-8 h-8 rounded-full object-cover" />
                                <div>
                                  <div className="font-semibold">{attendee.guest?.name}</div>
                                  <div className="text-xs text-gray-500">{attendee.guest?.country}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{attendee.guest?.company}</div>
                                <div className="text-xs text-gray-500">{attendee.guest?.jobtitle}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> {attendee.guest?.email}</div>
                                <div className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> {attendee.guest?.phone}</div>
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  attendee.guest_type?.name?.toLowerCase() === 'speaker' ? 'bg-purple-100 text-purple-700' :
                                  attendee.guest_type?.name?.toLowerCase() === 'vip' ? 'bg-yellow-100 text-yellow-700' :
                                  attendee.guest_type?.name?.toLowerCase() === 'visitor' ? 'bg-gray-100 text-gray-700' :
                                  'bg-blue-100 text-blue-700'
                                }>
                                  {(() => {
                                    console.log('DEBUG Table - attendee:', attendee);
                                    console.log('DEBUG Table - attendee.guest_type:', attendee.guest_type);
                                    
                                    // Handle guest type display properly
                                    const guestType = attendee.guest_type;
                                    if (guestType) {
                                      if (typeof guestType === 'object' && guestType !== null) {
                                        const result = guestType.name || guestType.id || 'Unknown';
                                        console.log('DEBUG Table - extracted from object:', result);
                                        return result;
                                      } else if (typeof guestType === 'string') {
                                        console.log('DEBUG Table - is string:', guestType);
                                        return guestType;
                                      } else {
                                        const result = String(guestType);
                                        console.log('DEBUG Table - converted to string:', result);
                                        return result;
                                      }
                                    }
                                    console.log('DEBUG Table - no guest type, returning Unknown');
                                    return 'Unknown';
                                  })()}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {attendee.checked_in ? <Badge className="bg-green-100 text-green-700">Checked In</Badge> : <Badge className="bg-gray-100 text-gray-700">Not Checked In</Badge>}
                              </TableCell>
                              <TableCell className="flex flex-wrap gap-1">
                                <Button size="sm" variant="outline" onClick={() => {
                                  setSelectedAttendees(new Set([attendee.id]));
                                  setPrinting(true);
                                }}><Printer className="w-4 h-4" /></Button>
                                <Button size="sm" variant="outline" onClick={() => testBadge(attendee)}><Eye className="w-4 h-4" /></Button>
                                <Button size="sm" variant="outline" onClick={() => openEditAttendeeDialog(attendee)}><Edit className="w-4 h-4" /></Button>
                                <Button size="sm" variant="destructive" onClick={() => handleRemoveMember(attendee)}><Trash2 className="w-4 h-4" /></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Add/Edit Attendee Dialogs are already implemented elsewhere in the file */}
                  </div>
                </TabsContent>
                <TabsContent value="ushers">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">Assigned Ushers</h3>
                      <Button variant="default" onClick={() => setIsAssignUsherDialogOpen(true)} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Usher
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tasks</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {eventUshers && eventUshers.length > 0 ? eventUshers.map(usher => (
                            <TableRow key={usher.id}>
                              <TableCell className="flex items-center gap-2">
                                <img src={usher.profile_picture || '/placeholder-avatar.png'} alt={usher.name} className="w-8 h-8 rounded-full object-cover" />
                                <div>
                                  <div className="font-semibold">{usher.name}</div>
                                  <div className="text-xs text-gray-500">{usher.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs text-gray-500">{usher.phone}</div>
                              </TableCell>
                              <TableCell>
                                <Badge className={usher.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                  {usher.status || 'available'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {editingUsherId === usher.id ? (
                                  <div className="flex gap-2 items-center">
                                    <Input
                                      value={editTasks}
                                      onChange={e => setEditTasks(e.target.value)}
                                      className="w-40"
                                    />
                                    <Button size="sm" variant="outline" onClick={async () => { await updateUsherTasks(Number(eventId), usher.id, editTasks.split(',').map(t => t.trim()).filter(Boolean)); setEditingUsherId(null); }}>Save</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingUsherId(null)}>Cancel</Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-700">{Array.isArray(usher.pivot?.tasks) ? usher.pivot.tasks.join(', ') : (typeof usher.pivot?.tasks === 'string' ? JSON.parse(usher.pivot.tasks).join(', ') : '')}</span>
                                    <Button size="sm" variant="outline" onClick={() => { setEditingUsherId(usher.id); setEditTasks(Array.isArray(usher.pivot?.tasks) ? usher.pivot.tasks.join(', ') : (typeof usher.pivot?.tasks === 'string' ? JSON.parse(usher.pivot.tasks).join(', ') : '')); }}>Edit</Button>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="flex flex-wrap gap-1">
                                <Button size="sm" variant="destructive" onClick={async () => { await api.delete(`/events/${Number(eventId)}/ushers/${usher.id}`); const eventRes = await getEventUshers(Number(eventId)); setEventUshers(eventRes.data); }}>Remove</Button>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-gray-500">No ushers assigned to this event.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Assign Usher Dialog is already implemented elsewhere in the file */}
                  </div>
                </TabsContent>
                <TabsContent value="team">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">Organizing Team</h3>
                      <Button variant="default" onClick={() => setAddUsherDialogOpen(true)} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Team Member
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teamMembers && teamMembers.length > 0 ? teamMembers.map(member => (
                            <TableRow key={member.id}>
                              <TableCell className="flex items-center gap-2">
                                <img src={member.profile_picture || '/placeholder-avatar.png'} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                                <div>
                                  <div className="font-semibold">{member.name}</div>
                                  <div className="text-xs text-gray-500">{member.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>{member.role || 'Member'}</TableCell>
                              <TableCell>
                                <div className="text-xs text-gray-500">{member.phone}</div>
                              </TableCell>
                              <TableCell>
                                <Badge className={member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                  {member.status || 'active'}
                                </Badge>
                              </TableCell>
                              <TableCell className="flex flex-wrap gap-1">
                                <Button size="sm" variant="outline" onClick={() => handleEditMember(member)}>Edit</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleRemoveMember(member)}>Remove</Button>
                                {!member.is_primary && (
                                  <Button size="sm" variant="secondary" onClick={() => handleSetPrimary(member)}>Set Primary</Button>
                                )}
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-gray-500">No team members assigned to this event.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Add/Edit Team Member Dialogs are implemented elsewhere in the file */}
                  </div>
                </TabsContent>
                <TabsContent value="checkins">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">Guest Check-in</h3>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search by name, email, or phone..."
                          value={checkinSearchTerm}
                          onChange={e => setCheckinSearchTerm(e.target.value)}
                          className="w-64"
                        />
                        <Select value={checkinStatusFilter} onValueChange={setCheckinStatusFilter}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="checkedin">Checked In</SelectItem>
                            <SelectItem value="notcheckedin">Not Checked In</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={() => setShowQrScanner(true)} className="flex items-center gap-2">
                          <QrCode className="w-4 h-4" /> Scan QR
                        </Button>
                      </div>
                    </div>
                    {/* QR Scanner Dialog */}
                    <Dialog open={showQrScanner} onOpenChange={setShowQrScanner}>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Scan Guest QR Code</DialogTitle>
                        </DialogHeader>
                        {/* QR code scanner component goes here (implement with a library like react-qr-reader) */}
                        <div className="flex flex-col items-center justify-center h-64">
                          <span className="text-gray-500">[QR Scanner Placeholder]</span>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendees.length > 0 ? attendees.map(attendee => (
                            <TableRow key={attendee.id}>
                              <TableCell>{attendee.guest?.name}</TableCell>
                              <TableCell>{attendee.guest?.email}</TableCell>
                              <TableCell>{attendee.guest?.phone}</TableCell>
                              <TableCell>
                                <Badge className={attendee.checked_in ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                  {attendee.checked_in ? 'Checked In' : 'Not Checked In'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant={attendee.checked_in ? 'outline' : 'default'}
                                  onClick={() => handleCheckIn(attendee.id)}
                                  disabled={attendee.checked_in}
                                >
                                  {attendee.checked_in ? 'Checked In' : 'Check In'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-gray-500">No attendees found.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="analytics">
                  <div className="flex flex-col gap-6">
                    {analyticsLoading ? (
                      <div className="flex justify-center items-center h-40 text-lg text-gray-500">Loading analytics...</div>
                    ) : analyticsError ? (
                      <div className="flex justify-center items-center h-40 text-lg text-red-500">{analyticsError}</div>
                    ) : analytics ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                            <div className="text-xs text-gray-500 mb-1">Registered</div>
                            <div className="text-3xl font-bold text-blue-700">{analytics.total_registered}</div>
                          </div>
                          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                            <div className="text-xs text-gray-500 mb-1">Checked In</div>
                            <div className="text-3xl font-bold text-green-700">{analytics.total_checked_in}</div>
                          </div>
                          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                            <div className="text-xs text-gray-500 mb-1">Check-in Rate</div>
                            <div className="text-3xl font-bold text-indigo-700">{analytics.total_registered ? Math.round((analytics.total_checked_in / analytics.total_registered) * 100) : 0}%</div>
                          </div>
                          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                            <div className="text-xs text-gray-500 mb-1">Not Checked In</div>
                            <div className="text-3xl font-bold text-gray-700">{analytics.total_registered - analytics.total_checked_in}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white rounded-xl shadow p-6">
                            <div className="font-semibold mb-2">Hourly Check-in Trend</div>
                            <ResponsiveContainer width="100%" height={220}>
                              <LineChart data={analytics.hourly_checkin_trend || analytics.checkin_trend || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hour" />
                                <YAxis allowDecimals={false} />
                                <RechartsTooltip />
                                <Line type="monotone" dataKey="checked_in" stroke="#22c55e" strokeWidth={2} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="bg-white rounded-xl shadow p-6">
                            <div className="font-semibold mb-2">Registration Timeline</div>
                            <ResponsiveContainer width="100%" height={220}>
                              <LineChart data={analytics.registration_timeline || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis allowDecimals={false} />
                                <RechartsTooltip />
                                <Line type="monotone" dataKey="registered" stroke="#6366f1" strokeWidth={2} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white rounded-xl shadow p-6">
                            <div className="font-semibold mb-2">Top Companies</div>
                            <ResponsiveContainer width="100%" height={220}>
                              <BarChart data={analytics.top_companies || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="company" />
                                <YAxis allowDecimals={false} />
                                <RechartsTooltip />
                                <Bar dataKey="count" fill="#f59e42" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="bg-white rounded-xl shadow p-6">
                            <div className="font-semibold mb-2">Top Guest Types</div>
                            <ResponsiveContainer width="100%" height={220}>
                              <BarChart data={analytics.top_guest_types || analytics.guest_type_distribution || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="type" />
                                <YAxis allowDecimals={false} />
                                <RechartsTooltip />
                                <Bar dataKey="count" fill="#a21caf" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white rounded-xl shadow p-6">
                            <div className="font-semibold mb-2">Gender Distribution</div>
                            <ResponsiveContainer width="100%" height={220}>
                              <PieChart>
                                <Pie
                                  data={analytics.gender_distribution || []}
                                  dataKey="count"
                                  nameKey="gender"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={70}
                                  fill="#6366f1"
                                  label
                                >
                                  {(analytics.gender_distribution || []).map((entry, idx) => (
                                    <Cell key={`gender-cell-${idx}`} fill={["#6366f1", "#f59e42", "#22c55e", "#f43f5e", "#a21caf"][idx % 5]} />
                                  ))}
                                </Pie>
                                <RechartsTooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="bg-white rounded-xl shadow p-6">
                            <div className="font-semibold mb-2">Country Distribution</div>
                            <ResponsiveContainer width="100%" height={220}>
                              <PieChart>
                                <Pie
                                  data={analytics.country_distribution || []}
                                  dataKey="count"
                                  nameKey="country"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={70}
                                  fill="#22c55e"
                                  label
                                >
                                  {(analytics.country_distribution || []).map((entry, idx) => (
                                    <Cell key={`country-cell-${idx}`} fill={["#22c55e", "#6366f1", "#f59e42", "#f43f5e", "#a21caf"][idx % 5]} />
                                  ))}
                                </Pie>
                                <RechartsTooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl shadow p-6">
                          <div className="font-semibold mb-2">Attendee List Summary</div>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Company</TableHead>
                                  <TableHead>Guest Type</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {attendees.slice(0, 10).map(attendee => (
                                  <TableRow key={attendee.id}>
                                    <TableCell>{attendee.guest?.name}</TableCell>
                                    <TableCell>{attendee.guest?.email}</TableCell>
                                    <TableCell>{attendee.guest?.company}</TableCell>
                                    <TableCell>{attendee.guestType?.name}</TableCell>
                                    <TableCell>{attendee.checked_in ? 'Checked In' : 'Not Checked In'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            {attendees.length > 10 && <div className="text-xs text-gray-500 mt-2">Showing first 10 attendees.</div>}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-center items-center h-40 text-lg text-gray-500">No analytics data available.</div>
                    )}
                  </div>
                </TabsContent>
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
                        {Array.from(new Set([
                          "Ethiopia", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Italy", "Spain", "Netherlands", "Belgium", "Switzerland", "Austria", "Sweden", "Norway", "Denmark", "Finland", "Poland", "Czech Republic", "Hungary", "Romania", "Bulgaria", "Greece", "Portugal", "Ireland", "New Zealand", "Japan", "South Korea", "China", "India", "Brazil", "Argentina", "Mexico", "Chile", "Colombia", "Peru", "Venezuela", "Ecuador", "Bolivia", "Paraguay", "Uruguay", "Guyana", "Suriname", "French Guiana", "South Africa", "Egypt", "Nigeria", "Kenya", "Ghana", "Uganda", "Tanzania", "Morocco", "Algeria", "Tunisia", "Libya", "Sudan", "Somalia", "Djibouti", "Eritrea", "Saudi Arabia", "United Arab Emirates", "Qatar", "Kuwait", "Bahrain", "Oman", "Yemen", "Jordan", "Lebanon", "Syria", "Iraq", "Iran", "Afghanistan", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "Bhutan", "Maldives", "Myanmar", "Thailand", "Laos", "Cambodia", "Vietnam", "Malaysia", "Singapore", "Indonesia", "Philippines", "Brunei", "East Timor", "Papua New Guinea", "Fiji", "Solomon Islands", "Vanuatu", "New Caledonia", "French Polynesia", "Samoa", "Tonga", "Kiribati", "Tuvalu", "Nauru", "Palau", "Micronesia", "Marshall Islands", "Cook Islands", "Niue", "Tokelau", "American Samoa", "Guam", "Northern Mariana Islands", "Puerto Rico", "U.S. Virgin Islands", "British Virgin Islands", "Anguilla", "Montserrat", "Saint Kitts and Nevis", "Antigua and Barbuda", "Dominica", "Saint Lucia", "Saint Vincent and the Grenadines", "Barbados", "Grenada", "Trinidad and Tobago", "Jamaica", "Haiti", "Dominican Republic", "Cuba", "Bahamas", "Belize", "Guatemala", "El Salvador", "Honduras", "Nicaragua", "Costa Rica", "Panama", "Vatican City", "Zambia", "Zimbabwe"
                        ])).map((country, idx) => (
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

          {/* Edit Attendee Dialog */}
          <Dialog open={editAttendeeDialogOpen} onOpenChange={setEditAttendeeDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Attendee</DialogTitle>
                <DialogDescription>
                  Update the attendee information below.
                </DialogDescription>
              </DialogHeader>
              {editAttendeeForm && (
                <form onSubmit={handleEditAttendeeSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_attendee_name">Name</Label>
                      <Input
                        id="edit_attendee_name"
                        value={editAttendeeForm.name}
                        onChange={(e) => handleEditAttendeeInput('name', e.target.value)}
                        placeholder="Full Name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_attendee_email">Email</Label>
                      <Input
                        id="edit_attendee_email"
                        value={editAttendeeForm.email}
                        onChange={(e) => handleEditAttendeeInput('email', e.target.value)}
                        placeholder="Email Address"
                        type="email"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_attendee_phone">Phone</Label>
                      <Input
                        id="edit_attendee_phone"
                        value={editAttendeeForm.phone}
                        onChange={(e) => handleEditAttendeeInput('phone', e.target.value)}
                        placeholder="Phone Number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_attendee_company">Company</Label>
                      <Input
                        id="edit_attendee_company"
                        value={editAttendeeForm.company}
                        onChange={(e) => handleEditAttendeeInput('company', e.target.value)}
                        placeholder="Company Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_attendee_jobtitle">Job Title</Label>
                      <Input
                        id="edit_attendee_jobtitle"
                        value={editAttendeeForm.jobtitle}
                        onChange={(e) => handleEditAttendeeInput('jobtitle', e.target.value)}
                        placeholder="Job Title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_attendee_gender">Gender</Label>
                      <Select
                        value={editAttendeeForm.gender}
                        onValueChange={(value) => handleEditAttendeeInput('gender', value)}
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
                      <Label htmlFor="edit_attendee_country">Country</Label>
                      <Select
                        value={editAttendeeForm.country}
                        onValueChange={(value) => handleEditAttendeeInput('country', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(new Set([
                            "Ethiopia", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Italy", "Spain", "Netherlands", "Belgium", "Switzerland", "Austria", "Sweden", "Norway", "Denmark", "Finland", "Poland", "Czech Republic", "Hungary", "Romania", "Bulgaria", "Greece", "Portugal", "Ireland", "New Zealand", "Japan", "South Korea", "China", "India", "Brazil", "Argentina", "Mexico", "Chile", "Colombia", "Peru", "Venezuela", "Ecuador", "Bolivia", "Paraguay", "Uruguay", "Guyana", "Suriname", "French Guiana", "South Africa", "Egypt", "Nigeria", "Kenya", "Ghana", "Uganda", "Tanzania", "Morocco", "Algeria", "Tunisia", "Libya", "Sudan", "Somalia", "Djibouti", "Eritrea", "Saudi Arabia", "United Arab Emirates", "Qatar", "Kuwait", "Bahrain", "Oman", "Yemen", "Jordan", "Lebanon", "Syria", "Iraq", "Iran", "Afghanistan", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "Bhutan", "Maldives", "Myanmar", "Thailand", "Laos", "Cambodia", "Vietnam", "Malaysia", "Singapore", "Indonesia", "Philippines", "Brunei", "East Timor", "Papua New Guinea", "Fiji", "Solomon Islands", "Vanuatu", "New Caledonia", "French Polynesia", "Samoa", "Tonga", "Kiribati", "Tuvalu", "Nauru", "Palau", "Micronesia", "Marshall Islands", "Cook Islands", "Niue", "Tokelau", "American Samoa", "Guam", "Northern Mariana Islands", "Puerto Rico", "U.S. Virgin Islands", "British Virgin Islands", "Anguilla", "Montserrat", "Saint Kitts and Nevis", "Antigua and Barbuda", "Dominica", "Saint Lucia", "Saint Vincent and the Grenadines", "Barbados", "Grenada", "Trinidad and Tobago", "Jamaica", "Haiti", "Dominican Republic", "Cuba", "Bahamas", "Belize", "Guatemala", "El Salvador", "Honduras", "Nicaragua", "Costa Rica", "Panama", "Vatican City", "Zambia", "Zimbabwe"
                          ])).map((country, idx) => (
    <SelectItem key={`${country}-${idx}`} value={country}>{country}</SelectItem>
  ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit_attendee_guest_type">Guest Type</Label>
                      <Select
                        value={editAttendeeForm.guest_type_id}
                        onValueChange={(value) => handleEditAttendeeInput('guest_type_id', value)}
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
                      onClick={() => setEditAttendeeDialogOpen(false)}
                      disabled={editAttendeeLoading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={editAttendeeLoading}>
                      {editAttendeeLoading ? (
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
                          Updating...
                        </>
                      ) : (
                        'Update Attendee'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              )}
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
          <div 
            ref={singleBadgePrintRef}
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
              <BadgePrint attendee={singlePrintAttendee} template={badgeTemplate} />
            </div>
          )}
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
                  <BadgePrint attendee={singlePrintAttendee} template={badgeTemplate} />
                </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowTestBadge(false)}>
                      Close
                    </Button>
                    <Button onClick={() => {
                      setShowTestBadge(false)
                      // generateBadge(testAttendee) // Not defined, comment out to fix linter error
                    }}>
                      Print Badge
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* CSV Upload Dialog */}
            <Dialog open={csvUploadDialogOpen} onOpenChange={setCsvUploadDialogOpen}>
              <DialogContent className="max-w-lg w-full">
                <DialogHeader>
                  <DialogTitle>Import Attendees from CSV</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file with guest information. You can download a sample template for the correct format.
                  </DialogDescription>
                </DialogHeader>
                {csvUploadStep === 'upload' && (
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setCsvUploadStep('importing')
                        setCsvUploadErrors([])
                        setCsvUploadData([])
                        setCsvUploadSuccess([])
                        setCsvUploadWarnings([])
                        // Parse CSV
                        Papa.parse(file, {
                          header: true,
                          skipEmptyLines: true,
                          complete: (results) => {
                            if (!results.data || results.data.length === 0) {
                              setCsvUploadErrors(['CSV file is empty or contains no valid data.'])
                              setCsvUploadStep('upload')
                              return
                            }
                            setCsvUploadData(results.data)
                            setCsvUploadStep('review')
                          },
                          error: (error) => {
                            setCsvUploadErrors([`Failed to parse CSV: ${error.message}`])
                            setCsvUploadStep('upload')
                          },
                        })
                      }}
                    />
                    <Button variant="outline" onClick={downloadSampleCSV}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Sample CSV
                    </Button>
                    {csvUploadErrors.length > 0 && (
                      <div className="text-red-600 text-sm">
                        {csvUploadErrors.map((err, i) => (
                          <div key={i}>{err}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {csvUploadStep === 'review' && (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-700">
                      {csvUploadData.length} rows parsed. Ready to import?
                    </div>
                    <Button
                      onClick={async () => {
                        setCsvUploadStep('importing')
                        try {
                          const guestTypeMap = new Map(guestTypes.map((gt) => [gt.name.toLowerCase(), gt.id]))
                          const attendeesToImport = csvUploadData.map((row) => ({
                            name: row.name?.trim(),
                            email: row.email?.trim(),
                            phone: row.phone?.trim() || null,
                            company: row.company?.trim() || null,
                            jobtitle: row.jobtitle?.trim() || null,
                            gender: row.gender?.trim() || null,
                            country: row.country?.trim() || null,
                            guest_type_id: guestTypeMap.get(row.guest_type_name?.toLowerCase()),
                          }))
                          const invalidRows = attendeesToImport.filter((a) => !(a.guest_type_id && a.name && a.email))
                          if (invalidRows.length > 0) {
                            setCsvUploadErrors(['Some rows have invalid data. Make sure all rows have name, email, and a valid guest type.'])
                            setCsvUploadStep('review')
                            return
                          }
                          const response = await api.post(`/events/${Number(eventId)}/attendees/batch`, { attendees: attendeesToImport })
                          const { created, errors } = response.data
                          if (created && created.length > 0) {
                            const res = await api.get(`/events/${Number(eventId)}/attendees`)
                            setAttendees(res.data)
                            setCsvUploadSuccess(created)
                          }
                          if (errors && errors.length > 0) {
                            setCsvUploadWarnings(errors)
                          }
                          setCsvUploadStep('complete')
                        } catch (err: any) {
                          setCsvUploadErrors([err.response?.data?.error || 'Failed to import CSV.'])
                          setCsvUploadStep('review')
                        }
                      }}
                    >
                      Import
                    </Button>
                    <Button variant="outline" onClick={() => setCsvUploadStep('upload')}>Back</Button>
                    {csvUploadErrors.length > 0 && (
                      <div className="text-red-600 text-sm">
                        {csvUploadErrors.map((err, i) => (
                          <div key={i}>{err}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {csvUploadStep === 'importing' && (
                  <div className="text-center py-8">Importing attendees...</div>
                )}
                {csvUploadStep === 'complete' && (
                  <div className="space-y-4">
                    {csvUploadSuccess.length > 0 && (
                      <div className="text-green-700 text-sm">
                        {csvUploadSuccess.length} attendees imported successfully.
                      </div>
                    )}
                    {csvUploadWarnings.length > 0 && (
                      <div className="text-yellow-700 text-sm">
                        {csvUploadWarnings.length} attendees failed to import.<br />
                        {csvUploadWarnings.map((w, i) => (
                          <div key={i}>{w.email}: {w.error}</div>
                        ))}
                      </div>
                    )}
                    <Button onClick={() => setCsvUploadDialogOpen(false)}>Close</Button>
                    <Button variant="outline" onClick={() => setCsvUploadStep('upload')}>Import Another</Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <UsherAssignmentDialog
              eventId={Number(eventId)}
              eventName={eventData?.name || ''}
              onSuccess={async () => {
                // Refresh event ushers after assignment
                if (typeof getEventUshers === 'function') {
                  const res = await getEventUshers(Number(eventId))
                  setEventUshers(res.data)
                }
              }}
            />

            {/* Add a hidden badge area for PDF generation */}
            <div
              ref={pdfBadgeRef}
              style={{ position: 'fixed', left: '-9999px', top: 0, width: 320, height: 480, zIndex: -2, background: 'white' }}
            >
              {singlePrintAttendee && <BadgePrint attendee={singlePrintAttendee} />}
            </div>
          </>
        )}
      </div>
    </>
  )
}
