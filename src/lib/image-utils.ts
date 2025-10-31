import type { Message } from '../types/message'

export type ImageSize = 'thumbnail' | 'medium' | 'original'

/**
 * Get image URL for a message with specified size
 */
export const getMessageImageUrl = (message: Message, size: ImageSize = 'original'): string => {
  if (!message.file_path || !message.file_type?.startsWith('image/')) {
    return ''
  }

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  
  switch (size) {
    case 'thumbnail':
      return message.thumbnail_path 
        ? `${baseUrl}/storage/${message.thumbnail_path}`
        : `${baseUrl}/storage/${message.file_path}`
    
    case 'medium':
      return message.medium_path 
        ? `${baseUrl}/storage/${message.medium_path}`
        : `${baseUrl}/storage/${message.file_path}`
    
    case 'original':
    default:
      return `${baseUrl}/storage/${message.file_path}`
  }
}

/**
 * Get image dimensions for a message with specified size
 */
export const getMessageImageDimensions = (message: Message, size: ImageSize = 'original'): { width: number; height: number } => {
  switch (size) {
    case 'thumbnail':
      return {
        width: message.thumbnail_width || 0,
        height: message.thumbnail_height || 0,
      }
    
    case 'medium':
      return {
        width: message.medium_width || 0,
        height: message.medium_height || 0,
      }
    
    case 'original':
    default:
      return {
        width: message.original_width || 0,
        height: message.original_height || 0,
      }
  }
}

/**
 * Check if message has thumbnail
 */
export const hasMessageThumbnail = (message: Message): boolean => {
  return Boolean(message.thumbnail_path)
}

/**
 * Check if message has medium size
 */
export const hasMessageMediumSize = (message: Message): boolean => {
  return Boolean(message.medium_path)
}

/**
 * Get optimal image size for display based on container width
 */
export const getOptimalImageSize = (message: Message, containerWidth: number): ImageSize => {
  if (!message.file_path || !message.file_type?.startsWith('image/')) {
    return 'original'
  }

  // If container is small, use thumbnail
  if (containerWidth <= 200) {
    return hasMessageThumbnail(message) ? 'thumbnail' : 'original'
  }
  
  // If container is medium, use medium size
  if (containerWidth <= 400) {
    return hasMessageMediumSize(message) ? 'medium' : 'original'
  }
  
  // For large containers, use original
  return 'original'
}

/**
 * Preload image for better performance
 */
export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })
}

/**
 * Get image aspect ratio
 */
export const getImageAspectRatio = (message: Message, size: ImageSize = 'original'): number => {
  const dimensions = getMessageImageDimensions(message, size)
  
  if (dimensions.width === 0 || dimensions.height === 0) {
    return 1 // Default square aspect ratio
  }
  
  return dimensions.width / dimensions.height
}

/**
 * Check if image is landscape
 */
export const isImageLandscape = (message: Message, size: ImageSize = 'original'): boolean => {
  return getImageAspectRatio(message, size) > 1
}

/**
 * Check if image is portrait
 */
export const isImagePortrait = (message: Message, size: ImageSize = 'original'): boolean => {
  return getImageAspectRatio(message, size) < 1
}

/**
 * Check if image is square
 */
export const isImageSquare = (message: Message, size: ImageSize = 'original'): boolean => {
  const ratio = getImageAspectRatio(message, size)
  return ratio >= 0.9 && ratio <= 1.1
}



