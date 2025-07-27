import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { UsherAssignmentDialog } from '@/components/UsherAssignmentDialog'
import api, {
  getUshers,
  getEventUshers,
  getAvailableUshersForEvent,
  assignUshersToEvent,
  updateUsherTasks,
  getMyEvents,
  getAllOrganizers,
} from '@/lib/api'
import { format, parseISO } from 'date-fns'

export default function UsherManagement() {
  const { eventId } = useParams()
  const { user } = useAuth()
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

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      loadEventUshers(selectedEvent)
      loadUsherTaskStatuses(selectedEvent)
    }
  }, [selectedEvent])

  useEffect(() => {
    loadUsherAvailability()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [ushers, eventUshers, usherTaskStatuses])

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
      setEvents(eventsRes.data || [])

      if (eventId) {
        setSelectedEvent(eventId)
      } else if (eventsRes.data && eventsRes.data.length > 0) {
        setSelectedEvent(eventsRes.data[0].id.toString())
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
      setEventUshers(response.data)
    } catch (error) {
      console.error('Failed to load event ushers:', error)
      toast.error('Failed to load event ushers')
    }
  }

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
      const response = await api.get('/ushers/available')
      setUsherAvailability(response.data)
    } catch (error) {
      console.error('Failed to load usher availability:', error)
      setUsherAvailability([])
    }
  }

  const calculateStats = () => {
    const totalUshers = ushers.length
    const assignedUshers = eventUshers.length
    const availableUshers = totalUshers - assignedUshers
    
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
      loadEventUshers(selectedEvent)
    } catch (error) {
      console.error('Failed to update tasks:', error)
      toast.error('Failed to update tasks')
    } finally {
      setUpdating(false)
    }
  }

  const handleRemoveUsher = async (usherId: number) => {
    if (!selectedEvent) return

    try {
      await api.delete(`/events/${selectedEvent}/ushers/${usherId}`)
      toast.success('Usher removed from event')
      loadEventUshers(selectedEvent)
    } catch (error) {
      console.error('Failed to remove usher:', error)
      toast.error('Failed to remove usher')
    }
  }

  const handleBulkAssign = async () => {
    if (!selectedEvent || selectedUshersForBulk.size === 0 || !bulkTasks.trim()) return

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
      loadEventUshers(selectedEvent)
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
        return 'bg-green-100 text-green-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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

  const currentEvent = events.find((e) => e.id.toString() === selectedEvent)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <div className="text-lg font-medium text-gray-600">Loading usher management...</div>
          <div className="text-sm text-gray-500 mt-2">Gathering usher data and assignments</div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Usher Management
            </h1>
            <p className="text-gray-600">
              Manage usher assignments and tasks across events
            </p>
          </div>
        </div>
        
        {/* Action Button */}
        {currentEvent && (
          <div className="mt-6">
            <UsherAssignmentDialog
              eventId={Number(selectedEvent)}
              eventName={currentEvent.name}
              trigger={
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg hover:shadow-xl">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Ushers
                </Button>
              }
              onSuccess={() => loadEventUshers(selectedEvent)}
            />
          </div>
        )}
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{stats.totalUshers}</div>
              <div className="text-sm text-gray-600">Total Ushers</div>
            </div>
          </div>
          <p className="text-sm text-gray-600">All registered ushers</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{stats.assignedUshers}</div>
              <div className="text-sm text-gray-600">Assigned</div>
            </div>
          </div>
          <p className="text-sm text-gray-600">Currently assigned to events</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{stats.availableUshers}</div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
          </div>
          <p className="text-sm text-gray-600">Ready for assignment</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Completion</div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {stats.completedTasks}/{stats.totalTasks} tasks completed
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{events.length}</div>
              <div className="text-sm text-gray-600">Active Events</div>
            </div>
          </div>
          <p className="text-sm text-gray-600">Events with usher assignments</p>
        </div>
      </div>

      {/* Event Selection */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Event Selection</h3>
            <p className="text-sm text-gray-600">Choose an event to manage usher assignments</p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Select Event</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="bg-gray-50 border-gray-200 focus:bg-white">
                <SelectValue placeholder="Choose an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{event.name}</span>
                      <span className="text-sm text-gray-500">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Event Date</div>
                  <div className="text-sm text-gray-600">
                    {currentEvent.start_date
                      ? format(parseISO(currentEvent.start_date), 'MMM dd, yyyy')
                      : 'No date'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Location</div>
                  <div className="text-sm text-gray-600">{currentEvent.location}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Ushers Assigned</div>
                  <div className="text-sm text-gray-600">{eventUshers.length} ushers</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Usher Management</h3>
            <p className="text-sm text-gray-600">Search and filter ushers for assignment</p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-white" />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search ushers by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48 bg-gray-50 border-gray-200 focus:bg-white">
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
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-3 h-3 text-blue-600" />
                </div>
                <div className="text-sm font-medium text-blue-700">
                  {selectedUshersForBulk.size} usher(s) selected
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setBulkAssignDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 shadow-sm"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Assign Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedUshersForBulk(new Set())}
                className="bg-white border-gray-200 hover:bg-gray-50"
              >
                Clear Selection
              </Button>
            </div>
          )}

          {/* Ushers Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUshersForBulk.size === filteredUshers.length && filteredUshers.length > 0}
                      onChange={handleSelectAllUshersForBulk}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-sm py-4">Usher</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-sm py-4">Contact</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-sm py-4">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-sm py-4">Assigned Tasks</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-sm py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUshers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      {ushers.length === 0 ? (
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Users className="w-8 h-8 text-gray-400" />
                          </div>
                          <div className="text-lg font-medium text-gray-900">No ushers found</div>
                          <div className="text-sm text-gray-600 max-w-md text-center">
                            {user?.role === 'admin' || user?.role === 'superadmin' 
                              ? 'No usher accounts exist in the system.' 
                              : 'No ushers are available for your organization.'}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Search className="w-8 h-8 text-gray-400" />
                          </div>
                          <div className="text-lg font-medium text-gray-900">No ushers match your filters</div>
                          <div className="text-sm text-gray-600">Try adjusting your search criteria</div>
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
                    const tasks = assignedUsher?.pivot?.tasks
                      ? Array.isArray(assignedUsher.pivot.tasks)
                        ? assignedUsher.pivot.tasks
                        : JSON.parse(assignedUsher.pivot.tasks)
                      : []
                    let statusBadge = null
                    if (isAssigned) {
                      const usherStatus = usherTaskStatuses.find(
                        (u: any) => u.usher_id === usher.id
                      )
                      if (usherStatus && usherStatus.tasks.length > 0) {
                        const completion = usherStatus.task_completion || {}
                        const allComplete =
                          usherStatus.tasks.length > 0 &&
                          Object.values(completion).length > 0 &&
                          Object.values(completion).every((v: any) => v)
                        const anyComplete = Object.values(completion).some(
                          (v: any) => v
                        )
                        if (allComplete) {
                          statusBadge = (
                            <Badge className="bg-green-100 text-green-800 border border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              All Tasks Complete
                            </Badge>
                          )
                        } else if (anyComplete) {
                          statusBadge = (
                            <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
                              <Clock className="w-3 h-3 mr-1" />
                              In Progress
                            </Badge>
                          )
                        } else {
                          statusBadge = (
                            <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Assigned
                            </Badge>
                          )
                        }
                      } else {
                        statusBadge = (
                          <Badge className="bg-gray-100 text-gray-800 border border-gray-200">
                            <UserCheck className="w-3 h-3 mr-1" />
                            No Tasks Assigned
                          </Badge>
                        )
                      }
                    } else {
                      statusBadge = (
                        <Badge className="bg-gray-100 text-gray-800 border border-gray-200">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Available
                        </Badge>
                      )
                    }
                    return (
                      <TableRow key={usher.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                        <TableCell className="py-4">
                          <input
                            type="checkbox"
                            checked={selectedUshersForBulk.has(usher.id)}
                            onChange={() => handleSelectUsherForBulk(usher.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm">
                              {usher.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{usher.name}</div>
                              <div className="text-sm text-gray-500">
                                ID: {usher.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-sm text-gray-900">{usher.email}</div>
                        </TableCell>
                        <TableCell className="py-4">{statusBadge}</TableCell>
                        <TableCell className="py-4">
                          {isAssigned && tasks.length > 0 ? (
                            <div className="space-y-1">
                              {tasks.map((task: string, index: number) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs bg-gray-50 border-gray-200"
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
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white border-gray-200 hover:bg-gray-50"
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-white border-gray-200 hover:bg-gray-50"
                                  onClick={() => {
                                    setSelectedUsher(usher)
                                    setEditingTasks(tasks.join(', '))
                                    setEditDialogOpen(true)
                                  }}
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-white border-gray-200 hover:bg-gray-50"
                                  onClick={() => handleRemoveUsher(usher.id)}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Remove
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-white border-gray-200 hover:bg-gray-50"
                                onClick={() => {
                                  setSelectedUsher(usher)
                                  setEditingTasks('')
                                  setEditDialogOpen(true)
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Assign
                              </Button>
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
            <Button
              onClick={() => handleUpdateTasks(selectedUsher?.id)}
              disabled={updating || !editingTasks.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {updating ? 'Updating...' : 'Save Changes'}
            </Button>
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
            </div>
            
            <div>
              <Label>Selected Ushers</Label>
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                {Array.from(selectedUshersForBulk).map((usherId) => {
                  const usher = ushers.find((u) => u.id === usherId)
                  return (
                    <div key={usherId} className="text-sm text-gray-600">
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
            <Button
              onClick={handleBulkAssign}
              disabled={bulkAssigning || !bulkTasks.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {bulkAssigning ? 'Assigning...' : 'Assign Ushers'}
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
                  <Label className="text-sm font-medium text-gray-500">Name</Label>
                  <p className="text-lg font-medium">{selectedUsherDetails.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-lg">{selectedUsherDetails.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p className="text-lg">{selectedUsherDetails.phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">User ID</Label>
                  <p className="text-lg">{selectedUsherDetails.id}</p>
                </div>
              </div>

              {/* Current Assignments */}
              <div>
                <Label className="text-sm font-medium text-gray-500">Current Event Assignments</Label>
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
                          <div key={assignedUsher.id} className="p-3 border rounded-lg">
                            <div className="font-medium">{currentEvent?.name}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              Tasks: {tasks.join(', ') || 'No tasks assigned'}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <p className="text-gray-500 mt-2">No current assignments</p>
                )}
              </div>

              {/* Task Completion Status */}
              {eventUshers.some((eu) => eu.id === selectedUsherDetails.id) && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Task Completion Status</Label>
                  {usherTaskStatuses
                    .filter((status) => status.usher_id === selectedUsherDetails.id)
                    .map((status) => (
                      <div key={status.usher_id} className="mt-2 space-y-2">
                        {status.tasks.map((task: string, index: number) => {
                          const isCompleted = status.task_completion?.[task] || false
                          return (
                            <div key={index} className="flex items-center gap-2">
                              {isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Clock className="w-4 h-4 text-yellow-500" />
                              )}
                              <span className={isCompleted ? 'line-through text-gray-500' : ''}>
                                {task}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                </div>
              )}

              {/* Availability Status */}
              <div>
                <Label className="text-sm font-medium text-gray-500">Availability Status</Label>
                <div className="mt-2">
                  {usherAvailability.some((av) => av.usher_id === selectedUsherDetails.id) ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Available
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">
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
    </div>
  )
}
