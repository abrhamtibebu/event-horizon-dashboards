import React from 'react'
import { Check, CheckCheck, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import type { Message, ReadReceipt } from '../../types/message'

interface ReadReceiptsProps {
  message: Message
  currentUserId: number
  isGroup?: boolean
  maxAvatars?: number
}

export const ReadReceipts: React.FC<ReadReceiptsProps> = ({
  message,
  currentUserId,
  isGroup = false,
  maxAvatars = 3,
}) => {
  const isOwnMessage = message.sender_id === currentUserId
  if (!isOwnMessage) return null

  const getMessageStatus = (message: Message): 'sent' | 'delivered' | 'read' | 'seen' => {
    if (message.seen_at) return 'seen'
    if (message.read_at) return 'read'
    if (message.delivered_at) return 'delivered'
    return 'sent'
  }

  const getStatusIcon = (status: 'sent' | 'delivered' | 'read' | 'seen') => {
    switch (status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />
      case 'delivered':
        return <Check className="w-3 h-3 text-gray-400" />
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />
      case 'seen':
        return <CheckCheck className="w-3 h-3 text-blue-600" />
      default:
        return <Check className="w-3 h-3 text-gray-400" />
    }
  }

  const status = getMessageStatus(message)
  const readReceipts = message.read_receipts || []
  
  // Filter out the sender from read receipts
  const otherUserReadReceipts = readReceipts.filter(receipt => receipt.user_id !== currentUserId)
  
  // For group chats, show avatars of users who have read the message
  if (isGroup && otherUserReadReceipts.length > 0) {
    const visibleReceipts = otherUserReadReceipts.slice(0, maxAvatars)
    const remainingCount = otherUserReadReceipts.length - maxAvatars

    return (
      <div className="flex items-center space-x-1 mt-1">
        {/* Status icon */}
        {getStatusIcon(status)}
        
        {/* User avatars */}
        <div className="flex -space-x-1">
          {visibleReceipts.map((receipt) => (
            <TooltipProvider key={receipt.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="w-4 h-4 border border-white">
                    <AvatarImage src={receipt.user.profile_image} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                      {receipt.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {receipt.user.name} read at {new Date(receipt.read_at).toLocaleTimeString()}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          
          {/* Show remaining count if there are more */}
          {remainingCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-4 h-4 rounded-full bg-gray-200 border border-white flex items-center justify-center">
                    <span className="text-xs text-gray-600 font-medium">+{remainingCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {remainingCount} more user{remainingCount > 1 ? 's' : ''} read this message
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    )
  }

  // For direct messages or when no read receipts, show simple status
  return (
    <div className="flex items-center space-x-1 mt-1">
      {getStatusIcon(status)}
    </div>
  )
}




