import { Bell, Search, User, LogOut, MessageCircle, Settings, Calendar, Users, BarChart, X, ChevronDown, UserCircle, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SpinnerInline } from '@/components/ui/spinner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { MessagesDropdown } from '@/components/messaging/MessagesDropdown'
import { useAuth } from '@/hooks/use-auth'
import { useSubscription } from '@/hooks/useSubscription'
import { SubscriptionStatusBadge } from '@/components/subscription/SubscriptionStatusBadge'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'

interface SearchResult {
  type: 'event' | 'user' | 'message'
  id: number
  title: string
  subtitle?: string
  icon: React.ReactNode
}

export function Header({ onSearch }: { onSearch?: (query: string) => void }) {
  const { user, logout } = useAuth()
  const { subscription } = useSubscription()
  const [searchValue, setSearchValue] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Helper to get initials
  const getInitials = (name?: string) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Helper to get short name
  const getShortName = (fullName?: string) => {
    if (!fullName) return ''
    const parts = fullName.split(' ')
    if (parts.length === 1) return parts[0].slice(0, 10)
    return parts[0] + ' ' + parts[1][0].toUpperCase() + '.'
  }

  // Debounced search
  useEffect(() => {
    if (!searchValue.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        // Search events
        const eventsResponse = await api.get('/organizer/events')
        const events = eventsResponse.data.filter((event: any) =>
          event.name.toLowerCase().includes(searchValue.toLowerCase())
        ).slice(0, 3)

        // Search users (attendees)
        const usersResponse = await api.get('/users/search', {
          params: { query: searchValue, limit: 3 }
        }).catch(() => ({ data: [] }))

        const results: SearchResult[] = [
          ...events.map((event: any) => ({
            type: 'event' as const,
            id: event.id,
            title: event.name,
            subtitle: new Date(event.start_date).toLocaleDateString(),
            icon: <Calendar className="w-4 h-4" />
          })),
          ...(usersResponse.data || []).map((u: any) => ({
            type: 'user' as const,
            id: u.id,
            title: u.name,
            subtitle: u.email,
            icon: <Users className="w-4 h-4" />
          }))
        ]

        setSearchResults(results)
        setShowSearchResults(results.length > 0)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchValue])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
    if (onSearch) onSearch(e.target.value)
  }

  const handleSearchResultClick = (result: SearchResult) => {
    if (result.type === 'event') {
      navigate(`/dashboard/events/${result.id}`)
    } else if (result.type === 'user') {
      navigate(`/dashboard/messages?user=${result.id}`)
    }
    setSearchValue('')
    setShowSearchResults(false)
  }

  const clearSearch = () => {
    setSearchValue('')
    setSearchResults([])
    setShowSearchResults(false)
  }

  return (
    <header className="h-16 border-b bg-background/60 backdrop-blur-xl flex items-center px-6 justify-between sticky top-0 z-50 border-border/50 transition-all duration-300">
      <div className="flex items-center gap-4">
        {/* Enhanced Search with Dropdown */}
        <div className="relative" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Quick search..."
            className="pl-10 pr-10 w-72 bg-muted/30 border-white/5 focus:bg-background/50 focus:border-primary/50 focus:w-80 transition-all duration-300 rounded-full h-10 text-sm"
            value={searchValue}
            onChange={handleSearchChange}
            onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
          />
          {searchValue && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
              <SpinnerInline size="sm" />
            </div>
          )}

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-popover border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSearchResultClick(result)}
                  className="w-full px-4 py-3 hover:bg-accent flex items-center gap-3 transition-colors border-b border-border last:border-0 text-left"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    {result.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-sm text-muted-foreground truncate">{result.subtitle}</div>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {result.type}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {showSearchResults && searchResults.length === 0 && searchValue && !isSearching && (
            <div className="absolute top-full mt-2 w-full bg-popover border border-border rounded-lg shadow-lg z-50 px-4 py-6 text-center">
              <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No results found for "{searchValue}"</p>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Messages Dropdown */}
        <MessagesDropdown />

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors" />
              {/* This could be for platform notifications in the future */}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden rounded-xl border-gray-200 dark:border-gray-800 shadow-2xl bg-white dark:bg-gray-950">
            <DropdownMenuLabel className="p-4 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <span className="font-bold text-base text-gray-900 dark:text-gray-100">Notifications</span>
            </DropdownMenuLabel>
            <div className="py-8 px-6 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No new notifications</p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Subscription Status Badge (Organizers only) */}
        {user?.role === 'organizer' && subscription && (
          <div className="hidden md:block">
            <SubscriptionStatusBadge subscription={subscription} />
          </div>
        )}


      </div>
    </header>
  )
}
