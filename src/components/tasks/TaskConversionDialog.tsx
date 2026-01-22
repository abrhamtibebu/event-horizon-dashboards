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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UnifiedTask } from '@/types/tasks'
import { Loader2, ArrowRight, Calendar, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { taskApi } from '@/lib/taskApi'

interface TaskConversionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: UnifiedTask | null
  events: Array<{ id: number; title: string }>
  onConverted?: () => void
}

export function TaskConversionDialog({
  open,
  onOpenChange,
  task,
  events,
  onConverted,
}: TaskConversionDialogProps) {
  const [selectedEventId, setSelectedEventId] = useState<number | undefined>()
  const [eventPhase, setEventPhase] = useState<string>('')
  const [converting, setConverting] = useState(false)

  const eventPhases = [
    'Planning',
    'Pre-Event',
    'Setup',
    'Execution',
    'Post-Event',
    'Wrap-up'
  ]

  if (!task) return null

  const scopeType = task.scope_type || (task.type === 'event_task' || task.type === 'usher_task' ? 'event' : 'general')
  const isGeneralTask = scopeType === 'general'

  if (!isGeneralTask) {
    return null
  }

  const handleConvert = async () => {
    if (!selectedEventId) {
      toast.error('Please select an event to convert this task to')
      return
    }

    setConverting(true)
    try {
      await taskApi.convertTask(Number(task.original_id || task.id.replace('general_task_', '')), selectedEventId, eventPhase || undefined)
      toast.success('Task converted successfully')
      onConverted?.()
      onOpenChange(false)
      setSelectedEventId(undefined)
      setEventPhase('')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to convert task')
    } finally {
      setConverting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/20 rounded-xl flex items-center justify-center border-2 border-orange-200 dark:border-orange-800">
              <ArrowRight className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Convert General Task to Event Task</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Link this general task to a specific event
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Current Task Info */}
          <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-semibold">Current Task</Label>
            </div>
            <div className="space-y-1">
              <p className="font-medium">{task.title}</p>
              {task.department && (
                <p className="text-sm text-muted-foreground">Department: {task.department}</p>
              )}
              {task.task_category && (
                <p className="text-sm text-muted-foreground">Category: {task.task_category.replace(/_/g, ' ')}</p>
              )}
            </div>
          </div>

          {/* Event Selection */}
          <div className="space-y-2">
            <Label htmlFor="event_id">Select Event *</Label>
            <Select
              value={selectedEventId?.toString() || ''}
              onValueChange={(value) => setSelectedEventId(value ? Number(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an event" />
              </SelectTrigger>
              <SelectContent>
                {events.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No events available
                  </div>
                ) : (
                  events.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Event Phase Selection */}
          <div className="space-y-2">
            <Label htmlFor="event_phase">Event Phase (Optional)</Label>
            <Select
              value={eventPhase}
              onValueChange={setEventPhase}
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
            <p className="text-xs text-muted-foreground">
              Map this task to a specific phase of the event lifecycle
            </p>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800 text-xs text-orange-700 dark:text-orange-300">
            <p className="font-medium mb-1">What happens when you convert?</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>The task will be linked to the selected event</li>
              <li>Task history and comments will be preserved</li>
              <li>The department field will be cleared</li>
              <li>Event phase will be set if specified</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-border/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={converting}>
            Cancel
          </Button>
          <Button
            onClick={handleConvert}
            disabled={converting || !selectedEventId}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {converting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Convert Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

