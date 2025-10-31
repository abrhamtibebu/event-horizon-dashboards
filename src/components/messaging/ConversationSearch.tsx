import React, { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { useConversationSearch } from '../../hooks/use-message-search'
import SearchResults from './SearchResults'
import type { Message } from '../../types/message'

interface ConversationSearchProps {
  conversationId: string
  conversationName: string
  onMessageClick: (message: Message) => void
  onClose: () => void
}

export const ConversationSearch: React.FC<ConversationSearchProps> = ({
  conversationId,
  conversationName,
  onMessageClick,
  onClose,
}) => {
  const [query, setQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const { data: searchData, isLoading } = useConversationSearch(query, conversationId)

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    setHasSearched(true)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch(query)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleClear = () => {
    setQuery('')
    setHasSearched(false)
  }

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-900">Search in conversation</span>
          <Badge variant="secondary" className="text-xs">
            {conversationName}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Search input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={`Search in ${conversationName}...`}
          className="pl-10 pr-20"
          autoFocus
        />
        
        {/* Clear button */}
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {/* Search button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSearch(query)}
          disabled={!query.trim()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {/* Search results */}
      {hasSearched && (
        <div className="max-h-80 overflow-y-auto">
          <SearchResults
            messages={searchData?.messages || []}
            query={query}
            total={searchData?.total || 0}
            isLoading={isLoading}
            onMessageClick={onMessageClick}
            onConversationClick={() => {}} // Not needed for conversation search
          />
        </div>
      )}

      {/* Empty state */}
      {!hasSearched && (
        <div className="text-center py-8">
          <Search className="w-8 h-8 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">
            Search for messages in this conversation
          </p>
        </div>
      )}
    </div>
  )
}

export default ConversationSearch



