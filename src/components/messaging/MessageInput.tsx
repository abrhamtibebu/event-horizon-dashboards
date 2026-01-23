import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Send, Paperclip, X, Smile, Image as ImageIcon, Upload, Loader2, Plus, Zap } from 'lucide-react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import EmojiPicker from 'emoji-picker-react'
import { useMessageInput, useSendDirectMessage } from '../../hooks/use-messages'
import { useModernAlerts } from '../../hooks/useModernAlerts'
import { useTypingIndicator } from '../../hooks/use-typing-indicator'
import { useAuth } from '../../hooks/use-auth'
import { usePermissionCheck } from '../../hooks/use-permission-check'
import { useMentionDetection } from '../../hooks/use-mention-detection'
import { useUserSearch } from '../../hooks/use-user-search'
import { MentionDropdown } from './MentionDropdown'
import { playMessageSent } from '../../lib/sounds'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import type { Message, User } from '../../types/message'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const ACCEPTED_FILE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx']

interface MessageInputProps {
  conversationId: string | null
  recipientId?: number
  onMessageSent?: (message: Message) => void
  onOptimisticMessage?: (message: any) => void
  replyingTo?: Message | null
  onCancelReply?: () => void
  isGroup?: boolean
}

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  recipientId,
  onMessageSent,
  onOptimisticMessage,
  replyingTo,
  onCancelReply,
  isGroup = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
  const [mentionDropdownPosition, setMentionDropdownPosition] = useState({ top: 0, left: 0 })

  const { showError } = useModernAlerts()
  const { user } = useAuth()
  const { checkPermission } = usePermissionCheck()

  const {
    content,
    selectedFile,
    canSend,
    handleContentChange,
    handleFileSelect,
    clearFile,
    reset,
  } = useMessageInput()

  const sendMessageMutation = useSendDirectMessage()

  const { startTyping, stopTyping } = useTypingIndicator({
    conversationId,
    currentUserId: user?.id ?? null,
  })

  // Mention logic
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

  const handleMentionSelect = useCallback((user: User) => {
    const newContent = insertMention(user.name, user.id)
    handleContentChange(newContent)
    setSelectedMentionIndex(0)
    setTimeout(() => {
      textareaRef.current?.focus()
      const newPos = mentionState.startIndex + user.name.length + 2
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
    if (!canSend || !recipientId || !user?.id || sendMessageMutation.isPending) return

    const eventId = conversationId?.startsWith('event_') ? parseInt(conversationId.replace('event_', '')) : undefined

    // Optimistic UI handled by parent through MessageThread
    playMessageSent()
    stopTyping()
    reset()
    if (onCancelReply) onCancelReply()

    try {
      const response = await sendMessageMutation.mutateAsync({
        recipient_id: recipientId,
        content: content.trim(),
        parent_message_id: replyingTo?.id,
        file: selectedFile || undefined,
      })
      if (onMessageSent) onMessageSent(response.data)
    } catch (error: any) {
      showError('Failed to send', 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="relative flex flex-col gap-4">
      {/* Reply Banner */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
              <div className="flex-1 min-w-0 flex items-center gap-3">
                <div className="w-1 bg-orange-500 h-8 rounded-full shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-0.5">Replying to {replyingTo.sender.name}</p>
                  <p className="text-xs text-muted-foreground truncate italic">{replyingTo.content || "📎 Shared Asset"}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onCancelReply} className="h-7 w-7 rounded-full text-orange-600">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Controls */}
      <div className="flex items-end gap-3 p-2 bg-muted/30 dark:bg-muted/10 rounded-[2.5rem] border border-border/40 focus-within:border-orange-500/30 transition-all duration-500 shadow-sm focus-within:shadow-orange-500/5">
        <div className="flex items-center gap-1 pl-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-11 w-11 rounded-full text-muted-foreground hover:text-orange-600 hover:bg-orange-50 transition-colors"
          >
            <Plus className="h-5 w-5" />
          </Button>
          <input ref={fileInputRef} type="file" onChange={(e) => handleFileSelect(e.target.files?.[0]!)} className="hidden" accept={ACCEPTED_FILE_EXTENSIONS.join(',')} />

          <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full text-muted-foreground hover:text-orange-600 hover:bg-orange-50 transition-colors"
              >
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl mb-4" align="start">
              <EmojiPicker onEmojiClick={handleEmojiClick} width={340} height={420} theme={'auto' as any} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1 min-w-0 py-1">
          {selectedFile && (
            <div className="mb-2 p-2 rounded-2xl bg-background border border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2 pr-4">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-xs font-bold truncate max-w-[150px]">{selectedFile.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={clearFile} className="h-7 w-7 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChangeWithTyping(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Write something thoughtful..."
            className="min-h-[44px] max-h-32 resize-none border-none bg-transparent focus-visible:ring-0 px-1 py-3 text-sm font-medium placeholder:text-muted-foreground/40 leading-relaxed"
          />
        </div>

        <div className="pr-1.5 pb-1.5 flex items-center gap-2">
          {content.trim() && (
            <div className="hidden sm:flex text-[9px] font-black uppercase tracking-[0.2em] text-orange-600/40 mr-2 items-center gap-1">
              <Zap className="h-3 w-3 fill-current" />
              Hit Enter
            </div>
          )}
          <Button
            onClick={handleSend}
            disabled={!canSend || sendMessageMutation.isPending}
            className={cn(
              "h-11 w-11 rounded-full shadow-xl transition-all duration-500",
              canSend
                ? "bg-orange-600 text-white hover:bg-orange-700 hover:scale-105 shadow-orange-600/20"
                : "bg-muted text-muted-foreground/40 shadow-none scale-95"
            )}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5 translate-x-0.5 -translate-y-0.5" />
            )}
          </Button>
        </div>
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
