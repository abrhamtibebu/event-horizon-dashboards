import React, { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, Check, CheckCheck, Download, Reply, Trash2, MoreVertical } from 'lucide-react'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { useModernAlerts } from '../../hooks/useModernAlerts'
import { getMessageFileUrl } from '../../lib/image-utils'
import MessageContent from './MessageContent'
import OptimizedImage from './OptimizedImage'
import type { Message } from '../../types/message'

interface OptimisticMessageBubbleProps {
  message: Message & {
    isOptimistic?: boolean
    status?: 'sending' | 'sent' | 'failed'
    tempId?: string
  }
  currentUserId: number
  onReply: (message: Message) => void
  onDelete: (messageId: number) => void
  onRetry?: (tempId: string) => void
  showAvatar?: boolean
  isGroup?: boolean
  onImageClick?: (imageUrl: string) => void
  conversationId?: string
}

export const OptimisticMessageBubble: React.FC<OptimisticMessageBubbleProps> = ({
  message,
  currentUserId,
  onReply,
  onDelete,
  onRetry,
  showAvatar = false,
  isGroup = false,
  onImageClick,
  conversationId,
}) => {
  const [messageStatus, setMessageStatus] = useState<'sending' | 'sent' | 'failed'>('sending')
  const [reactions, setReactions] = useState<{ [emoji: string]: number }>({})

  const { confirmDelete } = useModernAlerts()
  const isOwnMessage = message.sender_id === currentUserId
  const isOptimistic = message.isOptimistic || message.tempId

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

  const handleRetry = () => {
    if (onRetry && message.tempId) {
      onRetry(message.tempId)
    }
  }

  const renderFileAttachment = () => {
    if (!(message.file_path || message.file_url)) return null

    const fileUrl = getMessageFileUrl(message)
    if (!fileUrl) return null

    const isImage = message.file_type?.startsWith('image/')

    if (isImage) {
      return (
        <div className="mt-2">
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

    const sizeLabel = message.file_size ? `${(message.file_size / 1024).toFixed(2)} KB` : ''

    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Download className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700 truncate">{message.file_name || 'Attachment'}</span>
        {sizeLabel && (
          <span className="text-xs text-gray-500 whitespace-nowrap">({sizeLabel})</span>
        )}
      </a>
    )
  }

  const handleDownloadAttachment = () => {
    const fileUrl = getMessageFileUrl(message)
    if (!fileUrl || fileUrl.startsWith('blob:')) return

    const link = document.createElement('a')
    link.href = fileUrl
    link.download = message.file_name || 'attachment'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderReactions = () => {
    const reactionEntries = Object.entries(reactions).filter(([_, count]) => count > 0)
    if (reactionEntries.length === 0) return null

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {reactionEntries.map(([emoji, count]) => (
          <div
            key={emoji}
            className="flex items-center space-x-1 bg-gray-100 rounded-full px-2 py-1 text-xs"
          >
            <span>{emoji}</span>
            <span className="text-gray-600">{count}</span>
          </div>
        ))}
      </div>
    )
  }

  const getStatusIcon = () => {
    if (isOptimistic) {
      switch (messageStatus) {
        case 'sending':
          return <RefreshCw className="w-3 h-3 text-gray-400 animate-spin" />
        case 'failed':
          return <AlertCircle className="w-3 h-3 text-red-500" />
        case 'sent':
          return <Check className="w-3 h-3 text-gray-400" />
        default:
          return <RefreshCw className="w-3 h-3 text-gray-400 animate-spin" />
      }
    }

    // Regular message status
    if (message.seen_at) return <CheckCheck className="w-3 h-3 text-blue-600" />
    if (message.read_at) return <CheckCheck className="w-3 h-3 text-blue-500" />
    if (message.delivered_at) return <Check className="w-3 h-3 text-gray-400" />
    return <Check className="w-3 h-3 text-gray-400" />
  }

  const getBubbleOpacity = () => {
    if (isOptimistic && messageStatus === 'sending') return 'opacity-70'
    if (isOptimistic && messageStatus === 'failed') return 'opacity-50'
    return ''
  }

  return (
    <div className={`flex items-start space-x-3 group ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <div className="flex flex-col items-center">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={message.sender.profile_image} />
            <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
              {getInitials(message.sender.name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-gray-500 mt-1 text-center">
            {message.sender.name}
          </span>
        </div>
      )}

      <div className={`flex flex-col w-full max-w-[280px] lg:max-w-[320px] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Reply indicator */}
        {message.parentMessage && (
          <div className="flex items-center space-x-1 mb-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            <span className="text-xs text-gray-500">
              {isOwnMessage ? 'You' : message.sender.name} replied to {message.parentMessage.sender.name}
            </span>
          </div>
        )}

        {/* Quoted message */}
        {message.parentMessage && (
          <div className="mb-3 p-3 bg-gray-100 rounded-lg border-l-4 border-gray-300">
            <div className="flex items-start space-x-2">
              <div className="w-1 h-6 bg-gray-400 rounded-full flex-shrink-0 mt-1"></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  {message.parentMessage.sender.name}
                </p>
                <p className="text-sm text-gray-700 truncate">
                  {message.parentMessage.content}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`
            relative px-4 py-3 rounded-2xl shadow-sm message-bubble
            ${isOwnMessage
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
            }
            hover:shadow-md transition-all duration-200
            animate-in slide-in-from-bottom-2 fade-in duration-300
            ${getBubbleOpacity()}
          `}
          style={{ maxWidth: '280px', wordBreak: 'break-all' }}
        >
          {/* Message content */}
          <div className="break-words overflow-wrap-anywhere">
            <MessageContent content={message.content} />
          </div>

          {/* File attachment */}
          {renderFileAttachment()}

          {/* Timestamp and status */}
          <div className={`flex items-center space-x-1 mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
              {formatMessageTime(message.created_at)}
            </span>
            {isOwnMessage && (
              <div className="flex items-center space-x-1">
                {getStatusIcon()}
                {isOptimistic && messageStatus === 'failed' && onRetry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRetry}
                    className="ml-2 text-xs text-red-500 hover:text-red-700"
                  >
                    Retry
                  </Button>
                )}
              </div>
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
                <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'} className="w-32">
                  <DropdownMenuItem onClick={handleDeleteMessage} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Reactions */}
        {renderReactions()}
      </div>
    </div>
  )
}