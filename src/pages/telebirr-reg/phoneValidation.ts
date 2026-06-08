const ETHIO_TELECOM_MESSAGE = 'Please use an Ethio Telecom phone number.'

function cleanPhone(phone: string): string {
  return phone.trim().replace(/[\s\-()]/g, '')
}

function isSafaricomNumber(clean: string): boolean {
  return /^07\d{8}$/.test(clean) || /^\+2517\d{8}$/.test(clean) || /^7\d{8}$/.test(clean)
}

function isEthioTelecomNumber(clean: string): boolean {
  return /^09\d{8}$/.test(clean) || /^\+2519\d{8}$/.test(clean) || /^9\d{8}$/.test(clean)
}

export function validateEthioTelecomPhone(phone: string): { valid: boolean; message?: string } {
  const trimmed = phone.trim()
  if (!trimmed) {
    return { valid: false, message: 'Phone number is required' }
  }

  const clean = cleanPhone(trimmed)

  if (isSafaricomNumber(clean)) {
    return { valid: false, message: ETHIO_TELECOM_MESSAGE }
  }

  if (isEthioTelecomNumber(clean)) {
    return { valid: true }
  }

  return { valid: false, message: 'Please enter a valid phone number (09 or +251 9 format)' }
}

export function getEthioTelecomPhoneError(phone: string): string | null {
  const clean = cleanPhone(phone)
  if (!clean) return null

  if (/^07/.test(clean) || /^\+2517/.test(clean) || /^7\d/.test(clean) || isSafaricomNumber(clean)) {
    return ETHIO_TELECOM_MESSAGE
  }

  return null
}
