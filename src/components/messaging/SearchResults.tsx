import React from 'react'
import { Search, MessageCircle, Calendar, User, FileText, Image as ImageIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { formatDistanceToNow } from 'date-fns'
import type { Message } from '../../types/message'

interface SearchResultProps {
  message: Message & {
    highlighted_content?: string
    highlighted_file_name?: string
  }
  onMessageClick: (message: Message) => void
  onConversationClick: (conversationId: string) => void
}

const SearchResult: React.FC<SearchResultProps> = ({
  message,
  onMessageClick,
  onConversationClick,
}) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  }

  const getConversationId = (message: Message): string => {
    if (message.event_id) {
      return `event_${message.event_id}`
    } else {
      // For direct messages, we need to determine the other user
      // This assumes we're searching from the current user's perspective
      return `direct_${message.sender_id === message.sender_id ? message.recipient_id : message.sender_id}`
    }
  }

  const getConversationName = (message: Message): string => {
    if (message.event) {
      return message.event.title
    } else {
      return message.sender.name
    }
  }

  const getConversationType = (message: Message): 'event' | 'direct' => {
    return message.event_id ? 'event' : 'direct'
  }

  const renderMessageContent = () => {
    if (message.highlighted_content) {
      return (
        <div 
          className="text-sm text-gray-700"
          dangerouslySetInnerHTML={{ __html: message.highlighted_content }}
        />
      )
    }
    return <div className="text-sm text-gray-700">{message.content}</div>
  }

  const renderAttachment = () => {
    if (!message.file_path) return null

    const isImage = message.file_type?.startsWith('image/')
    
    return (
      <div className="flex items-center space-x-2 mt-2">
        {isImage ? (
          <ImageIcon className="w-4 h-4 text-blue-500" />
        ) : (
          <FileText className="w-4 h-4 text-gray-500" />
        )}
        <span className="text-xs text-gray-500">
          {message.highlighted_file_name ? (
            <span dangerouslySetInnerHTML={{ __html: message.highlighted_file_name }} />
          ) : (
            message.file_name
          )}
        </span>
      </div>
    )
  }

  const conversationId = getConversationId(message)
  const conversationName = getConversationName(message)
  const conversationType = getConversationType(message)

  return (
    <div 
      className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onMessageClick(message)}
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={message.sender.profile_image} />
          <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
            {getInitials(message.sender.name)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{message.sender.name}</span>
              <Badge 
                variant={conversationType === 'event' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {conversationType === 'event' ? (
                  <>
                    <Calendar className="w-3 h-3 mr-1" />
                    {conversationName}
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3 mr-1" />
                    Direct Message
                  </>
                )}
              </Badge>
            </div>
            <span className="text-xs text-gray-500">
              {formatMessageTime(message.created_at)}
            </span>
          </div>

          {/* Message content */}
          {renderMessageContent()}

          {/* Attachment */}
          {renderAttachment()}

          {/* Actions */}
          <div className="flex items-center space-x-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onConversationClick(conversationId)
              }}
              className="text-xs h-6 px-2"
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              Go to conversation
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SearchResultsProps {
  messages: (Message & {
    highlighted_content?: string
    highlighted_file_name?: string
  })[]
  query: string
  total: number
  isLoading: boolean
  onMessageClick: (message: Message) => void
  onConversationClick: (conversationId: string) => void
  onLoadMore?: () => void
  hasMore?: boolean
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  messages,
  query,
  total,
  isLoading,
  onMessageClick,
  onConversationClick,
  onLoadMore,
  hasMore,
}) => {
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Search className="w-8 h-8 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Searching messages...</p>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="p-8 text-center">
        <Search className="w-8 h-8 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 mb-2">No messages found</p>
        <p className="text-sm text-gray-400">
          Try searching with different keywords or check your spelling
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white">
      {/* Results header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">
              Search results for "{query}"
            </h3>
            <p className="text-sm text-gray-500">
              {total} message{total !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>
      </div>

      {/* Results list */}
      <div className="max-h-96 overflow-y-auto">
        {messages.map((message) => (
          <SearchResult
            key={message.id}
            message={message}
            onMessageClick={onMessageClick}
            onConversationClick={onConversationClick}
          />
        ))}
      </div>

      {/* Load more button */}
      {hasMore && onLoadMore && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={onLoadMore}
            className="w-full"
          >
            Load more results
          </Button>
        </div>
      )}
    </div>
  )
}

export default SearchResults



