/**
 * Frontend file validation utilities
 * Note: This is for UX only - backend validation is mandatory
 */

export interface FileValidationResult {
  valid: boolean
  message: string
}

/**
 * Validate image file on frontend
 */
export function validateImageFile(file: File): FileValidationResult {
  // Check file size (2MB = 2048KB)
  const maxSizeKB = 2048
  const fileSizeKB = file.size / 1024
  
  if (fileSizeKB > maxSizeKB) {
    return {
      valid: false,
      message: `File size exceeds maximum allowed size of ${maxSizeKB}KB (${Math.round(fileSizeKB)}KB)`
    }
  }
  
  // Check file extension
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
  const extension = file.name.split('.').pop()?.toLowerCase()
  
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      message: `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`
    }
  }
  
  // Check MIME type
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedMimes.includes(file.type)) {
    return {
      valid: false,
      message: 'Invalid file type. Only image files are allowed.'
    }
  }
  
  // Check for dangerous double extensions
  const dangerousExtensions = ['php', 'phtml', 'php3', 'php4', 'php5', 'js', 'jsp', 'asp', 'aspx', 'exe', 'sh', 'bat', 'cmd']
  const parts = file.name.split('.')
  if (parts.length > 2) {
    const lastExtension = parts[parts.length - 1].toLowerCase()
    if (dangerousExtensions.includes(lastExtension)) {
      return {
        valid: false,
        message: 'File type not allowed. Dangerous file extensions are not permitted.'
      }
    }
  }
  
  return {
    valid: true,
    message: 'File is valid'
  }
}

/**
 * Validate document file on frontend
 */
export function validateDocumentFile(file: File): FileValidationResult {
  // Check file size (5MB = 5120KB)
  const maxSizeKB = 5120
  const fileSizeKB = file.size / 1024
  
  if (fileSizeKB > maxSizeKB) {
    return {
      valid: false,
      message: `File size exceeds maximum allowed size of ${maxSizeKB}KB (${Math.round(fileSizeKB)}KB)`
    }
  }
  
  // Check file extension
  const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx']
  const extension = file.name.split('.').pop()?.toLowerCase()
  
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      message: `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`
    }
  }
  
  // Check MIME type
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
  if (!allowedMimes.includes(file.type)) {
    return {
      valid: false,
      message: 'Invalid file type. Allowed document types only.'
    }
  }
  
  // Check for dangerous double extensions
  const dangerousExtensions = ['php', 'phtml', 'php3', 'php4', 'php5', 'js', 'jsp', 'asp', 'aspx', 'exe', 'sh', 'bat', 'cmd']
  const parts = file.name.split('.')
  if (parts.length > 2) {
    const lastExtension = parts[parts.length - 1].toLowerCase()
    if (dangerousExtensions.includes(lastExtension)) {
      return {
        valid: false,
        message: 'File type not allowed. Dangerous file extensions are not permitted.'
      }
    }
  }
  
  return {
    valid: true,
    message: 'File is valid'
  }
}

/**
 * Validate file based on type
 */
export function validateFile(file: File, type: 'image' | 'document'): FileValidationResult {
  if (type === 'image') {
    return validateImageFile(file)
  } else {
    return validateDocumentFile(file)
  }
}

