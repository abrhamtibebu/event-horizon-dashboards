import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Breadcrumbs from '@/components/Breadcrumbs'
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  Eye,
  UserCheck,
  AlertTriangle,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ModernDeleteConfirmationDialog } from '@/components/ui/ModernConfirmationDialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { showSuccessToast, showErrorToast } from '@/components/ui/ModernToast'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/use-auth'
import { usePermissionCheck } from '@/hooks/use-permission-check'
import { ProtectedButton } from '@/components/ProtectedButton'
import { UsherAssignmentDialog } from '@/components/UsherAssignmentDialog'
import api, {
  getUshers,
  getEventUshers,
  getAvailableUshersForEvent,
  assignUshersToEvent,
  updateUsherTasks,
  getMyEvents,
  getAllOrganizers,
  getUsherRegistrations,
  exportUsherRegistrations,
  updateUsherRegistrationStatus,
  deleteUsherRegistration,
} from '@/lib/api'
import { format, parseISO } from 'date-fns'

export default function UsherManagement() {
  const { eventId } = useParams()
  const { user } = useAuth()
  const { checkPermission } = usePermissionCheck()
  const [loading, setLoading] = useState(true)
  const [ushers, setUshers] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [eventUshers, setEventUshers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedUsher, setSelectedUsher] = useState<any>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingTasks, setEditingTasks] = useState('')
  const [updating, setUpdating] = useState(false)
  const [usherTaskStatuses, setUsherTaskStatuses] = useState<any[]>([])
  const [usherAvailability, setUsherAvailability] = useState<any[]>([])
  const [showUsherDetails, setShowUsherDetails] = useState(false)
  const [selectedUsherDetails, setSelectedUsherDetails] = useState<any>(null)
  const [stats, setStats] = useState({
    totalUshers: 0,
    assignedUshers: 0,
    availableUshers: 0,
    completedTasks: 0,
    totalTasks: 0
  })
  const [selectedUshersForBulk, setSelectedUshersForBulk] = useState<Set<number>>(new Set())
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false)
  const [bulkTasks, setBulkTasks] = useState('')
  const [bulkAssigning, setBulkAssigning] = useState(false)
  const [currentEventDate, setCurrentEventDate] = useState<string>('')
  const [registeredUshers, setRegisteredUshers] = useState<any[]>([])
  const [exporting, setExporting] = useState(false)
  const [registrationSearchTerm, setRegistrationSearchTerm] = useState('')
  const [registrationStatusFilter, setRegistrationStatusFilter] = useState('all')
  const [registrationPaymentFilter, setRegistrationPaymentFilter] = useState('all')
  const [selectedRegistrations, setSelectedRegistrations] = useState<Set<number>>(new Set())
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<string>('approved')
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [viewRegistrationDialogOpen, setViewRegistrationDialogOpen] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null)
  const [deleteRegistrationDialogOpen, setDeleteRegistrationDialogOpen] = useState(false)
  const [registrationToDelete, setRegistrationToDelete] = useState<number | null>(null)
  const [deletingRegistration, setDeletingRegistration] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      console.log('Selected event changed to:', selectedEvent, 'loading event ushers...')
      loadEventUshers(selectedEvent)
      loadUsherTaskStatuses(selectedEvent)
      loadRegisteredUshers(Number(selectedEvent))
      // Get the current event's date for availability checking
      if (Array.isArray(events)) {
        const event = events.find(e => e.id.toString() === selectedEvent)
        if (event?.start_date) {
          setCurrentEventDate(new Date(event.start_date).toISOString().split('T')[0])
        }
      }
    }
  }, [selectedEvent, events])

  useEffect(() => {
    loadUsherAvailability()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [ushers, eventUshers, usherTaskStatuses])

  // Debug logging for usher details
  useEffect(() => {
    if (selectedUsherDetails) {
      console.log('Checking assignments for usher', selectedUsherDetails.id, 'eventUshers:', eventUshers)
    }
  }, [selectedUsherDetails, eventUshers])

  const loadData = async () => {
    setLoading(true)
    try {
      console.log('Current user:', user)
      
      let ushersRes, eventsRes
      
      try {
        // Always fetch all ushers, regardless of role
        ushersRes = await getUshers()
        console.log('Ushers loaded:', ushersRes.data)
      } catch (error) {
        console.error('Failed to load ushers:', error)
        toast.error('Failed to load ushers. Please check your permissions.')
        ushersRes = { data: [] }
      }

      try {
        if (user?.role === 'admin' || user?.role === 'superadmin') {
          eventsRes = await getAllOrganizers()
        } else {
          eventsRes = await getMyEvents()
        }
        console.log('Events loaded:', eventsRes.data)
      } catch (error) {
        console.error('Failed to load events:', error)
        toast.error('Failed to load events. Please check your permissions.')
        eventsRes = { data: [] }
      }

      setUshers(ushersRes.data || [])
      // Handle paginated response structure (data.data) or direct array (data)
      const eventsData = Array.isArray(eventsRes.data) 
        ? eventsRes.data 
        : (eventsRes.data?.data || [])
      setEvents(eventsData)

      if (eventId) {
        setSelectedEvent(eventId)
      } else if (eventsData && eventsData.length > 0) {
        setSelectedEvent(eventsData[0].id.toString())
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load usher management data')
    } finally {
      setLoading(false)
    }
  }

  const loadEventUshers = async (eventId: string) => {
    try {
      const response = await getEventUshers(Number(eventId))
      console.log('Event ushers loaded for event', eventId, ':', response.data)
      setEventUshers(response.data)
    } catch (error) {
      console.error('Failed to load event ushers for event', eventId, ':', error)
      toast.error('Failed to load event ushers')
      setEventUshers([])
    }
  }

  const loadRegisteredUshers = async (eventIdNum: number) => {
    try {
      const res = await getUsherRegistrations(eventIdNum)
      setRegisteredUshers(Array.isArray(res.data) ? res.data : (res.data?.data ?? []))
    } catch (e) {
      setRegisteredUshers([])
    }
  }

  const handleUpdateRegistrationStatus = async (registrationId: number, status: string) => {
    if (!selectedEvent) return
    
    try {
      await updateUsherRegistrationStatus(Number(selectedEvent), registrationId, status)
      toast.success(`Usher registration ${status} successfully!`)
      
      // Reload the registered ushers list
      await loadRegisteredUshers(Number(selectedEvent))
      setSelectedRegistrations(new Set())
    } catch (error) {
      console.error('Failed to update registration status:', error)
      toast.error('Failed to update registration status')
    }
  }

  const handleDeleteRegistration = (registrationId: number) => {
    setRegistrationToDelete(registrationId)
    setDeleteRegistrationDialogOpen(true)
  }

  const confirmDeleteRegistration = async () => {
    if (!selectedEvent || !registrationToDelete) return
    
    setDeletingRegistration(true)
    try {
      await deleteUsherRegistration(Number(selectedEvent), registrationToDelete)
      showSuccessToast(
        'Usher Registration Deleted',
        'The usher registration has been successfully removed from the system.'
      )
      
      // Reload the registered ushers list
      await loadRegisteredUshers(Number(selectedEvent))
      setSelectedRegistrations(new Set())
      setDeleteRegistrationDialogOpen(false)
      setRegistrationToDelete(null)
    } catch (error: any) {
      console.error('Failed to delete registration:', error)
      showErrorToast(
        'Delete Failed',
        error.response?.data?.message || 'Failed to delete usher registration. Please try again.'
      )
    } finally {
      setDeletingRegistration(false)
    }
  }

  const handleBulkUpdateStatus = async () => {
    if (!selectedEvent || selectedRegistrations.size === 0) return
    
    setBulkUpdating(true)
    try {
      const promises = Array.from(selectedRegistrations).map(regId =>
        updateUsherRegistrationStatus(Number(selectedEvent), regId, bulkStatus)
      )
      await Promise.all(promises)
      toast.success(`${selectedRegistrations.size} registration(s) ${bulkStatus} successfully!`)
      setBulkStatusDialogOpen(false)
      setSelectedRegistrations(new Set())
      await loadRegisteredUshers(Number(selectedEvent))
    } catch (error) {
      console.error('Failed to bulk update registration status:', error)
      toast.error('Failed to update registration statuses')
    } finally {
      setBulkUpdating(false)
    }
  }

  const filteredRegistrations = registeredUshers.filter((reg: any) => {
    const matchesSearch = 
      reg.name?.toLowerCase().includes(registrationSearchTerm.toLowerCase()) ||
      reg.email?.toLowerCase().includes(registrationSearchTerm.toLowerCase()) ||
      reg.phone?.includes(registrationSearchTerm)
    
    const matchesStatus = registrationStatusFilter === 'all' || reg.status === registrationStatusFilter
    const matchesPayment = registrationPaymentFilter === 'all' || reg.payment_status === registrationPaymentFilter
    
    return matchesSearch && matchesStatus && matchesPayment
  })

  const loadUsherTaskStatuses = async (eventId: string) => {
    try {
      const response = await api.get(`/events/${eventId}/usher-tasks`)
      setUsherTaskStatuses(response.data)
    } catch (error) {
      setUsherTaskStatuses([])
    }
  }

  const loadUsherAvailability = async () => {
    try {
      const response = await api.get('/ushers/assignments-with-dates')
      setUsherAvailability(response.data)
    } catch (error) {
      console.error('Failed to load usher availability:', error)
      setUsherAvailability([])
    }
  }

  const calculateStats = () => {
    const totalUshers = ushers.length
    const assignedUshers = eventUshers.length
    
    console.log('Calculating stats - totalUshers:', totalUshers, 'assignedUshers:', assignedUshers, 'eventUshers:', eventUshers)
    
    // Calculate truly available ushers (not assigned to current event AND not assigned to other event on same date)
    const availableUshers = ushers.filter(usher => {
      const isAssigned = eventUshers.some(eu => eu.id === usher.id)
      const isAssignedToOtherEventOnSameDate = usherAvailability.some(availability => {
        if (availability.usher_id === usher.id && availability.event_id !== parseInt(selectedEvent || '0')) {
          const otherEventDate = new Date(availability.event_start_date).toISOString().split('T')[0]
          return otherEventDate === currentEventDate
        }
        return false
      })
      return !isAssigned && !isAssignedToOtherEventOnSameDate
    }).length
    
    let completedTasks = 0
    let totalTasks = 0
    
    usherTaskStatuses.forEach((status: any) => {
      const completion = status.task_completion || {}
      totalTasks += status.tasks.length
      completedTasks += Object.values(completion).filter((v: any) => v).length
    })

    setStats({
      totalUshers,
      assignedUshers,
      availableUshers,
      completedTasks,
      totalTasks
    })
  }

  const handleUpdateTasks = async (usherId: number) => {
    if (!selectedEvent || !editingTasks.trim()) return
    
    if (!checkPermission('ushers.manage', 'update usher tasks')) {
      return
    }

    setUpdating(true)
    try {
      const tasks = editingTasks
        .split(',')
        .map((task) => task.trim())
        .filter(Boolean)

      await updateUsherTasks(Number(selectedEvent), usherId, tasks)
      toast.success('Tasks updated successfully!')
      setEditDialogOpen(false)
      setEditingTasks('')
      setSelectedUsher(null)
      console.log('Tasks updated, refreshing data...')
      await loadEventUshers(selectedEvent)
      await loadUsherTaskStatuses(selectedEvent)
      calculateStats()
    } catch (error) {
      console.error('Failed to update tasks:', error)
      toast.error('Failed to update tasks')
    } finally {
      setUpdating(false)
    }
  }

  const handleRemoveUsher = async (usherId: number) => {
    if (!selectedEvent) return
    
    if (!checkPermission('ushers.manage', 'remove ushers')) {
      return
    }

    try {
      await api.delete(`/events/${selectedEvent}/ushers/${usherId}`)
      toast.success('Usher removed from event')
      console.log('Usher removed, refreshing data...')
      await loadEventUshers(selectedEvent)
      await loadUsherTaskStatuses(selectedEvent)
      await loadUsherAvailability()
      calculateStats()
    } catch (error) {
      console.error('Failed to remove usher:', error)
      toast.error('Failed to remove usher')
    }
  }

  const handleBulkAssign = async () => {
    if (!selectedEvent || selectedUshersForBulk.size === 0 || !bulkTasks.trim()) return
    
    if (!checkPermission('ushers.assign', 'assign ushers')) {
      return
    }

    setBulkAssigning(true)
    try {
      const tasks = bulkTasks
        .split(',')
        .map((task) => task.trim())
        .filter(Boolean)

      const ushers = Array.from(selectedUshersForBulk).map((usherId) => ({
        id: usherId,
        tasks: tasks,
      }))

      await assignUshersToEvent(Number(selectedEvent), ushers)
      toast.success(`${selectedUshersForBulk.size} ushers assigned successfully!`)
      setBulkAssignDialogOpen(false)
      setBulkTasks('')
      setSelectedUshersForBulk(new Set())
      console.log('Bulk assignment successful, refreshing data...')
      await loadEventUshers(selectedEvent)
      await loadUsherTaskStatuses(selectedEvent)
      await loadUsherAvailability()
      calculateStats()
    } catch (error) {
      console.error('Failed to bulk assign ushers:', error)
      toast.error('Failed to assign ushers')
    } finally {
      setBulkAssigning(false)
    }
  }

  const handleSelectUsherForBulk = (usherId: number) => {
    const newSelected = new Set(selectedUshersForBulk)
    if (newSelected.has(usherId)) {
      newSelected.delete(usherId)
    } else {
      newSelected.add(usherId)
    }
    setSelectedUshersForBulk(newSelected)
  }

  const handleSelectAllUshersForBulk = () => {
    if (selectedUshersForBulk.size === filteredUshers.length) {
      setSelectedUshersForBulk(new Set())
    } else {
      setSelectedUshersForBulk(new Set(filteredUshers.map((u) => u.id)))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success border-success/30'
      case 'upcoming':
        return 'bg-info/10 text-info border-info/30'
      case 'completed':
        return 'bg-muted text-muted-foreground border-border'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  // Function to get color coding for tasks based on task type
  const getTaskColor = (task: string) => {
    const taskLower = task.toLowerCase().trim()
    
    // Check-in related tasks
    if (taskLower.includes('check-in') || taskLower.includes('checkin') || taskLower.includes('registration')) {
      return 'bg-info/10 text-info border-info/30'
    }
    
    // Security related tasks
    if (taskLower.includes('security') || taskLower.includes('guard') || taskLower.includes('safety')) {
      return 'bg-error/10 text-error border-error/30'
    }
    
    // Guest assistance tasks
    if (taskLower.includes('guest') || taskLower.includes('assistance') || taskLower.includes('help') || taskLower.includes('support')) {
      return 'bg-success/10 text-success border-success/30'
    }
    
    // Crowd control tasks
    if (taskLower.includes('crowd') || taskLower.includes('control') || taskLower.includes('manage')) {
      return 'bg-primary/10 text-primary border-primary/30'
    }
    
    // Communication tasks
    if (taskLower.includes('communication') || taskLower.includes('announcement') || taskLower.includes('coordination')) {
      return 'bg-warning/10 text-warning border-warning/30'
    }
    
    // Technical tasks
    if (taskLower.includes('technical') || taskLower.includes('equipment') || taskLower.includes('setup') || taskLower.includes('audio') || taskLower.includes('video')) {
      return 'bg-info/10 text-info border-info/30'
    }
    
    // Emergency tasks
    if (taskLower.includes('emergency') || taskLower.includes('first aid') || taskLower.includes('medical')) {
      return 'bg-error/10 text-error border-error/30'
    }
    
    // Default color for other tasks
    return 'bg-muted text-muted-foreground border-border'
  }

  const filteredUshers = ushers.filter((usher) => {
    const matchesSearch =
      usher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usher.email.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterStatus === 'all') return matchesSearch
    if (filterStatus === 'assigned') {
      return matchesSearch && eventUshers.some((eu) => eu.id === usher.id)
    }
    if (filterStatus === 'available') {
      return matchesSearch && !eventUshers.some((eu) => eu.id === usher.id)
    }

    return matchesSearch
  })

  const currentEvent = Array.isArray(events) ? events.find((e) => e.id.toString() === selectedEvent) : null

  // Debug logging for ushers table rendering (after filteredUshers is defined)
  if (process.env.NODE_ENV === 'development') {
    console.log('Rendering ushers table, filteredUshers:', filteredUshers.length, 'eventUshers:', eventUshers.length)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="lg" variant="primary" text="Loading usher management..." />
          <div className="text-sm text-muted-foreground/70 mt-2">Gathering usher data and assignments</div>
        </div>
      </div>
    )
  }

  // Debug information (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('UsherManagement Debug Info:', {
      user,
      ushersCount: ushers.length,
      eventsCount: events.length,
      selectedEvent,
      eventUshersCount: eventUshers.length,
      usherAvailabilityCount: usherAvailability.length
    })
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs 
        items={[
          { label: 'Usher Management', href: '/dashboard/usher-management' }
        ]}
        className="mb-4"
      />
      
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Usher Management
            </h1>
            <p className="text-muted-foreground">
              Manage usher assignments and tasks across events
            </p>
          </div>
        </div>
        
        {/* Action Button */}
        {currentEvent && (
          <div className="mt-6 flex gap-3 flex-wrap">
            <UsherAssignmentDialog
              eventId={Number(selectedEvent)}
              eventName={currentEvent.name}
              trigger={
                <Button className="bg-brand-gradient shadow-lg hover:shadow-xl text-foreground">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Ushers
                </Button>
              }
              onSuccess={async () => {
                console.log('Usher assignment successful, refreshing data...')
                await loadEventUshers(selectedEvent)
                await loadUsherTaskStatuses(selectedEvent)
                await loadUsherAvailability()
                calculateStats()
              }}
            />
            <Link to={`/dashboard/usher-management/register?eventId=${selectedEvent}`}>
              <Button variant="outline" className="shadow-sm">
                Register Ushers
              </Button>
            </Link>
            <Link to="/dashboard/usher-management/links">
              <Button variant="outline" className="shadow-sm">
                Manage Links
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-info" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-card-foreground">{stats.totalUshers}</div>
              <div className="text-sm text-muted-foreground">Total Ushers</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">All registered ushers</p>
        </div>
        
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-success" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-card-foreground">{stats.assignedUshers}</div>
              <div className="text-sm text-muted-foreground">Assigned</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Currently assigned to events</p>
        </div>
        
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-card-foreground">{stats.availableUshers}</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Ready for assignment</p>
        </div>
        
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-warning" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-card-foreground">
                {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Completion</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {stats.completedTasks}/{stats.totalTasks} tasks completed
          </p>
        </div>
        
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-info" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-card-foreground">{events.length}</div>
              <div className="text-sm text-muted-foreground">Active Events</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Events with usher assignments</p>
        </div>
      </div>

      {/* Event Selection */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Event Selection</h3>
            <p className="text-sm text-muted-foreground">Choose an event to manage usher assignments</p>
          </div>
          <div className="w-8 h-8 bg-info/10 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-info" />
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">Select Event</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="bg-background border-border focus:bg-card">
                <SelectValue placeholder="Choose an event" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(events) && events.map((event) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{event.name}</span>
                      <span className="text-sm text-muted-foreground/70">
                        {event.start_date
                          ? format(parseISO(event.start_date), 'MMM dd, yyyy')
                          : 'No date'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentEvent && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-info/10 dark:bg-info/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-info" />
                </div>
                <div>
                  <div className="text-sm font-medium text-card-foreground">Event Date</div>
                  <div className="text-sm text-muted-foreground">
                    {currentEvent.start_date
                      ? format(parseISO(currentEvent.start_date), 'MMM dd, yyyy')
                      : 'No date'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-success/10 dark:bg-success/20 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-success" />
                </div>
                <div>
                  <div className="text-sm font-medium text-card-foreground">Location</div>
                  <div className="text-sm text-muted-foreground">{currentEvent.location}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-card-foreground">Ushers Assigned</div>
                  <div className="text-sm text-muted-foreground">{eventUshers.length} ushers</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Registered Ushers Section */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Registered Ushers</h3>
            <p className="text-sm text-muted-foreground">
              Ushers who registered via the generated link ({filteredRegistrations.length} of {registeredUshers.length})
            </p>
          </div>
          {registeredUshers.length > 0 && (
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-info">{registeredUshers.filter((r: any) => r.status === 'pending').length}</div>
                <div className="text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-success">{registeredUshers.filter((r: any) => r.status === 'approved').length}</div>
                <div className="text-muted-foreground">Approved</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-error">{registeredUshers.filter((r: any) => r.status === 'rejected').length}</div>
                <div className="text-muted-foreground">Rejected</div>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" disabled={!selectedEvent || exporting} onClick={async () => {
              if (!selectedEvent) return
              try {
                setExporting(true)
                const resp = await exportUsherRegistrations(Number(selectedEvent))
                const blob = new Blob([resp.data], { type: 'text/csv;charset=utf-8;' })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `registered_ushers_event_${selectedEvent}.csv`
                a.click()
                window.URL.revokeObjectURL(url)
              } catch (e) {
                toast.error('Failed to export')
              } finally {
                setExporting(false)
              }
            }}>Export</Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={registrationSearchTerm}
                  onChange={(e) => setRegistrationSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border focus:bg-card"
                />
              </div>
            </div>
            <Select value={registrationStatusFilter} onValueChange={setRegistrationStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-background border-border focus:bg-card">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={registrationPaymentFilter} onValueChange={setRegistrationPaymentFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-background border-border focus:bg-card">
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Statuses</SelectItem>
                <SelectItem value="n/a">N/A</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedRegistrations.size > 0 && (
            <div className="flex items-center gap-4 p-4 bg-info/10 border border-info/30 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-info/10 rounded-full flex items-center justify-center">
                  <Users className="w-3 h-3 text-info" />
                </div>
                <div className="text-sm font-medium text-info">
                  {selectedRegistrations.size} registration(s) selected
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setBulkStatusDialogOpen(true)}
                className="bg-brand-gradient shadow-sm text-foreground"
              >
                Bulk Update Status
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedRegistrations(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </div>

        {registeredUshers.length === 0 ? (
          <div className="text-sm text-muted-foreground">No registrations yet.</div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="text-sm text-muted-foreground">No registrations match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedRegistrations.size === filteredRegistrations.length && filteredRegistrations.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRegistrations(new Set(filteredRegistrations.map((r: any) => r.id)))
                        } else {
                          setSelectedRegistrations(new Set())
                        }
                      }}
                      className="rounded border-border"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>National ID</TableHead>
                  <TableHead>Available Dates</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Bank Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Registered At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRegistrations.has(u.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedRegistrations)
                          if (e.target.checked) {
                            newSelected.add(u.id)
                          } else {
                            newSelected.delete(u.id)
                          }
                          setSelectedRegistrations(newSelected)
                        }}
                        className="rounded border-border"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone || '-'}</TableCell>
                    <TableCell>{u.national_id || '-'}</TableCell>
                    <TableCell>
                      {u.available_dates && Array.isArray(u.available_dates) && u.available_dates.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.available_dates.map((date: string, idx: number) => {
                            try {
                              const formattedDate = format(parseISO(date), 'MMM dd, yyyy')
                              return (
                                <Badge key={idx} variant="outline" className="text-xs bg-info/10 text-info border-info/30">
                                  {formattedDate}
                                </Badge>
                              )
                            } catch (e) {
                              return (
                                <Badge key={idx} variant="outline" className="text-xs bg-info/10 text-info border-info/30">
                                  {date}
                                </Badge>
                              )
                            }
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/70 text-sm">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {u.payment_method?.replace('_', ' ') || 'cash'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.payment_method === 'bank_transfer' && u.bank_name && u.bank_account ? (
                        <div className="text-sm">
                          <div className="font-medium">{u.bank_name}</div>
                          <div className="text-muted-foreground">{u.bank_account}</div>
                        </div>
                      ) : u.payment_method === 'mobile_money' && u.mobile_wallet ? (
                        <div className="text-sm">{u.mobile_wallet}</div>
                      ) : (
                        <span className="text-muted-foreground/70">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${
                        u.status === 'approved' ? 'bg-success/10 text-success border-success/30' :
                        u.status === 'rejected' ? 'bg-error/10 text-error border-error/30' :
                        'bg-info/10 text-info border-info/30'
                      }`}>
                        {(u.status || 'pending').toString()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${
                        u.payment_status === 'paid' ? 'bg-success/10 text-success border-success/30' :
                        u.payment_status === 'failed' ? 'bg-error/10 text-error border-error/30' :
                        u.payment_status === 'pending' ? 'bg-warning/10 text-warning border-warning/30' :
                        'bg-muted/50 text-muted-foreground border-border'
                      }`}>
                        {u.payment_status || 'n/a'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRegistration(u)
                            setViewRegistrationDialogOpen(true)
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        {u.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-success border-success/30 hover:bg-success/10"
                              onClick={() => handleUpdateRegistrationStatus(u.id, 'approved')}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-error border-error/30 hover:bg-error/10"
                              onClick={() => handleUpdateRegistrationStatus(u.id, 'rejected')}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-error border-error/30 hover:bg-error/10"
                          onClick={() => handleDeleteRegistration(u.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.created_at ? format(parseISO(u.created_at), 'MMM dd, yyyy HH:mm') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Usher Management</h3>
            <p className="text-sm text-muted-foreground">Search and filter ushers for assignment</p>
          </div>
          <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-success" />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search ushers by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border focus:bg-card"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48 bg-background border-border focus:bg-card">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ushers</SelectItem>
                <SelectItem value="assigned">Assigned to Event</SelectItem>
                <SelectItem value="available">Available</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedUshersForBulk.size > 0 && (
            <div className="flex items-center gap-4 p-4 bg-info/10 border border-info/30 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-info/10 rounded-full flex items-center justify-center">
                  <Users className="w-3 h-3 text-info" />
                </div>
                <div className="text-sm font-medium text-info">
                  {selectedUshersForBulk.size} usher(s) selected
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setBulkAssignDialogOpen(true)}
                className="bg-brand-gradient shadow-sm text-foreground"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Assign Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedUshersForBulk(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}

          {/* Ushers Table */}
          <div className="border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="w-12 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUshersForBulk.size === filteredUshers.length && filteredUshers.length > 0}
                      onChange={handleSelectAllUshersForBulk}
                      className="rounded border-border"
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-foreground text-sm py-4">Usher</TableHead>
                  <TableHead className="font-semibold text-foreground text-sm py-4">Contact</TableHead>
                  <TableHead className="font-semibold text-foreground text-sm py-4">Status</TableHead>
                  <TableHead className="font-semibold text-foreground text-sm py-4">Assigned Tasks</TableHead>
                  <TableHead className="font-semibold text-foreground text-sm py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUshers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      {ushers.length === 0 ? (
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                            <Users className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <div className="text-lg font-medium text-card-foreground">No ushers found</div>
                          <div className="text-sm text-muted-foreground max-w-md text-center">
                            {user?.role === 'admin' || user?.role === 'superadmin' 
                              ? 'No usher accounts exist in the system.' 
                              : 'No ushers are available for your organization.'}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                            <Search className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <div className="text-lg font-medium text-card-foreground">No ushers match your filters</div>
                          <div className="text-sm text-muted-foreground">Try adjusting your search criteria</div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUshers.map((usher) => {
                    const isAssigned = eventUshers.some(
                      (eu) => eu.id === usher.id
                    )
                    const assignedUsher = eventUshers.find(
                      (eu) => eu.id === usher.id
                    )
                    
                    // Check if usher is assigned to any other event on the same date
                    const isAssignedToOtherEventOnSameDate = usherAvailability.some((availability) => {
                      if (availability.usher_id === usher.id && availability.event_id !== parseInt(selectedEvent)) {
                        const otherEventDate = new Date(availability.event_start_date).toISOString().split('T')[0]
                        return otherEventDate === currentEventDate
                      }
                      return false
                    })
                    
                    // Usher is available if not assigned to current event AND not assigned to other event on same date
                    const isAvailable = !isAssigned && !isAssignedToOtherEventOnSameDate
                    const tasks = assignedUsher?.pivot?.tasks
                      ? Array.isArray(assignedUsher.pivot.tasks)
                        ? assignedUsher.pivot.tasks
                        : JSON.parse(assignedUsher.pivot.tasks)
                      : []
                    let statusBadge = null
                    if (isAssigned) {
                      // For UsherManagement page, show simple "Assigned" status for all assigned ushers
                      statusBadge = (
                        <Badge className="bg-info/10 text-info border-info/30">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Assigned
                        </Badge>
                      )
                    } else if (isAssignedToOtherEventOnSameDate) {
                      statusBadge = (
                        <Badge className="bg-warning/10 text-warning border-warning/30">
                          <Calendar className="w-3 h-3 mr-1" />
                          Assigned to Other Event
                        </Badge>
                      )
                    } else {
                      statusBadge = (
                        <Badge className="bg-muted text-muted-foreground border border-border">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Available
                        </Badge>
                      )
                    }
                    return (
                      <TableRow key={usher.id} className="hover:bg-accent transition-colors border-b border-border">
                        <TableCell className="py-4">
                          <input
                            type="checkbox"
                            checked={selectedUshersForBulk.has(usher.id)}
                            onChange={() => handleSelectUsherForBulk(usher.id)}
                            className="rounded border-border"
                          />
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-medium shadow-sm">
                              {usher.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">{usher.name}</div>
                              <div className="text-sm text-muted-foreground">
                                ID: {usher.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-sm text-foreground">{usher.email}</div>
                        </TableCell>
                        <TableCell className="py-4">{statusBadge}</TableCell>
                        <TableCell className="py-4">
                          {isAssigned && tasks.length > 0 ? (
                            <div className="space-y-1">
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
                            <span className="text-muted-foreground text-sm">
                              No tasks assigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUsherDetails(usher)
                                setShowUsherDetails(true)
                              }}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            {isAssigned ? (
                              <>
                                <ProtectedButton
                                  permission="ushers.manage"
                                  onClick={() => {
                                    if (checkPermission('ushers.manage', 'edit usher tasks')) {
                                      setSelectedUsher(usher)
                                      setEditingTasks(tasks.join(', '))
                                      setEditDialogOpen(true)
                                    }
                                  }}
                                  variant="outline"
                                  size="sm"
                                  actionName="edit usher tasks"
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </ProtectedButton>
                                <ProtectedButton
                                  permission="ushers.manage"
                                  onClick={() => handleRemoveUsher(usher.id)}
                                  variant="outline"
                                  size="sm"
                                  actionName="remove ushers"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Remove
                                </ProtectedButton>
                              </>
                            ) : (
                              <ProtectedButton
                                permission="ushers.assign"
                                onClick={() => {
                                  if (checkPermission('ushers.assign', 'assign ushers')) {
                                    setSelectedUsher(usher)
                                    setEditingTasks('')
                                    setEditDialogOpen(true)
                                  }
                                }}
                                variant="outline"
                                size="sm"
                                actionName="assign ushers"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Assign
                              </ProtectedButton>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Edit Tasks Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUsher &&
              eventUshers.some((eu) => eu.id === selectedUsher.id)
                ? 'Edit Usher Tasks'
                : 'Assign Usher to Event'}
            </DialogTitle>
            <DialogDescription>
              {selectedUsher &&
              eventUshers.some((eu) => eu.id === selectedUsher.id)
                ? `Update tasks for ${selectedUsher.name}`
                : `Assign ${selectedUsher?.name} to ${currentEvent?.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tasks</Label>
              <Textarea
                placeholder="Enter tasks separated by commas (e.g., Check-in, Security, Guest assistance)"
                value={editingTasks}
                onChange={(e) => setEditingTasks(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <ProtectedButton
              permission="ushers.manage"
              onClick={() => {
                if (checkPermission('ushers.manage', 'update usher tasks')) {
                  handleUpdateTasks(selectedUsher?.id)
                }
              }}
              disabled={updating || !editingTasks.trim()}
              className="bg-brand-gradient"
              actionName="update usher tasks"
            >
              {updating ? 'Updating...' : 'Save Changes'}
            </ProtectedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assignment Dialog */}
      <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Assign Ushers</DialogTitle>
            <DialogDescription>
              Assign {selectedUshersForBulk.size} selected usher(s) to {currentEvent?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tasks for All Selected Ushers</Label>
              <Textarea
                placeholder="Enter tasks separated by commas (e.g., Check-in, Security, Guest assistance)"
                value={bulkTasks}
                onChange={(e) => setBulkTasks(e.target.value)}
                rows={4}
              />
              {bulkTasks.trim() && (
                <div className="mt-2">
                  <Label className="text-sm text-muted-foreground">Task Preview:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {bulkTasks.split(',').map((task: string, index: number) => {
                      const trimmedTask = task.trim()
                      if (trimmedTask) {
                        return (
                          <Badge
                            key={index}
                            variant="outline"
                            className={`text-xs ${getTaskColor(trimmedTask)}`}
                          >
                            {trimmedTask}
                          </Badge>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <Label>Selected Ushers</Label>
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                {Array.from(selectedUshersForBulk).map((usherId) => {
                  const usher = ushers.find((u) => u.id === usherId)
                  return (
                    <div key={usherId} className="text-sm text-muted-foreground">
                      • {usher?.name} ({usher?.email})
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkAssignDialogOpen(false)}
              disabled={bulkAssigning}
            >
              Cancel
            </Button>
            <ProtectedButton
              permission="ushers.assign"
              onClick={() => {
                if (checkPermission('ushers.assign', 'assign ushers in bulk')) {
                  handleBulkAssign()
                }
              }}
              disabled={bulkAssigning || !bulkTasks.trim()}
              className="bg-brand-gradient"
              actionName="assign ushers in bulk"
            >
              {bulkAssigning ? 'Assigning...' : 'Assign Ushers'}
            </ProtectedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Update Dialog */}
      <Dialog open={bulkStatusDialogOpen} onOpenChange={setBulkStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Registration Status</DialogTitle>
            <DialogDescription>
              Update status for {selectedRegistrations.size} selected registration(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>New Status</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Selected Registrations</Label>
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                {Array.from(selectedRegistrations).map((regId) => {
                  const reg = registeredUshers.find((r: any) => r.id === regId)
                  return (
                    <div key={regId} className="text-sm text-muted-foreground">
                      • {reg?.name} ({reg?.email})
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkStatusDialogOpen(false)}
              disabled={bulkUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpdateStatus}
              disabled={bulkUpdating}
              className="bg-brand-gradient"
            >
              {bulkUpdating ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registration Detail View Dialog */}
      <Dialog open={viewRegistrationDialogOpen} onOpenChange={setViewRegistrationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedRegistration?.name}'s registration
            </DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <p className="text-lg font-medium text-foreground">{selectedRegistration.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-lg text-foreground">{selectedRegistration.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <p className="text-lg text-foreground">{selectedRegistration.phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">National ID</Label>
                  <p className="text-lg text-foreground">{selectedRegistration.national_id || 'Not provided'}</p>
                </div>
              </div>

              {/* Available Dates */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Available Dates</Label>
                <div className="mt-2">
                  {selectedRegistration.available_dates && Array.isArray(selectedRegistration.available_dates) && selectedRegistration.available_dates.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedRegistration.available_dates.map((date: string, idx: number) => {
                        try {
                          const formattedDate = format(parseISO(date), 'MMMM dd, yyyy')
                          return (
                            <Badge key={idx} variant="outline" className="bg-info/10 text-info border-info/30">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formattedDate}
                            </Badge>
                          )
                        } catch (e) {
                          return (
                            <Badge key={idx} variant="outline" className="bg-info/10 text-info border-info/30">
                              <Calendar className="w-3 h-3 mr-1" />
                              {date}
                            </Badge>
                          )
                        }
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No available dates specified</p>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Payment Information</Label>
                <div className="mt-2 space-y-2">
                  <div className="p-3 border border-border rounded-lg bg-card">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Payment Method:</span>
                      <Badge variant="outline" className="capitalize">
                        {selectedRegistration.payment_method?.replace('_', ' ') || 'cash'}
                      </Badge>
                    </div>
                    {selectedRegistration.payment_method === 'bank_transfer' && (
                      <>
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Bank:</span> {selectedRegistration.bank_name || 'N/A'}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Account:</span> {selectedRegistration.bank_account || 'N/A'}
                        </div>
                      </>
                    )}
                    {selectedRegistration.payment_method === 'mobile_money' && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Mobile Wallet:</span> {selectedRegistration.mobile_wallet || 'N/A'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Registration Status</Label>
                  <div className="mt-2">
                    <Badge className={`${
                      selectedRegistration.status === 'approved' ? 'bg-success/10 text-success border-success/30' :
                      selectedRegistration.status === 'rejected' ? 'bg-error/10 text-error border-error/30' :
                      'bg-info/10 text-info border-info/30'
                    }`}>
                      {(selectedRegistration.status || 'pending').toString()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Payment Status</Label>
                  <div className="mt-2">
                    <Badge variant="outline" className={`${
                      selectedRegistration.payment_status === 'paid' ? 'bg-success/10 text-success border-success/30' :
                      selectedRegistration.payment_status === 'failed' ? 'bg-error/10 text-error border-error/30' :
                      selectedRegistration.payment_status === 'pending' ? 'bg-warning/10 text-warning border-warning/30' :
                      'bg-muted/50 text-muted-foreground border-border'
                    }`}>
                      {selectedRegistration.payment_status || 'n/a'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedRegistration.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Additional Notes</Label>
                  <p className="mt-2 text-foreground bg-muted/50 p-3 rounded-lg border border-border">
                    {selectedRegistration.notes}
                  </p>
                </div>
              )}

              {/* Registration Date */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Registered At</Label>
                <p className="mt-2 text-foreground">
                  {selectedRegistration.created_at 
                    ? format(parseISO(selectedRegistration.created_at), 'MMMM dd, yyyy HH:mm')
                    : 'N/A'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border">
                {selectedRegistration.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 text-success border-success/30 hover:bg-success/10"
                      onClick={() => {
                        handleUpdateRegistrationStatus(selectedRegistration.id, 'approved')
                        setViewRegistrationDialogOpen(false)
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-error border-error/30 hover:bg-error/10"
                      onClick={() => {
                        handleUpdateRegistrationStatus(selectedRegistration.id, 'rejected')
                        setViewRegistrationDialogOpen(false)
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  className="text-error border-error/30 hover:bg-error/10"
                  onClick={() => {
                    setViewRegistrationDialogOpen(false)
                    handleDeleteRegistration(selectedRegistration.id)
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRegistrationDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Usher Details Dialog */}
      <Dialog open={showUsherDetails} onOpenChange={setShowUsherDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Usher Details</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedUsherDetails?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedUsherDetails && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <p className="text-lg font-medium text-foreground">{selectedUsherDetails.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-lg text-foreground">{selectedUsherDetails.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <p className="text-lg text-foreground">{selectedUsherDetails.phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
                  <p className="text-lg text-foreground">{selectedUsherDetails.id}</p>
                </div>
              </div>

              {/* Current Assignments */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Current Event Assignments</Label>
                {eventUshers.some((eu) => eu.id === selectedUsherDetails.id) ? (
                  <div className="mt-2 space-y-2">
                    {eventUshers
                      .filter((eu) => eu.id === selectedUsherDetails.id)
                      .map((assignedUsher) => {
                        const tasks = assignedUsher?.pivot?.tasks
                          ? Array.isArray(assignedUsher.pivot.tasks)
                            ? assignedUsher.pivot.tasks
                            : JSON.parse(assignedUsher.pivot.tasks)
                          : []
                        return (
                          <div key={assignedUsher.id} className="p-3 border border-border rounded-lg bg-card">
                            <div className="font-medium text-foreground">{currentEvent?.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Tasks: 
                              <div className="flex flex-wrap gap-1 mt-1">
                                {tasks.length > 0 ? tasks.map((task: string, index: number) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className={`text-xs ${getTaskColor(task)}`}
                                  >
                                    {task}
                                  </Badge>
                                )) : (
                                  <span className="text-muted-foreground">No tasks assigned</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-2">No current assignments</p>
                )}
              </div>

              {/* Task Completion Status */}
              {eventUshers.some((eu) => eu.id === selectedUsherDetails.id) && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Task Completion Status</Label>
                  {usherTaskStatuses
                    .filter((status) => status.usher_id === selectedUsherDetails.id)
                    .map((status) => (
                      <div key={status.usher_id} className="mt-2 space-y-2">
                        {status.tasks.map((task: string, index: number) => {
                          const isCompleted = status.task_completion?.[task] || false
                          return (
                            <div key={index} className="flex items-center gap-2">
                              {isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-[hsl(var(--color-success))]" />
                              ) : (
                                <Clock className="w-4 h-4 text-[hsl(var(--color-warning))]" />
                              )}
                              <Badge
                                variant="outline"
                                className={`text-xs ${getTaskColor(task)} ${isCompleted ? 'opacity-50' : ''}`}
                              >
                                {task}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                </div>
              )}

              {/* Availability Status */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Availability Status</Label>
                <div className="mt-2">
                  {usherAvailability.some((av) => av.usher_id === selectedUsherDetails.id) ? (
                    <Badge className="bg-success/10 text-success border-success/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Available
                    </Badge>
                  ) : (
                    <Badge className="bg-muted text-muted-foreground border-border">
                      <XCircle className="w-3 h-3 mr-1" />
                      Not Available
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUsherDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ModernDeleteConfirmationDialog
        isOpen={deleteRegistrationDialogOpen}
        onClose={() => {
          setDeleteRegistrationDialogOpen(false)
          setRegistrationToDelete(null)
        }}
        onConfirm={confirmDeleteRegistration}
        itemName={registrationToDelete ? registeredUshers.find((r: any) => r.id === registrationToDelete)?.name || 'this usher registration' : 'this usher registration'}
        itemType="Usher Registration"
        isLoading={deletingRegistration}
      />
    </div>
  )
}
