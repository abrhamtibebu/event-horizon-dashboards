import React, { useMemo, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getMessagingContacts } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import type { User } from '@/types/message'

interface MessagesComposeViewProps {
  enabled?: boolean
  onChat: (user: User) => void
  className?: string
}

function getInitials(name: string) {
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
}

export function MessagesComposeView({
  enabled = true,
  onChat,
  className,
}: MessagesComposeViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const { user: currentUser } = useAuth()

  const { data: usersData = [], isLoading } = useQuery({
    queryKey: ['messagingContacts'],
    queryFn: getMessagingContacts,
    enabled,
  })

  const users: User[] = Array.isArray(usersData)
    ? usersData
    : Array.isArray((usersData as any)?.data)
      ? (usersData as any).data
      : []

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedUser = useMemo(
    () => filteredUsers.find(u => u.id === selectedId) || users.find(u => u.id === selectedId) || null,
    [filteredUsers, users, selectedId]
  )

  const messagingHint = useMemo(() => {
    if (!currentUser) return null
    const role = currentUser.role
    if (role === 'admin' || role === 'superadmin') return 'You can message organizers and their staff'
    if (role === 'organizer' || role === 'organizer_admin') return 'You can message admins and your staff'
    if (role === 'usher') return 'You can message your organizer and event team'
    return null
  }, [currentUser])

  return (
    <div className={cn('flex flex-col h-full min-h-0', className)}>
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold shrink-0">To:</span>
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="pl-6 h-8 border-0 bg-transparent shadow-none focus-visible:ring-0 px-6"
          />
        </div>
      </div>

      {messagingHint && (
        <p className="px-4 py-2 text-xs text-muted-foreground border-b border-border shrink-0">
          {messagingHint}
        </p>
      )}

      <div className="px-4 pt-3 pb-1 shrink-0">
        <p className="text-xs font-semibold text-muted-foreground">Suggested</p>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="pb-2">
          {isLoading ? (
            <div className="space-y-3 px-4 py-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
                    <div className="h-2.5 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No people found</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const selected = selectedId === user.id
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedId(user.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 text-left"
                >
                  <Avatar className="w-11 h-11 shrink-0">
                    <AvatarImage src={user.profile_image} />
                    <AvatarFallback className="bg-muted text-xs">
                      {getInitials(user.name || '?')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email || user.role}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center',
                      selected ? 'border-sky-500 bg-sky-500' : 'border-muted-foreground/50'
                    )}
                  >
                    {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border shrink-0">
        <Button
          className="w-full h-10 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold"
          disabled={!selectedUser}
          onClick={() => selectedUser && onChat(selectedUser)}
        >
          Chat
        </Button>
      </div>
    </div>
  )
}
