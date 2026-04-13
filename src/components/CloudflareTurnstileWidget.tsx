import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      remove: (widgetId: string) => void
      reset: (widgetId: string) => void
    }
  }
}

let turnstileLoaderPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (turnstileLoaderPromise) return turnstileLoaderPromise

  turnstileLoaderPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('cloudflare-turnstile-script') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Turnstile script')))
      return
    }

    const script = document.createElement('script')
    script.id = 'cloudflare-turnstile-script'
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Turnstile script'))
    document.head.appendChild(script)
  })

  return turnstileLoaderPromise
}

interface CloudflareTurnstileWidgetProps {
  siteKey: string
  onTokenChange: (token: string | null) => void
  className?: string
}

export default function CloudflareTurnstileWidget({
  siteKey,
  onTokenChange,
  className,
}: CloudflareTurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!siteKey || !containerRef.current) return

    let mounted = true

    loadTurnstileScript()
      .then(() => {
        if (!mounted || !window.turnstile || !containerRef.current) return

        const widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onTokenChange(token),
          'expired-callback': () => onTokenChange(null),
          'error-callback': () => onTokenChange(null),
          theme: 'auto',
          size: 'normal',
        })
        widgetIdRef.current = widgetId
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : 'Failed to initialize Turnstile')
        onTokenChange(null)
      })

    return () => {
      mounted = false
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
  }, [siteKey, onTokenChange])

  return (
    <div className={className}>
      <div ref={containerRef} />
      {loadError && (
        <p className="mt-2 text-xs text-destructive">{loadError}</p>
      )}
    </div>
  )
}
