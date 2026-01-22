import React, { useState } from 'react'
import { MoreVertical, Reply, Trash2, Download, Check, CheckCheck, Pin, PinOff } from 'lucide-react'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { useModernAlerts } from '../../hooks/useModernAlerts'
import { MessageReactions } from './MessageReactions'
import { MessageReplies } from './MessageReplies'
import { ReadReceipts } from './ReadReceipts'
import { getMessageFileUrl } from '../../lib/image-utils'
import MessageContent from './MessageContent'
import OptimizedImage from './OptimizedImage'
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
    if (!(message.file_path || message.file_url)) return null

    const fileUrl = getMessageFileUrl(message)
    if (!fileUrl) return null

    const isImage = message.file_type?.startsWith('image/')

    if (isImage) {
      return (
        <div className="mt-2" onClick={() => onImageClick?.(fileUrl)}>
          <OptimizedImage
            message={message}
            containerWidth={320}
            maxWidth={360}
            maxHeight={360}
            onClick={(originalUrl) => onImageClick?.(originalUrl || fileUrl)}
            showLoadingIndicator={false}
          />
        </div>
      )
    }

    const sizeLabel = message.file_size ? `${(message.file_size / 1024).toFixed(2)} KB` : ''

    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-2 p-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
      >
        <Download className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground truncate">{message.file_name || 'Attachment'}</span>
        {sizeLabel && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">({sizeLabel})</span>
        )}
      </a>
    )
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
            <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
              {getInitials(message.sender.name)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isOwnMessage ? 'items-end max-w-[85%] ml-auto' : 'items-start max-w-[85%] mr-auto'}`}>
        {/* Sender name for others */}
        {!isOwnMessage && isGroup && (
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1 px-1">
            {message.sender.name}
          </span>
        )}

        {/* Message bubble */}
        <div className="relative group w-full">
          <div
            className={cn(
              "relative shadow-sm transition-all duration-200",
              isOwnMessage
                ? 'bg-primary text-white rounded-[20px] rounded-tr-[4px] shadow-primary/10'
                : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-[20px] rounded-tl-[4px]'
            )}
            style={{ wordBreak: 'break-word' }}
          >
            {/* Quoted Message (if replying) */}
            {message.parentMessage && (
              <div className={cn(
                "mx-1 mt-1 px-3 py-2 border-l-3 rounded-xl mb-1",
                isOwnMessage
                  ? 'bg-black/10 border-white/30'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
              )}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-[10px] font-bold mb-0.5",
                      isOwnMessage ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                    )}>
                      {message.parentMessage.sender.name}
                    </p>
                    <p className={cn(
                      "text-[11px] truncate",
                      isOwnMessage ? 'text-white/70' : 'text-gray-600 dark:text-gray-300'
                    )}>
                      {(message.parentMessage.file_path || message.parentMessage.file_url) && !message.parentMessage.content
                        ? `📎 Attachment`
                        : message.parentMessage.content}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Message content */}
            <div className={cn(
              "px-4 py-2.5",
              message.parentMessage ? 'pt-1' : ''
            )}>
              <MessageContent content={message.content} />
            </div>

            {/* File attachment */}
            {(message.file_path || message.file_url) && (
              <div className="px-1 pb-1">
                <div className="rounded-xl overflow-hidden">
                  {renderFileAttachment()}
                </div>
              </div>
            )}

            {/* Timestamp and status indicator */}
            <div className={cn(
              "flex items-center gap-1.5 px-4 pb-2 justify-end",
              isOwnMessage ? "text-white/60" : "text-gray-400 dark:text-gray-500"
            )}>
              <span className="text-[10px] font-medium">
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

            {/* Message actions (reply, delete) - Floating over the bubble */}
            <div className={cn(
              "absolute top-0 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 z-10",
              isOwnMessage ? "right-full mr-2" : "left-full ml-2"
            )}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onReply(message)}
                className="h-8 w-8 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500"
                title="Reply"
              >
                <Reply className="w-3.5 h-3.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500"
                    title="More"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'} className="w-40 rounded-xl shadow-xl border-gray-100 dark:border-gray-800">
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
                  {isOwnMessage && (
                    <DropdownMenuItem onClick={handleDeleteMessage} className="text-red-500 focus:text-red-500">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Pinned indicator */}
          {isPinned && (
            <div className={`flex items-center space-x-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              <Pin className="w-3 h-3 text-warning" />
              <span className="text-xs text-warning font-medium">Pinned</span>
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