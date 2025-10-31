import { useState, useEffect, useRef } from 'react'
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
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
  UserCheck,
  Image,
  Loader2,
  ExternalLink,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Copy,
  Code,
  RefreshCw,
  TrendingUp,
  Building,
  Globe,
  Palette,
  RotateCcw,
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
  getShareAnalytics,
  getRealTimeShareAnalytics,
  trackShare,
} from '@/lib/api'
import { format, parseISO } from 'date-fns'
import { getGuestTypeBadgeClasses, getImageUrl } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import Pagination from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import EventSessions from '@/components/EventSessions'
import { InvitationsTab } from '@/components/event-invitations/InvitationsTab'
import { BulkBadgesTab } from '@/components/BulkBadgesTab'
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
  Area,
} from 'recharts'
// Badge Designer is now a standalone app - no longer imported here
// import BadgeDesignerTab from '@/pages/BadgeDesignerTab'
import { UsherAssignmentDialog } from '@/components/UsherAssignmentDialog'
import React from 'react'
import BadgePrint from '@/components/Badge'
import BadgeTest from '@/components/BadgeTest'
import { getOfficialBadgeTemplate, getBadgeTemplates } from '@/lib/badgeTemplates'
import { BadgeTemplate } from '@/types/badge'
import { DateRange } from 'react-date-range'
import { useModernAlerts } from '@/hooks/useModernAlerts'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { useInterval } from '@/hooks/use-interval'
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

// Add predefined guest types at the top, after imports
const PREDEFINED_GUEST_TYPES = [
  'General', 'VIP', 'Speaker', 'Staff', 'Exhibitor', 'Media', 'Regular', 'Visitor', 'Sponsor', 'Organizer', 'Volunteer', 'Partner', 'Vendor', 'Press', 'Student', 'Other'
];

export default function EventDetails() {
  const { eventId } = useParams()
  const navigate = useNavigate()

  // Function to get color coding for tasks based on task type
  const getTaskColor = (task: string) => {
    const taskLower = task.toLowerCase().trim()
    
    // Check-in related tasks
    if (taskLower.includes('check-in') || taskLower.includes('checkin') || taskLower.includes('registration')) {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    }
    
    // Security related tasks
    if (taskLower.includes('security') || taskLower.includes('guard') || taskLower.includes('safety')) {
      return 'bg-red-100 text-red-800 border-red-200'
    }
    
    // Guest assistance tasks
    if (taskLower.includes('guest') || taskLower.includes('assistance') || taskLower.includes('help') || taskLower.includes('support')) {
      return 'bg-green-100 text-green-800 border-green-200'
    }
    
    // Crowd control tasks
    if (taskLower.includes('crowd') || taskLower.includes('control') || taskLower.includes('manage')) {
      return 'bg-purple-100 text-purple-800 border-purple-200'
    }
    
    // Communication tasks
    if (taskLower.includes('communication') || taskLower.includes('announcement') || taskLower.includes('coordination')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
    
    // Technical tasks
    if (taskLower.includes('technical') || taskLower.includes('equipment') || taskLower.includes('setup') || taskLower.includes('audio') || taskLower.includes('video')) {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    }
    
    // Emergency tasks
    if (taskLower.includes('emergency') || taskLower.includes('first aid') || taskLower.includes('medical')) {
      return 'bg-orange-100 text-orange-800 border-orange-200'
    }
    
    // Default color for other tasks
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }
  const [searchTerm, setSearchTerm] = useState('')
  const [guestTypeFilter, setGuestTypeFilter] = useState('all')
  const [checkedInFilter, setCheckedInFilter] = useState('all')
  
  // Pagination hook for attendees
  const {
    currentPage,
    perPage,
    totalPages,
    totalRecords,
    setTotalPages,
    setTotalRecords,
    handlePageChange,
    handlePerPageChange,
    resetPagination
  } = usePagination({ defaultPerPage: 15, searchParamPrefix: 'attendees' });
  
  // Modern alerts system
  const { confirmAction } = useModernAlerts();
  
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
  const [ticketTypes, setTicketTypes] = useState<any[]>([])

  // Badge template state
  const [badgeTemplate, setBadgeTemplate] = useState<BadgeTemplate | null>(null)
  const [badgeTemplateLoading, setBadgeTemplateLoading] = useState(false)
  // Legacy badge designer state removed - now using standalone app

  const { user } = useAuth()
  const [isUsherAssigned, setIsUsherAssigned] = useState(false)

  const [addAttendeeDialogOpen, setAddAttendeeDialogOpen] = useState(false)
  const [createParticipantDialogOpen, setCreateParticipantDialogOpen] = useState(false)
  const [participantCount, setParticipantCount] = useState(1)
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
    ticket_type_id: '',
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

  // Share Analytics state
  const [shareAnalytics, setShareAnalytics] = useState<any>(null)
  const [shareAnalyticsLoading, setShareAnalyticsLoading] = useState(false)
  const [shareAnalyticsError, setShareAnalyticsError] = useState<string | null>(null)
  
  // Session guests state
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [sessionGuests, setSessionGuests] = useState<any[]>([])
  const [sessionGuestsLoading, setSessionGuestsLoading] = useState(false)
  const [sessionGuestsDialogOpen, setSessionGuestsDialogOpen] = useState(false)

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
      .then((res) => {
        const eventData = res.data
        console.log('Event data fetched:', {
          id: eventData.id,
          name: eventData.name,
          event_type: eventData.event_type,
          guestTypes: eventData.guestTypes,
          ticketTypes: eventData.ticketTypes,
          guestTypesLength: eventData.guestTypes?.length,
          ticketTypesLength: eventData.ticketTypes?.length
        })
        console.log('Full event data:', eventData)
        setEventData(eventData)
      })
      .catch((err) => setEventError('Failed to fetch event details.'))
      .finally(() => setEventLoading(false))
  }, [eventId])

  // Fetch attendees
  useEffect(() => {
    if (!eventId) return
    setAttendeesLoading(true)
    setAttendeesError(null)
    
    // Build query parameters for pagination and filtering
    const params = new URLSearchParams({
      page: currentPage.toString(),
      per_page: perPage.toString(),
    });
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }
    
    if (guestTypeFilter !== 'all') {
      params.append('guest_type', guestTypeFilter);
    }
    
    if (checkedInFilter !== 'all') {
      params.append('checked_in', checkedInFilter === 'checked-in' ? 'true' : 'false');
    }
    
    api
      .get(`/events/${Number(eventId)}/attendees?${params.toString()}`)
      .then((res) => {
        console.log('Attendees response:', res.data)
        
        // Handle paginated response
        if (res.data.data) {
          setAttendees(res.data.data)
          setTotalPages(res.data.last_page || 1)
          setTotalRecords(res.data.total || 0)
        } else {
          // Fallback for non-paginated response
          setAttendees(res.data || [])
          setTotalPages(1)
          setTotalRecords(res.data?.length || 0)
        }
        
        // Log first attendee structure for debugging
        const attendeesData = res.data.data || res.data || []
        if (attendeesData.length > 0) {
          console.log('First attendee structure:', {
            id: attendeesData[0].id,
            guest_type_id: attendeesData[0].guest_type_id,
            guestType: attendeesData[0].guestType,
            guest_type: attendeesData[0].guest_type,
            guest: attendeesData[0].guest
          })
        }
      })
      .catch((err) => {
        console.error('Failed to fetch attendees:', err)
        setAttendeesError('Failed to fetch attendees.')
        setAttendees([])
        setTotalPages(1)
        setTotalRecords(0)
      })
      .finally(() => setAttendeesLoading(false))
  }, [eventId, currentPage, perPage, searchTerm, guestTypeFilter, checkedInFilter])

  // Set guest types and ticket types from event data
  useEffect(() => {
    if (!eventData) return
    
    console.log('Setting types from event data:', {
      event_type: eventData.event_type,
      guestTypes: eventData.guestTypes,
      ticketTypes: eventData.ticketTypes
    })
    
    if (eventData.event_type === 'ticketed') {
      // Use ticket types from event data
      const ticketTypesData = Array.isArray(eventData.ticketTypes) ? eventData.ticketTypes : []
      setTicketTypes(ticketTypesData)
      setGuestTypes([]) // Clear guest types for ticketed events
    } else {
      // Use guest types from event data
      const guestTypesData = Array.isArray(eventData.guestTypes) ? eventData.guestTypes : []
      setGuestTypes(guestTypesData)
      setTicketTypes([]) // Clear ticket types for free events
    }
  }, [eventData])

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
      .then((res) => {
        console.log('Analytics data received:', res.data)
        console.log('Registration timeline:', res.data.registration_timeline)
        setAnalytics(res.data)
      })
      .catch((err) => setAnalyticsError('Failed to fetch analytics.'))
      .finally(() => setAnalyticsLoading(false))
  }, [eventId, activeTab])

  // Fetch share analytics
  useEffect(() => {
    if (!eventId) return
    setShareAnalyticsLoading(true)
    setShareAnalyticsError(null)
    getRealTimeShareAnalytics(eventId)
      .then((res) => {
        console.log('Share Analytics API Response:', res.data)
        setShareAnalytics(res.data)
      })
      .catch((err) => {
        console.error('Share Analytics API Error:', err)
        setShareAnalyticsError('Failed to fetch share analytics.')
      })
      .finally(() => setShareAnalyticsLoading(false))
  }, [eventId])

  // Refresh share analytics every 30 seconds
  useEffect(() => {
    if (!eventId) return
    // Temporarily disabled polling to prevent reloading issues
    // const interval = setInterval(() => {
    //   getRealTimeShareAnalytics(eventId)
    //     .then((res) => {
    //       console.log('Share Analytics Auto-refresh:', res.data)
    //       setShareAnalytics(res.data)
    //     })
    //     .catch((err) => {
    //       // Silently fail for auto-refresh but log for debugging
    //       console.warn('Share Analytics Auto-refresh failed:', err)
    //     })
    // }, 30000) // 30 seconds

    // return () => clearInterval(interval)
  }, [eventId])

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
    .rdrDateRangePickerWrapper { 
      box-shadow: 0 8px 32px rgba(80,0,80,0.12); 
      border-radius: 1.5rem; 
      position: relative !important;
      z-index: 9999 !important;
    }
    .rdrDateRangePickerWrapper * {
      z-index: 9999 !important;
    }
  `

  // Track share action
  const trackShareAction = async (platform: string) => {
    if (!eventId) return
    try {
      await trackShare(eventId, {
        platform,
        source: 'public_registration_dialog',
        user_agent: navigator.userAgent,
        ip_address: '', // Will be captured by backend
      })
    } catch (error) {
      // Silently fail for tracking
      console.warn('Failed to track share:', error)
    }
  }

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

 

  // Handle search and filter changes with pagination reset
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    resetPagination();
  };

  const handleGuestTypeFilterChange = (value: string) => {
    setGuestTypeFilter(value);
    resetPagination();
  };

  const handleCheckedInFilterChange = (value: string) => {
    setCheckedInFilter(value);
    resetPagination();
  };

  // Since we're now using server-side pagination, we don't need client-side filtering
  const filteredAttendees = attendees;



  const exportCSV = () => {
    if (filteredAttendees.length === 0) {
      toast.info('No attendees to export.')
      return
    }

    const dataToExport = filteredAttendees.map((attendee) => {
      // Handle guest type display properly for CSV export
      let guestTypeName = 'N/A';
      // Try both guestType and guest_type for compatibility
      const guestType = attendee.guestType || attendee.guest_type;
      if (guestType) {
        if (typeof guestType === 'object' && guestType !== null) {
          guestTypeName = guestType.name || guestType.id || 'N/A';
        } else if (typeof guestType === 'string') {
          guestTypeName = guestType;
        } else {
          guestTypeName = String(guestType);
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
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [400, 400] });
        for (let i = 0; i < badgeElements.length; i++) {
          const el = badgeElements[i] as HTMLElement;
          const canvas = await html2canvas(el, { 
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
          const imgData = canvas.toDataURL('image/jpeg', 0.9); // JPEG for smaller file size
          if (i > 0) pdf.addPage([400, 400], 'portrait');
          pdf.addImage(imgData, 'JPEG', 0, 0, 400, 400);
        }
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
            setPrinting(false);
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
            setPrinting(false);
          }, 120000);
        };
        setPrinting(false);
      }
    }, 150); // Reduced timeout from 300ms to 150ms for faster response
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
    // Prefer real event guest types for a valid sample
    const typeNames: string[] = Array.isArray(guestTypes)
      ? guestTypes.map((gt: any) =>
          typeof gt === 'object' && gt !== null
            ? String(gt.name ?? gt.title ?? '').trim()
            : String(gt ?? '').trim()
        ).filter((n: string) => !!n)
      : []
    const t1 = typeNames[0] || 'Regular'
    const t2 = typeNames[1] || t1 || 'VIP'

    // Columns exactly as the system expects; extra columns are optional
    const sampleData = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'Tech Corp',
        jobtitle: 'Software Engineer',
        gender: 'Male',
        country: 'United States',
        guest_type_name: t1,
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567891',
        company: 'Design Studio',
        jobtitle: 'UX Designer',
        gender: 'Female',
        country: 'Canada',
        guest_type_name: t2,
      },
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
          const emailOk = !!a.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(a.email))
          const phoneStr = (a.phone || '').toString().replace(/\s|-/g, '')
          const phoneOk = !!phoneStr && /^\+?[0-9]{7,15}$/.test(phoneStr)
          const isValid = a.guest_type_id && a.name && emailOk && phoneOk
          if (!isValid) {
            console.log(`Invalid row ${index + 1}:`, a)
          }
          return !isValid
        })

        if (invalidRows.length > 0) {
          const invalidEmails = invalidRows.map((r, index) => r.email || `Row ${index + 1}`).join(', ')
          toast.error(`Some rows have invalid data. Make sure all rows have name, email, phone, and a valid guest type.`)
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
    
    // Handle guest_types properly - extract names from objects if they are objects
    let guestTypes: string[] = []
    if (Array.isArray(eventData.guest_types)) {
      guestTypes = eventData.guest_types.map((gt: any) => {
        // If it's an object with a name property, extract the name
        if (typeof gt === 'object' && gt !== null && gt.name) {
          return gt.name
        }
        // If it's already a string, use it as is
        if (typeof gt === 'string') {
          return gt
        }
        // Fallback to string conversion
        return String(gt)
      }).filter(Boolean)
    } else if (typeof eventData.guest_types === 'string') {
      // Handle comma-separated string
      guestTypes = eventData.guest_types.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
    
    setEditForm({
      ...eventDataForEdit,
      guest_types: guestTypes,
    })
    setEditImagePreview(
      eventData.event_image ? getImageUrl(eventData.event_image) : null
    )
    setEditDialogOpen(true)
  }

  const handleEditInput = (field: string, value: any) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }))
  }

  // Handle session click to show checked-in guests
  const handleSessionClick = async (session: any) => {
    setSelectedSession(session)
    setSessionGuestsDialogOpen(true)
    setSessionGuestsLoading(true)
    
    try {
      // Fetch session attendees (checked-in guests)
      const response = await api.get(`/sessions/${session.session_id}/attendances`)
      const attendances = response.data.data || []
      
      // Filter only checked-in attendees
      const checkedInAttendances = attendances.filter((attendance: any) => attendance.checked_in)
      
      // Extract guest information
      const guests = checkedInAttendances.map((attendance: any) => ({
        id: attendance.attendee?.id,
        name: attendance.attendee?.guest?.name,
        email: attendance.attendee?.guest?.email,
        phone: attendance.attendee?.guest?.phone,
        company: attendance.attendee?.guest?.company,
        jobtitle: attendance.attendee?.guest?.jobtitle,
        gender: attendance.attendee?.guest?.gender,
        country: attendance.attendee?.guest?.country,
        guest_type: attendance.attendee?.guestType?.name,
        check_in_time: attendance.check_in_time,
        session_name: session.session_name
      }))
      
      setSessionGuests(guests)
    } catch (error) {
      console.error('Error fetching session guests:', error)
      toast.error('Failed to fetch session guests')
      setSessionGuests([])
    } finally {
      setSessionGuestsLoading(false)
    }
  }

  // Export session guests to CSV
  const exportSessionGuests = () => {
    if (sessionGuests.length === 0) {
      toast.error('No guests to export')
      return
    }

    const csvData = sessionGuests.map(guest => ({
      'Name': guest.name || '',
      'Email': guest.email || '',
      'Phone': guest.phone || '',
      'Company': guest.company || '',
      'Job Title': guest.jobtitle || '',
      'Gender': guest.gender || '',
      'Country': guest.country || '',
      'Guest Type': guest.guest_type || '',
      'Check-in Time': guest.check_in_time ? new Date(guest.check_in_time).toLocaleString() : ''
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${selectedSession?.session_name || 'session'}_checked_in_guests.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Session guests exported successfully')
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
    e.preventDefault();
    setEditLoading(true);
    try {
      let payload;
      let headers = {};
      // Convert date objects to ISO strings for API
      const processedEditForm = {
        ...editForm,
        start_date: editEventRange[0].startDate.toISOString(),
        end_date: editEventRange[0].endDate.toISOString(),
        registration_start_date: editRegRange[0].startDate.toISOString(),
        registration_end_date: editRegRange[0].endDate.toISOString(),
        max_guests: Number(editForm.max_guests),
        guest_types: Array.isArray(editForm.guest_types)
          ? editForm.guest_types
          : (editForm.guest_types || '').split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (processedEditForm.event_image && processedEditForm.event_image instanceof File) {
        payload = new FormData();
        Object.entries(processedEditForm).forEach(([key, value]) => {
          if (key === 'event_image' && value) {
            payload.append('event_image', value);
          } else if (key === 'guest_types') {
            (Array.isArray(value) ? value : [value]).forEach((type: string) =>
              payload.append('guest_types[]', type)
            );
          } else {
            payload.append(key, value as any);
          }
        });
        headers = { 'Content-Type': 'multipart/form-data' };
      } else {
        payload = processedEditForm;
      }
      await api.put(`/events/${Number(eventId)}`, payload, { headers });
      // Refresh event details before closing dialog
      const res = await api.get(`/events/${Number(eventId)}`);
      setEventData(res.data);
      toast.success('Event updated successfully!');
      setEditDialogOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update event');
    }
    setEditLoading(false);
  };

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
        ticket_type_id: '',
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

  const handleCreateParticipant = async () => {
    if (participantCount < 1 || participantCount > 100) {
      toast.error('Please enter a number between 1 and 100')
      return
    }

    setAddAttendeeLoading(true)

    try {
      const createdParticipants = []
      let successCount = 0
      let failCount = 0

      // Create multiple participants
      for (let i = 0; i < participantCount; i++) {
        try {
          // Create attendee with name "PARTICIPANT"
          // All participants have the same name but different UUIDs/QR codes
          // Use special email format to signal to backend that these are participants
          const payload = {
            first_name: 'PARTICIPANT',
            last_name: '',
            name: 'PARTICIPANT',
            email: `participant-${Date.now()}-${i}@noreply.local`, // Valid email format with marker for backend
            phone: '', // Empty phone for participants
            company: '',
            jobtitle: '',
            gender: '',
            country: '',
            guest_type_id: addAttendeeForm.guest_type_id || guestTypes?.[0]?.id || '',
            ticket_type_id: addAttendeeForm.ticket_type_id || '',
          }

          const response = await api.post(`/events/${Number(eventId)}/attendees`, payload, {
            validateStatus: function (status) {
              return status < 500; // Don't throw on client errors
            }
          })
          
          if (response.status === 201 || response.status === 200) {
            const newAttendee = response.data
            createdParticipants.push(newAttendee)
            successCount++
          } else {
            failCount++
          }
        } catch (err) {
          failCount++
        }
      }

      // Refresh attendees list
      if (createdParticipants.length > 0) {
        const attendeesResponse = await api.get(`/events/${Number(eventId)}/attendees`)
        const data = attendeesResponse.data?.data ? attendeesResponse.data.data : attendeesResponse.data
        const indexed = (Array.isArray(data) ? data : []).map((a: any) => {
          const name = a?.guest?.name ? String(a.guest.name) : ''
          const email = a?.guest?.email ? String(a.guest.email) : ''
          const company = a?.guest?.company ? String(a.guest.company) : ''
          const blob = `${name} ${email} ${company}`.toLowerCase()
          return { ...a, _search: blob }
        })
        setAttendees(indexed)
      }

      // Show results
      if (successCount > 0) {
        if (failCount > 0) {
          toast.success(`Successfully created ${successCount} participant(s). ${failCount} failed.`)
        } else {
          toast.success(`Successfully created ${successCount} participant(s)!`)
        }
      } else {
        toast.error('Failed to create participants')
      }

      // Close dialog and reset
      setCreateParticipantDialogOpen(false)
      setParticipantCount(1)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create participants')
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

  const handleRemoveAttendee = (attendee: any) => {
    setRemoveMember(attendee)
    setRemoveDialogOpen(true)
  }

  const handleRemoveConfirm = async () => {
    setRemoveLoading(true)
    try {
      // Check if we're removing a team member or an attendee
      if (removeMember.guest) {
        // This is an attendee (has guest property)
        await api.delete(`/events/${Number(eventId)}/attendees/${removeMember.id}`)
        toast.success('Attendee removed from event!')
        
        // Refresh attendees list
        const res = await api.get(`/events/${Number(eventId)}/attendees`)
        setAttendees(res.data || [])
      } else {
        // This is a team member - check if it's a primary contact
        if (removeMember.is_primary_contact) {
          // Count primary contacts for this organizer
          const primaryContactCount = teamMembers.filter((m: any) => m.is_primary_contact).length
          
          if (primaryContactCount <= 1) {
            toast.error('Cannot remove the only primary contact. Please assign another primary contact first.')
            setRemoveDialogOpen(false)
            setRemoveMember(null)
            setRemoveLoading(false)
            return
          }
          
          // Show confirmation for removing primary contact
          const confirmed = await confirmAction(
            'Remove Primary Contact',
            `Are you sure you want to remove ${removeMember.name} as a primary contact? This organizer has ${primaryContactCount} primary contact(s).`,
            'Remove Contact',
            'warning',
            async () => {
              // Continue with removal logic
            }
          );
          
          if (!confirmed) {
            setRemoveDialogOpen(false)
            setRemoveMember(null)
            setRemoveLoading(false)
            return
          }
        }
        
        await api.delete(
          `/organizers/${user.organizer_id}/contacts/${removeMember.id}`
        )
        toast.success(removeMember.is_primary_contact ? 'Primary contact removed!' : 'Team member removed!')
        
        // Refresh team list
        const res = await api.get(`/organizers/${user.organizer_id}/contacts`)
        setTeamMembers(res.data)
      }
      
      setRemoveDialogOpen(false)
      setRemoveMember(null)
    } catch (err: any) {
      const errorMessage = removeMember.guest 
        ? 'Failed to remove attendee' 
        : 'Failed to remove team member'
      toast.error(err.response?.data?.error || errorMessage)
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
      guest_type_id: attendee.guest_type_id || (attendee.guestType || attendee.guest_type)?.id || '',
      ticket_type_id: attendee.ticket_type_id || attendee.ticketType?.id || '',
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
        ticket_type_id: editAttendeeForm.ticket_type_id,
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
      .then((res) => {
        console.log('Event ushers loaded:', res.data)
        setEventUshers(res.data)
      })
      .catch((err) => {
        console.error('Failed to fetch event ushers:', err)
        toast.error('Failed to fetch event ushers.')
      })
  }, [eventId])


  useEffect(() => {
    if (printing && printRef.current) {
      handleBatchPrintBadges();
    }
  }, [printing, printRef.current]);



  // Add a ref for the PDF badge area
  const pdfBadgeRef = useRef<HTMLDivElement>(null);

  const handleDownloadBadgePDF = async (attendee: any) => {
    setSinglePrintAttendee(attendee);
    // Wait for the badge to render
    setTimeout(async () => {
      if (pdfBadgeRef.current) {
        const canvas = await html2canvas(pdfBadgeRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/jpeg', 0.9); // JPEG for smaller file size
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [400, 400] });
        pdf.addImage(imgData, 'PNG', 0, 0, 400, 400);
        pdf.save(`${attendee.guest?.name || 'badge'}.pdf`);
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
        setSinglePrintAttendee(null);
      }
    }, 150); // Reduced timeout from 300ms to 150ms for faster response
  };

  // Add a ref for the hidden badge print area
  const singleBadgePrintRef = useRef<HTMLDivElement>(null)

  const handleSingleBadgePrint = async (attendee: any) => {
    setSinglePrintAttendee(attendee)
    // Wait for the badge to render in the hidden printRef
    setTimeout(async () => {
      if (singleBadgePrintRef.current) {
        const badgeElement = singleBadgePrintRef.current.querySelector('.printable-badge-batch');
        if (!badgeElement) {
          toast.error('No badge found to print.');
          setSinglePrintAttendee(null);
          return;
        }
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [320, 480] });
        const canvas = await html2canvas(badgeElement as HTMLElement, { scale: 2 });
        const imgData = canvas.toDataURL('image/jpeg', 0.9); // JPEG for smaller file size
        pdf.addImage(imgData, 'PNG', 0, 0, 320, 480);
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

  const statusOptionsBase = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'cancelled', label: 'Cancelled' },
  ];
  const statusOptions = (eventData as any)?.status === 'active'
    ? statusOptionsBase.filter(o => o.value !== 'draft')
    : statusOptionsBase;

  const handleStatusChange = async (newStatus: string) => {
    if (!eventId) return;
    setStatusLoading(true);
    setStatusError(null);
    try {
      const res = await api.patch(`/events/${Number(eventId)}/status`, { status: newStatus });
      setEventData((prev: any) => ({ ...prev, status: newStatus }));
      toast.success('Event status updated!');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Failed to update status.';
      setStatusError(msg);
      toast.error(msg);
    } finally {
      setStatusLoading(false);
    }
  };

  // Add state for badge tab filtering
  const [badgeSearchTerm, setBadgeSearchTerm] = useState('');
  const [badgeGuestTypeFilter, setBadgeGuestTypeFilter] = useState('all');
  const [badgeCheckedInFilter, setBadgeCheckedInFilter] = useState('all');
  const [badgeSelectedAttendees, setBadgeSelectedAttendees] = useState<Set<number>>(new Set());

  // Add filteredBadgesAttendees for the badges tab
  const filteredBadgesAttendees = attendees.filter((attendee) => {
    const matchesSearch =
      (attendee.guest?.name?.toLowerCase() || '').includes(badgeSearchTerm.toLowerCase()) ||
      (attendee.guest?.email?.toLowerCase() || '').includes(badgeSearchTerm.toLowerCase()) ||
      (attendee.guest?.company?.toLowerCase() || '').includes(badgeSearchTerm.toLowerCase());
    let guestTypeName = '';
    // Try both guestType and guest_type for compatibility
    const guestType = attendee.guestType || attendee.guest_type;
    if (guestType) {
      if (typeof guestType === 'object' && guestType !== null) {
        guestTypeName = (guestType.name || guestType.id || '').toLowerCase();
      } else if (typeof guestType === 'string') {
        guestTypeName = guestType.toLowerCase();
      } else {
        guestTypeName = String(guestType).toLowerCase();
      }
    }
    const matchesGuestType =
      badgeGuestTypeFilter === 'all' ||
      guestTypeName === badgeGuestTypeFilter;
    const matchesCheckedIn =
      badgeCheckedInFilter === 'all' ||
      (badgeCheckedInFilter === 'checked-in' && attendee.checked_in) ||
      (badgeCheckedInFilter === 'not-checked-in' && !attendee.checked_in);
    return matchesSearch && matchesGuestType && matchesCheckedIn;
  });

  // Add badge tab selection handlers
  const handleBadgeSelectAttendee = (id: number) => {
    setBadgeSelectedAttendees((prev) => {
      const newSelected = new Set(prev)
      if (newSelected.has(id)) {
        newSelected.delete(id)
      } else {
        newSelected.add(id)
      }
      return newSelected
    })
  }
  const handleBadgeSelectAllAttendees = () => {
    if (badgeSelectedAttendees.size === filteredBadgesAttendees.length) {
      setBadgeSelectedAttendees(new Set())
    } else {
      setBadgeSelectedAttendees(new Set(filteredBadgesAttendees.map((a) => a.id)))
    }
  }
  const handleBadgeBatchPrintBadges = async () => {
    if (badgeSelectedAttendees.size === 0) {
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
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [400, 400] }); // UNIFIED: Same dimensions as single badge
        for (let i = 0; i < badgeElements.length; i++) {
          const el = badgeElements[i] as HTMLElement;
          const canvas = await html2canvas(el, { 
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
          const imgData = canvas.toDataURL('image/jpeg', 0.9); // JPEG for smaller file size
          if (i > 0) pdf.addPage([400, 400], 'portrait'); // UNIFIED: Same dimensions as single badge
          pdf.addImage(imgData, 'PNG', 0, 0, 400, 400); // UNIFIED: Same dimensions as single badge
        }
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
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } finally {
            setTimeout(() => {
              document.body.removeChild(iframe);
              URL.revokeObjectURL(blobUrl);
            }, 1000);
          setPrinting(false);
          }
        };
      }
    }, 150); // Reduced timeout from 300ms to 150ms for faster response
  };

  const exportAttendeesToCSV = async () => {
    if (filteredAttendees.length === 0) {
      toast.info('No attendees to export.')
      return
    }

    const dataToExport = filteredAttendees.map((attendee) => {
      // Handle guest type display properly for CSV export
      let guestTypeName = 'N/A';
      // Try both guestType and guest_type for compatibility
      const guestType = attendee.guestType || attendee.guest_type;
      if (guestType) {
        if (typeof guestType === 'object' && guestType !== null) {
          guestTypeName = guestType.name || guestType.id || 'N/A';
        } else if (typeof guestType === 'string') {
          guestTypeName = guestType;
        } else {
          guestTypeName = String(guestType);
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
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #print-area, #print-area * { visibility: visible !important; }
            #print-area { 
              position: absolute !important; 
              left: 0 !important; 
              top: 0 !important; 
              width: 100vw !important; 
              height: 100vh !important; 
              background: white !important; 
              z-index: 9999 !important;
            }
            .printable-badge-batch {
              page-break-after: always;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              visibility: visible !important;
            }
            .printable-badge-batch:last-child {
              page-break-after: auto;
            }
          }
        `}</style>
        <div id="print-area">
        {printing && selectedAttendees.size > 0 ? (
          attendees
            .filter(attendee => selectedAttendees.has(attendee.id))
            .map(attendee => (
              <div key={attendee.id} className="printable-badge-batch">
                <BadgePrint attendee={attendee} />
              </div>
            ))
        ) : (
          <div>No badges selected for printing.</div>
        )}
        </div>
      </div>
      <div className="space-y-6">
        {eventLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading event details...</p>
          </div>
        ) : eventError ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <XCircle className="w-12 h-12 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-700">Failed to Load Event</h3>
            <p className="text-gray-600 text-center">{eventError}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : !eventData ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <XCircle className="w-12 h-12 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700">Event Not Found</h3>
            <p className="text-gray-600">The event you're looking for doesn't exist.</p>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="mt-4"
            >
              Go Back
            </Button>
          </div>
        ) : (
          <>
            {/* Fancy Hero Banner */}
      <div className="relative w-full h-72 rounded-2xl overflow-hidden mb-8 shadow-lg">
              {eventData.event_image && (
                <img
                  src={getImageUrl(eventData.event_image)}
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
                <div className="mb-3">
                  <Badge 
                    variant="secondary" 
                    className={`text-sm font-semibold px-3 py-1 ${
                      eventData?.event_type === 'ticketed' 
                        ? 'bg-purple-600 text-white border-purple-500' 
                        : 'bg-green-600 text-white border-green-500'
                    }`}
                  >
                    {eventData?.event_type === 'ticketed' ? '🎫 Ticketed Event' : '🎉 Free Event'}
                  </Badge>
                </div>
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
                  src={getImageUrl(eventData.event_image)}
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
                {/* {(user?.role === 'admin' || user?.role === 'superadmin' || (user?.role === 'organizer' && user?.organizer_id === eventData.organizer_id)) && (
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
                )} */}
                {user?.role !== 'usher' && (
                  <>
                {/* <Button variant="outline" onClick={exportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button> */}
                <Dialog>
                  <DialogTrigger asChild>
                    {/* <Button variant="outline">
                      <QrCode className="w-4 h-4 mr-2" />
                      Public Registration
                </Button> */}
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-blue-600" />
                        Public Registration Link
                      </DialogTitle>
                      <DialogDescription>
                        Share this registration link with potential attendees. The link allows public registration for this event.
                      </DialogDescription>
                    </DialogHeader>
                    {eventData?.status?.toLowerCase().trim() === 'active' && eventData?.uuid ? (
                      <div className="space-y-6">
                        {/* Registration Link Section */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                          <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <ExternalLink className="w-4 h-4" />
                            Registration Link
                          </h3>
                          <div className="flex items-center gap-2">
                            <Input
                              value={`${window.location.origin}/event/register/${eventData.uuid}`}
                              readOnly
                              className="text-sm bg-white border-blue-300 focus:border-blue-500"
                              onClick={e => (e.target as HTMLInputElement).select()}
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}event/register/${eventData.uuid}`)
                                toast.success('Registration link copied to clipboard!')
                              }}
                              variant="outline"
                              className="bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
                            >
                              Copy
                            </Button>
                          </div>
                        </div>

                        {/* QR Code Section */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                          <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                            <QrCode className="w-4 h-4" />
                            QR Code
                          </h3>
                          <div className="flex items-center gap-4">
                            <div className="bg-white p-3 rounded-lg border border-green-300">
                              <img 
                                id="public-registration-qr"
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/event/register/${eventData.uuid}`)}&format=png&margin=10&color=1F2937&bgcolor=FFFFFF`} 
                                alt="QR Code for registration" 
                                className="w-24 h-24" 
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const link = document.createElement('a')
                                  link.href = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(`${window.location.origin}/event/register/${eventData.uuid}`)}&format=png&margin=10&color=1F2937&bgcolor=FFFFFF`
                                  link.download = `registration-qr-${eventData.name.replace(/[^a-zA-Z0-9]/g, '-')}.png`
                                  link.click()
                                  toast.success('QR code downloaded!')
                                }}
                                className="bg-white hover:bg-green-50 border-green-300 text-green-700"
                              >
                                Download QR
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/event/register/${eventData.uuid}`)
                                  toast.success('Link copied! Scan the QR code or share the link.')
                                }}
                                className="bg-white hover:bg-green-50 border-green-300 text-green-700"
                              >
                                Copy Link
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Quick Share Section */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                          <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
                            Quick Share
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
                              onClick={async () => {
                                await trackShareAction('facebook')
                                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/event/register/${eventData.uuid}`)}&quote=${encodeURIComponent('Register for ' + eventData.name)}`, '_blank')
                              }}
                            >
                              <Facebook className="w-4 h-4 mr-1" />
                              Facebook
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
                              onClick={async () => {
                                await trackShareAction('twitter')
                                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/event/register/${eventData.uuid}`)}&text=${encodeURIComponent('Register for ' + eventData.name)}&hashtags=event,registration`, '_blank')
                              }}
                            >
                              <Twitter className="w-4 h-4 mr-1" />
                              Twitter
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-white hover:bg-green-50 border-green-300 text-green-700"
                              onClick={async () => {
                                await trackShareAction('whatsapp')
                                window.open(`https://wa.me/?text=${encodeURIComponent('Register for ' + eventData.name + ': ' + window.location.origin + '/event/register/' + eventData.uuid)}`, '_blank')
                              }}
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              WhatsApp
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-white hover:bg-red-50 border-red-300 text-red-700"
                              onClick={async () => {
                                await trackShareAction('email')
                                const emailBody = `Hi,\n\nYou're invited to register for: ${eventData.name}\n\nRegistration Link: ${window.location.origin}/event/register/${eventData.uuid}\n\nBest regards`
                                window.open(`mailto:?subject=${encodeURIComponent('Registration Invitation: ' + eventData.name)}&body=${encodeURIComponent(emailBody)}`)
                              }}
                            >
                              <Mail className="w-4 h-4 mr-1" />
                              Email
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
                              onClick={async () => {
                                await trackShareAction('linkedin')
                                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}/event/register/${eventData.uuid}`)}`, '_blank')
                              }}
                            >
                              <Linkedin className="w-4 h-4 mr-1" />
                              LinkedIn
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-white hover:bg-pink-50 border-pink-300 text-pink-700"
                              onClick={async () => {
                                await trackShareAction('copy_text')
                                const text = `Register for ${eventData.name}: ${window.location.origin}/event/register/${eventData.uuid}`
                                navigator.clipboard.writeText(text)
                                toast.success('Registration message copied to clipboard!')
                              }}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy Text
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-white hover:bg-orange-50 border-orange-300 text-orange-700"
                              onClick={async () => {
                                await trackShareAction('sms')
                                const smsText = `Register for ${eventData.name}: ${window.location.origin}/event/register/${eventData.uuid}`
                                window.open(`sms:?body=${encodeURIComponent(smsText)}`)
                              }}
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              SMS
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-white hover:bg-teal-50 border-teal-300 text-teal-700"
                              onClick={async () => {
                                await trackShareAction('telegram')
                                const telegramText = `Register for ${eventData.name}: ${window.location.origin}/event/register/${eventData.uuid}`
                                window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '/event/register/' + eventData.uuid)}&text=${encodeURIComponent('Register for ' + eventData.name)}`)
                              }}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Telegram
                            </Button>
                          </div>
                        </div>

                        {/* Embeddable Section */}
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                          <h3 className="text-sm font-semibold text-orange-900 mb-3 flex items-center gap-2">
                            <Code className="w-4 h-4" />
                            Embed on Website
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-orange-800 mb-1 block">HTML Embed Code:</label>
                              <Input
                                value={`<iframe src='${window.location.origin}/event/register/${eventData.uuid}' width='100%' height='600' style='border:none; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);'></iframe>`}
                                readOnly
                                className="text-xs bg-white font-mono border-orange-300"
                                onClick={e => (e.target as HTMLInputElement).select()}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-orange-800 mb-1 block">Direct Link:</label>
                              <Input
                                value={`${window.location.origin}/event/register/${eventData.uuid}`}
                                readOnly
                                className="text-xs bg-white font-mono border-orange-300"
                                onClick={e => (e.target as HTMLInputElement).select()}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  await trackShareAction('embed')
                                  const embedCode = `<iframe src='${window.location.origin}/event/register/${eventData.uuid}' width='100%' height='600' style='border:none; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);'></iframe>`
                                  navigator.clipboard.writeText(embedCode)
                                  toast.success('Embed code copied to clipboard!')
                                }}
                                className="bg-white hover:bg-orange-50 border-orange-300 text-orange-700"
                              >
                                Copy Embed Code
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  await trackShareAction('link')
                                  const link = `${window.location.origin}/event/register/${eventData.uuid}`
                                  navigator.clipboard.writeText(link)
                                  toast.success('Direct link copied to clipboard!')
                                }}
                                className="bg-white hover:bg-orange-50 border-orange-300 text-orange-700"
                              >
                                Copy Direct Link
                              </Button>
                            </div>
                            <p className="text-xs text-orange-700">
                              💡 <strong>Tip:</strong> Copy the HTML code and paste it into your website to embed the registration form directly.
                            </p>
                          </div>
                        </div>


                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Event Not Active</h3>
                        <p className="text-sm text-gray-500 mb-4">The event must be active to share the public registration link.</p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Close dialog and navigate to edit event
                            // You can implement this based on your needs
                          }}
                        >
                          Activate Event
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                {/* <Button variant="outline" onClick={generateReport}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Generate Report
                </Button> */}
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
                        {/* <Button variant="destructive">Move to Trash</Button> */}
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
                  {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'organizer') && (
                    <TabsTrigger
                      value="bulk-badges"
                      className={`px-4 py-2 text-base font-medium transition-all duration-150 border-b-2 border-transparent rounded-none bg-transparent shadow-none
                        ${activeTab === 'bulk-badges' ? 'border-blue-600 text-blue-700 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:border-blue-200'}
                      `}
                    >
                      Bulk Badges
                    </TabsTrigger>
                  )}
                  {(user?.role === 'admin' || user?.role === 'superadmin') && (
                    <TabsTrigger
                      value="badge-designer"
                      className={`px-4 py-2 text-base font-medium transition-all duration-150 border-b-2 border-transparent rounded-none bg-transparent shadow-none
                        ${activeTab === 'badge-designer' ? 'border-blue-600 text-blue-700 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:border-blue-200'}
                      `}
                    >
                      Badge Designer
                    </TabsTrigger>
                  )}
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
                    value="analytics"
                    className={`px-4 py-2 text-base font-medium transition-all duration-150 border-b-2 border-transparent rounded-none bg-transparent shadow-none
                      ${activeTab === 'analytics' ? 'border-blue-600 text-blue-700 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:border-blue-200'}
                    `}
                  >
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger
                    value="sessions"
                    className={`px-4 py-2 text-base font-medium transition-all duration-150 border-b-2 border-transparent rounded-none bg-transparent shadow-none
                      ${activeTab === 'sessions' ? 'border-blue-600 text-blue-700 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:border-blue-200'}
                    `}
                  >
                    Sessions
                  </TabsTrigger>
                  <TabsTrigger
                    value="invitations"
                    className={`px-4 py-2 text-base font-medium transition-all duration-150 border-b-2 border-transparent rounded-none bg-transparent shadow-none
                      ${activeTab === 'invitations' ? 'border-blue-600 text-blue-700 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:border-blue-200'}
                    `}
                  >
                    <Share2 className="w-4 h-4 mr-1 inline" />
                    Invitations
                  </TabsTrigger>
                </>
              )}
          </TabsList>
            <TabsContent value="details">
              <div className="space-y-8">
                {/* Actions Row - moved to top right */}
                <div className="flex flex-wrap gap-4 mb-8 justify-end">
                  {(user?.role === 'admin' || user?.role === 'superadmin' || (user?.role?.startsWith('organizer') && (user?.organizer_id === (eventData as any)?.organizer_id || user?.organizer_id === (eventData as any)?.organizer?.id))) && (
                    <>
                      <Button 
                        onClick={openEditDialog}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Event
                      </Button>
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
                    </>
                  )}
                  {(user?.role === 'admin' || user?.role === 'superadmin') && (
                    <Button 
                      onClick={openEditDialog}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Event
                    </Button>
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
                        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                              <QrCode className="w-5 h-5 text-blue-600" />
                              Public Registration Link
                            </DialogTitle>
                            <DialogDescription className="text-sm">
                              Share this registration link with potential attendees. The link allows public registration for this event.
                            </DialogDescription>
                          </DialogHeader>
                          {eventData?.status?.toLowerCase().trim() === 'active' && eventData?.uuid ? (
                            <div className="space-y-4 sm:space-y-6">
                              {/* Registration Link Section */}
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                  <ExternalLink className="w-4 h-4" />
                                  Registration Link
                                </h3>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                  <Input
                                    value={`${window.location.origin}/event/register/${eventData.uuid}`}
                                    readOnly
                                    className="text-xs sm:text-sm bg-white border-blue-300 focus:border-blue-500 flex-1"
                                    onClick={e => (e.target as HTMLInputElement).select()}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(`${window.location.origin}/event/register/${eventData.uuid}`)
                                      toast.success('Registration link copied to clipboard!')
                                    }}
                                    variant="outline"
                                    className="bg-white hover:bg-blue-50 border-blue-300 text-blue-700 whitespace-nowrap"
                                  >
                                    Copy
                                  </Button>
                                </div>
                              </div>

                              {/* QR Code Section */}
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 sm:p-4 border border-green-200">
                                <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                                  <QrCode className="w-4 h-4" />
                                  QR Code
                                </h3>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                  <div className="bg-white p-2 sm:p-3 rounded-lg border border-green-300">
                                    <img 
                                      id="public-registration-qr"
                                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/event/register/${eventData.uuid}`)}&format=png&margin=10&color=1F2937&bgcolor=FFFFFF`} 
                                      alt="QR Code for registration" 
                                      className="w-20 h-20 sm:w-24 sm:h-24" 
                                    />
                                  </div>
                                  <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const link = document.createElement('a')
                                        link.href = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(`${window.location.origin}/event/register/${eventData.uuid}`)}&format=png&margin=10&color=1F2937&bgcolor=FFFFFF`
                                        link.download = `registration-qr-${eventData.name.replace(/[^a-zA-Z0-9]/g, '-')}.png`
                                        link.click()
                                        toast.success('QR code downloaded!')
                                      }}
                                      className="bg-white hover:bg-green-50 border-green-300 text-green-700 flex-1 sm:flex-none"
                                    >
                                      Download QR
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/event/register/${eventData.uuid}`)
                                        toast.success('Link copied! Scan the QR code or share the link.')
                                      }}
                                      className="bg-white hover:bg-green-50 border-green-300 text-green-700 flex-1 sm:flex-none"
                                    >
                                      Copy Link
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Quick Share Section */}
                              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 sm:p-4 border border-purple-200">
                                <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                  <Share2 className="w-4 h-4" />
                                  Quick Share
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white hover:bg-blue-50 border-blue-300 text-blue-700 text-xs sm:text-sm"
                                    onClick={async () => {
                                      await trackShareAction('facebook')
                                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/event/register/${eventData.uuid}`)}&quote=${encodeURIComponent('Register for ' + eventData.name)}`, '_blank')
                                    }}
                                  >
                                    <Facebook className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span className="hidden sm:inline">Facebook</span>
                                    <span className="sm:hidden">FB</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white hover:bg-blue-50 border-blue-300 text-blue-700 text-xs sm:text-sm"
                                    onClick={async () => {
                                      await trackShareAction('twitter')
                                      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/event/register/${eventData.uuid}`)}&text=${encodeURIComponent('Register for ' + eventData.name)}&hashtags=event,registration`, '_blank')
                                    }}
                                  >
                                    <Twitter className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span className="hidden sm:inline">Twitter</span>
                                    <span className="sm:hidden">X</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white hover:bg-green-50 border-green-300 text-green-700 text-xs sm:text-sm"
                                    onClick={async () => {
                                      await trackShareAction('whatsapp')
                                      window.open(`https://wa.me/?text=${encodeURIComponent('Register for ' + eventData.name + ': ' + window.location.origin + '/event/register/' + eventData.uuid)}`, '_blank')
                                    }}
                                  >
                                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span className="hidden sm:inline">WhatsApp</span>
                                    <span className="sm:hidden">WA</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white hover:bg-red-50 border-red-300 text-red-700 text-xs sm:text-sm"
                                    onClick={async () => {
                                      await trackShareAction('email')
                                      const emailBody = `Hi,\n\nYou're invited to register for: ${eventData.name}\n\nRegistration Link: ${window.location.origin}/event/register/${eventData.uuid}\n\nBest regards`
                                      window.open(`mailto:?subject=${encodeURIComponent('Registration Invitation: ' + eventData.name)}&body=${encodeURIComponent(emailBody)}`)
                                    }}
                                  >
                                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span className="hidden sm:inline">Email</span>
                                    <span className="sm:hidden">Mail</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white hover:bg-blue-50 border-blue-300 text-blue-700 text-xs sm:text-sm"
                                    onClick={async () => {
                                      await trackShareAction('linkedin')
                                      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}/event/register/${eventData.uuid}`)}`, '_blank')
                                    }}
                                  >
                                    <Linkedin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span className="hidden sm:inline">LinkedIn</span>
                                    <span className="sm:hidden">LI</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white hover:bg-pink-50 border-pink-300 text-pink-700 text-xs sm:text-sm"
                                    onClick={async () => {
                                      await trackShareAction('copy_text')
                                      const text = `Register for ${eventData.name}: ${window.location.origin}/event/register/${eventData.uuid}`
                                      navigator.clipboard.writeText(text)
                                      toast.success('Registration message copied to clipboard!')
                                    }}
                                  >
                                    <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span className="hidden sm:inline">Copy Text</span>
                                    <span className="sm:hidden">Copy</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white hover:bg-orange-50 border-orange-300 text-orange-700 text-xs sm:text-sm"
                                    onClick={async () => {
                                      await trackShareAction('sms')
                                      const smsText = `Register for ${eventData.name}: ${window.location.origin}/event/register/${eventData.uuid}`
                                      window.open(`sms:?body=${encodeURIComponent(smsText)}`)
                                    }}
                                  >
                                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span className="hidden sm:inline">SMS</span>
                                    <span className="sm:hidden">SMS</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white hover:bg-teal-50 border-teal-300 text-teal-700 text-xs sm:text-sm"
                                    onClick={async () => {
                                      await trackShareAction('telegram')
                                      const telegramText = `Register for ${eventData.name}: ${window.location.origin}/event/register/${eventData.uuid}`
                                      window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '/event/register/' + eventData.uuid)}&text=${encodeURIComponent('Register for ' + eventData.name)}`)
                                    }}
                                  >
                                    <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span className="hidden sm:inline">Telegram</span>
                                    <span className="sm:hidden">TG</span>
                                  </Button>
                                </div>
                              </div>

                              {/* Embeddable Section */}
                              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3 sm:p-4 border border-orange-200">
                                <h3 className="text-sm font-semibold text-orange-900 mb-3 flex items-center gap-2">
                                  <Code className="w-4 h-4" />
                                  Embed on Website
                                </h3>
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-xs font-medium text-orange-800 mb-1 block">HTML Embed Code:</label>
                                    <Input
                                      value={`<iframe src='${window.location.origin}/event/register/${eventData.uuid}' width='100%' height='600' style='border:none; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);'></iframe>`}
                                      readOnly
                                      className="text-xs bg-white font-mono border-orange-300"
                                      onClick={e => (e.target as HTMLInputElement).select()}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-orange-800 mb-1 block">Direct Link:</label>
                                    <Input
                                      value={`${window.location.origin}/event/register/${eventData.uuid}`}
                                      readOnly
                                      className="text-xs bg-white font-mono border-orange-300"
                                      onClick={e => (e.target as HTMLInputElement).select()}
                                    />
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        await trackShareAction('embed')
                                        const embedCode = `<iframe src='${window.location.origin}/event/register/${eventData.uuid}' width='100%' height='600' style='border:none; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);'></iframe>`
                                        navigator.clipboard.writeText(embedCode)
                                        toast.success('Embed code copied to clipboard!')
                                      }}
                                      className="bg-white hover:bg-orange-50 border-orange-300 text-orange-700 flex-1 sm:flex-none"
                                    >
                                      Copy Embed Code
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        await trackShareAction('link')
                                        const link = `${window.location.origin}/event/register/${eventData.uuid}`
                                        navigator.clipboard.writeText(link)
                                        toast.success('Direct link copied to clipboard!')
                                      }}
                                      className="bg-white hover:bg-orange-50 border-orange-300 text-orange-700 flex-1 sm:flex-none"
                                    >
                                      Copy Direct Link
                                    </Button>
                                  </div>
                                  <p className="text-xs text-orange-700">
                                    💡 <strong>Tip:</strong> Copy the HTML code and paste it into your website to embed the registration form directly.
                                  </p>
                                </div>
                              </div>


                            </div>
                          ) : (
                            <div className="text-center py-6 sm:py-8">
                              <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Event Not Active</h3>
                              <p className="text-sm text-gray-500 mb-4">The event must be active to share the public registration link.</p>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  // Close dialog and navigate to edit event
                                  // You can implement this based on your needs
                                }}
                              >
                                Activate Event
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      {/* <Button variant="outline" onClick={generateReport}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Generate Report
                      </Button> */}
                      <UsherAssignmentDialog
                        open={isAssignUsherDialogOpen}
                        onOpenChange={setIsAssignUsherDialogOpen}
                        eventId={eventData.id}
                        eventName={eventData?.name || ''}
                        trigger={
                          <Button
                            variant="default"
                            className="flex items-center gap-2"
                          >
                            <UserPlus className="w-4 h-4" /> Assign Ushers
                          </Button>
                        }
                      />
                      <Button variant="destructive" onClick={handleDeleteEvent}>
                        Move to Trash
                      </Button>
                    </>
                  )}
                </div>

                {/* Event Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Event Type Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        eventData?.event_type === 'ticketed' 
                          ? 'bg-purple-100 text-purple-600' 
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {eventData?.event_type === 'ticketed' ? '🎫' : '🎉'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Event Type</p>
                        <p className={`font-bold ${
                          eventData?.event_type === 'ticketed' ? 'text-purple-700' : 'text-green-700'
                        }`}>
                          {eventData?.event_type === 'ticketed' ? 'Ticketed Event' : 'Free Event'}
                        </p>
                      </div>
                      </div>
                    <div className="text-xs text-gray-500">
                      {eventData?.event_type === 'ticketed' 
                        ? `${ticketTypes.length} ticket types available`
                        : `${guestTypes.length} guest types available`
                      }
                      </div>
                      </div>

                  {/* Status Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        eventData?.status === 'active' ? 'bg-green-100 text-green-600' :
                        eventData?.status === 'draft' ? 'bg-yellow-100 text-yellow-600' :
                        eventData?.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {eventData?.status === 'active' ? '✓' : 
                         eventData?.status === 'draft' ? '📝' : 
                         eventData?.status === 'cancelled' ? '✗' : '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Status</p>
                        <p className="font-bold text-gray-800 capitalize">{eventData?.status || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {eventData?.status === 'active' ? 'Event is live and accepting registrations' :
                       eventData?.status === 'draft' ? 'Event is in preparation mode' :
                       eventData?.status === 'cancelled' ? 'Event has been cancelled' : 'Status unknown'}
                    </div>
                  </div>

                  {/* Registration Card */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        eventData?.registration_start_date && new Date(eventData.registration_start_date) <= new Date() && 
                        eventData?.registration_end_date && new Date(eventData.registration_end_date) >= new Date() 
                          ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {eventData?.registration_start_date && new Date(eventData.registration_start_date) <= new Date() && 
                         eventData?.registration_end_date && new Date(eventData.registration_end_date) >= new Date() 
                           ? '✓' : '✗'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Registration</p>
                        <p className="font-bold text-gray-800">
                          {eventData?.registration_start_date && eventData?.registration_end_date 
                            ? (new Date(eventData.registration_start_date) <= new Date() && new Date(eventData.registration_end_date) >= new Date())
                              ? 'Open'
                              : new Date(eventData.registration_start_date) > new Date()
                                ? 'Not Started'
                                : 'Closed'
                            : 'Not Set'}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {attendees.length} attendees registered
                    </div>
                  </div>

                  {/* Capacity Card */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                        👥
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Capacity</p>
                        <p className="font-bold text-gray-800">
                          {eventData?.max_guests ? `${eventData.max_guests} guests` : 'Unlimited'}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {eventData?.max_guests 
                        ? `${attendees.length}/${eventData.max_guests} spots filled`
                        : 'No capacity limit'
                      }
                    </div>
                  </div>
                </div>

                {/* Event Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Event Information */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Event Description */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          📝
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Event Description</h3>
                      </div>
                      <div className="prose prose-gray max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {eventData?.description || 'No description provided for this event.'}
                        </p>
                      </div>
                    </div>

                    {/* Event Type Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                          {eventData?.event_type === 'ticketed' ? '🎫' : '🎉'}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {eventData?.event_type === 'ticketed' ? 'Ticket Information' : 'Guest Type Information'}
                        </h3>
                      </div>
                      
                          {eventData?.event_type === 'ticketed' ? (
                        <div className="space-y-4">
                          {ticketTypes.length > 0 ? (
                              ticketTypes.map((ticket: any, index: number) => {
                                const ticketName = ticket?.name || 'Unknown Ticket';
                                const ticketPrice = ticket?.price ? parseFloat(ticket.price).toLocaleString() : '0';
                              const ticketQuantity = ticket?.quantity || 'Unlimited';
                              const ticketDescription = ticket?.description || '';
                              
                                return (
                                <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h4 className="font-bold text-purple-900 text-lg">{ticketName}</h4>
                                      {ticketDescription && (
                                        <p className="text-purple-700 text-sm mt-1">{ticketDescription}</p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-purple-900">ETB {ticketPrice}</div>
                                      <div className="text-sm text-purple-600">
                                        {ticketQuantity === 'Unlimited' ? 'Unlimited' : `${ticketQuantity} available`}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-purple-600">
                                    <span>🎫</span>
                                    <span>Ticket Type</span>
                                  </div>
                                </div>
                                );
                              })
                            ) : (
                            <div className="text-center py-8 text-gray-500">
                              <div className="text-4xl mb-2">🎫</div>
                              <p>No ticket types defined for this event</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {guestTypes.length > 0 ? (
                              guestTypes.map((gt: any, index: number) => {
                                let guestTypeName = '';
                              let guestTypePrice = '';
                              let guestTypeDescription = '';
                              
                                if (typeof gt === 'object' && gt !== null) {
                                  guestTypeName = gt.name || gt.id || String(gt.id) || 'Unknown';
                                guestTypePrice = gt.price ? parseFloat(gt.price).toLocaleString() : '0';
                                guestTypeDescription = gt.description || '';
                                } else {
                                  guestTypeName = String(gt);
                                guestTypePrice = '0';
                                }
                              
                                return (
                                <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h4 className="font-bold text-green-900 text-lg">{guestTypeName}</h4>
                                      {guestTypeDescription && (
                                        <p className="text-green-700 text-sm mt-1">{guestTypeDescription}</p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-green-900">
                                        {guestTypePrice === '0' ? 'Free' : `ETB ${guestTypePrice}`}
                                      </div>
                                      <div className="text-sm text-green-600">Guest Type</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-green-600">
                                    <span>👥</span>
                                    <span>Guest Type</span>
                                  </div>
                                </div>
                                );
                              })
                            ) : (
                            <div className="text-center py-8 text-gray-500">
                              <div className="text-4xl mb-2">👥</div>
                              <p>No guest types defined for this event</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                        </div>

                  {/* Sidebar Information */}
                  <div className="space-y-6">
                    {/* Event Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                          📅
                      </div>
                        <h3 className="text-lg font-bold text-gray-900">Event Details</h3>
                    </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Calendar className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Start Date</p>
                            <p className="text-sm text-gray-900">
                              {eventData?.start_date && format(parseISO(eventData.start_date), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {eventData?.start_date && format(parseISO(eventData.start_date), 'h:mm a')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Calendar className="w-5 h-5 text-red-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">End Date</p>
                            <p className="text-sm text-gray-900">
                              {eventData?.end_date && format(parseISO(eventData.end_date), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {eventData?.end_date && format(parseISO(eventData.end_date), 'h:mm a')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <MapPin className="w-5 h-5 text-pink-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Location</p>
                            <p className="text-sm text-gray-900">{eventData?.location}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <UserPlus className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Organizer</p>
                            <p className="text-sm text-gray-900">
                              {user?.organizer?.name || eventData?.organizer?.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Tag className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Category</p>
                            <p className="text-sm text-gray-900 capitalize">
                              {eventData?.eventCategory?.name || 'Not specified'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Tag className="w-5 h-5 text-yellow-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Type Category</p>
                            <p className="text-sm text-gray-900 capitalize">
                              {eventData?.eventType?.name || 'Not specified'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Registration Period */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                          ⏰
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Registration Period</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <Clock className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Opens</p>
                            <p className="text-sm text-gray-900">
                              {eventData?.registration_start_date && format(parseISO(eventData.registration_start_date), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {eventData?.registration_start_date && format(parseISO(eventData.registration_start_date), 'h:mm a')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                          <Clock className="w-5 h-5 text-red-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Closes</p>
                            <p className="text-sm text-gray-900">
                              {eventData?.registration_end_date && format(parseISO(eventData.registration_end_date), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {eventData?.registration_end_date && format(parseISO(eventData.registration_end_date), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>
                  
                  {/* Event & Registration Dates Section */}
                  {/* <div className="bg-white rounded-xl shadow p-6 mb-8">
                    <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-500" />
                      Event & Registration Dates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Event Period</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">Start:</span>
                            <span>{eventData?.start_date && format(parseISO(eventData.start_date), 'MMM d, yyyy, h:mm a')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-red-500" />
                            <span className="font-medium">End:</span>
                            <span>{eventData?.end_date && format(parseISO(eventData.end_date), 'MMM d, yyyy, h:mm a')}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Registration Period</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-green-500" />
                            <span className="font-medium">Opens:</span>
                            <span>{eventData?.registration_start_date && format(parseISO(eventData.registration_start_date), 'MMM d, yyyy, h:mm a')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span className="font-medium">Closes:</span>
                            <span>{eventData?.registration_end_date && format(parseISO(eventData.registration_end_date), 'MMM d, yyyy, h:mm a')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div> */}
                  
                  {/* Additional Event Details Section */}
                  {(eventData?.requirements || eventData?.agenda) && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                          📋
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Additional Information</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {eventData?.requirements && (
                          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <Shield className="w-5 h-5 text-orange-600" />
                              <h4 className="font-bold text-orange-900">Requirements</h4>
                            </div>
                            <p className="text-orange-800 leading-relaxed whitespace-pre-line">{eventData.requirements}</p>
                          </div>
                        )}
                        {eventData?.agenda && (
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <Clock className="w-5 h-5 text-blue-600" />
                              <h4 className="font-bold text-blue-900">Agenda</h4>
                            </div>
                            <p className="text-blue-800 leading-relaxed whitespace-pre-line">{eventData.agenda}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  

                </div>
              </TabsContent>
            <TabsContent value="badges">
                  <div className="flex flex-col gap-6">
                    {/* Header Section */}
                    <div className="flex flex-wrap gap-4 justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                          <Printer className="w-6 h-6 text-slate-700" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900">
                            Badge Management
                          </h3>
                          <p className="text-slate-600 text-sm">
                            Design, preview, and print attendee badges
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => navigate(`/badge-designer/templates/${eventId}`)}
                          className="border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Palette className="w-4 h-4" /> Design Badge
                        </Button>
                        {/* Legacy designer removed - now using standalone Fabric.js app */}
                        <Button 
                          variant="default" 
                          onClick={handleBadgeBatchPrintBadges} 
                          disabled={badgeSelectedAttendees.size === 0}
                          className="bg-slate-900 hover:bg-slate-800 shadow-sm flex items-center gap-2"
                        >
                          <Printer className="w-4 h-4" /> 
                          Print Selected ({badgeSelectedAttendees.size})
                        </Button>
                      </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-600">Total Attendees</p>
                            <p className="text-2xl font-bold text-slate-900">{filteredBadgesAttendees.length}</p>
                          </div>
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-600">Checked In</p>
                            <p className="text-2xl font-bold text-emerald-600">
                              {filteredBadgesAttendees.filter(a => a.checked_in).length}
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-600">Pending Check-in</p>
                            <p className="text-2xl font-bold text-amber-600">
                              {filteredBadgesAttendees.filter(a => !a.checked_in).length}
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-600" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-600">Selected for Print</p>
                            <p className="text-2xl font-bold text-slate-900">{badgeSelectedAttendees.size}</p>
                          </div>
                          <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-slate-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="flex flex-wrap gap-4 items-center">
                        <div className="relative flex-1 max-w-md">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                            placeholder="Search attendees by name, email, or company..."
                        value={badgeSearchTerm}
                        onChange={e => setBadgeSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full"
                          />
                          {badgeSearchTerm && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setBadgeSearchTerm('')}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-100"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      <Select value={badgeGuestTypeFilter} onValueChange={setBadgeGuestTypeFilter}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {guestTypes.map(type => (
                            <SelectItem key={type.id} value={type.name.toLowerCase()}>{type.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={badgeCheckedInFilter} onValueChange={setBadgeCheckedInFilter}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="checked-in">Checked In</SelectItem>
                          <SelectItem value="not-checked-in">Not Checked In</SelectItem>
                        </SelectContent>
                      </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBadgeSearchTerm('');
                            setBadgeGuestTypeFilter('all');
                            setBadgeCheckedInFilter('all');
                          }}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                    </div>

                    {/* Badge List View */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <div className="p-4 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={badgeSelectedAttendees.size === filteredBadgesAttendees.length && filteredBadgesAttendees.length > 0} 
                              onCheckedChange={handleBadgeSelectAllAttendees} 
                            />
                            <span className="text-sm text-slate-600">
                              {badgeSelectedAttendees.size} of {filteredBadgesAttendees.length} selected
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setBadgeSelectedAttendees(new Set())}
                              disabled={badgeSelectedAttendees.size === 0}
                              className="text-slate-600 hover:text-slate-800"
                            >
                              Clear Selection
                      </Button>
                    </div>
                        </div>
                      </div>
                      
                      {filteredBadgesAttendees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-medium text-slate-900 mb-2">No attendees found</h3>
                          <p className="text-slate-600 text-center max-w-md">
                            {badgeSearchTerm || badgeGuestTypeFilter !== 'all' || badgeCheckedInFilter !== 'all' 
                              ? 'Try adjusting your search or filters to find attendees.'
                              : 'No attendees have been registered for this event yet.'
                            }
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-200">
                          {filteredBadgesAttendees.map(attendee => (
                            <div 
                              key={attendee.id} 
                              className={`p-4 transition-all duration-200 hover:bg-slate-50 ${
                                badgeSelectedAttendees.has(attendee.id) 
                                  ? 'bg-slate-50 border-l-4 border-slate-900' 
                                  : 'border-l-4 border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                {/* Selection Checkbox */}
                                <div className="flex-shrink-0">
                                  <Checkbox 
                                    checked={badgeSelectedAttendees.has(attendee.id)} 
                                    onCheckedChange={() => handleBadgeSelectAttendee(attendee.id)} 
                                  />
                                </div>

                                {/* Badge Preview */}
                                <div className="flex-shrink-0">
                                  <div className="w-20 h-28 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                                    <div style={{ transform: 'scale(0.12)', transformOrigin: 'top left', width: 400, height: 600 }}>
                                      <BadgePrint attendee={attendee} />
                                    </div>
                                  </div>
                                </div>

                                {/* Attendee Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold text-slate-900 truncate">
                                      {attendee.guest?.name || 'Unknown'}
                                    </h4>
                                    <Badge className={`text-xs ${getGuestTypeBadgeClasses((attendee.guestType || attendee.guest_type)?.name)}`}>
                                  {(attendee.guestType || attendee.guest_type)?.name || 'General'}
                                </Badge>
                                {attendee.checked_in ? (
                                      <Badge className="bg-emerald-50 text-emerald-700 text-xs border border-emerald-200">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Checked In
                                      </Badge>
                                ) : (
                                      <Badge className="bg-amber-50 text-amber-700 text-xs border border-amber-200">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Pending
                                      </Badge>
                                )}
                                  </div>
                                  <p className="text-sm text-slate-600 truncate">
                                    {attendee.guest?.email || 'No email'}
                                  </p>
                                  {attendee.guest?.company && (
                                    <p className="text-sm text-slate-500 truncate">
                                      {attendee.guest.company}
                                    </p>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex-shrink-0 flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => {
                                  setBadgeSelectedAttendees(new Set([attendee.id]));
                                  setPrinting(true);
                                    }}
                                    className="border-slate-200 text-slate-700 hover:bg-slate-50"
                                  >
                                    <Printer className="w-4 h-4 mr-1" />
                                    Print
                                </Button>

                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Hidden print area for batch printing */}
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
                      <style>{`
                        @media print {
                          body * { visibility: hidden !important; }
                          #badge-print-area, #badge-print-area * { visibility: visible !important; }
                          #badge-print-area { 
                            position: absolute !important; 
                            left: 0 !important; 
                            top: 0 !important; 
                            width: 100vw !important; 
                            height: 100vh !important; 
                            background: white !important; 
                            z-index: 9999 !important;
                          }
                          .printable-badge-batch {
                            page-break-after: always;
                            margin: 0 !important;
                            padding: 0 !important;
                            border: none !important;
                            box-shadow: none !important;
                            visibility: visible !important;
                          }
                          .printable-badge-batch:last-child {
                            page-break-after: auto;
                          }
                        }
                      `}</style>
                      <div id="badge-print-area">
                                              {printing && badgeSelectedAttendees.size > 0 ? (
                          filteredBadgesAttendees
                            .filter(attendee => badgeSelectedAttendees.has(attendee.id))
                            .map(attendee => (
                              <div key={attendee.id} className="printable-badge-batch">
                                <BadgePrint attendee={attendee} />
                              </div>
                            ))
                        ) : (
                          <div>No badges selected for printing.</div>
                        )}
                        </div>
                      </div>
                  </div>
            </TabsContent>
                <TabsContent value="attendees">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                            Attendee Management
                          </h3>
                          <p className="text-gray-600 text-sm">
                            Search, filter, and manage event attendees
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="default" 
                          onClick={() => setAddAttendeeDialogOpen(true)} 
                          className="bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg hover:shadow-xl flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Add Attendee
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setCreateParticipantDialogOpen(true)}
                          className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-2"
                        >
                          <UserPlus className="w-4 h-4" /> 
                          Create Participant
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setCsvUploadDialogOpen(true)} 
                          className="border-gray-200 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" /> Upload CSV
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={exportAttendeesToCSV} 
                          className="border-gray-200 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" /> Export CSV
                        </Button>
                        <Button 
                          variant="default" 
                          onClick={handleBatchPrintBadges} 
                          disabled={selectedAttendees.size === 0}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl flex items-center gap-2"
                        >
                          <Printer className="w-4 h-4" /> 
                          Print Selected ({selectedAttendees.size})
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                          placeholder="Search by name, email, phone, company, job title, or country..."
                        value={searchTerm}
                        onChange={e => handleSearchChange(e.target.value)}
                          className="pl-10 pr-4 py-2 w-full"
                        />
                        {searchTerm && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSearchChange('')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <Select value={guestTypeFilter} onValueChange={handleGuestTypeFilterChange}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {guestTypes.map(type => (
                            <SelectItem key={type.id} value={type.name.toLowerCase()}>{type.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={checkedInFilter} onValueChange={handleCheckedInFilterChange}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="checked-in">Checked In</SelectItem>
                          <SelectItem value="not-checked-in">Not Checked In</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-semibold text-gray-700 text-sm py-4 w-12">
                                <Checkbox 
                                  checked={selectedAttendees.size === filteredAttendees.length && filteredAttendees.length > 0} 
                                  onCheckedChange={handleSelectAllAttendees} 
                                />
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 text-sm py-4">Attendee</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-sm py-4">Company & Title</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-sm py-4">Contact</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-sm py-4">Guest Type</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-sm py-4">Status</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-sm py-4">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAttendees.length > 0 ? filteredAttendees.map(attendee => (
                              <TableRow key={attendee.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                                <TableCell className="py-4">
                                  <Checkbox 
                                    checked={selectedAttendees.has(attendee.id)} 
                                    onCheckedChange={() => handleSelectAttendee(attendee.id)} 
                                  />
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm">
                                      {attendee.guest?.name?.charAt(0)?.toUpperCase() || 'A'}
                                    </div>
                                <div>
                                      <div className="font-semibold text-gray-900">{attendee.guest?.name}</div>
                                  <div className="text-xs text-gray-500">{attendee.guest?.country}</div>
                                    </div>
                                </div>
                              </TableCell>
                                <TableCell className="py-4">
                                  <div className="font-medium text-gray-900">{attendee.guest?.company}</div>
                                <div className="text-xs text-gray-500">{attendee.guest?.jobtitle}</div>
                              </TableCell>
                                <TableCell className="py-4">
                                  <div className="text-sm text-gray-900 flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-gray-400" /> 
                                    {attendee.guest?.email}
                                  </div>
                                  {attendee.guest?.phone && (
                                    <div className="text-sm text-gray-900 flex items-center gap-1 mt-1">
                                      <Phone className="w-3 h-3 text-gray-400" /> 
                                      {attendee.guest?.phone}
                                    </div>
                                  )}
                              </TableCell>
                                <TableCell className="py-4">
                                <Badge className={getGuestTypeBadgeClasses((attendee.guestType || attendee.guest_type)?.name)}>
                                  {(attendee.guestType || attendee.guest_type)?.name || 'General'}
                                </Badge>
                              </TableCell>
                                <TableCell className="py-4">
                                {attendee.checked_in ? (
                                    <Badge className="bg-green-100 text-green-800 border border-green-200">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Checked In
                                    </Badge>
                                ) : (
                                    <Badge className="bg-gray-100 text-gray-800 border border-gray-200">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Not Checked In
                                    </Badge>
                                )}
                              </TableCell>
                                <TableCell className="py-4">
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => {
                                  setSelectedAttendees(new Set([attendee.id]));
                                  setPrinting(true);
                                      }}
                                      className="bg-white border-gray-200 hover:bg-gray-50"
                                    >
                                      <Printer className="w-3 h-3" />
                                    </Button>

                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => openEditAttendeeDialog(attendee)}
                                      className="bg-white border-gray-200 hover:bg-gray-50"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                {(user?.role === 'admin' || user?.role === 'superadmin' || 
                                  (['organizer', 'organizer_admin'].includes(user?.role) && eventData?.organizer_id === user?.organizer_id)) && (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleRemoveAttendee(attendee)}
                                        className="bg-white border-red-200 text-red-600 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                              </TableCell>
                            </TableRow>
                            )) : (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-12">
                                  <div className="flex flex-col items-center space-y-3">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                      <Search className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <div className="text-lg font-medium text-gray-900">
                                      {searchTerm ? 'No attendees found' : 'No attendees'}
                                    </div>
                                    <div className="text-sm text-gray-600 max-w-md text-center">
                                      {searchTerm 
                                        ? `No attendees match your search for "${searchTerm}". Try adjusting your search terms or filters.`
                                        : 'No attendees have been registered for this event yet.'
                                      }
                                    </div>
                                    {searchTerm && (
                                      <Button
                                        variant="outline"
                                        onClick={() => setSearchTerm('')}
                                        className="mt-2"
                                      >
                                        Clear search
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                        </TableBody>
                      </Table>
                    </div>
                    </div>
                    
                    {/* Pagination Component */}
                    {!attendeesLoading && !attendeesError && filteredAttendees.length > 0 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalRecords={totalRecords}
                        perPage={perPage}
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                      />
                    )}
                  </div>
                </TabsContent>
            <TabsContent value="ushers">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                            Ushers & Tasks
                          </h3>
                          <p className="text-gray-600 text-sm">
                            Manage usher assignments and task distribution
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="default" 
                        onClick={() => setIsAssignUsherDialogOpen(true)} 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg hover:shadow-xl flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Assign Ushers
                      </Button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-semibold text-gray-700 text-sm py-4">Usher</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-sm py-4">Contact</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-sm py-4">Status</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-sm py-4">Assigned Tasks</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-sm py-4">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                            {eventUshers && eventUshers.length > 0 ? eventUshers.map(usher => {
                              const tasks = Array.isArray(usher.pivot?.tasks) 
                                ? usher.pivot.tasks 
                                : (typeof usher.pivot?.tasks === 'string' 
                                  ? JSON.parse(usher.pivot.tasks) 
                                  : [])
                              return (
                                <TableRow key={usher.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                                  <TableCell className="py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm">
                                        {usher.name.charAt(0).toUpperCase()}
                                      </div>
                                <div>
                                        <div className="font-semibold text-gray-900">{usher.name}</div>
                                        <div className="text-xs text-gray-500">
                                          ID: {usher.id}
                                        </div>
                                      </div>
                                </div>
                              </TableCell>
                                  <TableCell className="py-4">
                                    <div className="text-sm text-gray-900">{usher.email}</div>
                                    {usher.phone && (
                                <div className="text-xs text-gray-500">{usher.phone}</div>
                                    )}
                              </TableCell>
                                  <TableCell className="py-4">
                                    <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                                      <UserCheck className="w-3 h-3 mr-1" />
                                      Assigned
                                </Badge>
                              </TableCell>
                                  <TableCell className="py-4">
                                {editingUsherId === usher.id ? (
                                      <div className="space-y-2">
                                        <Textarea
                                      value={editTasks}
                                      onChange={e => setEditTasks(e.target.value)}
                                          placeholder="Enter tasks separated by commas"
                                          className="w-full"
                                          rows={3}
                                        />
                                        <div className="flex gap-2">
                                          <Button 
                                            size="sm" 
                                            variant="outline" 
                                            onClick={async () => { 
                                              await updateUsherTasks(Number(eventId), usher.id, editTasks.split(',').map(t => t.trim()).filter(Boolean)); 
                                              setEditingUsherId(null); 
                                            }}
                                            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                          >
                                            Save
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => setEditingUsherId(null)}
                                            className="text-gray-600"
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                  </div>
                                ) : (
                                      <div className="space-y-2">
                                        {tasks.length > 0 ? (
                                          <div className="flex flex-wrap gap-1">
                                            {tasks.map((task: string, index: number) => (
                                              <Badge
                                                key={index}
                                                variant="outline"
                                                className={`text-xs ${getTaskColor(task)}`}
                                              >
                                                {task}
                                              </Badge>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="text-gray-500 text-sm">
                                            No tasks assigned
                                          </span>
                                        )}
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={() => { 
                                            setEditingUsherId(usher.id); 
                                            setEditTasks(tasks.join(', ')); 
                                          }}
                                          className="bg-white border-gray-200 hover:bg-gray-50 text-xs"
                                        >
                                          <Edit className="w-3 h-3 mr-1" />
                                          Edit Tasks
                                        </Button>
                                  </div>
                                )}
                              </TableCell>
                                  <TableCell className="py-4">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-white border-gray-200 hover:bg-gray-50"
                                        onClick={async () => {
                                  try {
                                    await api.delete(`/events/${Number(eventId)}/ushers/${usher.id}`);
                                    const eventRes = await getEventUshers(Number(eventId));
                                    setEventUshers(eventRes.data);
                                    toast.success('Usher removed from event!');
                                  } catch (err: any) {
                                    toast.error(err.response?.data?.error || 'Failed to remove usher.');
                                  }
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Remove
                                      </Button>
                                    </div>
                              </TableCell>
                            </TableRow>
                              )
                            }) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12">
                                  <div className="flex flex-col items-center space-y-3">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                      <Users className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <div className="text-lg font-medium text-gray-900">No ushers assigned</div>
                                    <div className="text-sm text-gray-600 max-w-md text-center">
                                      No ushers have been assigned to this event yet. Click "Assign Ushers" to get started.
                                    </div>
                                  </div>
                                </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      </div>
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
            <TabsContent value="analytics">
              <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
                {/* Header Section */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Event Analytics
                      </h1>
                      <p className="text-gray-600">Comprehensive insights and performance metrics</p>
                    </div>
                  </div>
                </div>

                {analyticsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <div className="text-lg font-medium text-gray-600">Loading analytics dashboard...</div>
                    <div className="text-sm text-gray-500 mt-2">Gathering comprehensive event data</div>
                  </div>
                ) : analyticsError ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <div className="text-lg font-medium text-gray-900 mb-2">Failed to load analytics</div>
                    <div className="text-gray-600 mb-6">{analyticsError}</div>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.reload()}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </Button>
                  </div>
                ) : analytics ? (
                  <div className="space-y-8">
                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-sm font-medium text-gray-600">Total Registered</div>
                          </div>
                          <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.total_registered}</div>
                          <div className="text-xs text-gray-500">Event attendees</div>
                        </div>
                      </div>

                      <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-sm font-medium text-gray-600">Checked In</div>
                          </div>
                          <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.total_checked_in}</div>
                          <div className="text-xs text-gray-500">Present attendees</div>
                        </div>
                      </div>

                      <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                              <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-sm font-medium text-gray-600">Check-in Rate</div>
                          </div>
                          <div className="text-3xl font-bold text-gray-900 mb-1">
                            {analytics.total_registered ? Math.round((analytics.total_checked_in / analytics.total_registered) * 100) : 0}%
                          </div>
                          <div className="text-xs text-gray-500">Attendance rate</div>
                        </div>
                      </div>

                      <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gray-500 to-gray-600 opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                              <Clock className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-sm font-medium text-gray-600">Not Checked In</div>
                          </div>
                          <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.total_registered - analytics.total_checked_in}</div>
                          <div className="text-xs text-gray-500">Absent attendees</div>
                        </div>
                      </div>
                    </div>
                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Hourly Check-in Trend</h3>
                            <p className="text-sm text-gray-600">Real-time attendance patterns</p>
                          </div>
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                          <LineChart data={analytics.hourly_checkin_trend || analytics.checkin_trend || []}>
                            <defs>
                              <linearGradient id="checkinGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="hour" 
                              stroke="#64748b"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis 
                              allowDecimals={false}
                              stroke="#64748b"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <RechartsTooltip 
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="checked_in" 
                              stroke="#22c55e" 
                              strokeWidth={3}
                              fill="url(#checkinGradient)"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="checked_in" 
                              stroke="#22c55e" 
                              strokeWidth={3}
                              dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Registration Timeline</h3>
                            <p className="text-sm text-gray-600">Registration growth over time</p>
                          </div>
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-white" />
                          </div>
                        </div>
{analytics.registration_timeline && analytics.registration_timeline.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <LineChart data={analytics.registration_timeline}>
                            <defs>
                              <linearGradient id="registrationGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#64748b"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis 
                              allowDecimals={false}
                              stroke="#64748b"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <RechartsTooltip 
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="registered" 
                              stroke="#6366f1" 
                              strokeWidth={3}
                              fill="url(#registrationGradient)"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="registered" 
                              stroke="#6366f1" 
                              strokeWidth={3}
                              dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <BarChart3 className="w-12 h-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">No Registration Data</p>
                            <p className="text-sm">Registration timeline will appear when attendees register for this event</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Distribution Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Top Companies</h3>
                            <p className="text-sm text-gray-600">Most represented organizations</p>
                          </div>
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <Building className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={analytics.top_companies || []}>
                            <defs>
                              <linearGradient id="companyGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="company" 
                              stroke="#64748b"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis 
                              allowDecimals={false}
                              stroke="#64748b"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <RechartsTooltip 
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <Bar 
                              dataKey="count" 
                              fill="url(#companyGradient)"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Guest Type Distribution</h3>
                            <p className="text-sm text-gray-600">Attendee category breakdown</p>
                          </div>
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={analytics.top_guest_types || analytics.guest_type_distribution || []}>
                            <defs>
                              <linearGradient id="guestTypeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a21caf" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#a21caf" stopOpacity={0.3}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="type" 
                              stroke="#64748b"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis 
                              allowDecimals={false}
                              stroke="#64748b"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <RechartsTooltip 
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <Bar 
                              dataKey="count" 
                              fill="url(#guestTypeGradient)"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    {/* Pie Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Gender Distribution</h3>
                            <p className="text-sm text-gray-600">Attendee gender breakdown</p>
                          </div>
                          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              data={analytics.gender_distribution || []}
                              dataKey="count"
                              nameKey="gender"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              innerRadius={40}
                              fill="#6366f1"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {(analytics.gender_distribution || []).map((entry, idx) => (
                                <Cell key={`gender-cell-${idx}`} fill={["#6366f1", "#f59e42", "#22c55e", "#f43f5e", "#a21caf"][idx % 5]} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Country Distribution</h3>
                            <p className="text-sm text-gray-600">Geographic representation</p>
                          </div>
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                            <Globe className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              data={analytics.country_distribution || []}
                              dataKey="count"
                              nameKey="country"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              innerRadius={40}
                              fill="#22c55e"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {(analytics.country_distribution || []).map((entry, idx) => (
                                <Cell key={`country-cell-${idx}`} fill={["#22c55e", "#6366f1", "#f59e42", "#f43f5e", "#a21caf"][idx % 5]} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    {/* Attendee Summary Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Attendee Summary</h3>
                          <p className="text-sm text-gray-600">Recent attendee registrations and status</p>
                        </div>
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    
                    {/* Search Results Counter */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-600">
                        {searchTerm || guestTypeFilter !== 'all' || checkedInFilter !== 'all' ? (
                          <>
                            Showing <span className="font-semibold text-gray-900">{filteredAttendees.length}</span> of{' '}
                            <span className="font-semibold text-gray-900">{attendees.length}</span> attendees
                            {searchTerm && (
                              <span className="ml-2 text-gray-500">
                                matching "{searchTerm}"
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="font-semibold text-gray-900">{attendees.length} attendees</span>
                        )}
                      </div>
                      {searchTerm && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchTerm('')}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Clear search
                        </Button>
                      )}
                    </div>
                    
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-gray-200">
                              <TableHead className="font-semibold text-gray-700">Name</TableHead>
                              <TableHead className="font-semibold text-gray-700">Email</TableHead>
                              <TableHead className="font-semibold text-gray-700">Company</TableHead>
                              <TableHead className="font-semibold text-gray-700">Guest Type</TableHead>
                              <TableHead className="font-semibold text-gray-700">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendees.slice(0, 10).map(attendee => (
                              <TableRow key={attendee.id} className="hover:bg-gray-50 transition-colors">
                                <TableCell className="font-medium text-gray-900">{attendee.guest?.name}</TableCell>
                                <TableCell className="text-gray-600">{attendee.guest?.email}</TableCell>
                                <TableCell className="text-gray-600">{attendee.guest?.company}</TableCell>
                                <TableCell>
                                  <Badge className={getGuestTypeBadgeClasses((attendee.guestType || attendee.guest_type)?.name)}>
                                    {(attendee.guestType || attendee.guest_type)?.name || 'General'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {attendee.checked_in ? (
                                    <Badge className="bg-green-100 text-green-700 border-green-200">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Checked In
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Not Checked In
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {attendees.length > 10 && (
                          <div className="text-sm text-gray-500 mt-4 text-center">
                            Showing first 10 attendees of {attendees.length} total
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Session Analytics Section */}
                    {analytics?.session_analytics && analytics.session_analytics.length > 0 && (
                      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gray-50 border-b border-gray-200 p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-gray-600" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Session Analytics</h3>
                                <p className="text-gray-600 text-sm">Click on any session to view checked-in guests</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900">{analytics.session_analytics.length}</div>
                              <div className="text-gray-600 text-sm">Total Sessions</div>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          {/* Summary Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                  <Users className="w-4 h-4 text-white" />
                                </div>
                                <div className="text-sm font-medium text-blue-700">Total Session Attendees</div>
                              </div>
                              <div className="text-xl font-bold text-blue-900">
                                {analytics.session_analytics.reduce((sum: number, session: any) => sum + session.total_attendees, 0)}
                              </div>
                            </div>

                            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                  <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                                <div className="text-sm font-medium text-green-700">Total Checked In</div>
                              </div>
                              <div className="text-xl font-bold text-green-900">
                                {analytics.session_analytics.reduce((sum: number, session: any) => sum + session.checked_in_attendees, 0)}
                              </div>
                            </div>

                            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                                  <TrendingUp className="w-4 h-4 text-white" />
                                </div>
                                <div className="text-sm font-medium text-purple-700">Average Check-in Rate</div>
                              </div>
                              <div className="text-xl font-bold text-purple-900">
                                {Math.round(analytics.session_analytics.reduce((sum: number, session: any) => sum + session.check_in_rate, 0) / analytics.session_analytics.length)}%
                              </div>
                            </div>

                            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                                  <BarChart3 className="w-4 h-4 text-white" />
                                </div>
                                <div className="text-sm font-medium text-orange-700">Capacity Utilization</div>
                              </div>
                              <div className="text-xl font-bold text-orange-900">
                                {Math.round(analytics.session_analytics.reduce((sum: number, session: any) => {
                                  if (session.max_capacity && session.max_capacity > 0) {
                                    return sum + (session.total_attendees / session.max_capacity * 100);
                                  }
                                  return sum;
                                }, 0) / analytics.session_analytics.filter((s: any) => s.max_capacity > 0).length)}%
                              </div>
                            </div>
                          </div>

                          {/* Session Cards */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {analytics.session_analytics.map((session: any, index: number) => {
                              const capacityPercentage = session.max_capacity ? (session.total_attendees / session.max_capacity) * 100 : 0;
                              const checkInPercentage = session.total_attendees > 0 ? (session.checked_in_attendees / session.total_attendees) * 100 : 0;
                              
                              return (
                                <div 
                                  key={session.session_id} 
                                  className="group relative bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
                                  onClick={() => handleSessionClick(session)}
                                >
                                  {/* Status indicator */}
                                  <div className={`absolute top-0 left-0 right-0 h-1 ${
                                    session.status === 'completed' ? 'bg-green-500' :
                                    session.status === 'cancelled' ? 'bg-red-500' :
                                    session.status === 'scheduled' ? 'bg-blue-500' :
                                    'bg-gray-500'
                                  }`}></div>

                                  {/* Card Header */}
                                  <div className="p-5 pb-3">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 text-base mb-1 overflow-hidden text-ellipsis whitespace-nowrap">{session.session_name}</h4>
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge 
                                            className={`text-xs font-medium ${
                                              session.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                              session.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                                              session.status === 'scheduled' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                              'bg-gray-100 text-gray-700 border-gray-200'
                                            }`}
                                          >
                                            {session.status}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs font-medium">
                                            {session.session_type}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 font-semibold text-sm">
                                        {index + 1}
                                      </div>
                                    </div>

                                    {/* Progress Bars */}
                                    <div className="space-y-2">
                                      {/* Check-in Progress */}
                                      <div>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                          <span className="text-gray-600 font-medium">Check-in Rate</span>
                                          <span className="font-semibold text-gray-900">{session.check_in_rate}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                          <div 
                                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${checkInPercentage}%` }}
                                          ></div>
                                        </div>
                                      </div>

                                      {/* Capacity Progress */}
                                      {session.max_capacity && (
                                        <div>
                                          <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="text-gray-600 font-medium">Capacity</span>
                                            <span className="font-semibold text-gray-900">{session.total_attendees}/{session.max_capacity}</span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                              className={`h-2 rounded-full transition-all duration-300 ${
                                                capacityPercentage > 90 ? 'bg-red-500' :
                                                capacityPercentage > 70 ? 'bg-yellow-500' :
                                                'bg-blue-500'
                                              }`}
                                              style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Metrics Grid */}
                                  <div className="px-5 pb-5">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                                        <div className="text-lg font-bold text-blue-900 mb-1">{session.total_attendees}</div>
                                        <div className="text-xs font-medium text-blue-700">Total Attendees</div>
                                      </div>
                                      <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                                        <div className="text-lg font-bold text-green-900 mb-1">{session.checked_in_attendees}</div>
                                        <div className="text-xs font-medium text-green-700">Checked In</div>
                                      </div>
                                    </div>

                                    {/* Session Details */}
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                      {session.location && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                          <MapPin className="w-4 h-4 text-gray-400" />
                                          <span className="truncate">{session.location}</span>
                                        </div>
                                      )}
                                      {session.start_time && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                          <Clock className="w-4 h-4 text-gray-400" />
                                          <span>{new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Click indicator */}
                                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                      <ExternalLink className="w-3 h-3 text-gray-500" />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Empty State */}
                          {analytics.session_analytics.length === 0 && (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-gray-400" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sessions Found</h3>
                              <p className="text-gray-600 max-w-md mx-auto">
                                This event doesn't have any sessions configured yet. Create sessions to track detailed attendance analytics.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                        {/* Share Analytics Section */}
                        <div className="bg-white rounded-xl shadow p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Share2 className="w-5 h-5 text-purple-600" />
                            <div className="font-semibold text-lg">Share Analytics</div>
                            <Badge variant="outline" className="text-xs">Real-time</Badge>
                          </div>
                          
                          {shareAnalyticsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                  <div className="h-8 bg-gray-200 rounded"></div>
                                </div>
                              ))}
                            </div>
                          ) : shareAnalyticsError ? (
                            <div className="text-center py-8">
                              <div className="text-red-600 mb-4">Failed to load share analytics</div>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShareAnalyticsLoading(true)
                                  getRealTimeShareAnalytics(eventId!)
                                    .then((res) => {
                                      console.log('Share Analytics Retry Response:', res.data)
                                      setShareAnalytics(res.data)
                                    })
                                    .catch((err) => {
                                      console.error('Share Analytics Retry Error:', err)
                                      setShareAnalyticsError('Failed to fetch share analytics.')
                                    })
                                    .finally(() => setShareAnalyticsLoading(false))
                                }}
                              >
                                Retry
                              </Button>
                            </div>
                          ) : (
                            <>
                              {/* Key Metrics */}
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                                  <div className="text-xs text-blue-600 mb-1">Total Clicks (24h)</div>
                                  <div className="text-2xl font-bold text-blue-700">
                                    {shareAnalytics?.last_24_hours?.clicks || 0}
                                  </div>
                                  <div className="text-xs text-blue-600 mt-1">
                                    {shareAnalytics?.last_24_hours?.clicks > 0 ? 'Active sharing' : 'No activity'}
                                  </div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                                  <div className="text-xs text-green-600 mb-1">Registrations (24h)</div>
                                  <div className="text-2xl font-bold text-green-700">
                                    {shareAnalytics?.last_24_hours?.registrations || 0}
                                  </div>
                                  <div className="text-xs text-green-600 mt-1">
                                    {shareAnalytics?.last_24_hours?.registrations > 0 ? 'Successful conversions' : 'No registrations'}
                                  </div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                                  <div className="text-xs text-purple-600 mb-1">Conversion Rate</div>
                                  <div className="text-2xl font-bold text-purple-700">
                                    {shareAnalytics?.last_24_hours?.conversion_rate || 0}%
                                  </div>
                                  <div className="text-xs text-purple-600 mt-1">
                                    {shareAnalytics?.last_24_hours?.conversion_rate > 0 ? 'Effective sharing' : 'Needs improvement'}
                                  </div>
                                </div>
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                                  <div className="text-xs text-orange-600 mb-1">Top Platform</div>
                                  <div className="text-lg font-bold text-orange-700">
                                    {shareAnalytics?.top_platforms?.[0]?.platform ? 
                                      shareAnalytics.top_platforms[0].platform.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                                      'N/A'}
                                  </div>
                                  <div className="text-xs text-orange-600 mt-1">
                                    {shareAnalytics?.top_platforms?.[0]?.count || 0} shares
                                  </div>
                                </div>
                              </div>

                              {/* Additional Metrics Row */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
                                  <div className="text-xs text-indigo-600 mb-1">Active Platforms</div>
                                  <div className="text-xl font-bold text-indigo-700">
                                    {shareAnalytics?.top_platforms?.length || 0}
                                  </div>
                                  <div className="text-xs text-indigo-600 mt-1">
                                    Different sharing channels
                                  </div>
                                </div>
                                <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4 border border-teal-200">
                                  <div className="text-xs text-teal-600 mb-1">Peak Hour</div>
                                  <div className="text-xl font-bold text-teal-700">
                                    {shareAnalytics?.hourly_breakdown?.reduce((max: any, hour: any) => 
                                      hour.clicks > max.clicks ? hour : max, { clicks: 0, hour: 'N/A' })?.hour || 'N/A'}
                                  </div>
                                  <div className="text-xs text-teal-600 mt-1">
                                    Highest activity time
                                  </div>
                                </div>
                                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200">
                                  <div className="text-xs text-pink-600 mb-1">Total Activity</div>
                                  <div className="text-xl font-bold text-pink-700">
                                    {(shareAnalytics?.last_24_hours?.clicks || 0) + (shareAnalytics?.last_24_hours?.registrations || 0)}
                                  </div>
                                  <div className="text-xs text-pink-600 mt-1">
                                    Clicks + Registrations
                                  </div>
                                </div>
                              </div>

                              {/* Platform Breakdown */}
                              {shareAnalytics?.top_platforms && shareAnalytics.top_platforms.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                  <div>
                                    <div className="font-semibold mb-3">Platform Performance</div>
                                    <ResponsiveContainer width="100%" height={200}>
                                      <BarChart data={shareAnalytics.top_platforms.map(platform => ({
                                        ...platform,
                                        platform: platform.platform.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                                      }))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="platform" />
                                        <YAxis allowDecimals={false} />
                                        <RechartsTooltip />
                                        <Bar dataKey="count" fill="#8b5cf6" />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                  <div>
                                    <div className="font-semibold mb-3">Platform Distribution</div>
                                    <ResponsiveContainer width="100%" height={200}>
                                      <PieChart>
                                        <Pie
                                          data={shareAnalytics.top_platforms.map(platform => ({
                                            ...platform,
                                            platform: platform.platform.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                                          }))}
                                          dataKey="count"
                                          nameKey="platform"
                                          cx="50%"
                                          cy="50%"
                                          outerRadius={60}
                                          fill="#8b5cf6"
                                          label
                                        >
                                          {shareAnalytics.top_platforms.map((entry, idx) => (
                                            <Cell key={`platform-cell-${idx}`} fill={["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16", "#f97316"][idx % 8]} />
                                          ))}
                                        </Pie>
                                        <RechartsTooltip />
                                      </PieChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              )}

                              {/* Hourly Breakdown */}
                              {shareAnalytics?.hourly_breakdown && shareAnalytics.hourly_breakdown.length > 0 && (
                                <div className="mb-6">
                                  <div className="font-semibold mb-3">Hourly Activity (Last 24 Hours)</div>
                                  <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={shareAnalytics.hourly_breakdown}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="hour" />
                                      <YAxis allowDecimals={false} />
                                      <RechartsTooltip />
                                      <Line type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} name="Clicks" />
                                      <Line type="monotone" dataKey="registrations" stroke="#10b981" strokeWidth={2} name="Registrations" />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              )}

                              {/* Platform Details */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <div className="font-semibold mb-3">Top Sharing Platforms</div>
                                  <div className="space-y-2">
                                    {shareAnalytics?.top_platforms?.slice(0, 5).map((platform: any, index: number) => (
                                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                          <span className="font-medium capitalize">
                                            {platform.platform.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                          </span>
                                        </div>
                                        <div className="text-sm text-gray-600">{platform.count} shares</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-semibold mb-3">Performance Insights</div>
                                  <div className="space-y-3">
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                      <div className="text-sm font-medium text-blue-800">Conversion Rate</div>
                                      <div className="text-lg font-bold text-blue-900">
                                        {shareAnalytics?.last_24_hours?.conversion_rate || 0}%
                                      </div>
                                      <div className="text-xs text-blue-600">
                                        {shareAnalytics?.last_24_hours?.clicks || 0} clicks → {shareAnalytics?.last_24_hours?.registrations || 0} registrations
                                      </div>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg">
                                      <div className="text-sm font-medium text-green-800">Most Active Hour</div>
                                      <div className="text-lg font-bold text-green-900">
                                        {shareAnalytics?.hourly_breakdown?.reduce((max: any, hour: any) => 
                                          hour.clicks > max.clicks ? hour : max, { clicks: 0, hour: 'N/A' })?.hour || 'N/A'}
                                      </div>
                                      <div className="text-xs text-green-600">
                                        Peak sharing activity
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <BarChart3 className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</div>
                        <div className="text-gray-600 text-center max-w-md">
                          Analytics data will appear here once the event has attendees and activity.
                        </div>
                      </div>
                    )}
                  </div>
            </TabsContent>
            <TabsContent value="sessions">
              <div className="min-h-[200px]">
                <EventSessions eventId={Number(eventId)} />
              </div>
            </TabsContent>
            <TabsContent value="invitations">
              <InvitationsTab
                eventId={Number(eventId)}
                eventUuid={eventData?.uuid || ''}
                eventName={eventData?.name || ''}
                eventType={eventData?.event_type as 'free' | 'ticketed' || 'free'}
                isOrganizer={user?.role === 'organizer' || user?.role === 'admin' || user?.role === 'superadmin'}
              />
            </TabsContent>
            {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'organizer') && (
            <TabsContent value="bulk-badges">
              <BulkBadgesTab 
                eventId={Number(eventId)}
                guestTypes={guestTypes || []}
                eventName={eventData?.name}
              />
            </TabsContent>
            )}
                {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'organizer') && (
            <TabsContent value="badge-designer">
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                      <div className="max-w-2xl text-center">
                        <Palette className="w-16 h-16 mx-auto mb-6 text-blue-600" />
                        <h2 className="text-2xl font-bold mb-4">Badge Designer</h2>
                        <p className="text-gray-600 mb-8">
                          The Badge Designer is now a standalone application with enhanced features including 
                          Fabric.js canvas editing, dynamic fields, QR codes, and more.
                        </p>
                        <Button 
                          size="lg"
                          onClick={() => navigate(`/badge-designer/templates/${eventId}`)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Palette className="w-5 h-5 mr-2" />
                          Open Badge Designer
                        </Button>
                      </div>
                    </div>
            </TabsContent>
                )}
        </Tabs>

          {/* Edit Event Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <style>{customRangeStyles}</style>
            <DialogContent className="max-w-6xl w-full h-[95vh] flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
              <DialogHeader className="flex-shrink-0 bg-white rounded-t-xl p-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Edit className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      Edit Event
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 mt-1">
                      Update your event details and configuration
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              {editForm && (
                <form onSubmit={handleEditEvent} className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-5xl mx-auto space-y-8">
                  {/* Event Information */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <Tag className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Event Information
                        </h3>
                        <p className="text-gray-500 text-sm">
                          Basic event details and logistics
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="edit_name" className="flex items-center gap-2 text-gray-700 font-medium">
                          <Tag className="w-4 h-4 text-blue-500" /> Event Name
                        </Label>
                        <Input
                          id="edit_name"
                          value={editForm.name}
                          onChange={(e) => handleEditInput('name', e.target.value)}
                          placeholder="Enter event name"
                          required
                          className="mt-2 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit_location" className="flex items-center gap-2 text-gray-700 font-medium">
                          <MapPin className="w-4 h-4 text-green-500" /> Location
                        </Label>
                        <Input
                          id="edit_location"
                          value={editForm.location}
                          onChange={(e) => handleEditInput('location', e.target.value)}
                          placeholder="e.g. Grand Convention Center"
                          className="mt-2 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-xl"
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <Label htmlFor="edit_description" className="flex items-center gap-2 text-gray-700 font-medium">
                          <FileText className="w-4 h-4 text-purple-500" /> Description
                        </Label>
                        <Textarea
                          id="edit_description"
                          value={editForm.description}
                          onChange={(e) => handleEditInput('description', e.target.value)}
                          placeholder="Describe your event..."
                          rows={4}
                          className="mt-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-xl resize-none"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit_event_type_id" className="flex items-center gap-2 text-gray-700 font-medium">
                          <Tag className="w-4 h-4 text-orange-500" /> Event Type
                        </Label>
                        <Select
                          value={editForm.event_type_id}
                          onValueChange={(value) => handleEditInput('event_type_id', value)}
                          disabled={editLoadingStates.eventTypes}
                          required
                        >
                          <SelectTrigger className="mt-2 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-xl" id="edit_event_type_id">
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
                          <div className="text-xs text-red-500 mt-2">
                            {editErrors.eventTypes}
                          </div>
                        )}
                      </div>
                                            <div>
                        <Label htmlFor="edit_event_category_id" className="flex items-center gap-2 text-gray-700 font-medium">
                          <Tag className="w-4 h-4 text-indigo-500" /> Event Category
                        </Label>
                        <Select
                          value={editForm.event_category_id}
                          onValueChange={(value) => handleEditInput('event_category_id', value)}
                          disabled={editLoadingStates.eventCategories}
                          required
                        >
                          <SelectTrigger className="mt-2 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl" id="edit_event_category_id">
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
                          <div className="text-xs text-red-500 mt-2">
                            {editErrors.eventCategories}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Event Configuration Section */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Event Configuration
                        </h3>
                        <p className="text-gray-500 text-sm">
                          Capacity, guest types, and event image
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="edit_max_guests" className="flex items-center gap-2 text-gray-700 font-medium">
                          <Users className="w-4 h-4 text-teal-500" /> Max Guests
                        </Label>
                        <Input
                          id="edit_max_guests"
                          type="number"
                          value={editForm.max_guests}
                          onChange={(e) => handleEditInput('max_guests', e.target.value)}
                          placeholder="e.g. 500"
                          className="mt-2 h-12 border-gray-300 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <Label htmlFor="edit_guest_types" className="flex items-center gap-2 text-gray-700 font-medium">
                          <Users className="w-4 h-4 text-pink-500" /> Guest Types
                        </Label>
                                            <div className="flex flex-wrap gap-2 mb-3 mt-2">
                          {PREDEFINED_GUEST_TYPES.map(type => {
                            const isSelected = Array.isArray(editForm.guest_types)
                              ? editForm.guest_types.includes(type)
                              : (editForm.guest_types || '').split(',').map((s: string) => s.trim()).includes(type);
                            return (
                              <Button
                                key={type}
                                type="button"
                                variant={isSelected ? 'default' : 'outline'}
                                className={`${isSelected ? 'bg-pink-600 text-white border-pink-600' : 'border-gray-300 hover:border-pink-300'} rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200`}
                                onClick={() => {
                                  let current = Array.isArray(editForm.guest_types)
                                    ? editForm.guest_types
                                    : (editForm.guest_types || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                                  if (current.includes(type)) {
                                    current = current.filter((t: string) => t !== type);
                                  } else {
                                    current = [...current, type];
                                  }
                                  handleEditInput('guest_types', current);
                                }}
                              >
                                {type}
                              </Button>
                            );
                          })}
                        </div>
                        <Input
                          id="edit_guest_types_custom"
                          value={Array.isArray(editForm.guest_types) ? editForm.guest_types.filter((t: string) => !PREDEFINED_GUEST_TYPES.includes(t)).join(', ') : ''}
                          onChange={e => {
                            let custom = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                            let current = Array.isArray(editForm.guest_types)
                              ? editForm.guest_types.filter((t: string) => PREDEFINED_GUEST_TYPES.includes(t))
                              : (editForm.guest_types || '').split(',').map((s: string) => s.trim()).filter(t => PREDEFINED_GUEST_TYPES.includes(t));
                            handleEditInput('guest_types', [...current, ...custom]);
                          }}
                          placeholder="Add custom guest types, comma separated"
                          className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 rounded-xl"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Select from predefined or add custom guest types
                        </p>
                        
                        {/* Current Guest Types Display */}
                        {Array.isArray(editForm.guest_types) && editForm.guest_types.length > 0 && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200">
                            <h4 className="text-sm font-semibold text-pink-800 mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Currently Selected Guest Types
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {editForm.guest_types.map((gt: any, index: number) => {
                                const guestTypeName = typeof gt === 'object' && gt !== null && gt.name ? gt.name : String(gt);
                                return (
                                  <Badge key={index} variant="secondary" className="text-xs bg-pink-100 text-pink-800 border-pink-300">
                                    {guestTypeName}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Event Image Section */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <Image className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Event Image
                        </h3>
                        <p className="text-gray-500 text-sm">
                          Upload your event banner or promotional image
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        id="edit_event_image"
                        ref={editImageInputRef}
                        accept="image/*"
                        onChange={handleEditFile}
                        className="hidden"
                      />
                      <label htmlFor="edit_event_image" className="inline-block">
                        <div className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl cursor-pointer border border-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-sm">
                          Choose File
                        </div>
                      </label>
                      <span className="text-gray-600 text-sm">
                        {editForm.event_image instanceof File
                          ? editForm.event_image.name
                          : editForm.event_image
                          ? 'Current image'
                          : 'No file chosen'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Upload your event banner (PNG, JPG, SVG) - Max 2MB
                    </p>
                    {editImagePreview && (
                      <div className="mt-4 relative inline-block">
                        <img
                          src={editImagePreview}
                          alt="Event image preview"
                          className="h-32 rounded-xl shadow-lg border border-gray-200"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 rounded-full h-8 w-8 shadow-lg"
                          onClick={handleRemoveEditImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Additional Information Section */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Additional Information
                        </h3>
                        <p className="text-gray-500 text-sm">
                          Requirements, agenda, and additional details
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <Label htmlFor="edit_requirements" className="flex items-center gap-2 text-gray-700 font-medium">
                          <FileText className="w-4 h-4 text-amber-500" /> Requirements & Prerequisites
                        </Label>
                        <Textarea
                          id="edit_requirements"
                          value={editForm.requirements || ''}
                          onChange={(e) => handleEditInput('requirements', e.target.value)}
                          placeholder="Any requirements or prerequisites for attendees..."
                          rows={3}
                          className="mt-2 border-gray-300 focus:border-amber-500 focus:ring-amber-500 rounded-xl resize-none"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit_agenda" className="flex items-center gap-2 text-gray-700 font-medium">
                          <FileText className="w-4 h-4 text-amber-500" /> Event Agenda
                        </Label>
                        <Textarea
                          id="edit_agenda"
                          value={editForm.agenda || ''}
                          onChange={(e) => handleEditInput('agenda', e.target.value)}
                          placeholder="Detailed event schedule and agenda..."
                          rows={4}
                          className="mt-2 border-gray-300 focus:border-amber-500 focus:ring-amber-500 rounded-xl resize-none"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Event & Registration Dates Section */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Event & Registration Dates
                        </h3>
                        <p className="text-gray-500 text-sm">
                          Set event and registration periods
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <Label className="flex items-center gap-2 text-gray-700 font-medium">
                          <Calendar className="w-4 h-4 text-violet-500" /> Event Date Range
                        </Label>
                        <Button
                          type="button"
                          className="w-full mt-2 h-12 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 hover:from-violet-200 hover:to-purple-200 border border-violet-300 rounded-xl font-medium"
                          onClick={() => setShowEditEventRange(true)}
                        >
                          {editForm.start_date && editForm.end_date
                            ? `${editEventRange[0].startDate.toLocaleDateString()} - ${editEventRange[0].endDate.toLocaleDateString()}`
                            : 'Select event date range'}
                        </Button>
                        {showEditEventRange && (
                          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
                            <div className="bg-white border rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
                              <DateRange
                                ranges={editEventRange}
                                onChange={(item) => setEditEventRange([item.selection])}
                                editableDateInputs
                                moveRangeOnFirstSelection={false}
                                direction="horizontal"
                              />
                              <div className="flex justify-end gap-3 mt-6">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setShowEditEventRange(false)}
                                  className="rounded-xl px-6"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl px-6"
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
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="flex items-center gap-2 text-gray-700 font-medium">
                          <Calendar className="w-4 h-4 text-emerald-500" /> Registration Date Range
                        </Label>
                        <Button
                          type="button"
                          className="w-full mt-2 h-12 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 hover:from-emerald-200 hover:to-green-200 border border-emerald-300 rounded-xl font-medium"
                          onClick={() => setShowEditRegRange(true)}
                        >
                          {editForm.registration_start_date && editForm.registration_end_date
                            ? `${editRegRange[0].startDate.toLocaleDateString()} - ${editRegRange[0].endDate.toLocaleDateString()}`
                            : 'Select registration date range'}
                        </Button>
                        {showEditRegRange && (
                          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
                            <div className="bg-white border rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
                              <DateRange
                                ranges={editRegRange}
                                onChange={(item) => setEditRegRange([item.selection])}
                                editableDateInputs
                                moveRangeOnFirstSelection={false}
                                direction="horizontal"
                              />
                              <div className="flex justify-end gap-3 mt-6">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setShowEditRegRange(false)}
                                  className="rounded-xl px-6"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl px-6"
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
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Current Guest Types Display in Event & Registration Dates Section */}
                    {Array.isArray(editForm.guest_types) && editForm.guest_types.length > 0 && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Current Guest Types for This Event
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {editForm.guest_types.map((gt: any, index: number) => {
                            const guestTypeName = typeof gt === 'object' && gt !== null && gt.name ? gt.name : String(gt);
                            return (
                              <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                                {guestTypeName}
                              </Badge>
                            );
                          })}
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                          These guest types are currently configured for this event. You can modify them in the Guest Types section above.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditDialogOpen(false)}
                        className="px-8 py-3 rounded-xl border-gray-300 hover:border-gray-400 font-medium"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={editLoading}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {editLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating Event...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Update Event
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
            </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Create Participant Dialog */}
          <Dialog
            open={createParticipantDialogOpen}
            onOpenChange={setCreateParticipantDialogOpen}
          >
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Participants</DialogTitle>
                <DialogDescription>
                  Create participant attendees with the name "PARTICIPANT". These will be accessible in the bulk badges tab for assignment and printing.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="participant_count">Number of Participants</Label>
                  <Input
                    id="participant_count"
                    type="number"
                    min="1"
                    max="100"
                    value={participantCount}
                    onChange={(e) => setParticipantCount(parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the number of participants to create (1-100)
                  </p>
                </div>
                
                {guestTypes && guestTypes.length > 0 && (
                  <div>
                    <Label htmlFor="participant_guest_type">Guest Type</Label>
                    <Select
                      value={addAttendeeForm.guest_type_id || ''}
                      onValueChange={(value) => handleAddAttendeeInput('guest_type_id', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a guest type" />
                      </SelectTrigger>
                      <SelectContent>
                        {guestTypes
                          .filter((type) => type.id !== undefined && type.id !== null && type.id !== '')
                          .map((type) => (
                            <SelectItem key={type.id} value={String(type.id)}>
                              {type.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      Select the guest type for all participants
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateParticipantDialogOpen(false)
                    setParticipantCount(1)
                  }}
                  disabled={addAttendeeLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  onClick={handleCreateParticipant}
                  disabled={addAttendeeLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {addAttendeeLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      Creating...
                    </>
                  ) : (
                    'Create Participants'
                  )}
                </Button>
              </DialogFooter>
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
                    {eventData?.event_type === 'ticketed' ? (
                      <>
                        <Label htmlFor="ticket_type_id">Ticket Type</Label>
                        <Select
                          onValueChange={(value) =>
                            handleAddAttendeeInput('ticket_type_id', value)
                          }
                          value={addAttendeeForm.ticket_type_id || ''}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a ticket type" />
                          </SelectTrigger>
                          <SelectContent>
                            {ticketTypes
                              .filter(
                                (type) =>
                                  type.id !== undefined &&
                                  type.id !== null &&
                                  type.id !== ''
                              )
                              .map((type) => (
                                <SelectItem key={type.id} value={String(type.id)}>
                                  {type.name} - ETB {parseFloat(type.price).toLocaleString()}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
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
                      {eventData?.event_type === 'ticketed' ? (
                        <>
                          <Label htmlFor="edit_attendee_ticket_type">Ticket Type</Label>
                          <Select
                            value={editAttendeeForm.ticket_type_id || ''}
                            onValueChange={(value) => handleEditAttendeeInput('ticket_type_id', value)}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a ticket type" />
                            </SelectTrigger>
                            <SelectContent>
                              {ticketTypes
                                .filter(
                                  (type) =>
                                    type.id !== undefined &&
                                    type.id !== null &&
                                    type.id !== ''
                                )
                                .map((type) => (
                                  <SelectItem key={type.id} value={String(type.id)}>
                                    {type.name} - ETB {parseFloat(type.price).toLocaleString()}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
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



            {/* CSV Upload Dialog */}
            <Dialog open={csvUploadDialogOpen} onOpenChange={setCsvUploadDialogOpen}>
              <DialogContent
                className="w-full max-w-5xl min-w-[900px] p-0 overflow-visible rounded-2xl shadow-2xl border-0 bg-gradient-to-br from-white via-gray-50 to-gray-100"
                style={{ width: '1100px', maxWidth: '99vw' }}
              >
                <div className="px-12 pt-10 pb-6 border-b bg-gradient-to-r from-white to-gray-50">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                        <Download className="w-5 h-5" />
                      </span>
                      Import Attendees from CSV
                    </DialogTitle>
                    <DialogDescription className="text-base text-gray-500 mt-2">
                      Upload a CSV file with columns: <span className="font-medium text-gray-700">name</span>, <span className="font-medium text-gray-700">email</span>, <span className="font-medium text-gray-700">guest_type_name</span> (or <span className="font-medium text-gray-700">guest_type_id</span>). Extra columns are accepted.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                {/* Step: Upload */}
                {csvUploadStep === 'upload' && (
                  <div className="p-12 space-y-10 bg-gradient-to-br from-white via-gray-50 to-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                      <div className="md:col-span-2 flex flex-col justify-center">
                        <label className="block">
                          <div className="w-full border-2 border-dashed border-blue-200 rounded-2xl p-12 text-center bg-white hover:bg-blue-50 transition cursor-pointer flex flex-col items-center gap-2 shadow-sm">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-2">
                              <Download className="w-6 h-6 text-blue-500" />
                            </div>
                            <div className="font-semibold text-lg text-blue-700 mb-1">Select CSV file</div>
                            <div className="text-sm text-gray-500">Drag &amp; drop or click to choose</div>
                          </div>
                          <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              setCsvUploadStep('importing')
                              setCsvUploadErrors([])
                              setCsvUploadData([])
                              setCsvUploadSuccess([])
                              setCsvUploadWarnings([])
                              Papa.parse(file, {
                                header: true,
                                skipEmptyLines: true,
                                complete: (results) => {
                                  if (!results.data || results.data.length === 0) {
                                    setCsvUploadErrors(['CSV file is empty or contains no valid data.'])
                                    setCsvUploadStep('upload')
                                    return
                                  }
                                  const rawHeaders = (results.meta.fields || []) as string[]
                                  const headerMap: Record<string, string> = {}
                                  rawHeaders.forEach((h) => {
                                    const norm = String(h)
                                      .trim()
                                      .toLowerCase()
                                      .replace(/\s+/g, '_')
                                      .replace(/[^a-z0-9_]/g, '')
                                    let mapped = norm
                                    if (mapped === 'guesttype' || mapped === 'type' || mapped === 'guest_type') mapped = 'guest_type_name'
                                    if (mapped === 'job' || mapped === 'title' || mapped === 'job_title') mapped = 'jobtitle'
                                    headerMap[h] = mapped
                                  })
                                  const normalizedRows = (results.data as any[]).map((row) => {
                                    const pairs = Object.entries(row).map(([k, v]) => {
                                      const key = headerMap[k as string] || String(k).trim().toLowerCase()
                                      const val = typeof v === 'string' ? v.trim() : v
                                      return [key, val]
                                    })
                                    return Object.fromEntries(pairs)
                                  })
                                  setCsvUploadData(normalizedRows)
                                  setCsvUploadStep('review')
                                },
                                error: (error) => {
                                  setCsvUploadErrors([`Failed to parse CSV: ${error.message}`])
                                  setCsvUploadStep('upload')
                                },
                              })
                            }}
                          />
                        </label>
                      </div>
                      <div className="md:col-span-1">
                        <div className="h-full bg-gray-50 rounded-xl border p-4">
                          <div className="text-sm font-medium mb-2">Tips</div>
                          <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                            <li>Required: name, email, guest_type_name or guest_type_id</li>
                            <li>Guest types are case-insensitive</li>
                            <li>Extra columns are ignored</li>
                          </ul>
                          <Button variant="outline" className="w-full mt-3" onClick={downloadSampleCSV}>
                            <Download className="mr-2 h-4 w-4" /> Sample CSV
                          </Button>
                        </div>
                      </div>
                    </div>

                    {csvUploadErrors.length > 0 && (
                      <div className="rounded-md border border-red-200 bg-red-50 text-red-700 text-sm p-3">
                        {csvUploadErrors.map((err, i) => (
                          <div key={i}>{err}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {csvUploadStep === 'review' && (
                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-gray-500">Rows</div>
                        <div className="text-lg font-semibold">{csvUploadData.length}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-gray-500">Guest Types</div>
                        <div className="text-xs text-gray-700 truncate">
                          {guestTypes.map((gt: any) => gt.name).join(', ') || '—'}
                        </div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-gray-500">Issues</div>
                        <div className="text-lg font-semibold">{csvUploadErrors.length}</div>
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-72 border rounded">
                      <table className="min-w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            {Object.keys(csvUploadData[0] || {}).map((h) => (
                              <th key={h} className="border px-2 py-1 text-left">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvUploadData.slice(0, 15).map((row, idx) => (
                            <tr key={idx}>
                              {Object.keys(csvUploadData[0] || {}).map((h) => (
                                <td key={h} className="border px-2 py-1">{row[h]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {csvUploadErrors.length > 0 && (
                      <div className="rounded-md border border-red-200 bg-red-50 text-red-700 text-xs p-3">
                        {csvUploadErrors.map((err, i) => (
                          <div key={i}>{String(err)}</div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setCsvUploadStep('upload')}>Back</Button>
                      <Button
                        onClick={async () => {
                          setCsvUploadStep('importing')
                          try {
                            // Build a robust guest type map (supports objects or strings). Fallback to API with IDs.
                            let mapSource: any[] = []
                            if (Array.isArray(guestTypes) && guestTypes.length > 0) {
                              mapSource = guestTypes
                            }
                            // If we don't have objects with id, fetch from API
                            if (!mapSource.length || (typeof mapSource[0] !== 'object') || (mapSource[0] && mapSource[0].id == null)) {
                              try {
                                const res = await api.get(`/events/${Number(eventId)}/guest-types`)
                                if (Array.isArray(res.data) && res.data.length > 0) {
                                  mapSource = res.data
                                }
                              } catch (e) {
                                // ignore; we'll try to map using available data
                              }
                            }
                            const guestTypeMap = new Map<string, string>()
                            mapSource.forEach((gt: any) => {
                              if (gt == null) return
                              if (typeof gt === 'object') {
                                const name = String(gt.name ?? gt.title ?? '').toLowerCase().trim()
                                const id = gt.id != null ? String(gt.id) : ''
                                if (name && id) guestTypeMap.set(name, id)
                              } else {
                                const name = String(gt).toLowerCase().trim()
                                // no id available; will not add mapping
                              }
                            })
                            const attendeesToImport = csvUploadData.map((row: any) => {
                              const name = row.name?.trim() || `${(row.first_name || '').toString().trim()} ${(row.last_name || '').toString().trim()}`.trim()
                              const email = row.email?.trim()
                              const phone = row.phone?.trim() || null
                              const company = row.company?.trim() || null
                              const jobtitle = row.jobtitle?.trim() || null
                              const gender = row.gender?.trim() || null
                              const country = row.country?.trim() || null
                              const explicitGuestTypeId = row.guest_type_id ? String(row.guest_type_id).trim() : ''
                              const guestTypeName = row.guest_type_name ? String(row.guest_type_name).toLowerCase().trim() : ''
                              const mappedGuestTypeId = explicitGuestTypeId || (guestTypeName ? (guestTypeMap.get(guestTypeName) || '') : '')
                              return { name, email, phone, company, jobtitle, gender, country, guest_type_id: mappedGuestTypeId }
                            })
                            const invalidRows = attendeesToImport.filter((a: any) => {
                              const emailOk = !!a.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(a.email))
                              const phoneStr = (a.phone || '').toString().replace(/\s|-/g, '')
                              const phoneOk = !!phoneStr && /^\+?[0-9]{7,15}$/.test(phoneStr)
                              return !(a.guest_type_id && a.name && emailOk && phoneOk)
                            })
                            if (invalidRows.length > 0) {
                              setCsvUploadErrors(['Some rows have invalid data. Make sure all rows have name, email, phone, and a valid guest type.'])
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
                        disabled={csvUploadData.length === 0}
                      >
                        Import
                      </Button>
                    </div>
                  </div>
                )}

                {csvUploadStep === 'importing' && (
                  <div className="p-8 text-center">
                    <div className="mx-auto mb-3 w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <div className="text-sm text-gray-600">Importing attendees...</div>
                  </div>
                )}

                {csvUploadStep === 'complete' && (
                  <div className="p-10 space-y-6 bg-gradient-to-br from-white via-gray-50 to-gray-100">
                    {csvUploadSuccess.length > 0 && (
                      <div className="rounded-xl border border-green-200 bg-green-50 text-green-800 p-4">
                        <div className="font-semibold mb-1">
                          {csvUploadSuccess.length} attendees imported successfully
                        </div>
                        <div className="text-xs text-green-700">Your attendee list has been updated.</div>
                      </div>
                    )}

                    {csvUploadWarnings.length > 0 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-semibold text-amber-900">
                            {csvUploadWarnings.length} attendees failed to import
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Download a CSV of failed rows with reasons
                                const rows = csvUploadWarnings.map((w: any) => ({ email: w.email, error: w.error }))
                                const csv = Papa.unparse(rows)
                                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                                const a = document.createElement('a')
                                const url = URL.createObjectURL(blob)
                                a.href = url
                                a.download = 'failed_attendees.csv'
                                a.click()
                                URL.revokeObjectURL(url)
                              }}
                            >
                              Download Errors
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCsvUploadStep('upload')}
                            >
                              Try Again
                            </Button>
                          </div>
                        </div>
                        <div className="max-h-64 overflow-auto rounded border bg-white">
                          <table className="min-w-full text-xs">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="border px-2 py-1 text-left">Email</th>
                                <th className="border px-2 py-1 text-left">Reason</th>
                              </tr>
                            </thead>
                            <tbody>
                              {csvUploadWarnings.map((w: any, i: number) => (
                                <tr key={i} className="odd:bg-white even:bg-gray-50">
                                  <td className="border px-2 py-1 font-medium text-gray-800">{w.email}</td>
                                  <td className="border px-2 py-1 text-gray-700">{w.error}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="text-xs text-amber-800 mt-2">
                          Tip: Ensure guest_type_name matches an event guest type or include guest_type_id.
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3">
                      <Button onClick={() => setCsvUploadDialogOpen(false)} className="">Close</Button>
                      <Button variant="outline" onClick={() => setCsvUploadStep('upload')}>Import Another</Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <UsherAssignmentDialog
              eventId={Number(eventId)}
              eventName={eventData?.name || ''}
              open={isAssignUsherDialogOpen}
              onOpenChange={setIsAssignUsherDialogOpen}
              onSuccess={async () => {
                setIsAssignUsherDialogOpen(false)
                // Refresh the event ushers list
                try {
                  const res = await getEventUshers(Number(eventId))
                  console.log('Refreshed event ushers:', res.data)
                  setEventUshers(res.data)
                } catch (err) {
                  console.error('Failed to refresh event ushers:', err)
                }
              }}
            />

            {/* Remove Attendee/Member Confirmation Dialog */}
            <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {removeMember?.guest ? 'Remove Attendee' : 'Remove Team Member'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {removeMember?.guest 
                      ? `Are you sure you want to remove ${removeMember?.guest?.name || 'this attendee'} from the event? This action cannot be undone.`
                      : `Are you sure you want to remove ${removeMember?.name || 'this team member'}? This action cannot be undone.`
                    }
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={removeLoading}>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleRemoveConfirm} 
                    disabled={removeLoading} 
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {removeLoading ? 'Removing...' : (removeMember?.guest ? 'Remove Attendee' : 'Remove Member')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Add a hidden badge area for PDF generation */}
            <div
              ref={pdfBadgeRef}
              style={{ position: 'fixed', left: '-9999px', top: 0, width: 320, height: 480, zIndex: -2, background: 'white' }}
            >
              {singlePrintAttendee && (
        <>
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #single-badge-print-area, #single-badge-print-area * { visibility: visible !important; }
              #single-badge-print-area { 
                position: absolute !important; 
                left: 0 !important; 
                top: 0 !important; 
                width: 100vw !important; 
                height: 100vh !important; 
                background: white !important; 
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                z-index: 9999 !important;
              }
            }
          `}</style>
          <div id="single-badge-print-area" ref={singleBadgePrintRef}>
            <BadgePrint 
              attendee={{
                ...singlePrintAttendee,
                guest: {
                  ...singlePrintAttendee?.guest,
                  // Ensure we use the latest guest data with complete information
                  name: singlePrintAttendee?.guest?.name || 'Participant',
                  company: singlePrintAttendee?.guest?.company || '',
                  jobtitle: singlePrintAttendee?.guest?.jobtitle || '',
                  email: singlePrintAttendee?.guest?.email || '',
                  phone: singlePrintAttendee?.guest?.phone || '',
                  country: singlePrintAttendee?.guest?.country || '',
                  uuid: singlePrintAttendee?.guest?.uuid || '',
                },
                // Include attendee ID for the badge
                id: singlePrintAttendee?.id,
              }} 
            />
          </div>
        </>
      )}
            </div>
          </>
        )}

        {/* Session Guests Dialog */}
        <Dialog open={sessionGuestsDialogOpen} onOpenChange={setSessionGuestsDialogOpen}>
          <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    Checked-in Guests - {selectedSession?.session_name}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    View and export checked-in guests for this session
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Total Checked-in</div>
                    <div className="text-2xl font-bold text-green-600">{sessionGuests.length}</div>
                  </div>
                  <Button 
                    onClick={exportSessionGuests}
                    disabled={sessionGuests.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-hidden">
              {sessionGuestsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-gray-600">Loading session guests...</div>
                  </div>
                </div>
              ) : sessionGuests.length > 0 ? (
                <div className="h-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Phone</TableHead>
                        <TableHead className="font-semibold">Company</TableHead>
                        <TableHead className="font-semibold">Job Title</TableHead>
                        <TableHead className="font-semibold">Guest Type</TableHead>
                        <TableHead className="font-semibold">Check-in Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionGuests.map((guest, index) => (
                        <TableRow key={guest.id || index} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{guest.name || 'N/A'}</TableCell>
                          <TableCell className="text-gray-600">{guest.email || 'N/A'}</TableCell>
                          <TableCell className="text-gray-600">{guest.phone || 'N/A'}</TableCell>
                          <TableCell className="text-gray-600">{guest.company || 'N/A'}</TableCell>
                          <TableCell className="text-gray-600">{guest.jobtitle || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={getGuestTypeBadgeClasses(guest.guest_type)}>
                              {guest.guest_type || 'General'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {guest.check_in_time ? new Date(guest.check_in_time).toLocaleString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Checked-in Guests</h3>
                    <p className="text-gray-600">
                      No guests have checked in for this session yet.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-shrink-0 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-gray-600">
                  Showing {sessionGuests.length} checked-in guests
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSessionGuestsDialogOpen(false)}>
                    Close
                  </Button>
                  <Button 
                    onClick={exportSessionGuests}
                    disabled={sessionGuests.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
