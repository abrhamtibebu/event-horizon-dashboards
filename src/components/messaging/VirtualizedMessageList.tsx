import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { Message } from '../../types/message'

interface VirtualizedMessageListProps {
  messages: Message[]
  currentUserId: number
  onReply: (message: Message) => void
  onDelete: (messageId: number) => void
  onImageClick: (imageUrl: string) => void
  isGroup?: boolean
  itemHeight?: number
  containerHeight?: number
  overscan?: number
}

interface MessageItemProps {
  message: Message
  index: number
  currentUserId: number
  onReply: (message: Message) => void
  onDelete: (messageId: number) => void
  onImageClick: (imageUrl: string) => void
  isGroup?: boolean
  showAvatar: boolean
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUserId,
  onReply,
  onDelete,
  onImageClick,
  isGroup,
  showAvatar,
}) => {
  // Import MessageBubble dynamically to avoid circular dependencies
  const [MessageBubble, setMessageBubble] = useState<React.ComponentType<any> | null>(null)

  useEffect(() => {
    import('./MessageBubble').then(module => {
      setMessageBubble(() => module.MessageBubble)
    })
  }, [])

  if (!MessageBubble) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <MessageBubble
      message={message}
      currentUserId={currentUserId}
      onReply={onReply}
      onDelete={onDelete}
      showAvatar={showAvatar}
      isGroup={isGroup}
      onImageClick={onImageClick}
    />
  )
}

export const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
  messages,
  currentUserId,
  onReply,
  onDelete,
  onImageClick,
  isGroup = false,
  itemHeight = 80, // Estimated height per message
  containerHeight = 600,
  overscan = 5,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeightState, setContainerHeightState] = useState(containerHeight)

  // Update container height when window resizes
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeightState(containerRef.current.clientHeight)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Calculate visible range
  const visibleStart = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const visibleEnd = Math.min(
    messages.length - 1,
    Math.ceil((scrollTop + containerHeightState) / itemHeight) + overscan
  )

  // Get visible messages
  const visibleMessages = messages.slice(visibleStart, visibleEnd + 1)

  // Calculate total height and offset
  const totalHeight = messages.length * itemHeight
  const offsetY = visibleStart * itemHeight

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (containerRef.current && messages.length > 0) {
      const container = containerRef.current
      const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100
      
      if (isNearBottom) {
        container.scrollTop = container.scrollHeight
      }
    }
  }, [messages.length])

  // Group messages by date for proper rendering
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {}
    const formatMessageDate = (timestamp: string) => {
      const date = new Date(timestamp)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      if (date.toDateString() === today.toDateString()) {
        return 'Today'
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday'
      } else {
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      }
    }

    msgs.forEach(msg => {
      const date = formatMessageDate(msg.created_at)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(msg)
    })

    return groups
  }

  const messageGroups = groupMessagesByDate(visibleMessages)

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto"
      onScroll={handleScroll}
      style={{ height: containerHeightState }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {Object.entries(messageGroups).map(([date, dateMessages]) => (
            <div key={date} className="mb-4">
              {/* Date separator */}
              <div className="flex items-center justify-center mb-4">
                <div className="px-3 py-1 bg-white text-gray-600 border border-gray-200 rounded-full text-sm">
                  {date}
                </div>
              </div>
              
              {/* Messages for this date */}
              <div className="space-y-2">
                {dateMessages.map((message, index) => {
                  const showAvatar = index === 0 || dateMessages[index - 1].sender_id !== message.sender_id
                  
                  return (
                    <MessageItem
                      key={message.id}
                      message={message}
                      index={visibleStart + index}
                      currentUserId={currentUserId}
                      onReply={onReply}
                      onDelete={onDelete}
                      onImageClick={onImageClick}
                      isGroup={isGroup}
                      showAvatar={showAvatar}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}




