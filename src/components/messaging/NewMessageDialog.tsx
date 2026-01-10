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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
          <DialogDescription>
            Choose a user or event to start a new conversation with.
          </DialogDescription>
          {getMessagingInfo() && (
            <div className="mt-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                      <Info className="w-3 h-3" />
                      <span>{getMessagingInfo()}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Messaging permissions are based on your role</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users or events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Type selector */}
          <div className="flex space-x-1">
            <Button
              variant={selectedType === 'users' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('users')}
              className="flex-1"
            >
              <Users className="w-3 h-3 mr-1" />
              Users
            </Button>
            {events.length > 0 && (
              <Button
                variant={selectedType === 'events' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('events')}
                className="flex-1"
              >
                <Calendar className="w-3 h-3 mr-1" />
                Events
              </Button>
            )}
          </div>
          
          {/* Results */}
          <ScrollArea className="h-64">
            {selectedType === 'users' ? (
              <div className="space-y-2">
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-2">
                        <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                          <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No users found</p>
                    <p className="text-sm">Try adjusting your search terms</p>
                    {getMessagingInfo() && (
                      <p className="text-xs mt-2 text-muted-foreground/70">
                        {getMessagingInfo()}
                      </p>
                    )}
                  </div>
                ) : searchQuery ? (
                  // Show flat list when searching
                  filteredUsers.map((user: User) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.profile_image} />
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground truncate">
                            {user.name}
                          </h3>
                          {getRoleBadge(user.role)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  // Show grouped list when not searching
                  <div className="space-y-4">
                    {groupedUsers.admins.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2 px-2">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Administrators
                          </h4>
                        </div>
                        {groupedUsers.admins.map((user: User) => (
                          <div
                            key={user.id}
                            onClick={() => handleUserSelect(user)}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user.profile_image} />
                              <AvatarFallback className="bg-muted text-muted-foreground">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-foreground truncate">
                                  {user.name}
                                </h3>
                                {getRoleBadge(user.role)}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {groupedUsers.organizers.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2 px-2">
                          <UserCog className="w-4 h-4 text-muted-foreground" />
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Organizers
                          </h4>
                        </div>
                        {groupedUsers.organizers.map((user: User) => (
                          <div
                            key={user.id}
                            onClick={() => handleUserSelect(user)}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user.profile_image} />
                              <AvatarFallback className="bg-muted text-muted-foreground">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-foreground truncate">
                                  {user.name}
                                </h3>
                                {getRoleBadge(user.role)}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {groupedUsers.staff.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2 px-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Staff
                          </h4>
                        </div>
                        {groupedUsers.staff.map((user: User) => (
                          <div
                            key={user.id}
                            onClick={() => handleUserSelect(user)}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user.profile_image} />
                              <AvatarFallback className="bg-muted text-muted-foreground">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-foreground truncate">
                                  {user.name}
                                </h3>
                                {getRoleBadge(user.role)}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {groupedUsers.ushers.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2 px-2">
                          <UserCheck className="w-4 h-4 text-muted-foreground" />
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Ushers
                          </h4>
                        </div>
                        {groupedUsers.ushers.map((user: User) => (
                          <div
                            key={user.id}
                            onClick={() => handleUserSelect(user)}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user.profile_image} />
                              <AvatarFallback className="bg-muted text-muted-foreground">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-foreground truncate">
                                  {user.name}
                                </h3>
                                {getRoleBadge(user.role)}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {groupedUsers.others.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2 px-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Others
                          </h4>
                        </div>
                        {groupedUsers.others.map((user: User) => (
                          <div
                            key={user.id}
                            onClick={() => handleUserSelect(user)}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user.profile_image} />
                              <AvatarFallback className="bg-muted text-muted-foreground">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-foreground truncate">
                                  {user.name}
                                </h3>
                                {getRoleBadge(user.role)}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No events found</p>
                    <p className="text-sm">Try adjusting your search terms</p>
                  </div>
                ) : (
                  filteredEvents.map((event: Event) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventSelect(event)}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-info" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {event.title}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {event.location}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            Event Chat
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.start_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
          
          {/* Footer */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
