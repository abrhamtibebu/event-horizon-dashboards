import React, { useEffect, useState, useMemo, useCallback } from 'react'
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
    onAddMessage: () => {}, // Will be set after usePaginatedMessages
    onUpdateMessage: () => {}, // Will be set after usePaginatedMessages
    onRemoveMessage: () => {}, // Will be set after usePaginatedMessages
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
      <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-muted/30">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <span className="text-3xl">💬</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Select a conversation</h3>
        <p className="text-sm text-muted-foreground">Choose a conversation from the sidebar to start messaging</p>
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
    <div className="flex flex-col h-full bg-muted/30 min-h-0">
      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && (
        <div className="flex-shrink-0">
          <PinnedMessagesBanner
            pinnedMessages={pinnedMessages}
            onUnpin={handleUnpinMessage}
            onJumpToMessage={handleJumpToMessage}
            conversationId={conversationId || ''}
          />
        </div>
      )}

      {/* Messages - Scrollable area with constrained height */}
      <div className="flex-1 min-h-0 relative">
        {allMessages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-md">
              <span className="text-4xl">💬</span>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">No messages yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">Start the conversation by sending a message below. Your messages will appear here.</p>
          </div>
        ) : (
          <div className="h-full flex flex-col">
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
              itemHeight={120}
              containerHeight={600}
              overscan={5}
              onPin={handlePinMessage}
              onUnpin={handleUnpinMessage}
              onOpenThread={onOpenThread}
            />
            
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex-shrink-0 px-4 py-2">
                <TypingIndicator
                  users={typingUsers.map(user => ({
                    id: user.id,
                    name: user.name,
                    email: '',
                    profile_image: user.avatar,
                    role: 'user',
                    created_at: '',
                    updated_at: '',
                  }))}
                  conversationId={conversationId || ''}
                  isGroup={conversationId?.startsWith('event_')}
                />
              </div>
            )}
            
            {/* Debug info for development */}
            {import.meta.env.DEV && (
              <div className="flex-shrink-0 text-xs text-muted-foreground mt-2 p-2 bg-muted rounded mx-4">
                Messages: {messages.length} | Optimistic: {optimisticMessages.length} | Total: {allMessages.length}
                {optimisticMessages.length > 0 && (
                  <div className="mt-1">
                    Optimistic: {optimisticMessages.map(m => `${m.status}(${m.tempId})`).join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
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