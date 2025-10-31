import React from 'react'

interface MentionHighlightProps {
  content: string
  currentUserId?: number
  mentions?: number[]
}

export const MentionHighlight: React.FC<MentionHighlightProps> = ({
  content,
  currentUserId,
  mentions = [],
}) => {
  // Parse mentions in the content (@username format)
  const parseMentions = (text: string) => {
    const mentionRegex = /@(\w+)/g
    const parts: (string | JSX.Element)[] = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }

      // Add the mention as a highlighted span
      const username = match[1]
      const isSelf = username.toLowerCase().includes('you') // Simplified check
      
      parts.push(
        <span
          key={match.index}
          className={`inline-flex items-center px-1.5 py-0.5 rounded font-semibold ${
            isSelf
              ? 'bg-blue-100 text-blue-800'
              : 'bg-slate-200 text-slate-800'
          }`}
        >
          @{username}
        </span>
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts.length > 0 ? parts : [text]
  }

  const parsedContent = parseMentions(content)

  return (
    <>
      {parsedContent.map((part, index) => (
        <React.Fragment key={index}>{part}</React.Fragment>
      ))}
    </>
  )
}

