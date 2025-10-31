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
    <div className="w-[480px] bg-white border-l border-slate-200 flex flex-col h-full shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-white" />
            <h3 className="text-lg font-bold text-white">Thread</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/10 p-2 rounded-lg"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex items-center space-x-2 text-white/90 text-sm">
          <MessageSquare className="w-4 h-4" />
          <span>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
        </div>
      </div>

      {/* Parent Message */}
      <div className="px-6 py-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border-b border-blue-100">
        <div className="flex items-start space-x-3">
          <Avatar className="w-10 h-10 flex-shrink-0 ring-2 ring-white shadow-sm">
            <AvatarImage src={parentMessage.sender?.profile_image} />
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
              {getInitials(parentMessage.sender?.name || 'User')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-slate-900 text-sm">
                {parentMessage.sender?.name || 'Unknown'}
              </span>
              <span className="text-xs text-slate-500">
                {formatTime(parentMessage.created_at)}
              </span>
            </div>
            
            <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                {parentMessage.content}
              </p>
              
              {parentMessage.file_path && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Paperclip className="w-4 h-4" />
                    <span className="truncate">{parentMessage.file_name || 'Attachment'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Replies */}
      <ScrollArea className="flex-1 px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : replies.length > 0 ? (
          <div className="space-y-4">
            {replies.map((reply) => (
              <div key={reply.id} className="flex items-start space-x-3">
                <Avatar className="w-9 h-9 flex-shrink-0">
                  <AvatarImage src={reply.sender?.profile_image} />
                  <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-semibold">
                    {getInitials(reply.sender?.name || 'User')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-slate-900 text-sm">
                      {reply.sender?.name || 'Unknown'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatTime(reply.created_at)}
                    </span>
                  </div>
                  
                  <div className={`rounded-lg px-4 py-2.5 ${
                    reply.sender_id === user?.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {reply.content}
                    </p>
                  </div>
                  
                  {reply.file_path && (
                    <div className="mt-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Paperclip className="w-3 h-3" />
                        <span className="truncate text-xs">{reply.file_name || 'Attachment'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-blue-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 mb-1">No replies yet</h4>
            <p className="text-xs text-slate-500 max-w-xs">
              Start the conversation by adding a reply below
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Reply Input */}
      <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
        <div className="flex items-end space-x-3">
          <Avatar className="w-9 h-9 flex-shrink-0">
            <AvatarImage src={user?.profile_image} />
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
              {getInitials(user?.name || 'You')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Reply to thread..."
              className="min-h-[44px] max-h-32 resize-none border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm"
              rows={1}
              disabled={isSending}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-500">
                {replyContent.length}/2000
              </span>
            </div>
          </div>
          
          <Button
            onClick={handleSendReply}
            disabled={!replyContent.trim() || isSending}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

