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
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
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

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getInitials = (name: string) => name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)

  const handleDeleteMessage = async () => {
    await confirmDelete('Message', 'message', async () => onDelete(message.id))
  }

  const renderFileAttachment = () => {
    if (!(message.file_path || message.file_url)) return null

    const fileUrl = getMessageFileUrl(message)
    if (!fileUrl) return null

    const isImage = message.file_type?.startsWith('image/')

    if (isImage) {
      return (
        <div className="mt-1" onClick={() => onImageClick?.(fileUrl)}>
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
        className={cn(
          "flex items-center gap-3 p-3 rounded-2xl transition-all border",
          isOwnMessage
            ? "bg-white/10 border-white/20 hover:bg-white/20"
            : "bg-muted/50 border-border/50 hover:bg-muted"
        )}
      >
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          isOwnMessage ? "bg-white/20" : "bg-orange-100 dark:bg-orange-950/20"
        )}>
          <Download className={cn("w-5 h-5", isOwnMessage ? "text-white" : "text-orange-600 dark:text-orange-400")} />
        </div>
        <div className="min-w-0 pr-2">
          <p className={cn("text-sm font-bold truncate", isOwnMessage ? "text-white" : "text-foreground")}>
            {message.file_name || 'Attachment'}
          </p>
          {sizeLabel && (
            <p className={cn("text-[10px] font-black uppercase tracking-tighter opacity-60", isOwnMessage ? "text-white/80" : "text-muted-foreground")}>
              {sizeLabel}
            </p>
          )}
        </div>
      </a>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex items-end gap-3 mb-6 group",
        isOwnMessage ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar - Minimalist */}
      {!isOwnMessage && (
        <Avatar className="w-8 h-8 shrink-0 border-2 border-background shadow-sm mb-1">
          <AvatarImage src={message.sender.profile_image} />
          <AvatarFallback className="bg-orange-100 text-orange-600 text-[10px] font-black">
            {getInitials(message.sender.name)}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Container */}
      <div className={cn(
        "flex flex-col max-w-[75%] lg:max-w-[65%]",
        isOwnMessage ? "items-end" : "items-start"
      )}>
        {/* Name for Group Chats */}
        {!isOwnMessage && isGroup && (
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5 ml-2">
            {message.sender.name}
          </span>
        )}

        {/* Bubble */}
        <div className="relative group/bubble">
          <div
            className={cn(
              "relative px-4 py-3 shadow-md transition-all duration-300",
              isOwnMessage
                ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-[24px] rounded-br-[4px] shadow-orange-500/10'
                : 'bg-background border border-border/40 text-foreground rounded-[24px] rounded-bl-[4px] shadow-sm'
            )}
          >
            {/* Quoted Message */}
            {message.parentMessage && (
              <div className={cn(
                "px-3 py-2 rounded-xl mb-2 flex flex-col gap-0.5 border-l-4",
                isOwnMessage
                  ? 'bg-black/10 border-white/30 text-white/90'
                  : 'bg-muted/50 border-orange-200 dark:border-orange-800 text-muted-foreground'
              )}>
                <span className="text-[10px] font-black uppercase tracking-tight opacity-70">
                  {message.parentMessage.sender.name}
                </span>
                <p className="text-xs line-clamp-1 italic font-medium">
                  {message.parentMessage.content || "📎 Attachment"}
                </p>
              </div>
            )}

            {/* Main Content */}
            <div className="text-[14px] leading-relaxed font-medium">
              <MessageContent content={message.content} />
            </div>

            {/* Attachments */}
            {(message.file_path || message.file_url) && (
              <div className="mt-2">
                {renderFileAttachment()}
              </div>
            )}

            {/* Status & Time */}
            <div className={cn(
              "flex items-center gap-1.5 mt-1.5 justify-end",
              isOwnMessage ? "opacity-70" : "opacity-40"
            )}>
              <span className="text-[9px] font-black uppercase tracking-tighter">
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
          </div>

          {/* Quick Actions Panel */}
          <div className={cn(
            "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-all duration-300 flex items-center gap-1.5 z-20 scale-90 group-hover/bubble:scale-100",
            isOwnMessage ? "right-full mr-3" : "left-full ml-3"
          )}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onReply(message)}
              className="h-9 w-9 rounded-2xl bg-background border border-border shadow-xl hover:bg-orange-50 hover:text-orange-600 transition-colors"
            >
              <Reply className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-2xl bg-background border border-border shadow-xl hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'} className="w-48 rounded-2xl shadow-2xl border-border/40 backdrop-blur-md">
                <DropdownMenuItem onClick={() => (isPinned ? onUnpin?.(message.id) : onPin?.(message.id))} className="rounded-xl">
                  {isPinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                  {isPinned ? 'Unpin Message' : 'Pin to Top'}
                </DropdownMenuItem>
                {isOwnMessage && (
                  <DropdownMenuItem onClick={handleDeleteMessage} className="text-red-500 focus:text-red-500 rounded-xl">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Message
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Reactions List */}
        <MessageReactions
          message={message}
          currentUserId={currentUserId}
          className="mt-1"
        />

        {/* Inline Thread Access */}
        {conversationId && !message.parentMessage && (
          <div className="mt-1 ml-1">
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
    </motion.div>
  )
}