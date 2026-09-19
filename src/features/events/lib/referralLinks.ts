/**
 * Auto-detect storefront origins from the browser context (no VITE_* env URLs).
 * Dashboard runs on :5173 locally; Evella public site on :5174.
 * Production: app.validity.et / admin.evella.et → evella.et
 */

export function getDashboardOrigin(): string {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

export function detectEvellaOrigin(dashboardOrigin?: string): string {
  const origin = dashboardOrigin ?? getDashboardOrigin()
  if (!origin) return ''

  try {
    const url = new URL(origin)
    const { hostname, protocol, port } = url

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      if (!port || port === '5173') {
        return `${protocol}//${hostname}:5174`
      }
      if (port === '5174') {
        return origin
      }
    }

    if (
      hostname === 'app.validity.et' ||
      hostname === 'admin.evella.et' ||
      hostname === 'api.validity.et'
    ) {
      return `${protocol}//evella.et`
    }

    if (hostname.endsWith('.evella.et')) {
      const subdomain = hostname.split('.')[0]
      if (subdomain === 'admin' || subdomain === 'app' || subdomain === 'api') {
        return `${protocol}//evella.et`
      }
    }

    return origin
  } catch {
    return origin
  }
}

export function buildShareTicketLink(
  eventUuid: string,
  code: string,
  type: 'ref' | 'inv' = 'ref',
  eventId?: number,
) {
  if (eventId) {
    return buildDashboardsTicketLink(eventId, code, type)
  }
  return buildEvellaTicketLink(eventUuid, code, type)
}

export function buildEvellaTicketLink(eventUuid: string, code: string, type: 'ref' | 'inv' = 'ref') {
  const base = detectEvellaOrigin().replace(/\/$/, '')
  return `${base}/tickets/${eventUuid}?${type}=${encodeURIComponent(code)}`
}

export function buildDashboardsTicketLink(eventId: number, code: string, type: 'ref' | 'inv' = 'ref') {
  const base = getDashboardOrigin().replace(/\/$/, '')
  return `${base}/tickets/purchase/${eventId}?${type}=${encodeURIComponent(code)}`
}

export async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textArea = document.createElement('textarea')
  textArea.value = text
  document.body.appendChild(textArea)
  textArea.select()
  document.execCommand('copy')
  document.body.removeChild(textArea)
}
