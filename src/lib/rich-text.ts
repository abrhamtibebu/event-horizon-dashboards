/**
 * Lightweight HTML helpers for rich-text descriptions.
 *
 * Mirrors the helpers used by evella.et so that descriptions saved from this
 * dashboard render correctly on the public event page.
 *
 * IMPORTANT: `stripDangerousTags` is a defence-in-depth measure. The real
 * sanitization should happen on the server. Never trust this alone.
 */

/** Detect whether a string contains HTML markup (so we can use the rich renderer). */
export function isProbablyHtml(text: string | null | undefined): boolean {
  if (!text) return false
  return /<\/?[a-z][\s\S]*>/i.test(text)
}

/**
 * Remove obviously dangerous constructs from user-authored HTML before
 * inserting it via dangerouslySetInnerHTML.
 *
 * This is intentionally minimal (matches evella.et). It strips:
 *   - <script>...</script> blocks
 *   - inline event handlers (onclick="..." etc.)
 *   - javascript: URLs in href/src
 */
export function stripDangerousTags(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"')
}

/**
 * Restrict editor output to a safe whitelist of inline formatting.
 *
 * Allowed tags: b, strong, i, em, u, br, p, div, span (with no attributes
 * other than a passthrough for line-break rendering).
 *
 * Everything else is unwrapped (children preserved) or removed.
 */
export function sanitizeRichText(html: string): string {
  if (!html) return ''

  const allowed = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'BR', 'P', 'DIV', 'SPAN'])
  const container = document.createElement('div')
  container.innerHTML = html

  const walk = (node: Element) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element
        walk(el)
        if (!allowed.has(el.tagName)) {
          const parent = el.parentNode
          if (parent) {
            while (el.firstChild) parent.insertBefore(el.firstChild, el)
            parent.removeChild(el)
          }
          return
        }
        Array.from(el.attributes).forEach((attr) => el.removeAttribute(attr.name))
      }
    })
  }

  walk(container)
  return container.innerHTML
}

/**
 * Returns true if the value has no visible content (only empty tags / whitespace).
 * Useful to treat an "empty" editor as no description at all.
 */
export function isRichTextEmpty(html: string | null | undefined): boolean {
  if (!html) return true
  const text = html
    .replace(/<br\s*\/?>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim()
  return text.length === 0
}

/**
 * Convert HTML to plain text for truncated previews (cards, tables, line-clamp).
 * Block-level tags become spaces, <br> becomes a newline.
 */
export function richTextToPlain(html: string | null | undefined): string {
  if (!html) return ''
  if (!isProbablyHtml(html)) return html
  return html
    .replace(/<br\s*\/?>/gi, '\n')
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
