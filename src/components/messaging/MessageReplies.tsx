import React, { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { useMessageReplies } from '../../hooks/use-message-replies'
import { MessageBubble } from './MessageBubble'
import type { Message } from '../../types/message'

interface MessageRepliesProps {
  message: Message
  currentUserId: number
  conversationId: string
  onReply: (message: Message) => void
  onDelete: (messageId: number) => void
  onImageClick?: (imageUrl: string) => void
}

export const MessageReplies: React.FC<MessageRepliesProps> = ({
  message,
  currentUserId,
  conversationId,
  onReply,
  onDelete,
  onImageClick,
}) => {
  const [showReplies, setShowReplies] = useState(false)
  
  const {
    replies,
    isLoading,
    removeReply,
  } = useMessageReplies({
    messageId: message.id,
    currentUserId,
  })

  const handleDeleteReply = async (replyId: number) => {
    removeReply(replyId)
  }

  const handleReplyToMessage = (replyMessage: Message) => {
    onReply(replyMessage)
  }

  // Don't show anything if there are no replies
  if (replies.length === 0) {
    return null
  }

  return (
    <div className="mt-1 ml-12">
      {/* Slack-style Reply count with avatars */}
      <button
        onClick={() => setShowReplies(!showReplies)}
        className="flex items-center space-x-2 text-xs font-medium text-[#1264A3] hover:underline transition-colors py-1"
      >
        {/* Show small avatars of people who replied */}
        <div className="flex -space-x-1">
          {replies.slice(0, 3).map((reply, index) => (
            <Avatar key={reply.id} className="w-5 h-5 border-2 border-white">
              <AvatarImage src={reply.sender.profile_image} />
              <AvatarFallback className="bg-gray-300 text-gray-700 text-[10px]">
                {reply.sender.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <span>
          {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
        </span>
        <ChevronRight className="w-3 h-3" />
      </button>

      {/* Collapsible Replies list */}
      {showReplies && (
        <div className="mt-3 space-y-3 pl-0 pb-4 border-l-2 border-gray-200 ml-4 pl-4">
          {isLoading ? (
            <div className="text-xs text-gray-500">Loading replies...</div>
          ) : (
            replies.map((reply) => (
              <div key={reply.id} className="relative">
                {/* Slack-style reply indicator */}
                <div className="flex items-center space-x-1 mb-1 text-xs text-[#9CA3AF]">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span>
                    <strong className="font-medium text-gray-700">
                      {reply.sender_id === currentUserId ? 'You' : reply.sender.name}
                    </strong>
                    {' '}replied
                  </span>
                </div>
                <MessageBubble
                  message={reply}
                  currentUserId={currentUserId}
                  onReply={handleReplyToMessage}
                  onDelete={handleDeleteReply}
                  onImageClick={onImageClick}
                  showAvatar={false}
                  isGroup={conversationId?.startsWith('event_')}
                  conversationId={conversationId}
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
