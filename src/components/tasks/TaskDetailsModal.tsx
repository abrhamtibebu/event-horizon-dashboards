import { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { UnifiedTask } from '@/types/tasks'
import { format, parseISO } from 'date-fns'
import { Loader2, Calendar, User, Flag, Clock, Trash2, Copy, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissionCheck } from '@/hooks/use-permission-check'
import { ProtectedButton } from '@/components/ProtectedButton'

interface TaskDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: UnifiedTask | null
  onUpdate: (taskId: string, updates: Partial<UnifiedTask>) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
  onDuplicate: (task: UnifiedTask) => Promise<void>
  teamMembers: Array<{ id: number; name: string }>
  events: Array<{ id: number; title: string }>
  isLoading?: boolean
}

export function TaskDetailsModal({
  open,
  onOpenChange,
  task,
  onUpdate,
  onDelete,
  onDuplicate,
  teamMembers,
  events,
  isLoading = false,
}: TaskDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState<Partial<UnifiedTask>>({})
  const { checkPermission } = usePermissionCheck()

  if (!task) return null

  const handleEdit = () => {
    if (!checkPermission('tasks.edit', 'edit tasks')) {
      return
    }
    setEditedTask({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to,
      due_date: task.due_date,
      notes: task.notes,
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!checkPermission('tasks.edit', 'edit tasks')) {
      return
    }
    await onUpdate(task.id, editedTask)
    setIsEditing(false)
    setEditedTask({})
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedTask({})
  }

  const handleComplete = async () => {
    await onUpdate(task.id, { 
      status: 'completed', 
      completed_date: new Date().toISOString() 
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'critical':
        return 'bg-red-50 text-red-600 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium':
        return 'bg-orange-50 text-orange-600 border-orange-200'
      case 'low':
        return 'bg-slate-50 text-slate-600 border-slate-200'
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{isEditing ? 'Edit Task' : 'Task Details'}</span>
            {!isEditing && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDuplicate(task)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <ProtectedButton
                  permission="tasks.edit"
                  onClick={handleEdit}
                  variant="outline"
                  size="sm"
                  actionName="edit tasks"
                >
                  Edit
                </ProtectedButton>
                {task.status !== 'completed' && (
                  <ProtectedButton
                    permission="tasks.edit"
                    onClick={handleComplete}
                    variant="default"
                    size="sm"
                    actionName="complete tasks"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete
                  </ProtectedButton>
                )}
                <ProtectedButton
                  permission="tasks.delete"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this task?')) {
                      if (checkPermission('tasks.delete', 'delete tasks')) {
                        onDelete(task.id)
                      }
                    }
                  }}
                  variant="destructive"
                  size="sm"
                  actionName="delete tasks"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </ProtectedButton>
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update task details' : 'View and manage task information'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editedTask.title || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editedTask.description || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editedTask.status || 'pending'}
                    onValueChange={(value: any) => setEditedTask({ ...editedTask, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={editedTask.priority || 'medium'}
                    onValueChange={(value: any) => setEditedTask({ ...editedTask, priority: value })}
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-assigned_to">Assign To</Label>
                  <Select
                    value={editedTask.assigned_to?.toString() || 'unassigned'}
                    onValueChange={(value) => setEditedTask({ ...editedTask, assigned_to: value === 'unassigned' ? undefined : Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
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
                  <Label htmlFor="edit-due_date">Due Date</Label>
                  <Input
                    id="edit-due_date"
                    type="date"
                    value={editedTask.due_date ? editedTask.due_date.split('T')[0] : ''}
                    onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editedTask.notes || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                )}
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <Badge className={cn(getPriorityColor(task.priority))}>
                  <Flag className="w-3 h-3 mr-1" />
                  {task.priority}
                </Badge>
                <Badge variant="outline">{task.type.replace(/_/g, ' ')}</Badge>
                {task.task_category && (
                  <Badge variant="outline">{task.task_category.replace(/_/g, ' ')}</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Status</Label>
                  {!isEditing && (
                    <Select
                      value={task.status}
                      onValueChange={(value: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
                        const updates: Partial<UnifiedTask> = { status: value }
                        // Set completed_date when status is completed
                        if (value === 'completed') {
                          updates.completed_date = new Date().toISOString()
                        } else if (value !== 'completed' && task.status === 'completed') {
                          // Clear completed_date when status changes from completed
                          updates.completed_date = undefined
                        }
                        onUpdate(task.id, updates)
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {isEditing && (
                    <p className="font-medium">{task.status.replace(/_/g, ' ')}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Priority</Label>
                  <p className="font-medium">{task.priority}</p>
                </div>
              </div>

              {task.event && (
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Event
                  </Label>
                  <p className="font-medium">{task.event.title}</p>
                  {task.event.start_date && (
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(task.event.start_date), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              )}

              {task.session && (
                <div>
                  <Label className="text-muted-foreground">Session</Label>
                  <p className="font-medium">{task.session.name}</p>
                </div>
              )}

              {task.due_date && (
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Due Date
                  </Label>
                  <p className="font-medium">{format(parseISO(task.due_date), 'MMM d, yyyy')}</p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Assigned To
                </Label>
                {(task.assignedUser || task.usher) ? (
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials((task.assignedUser || task.usher)?.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {task.assignedUser?.name || task.usher?.name || 'Unassigned'}
                      </p>
                      {(task.assignedUser?.email || task.usher?.email) && (
                        <p className="text-sm text-muted-foreground">
                          {task.assignedUser?.email || task.usher?.email}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Unassigned</p>
                )}
              </div>

              {task.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm whitespace-pre-wrap">{task.notes}</p>
                </div>
              )}

              {task.vendor && (
                <div>
                  <Label className="text-muted-foreground">Vendor</Label>
                  <p className="font-medium">{task.vendor.name}</p>
                </div>
              )}

              {task.sponsor && (
                <div>
                  <Label className="text-muted-foreground">Sponsor</Label>
                  <p className="font-medium">{task.sponsor.name}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <Label>Created</Label>
                  <p>{format(parseISO(task.created_at), 'MMM d, yyyy HH:mm')}</p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p>{format(parseISO(task.updated_at), 'MMM d, yyyy HH:mm')}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <ProtectedButton
                permission="tasks.edit"
                onClick={handleSave}
                disabled={isLoading}
                actionName="save task changes"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </ProtectedButton>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


