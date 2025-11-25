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
      <div className={`flex flex-col ${isOwnMessage ? 'items-end max-w-[480px]' : 'items-start flex-1'}`}>
        {/* Sender name for others */}
        {!isOwnMessage && (
          <span className="text-sm font-bold text-foreground mb-1 px-1">
            {message.sender.name}
          </span>
        )}
        
        {/* Message bubble */}
        <div className="relative group w-full">
          <div
            className={`
              relative shadow-sm message-bubble
              ${isOwnMessage 
                ? 'bg-primary text-primary-foreground rounded-[20px]'
                : 'bg-card border border-border text-card-foreground rounded-[20px]'
              }
              hover:shadow transition-all duration-150
            `}
            style={{ maxWidth: isOwnMessage ? '480px' : 'none', wordBreak: 'break-word' }}
          >
            {/* Teams-style Quoted Message (if replying) */}
            {message.parentMessage && (
              <div className={`px-3 pt-3 pb-2 border-l-4 ${
                isOwnMessage 
                  ? 'bg-primary/20 border-primary-foreground/50' 
                  : 'bg-muted/50 border-border'
              } rounded-t-2xl`}>
                <div className="flex items-start space-x-2">
                  <Reply className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                    isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold mb-0.5 ${
                      isOwnMessage ? 'text-primary-foreground/90' : 'text-foreground'
                    }`}>
                      {message.parentMessage.sender.name}
                    </p>
                    <p className={`text-xs truncate ${
                      isOwnMessage ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    }`}>
                      {(message.parentMessage.file_path || message.parentMessage.file_url) && !message.parentMessage.content 
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
            {(message.file_path || message.file_url) && (
              <div className={message.parentMessage ? '' : 'px-4'}>
                {renderFileAttachment()}
              </div>
            )}

            {/* Timestamp and status */}
            <div className="flex items-center space-x-2 px-4 pb-3">
              <span className={`text-xs ${isOwnMessage ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
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
                className={`w-8 h-8 p-0 ${isOwnMessage ? 'text-primary-foreground/80 hover:bg-primary/40' : 'text-muted-foreground hover:bg-accent'}`}
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
                      className={`w-8 h-8 p-0 ${isOwnMessage ? 'text-primary-foreground/80 hover:bg-primary/40' : 'text-muted-foreground hover:bg-accent'}`}
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
                    <DropdownMenuItem onClick={handleDeleteMessage} className="text-destructive">
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