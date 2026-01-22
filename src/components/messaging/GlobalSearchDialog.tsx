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
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/20 rounded-xl flex items-center justify-center border-2 border-blue-200 dark:border-blue-800">
              <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Search Messages</DialogTitle>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Across all conversations</p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 bg-muted/30 flex-shrink-0">
          <SearchInput
            value={query}
            onChange={setQuery}
            onSearch={handleSearch}
            placeholder="Search by keywords, file names, or people..."
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
            <div className="flex flex-col items-center justify-center h-full text-center py-20 px-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] flex items-center justify-center mb-8 border border-gray-100 dark:border-gray-800 rotate-3 transition-transform hover:rotate-0">
                <Search className="w-12 h-12 text-primary/20" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                Global Message Search
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-10 leading-relaxed font-medium">
                Find exactly what you're looking for by searching through all your private and event messages.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                {[
                  { title: 'Keywords', desc: 'Specific words or phrases' },
                  { title: 'Files', desc: 'File names or extensions' },
                  { title: 'Events', desc: 'Event names or topics' },
                  { title: 'People', desc: 'Participant names' }
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-left flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary/40 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.title}</p>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

  )
}

export default GlobalSearchDialog



