import React, { useState, useEffect } from 'react'
import { ExternalLink, Globe, Image as ImageIcon, FileText } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'

interface LinkPreviewProps {
  url: string
  className?: string
}

interface LinkMetadata {
  title?: string
  description?: string
  image?: string
  domain?: string
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({ url, className = '' }) => {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true)
        setError(false)
        
        // For now, we'll create a simple metadata extractor
        // In a real implementation, you'd want to use a proper link preview service
        const domain = new URL(url).hostname
        
        setMetadata({
          title: `Link to ${domain}`,
          description: `Visit ${url}`,
          domain: domain
        })
      } catch (err) {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchMetadata()
  }, [url])

  if (loading) {
    return (
      <Card className={`mt-2 max-w-sm ${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-500">Loading preview...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !metadata) {
    return (
      <Card className={`mt-2 max-w-sm ${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:text-blue-700 underline truncate"
            >
              {url}
            </a>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`mt-2 max-w-sm hover:shadow-md transition-shadow cursor-pointer ${className}`}>
      <CardContent className="p-3">
        <div className="flex space-x-3">
          {/* Preview image or icon */}
          <div className="flex-shrink-0">
            {metadata.image ? (
              <img
                src={metadata.image}
                alt={metadata.title}
                className="w-12 h-12 rounded object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                <Globe className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {metadata.title}
            </h4>
            {metadata.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {metadata.description}
              </p>
            )}
            <div className="flex items-center space-x-1 mt-1">
              <span className="text-xs text-gray-400 truncate">
                {metadata.domain}
              </span>
              <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default LinkPreview



