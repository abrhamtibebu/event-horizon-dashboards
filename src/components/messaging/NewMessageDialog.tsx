import React from 'react'
import { Dialog, DialogContent } from '../ui/dialog'
import { MessagesComposeView } from './MessagesComposeView'
import type { User, Event } from '../../types/message'

interface NewMessageDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelectUser: (user: User) => void
  onSelectEvent?: (event: Event) => void
  events?: Event[]
}

/** Full-page compose modal — same Instagram compose body as the floating tray. */
export const NewMessageDialog: React.FC<NewMessageDialogProps> = ({
  isOpen,
  onClose,
  onSelectUser,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-md h-[min(85vh,560px)] p-0 overflow-hidden flex flex-col gap-0">
        <div className="h-12 px-4 border-b border-border flex items-center justify-center shrink-0">
          <h2 className="text-base font-semibold">New message</h2>
        </div>
        <MessagesComposeView
          enabled={isOpen}
          onChat={(user) => {
            onSelectUser(user)
            onClose()
          }}
          className="flex-1 min-h-0"
        />
      </DialogContent>
    </Dialog>
  )
}
