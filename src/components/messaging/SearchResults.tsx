import React from 'react'
import { Search, MessageCircle, Calendar, User, FileText, Image as ImageIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { formatDistanceToNow } from 'date-fns'
import type { Message } from '../../types/message'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { cn } from '@/lib/utils'
import { useRecentSearches } from '../../hooks/use-message-search'
import { ScrollArea } from '../ui/scroll-area'

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
      return `direct_${message.sender_id}`
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
          className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium"
          dangerouslySetInnerHTML={{ __html: message.highlighted_content }}
        />
      )
    }
    return <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">{message.content}</div>
  }

  const renderAttachment = () => {
    if (!(message.file_path || message.file_url)) return null

    const isImage = message.file_type?.startsWith('image/')

    return (
      <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 w-fit max-w-full">
        {isImage ? (
          <ImageIcon className="w-3.5 h-3.5 text-primary" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-gray-400" />
        )}
        <span className="text-[11px] font-bold text-gray-500 truncate">
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
      className="p-5 border-b border-gray-50 dark:border-gray-900 hover:bg-gray-50 dark:hover:bg-gray-900/40 cursor-pointer transition-all group"
      onClick={() => onMessageClick(message)}
    >
      <div className="flex items-start gap-4">
        <Avatar className="w-11 h-11 border-2 border-white dark:border-gray-950 shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
          <AvatarImage src={message.sender.profile_image} />
          <AvatarFallback className="bg-primary text-white text-xs font-black">
            {getInitials(message.sender.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 dark:text-white text-sm">{message.sender.name}</span>
              <Badge className={cn(
                "text-[9px] font-black uppercase px-2 py-0 border-none",
                conversationType === 'event' ? "bg-primary/10 text-primary" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
              )}>
                {conversationType === 'event' ? (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {conversationName}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <User className="w-2.5 h-2.5" />
                    Direct Message
                  </span>
                )}
              </Badge>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
              {formatMessageTime(message.created_at)}
            </span>
          </div>

          {renderMessageContent()}
          {renderAttachment()}

          <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onConversationClick(conversationId)
              }}
              className="text-[10px] h-8 px-3 font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-lg"
            >
              <MessageCircle className="w-3 h-3 mr-2" />
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
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center mb-4 border border-gray-100 dark:border-gray-800 animate-pulse">
          <Search className="w-8 h-8 text-primary/20" />
        </div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Searching messages...</p>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center mb-6 border border-gray-100 dark:border-gray-800">
          <Search className="w-8 h-8 text-gray-200 dark:text-gray-800" />
        </div>
        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">No results found</h3>
        <p className="text-sm text-gray-500 max-w-xs">
          Wait, we couldn't find any messages matching "{query}". Try a different term.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/* Results header */}
      <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-900 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">
            Results for "{query}"
          </h3>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">
            {total} message{total !== 1 ? 's' : ''} found in database
          </p>
        </div>
      </div>

      {/* Results list */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-gray-50 dark:divide-gray-900">
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
          <div className="p-6">
            <Button
              variant="outline"
              onClick={onLoadMore}
              className="w-full h-11 border-gray-100 dark:border-gray-800 text-xs font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl"
            >
              Load More Results
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

export default SearchResults


