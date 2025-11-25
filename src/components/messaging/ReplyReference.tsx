import React from 'react'
import { Reply } from 'lucide-react'
import type { Message } from '../../types/message'

interface ReplyReferenceProps {
  parentMessage: Message
  onJumpToMessage?: (messageId: number) => void
  className?: string
}

export const ReplyReference: React.FC<ReplyReferenceProps> = ({
  parentMessage,
  onJumpToMessage,
  className = '',
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div
      onClick={() => onJumpToMessage?.(parentMessage.id)}
      className={`flex items-start space-x-2 px-3 py-2 mb-2 bg-slate-100/50 border-l-4 border-blue-500 rounded cursor-pointer hover:bg-slate-100 transition-colors ${className}`}
      title="Jump to original message"
    >
      <Reply className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-blue-600 mb-0.5">
          {parentMessage.sender?.name || 'Unknown User'}
        </p>
        <p className="text-xs text-slate-600 truncate">
          {(parentMessage.file_path || parentMessage.file_url) && !parentMessage.content 
            ? `📎 ${parentMessage.file_name || 'Attachment'}`
            : truncateText(parentMessage.content || 'No content available')
          }
        </p>
      </div>
    </div>
  )
}

