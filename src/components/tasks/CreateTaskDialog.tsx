import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TaskFormData } from '@/types/tasks'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TaskFormData) => Promise<void>
  events: Array<{ id: number; title: string }>
  teamMembers: Array<{ id: number; name: string }>
  vendors?: Array<{ id: number; name: string }>
  sponsors?: Array<{ id: number; name: string }>
  sessions?: Array<{ id: number; name: string; event_id: number }>
  onEventChange?: (eventId: number) => Promise<Array<{ id: number; name: string }>>
  isLoading?: boolean
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  events,
  teamMembers,
  vendors = [],
  sponsors = [],
  sessions = [],
  onEventChange,
  isLoading = false,
}: CreateTaskDialogProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    task_type: 'event_task',
    priority: 'medium',
    assigned_to: undefined,
    event_id: undefined,
    session_id: undefined,
    due_date: '',
    notes: '',
    task_category: undefined,
    vendor_id: undefined,
    sponsor_id: undefined,
    usher_id: undefined,
  })

  const [filteredSessions, setFilteredSessions] = useState<Array<{ id: number; name: string }>>([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  useEffect(() => {
    const loadSessions = async () => {
      if (formData.event_id) {
        if (onEventChange) {
          setLoadingSessions(true)
          try {
            const eventSessions = await onEventChange(formData.event_id)
            setFilteredSessions(eventSessions)
          } catch (error) {
            console.error('Error loading sessions:', error)
            setFilteredSessions([])
          } finally {
            setLoadingSessions(false)
          }
        } else {
          setFilteredSessions(sessions.filter(s => s.event_id === formData.event_id))
        }
      } else {
        setFilteredSessions([])
      }
    }
    loadSessions()
  }, [formData.event_id, sessions, onEventChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate event_id is required for event_task
    if (formData.task_type === 'event_task' && !formData.event_id) {
      toast.error('Please select an event for this task')
      return
    }
    
    await onSubmit(formData)
    setFormData({
      title: '',
      description: '',
      task_type: 'event_task',
      priority: 'medium',
      assigned_to: undefined,
      event_id: undefined,
      session_id: undefined,
      due_date: '',
      notes: '',
      task_category: undefined,
      vendor_id: undefined,
      sponsor_id: undefined,
      usher_id: undefined,
    })
  }

  const updateFormData = (key: keyof TaskFormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const showEventFields = formData.task_type === 'event_task' || formData.task_type === 'usher_task'
  const showOperationalFields = formData.task_type === 'operational_task'
  const showUsherFields = formData.task_type === 'usher_task'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create a new task for your event team management
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task_type">Task Type *</Label>
                <Select
                  value={formData.task_type}
                  onValueChange={(value: any) => {
                    updateFormData('task_type', value)
                    // Reset related fields when type changes
                    if (value !== 'operational_task') {
                      updateFormData('task_category', undefined)
                      updateFormData('vendor_id', undefined)
                      updateFormData('sponsor_id', undefined)
                    }
                    if (value !== 'usher_task') {
                      updateFormData('usher_id', undefined)
                    }
                    if (value !== 'event_task' && value !== 'usher_task') {
                      updateFormData('event_id', undefined)
                      updateFormData('session_id', undefined)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event_task">Event Task</SelectItem>
                    <SelectItem value="usher_task">Usher Task</SelectItem>
                    <SelectItem value="operational_task">Operational Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => updateFormData('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showOperationalFields && (
              <div className="space-y-2">
                <Label htmlFor="task_category">Task Category</Label>
                <Select
                  value={formData.task_category || undefined}
                  onValueChange={(value: any) => updateFormData('task_category', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendor_recruitment">Vendor Recruitment</SelectItem>
                    <SelectItem value="sponsor_followup">Sponsor Follow-up</SelectItem>
                    <SelectItem value="sponsor_listing">Sponsor Listing</SelectItem>
                    <SelectItem value="event_setup">Event Setup</SelectItem>
                    <SelectItem value="post_event">Post-Event</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {showOperationalFields && formData.task_category === 'vendor_recruitment' && vendors.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="vendor_id">Vendor</Label>
                <Select
                  value={formData.vendor_id?.toString() || ''}
                  onValueChange={(value) => updateFormData('vendor_id', value ? Number(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id.toString()}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showOperationalFields && (formData.task_category === 'sponsor_followup' || formData.task_category === 'sponsor_listing') && sponsors.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="sponsor_id">Sponsor</Label>
                <Select
                  value={formData.sponsor_id?.toString() || ''}
                  onValueChange={(value) => updateFormData('sponsor_id', value ? Number(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sponsor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sponsors.map((sponsor) => (
                      <SelectItem key={sponsor.id} value={sponsor.id.toString()}>
                        {sponsor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showEventFields && (
              <div className="space-y-2">
                <Label htmlFor="event_id">Event *</Label>
                <Select
                  value={formData.event_id?.toString() || ''}
                  onValueChange={(value) => {
                    updateFormData('event_id', value ? Number(value) : undefined)
                    updateFormData('session_id', undefined) // Reset session when event changes
                  }}
                  required={formData.task_type === 'event_task'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={events.length === 0 ? "No events available" : "Select event"} />
                  </SelectTrigger>
                  <SelectContent>
                    {events.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No events available
                      </div>
                    ) : (
                      events.map((event) => (
                        <SelectItem key={event.id} value={event.id.toString()}>
                          {event.title || event.name || `Event ${event.id}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formData.task_type === 'event_task' && !formData.event_id && (
                  <p className="text-sm text-muted-foreground">Event selection is required for event tasks</p>
                )}
              </div>
            )}

            {showEventFields && formData.event_id && (
              <div className="space-y-2">
                <Label htmlFor="session_id">Session (Optional)</Label>
                <Select
                  value={formData.session_id?.toString() || ''}
                  onValueChange={(value) => updateFormData('session_id', value ? Number(value) : undefined)}
                  disabled={loadingSessions}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingSessions ? "Loading sessions..." : "Select session"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSessions.map((session) => (
                      <SelectItem key={session.id} value={session.id.toString()}>
                        {session.name}
                      </SelectItem>
                    ))}
                    {!loadingSessions && filteredSessions.length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No sessions available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showUsherFields && teamMembers.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="usher_id">Usher</Label>
                <Select
                  value={formData.usher_id?.toString() || ''}
                  onValueChange={(value) => updateFormData('usher_id', value ? Number(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select usher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assign To</Label>
                <Select
                  value={formData.assigned_to?.toString() || 'unassigned'}
                  onValueChange={(value) => updateFormData('assigned_to', value === 'unassigned' ? undefined : Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => updateFormData('due_date', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || (formData.task_type === 'event_task' && !formData.event_id)}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

