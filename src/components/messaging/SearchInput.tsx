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
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={() => setShowSuggestions(value.length > 0)}
          placeholder={placeholder}
          className="pl-10 pr-20"
        />
        
        {/* Clear button */}
        {value && (
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
          onClick={() => handleSearch()}
          disabled={!value.trim()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center space-x-2 mt-2">
          {searchTypes.map((type) => {
            const Icon = type.icon
            return (
              <Button
                key={type.value}
                variant={selectedType === type.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onTypeChange?.(type.value)}
                className="text-xs h-7"
              >
                <Icon className="w-3 h-3 mr-1" />
                {type.label}
              </Button>
            )
          })}
        </div>
      )}

      {/* Suggestions dropdown */}
      {(showSuggestions || isOpen) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {/* Recent searches */}
          {filteredRecentSearches.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Recent searches
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearRecentSearches}
                  className="text-xs h-6 px-2"
                >
                  Clear
                </Button>
              </div>
              {filteredRecentSearches.map((search, index) => (
                <div
                  key={index}
                  className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
                  onClick={() => handleSuggestionClick(search)}
                >
                  {search}
                </div>
              ))}
            </div>
          )}

          {/* Quick suggestions */}
          {value.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-500 mb-2">Quick search</div>
              <div
                className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
                onClick={() => handleSuggestionClick(value)}
              >
                Search for "{value}"
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchInput



