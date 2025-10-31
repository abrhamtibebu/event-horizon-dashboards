import React from 'react'
import { formatMessageContent, hasSpecialFormatting, extractUrls } from '../../lib/message-formatting'
import LinkPreview from './LinkPreview'

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
  // Check if content has special formatting
  const needsFormatting = hasSpecialFormatting(content)

  // Extract URLs for link previews
  const urls = extractUrls(content)

  if (!needsFormatting) {
    // Return plain text if no formatting needed
    return (
      <div className={className} onClick={onClick}>
        <span>{content}</span>
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

  // Format the content
  const formattedContent = formatMessageContent(content)

  return (
    <div className={className} onClick={onClick}>
      <span
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
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
