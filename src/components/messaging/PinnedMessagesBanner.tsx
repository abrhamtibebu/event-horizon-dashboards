import React, { useState } from 'react'
import { Pin, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'
import type { Message } from '../../types/message'

interface PinnedMessagesBannerProps {
  pinnedMessages: Message[]
  onUnpin: (messageId: number) => void
  onJumpToMessage?: (messageId: number) => void
  conversationId: string
}

export const PinnedMessagesBanner: React.FC<PinnedMessagesBannerProps> = ({
  pinnedMessages,
  onUnpin,
  onJumpToMessage,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (pinnedMessages.length === 0) return null

  return (
    <div className="border-b border-border bg-muted/40">
      <button
        type="button"
        onClick={() => setIsExpanded(v => !v)}
        className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Pin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">
              {pinnedMessages.length} pinned
            </p>
            {!isExpanded && (
              <p className="text-xs text-muted-foreground truncate">
                {pinnedMessages[0].content || 'Attachment'}
              </p>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 space-y-2 max-h-48 overflow-y-auto">
          {pinnedMessages.map((message) => (
            <div
              key={message.id}
              className="rounded-xl border border-border bg-background px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-medium truncate">{message.sender?.name}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(message.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {message.content || 'Attachment'}
              </p>
              <div className="flex items-center gap-2">
                {onJumpToMessage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => onJumpToMessage(Number(message.id))}
                  >
                    Jump
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => onUnpin(Number(message.id))}
                >
                  Unpin
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
