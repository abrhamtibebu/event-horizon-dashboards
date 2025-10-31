import React, { useState } from 'react'
import { Search, Users, Calendar, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { ScrollArea } from '../ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { getAllUsers, getMessagingContacts } from '../../lib/api'
import { useQuery } from '@tanstack/react-query'
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
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No users found</p>
                    <p className="text-sm">Try adjusting your search terms</p>
                  </div>
                ) : (
                  filteredUsers.map((user: User) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.profile_image} />
                        <AvatarFallback className="bg-gray-200 text-gray-600">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {user.name}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                        {user.role && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {user.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No events found</p>
                    <p className="text-sm">Try adjusting your search terms</p>
                  </div>
                ) : (
                  filteredEvents.map((event: Event) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventSelect(event)}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {event.location}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            Event Chat
                          </Badge>
                          <span className="text-xs text-gray-500">
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
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
