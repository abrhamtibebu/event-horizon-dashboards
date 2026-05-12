import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, CheckCircle2 } from 'lucide-react'
import BadgeRender from '@/components/Badge'
import type { Attendee } from '@/types/attendee'
import type { BadgeTemplate } from '@/types/badge'

export type PrintBadgeTemplateChoice = 'default' | 'assigned'

interface PrintBadgeTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attendeeForPreview: Attendee | null
  assignedTemplate: BadgeTemplate | null
  onChoose: (choice: PrintBadgeTemplateChoice) => void
}

export default function PrintBadgeTemplateDialog({
  open,
  onOpenChange,
  attendeeForPreview,
  assignedTemplate,
  onChoose,
}: PrintBadgeTemplateDialogProps) {
  const [choice, setChoice] = useState<PrintBadgeTemplateChoice>('default')

  const canUseAssigned = Boolean(assignedTemplate && assignedTemplate.template_json)

  const subtitle = useMemo(() => {
    if (!canUseAssigned) return 'No assigned badge design found for this event.'
    return 'Choose which badge design to print.'
  }, [canUseAssigned])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Choose badge design
          </DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        {!attendeeForPreview ? (
          <div className="text-sm text-muted-foreground py-8">
            Select at least one attendee to preview the badge.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {/* Default */}
            <button
              type="button"
              className={[
                'text-left rounded-xl border p-3 sm:p-4 transition-colors',
                choice === 'default' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40',
              ].join(' ')}
              onClick={() => setChoice('default')}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Default badge</span>
                    <Badge variant="secondary" className="text-[10px]">
                      Built-in
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Prints the standard badge layout.
                  </p>
                </div>
                {choice === 'default' && <CheckCircle2 className="h-5 w-5 text-primary" />}
              </div>
              <div className="mt-3 sm:mt-4 flex justify-center bg-muted/20 rounded-lg p-3 sm:p-4 overflow-hidden">
                <div className="w-full flex justify-center">
                  <div className="scale-[0.7] sm:scale-[0.85] origin-top">
                  <BadgeRender attendee={attendeeForPreview} />
                  </div>
                </div>
              </div>
            </button>

            {/* Assigned */}
            <button
              type="button"
              disabled={!canUseAssigned}
              className={[
                'text-left rounded-xl border p-3 sm:p-4 transition-colors',
                !canUseAssigned ? 'opacity-60 cursor-not-allowed' : '',
                choice === 'assigned' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40',
              ].join(' ')}
              onClick={() => {
                if (!canUseAssigned) return
                setChoice('assigned')
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Assigned badge design</span>
                    <Badge className="text-[10px]">Event</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Prints the badge design saved for this event.
                  </p>
                </div>
                {choice === 'assigned' && <CheckCircle2 className="h-5 w-5 text-primary" />}
              </div>
              <div className="mt-3 sm:mt-4 flex justify-center bg-muted/20 rounded-lg p-3 sm:p-4 overflow-hidden">
                <div className="w-full flex justify-center">
                  <div className="scale-[0.7] sm:scale-[0.85] origin-top">
                  <BadgeRender attendee={attendeeForPreview} template={assignedTemplate} />
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 sm:pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onChoose(choice)
              onOpenChange(false)
            }}
            disabled={choice === 'assigned' && !canUseAssigned}
          >
            Continue to print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

