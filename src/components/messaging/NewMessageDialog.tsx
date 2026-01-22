import React, { useState, useMemo } from 'react'
import { Search, Users, Calendar, X, Shield, UserCog, UserCheck, Info } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { ScrollArea } from '../ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { getAllUsers, getMessagingContacts } from '../../lib/api'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/use-auth'
import type { User, Event } from '../../types/message'

interface NewMessageDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelectUser: (user: User) => void
  onSelectEvent?: (event: Event) => void
  events?: Event[]
}

export const NewMessageDialog: React.FC<NewMessageDialogProps> = ({
  isOpen,
  onClose,
  onSelectUser,
  onSelectEvent,
  events = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<'users' | 'events'>('users')
  const { user: currentUser } = useAuth()

  const { data: usersData = [], isLoading } = useQuery({
    queryKey: ['messagingContacts'],
    queryFn: getMessagingContacts,
    enabled: isOpen,
  })

  // Handle different data structures from API
  const users = Array.isArray(usersData)
    ? usersData
    : Array.isArray(usersData?.data)
      ? usersData.data
      : []

  const filteredUsers = users.filter((user: User) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Helper function to check if value is in array (TypeScript safe)
  const in_array = (value: string | undefined, array: string[]): boolean => {
    return value ? array.includes(value) : false
  }

  // Group users by role/category
  const groupedUsers = useMemo(() => {
    const groups: Record<string, User[]> = {
      admins: [],
      organizers: [],
      staff: [],
      ushers: [],
      others: [],
    }

    filteredUsers.forEach((user: User) => {
      if (in_array(user.role, ['admin', 'superadmin'])) {
        groups.admins.push(user)
      } else if (in_array(user.role, ['organizer', 'organizer_admin'])) {
        groups.organizers.push(user)
      } else if (user.role === 'usher') {
        groups.ushers.push(user)
      } else if (user.organizer_id) {
        groups.staff.push(user)
      } else {
        groups.others.push(user)
      }
    })

    return groups
  }, [filteredUsers])

  // Get role badge variant and icon
  const getRoleBadge = (role: string | undefined) => {
    if (!role) return null

    const roleConfig: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive', icon: React.ReactNode, label: string }> = {
      admin: { variant: 'default', icon: <Shield className="w-3 h-3" />, label: 'Admin' },
      superadmin: { variant: 'default', icon: <Shield className="w-3 h-3" />, label: 'Super Admin' },
      organizer: { variant: 'secondary', icon: <UserCog className="w-3 h-3" />, label: 'Organizer' },
      organizer_admin: { variant: 'secondary', icon: <UserCog className="w-3 h-3" />, label: 'Organizer Admin' },
      usher: { variant: 'outline', icon: <UserCheck className="w-3 h-3" />, label: 'Usher' },
    }

    const config = roleConfig[role] || { variant: 'outline' as const, icon: null, label: role }
    return (
      <Badge variant={config.variant} className="text-xs flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  // Get messaging restrictions info based on current user role
  const getMessagingInfo = () => {
    if (!currentUser) return null

    const role = currentUser.role
    if (in_array(role, ['admin', 'superadmin'])) {
      return 'You can message organizers and their staff (except ushers)'
    } else if (in_array(role, ['organizer', 'organizer_admin'])) {
      return 'You can message admins and your staff (including ushers)'
    } else if (role === 'usher') {
      return 'You can message your organizer and event team members'
    }
    return null
  }

  const filteredEvents = events.filter((event: Event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleUserSelect = (user: User) => {
    onSelectUser(user)
    onClose()
  }

  const handleEventSelect = (event: Event) => {
    if (onSelectEvent) {
      onSelectEvent(event)
      onClose()
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setSelectedType('users')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-semibold">Start Conversation</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            Select a connection or event to begin messaging.
          </DialogDescription>
          {getMessagingInfo() && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-200 dark:border-blue-800 flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 leading-relaxed">
                {getMessagingInfo()}
              </p>
            </div>
          )}
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Search input */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-4 h-4" />
            <Input
              placeholder="Search by name, email or event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 focus:bg-white dark:focus:bg-gray-900 rounded-xl text-sm font-medium transition-all"
            />
          </div>

          {/* Type selector */}
          <div className="flex bg-gray-50 dark:bg-gray-900 p-1 rounded-xl h-11">
            <button
              onClick={() => setSelectedType('users')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-lg text-xs font-black uppercase tracking-tighter transition-all",
                selectedType === 'users'
                  ? "bg-white dark:bg-gray-800 text-primary shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Users className="w-4 h-4" />
              Users
            </button>
            {events.length > 0 && (
              <button
                onClick={() => setSelectedType('events')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-lg text-xs font-black uppercase tracking-tighter transition-all",
                  selectedType === 'events'
                    ? "bg-white dark:bg-gray-800 text-primary shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Calendar className="w-4 h-4" />
                Events
              </button>
            )}
          </div>

          {/* Results */}
          <ScrollArea className="h-[320px] pr-4">
            {selectedType === 'users' ? (
              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-2">
                        <div className="w-11 h-11 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-1/3" />
                          <div className="h-3 bg-gray-50 dark:bg-gray-900 rounded animate-pulse w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center gap-4 animate-in fade-in">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center border border-gray-100 dark:border-gray-800">
                      <Users className="w-8 h-8 text-gray-200 dark:text-gray-800" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">No users found</p>
                      <p className="text-xs text-gray-500">Try searching for a different name or email.</p>
                    </div>
                  </div>
                ) : searchQuery ? (
                  <div className="space-y-1">
                    {filteredUsers.map((user: User) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all text-left group"
                      >
                        <Avatar className="w-11 h-11 border-2 border-white dark:border-gray-950 shadow-sm group-hover:scale-105 transition-transform">
                          <AvatarImage src={user.profile_image} />
                          <AvatarFallback className="bg-primary text-white text-xs font-black">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-gray-900 dark:text-white text-sm truncate">
                              {user.name}
                            </span>
                            {user.role && (
                              <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-none text-[9px] font-black uppercase px-1.5 py-0">
                                {user.role}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs font-medium text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedUsers).map(([groupName, groupUsers]) => (
                      groupUsers.length > 0 && (
                        <div key={groupName} className="space-y-2">
                          <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2">
                            {groupName}
                          </h4>
                          <div className="space-y-1">
                            {groupUsers.map((user: User) => (
                              <button
                                key={user.id}
                                onClick={() => handleUserSelect(user)}
                                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all text-left group"
                              >
                                <Avatar className="w-11 h-11 border-2 border-white dark:border-gray-800 shadow-sm group-hover:scale-105 transition-transform">
                                  <AvatarImage src={user.profile_image} />
                                  <AvatarFallback className="bg-primary text-white text-xs font-black">
                                    {getInitials(user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <span className="block font-bold text-gray-900 dark:text-white text-sm truncate">
                                    {user.name}
                                  </span>
                                  <p className="text-[11px] font-medium text-gray-400 truncate">
                                    {user.email}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center gap-4 animate-in fade-in">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center border border-gray-100 dark:border-gray-800">
                      <Calendar className="w-8 h-8 text-gray-200 dark:text-gray-800" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">No events found</p>
                      <p className="text-xs text-gray-500">Try a different search term.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredEvents.map((event: Event) => (
                      <button
                        key={event.id}
                        onClick={() => handleEventSelect(event)}
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all text-left group border border-transparent hover:border-gray-100 dark:hover:border-gray-800"
                      >
                        <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-105 transition-transform flex-shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block font-bold text-gray-900 dark:text-white text-sm truncate">
                            {event.title}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge className="bg-primary/5 text-primary border-none text-[9px] font-black uppercase px-1.5 py-0">
                              Event Space
                            </Badge>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                              {new Date(event.start_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="text-gray-500 font-bold uppercase tracking-widest text-[10px] hover:bg-transparent hover:text-gray-900 dark:hover:text-white"
          >
            Cancel Action
          </Button>
        </div>
      </DialogContent>
    </Dialog>

  )
}
