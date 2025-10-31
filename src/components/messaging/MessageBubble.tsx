import React, { useState } from 'react'
import { MoreVertical, Reply, Trash2, Download, Image as ImageIcon, Check, CheckCheck, Pin, PinOff } from 'lucide-react'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { useModernAlerts } from '../../hooks/useModernAlerts'
import { MessageReactions } from './MessageReactions'
import { MessageReplies } from './MessageReplies'
import { ReadReceipts } from './ReadReceipts'
import { getMessageImageUrl, getOptimalImageSize, getImageAspectRatio } from '../../lib/image-utils'
import MessageContent from './MessageContent'
import type { Message } from '../../types/message'

interface MessageBubbleProps {
  message: Message
  currentUserId: number
  onReply: (message: Message) => void
  onDelete: (messageId: number) => void
  showAvatar?: boolean
  isGroup?: boolean
  onImageClick?: (imageUrl: string) => void
  conversationId?: string
  onPin?: (messageId: number) => void
  onUnpin?: (messageId: number) => void
}

// Quick reaction emojis
const QUICK_REACTIONS = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '👍', label: 'Like' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '😮', label: 'Surprised' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '👏', label: 'Clap' },
]

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUserId,
  onReply,
  onDelete,
  showAvatar = false,
  isGroup = false,
  onImageClick,
  conversationId,
  onPin,
  onUnpin,
}) => {
  const [showReactions, setShowReactions] = useState(false)
  
  const { confirmDelete } = useModernAlerts()
  const isOwnMessage = message.sender_id === currentUserId
  const isPinned = message.is_pinned || false

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleDeleteMessage = async () => {
    await confirmDelete(
      'Message',
      'message',
      async () => {
        onDelete(message.id)
      }
    )
  }

  const handleReaction = async (emoji: string) => {
    console.log('Reaction clicked:', emoji)
  }

  const renderFileAttachment = () => {
    if (!message.file_path) return null

    const isImage = message.file_type?.startsWith('image/')
    const fileUrl = message.file_path?.startsWith('blob:')
      ? message.file_path
      : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${message.file_path}`

    if (isImage) {
      const { width, height } = getOptimalImageSize(
        message.original_width || 0,
        message.original_height || 0,
        200, // Max width
        200  // Max height
      )
      const aspectRatio = getImageAspectRatio(message.original_width, message.original_height)

      return (
        <div className="relative group cursor-pointer" onClick={() => onImageClick?.(fileUrl)}>
          <img
            src={fileUrl}
            alt={message.file_name || 'Attached image'}
            className="rounded-lg object-cover"
            style={{ width: `${width}px`, height: `${height}px`, aspectRatio: aspectRatio || '1/1' }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
            <ImageIcon className="w-6 h-6 text-white" />
          </div>
        </div>
      )
    } else {
      return (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Download className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">{message.file_name}</span>
          <span className="text-xs text-gray-500">({(message.file_size / 1024).toFixed(2)} KB)</span>
        </a>
      )
    }
  }

  const renderReactions = () => {
    return (
      <MessageReactions
        message={message}
        currentUserId={currentUserId}
        className="mt-1"
      />
    )
  }

  return (
    <div className={`flex items-start space-x-3 mb-4 group ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar - Slack style */}
      {!isOwnMessage && (
        <div className="flex-shrink-0">
          <Avatar className="w-9 h-9">
            <AvatarImage src={message.sender.profile_image} />
            <AvatarFallback className="bg-gray-300 text-gray-700 text-sm font-medium">
              {getInitials(message.sender.name)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isOwnMessage ? 'items-end max-w-[480px]' : 'items-start flex-1'}`}>
        {/* Sender name for others */}
        {!isOwnMessage && (
          <span className="text-sm font-bold text-gray-900 mb-1 px-1">
            {message.sender.name}
          </span>
        )}
        
        {/* Message bubble */}
        <div className="relative group w-full">
          <div
            className={`
              relative shadow-sm message-bubble
              ${isOwnMessage 
                ? 'bg-[#7C3AED] text-white rounded-[20px]' 
                : 'bg-white border border-gray-200 text-gray-900 rounded-[20px]'
              }
              hover:shadow transition-all duration-150
            `}
            style={{ maxWidth: isOwnMessage ? '480px' : 'none', wordBreak: 'break-word' }}
          >
            {/* Teams-style Quoted Message (if replying) */}
            {message.parentMessage && (
              <div className={`px-3 pt-3 pb-2 border-l-4 ${
                isOwnMessage 
                  ? 'bg-blue-600/30 border-white/50' 
                  : 'bg-white/60 border-blue-500'
              } rounded-t-2xl`}>
                <div className="flex items-start space-x-2">
                  <Reply className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                    isOwnMessage ? 'text-white/70' : 'text-gray-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold mb-0.5 ${
                      isOwnMessage ? 'text-white/90' : 'text-gray-700'
                    }`}>
                      {message.parentMessage.sender.name}
                    </p>
                    <p className={`text-xs truncate ${
                      isOwnMessage ? 'text-white/80' : 'text-gray-600'
                    }`}>
                      {message.parentMessage.file_path && !message.parentMessage.content 
                        ? `📎 ${message.parentMessage.file_name || 'Attachment'}` 
                        : message.parentMessage.content}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Message content */}
            <div className={`px-4 py-3 break-words overflow-wrap-anywhere ${
              message.parentMessage ? 'pt-2' : ''
            }`}>
              <MessageContent content={message.content} />
            </div>

            {/* File attachment */}
            {message.file_path && (
              <div className={message.parentMessage ? '' : 'px-4'}>
                {renderFileAttachment()}
              </div>
            )}

            {/* Timestamp and status */}
            <div className="flex items-center space-x-2 px-4 pb-3">
              <span className={`text-xs ${isOwnMessage ? 'text-white/80' : 'text-[#9CA3AF]'}`}>
                {formatMessageTime(message.created_at)}
              </span>
              {isOwnMessage && (
                <ReadReceipts 
                  message={message} 
                  currentUserId={currentUserId} 
                  isGroup={isGroup}
                />
              )}
            </div>

            {/* Message actions (reply, delete) */}
            <div className={`absolute top-1/2 -translate-y-1/2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwnMessage ? '-left-16 flex-row-reverse' : '-right-16'}`}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onReply(message)}
                className={`w-8 h-8 p-0 ${isOwnMessage ? 'text-blue-100 hover:bg-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                title="Reply"
              >
                <Reply className="w-4 h-4" />
              </Button>
              {isOwnMessage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`w-8 h-8 p-0 ${isOwnMessage ? 'text-blue-100 hover:bg-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                      title="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'} className="w-40">
                    {isPinned ? (
                      <DropdownMenuItem onClick={() => onUnpin?.(message.id)}>
                        <PinOff className="mr-2 h-4 w-4" />
                        Unpin
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => onPin?.(message.id)}>
                        <Pin className="mr-2 h-4 w-4" />
                        Pin message
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleDeleteMessage} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          {/* Pinned indicator */}
          {isPinned && (
            <div className={`flex items-center space-x-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              <Pin className="w-3 h-3 text-amber-600" />
              <span className="text-xs text-amber-600 font-medium">Pinned</span>
            </div>
          )}

          {/* Reactions */}
          {renderReactions()}
        </div>

        {/* Teams-style Collapsible Replies (below the message bubble) */}
        {conversationId && !message.parentMessage && (
          <MessageReplies
            message={message}
            currentUserId={currentUserId}
            conversationId={conversationId}
            onReply={onReply}
            onDelete={onDelete}
            onImageClick={onImageClick}
          />
        )}
      </div>
    </div>
  )
}