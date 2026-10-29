import DOMPurify from 'dompurify'

const RICH_TEXT_OPTIONS = {
  ALLOWED_TAGS: ['a', 'b', 'strong', 'i', 'em', 'u', 'br', 'p', 'div', 'span', 'ul', 'ol', 'li', 'blockquote'],
  ALLOWED_ATTR: ['href', 'title', 'rel'],
  FORBID_TAGS: ['style', 'iframe', 'object', 'embed', 'svg', 'math', 'form', 'input'],
  FORBID_ATTR: ['style'],
}

export function isProbablyHtml(text: string | null | undefined): boolean {
  return Boolean(text && /<\/?[a-z][\s\S]*>/i.test(text))
}

export function stripDangerousTags(html: string): string {
  return sanitizeRichText(html)
}

export function sanitizeRichText(html: string): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, RICH_TEXT_OPTIONS)
}

export function sanitizeEmailPreview(html: string): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'iframe', 'object', 'embed', 'svg', 'math', 'form', 'input'],
    FORBID_ATTR: ['style'],
  })
}

export function isRichTextEmpty(html: string | null | undefined): boolean {
  if (!html) return true
  const text = html.replace(/<br\s*\/?\s*>/gi, '').replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').trim()
  return text.length === 0
}

export function richTextToPlain(html: string | null | undefined): string {
  if (!html) return ''
  if (!isProbablyHtml(html)) return html
  return html
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|div|h\d|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
