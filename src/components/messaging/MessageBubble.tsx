import React from 'react'
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
import { cn } from '@/lib/utils'
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
  const { confirmDelete } = useModernAlerts()
  const isOwnMessage = message.sender_id === currentUserId
  const isPinned = message.is_pinned || false
  const isSent = message.status === 'sent' || !!message.id

  const formatMessageTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const getInitials = (name: string) =>
    name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)

  const handleDeleteMessage = async () => {
    await confirmDelete('Message', 'message', async () => onDelete(Number(message.id)))
  }

  const renderFileAttachment = () => {
    if (!(message.file_path || message.file_url)) return null
    const fileUrl = getMessageFileUrl(message)
    if (!fileUrl) return null

    if (message.file_type?.startsWith('image/')) {
      return (
        <div className="mt-1 cursor-pointer" onClick={() => onImageClick?.(fileUrl)}>
          <OptimizedImage
            message={message}
            containerWidth={280}
            maxWidth={300}
            maxHeight={300}
            onClick={(originalUrl) => onImageClick?.(originalUrl || fileUrl)}
            showLoadingIndicator={false}
          />
        </div>
      )
    }

    const sizeLabel = message.file_size ? `${(message.file_size / 1024).toFixed(1)} KB` : ''

    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex items-center gap-2 p-2.5 rounded-2xl border transition-colors',
          isOwnMessage
            ? 'bg-black/10 border-white/20 hover:bg-black/15'
            : 'bg-muted/50 border-border/50 hover:bg-muted'
        )}
      >
        <Download className={cn('w-4 h-4 shrink-0', isOwnMessage ? 'text-white' : 'text-foreground')} />
        <div className="min-w-0">
          <p className={cn('text-sm font-medium truncate', isOwnMessage ? 'text-white' : 'text-foreground')}>
            {message.file_name || 'Attachment'}
          </p>
          {sizeLabel && (
            <p className={cn('text-[11px]', isOwnMessage ? 'text-white/70' : 'text-muted-foreground')}>
              {sizeLabel}
            </p>
          )}
        </div>
      </a>
    )
  }

  return (
    <div
      id={`message-${message.id}`}
      className={cn(
        'flex items-end gap-2 mb-3 group scroll-mt-20',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {!isOwnMessage && (showAvatar || isGroup) && (
        <Avatar className="w-7 h-7 shrink-0 mb-0.5">
          <AvatarImage src={message.sender?.profile_image} />
          <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
            {getInitials(message.sender?.name || '?')}
          </AvatarFallback>
        </Avatar>
      )}
      {!isOwnMessage && !(showAvatar || isGroup) && <div className="w-7 shrink-0" />}

      <div className={cn('flex flex-col max-w-[78%]', isOwnMessage ? 'items-end' : 'items-start')}>
        {!isOwnMessage && isGroup && (
          <span className="text-[11px] text-muted-foreground mb-1 ml-1">
            {message.sender?.name}
          </span>
        )}

        <div className="relative group/bubble">
          <div
            className={cn(
              'relative px-3.5 py-2 text-[14px] leading-snug break-words',
              isOwnMessage
                ? 'bg-primary text-primary-foreground rounded-[22px] rounded-br-md'
                : 'bg-muted text-foreground rounded-[22px] rounded-bl-md'
            )}
          >
            {message.parentMessage && (
              <div
                className={cn(
                  'px-2.5 py-1.5 rounded-xl mb-1.5 border-l-2 text-xs',
                  isOwnMessage ? 'bg-black/10 border-white/50' : 'bg-background/60 border-foreground/30'
                )}
              >
                <p className="font-medium opacity-80">{message.parentMessage.sender?.name}</p>
                <p className="line-clamp-1 opacity-70">
                  {message.parentMessage.content || 'Attachment'}
                </p>
              </div>
            )}

            <MessageContent content={message.content} />

            {(message.file_path || message.file_url) && (
              <div className="mt-1.5">{renderFileAttachment()}</div>
            )}

            <div
              className={cn(
                'flex items-center gap-1 mt-1 justify-end',
                isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}
            >
              <span className="text-[10px]">{formatMessageTime(message.created_at)}</span>
              {isOwnMessage && (
                isSent ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3 opacity-60" />
              )}
              {isOwnMessage && (
                <ReadReceipts message={message} currentUserId={currentUserId} isGroup={isGroup} />
              )}
            </div>
          </div>

          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 flex items-center gap-1 z-20',
              'opacity-100 md:opacity-0 md:group-hover/bubble:opacity-100 transition-opacity',
              isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onReply(message)}
              className="h-8 w-8 rounded-full bg-background border border-border"
            >
              <Reply className="w-3.5 h-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background border border-border"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'} className="w-44 rounded-xl">
                <DropdownMenuItem onClick={() => (isPinned ? onUnpin?.(Number(message.id)) : onPin?.(Number(message.id)))}>
                  {isPinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                  {isPinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                {isOwnMessage && (
                  <DropdownMenuItem onClick={handleDeleteMessage} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <MessageReactions message={message} currentUserId={currentUserId} className="mt-1" />

        {conversationId && !message.parentMessage && (
          <div className="mt-0.5">
            <MessageReplies
              message={message}
              currentUserId={currentUserId}
              conversationId={conversationId}
              onReply={onReply}
              onDelete={onDelete}
              onImageClick={onImageClick}
            />
          </div>
        )}
      </div>
    </div>
  )
}
