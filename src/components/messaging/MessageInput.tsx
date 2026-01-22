import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Send, Paperclip, X, Smile, Image as ImageIcon, Upload, Loader2 } from 'lucide-react'
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
import type { Message, User } from '../../types/message'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]
const ACCEPTED_FILE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx']
const FILE_TYPES_LABEL = 'JPG, PNG, WEBP, GIF, PDF, DOC, DOCX, XLS, XLSX'

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
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
  const [mentionDropdownPosition, setMentionDropdownPosition] = useState({ top: 0, left: 0 })
  const [mentionedUsers, setMentionedUsers] = useState<Map<string, number>>(new Map())

  // Modern alerts system
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

  // Typing indicator hook
  const { startTyping, stopTyping } = useTypingIndicator({
    conversationId,
    currentUserId: user?.id ?? null,
  })

  // Mention detection
  const { mentionState, insertMention } = useMentionDetection(content, cursorPosition)
  const { data: searchResults = [], isLoading: isSearching } = useUserSearch(
    mentionState.query,
    conversationId || undefined
  )

  const handleEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji
    const currentContent = content
    const newContent = currentContent + emoji
    handleContentChange(newContent)
    setIsEmojiPickerOpen(false)

    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
  }

  // Custom content change handler with typing indicators and cursor tracking
  const handleContentChangeWithTyping = (newContent: string) => {
    handleContentChange(newContent)

    // Update cursor position
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart || 0)
    }

    // Start typing if there's content and user is typing
    if (newContent.trim().length > 0) {
      startTyping()
    } else {
      stopTyping()
    }
  }

  // Handle cursor position changes
  const handleCursorChange = useCallback(() => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart || 0)
    }
  }, [])

  // Handle mention selection
  const handleMentionSelect = useCallback((user: User) => {
    const newContent = insertMention(user.name, user.id)
    handleContentChange(newContent)

    // Store the mapping of username to user ID
    setMentionedUsers(prev => new Map(prev).set(user.name, user.id))

    // Reset mention state
    setSelectedMentionIndex(0)

    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus()
      // Set cursor position after the mention
      const newCursorPos = mentionState.startIndex + user.name.length + 2 // +2 for @ and space
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos)
      setCursorPosition(newCursorPos)
    }, 0)
  }, [insertMention, handleContentChange, mentionState.startIndex])

  // Reset selected index when search results change
  useEffect(() => {
    setSelectedMentionIndex(0)
  }, [searchResults])

  // Calculate mention dropdown position
  useEffect(() => {
    if (mentionState.isActive && textareaRef.current) {
      const textarea = textareaRef.current
      const { top, left } = textarea.getBoundingClientRect()

      // Approximate position based on cursor (this is simplified)
      // In a production app, you'd want more accurate positioning
      setMentionDropdownPosition({
        top: top - 300, // Position above the textarea
        left: left + 20,
      })
    }
  }, [mentionState.isActive])

  const handleSend = async () => {
    if (!canSend || !recipientId || !user?.id || sendMessageMutation.isPending) return

    // Extract event ID from conversation ID for group messages
    const eventId = conversationId?.startsWith('event_')
      ? parseInt(conversationId.replace('event_', ''))
      : undefined

    // Create optimistic message
    const optimisticMessage = {
      id: `temp_${Date.now()}`,
      tempId: `temp_${Date.now()}`,
      content: content.trim(),
      sender_id: user.id,
      recipient_id: recipientId,
      event_id: eventId,
      parent_message_id: replyingTo?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: {
        id: user.id,
        name: user.name || 'You',
        email: user.email || '',
        profile_image: user.profile_image,
        role: user.role || 'user',
        created_at: '',
        updated_at: '',
      },
      recipient: {
        id: recipientId,
        name: 'Recipient',
        email: '',
        profile_image: undefined,
        role: 'user',
        created_at: '',
        updated_at: '',
      },
      parentMessage: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content,
        sender: replyingTo.sender,
        created_at: replyingTo.created_at,
      } : undefined,
      isOptimistic: true,
      status: 'sending',
      file_path: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
      file_name: selectedFile?.name,
      file_type: selectedFile?.type,
      file_size: selectedFile?.size,
    }

    // Add optimistic message immediately
    if (onOptimisticMessage) {
      onOptimisticMessage(optimisticMessage)
    }

    // Play sound for sent message
    playMessageSent()

    // Stop typing indicator
    stopTyping()

    // Clear input
    reset()
    if (onCancelReply) {
      onCancelReply()
    }

    try {
      const messageData = {
        recipient_id: recipientId,
        content: content.trim(),
        parent_message_id: replyingTo?.id,
        file: selectedFile || undefined,
      }

      const response = await sendMessageMutation.mutateAsync(messageData)

      if (onMessageSent) {
        onMessageSent(response.data)
      }
    } catch (error: any) {
      console.error('Failed to send message:', error)

      // Handle authorization errors (403)
      if (error?.response?.status === 403) {
        const errorMessage = error?.response?.data?.error || 'You are not authorized to message this user'
        showError('Message Not Allowed', errorMessage)
      } else {
        showError('Message not sent', 'Something went wrong while sending. Please try again.')
      }
      // The optimistic message will show as failed
      // The parent component should handle retry logic
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle mention dropdown navigation
    if (mentionState.isActive && searchResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedMentionIndex(prev =>
          prev < searchResults.length - 1 ? prev + 1 : 0
        )
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedMentionIndex(prev =>
          prev > 0 ? prev - 1 : searchResults.length - 1
        )
        return
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        const selectedUser = searchResults[selectedMentionIndex]
        if (selectedUser) {
          handleMentionSelect(selectedUser)
        }
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        // Reset mention state by moving cursor
        textareaRef.current?.setSelectionRange(content.length, content.length)
        return
      }
    }

    // Regular send message on Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const validateFile = useCallback((file: File) => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      showError('Unsupported File Type', `Allowed types: ${FILE_TYPES_LABEL}`)
      return false
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      showError('File Too Large', 'File size must be less than 10MB')
      return false
    }
    return true
  }, [showError])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!validateFile(file)) {
        e.target.value = ''
        return
      }
      handleFileSelect(file)
    }
  }

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => prev + 1)
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => prev - 1)
    if (dragCounter === 1) {
      setIsDragOver(false)
    }
  }, [dragCounter])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setDragCounter(0)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0] // Only handle first file for now

      if (!validateFile(file)) {
        return
      }

      handleFileSelect(file)
    }
  }, [showError, handleFileSelect, validateFile])

  // Paste handler for images
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find(item => item.type.startsWith('image/'))

    if (imageItem) {
      const file = imageItem.getAsFile()
      if (file) {
        if (!validateFile(file)) {
          return
        }
        handleFileSelect(file)
      }
    }
  }, [showError, handleFileSelect, validateFile])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />
    }
    return <Paperclip className="w-4 h-4" />
  }

  if (!conversationId) {
    return (
      <div className="p-6 border-t border-border bg-muted/30 text-center text-muted-foreground">
        <p className="text-sm font-medium">Select a conversation to start messaging</p>
      </div>
    )
  }

  return (
    <div
      className="bg-white dark:bg-gray-950 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-x-2 -top-12 bottom-2 bg-primary/5 dark:bg-primary/10 border-2 border-dashed border-primary/30 rounded-2xl flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <p className="text-primary font-bold text-sm">Drop to upload</p>
          </div>
        </div>
      )}

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="flex-1 min-w-0 border-l-4 border-primary pl-3">
              <p className="text-[11px] font-bold text-primary truncate">
                Replying to {replyingTo.sender.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {replyingTo.file_path && !replyingTo.content
                  ? `📎 Attachment`
                  : replyingTo.content
                }
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancelReply}
              className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* File preview */}
      {selectedFile && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                {getFileIcon(selectedFile)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-gray-400 font-medium">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFile}
              className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="py-2">
        <div className="flex items-end gap-2">
          {/* File upload button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-11 w-11 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept={ACCEPTED_FILE_EXTENSIONS.join(',')}
          />

          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChangeWithTyping(e.target.value)}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              onSelect={handleCursorChange}
              onClick={handleCursorChange}
              placeholder="Type a message..."
              className="min-h-[44px] max-h-32 resize-none border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-950 focus:ring-0 focus:border-primary/50 rounded-xl pr-12 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 transition-all py-3"
              rows={1}
            />

            {/* Emoji button */}
            <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1.5 bottom-1.5 h-8 w-8 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                  title="Add emoji"
                >
                  <Smile className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 shadow-2xl border-gray-100 dark:border-gray-800 rounded-xl mb-4" align="end">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width={320}
                  height={400}
                  searchDisabled={false}
                  skinTonesDisabled={false}
                  previewConfig={{
                    showPreview: true,
                    defaultEmoji: '1f60a',
                    defaultCaption: 'Choose an emoji'
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            onClick={handleSend}
            disabled={!canSend || sendMessageMutation.isPending}
            className={cn(
              "h-11 w-11 rounded-xl shadow-lg transition-all duration-200 shrink-0",
              canSend
                ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20 scale-100 hover:scale-105 active:scale-95"
                : "bg-gray-100 dark:bg-gray-900 text-gray-400 cursor-not-allowed shadow-none"
            )}
            title="Send"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 translate-x-0.5 -translate-y-0.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mention Dropdown */}
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
