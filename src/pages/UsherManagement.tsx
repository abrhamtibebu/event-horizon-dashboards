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

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      loadEventUshers(selectedEvent)
      loadUsherTaskStatuses(selectedEvent)
    }
  }, [selectedEvent])

  const loadData = async () => {
    setLoading(true)
    try {
      const [ushersRes, eventsRes] = await Promise.all([
        getUshers(),
        user?.role === 'admin' ? getAllOrganizers() : getMyEvents(),
      ])
      
      setUshers(ushersRes.data)
      setEvents(eventsRes.data)
      
      if (eventId) {
        setSelectedEvent(eventId)
      } else if (eventsRes.data.length > 0) {
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
    const matchesSearch = usher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                        {format(parseISO(event.start_date), 'MMM dd, yyyy')}
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
                  {format(parseISO(currentEvent.start_date), 'MMM dd, yyyy')}
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

          {/* Ushers Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell colSpan={5} className="text-center py-8">
                      No ushers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUshers.map((usher) => {
                    const isAssigned = eventUshers.some((eu) => eu.id === usher.id)
                    const assignedUsher = eventUshers.find((eu) => eu.id === usher.id)
                    const tasks = assignedUsher?.pivot?.tasks
                      ? (Array.isArray(assignedUsher.pivot.tasks)
                          ? assignedUsher.pivot.tasks
                          : JSON.parse(assignedUsher.pivot.tasks))
                      : []
                    let statusBadge = null
                    if (isAssigned) {
                      const usherStatus = usherTaskStatuses.find((u: any) => u.usher_id === usher.id)
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
                    } else {
                      statusBadge = <Badge className="bg-gray-100 text-gray-800"><UserCheck className="w-3 h-3 mr-1" />Available</Badge>
                    }
                    return (
                      <TableRow key={usher.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {usher.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{usher.name}</div>
                              <div className="text-sm text-gray-500">ID: {usher.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{usher.email}</TableCell>
                        <TableCell>{statusBadge}</TableCell>
                        <TableCell>
                          {isAssigned && tasks.length > 0 ? (
                            <div className="space-y-1">
                              {tasks.map((task: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {task}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">No tasks assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
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
              {selectedUsher && eventUshers.some((eu) => eu.id === selectedUsher.id)
                ? 'Edit Usher Tasks'
                : 'Assign Usher to Event'
              }
            </DialogTitle>
            <DialogDescription>
              {selectedUsher && eventUshers.some((eu) => eu.id === selectedUsher.id)
                ? `Update tasks for ${selectedUsher.name}`
                : `Assign ${selectedUsher?.name} to ${currentEvent?.name}`
              }
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
    </div>
  )
} 