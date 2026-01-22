import React, { useState, useEffect } from 'react'
import { X, Send, Paperclip, ArrowLeft, MessageSquare } from 'lucide-react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { MessageBubble } from './MessageBubble'
import { useAuth } from '../../hooks/use-auth'
import { useSendDirectMessage } from '../../hooks/use-messages'
import { formatDistanceToNow } from 'date-fns'
import type { Message } from '../../types/message'

interface MessageThreadPanelProps {
  parentMessage: Message
  replies: Message[]
  isLoading?: boolean
  onClose: () => void
  onReply: (content: string, parentId: number) => void
  conversationId: string
}

export const MessageThreadPanel: React.FC<MessageThreadPanelProps> = ({
  parentMessage,
  replies = [],
  isLoading = false,
  onClose,
  onReply,
  conversationId,
}) => {
  const { user } = useAuth()
  const [replyContent, setReplyContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const sendMessageMutation = useSendDirectMessage()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSendReply = async () => {
    if (!replyContent.trim() || isSending) return

    setIsSending(true)
    try {
      await onReply(replyContent.trim(), parentMessage.id)
      setReplyContent('')
    } catch (error) {
      console.error('Failed to send reply:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendReply()
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  const isOwnMessage = parentMessage.sender_id === user?.id

  return (
    <div className="w-[400px] bg-white dark:bg-gray-950 border-l border-gray-100 dark:border-gray-800 flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Thread</h3>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-9 w-9 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Parent Message Section */}
      <div className="px-6 py-6 bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start gap-4">
          <Avatar className="w-10 h-10 border-2 border-white dark:border-gray-950 shadow-sm">
            <AvatarImage src={parentMessage.sender?.profile_image} />
            <AvatarFallback className="bg-primary text-white text-xs font-bold">
              {getInitials(parentMessage.sender?.name || 'U')}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-gray-900 dark:text-white text-sm">
                {parentMessage.sender?.name || 'Unknown'}
              </span>
              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                {formatTime(parentMessage.created_at)}
              </span>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl px-5 py-4 shadow-sm border border-gray-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
              {parentMessage.content}

              {(parentMessage.file_path || parentMessage.file_url) && (
                <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-xs text-primary font-bold">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span className="truncate">{parentMessage.file_name || 'Attachment'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Replies List */}
      <ScrollArea className="flex-1 px-6 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Replies</p>
          </div>
        ) : replies.length > 0 ? (
          <div className="space-y-6">
            {replies.map((reply) => (
              <div key={reply.id} className="flex items-start gap-3 group">
                <Avatar className="w-8 h-8 shadow-sm">
                  <AvatarImage src={reply.sender?.profile_image} />
                  <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-bold">
                    {getInitials(reply.sender?.name || 'U')}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">
                      {reply.sender?.name || 'Unknown'}
                    </span>
                    <span className="text-[9px] font-medium text-gray-400">
                      {formatTime(reply.created_at)}
                    </span>
                  </div>

                  <div className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm border",
                    reply.sender_id === user?.id
                      ? "bg-primary text-white border-primary"
                      : "bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-gray-800"
                  )}>
                    <p className="whitespace-pre-wrap break-words">
                      {reply.content}
                    </p>
                  </div>

                  {(reply.file_path || reply.file_url) && (
                    <div className="mt-2 text-[10px] font-bold text-primary flex items-center gap-1.5 px-1">
                      <Paperclip className="w-3 h-3" />
                      <span className="truncate">{reply.file_name || 'Attachment'}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center mb-4 border border-gray-50 dark:border-gray-800">
              <MessageSquare className="w-8 h-8 text-primary/20" />
            </div>
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">Be the first to reply</h4>
            <p className="text-xs text-gray-500 max-w-[200px]">
              Start the discussion by adding a reply to this thread.
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Reply Input */}
      <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <div className="relative">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Write a reply..."
            className="min-h-[100px] max-h-32 resize-none bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 focus:border-primary focus:bg-white dark:focus:bg-gray-900 focus:ring-0 rounded-2xl text-sm p-4 transition-all pr-12"
            rows={1}
            disabled={isSending}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <Button
              size="icon"
              onClick={handleSendReply}
              disabled={!replyContent.trim() || isSending}
              className="h-9 w-9 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 rounded-xl transition-all"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between px-1">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5">
              <Paperclip className="w-4 h-4" />
            </Button>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {replyContent.length}/2000
          </span>
        </div>
      </div>
    </div>

  )
}
