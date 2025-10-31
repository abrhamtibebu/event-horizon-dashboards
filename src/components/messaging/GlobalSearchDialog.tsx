import React, { useState, useEffect } from 'react'
import { Search, X, ArrowLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { useGlobalSearch } from '../../hooks/use-message-search'
import SearchInput from './SearchInput'
import SearchResults from './SearchResults'
import type { Message } from '../../types/message'

interface GlobalSearchDialogProps {
  isOpen: boolean
  onClose: () => void
  onMessageClick: (message: Message) => void
  onConversationClick: (conversationId: string) => void
}

export const GlobalSearchDialog: React.FC<GlobalSearchDialogProps> = ({
  isOpen,
  onClose,
  onMessageClick,
  onConversationClick,
}) => {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<'all' | 'event' | 'direct'>('all')
  const [hasSearched, setHasSearched] = useState(false)

  const { data: searchData, isLoading, refetch } = useGlobalSearch(query, searchType)

  const handleSearch = (searchQuery: string, type: 'all' | 'event' | 'direct') => {
    setQuery(searchQuery)
    setSearchType(type)
    setHasSearched(true)
  }

  const handleMessageClick = (message: Message) => {
    onMessageClick(message)
    onClose()
  }

  const handleConversationClick = (conversationId: string) => {
    onConversationClick(conversationId)
    onClose()
  }

  const handleClose = () => {
    setQuery('')
    setHasSearched(false)
    onClose()
  }

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setHasSearched(false)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Search Messages</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-shrink-0 mb-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            onSearch={handleSearch}
            placeholder="Search across all your messages..."
            showFilters={true}
            selectedType={searchType}
            onTypeChange={setSearchType}
            className="w-full"
          />
        </div>

        <div className="flex-1 overflow-hidden">
          {hasSearched ? (
            <SearchResults
              messages={searchData?.messages || []}
              query={query}
              total={searchData?.total || 0}
              isLoading={isLoading}
              onMessageClick={handleMessageClick}
              onConversationClick={handleConversationClick}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Search your messages
              </h3>
              <p className="text-gray-500 max-w-md">
                Find any message across all your conversations. Search by content, 
                file names, or keywords.
              </p>
              <div className="mt-6 text-sm text-gray-400">
                <p>Try searching for:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Specific words or phrases</li>
                  <li>• File names or attachments</li>
                  <li>• Event names or topics</li>
                  <li>• People's names</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default GlobalSearchDialog



