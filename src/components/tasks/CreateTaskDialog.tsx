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
import { Loader2, Calendar, Briefcase, Badge as BadgeIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
    scope_type: 'event',
    priority: 'medium',
    assigned_to: undefined,
    event_id: undefined,
    session_id: undefined,
    start_date: '',
    due_date: '',
    notes: '',
    task_category: undefined,
    vendor_id: undefined,
    sponsor_id: undefined,
    usher_id: undefined,
    department: undefined,
    event_phase: undefined,
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
    
    // Validate scope-specific requirements
    if (formData.scope_type === 'event' && !formData.event_id) {
      toast.error('Please select an event for this task')
      return
    }
    
    if (formData.scope_type === 'general' && !formData.department) {
      toast.error('Please select a department for general tasks')
      return
    }
    
    // Set task_type based on scope_type for backward compatibility
    const submitData: TaskFormData = {
      ...formData,
      task_type: formData.scope_type === 'event' ? 'event_task' : 'general_task',
    }
    
    await onSubmit(submitData)
    setFormData({
      title: '',
      description: '',
      task_type: 'event_task',
      scope_type: 'event',
      priority: 'medium',
      assigned_to: undefined,
      event_id: undefined,
      session_id: undefined,
      start_date: '',
      due_date: '',
      notes: '',
      task_category: undefined,
      vendor_id: undefined,
      sponsor_id: undefined,
      usher_id: undefined,
      department: undefined,
      event_phase: undefined,
    })
  }

  const updateFormData = (key: keyof TaskFormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const isEventTask = formData.scope_type === 'event' || formData.task_type === 'event_task' || formData.task_type === 'usher_task'
  const isGeneralTask = formData.scope_type === 'general' || formData.task_type === 'operational_task' || formData.task_type === 'general_task'
  const showEventFields = isEventTask
  const showOperationalFields = isGeneralTask
  const showUsherFields = formData.task_type === 'usher_task'
  
  // Department options for general tasks
  const departments = [
    'HR',
    'Marketing',
    'Finance',
    'Operations',
    'IT',
    'Sales',
    'Procurement',
    'Logistics',
    'Other'
  ]
  
  // Event phases (can be fetched from API later)
  const eventPhases = [
    'Planning',
    'Pre-Event',
    'Setup',
    'Execution',
    'Post-Event',
    'Wrap-up'
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/20 rounded-xl flex items-center justify-center border-2 border-orange-200 dark:border-orange-800">
              <Briefcase className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            Create New Task
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            Create a new task for your event team management
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Scope Type Selector */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Task Scope *</Label>
              <Tabs
                value={formData.scope_type || 'event'}
                onValueChange={(value: 'event' | 'general') => {
                  updateFormData('scope_type', value)
                  updateFormData('task_type', value === 'event' ? 'event_task' : 'general_task')
                  // Reset fields when scope changes
                  if (value === 'general') {
                    updateFormData('event_id', undefined)
                    updateFormData('session_id', undefined)
                    updateFormData('event_phase', undefined)
                  } else {
                    updateFormData('department', undefined)
                  }
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="event" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Event Task
                  </TabsTrigger>
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    General Task
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className={cn(
                "p-3 rounded-lg border text-xs",
                isEventTask 
                  ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300"
                  : "bg-muted/50 border-border text-muted-foreground"
              )}>
                {isEventTask 
                  ? "This task is linked to a specific event and inherits event timeline and phases."
                  : "This task is not tied to any event and can be used for operational or general work."}
              </div>
            </div>

            {/* Basic Fields */}
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
                <Label htmlFor="priority">Priority *</Label>
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
                    <SelectItem value="critical">Critical</SelectItem>
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

            {/* Event Task Specific Fields */}
            {showEventFields && (
              <div className="space-y-4 p-4 bg-orange-50/30 dark:bg-orange-950/10 rounded-lg border border-orange-200/50 dark:border-orange-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <Label className="text-sm font-semibold text-orange-700 dark:text-orange-300">Event Task Details</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="event_id">Event *</Label>
                  <Select
                    value={formData.event_id?.toString() || ''}
                    onValueChange={(value) => {
                      updateFormData('event_id', value ? Number(value) : undefined)
                      updateFormData('session_id', undefined)
                    }}
                    required
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event_phase">Event Phase</Label>
                    <Select
                      value={formData.event_phase || ''}
                      onValueChange={(value) => updateFormData('event_phase', value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select phase (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventPhases.map((phase) => (
                          <SelectItem key={phase} value={phase}>
                            {phase}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.event_id && (
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
                </div>
              </div>
            )}

            {/* General Task Specific Fields */}
            {showOperationalFields && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-semibold">General Task Details</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.department || ''}
                    onValueChange={(value) => updateFormData('department', value || undefined)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {showOperationalFields && (
              <div className="space-y-2">
                <Label htmlFor="task_category">Task Category</Label>
                <Select
                  value={formData.task_category || ''}
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

            {/* Common Fields */}
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
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => updateFormData('start_date', e.target.value)}
                />
              </div>
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

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto order-2 sm:order-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || (isEventTask && !formData.event_id) || (isGeneralTask && !formData.department)}
              className="w-full sm:w-auto order-1 sm:order-2 bg-orange-600 hover:bg-orange-700 text-white"
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

