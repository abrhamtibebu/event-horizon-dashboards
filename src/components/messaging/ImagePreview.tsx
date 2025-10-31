import React, { useState } from 'react'
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/dialog'

interface ImagePreviewProps {
  src: string
  alt?: string
  className?: string
  onClick?: () => void
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  alt = 'Image',
  className = '',
  onClick,
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  return (
    <div className="relative group">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
      
      <img
        src={src}
        alt={alt}
        className={`
          max-w-xs max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          ${className}
        `}
        onClick={onClick}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
      />
      
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-gray-500 text-sm">Failed to load image</div>
        </div>
      )}
      
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="bg-white bg-opacity-80 hover:bg-opacity-100"
            onClick={onClick}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}




