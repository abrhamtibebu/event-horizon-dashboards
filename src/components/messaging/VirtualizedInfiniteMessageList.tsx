import React, { useMemo, useRef, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'
import { OptimisticMessageBubble } from './OptimisticMessageBubble'
import { DateSeparator } from './DateSeparator'
import type { Message } from '../../types/message'

interface VirtualizedInfiniteMessageListProps {
  messages: (Message | any)[]
  currentUserId: number
  onReply: (message: Message) => void
  onDelete: (messageId: number) => void
  onImageClick?: (imageUrl: string) => void
  onRetry?: (tempId: string) => void
  isGroup?: boolean
  conversationId?: string
  onLoadMore?: () => void
  hasMore?: boolean
  isLoading?: boolean
  itemHeight?: number
  containerHeight?: number
  overscan?: number
  onPin?: (messageId: number) => void
  onUnpin?: (messageId: number) => void
  onOpenThread?: (message: Message) => void
}

interface MessageItem {
  type: 'message' | 'date'
  data: Message | any | string
  index: number
}

export const VirtualizedInfiniteMessageList: React.FC<VirtualizedInfiniteMessageListProps> = ({
  messages,
  currentUserId,
  onReply,
  onDelete,
  onImageClick,
  onRetry,
  isGroup = false,
  conversationId,
  onLoadMore,
  hasMore,
  isLoading,
  onPin,
  onUnpin,
  onOpenThread,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef<HTMLDivElement>(null)

  // Group messages by date and add date separators
  const messageItems = useMemo(() => {
    if (messages.length === 0) return []

    const items: MessageItem[] = []
    let currentDate = ''

    messages.forEach((message, index) => {
      const messageDate = new Date(message.created_at).toDateString()
      
      // Add date separator if date changed
      if (messageDate !== currentDate) {
        items.push({
          type: 'date',
          data: messageDate,
          index: items.length,
        })
        currentDate = messageDate
      }

      // Add message
      items.push({
        type: 'message',
        data: message,
        index: items.length,
      })
    })

    return items
  }, [messages])

  // Determine if we should show avatar for a message
  const shouldShowAvatar = (message: Message | any, index: number) => {
    if (isGroup && message.sender_id !== currentUserId) {
      // Show avatar if it's the first message from this sender in a group
      const previousMessage = messages[index - 1]
      return !previousMessage || previousMessage.sender_id !== message.sender_id
    }
    return false
  }

  // Intersection Observer for loading more messages
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore?.()
        }
      },
      { threshold: 0.1 }
    )

    if (loadingRef.current) {
      observer.observe(loadingRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoading, onLoadMore])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messageItems.length])

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">💬</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No messages yet</h3>
        <p className="text-sm text-gray-500">Start the conversation by sending a message</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-4 min-h-0 message-thread-scrollbar"
      >
        {/* Load more trigger */}
        {hasMore && (
          <div ref={loadingRef} className="flex justify-center py-4">
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            ) : (
              <div className="text-xs text-gray-500">Scroll up to load more messages</div>
            )}
          </div>
        )}

        {/* Messages */}
        {messageItems.map((item, index) => {
          if (item.type === 'date') {
            return (
              <DateSeparator key={`date-${index}`} date={item.data} />
            )
          }

          const message = item.data
          const isOptimistic = message.isOptimistic || message.tempId
          const showAvatar = shouldShowAvatar(message, messageItems.findIndex(m => m.data === message))

          return (
            <div key={message.id || message.tempId || index}>
              {isOptimistic ? (
                <OptimisticMessageBubble
                  message={message}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onDelete={onDelete}
                  onRetry={onRetry}
                  showAvatar={showAvatar}
                  isGroup={isGroup}
                  onImageClick={onImageClick}
                  conversationId={conversationId}
                />
              ) : (
                <MessageBubble
                  message={message}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onDelete={onDelete}
                  showAvatar={showAvatar}
                  isGroup={isGroup}
                  onImageClick={onImageClick}
                  conversationId={conversationId}
                  onPin={onPin}
                  onUnpin={onUnpin}
                  onOpenThread={onOpenThread}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}