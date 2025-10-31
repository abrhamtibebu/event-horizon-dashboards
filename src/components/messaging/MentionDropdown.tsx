import React, { useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { ScrollArea } from '../ui/scroll-area'
import { Loader2 } from 'lucide-react'
import type { User } from '../../types/message'

interface MentionDropdownProps {
  users: User[]
  isLoading: boolean
  selectedIndex: number
  onSelect: (user: User) => void
  position: { top: number; left: number }
}

export const MentionDropdown: React.FC<MentionDropdownProps> = ({
  users,
  isLoading,
  selectedIndex,
  onSelect,
  position,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selectedItemRef = useRef<HTMLDivElement>(null)

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    }
  }, [selectedIndex])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div
        className="absolute z-50 bg-white rounded-lg shadow-xl border border-slate-200 p-4"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-sm text-slate-600">Searching...</span>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return null
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: '280px',
        maxWidth: '360px',
      }}
    >
      <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
        <p className="text-xs font-semibold text-slate-700">
          Mention someone
        </p>
      </div>
      
      <ScrollArea className="max-h-64">
        <div className="py-1">
          {users.map((user, index) => (
            <div
              key={user.id}
              ref={index === selectedIndex ? selectedItemRef : null}
              onClick={() => onSelect(user)}
              className={`
                flex items-center space-x-3 px-3 py-2.5 cursor-pointer transition-colors
                ${
                  index === selectedIndex
                    ? 'bg-blue-50 border-l-4 border-blue-600'
                    : 'hover:bg-slate-50 border-l-4 border-transparent'
                }
              `}
            >
              <Avatar className="w-9 h-9 flex-shrink-0">
                <AvatarImage src={user.profile_image} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user.email}
                </p>
              </div>

              {index === selectedIndex && (
                <div className="text-xs text-blue-600 font-medium">
                  ↵ Enter
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="px-3 py-2 bg-slate-50 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          Use <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono">↓</kbd> to navigate, <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono">Enter</kbd> to select
        </p>
      </div>
    </div>
  )
}

