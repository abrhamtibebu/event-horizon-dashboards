import React, { useState, useRef, useEffect } from 'react'
import { Search, X, Clock, Filter } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { useRecentSearches } from '../../hooks/use-message-search'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearch: (query: string, type: 'all' | 'event' | 'direct') => void
  placeholder?: string
  className?: string
  showFilters?: boolean
  selectedType?: 'all' | 'event' | 'direct'
  onTypeChange?: (type: 'all' | 'event' | 'direct') => void
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search messages...",
  className = "",
  showFilters = true,
  selectedType = 'all',
  onTypeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches()

  const searchTypes = [
    { value: 'all', label: 'All Messages', icon: Search },
    { value: 'event', label: 'Event Messages', icon: Filter },
    { value: 'direct', label: 'Direct Messages', icon: Filter },
  ] as const

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setShowSuggestions(newValue.length > 0)
  }

  const handleSearch = (query: string = value) => {
    if (query.trim()) {
      addRecentSearch(query.trim())
      onSearch(query.trim(), selectedType)
      setIsOpen(false)
      setShowSuggestions(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    handleSearch(suggestion)
  }

  const handleClear = () => {
    onChange('')
    setIsOpen(false)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const filteredRecentSearches = recentSearches.filter(search =>
    search.toLowerCase().includes(value.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn("relative", className)}>
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-4 h-4" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={() => setShowSuggestions(value.length > 0)}
          placeholder={placeholder}
          className="pl-12 pr-24 h-12 bg-white dark:bg-gray-950 border-gray-100 dark:border-gray-800 focus:bg-white dark:focus:bg-gray-950 shadow-sm rounded-xl text-sm font-medium transition-all"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          )}

          <Button
            size="icon"
            onClick={() => handleSearch()}
            disabled={!value.trim()}
            className="h-8 w-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-lg"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-2 mt-3 ml-1">
          {searchTypes.map((type) => {
            const Icon = type.icon
            const isActive = selectedType === type.value
            return (
              <button
                key={type.value}
                onClick={() => onTypeChange?.(type.value)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/10"
                    : "bg-gray-50 dark:bg-gray-900 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-100 dark:border-gray-800"
                )}
              >
                <Icon className="w-3 h-3" />
                {type.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Suggestions dropdown */}
      {(showSuggestions || isOpen) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <ScrollArea className="max-h-64">
            {/* Recent searches */}
            {filteredRecentSearches.length > 0 && (
              <div className="p-2">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Recently Searched
                  </span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-1">
                  {filteredRecentSearches.map((search, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl transition-all text-left group"
                      onClick={() => handleSuggestionClick(search)}
                    >
                      <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary transition-colors" />
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick suggestions */}
            {value.length > 0 && (
              <div className="p-2 border-t border-gray-50 dark:border-gray-900">
                <div className="px-3 py-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quick Result</span>
                </div>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-primary hover:bg-primary/5 rounded-xl transition-all text-left"
                  onClick={() => handleSuggestionClick(value)}
                >
                  <Search className="w-3.5 h-3.5" />
                  Search for "{value}"
                </button>
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

export default SearchInput



