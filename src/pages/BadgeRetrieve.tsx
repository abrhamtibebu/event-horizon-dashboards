import { FormEvent, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { AlertCircle, CheckCircle, Download, Mail, Search, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import api, { lookupPublicBadge, type PublicBadgeLookupResponse } from '@/lib/api'
import { downloadPublicAttendeeBadgeWithToast } from '@/lib/publicBadgeDownload'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SpinnerInline } from '@/components/ui/spinner'

export default function BadgeRetrieve() {
  const { eventUuid } = useParams()
  const [searchParams] = useSearchParams()
  const [identifier, setIdentifier] = useState(searchParams.get('identifier') || '')
  const [lookupResult, setLookupResult] = useState<PublicBadgeLookupResponse | null>(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!eventUuid) {
      setError('Badge retrieval link is missing event information.')
      return
    }

    const trimmedIdentifier = identifier.trim()
    if (!trimmedIdentifier) {
      setError('Enter the email address or phone number used during registration.')
      return
    }

    setLookingUp(true)
    setError(null)
    setLookupResult(null)

    try {
      const response = await lookupPublicBadge(eventUuid, trimmedIdentifier)
      setLookupResult(response.data)
      toast.success('Registration found.')
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        'No registration was found for this event and contact information.'
      setError(message)
      toast.error(message)
    } finally {
      setLookingUp(false)
    }
  }

  const handleDownloadBadge = async () => {
    if (!lookupResult) return

    setDownloading(true)

    try {
      const ok = await downloadPublicAttendeeBadgeWithToast(
        {
          eventId: lookupResult.eventId,
          attendeeId: lookupResult.attendeeId,
          guestUuid: lookupResult.guestUuid,
          downloadFilename: `${lookupResult.guestName?.replace(/\s+/g, '-') || 'badge'}.pdf`,
        },
        'E-badge downloaded successfully.',
      )
      if (!ok) {
        return
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to download badge. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const isTelebirr = eventUuid === '4'
  const telebirrColors = {
    deepGreen: '#8DC63F',
    lightGreen: '#8DC63F',
    blue: '#005BAA',
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 font-['Outfit']">
      {isTelebirr && (
        <div className="w-full max-w-lg mb-8 flex items-center justify-between px-4">
          <img src="/ethio_telecom_logo.png" alt="Ethio Telecom" className="h-10 md:h-12 object-contain" />
          <img src="/telebirr5th year logo.png" alt="Telebirr" className="h-12 md:h-16 object-contain" />
        </div>
      )}
      <Card className="w-full max-w-lg bg-white dark:bg-slate-900 border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2rem] sm:rounded-[3rem] overflow-hidden">
        <div className="h-2" style={{ backgroundColor: isTelebirr ? telebirrColors.deepGreen : '#f97316' }} />
        <CardContent className="p-8 sm:p-12">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 border"
               style={{ 
                 backgroundColor: isTelebirr ? 'rgba(141, 198, 63, 0.1)' : 'rgba(249, 115, 22, 0.05)',
                 borderColor: isTelebirr ? 'rgba(141, 198, 63, 0.2)' : 'rgba(249, 115, 22, 0.1)'
               }}>
            <ShieldCheck className="w-10 h-10" style={{ color: isTelebirr ? telebirrColors.deepGreen : '#f97316' }} />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
              Retrieve Your E-Badge
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Enter the email address or phone number you used to register for this event.
            </p>
          </div>

          <form onSubmit={handleLookup} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Email or Phone
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="name@example.com or 0911..."
                  className="h-14 rounded-2xl pl-11 bg-slate-50 dark:bg-slate-800 border-none font-semibold"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={lookingUp}
              className="w-full min-h-14 h-14 text-white font-black text-base rounded-2xl shadow-lg transition-all active:scale-95"
              style={{ backgroundColor: isTelebirr ? telebirrColors.deepGreen : '#f97316' }}
            >
              {lookingUp ? (
                <SpinnerInline size="sm" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Search className="w-5 h-5" />
                  Find My Badge
                </span>
              )}
            </Button>
          </form>

          {lookupResult && (
            <div className="mt-8 space-y-6">
              <div className="rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-6 text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-3" style={{ color: isTelebirr ? telebirrColors.deepGreen : '#f97316' }} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Registration Found
                </p>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {lookupResult.guestName}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {lookupResult.eventName}
                </p>
              </div>

              <div className="flex justify-center px-2 w-full overflow-hidden">
                <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-inner border border-slate-100 w-[min(12.5rem,calc(100vw-4rem))] aspect-square flex items-center justify-center">
                  <QRCodeSVG value={lookupResult.qrCode} size={168} />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleDownloadBadge}
                disabled={downloading}
                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black text-base rounded-2xl"
              >
                {downloading ? (
                  <SpinnerInline size="sm" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" />
                    Download E-Badge
                  </span>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
