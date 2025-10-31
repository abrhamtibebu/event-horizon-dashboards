import { useState, useEffect, useCallback } from 'react'

interface MentionState {
  isActive: boolean
  query: string
  startIndex: number
  endIndex: number
}

export const useMentionDetection = (content: string, cursorPosition: number) => {
  const [mentionState, setMentionState] = useState<MentionState>({
    isActive: false,
    query: '',
    startIndex: -1,
    endIndex: -1,
  })

  useEffect(() => {
    // Find the last @ before cursor position
    const textBeforeCursor = content.substring(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex === -1) {
      setMentionState({
        isActive: false,
        query: '',
        startIndex: -1,
        endIndex: -1,
      })
      return
    }

    // Check if there's a space or newline before @ (or it's at the start)
    const charBeforeAt = lastAtIndex > 0 ? content[lastAtIndex - 1] : ' '
    const isValidStart = /[\s\n]/.test(charBeforeAt) || lastAtIndex === 0

    if (!isValidStart) {
      setMentionState({
        isActive: false,
        query: '',
        startIndex: -1,
        endIndex: -1,
      })
      return
    }

    // Get the text between @ and cursor
    const textAfterAt = content.substring(lastAtIndex + 1, cursorPosition)

    // Check if there's a space in the text after @ (which would end the mention)
    if (/[\s\n]/.test(textAfterAt)) {
      setMentionState({
        isActive: false,
        query: '',
        startIndex: -1,
        endIndex: -1,
      })
      return
    }

    // Valid mention in progress
    setMentionState({
      isActive: true,
      query: textAfterAt,
      startIndex: lastAtIndex,
      endIndex: cursorPosition,
    })
  }, [content, cursorPosition])

  const insertMention = useCallback(
    (userName: string, userId: number) => {
      if (!mentionState.isActive) return content

      // Replace the @query with @username
      const before = content.substring(0, mentionState.startIndex)
      const after = content.substring(mentionState.endIndex)
      const mention = `@${userName}`

      return `${before}${mention} ${after}`
    },
    [content, mentionState]
  )

  const extractMentions = useCallback((text: string): number[] => {
    // Extract all @username patterns
    // This is a simple regex, you might want to store user IDs with mentions
    const mentionRegex = /@(\w+)/g
    const matches = text.matchAll(mentionRegex)
    const userIds: number[] = []

    for (const match of matches) {
      // In a real implementation, you'd need to map usernames to user IDs
      // For now, we'll store this in a data attribute or separate field
    }

    return userIds
  }, [])

  return {
    mentionState,
    insertMention,
    extractMentions,
  }
}

