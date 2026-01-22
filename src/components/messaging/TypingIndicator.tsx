import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import type { User } from '../../types/message'

interface TypingIndicatorProps {
  users: User[]
  conversationId: string
  isGroup?: boolean
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  users,
  conversationId,
  isGroup = false,
}) => {
  if (users.length === 0) return null

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].name} is typing...`
    } else if (users.length === 2) {
      return `${users[0].name} and ${users[1].name} are typing...`
    } else {
      return `${users[0].name} and ${users.length - 1} others are typing...`
    }
  }

  return (
    <div className="flex items-center gap-2 animate-in fade-in duration-300">
      {/* Avatars for group chats */}
      {isGroup && (
        <div className="flex -space-x-2">
          {users.slice(0, 3).map((user) => (
            <Avatar key={user.id} className="w-5 h-5 border-2 border-white dark:border-gray-900 shadow-sm">
              <AvatarImage src={user.profile_image} />
              <AvatarFallback className="bg-primary text-white text-[8px] font-black">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          ))}
          {users.length > 3 && (
            <div className="w-5 h-5 rounded-full bg-gray-50 dark:bg-gray-800 border-2 border-white dark:border-gray-900 flex items-center justify-center">
              <span className="text-[8px] text-gray-400 font-black">+{users.length - 3}</span>
            </div>
          )}
        </div>
      )}

      {/* Typing animation */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-duration:0.6s]" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-duration:0.6s]" style={{ animationDelay: '200ms' }}></div>
          <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-duration:0.6s]" style={{ animationDelay: '400ms' }}></div>
        </div>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
          {getTypingText()}
        </span>
      </div>
    </div>
  )
}




