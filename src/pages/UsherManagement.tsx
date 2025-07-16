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
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading usher management...</div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Usher Management</h1>
          <p className="text-gray-600">
            Manage usher assignments and tasks across events
          </p>
        </div>
        {currentEvent && (
          <UsherAssignmentDialog
            eventId={Number(selectedEvent)}
            eventName={currentEvent.name}
            trigger={
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                <UserPlus className="w-4 h-4 mr-2" />
                Assign Ushers
              </Button>
            }
            onSuccess={() => loadEventUshers(selectedEvent)}
          />
        )}
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <DashboardCard title="Total Ushers">
          <div className="text-3xl font-bold text-blue-600">{stats.totalUshers}</div>
          <p className="text-sm text-gray-600">All registered ushers</p>
        </DashboardCard>
        <DashboardCard title="Assigned Ushers">
          <div className="text-3xl font-bold text-green-600">{stats.assignedUshers}</div>
          <p className="text-sm text-gray-600">Currently assigned to events</p>
        </DashboardCard>
        <DashboardCard title="Available Ushers">
          <div className="text-3xl font-bold text-purple-600">{stats.availableUshers}</div>
          <p className="text-sm text-gray-600">Ready for assignment</p>
        </DashboardCard>
        <DashboardCard title="Task Completion">
          <div className="text-3xl font-bold text-orange-600">
            {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
          </div>
          <p className="text-sm text-gray-600">
            {stats.completedTasks}/{stats.totalTasks} tasks completed
          </p>
        </DashboardCard>
        <DashboardCard title="Active Events">
          <div className="text-3xl font-bold text-indigo-600">{events.length}</div>
          <p className="text-sm text-gray-600">Events with usher assignments</p>
        </DashboardCard>
      </div>

      {/* Event Selection */}
      <DashboardCard title="Event Selection">
        <div className="space-y-4">
          <div>
            <Label>Select Event</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {currentEvent.start_date
                    ? format(parseISO(currentEvent.start_date), 'MMM dd, yyyy')
                    : 'No date'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{currentEvent.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {eventUshers.length} ushers assigned
                </span>
              </div>
            </div>
          )}
        </div>
      </DashboardCard>

      {/* Filters and Search */}
      <DashboardCard title="Usher Management">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search ushers by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
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
            <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-700">
                {selectedUshersForBulk.size} usher(s) selected
              </div>
              <Button
                size="sm"
                onClick={() => setBulkAssignDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
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
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedUshersForBulk.size === filteredUshers.length && filteredUshers.length > 0}
                      onChange={handleSelectAllUshersForBulk}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Usher</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Tasks</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUshers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {ushers.length === 0 ? (
                        <div className="space-y-2">
                          <div className="text-gray-500">No ushers found</div>
                          <div className="text-sm text-gray-400">
                            {user?.role === 'admin' || user?.role === 'superadmin' 
                              ? 'No usher accounts exist in the system.' 
                              : 'No ushers are available for your organization.'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500">No ushers match your current filters</div>
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
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              All Tasks Complete
                            </Badge>
                          )
                        } else if (anyComplete) {
                          statusBadge = (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Clock className="w-3 h-3 mr-1" />
                              In Progress
                            </Badge>
                          )
                        } else {
                          statusBadge = (
                            <Badge className="bg-blue-100 text-blue-800">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Assigned
                            </Badge>
                          )
                        }
                      } else {
                        statusBadge = (
                          <Badge className="bg-gray-100 text-gray-800">
                            <UserCheck className="w-3 h-3 mr-1" />
                            No Tasks Assigned
                          </Badge>
                        )
                      }
                    } else {
                      statusBadge = (
                        <Badge className="bg-gray-100 text-gray-800">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Available
                        </Badge>
                      )
                    }
                    return (
                      <TableRow key={usher.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedUshersForBulk.has(usher.id)}
                            onChange={() => handleSelectUsherForBulk(usher.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {usher.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{usher.name}</div>
                              <div className="text-sm text-gray-500">
                                ID: {usher.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{usher.email}</TableCell>
                        <TableCell>{statusBadge}</TableCell>
                        <TableCell>
                          {isAssigned && tasks.length > 0 ? (
                            <div className="space-y-1">
                              {tasks.map((task: string, index: number) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
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
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUsherDetails(usher)
                                setShowUsherDetails(true)
                              }}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            {isAssigned ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUsher(usher)
                                    setEditingTasks(tasks.join(', '))
                                    setEditDialogOpen(true)
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveUsher(usher.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUsher(usher)
                                  setEditingTasks('')
                                  setEditDialogOpen(true)
                                }}
                              >
                                <Plus className="w-3 h-3" />
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
      </DashboardCard>

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
