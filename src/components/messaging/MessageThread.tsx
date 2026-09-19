import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { MessageCircle, MessageSquare } from 'lucide-react'
import { useDeleteMessage } from '../../hooks/use-messages'
import { useTypingIndicator } from '../../hooks/use-typing-indicator'
import { usePaginatedMessages } from '../../hooks/use-paginated-messages'
import { useOptimisticMessages } from '../../hooks/use-optimistic-messages'
import { useRealtimeMessages } from '../../hooks/use-realtime-messages'
import { usePinnedMessages, usePinMessage, useUnpinMessage } from '../../hooks/use-pinned-messages'
import { VirtualizedInfiniteMessageList } from './VirtualizedInfiniteMessageList'
import { ImageLightbox } from './ImageLightbox'
import { TypingIndicator } from './TypingIndicator'
import { PinnedMessagesBanner } from './PinnedMessagesBanner'
import type { Message, User } from '../../types/message'
import { getMessageImageUrl, getMessageFileUrl } from '../../lib/image-utils'
import { cn } from '@/lib/utils'

interface MessageThreadProps {
  conversationId: string | null
  currentUserId: number
  onReply: (message: Message) => void
  onOptimisticMessage?: (handler: (message: any) => void) => void
  compact?: boolean
  onMessagesChange?: (messages: Message[]) => void
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  conversationId,
  currentUserId,
  onReply,
  onOptimisticMessage,
  compact = false,
  onMessagesChange,
}) => {
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  useRealtimeMessages()

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
    onConfirmOptimisticMessage: (tempId, realMessage) => {
      confirmMessage(tempId, realMessage)
    },
  })

  const {
    optimisticMessages,
    addOptimisticMessage,
    confirmMessage,
    retryMessage,
  } = useOptimisticMessages({
    onAddMessage: addMessage,
    onUpdateMessage: updateMessage,
    onRemoveMessage: removeMessage,
  })

  const deleteMessageMutation = useDeleteMessage()
  const { data: pinnedMessages = [] } = usePinnedMessages(conversationId)
  const pinMessageMutation = usePinMessage()
  const unpinMessageMutation = useUnpinMessage()
  const { typingUsers } = useTypingIndicator({ conversationId, currentUserId })

  const allMessages = useMemo(() => {
    const confirmedOptimisticIds = new Set(messages.map(m => (m as any).tempId).filter(Boolean))
    const filteredOptimistic = optimisticMessages.filter(opt => !confirmedOptimisticIds.has(opt.tempId))
    return [...messages, ...filteredOptimistic].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ) as Message[]
  }, [messages, optimisticMessages])

  useEffect(() => {
    onMessagesChange?.(allMessages.filter(m => !(m as any).isOptimistic && !(m as any).tempId))
  }, [allMessages, onMessagesChange])

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

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await deleteMessageMutation.mutateAsync(messageId.toString())
      removeMessage(messageId)
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  const handleOptimisticMessage = useCallback((message: any) => {
    if (!message) return
    addOptimisticMessage(
      message.content,
      message.sender_id,
      message.recipient_id,
      message.event_id,
      message.file,
      message.parent_message_id,
      message.tempId
    )
  }, [addOptimisticMessage])

  useEffect(() => {
    onOptimisticMessage?.(handleOptimisticMessage)
  }, [onOptimisticMessage, handleOptimisticMessage])

  const handlePinMessage = useCallback((messageId: number) => {
    pinMessageMutation.mutate(messageId)
  }, [pinMessageMutation])

  const handleUnpinMessage = useCallback((messageId: number) => {
    unpinMessageMutation.mutate(messageId)
  }, [unpinMessageMutation])

  const handleJumpToMessage = useCallback((messageId: number) => {
    const el = document.getElementById(`message-${messageId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.classList.add('ring-2', 'ring-primary/40')
    setTimeout(() => el?.classList.remove('ring-2', 'ring-primary/40'), 1600)
  }, [])

  const typingAsUsers: User[] = typingUsers.map(u => ({
    id: u.id,
    name: u.name,
    email: '',
    role: '',
    profile_image: u.avatar,
    created_at: '',
    updated_at: '',
  }))

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-background">
        <MessageCircle className="w-10 h-10 text-muted-foreground/40 mb-3" />
        <h3 className="text-base font-semibold mb-1">Select a conversation</h3>
        <p className="text-sm text-muted-foreground max-w-[220px]">
          Choose a chat from the list to view your messages.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full bg-background min-h-0', compact && 'text-sm')}>
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

      <div className="flex-1 min-h-0 relative">
        {allMessages.length === 0 && !isLoading && optimisticMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <h3 className="text-base font-semibold mb-1">No messages yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Send a message to start the conversation.
            </p>
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
          />
        )}
      </div>

      {typingAsUsers.length > 0 && (
        <div className="px-4 py-2 border-t border-border/40">
          <TypingIndicator
            users={typingAsUsers}
            conversationId={conversationId}
            isGroup={conversationId.startsWith('event_')}
          />
        </div>
      )}

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
