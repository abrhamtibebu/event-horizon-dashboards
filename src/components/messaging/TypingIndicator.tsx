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
    <div className="flex items-center space-x-2 px-4 py-2 animate-in slide-in-from-bottom-2 fade-in duration-300">
      {/* Avatars for group chats */}
      {isGroup && (
        <div className="flex -space-x-1">
          {users.slice(0, 3).map((user) => (
            <Avatar key={user.id} className="w-6 h-6 border border-white">
              <AvatarImage src={user.profile_image} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          ))}
          {users.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-200 border border-white flex items-center justify-center">
              <span className="text-xs text-gray-600 font-medium">+{users.length - 3}</span>
            </div>
          )}
        </div>
      )}

      {/* Typing animation */}
      <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span className="text-sm text-gray-600 font-medium">
          {getTypingText()}
        </span>
      </div>
    </div>
  )
}




