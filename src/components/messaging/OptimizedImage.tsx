import React, { useState, useRef, useEffect } from 'react'
import { Image as ImageIcon, Loader2 } from 'lucide-react'
import { getMessageImageUrl, getOptimalImageSize, getImageAspectRatio } from '../../lib/image-utils'
import type { Message } from '../../types/message'

interface OptimizedImageProps {
  message: Message
  containerWidth?: number
  maxWidth?: number
  maxHeight?: number
  className?: string
  onClick?: (originalUrl: string) => void
  loading?: 'lazy' | 'eager'
  showLoadingIndicator?: boolean
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  message,
  containerWidth = 320,
  maxWidth = 320,
  maxHeight = 400,
  className = '',
  onClick,
  loading = 'lazy',
  showLoadingIndicator = true,
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Determine optimal image size
  const optimalSize = getOptimalImageSize(message, containerWidth)
  const imageUrl = getMessageImageUrl(message, optimalSize)
  const originalUrl = getMessageImageUrl(message, 'original')
  const aspectRatio = getImageAspectRatio(message, optimalSize)

  // Calculate display dimensions maintaining aspect ratio
  let displayWidth = maxWidth
  let displayHeight = maxWidth / aspectRatio

  if (displayHeight > maxHeight) {
    displayHeight = maxHeight
    displayWidth = maxHeight * aspectRatio
  }

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (loading === 'lazy' && imgRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true)
              observerRef.current?.disconnect()
            }
          })
        },
        { threshold: 0.1 }
      )

      observerRef.current.observe(imgRef.current)

      return () => {
        observerRef.current?.disconnect()
      }
    } else {
      setIsInView(true)
    }
  }, [loading])

  const handleImageLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const handleClick = () => {
    if (onClick) {
      onClick(originalUrl)
    }
  }

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ width: `${displayWidth}px`, height: `${displayHeight}px` }}
      >
        <div className="text-center text-gray-500">
          <ImageIcon className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Failed to load image</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative group">
      {/* Loading indicator */}
      {isLoading && showLoadingIndicator && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
          style={{ width: `${displayWidth}px`, height: `${displayHeight}px` }}
        >
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Image */}
      {isInView && (
        <img
          ref={imgRef}
          src={imageUrl}
          alt={message.file_name || 'Image'}
          className={`rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${className}`}
          style={{
            width: `${displayWidth}px`,
            height: `${displayHeight}px`,
            objectFit: 'cover',
            opacity: isLoading ? 0 : 1,
          }}
          onClick={handleClick}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={loading}
        />
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center pointer-events-none">
        <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}

export default OptimizedImage



