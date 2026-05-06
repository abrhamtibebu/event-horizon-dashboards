import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Copy, Download, Share2, Loader2 } from 'lucide-react'
import { getApiBaseURLForStorage } from '@/config/env'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Props = {
  eventUuid: string
  eventName: string
  guestUuid: string
}

export function GuestShareBannerPanel({ eventUuid, eventName, guestUuid }: Props) {
  const [previewFailed, setPreviewFailed] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [copying, setCopying] = useState(false)

  const backendOrigin = useMemo(() => getApiBaseURLForStorage(), [])

  const shareLink = useMemo(() => {
    if (!backendOrigin || !eventUuid || !guestUuid) return null
    return `${backendOrigin}/share/attending/${encodeURIComponent(eventUuid)}/${encodeURIComponent(guestUuid)}`
  }, [backendOrigin, eventUuid, guestUuid])

  const bannerImageUrl = useMemo(() => {
    if (!shareLink) return null
    return `${shareLink}/image.png`
  }, [shareLink])

  const previewSrc = useMemo(() => {
    if (!bannerImageUrl) return null
    return bannerImageUrl
  }, [bannerImageUrl])

  const shareText = useMemo(() => {
    const cleanName = eventName?.trim() || 'this event'
    return `I'm attending "${cleanName}". Join me and secure your spot using this registration link:`
  }, [eventName])

  const preregLink = useMemo(() => {
    return `${window.location.origin}/event/register/${eventUuid}?type=prereg`
  }, [eventUuid])

  const fullCaption = useMemo(() => {
    if (!shareLink) return ''
    return `${shareText} ${shareLink}`
  }, [shareText, shareLink])

  const handleCopy = useCallback(async () => {
    setCopying(true)
    try {
      const textToCopy = `${shareText} ${preregLink}`

      if (bannerImageUrl && window.ClipboardItem) {
        try {
          const res = await fetch(bannerImageUrl, { cache: 'no-store' })
          const blob = await res.blob()
          const textBlob = new Blob([textToCopy], { type: 'text/plain' })
          
          const item = new ClipboardItem({
            [blob.type]: blob,
            'text/plain': textBlob
          })
          
          await navigator.clipboard.write([item])
          toast.success('Image & caption copied!')
          setCopying(false)
          return
        } catch (e) {
          console.warn("Rich copy failed, falling back to text", e)
        }
      }

      await navigator.clipboard.writeText(textToCopy)
      toast.success('Caption & link copied!')
    } catch {
      toast.error('Could not copy')
    } finally {
      setCopying(false)
    }
  }, [bannerImageUrl, shareText, preregLink])

  const handleDownload = useCallback(async () => {
    if (!bannerImageUrl) return
    try {
      const res = await fetch(bannerImageUrl, { cache: 'no-store' })
      if (!res.ok) throw new Error('download_failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `share-banner-${guestUuid.slice(0, 8)}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download banner')
    }
  }, [bannerImageUrl, guestUuid])

  const handleShareClick = async (platform: string) => {
    if (!shareLink) return
    let url = ''
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareText)}`
        break
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`
        break
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullCaption)}`
        break
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareText)}`
        break
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`
        break
      case 'native':
        if ('share' in navigator) {
          try {
            if (bannerImageUrl) {
              const res = await fetch(bannerImageUrl, { cache: 'no-store' })
              const blob = await res.blob()
              const file = new File([blob], `event-banner.png`, { type: blob.type })
              
              const shareDataWithFile = {
                title: eventName,
                text: shareText,
                url: shareLink,
                files: [file]
              }
              
              if (navigator.canShare && navigator.canShare(shareDataWithFile)) {
                await navigator.share(shareDataWithFile)
                return
              }
            }
          } catch (e) {
            console.error("Failed to share file directly", e)
          }

          navigator.share({
            title: eventName,
            text: shareText,
            url: shareLink,
          }).catch((err) => {
            if (err?.name !== 'AbortError') handleCopy()
          })
          return
        }
        handleCopy()
        return
    }
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (!guestUuid || !eventUuid) return null

  return (
    <Card className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">Share your banner</p>
        </div>
      </div>

      {previewSrc ? (
        <div className="mt-4 relative">
          {!previewFailed ? (
            <>
              {!imageLoaded && (
                <div className="w-full aspect-[1200/630] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center animate-pulse">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                  <p className="text-sm font-medium text-slate-500">Loading your social banner...</p>
                </div>
              )}
              <img
                src={previewSrc}
                alt="Your share banner preview"
                className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 ${!imageLoaded ? 'absolute opacity-0 pointer-events-none' : 'relative opacity-100'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setPreviewFailed(true)
                  setImageLoaded(true)
                }}
              />
            </>
          ) : (
            <div className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Banner preview couldn’t load
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Try downloading the image.
              </p>
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setPreviewFailed(false)} className="sm:flex-1">
                  Retry preview
                </Button>
                <Button type="button" variant="outline" onClick={handleDownload} className="sm:flex-1">
                  Download image
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={handleDownload} className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          Download image
        </Button>
      </div>

      <div className="mt-2 flex flex-col sm:flex-row gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="sm:flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share to socials
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {'share' in navigator && (
              <DropdownMenuItem onClick={() => handleShareClick('native')}>
                Native Share
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleShareClick('telegram')}>
              Telegram
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShareClick('whatsapp')}>
              WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShareClick('linkedin')}>
              LinkedIn
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShareClick('twitter')}>
              X / Twitter
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShareClick('facebook')}>
              Facebook
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button type="button" variant="outline" onClick={handleCopy} disabled={copying} className="sm:flex-1">
          {copying ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          {copying ? 'Copying...' : 'Copy caption + link'}
        </Button>
      </div>

      {shareLink ? (
        <div className="mt-3">
          <p className="text-[11px] font-medium text-slate-400 mb-1">Direct pre-registration link:</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 break-all bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
            {preregLink}
          </p>
        </div>
      ) : null}
    </Card>
  )
}

