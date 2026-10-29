const EXECUTABLE_MARKUP = [
  /<\s*\/?\s*(script|iframe|object|embed|svg|math|style|meta|link|base)\b/i,
  /<[^>]*\bon[a-z][a-z0-9_:-]*\s*=/i,
  /<[^>]*\b(?:href|src|xlink:href|formaction)\s*=\s*["']?\s*(?:javascript|vbscript|data)\s*:/i,
]

function containsUnsafeString(input: string): boolean {
  let decoded = input
  try {
    decoded = decodeURIComponent(input)
  } catch {
    // Keep checking the original text when it contains malformed escapes.
  }
  decoded = decoded
    .replace(/&lt;|&#0*60;|&#x0*3c;/gi, '<')
    .replace(/&gt;|&#0*62;|&#x0*3e;/gi, '>')
    .replace(/&quot;|&#0*34;|&#x0*22;/gi, '"')
    .replace(/&#0*39;|&#x0*27;/gi, "'")
  return EXECUTABLE_MARKUP.some((pattern) => pattern.test(decoded))
}

export function containsUnsafeUserInput(value: unknown): boolean {
  if (typeof value === 'string') {
    if (containsUnsafeString(value)) return true
    const trimmed = value.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return containsUnsafeUserInput(JSON.parse(trimmed))
      } catch {
        return false
      }
    }
    return false
  }

  if (Array.isArray(value)) return value.some(containsUnsafeUserInput)
  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    for (const [, entry] of value.entries()) {
      if (typeof entry === 'string' && containsUnsafeUserInput(entry)) return true
    }
    return false
  }
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.values(value).some(containsUnsafeUserInput)
  }
  return false
}
