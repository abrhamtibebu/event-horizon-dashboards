import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Send, X, Smile, Image as ImageIcon, Loader2, Heart } from 'lucide-react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import EmojiPicker from 'emoji-picker-react'
import { useMessageInput, useSendDirectMessage, useSendEventMessage } from '../../hooks/use-messages'
import { useModernAlerts } from '../../hooks/useModernAlerts'
import { useTypingIndicator } from '../../hooks/use-typing-indicator'
import { useAuth } from '../../hooks/use-auth'
import { useMentionDetection } from '../../hooks/use-mention-detection'
import { useUserSearch } from '../../hooks/use-user-search'
import { MentionDropdown } from './MentionDropdown'
import { playMessageSent } from '../../lib/sounds'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import type { Message, User } from '../../types/message'

const ACCEPTED_FILE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx']

interface MessageInputProps {
  conversationId: string | null
  recipientId?: number
  onMessageSent?: (message: Message) => void
  onOptimisticMessage?: (message: any) => void
  replyingTo?: Message | null
  onCancelReply?: () => void
  isGroup?: boolean
  variant?: 'default' | 'compact'
}

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  recipientId,
  onMessageSent,
  onOptimisticMessage,
  replyingTo,
  onCancelReply,
  variant = 'default',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
  const [mentionDropdownPosition, setMentionDropdownPosition] = useState({ top: 0, left: 0 })

  const { showError } = useModernAlerts()
  const { user } = useAuth()
  const isCompact = variant === 'compact'

  const {
    content,
    selectedFile,
    canSend,
    handleContentChange,
    handleFileSelect,
    clearFile,
    reset,
  } = useMessageInput()

  const sendDirectMutation = useSendDirectMessage()
  const sendEventMutation = useSendEventMessage()

  const isEvent = Boolean(conversationId?.startsWith('event_'))
  const eventId = isEvent && conversationId ? conversationId.replace('event_', '') : null
  const isPending = sendDirectMutation.isPending || sendEventMutation.isPending
  const canActuallySend = canSend && !!recipientId && !!user?.id && !isPending

  const { startTyping, stopTyping } = useTypingIndicator({
    conversationId,
    currentUserId: user?.id ? Number(user.id) : null,
  })

  const { mentionState, insertMention } = useMentionDetection(content, cursorPosition)
  const { data: searchResults = [], isLoading: isSearching } = useUserSearch(
    mentionState.query,
    conversationId || undefined
  )

  const handleEmojiClick = (emojiData: any) => {
    handleContentChange(content + emojiData.emoji)
    setIsEmojiPickerOpen(false)
    textareaRef.current?.focus()
  }

  const handleContentChangeWithTyping = (newContent: string) => {
    handleContentChange(newContent)
    if (textareaRef.current) setCursorPosition(textareaRef.current.selectionStart || 0)
    if (newContent.trim().length > 0) startTyping()
    else stopTyping()
  }

  const handleMentionSelect = useCallback((mentionUser: User) => {
    const newContent = insertMention(mentionUser.name, mentionUser.id)
    handleContentChange(newContent)
    setSelectedMentionIndex(0)
    setTimeout(() => {
      textareaRef.current?.focus()
      const newPos = mentionState.startIndex + mentionUser.name.length + 2
      textareaRef.current?.setSelectionRange(newPos, newPos)
      setCursorPosition(newPos)
    }, 0)
  }, [insertMention, handleContentChange, mentionState.startIndex])

  useEffect(() => {
    if (mentionState.isActive && textareaRef.current) {
      const rect = textareaRef.current.getBoundingClientRect()
      setMentionDropdownPosition({ top: rect.top - 320, left: rect.left })
    }
  }, [mentionState.isActive])

  const handleSend = async () => {
    if (!canActuallySend || !recipientId || !user?.id) return

    const trimmed = content.trim()
    const tempId = `temp_${Date.now()}`
    const parsedEventId = eventId ? parseInt(eventId, 10) : undefined

    onOptimisticMessage?.({
      tempId,
      content: trimmed,
      sender_id: user.id,
      recipient_id: recipientId,
      event_id: parsedEventId,
      file: selectedFile || undefined,
      parent_message_id: replyingTo?.id,
      sender: {
        id: user.id,
        name: (user as any).username || (user as any).name || 'You',
        profile_image: (user as any).profile_image,
      },
      created_at: new Date().toISOString(),
    })

    playMessageSent()
    stopTyping()
    reset()
    onCancelReply?.()

    try {
      const payload = {
        recipient_id: recipientId,
        content: trimmed,
        parent_message_id: typeof replyingTo?.id === 'number' ? replyingTo.id : undefined,
        file: selectedFile || undefined,
        temp_id: tempId,
      }

      if (isEvent && eventId) {
        const response = await sendEventMutation.mutateAsync({
          eventId,
          data: payload,
        })
        onMessageSent?.(response.data)
      } else {
        const response = await sendDirectMutation.mutateAsync(payload)
        onMessageSent?.(response.data)
      }
    } catch {
      showError('Failed to send', 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className={cn('relative flex flex-col', isCompact ? 'gap-2' : 'gap-3')}>
      {!recipientId && (
        <p className="text-xs text-muted-foreground px-1">
          Choose who to message before sending.
        </p>
      )}

      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/60 border border-border/50">
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <div className="w-0.5 bg-foreground h-8 rounded-full shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    Replying to {replyingTo.sender?.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {replyingTo.content || 'Attachment'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onCancelReply} className="h-7 w-7 rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          'flex items-end gap-1 border border-border bg-background focus-within:border-muted-foreground/40 transition-colors',
          isCompact ? 'rounded-3xl px-2 py-1' : 'rounded-full px-2 py-1.5'
        )}
      >
        <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('rounded-full text-muted-foreground shrink-0', isCompact ? 'h-8 w-8' : 'h-9 w-9')}
            >
              <Smile className={isCompact ? 'h-4 w-4' : 'h-5 w-5'} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none rounded-2xl mb-2" align="start">
            <EmojiPicker onEmojiClick={handleEmojiClick} width={320} height={380} theme={'auto' as any} />
          </PopoverContent>
        </Popover>

        <div className="flex-1 min-w-0">
          {selectedFile && (
            <div className="mb-1 px-2 py-1 rounded-lg bg-muted flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs truncate">{selectedFile.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={clearFile} className="h-6 w-6 rounded-full">
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChangeWithTyping(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={recipientId ? 'Message...' : 'Select a recipient...'}
            disabled={!recipientId}
            className={cn(
              'resize-none border-none bg-transparent focus-visible:ring-0 px-1 text-sm leading-relaxed',
              isCompact ? 'min-h-[32px] max-h-24 py-1.5' : 'min-h-[36px] max-h-28 py-2'
            )}
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
          accept={ACCEPTED_FILE_EXTENSIONS.join(',')}
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={!recipientId}
          className={cn('rounded-full text-muted-foreground shrink-0', isCompact ? 'h-8 w-8' : 'h-9 w-9')}
        >
          <ImageIcon className={isCompact ? 'h-4 w-4' : 'h-5 w-5'} />
        </Button>

        {content.trim() || selectedFile ? (
          <Button
            onClick={handleSend}
            disabled={!canActuallySend}
            variant="ghost"
            size="icon"
            className={cn('rounded-full text-primary shrink-0', isCompact ? 'h-8 w-8' : 'h-9 w-9')}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className={cn('rounded-full text-muted-foreground shrink-0', isCompact ? 'h-8 w-8' : 'h-9 w-9')}
            onClick={() => handleContentChange(content + '❤️')}
            disabled={!recipientId}
          >
            <Heart className={isCompact ? 'h-4 w-4' : 'h-5 w-5'} />
          </Button>
        )}
      </div>

      {mentionState.isActive && (searchResults.length > 0 || isSearching) && (
        <MentionDropdown
          users={searchResults}
          isLoading={isSearching}
          selectedIndex={selectedMentionIndex}
          onSelect={handleMentionSelect}
          position={mentionDropdownPosition}
        />
      )}
    </div>
  )
}
