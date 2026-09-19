import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import type { User } from '../../types/message'

interface TypingIndicatorProps {
  users: User[]
  conversationId: string
  isGroup?: boolean
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  users,
  isGroup = false,
}) => {
  if (users.length === 0) return null

  const getInitials = (name: string) =>
    name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)

  const getTypingText = () => {
    if (users.length === 1) return `${users[0].name} is typing...`
    if (users.length === 2) return `${users[0].name} and ${users[1].name} are typing...`
    return `${users[0].name} and ${users.length - 1} others are typing...`
  }

  return (
    <div className="flex items-center gap-2">
      {isGroup && (
        <div className="flex -space-x-1.5">
          {users.slice(0, 3).map((user) => (
            <Avatar key={user.id} className="w-5 h-5 border-2 border-background">
              <AvatarImage src={user.profile_image} />
              <AvatarFallback className="bg-muted text-[8px]">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-duration:0.7s]" />
          <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-duration:0.7s] [animation-delay:120ms]" />
          <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-duration:0.7s] [animation-delay:240ms]" />
        </div>
        <span className="text-xs text-muted-foreground">{getTypingText()}</span>
      </div>
    </div>
  )
}
