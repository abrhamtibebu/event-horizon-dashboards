import React from 'react'
import { extractUrls } from '../../lib/message-formatting'
import LinkPreview from './LinkPreview'
import { MarkdownMessage } from './MarkdownMessage'

interface FormattedMessageProps {
  content: string
  className?: string
  onClick?: () => void
  showLinkPreviews?: boolean
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({
  content,
  className = '',
  onClick,
  showLinkPreviews = true
}) => {
  // Extract URLs for link previews
  const urls = extractUrls(content)

  return (
    <div className={className} onClick={onClick}>
      <MarkdownMessage content={content} className="break-words" />
      {showLinkPreviews && urls.length > 0 && (
        <div className="mt-2">
          {urls.map((url, index) => (
            <LinkPreview key={index} url={url} />
          ))}
        </div>
      )}
    </div>
  )
}

export default FormattedMessage
