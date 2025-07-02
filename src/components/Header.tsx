import { Bell, Search, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth.tsx'
import { useState } from 'react'

export function Header({ onSearch }: { onSearch?: (query: string) => void }) {
  const { user, logout } = useAuth()
  const [searchValue, setSearchValue] = useState('')

  // Helper to get short name
  const getShortName = (fullName?: string) => {
    if (!fullName) return ''
    const parts = fullName.split(' ')
    if (parts.length === 1) return parts[0].slice(0, 6) + '.'
    return parts[0] + ' ' + parts[1][0].toUpperCase() + '.'
  }

  const handleLogout = async () => {
    await logout()
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
    if (onSearch) onSearch(e.target.value)
  }

  // Placeholder for notification count (replace with real data if available)
  const notificationCount = 0

  return (
    <header className="h-16 border-b bg-white/80 backdrop-blur-sm flex items-center px-6 justify-between">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-gray-600 hover:text-gray-900" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search events, users..."
            className="pl-10 w-80 bg-gray-50 border-gray-200"
            value={searchValue}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-500 text-xs">
              {notificationCount}
            </Badge>
          )}
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="hidden md:inline text-sm font-medium">
            {getShortName(user?.name || user?.role || '')}
          </span>
        </div>
        <Button onClick={handleLogout} variant="ghost" size="sm">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  )
}
