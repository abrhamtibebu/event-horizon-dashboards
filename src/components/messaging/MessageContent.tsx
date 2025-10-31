import React from 'react'
import FormattedMessage from './FormattedMessage'
import MarkdownMessage from './MarkdownMessage'
import { hasSpecialFormatting } from '../../lib/message-formatting'

interface MessageContentProps {
  content: string
  className?: string
  onClick?: () => void
  useMarkdown?: boolean
  showLinkPreviews?: boolean
}

export const MessageContent: React.FC<MessageContentProps> = ({
  content,
  className = '',
  onClick,
  useMarkdown = false,
  showLinkPreviews = true
}) => {
  // Check if content has complex markdown features
  const hasComplexMarkdown = /^#{1,6}\s|```|```|^\s*[-*+]\s|^\s*\d+\.\s|^\s*>\s|^\|.*\|/.test(content)
  
  // Use full markdown renderer if explicitly requested or if complex markdown is detected
  const shouldUseMarkdown = useMarkdown || hasComplexMarkdown

  if (shouldUseMarkdown) {
    return (
      <MarkdownMessage
        content={content}
        className={className}
        onClick={onClick}
      />
    )
  }

  // Use simple formatting for basic cases
  return (
    <FormattedMessage
      content={content}
      className={className}
      onClick={onClick}
      showLinkPreviews={showLinkPreviews}
    />
  )
}

export default MessageContent
