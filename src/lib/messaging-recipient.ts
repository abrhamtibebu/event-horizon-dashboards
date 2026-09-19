import type { Conversation, Message, User } from '@/types/message'

export function resolveCounterpartyFromMessage(
  message: Message | undefined | null,
  currentUserId: number | null | undefined
): User | null {
  if (!message || !currentUserId) return null
  if (message.sender_id === currentUserId) {
    return message.recipient || null
  }
  if (message.recipient_id === currentUserId) {
    return message.sender || null
  }
  return message.sender_id !== currentUserId ? message.sender : message.recipient || null
}

export function resolveConversationRecipient(
  conversation: Conversation | null | undefined,
  currentUserId: number | null | undefined
): User | null {
  if (!conversation) return null

  if (conversation.type === 'direct') {
    return conversation.participants?.[0] || null
  }

  const fromLast = resolveCounterpartyFromMessage(conversation.lastMessage, currentUserId)
  if (fromLast) return fromLast

  return conversation.participants?.[0] || null
}

export function resolveReplyRecipient(
  message: Message,
  currentUserId: number | null | undefined
): User | null {
  if (!currentUserId) return null
  if (message.sender_id !== currentUserId) return message.sender || null
  return message.recipient || resolveCounterpartyFromMessage(message, currentUserId)
}

export function uniqueCounterpartiesFromMessages(
  messages: Message[],
  currentUserId: number | null | undefined
): User[] {
  if (!currentUserId) return []
  const map = new Map<number, User>()
  for (const message of messages) {
    const user = resolveCounterpartyFromMessage(message, currentUserId)
    if (user?.id) map.set(user.id, user)
  }
  return Array.from(map.values())
}
