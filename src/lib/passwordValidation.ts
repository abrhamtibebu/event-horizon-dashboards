/**
 * Frontend password validation utilities
 * Note: This is for UX only - backend validation is mandatory
 */

export interface PasswordValidationResult {
  valid: boolean
  message: string
  strength?: 'weak' | 'medium' | 'strong'
  requirements?: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    special: boolean
  }
}

// Minimum password lengths by role
const MIN_LENGTH_REGULAR = 8
const MIN_LENGTH_PRIVILEGED = 12

// Common weak passwords list
const COMMON_PASSWORDS = [
  'password',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty',
  'qwerty123',
  'abc123',
  'password123',
  'admin',
  'admin123',
  'letmein',
  'welcome',
  'monkey',
  '1234567',
  'sunshine',
  'princess',
  'football',
  'iloveyou',
  'master',
  'hello',
  'freedom',
  'whatever',
  'qazwsx',
  'trustno1',
  'dragon',
  'passw0rd',
  'superman',
  'qwertyuiop',
  'michael',
  'mustang',
]

/**
 * Validate password based on role requirements
 */
export function validatePassword(password: string, role: string = 'attendee'): PasswordValidationResult {
  // Check if password is empty
  if (!password || password.length === 0) {
    return {
      valid: false,
      message: 'Password is required.',
      strength: 'weak',
      requirements: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      },
    }
  }

  const minLength = role === 'admin' || role === 'superadmin' ? MIN_LENGTH_PRIVILEGED : MIN_LENGTH_REGULAR
  const requirements = {
    length: password.length >= minLength,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }

  // Check minimum length
  if (!requirements.length) {
    return {
      valid: false,
      message: `Password must be at least ${minLength} characters long.`,
      strength: 'weak',
      requirements,
    }
  }

  // Check if password is too common
  if (isCommonPassword(password)) {
    return {
      valid: false,
      message: 'This password is too common. Please choose a more secure password.',
      strength: 'weak',
      requirements,
    }
  }

  // Check complexity requirements
  const missingRequirements: string[] = []
  if (!requirements.uppercase) missingRequirements.push('uppercase letter')
  if (!requirements.lowercase) missingRequirements.push('lowercase letter')
  if (!requirements.number) missingRequirements.push('number')
  if (!requirements.special) missingRequirements.push('special character')

  if (missingRequirements.length > 0) {
    const missingList =
      missingRequirements.length > 1
        ? missingRequirements.slice(0, -1).join(', ') + ' and ' + missingRequirements[missingRequirements.length - 1]
        : missingRequirements[0]

    return {
      valid: false,
      message: `Password must contain at least one ${missingList}.`,
      strength: 'weak',
      requirements,
    }
  }

  // Calculate strength
  const strength = calculateStrength(password, requirements)

  return {
    valid: true,
    message: 'Password is valid.',
    strength,
    requirements,
  }
}

/**
 * Check if password is in common passwords list
 */
function isCommonPassword(password: string): boolean {
  const passwordLower = password.toLowerCase()

  // Check exact match
  if (COMMON_PASSWORDS.includes(passwordLower)) {
    return true
  }

  // Check if password contains common patterns
  const commonPatterns = [/^12345/, /^qwerty/, /^password/, /^admin/, /^letmein/]

  return commonPatterns.some((pattern) => pattern.test(passwordLower))
}

/**
 * Calculate password strength
 */
function calculateStrength(password: string, requirements: PasswordValidationResult['requirements']): 'weak' | 'medium' | 'strong' {
  if (!requirements) return 'weak'

  const metRequirements = Object.values(requirements).filter(Boolean).length
  const length = password.length

  // Strong: meets all requirements and is long
  if (metRequirements === 5 && length >= 12) {
    return 'strong'
  }

  // Medium: meets most requirements or is reasonably long
  if (metRequirements >= 4 && length >= 10) {
    return 'medium'
  }

  // Weak: otherwise
  return 'weak'
}

/**
 * Get password requirements text for a role
 */
export function getPasswordRequirements(role: string = 'attendee'): string {
  const minLength = role === 'admin' || role === 'superadmin' ? MIN_LENGTH_PRIVILEGED : MIN_LENGTH_REGULAR
  return `Password must be at least ${minLength} characters and contain uppercase, lowercase, number, and special character.`
}

