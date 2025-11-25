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
import { useAuth } from '@/hooks/use-auth'
import { useUnreadCount } from '@/hooks/use-messages'
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
  
  // Get unread message count
  const { data: unreadData } = useUnreadCount()
  const unreadCount = unreadData?.unread_count || 0

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
    <header className="h-16 border-b bg-background/80 backdrop-blur-sm flex items-center px-6 justify-between sticky top-0 z-50 border-border">
      <div className="flex items-center gap-4">
        {/* Enhanced Search with Dropdown */}
        <div className="relative" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search events, users..."
            className="pl-10 pr-10 w-80 bg-muted/50 border-border focus:bg-background focus:border-primary transition-all"
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
        
        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-500 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {unreadCount > 0 ? (
              <>
                <DropdownMenuItem onClick={() => navigate('/dashboard/messages')}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span>You have {unreadCount} unread message{unreadCount > 1 ? 's' : ''}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard/messages')}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span>View all messages</span>
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem disabled>
                <MessageCircle className="mr-2 h-4 w-4" />
                <span>No new notifications</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Message settings</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Subscription Status Badge (Organizers only) */}
        {user?.role === 'organizer' && subscription && (
          <div className="hidden md:block">
            <SubscriptionStatusBadge subscription={subscription} />
          </div>
        )}
        
        {/* Enhanced Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.profile_image} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-foreground">
                  {getShortName(user?.name || 'User')}
                </span>
                <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {/* User Info Section */}
            <DropdownMenuLabel className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user?.profile_image} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">{user?.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                  <Badge variant="secondary" className="text-xs mt-1 capitalize">
                    {user?.role}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Profile Actions */}
            <DropdownMenuItem onClick={() => navigate('/dashboard/profile')} className="cursor-pointer">
              <UserCircle className="mr-2 h-4 w-4 text-blue-600" />
              <span>My Profile</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4 text-gray-600" />
              <span>Settings</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => navigate('/dashboard/messages')} className="cursor-pointer">
              <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
              <span>Messages</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-auto text-xs">
                  {unreadCount}
                </Badge>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => navigate('/dashboard/events')} className="cursor-pointer">
              <Calendar className="mr-2 h-4 w-4 text-purple-600" />
              <span>My Events</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => navigate('/dashboard/reports')} className="cursor-pointer">
              <BarChart className="mr-2 h-4 w-4 text-orange-600" />
              <span>Reports</span>
            </DropdownMenuItem>
            
            {user?.role === 'organizer' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard/subscription')} className="cursor-pointer">
                  <Shield className="mr-2 h-4 w-4 text-blue-600" />
                  <span>Subscription</span>
                </DropdownMenuItem>
              </>
            )}
            
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                  <Shield className="mr-2 h-4 w-4 text-red-600" />
                  <span>Admin Panel</span>
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
