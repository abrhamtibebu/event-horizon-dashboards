import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Send, Paperclip, X, Smile, Image as ImageIcon, Upload } from 'lucide-react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import EmojiPicker from 'emoji-picker-react'
import { useMessageInput, useSendDirectMessage } from '../../hooks/use-messages'
import { useModernAlerts } from '../../hooks/useModernAlerts'
import { useTypingIndicator } from '../../hooks/use-typing-indicator'
import { useAuth } from '../../hooks/use-auth'
import { useMentionDetection } from '../../hooks/use-mention-detection'
import { useUserSearch } from '../../hooks/use-user-search'
import { MentionDropdown } from './MentionDropdown'
import { playMessageSent } from '../../lib/sounds'
import type { Message, User } from '../../types/message'

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
    currentUserId: user?.id || 1,
    isGroup,
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
    if (!canSend || !recipientId || !user?.id) return

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
    } catch (error) {
      console.error('Failed to send message:', error)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        showError('File Too Large', 'File size must be less than 10MB')
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
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        showError('File Too Large', 'File size must be less than 10MB')
        return
      }
      
      handleFileSelect(file)
    }
  }, [showError, handleFileSelect])

  // Paste handler for images
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find(item => item.type.startsWith('image/'))
    
    if (imageItem) {
      const file = imageItem.getAsFile()
      if (file) {
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          showError('File Too Large', 'File size must be less than 10MB')
          return
        }
        handleFileSelect(file)
      }
    }
  }, [showError, handleFileSelect])

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
      <div className="p-6 border-t border-slate-200 bg-slate-50 text-center text-slate-500">
        <p className="text-sm font-medium">Select a conversation to start messaging</p>
      </div>
    )
  }

  return (
    <div 
      className="bg-white relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Enhanced Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-blue-600 font-bold text-lg mb-1">Drop file here to upload</p>
            <p className="text-blue-500 text-sm">Supports images, documents, and more</p>
          </div>
        </div>
      )}

      {/* WhatsApp-style Reply indicator */}
      {replyingTo && (
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 shadow-sm">
          <div className="flex items-start justify-between space-x-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 px-3 py-2 bg-white border-l-4 border-blue-500 rounded hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-600 mb-0.5">
                    {replyingTo.sender.name}
                  </p>
                  <p className="text-sm text-slate-700 truncate">
                    {replyingTo.file_path && !replyingTo.content 
                      ? `📎 ${replyingTo.file_name || 'Attachment'}`
                      : (replyingTo.content.length > 60 
                          ? `${replyingTo.content.substring(0, 60)}...` 
                          : replyingTo.content)
                    }
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancelReply}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full flex-shrink-0"
                  title="Cancel reply"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced File preview */}
      {selectedFile && (
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center shadow-sm">
                {getFileIcon(selectedFile)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFile}
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-200 p-2 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Enhanced Input area */}
      <div className="px-6 py-4">
        <div className="flex items-end space-x-3">
          {/* File upload button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 p-2.5 rounded-lg transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
          />
          
          {/* Text input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChangeWithTyping(e.target.value)}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              onSelect={handleCursorChange}
              onClick={handleCursorChange}
              placeholder="Type a message... (use @ to mention someone)"
              className="min-h-[48px] max-h-32 resize-none border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl pr-14 text-slate-900 placeholder:text-slate-400 shadow-sm"
              rows={1}
            />
            
            {/* Emoji button */}
            <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors h-8 w-8"
                  title="Add emoji"
                >
                  <Smile className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 shadow-xl" align="end">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width={300}
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
          
          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={!canSend || sendMessageMutation.isPending}
            className={`rounded-full px-5 py-2.5 h-auto font-semibold shadow-md transition-all ${
              canSend 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white' 
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Character count */}
        <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
          <span>
            {selectedFile && (
              <span className="text-blue-600 flex items-center font-medium">
                <Paperclip className="w-3 h-3 mr-1" />
                {selectedFile.name}
              </span>
            )}
          </span>
          <span className="font-medium">
            {content.length}/2000
          </span>
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
