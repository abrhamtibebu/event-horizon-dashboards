import React, { useState } from 'react'
import { Pin, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { ScrollArea } from '../ui/scroll-area'
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
  conversationId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (pinnedMessages.length === 0) {
    return null
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <Pin className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Pinned Messages
            </h3>
            <p className="text-xs text-slate-600">
              {pinnedMessages.length} message{pinnedMessages.length !== 1 ? 's' : ''} pinned
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-600 hover:text-slate-900 hover:bg-amber-100 rounded-lg"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-amber-200 bg-white/50">
          <ScrollArea className="max-h-80">
            <div className="divide-y divide-amber-100">
              {pinnedMessages.map((message) => (
                <div
                  key={message.id}
                  className="px-6 py-4 hover:bg-amber-50/50 transition-colors group"
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={message.sender.profile_image} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                        {getInitials(message.sender.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {message.sender.name}
                          </span>
                          <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                            <Pin className="w-3 h-3 mr-1" />
                            Pinned
                          </Badge>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {formatTimestamp(message.created_at)}
                        </span>
                      </div>

                      <p className="text-sm text-slate-700 mb-2">
                        {truncateContent(message.content)}
                      </p>

                      {/* File attachment indicator */}
                      {message.file_path && (
                        <div className="text-xs text-blue-600 mb-2">
                          📎 {message.file_name || 'Attachment'}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onJumpToMessage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onJumpToMessage(message.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 px-2"
                          >
                            Jump to message
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUnpin(message.id)}
                          className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-7 px-2"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Unpin
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Compact View (when collapsed) */}
      {!isExpanded && pinnedMessages.length > 0 && (
        <div className="px-6 pb-3">
          <div className="text-sm text-slate-700 bg-white/70 rounded-lg p-3 shadow-sm">
            <div className="flex items-center space-x-2">
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarImage src={pinnedMessages[0].sender.profile_image} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                  {getInitials(pinnedMessages[0].sender.name)}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold">{pinnedMessages[0].sender.name}:</span>
              <span className="truncate">{truncateContent(pinnedMessages[0].content, 60)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

