import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { RefreshCw, AlertCircle, Check, CheckCheck, Download, Reply, Trash2, MoreVertical, MessageCircle, MessageSquare } from 'lucide-react'
import { useDeleteMessage, useMarkMessageRead } from '../../hooks/use-messages'
import { useTypingIndicator } from '../../hooks/use-typing-indicator'
import { usePaginatedMessages } from '../../hooks/use-paginated-messages'
import { useOptimisticMessages } from '../../hooks/use-optimistic-messages'
import { useRealtimeMessages } from '../../hooks/use-realtime-messages'
import { usePinnedMessages, usePinMessage, useUnpinMessage } from '../../hooks/use-pinned-messages'
import { VirtualizedInfiniteMessageList } from './VirtualizedInfiniteMessageList'
import { ImageLightbox } from './ImageLightbox'
import { TypingIndicator } from './TypingIndicator'
import { PinnedMessagesBanner } from './PinnedMessagesBanner'
import type { Message } from '../../types/message'
import { getMessageImageUrl, getMessageFileUrl } from '../../lib/image-utils'

interface MessageThreadProps {
  conversationId: string | null
  currentUserId: number
  onReply: (message: Message) => void
  onOptimisticMessage?: (message: any) => void
  onOpenThread?: (message: Message) => void
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  conversationId,
  currentUserId,
  onReply,
  onOptimisticMessage,
  onOpenThread,
}) => {
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  // Initialize real-time messaging (disabled for now, using polling instead)
  // useRealtimeMessages()

  // Use optimistic messages hook first
  const {
    optimisticMessages,
    addOptimisticMessage,
    confirmMessage,
    failMessage,
    retryMessage,
    removeOptimisticMessage,
  } = useOptimisticMessages({
    onAddMessage: () => { }, // Will be set after usePaginatedMessages
    onUpdateMessage: () => { }, // Will be set after usePaginatedMessages
    onRemoveMessage: () => { }, // Will be set after usePaginatedMessages
  })

  // Use paginated messages hook
  const {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    addMessage,
    updateMessage,
    removeMessage,
  } = usePaginatedMessages({
    conversationId,
    currentUserId,
    pageSize: 50,
    onConfirmOptimisticMessage: confirmMessage,
  })

  const deleteMessageMutation = useDeleteMessage()
  const markMessageReadMutation = useMarkMessageRead()

  // Pinned messages
  const { data: pinnedMessages = [] } = usePinnedMessages(conversationId)
  const pinMessageMutation = usePinMessage()
  const unpinMessageMutation = useUnpinMessage()

  // Typing indicator hook
  const { typingUsers } = useTypingIndicator({ conversationId, currentUserId })

  // Combine regular messages with optimistic messages
  const allMessages = useMemo(() => {
    // Filter out optimistic messages that have been confirmed (to avoid duplicates)
    const confirmedOptimisticIds = new Set(messages.map(m => (m as any).tempId).filter(Boolean))
    const filteredOptimistic = optimisticMessages.filter(opt => !confirmedOptimisticIds.has(opt.tempId))

    const combined = [...messages, ...filteredOptimistic] as (Message | any)[]
    const sorted = combined.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    console.log('All messages combined:', {
      regular: messages.length,
      optimistic: filteredOptimistic.length,
      total: sorted.length,
      conversationId
    })

    return sorted
  }, [messages, optimisticMessages, conversationId])

  // Extract images for lightbox
  useEffect(() => {
    const imageUrls = allMessages
      .filter(msg => msg.file_type?.startsWith('image/') && (msg.file_path || msg.file_url))
      .map(msg => getMessageImageUrl(msg as Message, 'original') || getMessageFileUrl(msg))
      .filter((url): url is string => Boolean(url))

    setLightboxImages(imageUrls)
  }, [allMessages])

  const openLightbox = (imageUrl: string) => {
    const index = lightboxImages.indexOf(imageUrl)
    if (index !== -1) {
      setLightboxIndex(index)
      setIsLightboxOpen(true)
    }
  }

  // Mark messages as read when they're viewed
  useEffect(() => {
    if (messages.length > 0 && currentUserId) {
      // Get unread messages that the current user received
      const unreadMessages = messages.filter(msg =>
        msg.recipient_id === currentUserId && !msg.read_at
      )

      // Mark each unread message as read individually
      unreadMessages.forEach(msg => {
        markMessageReadMutation.mutate(msg.id.toString())
      })
    }
  }, [messages, currentUserId]) // Remove markMessageReadMutation from dependencies

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await deleteMessageMutation.mutateAsync(messageId.toString())
      // Remove message from local state immediately
      removeMessage(messageId)
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  // Handle optimistic message updates
  const handleOptimisticMessage = useCallback((message: any) => {
    if (!message) {
      console.warn('Received null optimistic message')
      return
    }
    console.log('Adding optimistic message to MessageThread:', message)
    addOptimisticMessage(
      message.content,
      message.sender_id,
      message.recipient_id,
      message.event_id,
      message.file,
      message.parent_message_id
    )
  }, [addOptimisticMessage])

  // Expose optimistic message handler to parent
  useEffect(() => {
    if (onOptimisticMessage) {
      onOptimisticMessage(handleOptimisticMessage)
    }
  }, [onOptimisticMessage, handleOptimisticMessage])

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-white dark:bg-gray-950 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center mb-6 border border-gray-100 dark:border-gray-800">
          <MessageCircle className="w-10 h-10 text-primary/40" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select a conversation</h3>
        <p className="text-sm text-gray-500 max-w-[240px]">Choose a chat from the list to view your message history.</p>
      </div>
    )
  }

  const handlePinMessage = useCallback((messageId: number) => {
    pinMessageMutation.mutate(messageId)
  }, [pinMessageMutation])

  const handleUnpinMessage = useCallback((messageId: number) => {
    unpinMessageMutation.mutate(messageId)
  }, [unpinMessageMutation])

  const handleJumpToMessage = useCallback((messageId: number) => {
    // TODO: Implement smooth scroll to message
    console.log('Jump to message:', messageId)
  }, [])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 min-h-0">
      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && (
        <div className="flex-shrink-0 animate-in slide-in-from-top duration-300">
          <PinnedMessagesBanner
            pinnedMessages={pinnedMessages}
            onUnpin={handleUnpinMessage}
            onJumpToMessage={handleJumpToMessage}
            conversationId={conversationId || ''}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 relative">
        {allMessages.length === 0 && !isLoading && optimisticMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mb-4 border border-gray-100 dark:border-gray-800">
              <MessageSquare className="w-8 h-8 text-primary/30" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No messages yet</h3>
            <p className="text-sm text-gray-500 max-w-xs">Start the conversation! Your messages will appear here as you type.</p>
          </div>
        ) : (
          <VirtualizedInfiniteMessageList
            messages={allMessages}
            currentUserId={currentUserId}
            onReply={onReply}
            onDelete={handleDeleteMessage}
            onImageClick={openLightbox}
            onRetry={retryMessage}
            isGroup={conversationId?.startsWith('event_')}
            conversationId={conversationId}
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoading={isLoadingMore}
            onPin={handlePinMessage}
            onUnpin={handleUnpinMessage}
            onOpenThread={onOpenThread}
          />
        )}
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={lightboxImages}
        currentIndex={lightboxIndex}
        onIndexChange={setLightboxIndex}
      />
    </div>
  )
}