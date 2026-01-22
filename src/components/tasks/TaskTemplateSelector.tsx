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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TaskTemplate } from '@/types/tasks'
import { Loader2, FileText, Calendar, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { taskApi } from '@/lib/taskApi'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface TaskTemplateSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scopeType?: 'event' | 'general'
  eventId?: number
  onApplied?: () => void
}

export function TaskTemplateSelector({
  open,
  onOpenChange,
  scopeType,
  eventId,
  onApplied,
}: TaskTemplateSelectorProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)

  // Load templates when dialog opens
  useEffect(() => {
    if (open) {
      loadTemplates()
    }
  }, [open])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const category = scopeType === 'event' ? 'event' : scopeType === 'general' ? 'general' : undefined
      const fetchedTemplates = await taskApi.getTemplates(category)
      setTemplates(fetchedTemplates)
    } catch (error) {
      console.error('Error loading templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template')
      return
    }

    setApplying(true)
    try {
      await taskApi.applyTemplate(selectedTemplate.id, eventId)
      toast.success(`Template "${selectedTemplate.name}" applied successfully`)
      onApplied?.()
      onOpenChange(false)
      setSelectedTemplate(null)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to apply template')
    } finally {
      setApplying(false)
    }
  }

  const filteredTemplates = scopeType
    ? templates.filter((t) => t.scope_type === scopeType)
    : templates

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/20 rounded-xl flex items-center justify-center border-2 border-orange-200 dark:border-orange-800">
              <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Select Task Template</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Choose a template to create multiple tasks at once
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No templates available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={cn(
                    'p-4 cursor-pointer transition-all hover:shadow-md border-2',
                    selectedTemplate?.id === template.id
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                      : 'border-border'
                  )}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{template.name}</h4>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            template.scope_type === 'event'
                              ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                              : 'bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          )}
                        >
                          {template.scope_type === 'event' ? (
                            <>
                              <Calendar className="w-3 h-3 mr-1 inline" />
                              Event
                            </>
                          ) : (
                            <>
                              <Briefcase className="w-3 h-3 mr-1 inline" />
                              General
                            </>
                          )}
                        </Badge>
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{template.tasks.length} tasks</span>
                        {template.department && <span>• {template.department}</span>}
                        {template.category && <span>• {template.category}</span>}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-border/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={applying}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={applying || !selectedTemplate}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

