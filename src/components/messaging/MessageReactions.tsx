import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Smile } from 'lucide-react'
import { useMessageReactions } from '../../hooks/use-message-reactions'
import { useAuth } from '../../hooks/use-auth'
import type { Message } from '../../types/message'

interface MessageReactionsProps {
  message: Message
  currentUserId: number
  className?: string
}

// Quick reaction emojis
const QUICK_REACTIONS = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '👍', label: 'Like' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '😮', label: 'Surprised' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '👏', label: 'Clap' },
]

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  message,
  currentUserId,
  className = '',
}) => {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const { user } = useAuth()
  
  const {
    reactions,
    reactionCounts,
    isLoading,
    toggleReaction,
  } = useMessageReactions({
    messageId: message.id,
    currentUserId,
  })

  // Ensure reactions is always an array
  const safeReactions = Array.isArray(reactions) ? reactions : []

  const handleReaction = async (emoji: string) => {
    if (!user?.id) return
    
    try {
      await toggleReaction(emoji)
    } catch (error) {
      console.error('Failed to toggle reaction:', error)
    }
  }

  const renderReactionButton = (reaction: typeof QUICK_REACTIONS[0]) => {
    const count = reactionCounts[reaction.emoji] || 0
    
    if (count === 0) return null

    const hasUserReacted = reactions.some(r => 
      r.user_id === currentUserId && r.emoji === reaction.emoji
    )

    return (
      <Button
        key={reaction.emoji}
        variant="ghost"
        size="sm"
        onClick={() => handleReaction(reaction.emoji)}
        className={`h-6 px-2 py-1 rounded-full text-xs transition-all hover:bg-gray-200 ${
          hasUserReacted ? 'bg-blue-100 text-blue-600' : ''
        }`}
      >
        <span className="mr-1">{reaction.emoji}</span>
        <span>{count}</span>
      </Button>
    )
  }

  const renderQuickReactions = () => {
    return (
      <div className="flex items-center space-x-1 bg-white rounded-lg p-2 shadow-lg border border-slate-200">
        {QUICK_REACTIONS.map((reaction) => (
          <Button
            key={reaction.emoji}
            variant="ghost"
            size="sm"
            onClick={() => handleReaction(reaction.emoji)}
            className="w-10 h-10 p-0 hover:bg-blue-50 hover:scale-110 transition-all duration-200 rounded-lg"
            title={reaction.label}
          >
            <span className="text-xl">{reaction.emoji}</span>
          </Button>
        ))}
      </div>
    )
  }

  const hasReactions = Object.keys(reactionCounts).length > 0

  if (!hasReactions && !isEmojiPickerOpen) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-7 h-7 p-0 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-50 rounded-full"
              title="Add reaction"
            >
              <Smile className="w-4 h-4 text-slate-500 hover:text-blue-600" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-0 shadow-xl" side="top" align="start">
            {renderQuickReactions()}
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  return (
    <div className={`flex items-center flex-wrap gap-1 ${className}`}>
      {/* Display existing reactions */}
      {Object.keys(reactionCounts).map(emoji => {
        const count = reactionCounts[emoji]
        const hasUserReacted = safeReactions.some(r => 
          r.user_id === currentUserId && r.emoji === emoji
        )
        
        return (
          <Button
            key={emoji}
            variant="ghost"
            size="sm"
            onClick={() => handleReaction(emoji)}
            className={`h-7 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 ${
              hasUserReacted 
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 shadow-sm' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
            title={hasUserReacted ? 'Remove your reaction' : 'React'}
          >
            <span className="mr-1 text-base">{emoji}</span>
            <span className="font-bold">{count}</span>
          </Button>
        )
      })}
      
      {/* Add reaction button */}
      <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-7 h-7 p-0 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-50 hover:scale-110 rounded-full"
            title="Add reaction"
          >
            <Smile className="w-4 h-4 text-slate-500 hover:text-blue-600" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-0 shadow-xl" side="top" align="start">
          {renderQuickReactions()}
        </PopoverContent>
      </Popover>
    </div>
  )
}