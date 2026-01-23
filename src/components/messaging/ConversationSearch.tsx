import React, { useState } from 'react'
import { Search, X, SearchX, ArrowRight } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { useConversationSearch } from '../../hooks/use-message-search'
import SearchResults from './SearchResults'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import type { Message } from '../../types/message'

interface ConversationSearchProps {
  conversationId: string
  conversationName: string
  onMessageClick?: (message: Message) => void
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
    if (!searchQuery.trim()) return
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
    <div className="bg-background/95 backdrop-blur-md">
      {/* Header Container */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Search className="w-4 h-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-foreground/70">Search Conversation</span>
            <Badge variant="outline" className="text-[10px] font-bold px-2 py-0 border-orange-200 text-orange-600 bg-orange-50/50">
              {conversationName}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Input Area */}
        <div className="relative group">
          <Search className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
            isLoading ? "text-orange-500 animate-pulse" : "text-muted-foreground group-focus-within:text-orange-500"
          )} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Look for messages in ${conversationName}...`}
            className="h-12 pl-11 pr-24 bg-muted/40 border-transparent rounded-2xl focus-visible:ring-1 focus-visible:ring-orange-500/30 transition-all text-sm font-medium"
            autoFocus
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSearch(query)}
              disabled={!query.trim() || isLoading}
              className={cn(
                "h-8 w-8 rounded-xl transition-all",
                query.trim() ? "bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-600/10" : "text-muted-foreground"
              )}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Results / Empty State */}
        <div className="min-h-[100px] max-h-96 overflow-y-auto scrollbar-none py-2">
          <AnimatePresence mode="wait">
            {!hasSearched ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                  <SearchX className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Enter keywords to find messages
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <SearchResults
                  messages={searchData?.messages || []}
                  query={query}
                  total={searchData?.total || 0}
                  isLoading={isLoading}
                  onMessageClick={onMessageClick}
                  onConversationClick={() => { }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default ConversationSearch
