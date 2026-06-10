import React from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { downloadPublicAttendeeBadgeWithToast } from '@/lib/publicBadgeDownload'
import { CheckCircle, Download, Mail, Phone, Share2, Info, Loader2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'framer-motion'
import { GuestShareBannerPanel } from '@/components/share/GuestShareBannerPanel'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import api, { lookupPublicBadge } from '@/lib/api'
import { TELEBIRR_ASSETS, TELEBIRR_COLORS, DEFAULT_TELEBIRR_EVENT_ID } from './constants'
import { TelebirrRegLayout, TelebirrRegFooter } from './TelebirrRegLayout'
import { telebirrRegisterPath } from './routes'
import { loadRegistrationSuccess, saveRegistrationSuccess } from './sessionStorage'
import { mergeSuccessStates } from './successState'
import type { TelebirrEventData, TelebirrRegistrationSuccessState } from './types'

const TelebirrRegistrationSuccessPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { eventId = DEFAULT_TELEBIRR_EVENT_ID } = useParams<{ eventId: string }>()

  const routerState = (location.state as TelebirrRegistrationSuccessState | null) || null
  const persistedState = loadRegistrationSuccess()
  const mergedState = React.useMemo(
    () => mergeSuccessStates(routerState, persistedState),
    [routerState, persistedState],
  )

  const [hydratedEvent, setHydratedEvent] = React.useState<TelebirrEventData | null>(null)
  const [hydratedAttendeeId, setHydratedAttendeeId] = React.useState<number | null>(null)
  const [hydrating, setHydrating] = React.useState(false)
  const [showShareSection, setShowShareSection] = React.useState(false)

  const registrationData = mergedState?.registrationData
  const eventData = hydratedEvent ?? mergedState?.eventData

  const resolvedEventId = eventData?.id ?? Number(eventId)
  const resolvedEventUuid = eventData?.uuid ?? ''
  const resolvedAttendeeId = hydratedAttendeeId ?? registrationData?.id
  const guestUuid = registrationData?.guest_uuid || ''
  const qrValue = guestUuid
  const eventName = eventData?.title || eventData?.name || 'Event'
  const guestPhone = registrationData?.guest_phone || ''
  const guestEmail = registrationData?.guest_email || ''
  const hasRealEmail = Boolean(guestEmail) && !guestEmail.endsWith('@no-email.evella.et')
  const canShare = Boolean(guestUuid && resolvedEventUuid)
  const canDownloadBadge = Boolean(resolvedAttendeeId && resolvedEventId && guestUuid)

  React.useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  React.useEffect(() => {
    if (!registrationData) {
      return
    }

    const needsEvent = !mergedState?.eventData?.id || !mergedState?.eventData?.uuid
    const needsAttendeeId = !mergedState?.registrationData?.id

    if (!needsEvent && !needsAttendeeId) {
      return
    }

    let cancelled = false

    const hydrate = async () => {
      setHydrating(true)
      let nextEvent = mergedState?.eventData ?? null
      let nextAttendeeId = mergedState?.registrationData?.id ?? null

      if (needsEvent) {
        try {
          const response = await api.get(`/public/events/id/${eventId}`)
          nextEvent = response.data as TelebirrEventData
          if (!cancelled) {
            setHydratedEvent(nextEvent)
          }
        } catch {
          // keep partial state
        }
      }

      if (needsAttendeeId) {
        const identifier = registrationData.guest_phone || registrationData.guest_email
        const eventUuid = nextEvent?.uuid ?? mergedState?.eventData?.uuid
        if (identifier && eventUuid) {
          try {
            const lookup = await lookupPublicBadge(eventUuid, identifier)
            nextAttendeeId = lookup.data.attendeeId
            if (!cancelled) {
              setHydratedAttendeeId(nextAttendeeId)
            }
          } catch {
            // keep partial state
          }
        }
      }

      if (!cancelled && nextEvent?.id && nextEvent?.uuid) {
        saveRegistrationSuccess({
          registrationData: {
            ...registrationData,
            id: nextAttendeeId ?? registrationData.id,
          },
          eventData: nextEvent,
        })
      }

      if (!cancelled) {
        setHydrating(false)
      }
    }

    void hydrate()

    return () => {
      cancelled = true
    }
  }, [
    eventId,
    registrationData,
    mergedState?.eventData?.id,
    mergedState?.eventData?.uuid,
    mergedState?.registrationData?.id,
  ])

  const handleOpenShare = () => {
    if (hydrating) {
      toast.info('Loading your registration details…')
      return
    }
    if (!canShare) {
      toast.error('Missing registration data')
      return
    }
    setShowShareSection(true)
  }

  const handleDownloadBadge = async () => {
    if (hydrating) {
      toast.info('Loading your registration details…')
      return
    }
    if (!canDownloadBadge || !resolvedAttendeeId || !resolvedEventId) {
      toast.error('Missing registration data')
      return
    }

    try {
      await downloadPublicAttendeeBadgeWithToast(
        {
          eventId: resolvedEventId,
          attendeeId: resolvedAttendeeId,
          guestUuid,
          downloadFilename: `telebirr-badge-${registrationData?.registration_code || 'ticket'}.pdf`,
        },
        'Badge downloaded successfully!',
      )
    } catch {
      toast.error('Failed to download badge')
    }
  }

  if (!registrationData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Info className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Registration Found</h2>
          <p className="text-gray-500 mb-6">
            It looks like you haven&apos;t completed the registration process yet.
          </p>
          <Button
            onClick={() => navigate(telebirrRegisterPath(eventId))}
            style={{ backgroundColor: TELEBIRR_COLORS.deepGreen }}
          >
            Back to Registration
          </Button>
        </div>
      </div>
    )
  }

  return (
    <TelebirrRegLayout variant="success">
      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden relative">
          <div
            className="h-4 w-full"
            style={{
              background: `linear-gradient(to right, ${TELEBIRR_COLORS.deepGreen}, ${TELEBIRR_COLORS.lightGreen})`,
            }}
          />

          <div className="p-8 md:p-16">
            <div className="w-32 h-32 bg-[#8DC63F]/10 rounded-full flex items-center justify-center mx-auto mb-10 border-4 border-white shadow-inner">
              <CheckCircle className="w-16 h-16" style={{ color: TELEBIRR_COLORS.deepGreen }} />
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              You&apos;re Going!
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto font-medium">
              Your registration for{' '}
              <span className="font-bold text-gray-900">{eventName}</span> is successfully confirmed.
            </p>

            <div className="mb-12">
              <p className="text-2xl font-bold text-gray-900">{registrationData.guest_name}</p>
              {(registrationData.guest_job_title || registrationData.guest_company) && (
                <p className="text-gray-500 font-medium">
                  {registrationData.guest_job_title}
                  {registrationData.guest_job_title && registrationData.guest_company && ' at '}
                  {registrationData.guest_company}
                </p>
              )}
            </div>

            {guestUuid && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-12"
              >
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                  Entry QR Code
                </p>
                <div className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-xl inline-block relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-50" />
                  <div className="relative z-10">
                    <QRCodeSVG
                      value={qrValue}
                      size={200}
                      level="H"
                      includeMargin={false}
                      imageSettings={{
                        src: TELEBIRR_ASSETS.telebirrQrLogo,
                        x: undefined,
                        y: undefined,
                        height: 40,
                        width: 40,
                        excavate: true,
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#8DC63F] rounded-tl-2xl opacity-10 group-hover:opacity-30 transition-opacity" />
                </div>
              </motion.div>
            )}

            <div className="mb-12">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-100 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4 text-green-700" />
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Check your phone or E-Mail </h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    We&apos;ve sent a confirmation SMS with your guest ID and eBadge download link to{' '}
                    <span className="font-bold">{guestPhone || 'your phone number'}</span>
                    {hasRealEmail && (
                      <>, and your digital eBadge to <span className="font-bold">{guestEmail}</span></>
                    )}.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-gray-500 text-sm mb-12">Present this QR code for entry.</p>

            {!showShareSection && (
              <Button
                variant="outline"
                onClick={handleOpenShare}
                disabled={hydrating}
                className="w-full mb-8 h-14 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 font-bold transition-all"
              >
                {hydrating ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-500" />
                ) : (
                  <Share2 className="w-5 h-5 mr-2 text-blue-500" />
                )}
                Share your invitation banner
              </Button>
            )}

            {showShareSection && canShare && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-12 overflow-hidden"
              >
                <GuestShareBannerPanel
                  variant="telebirr"
                  eventUuid={resolvedEventUuid}
                  eventName={eventName}
                  guestUuid={guestUuid}
                />
              </motion.div>
            )}

            <div className="flex flex-col gap-4">
              <Button
                type="button"
                onClick={handleDownloadBadge}
                disabled={hydrating}
                className="h-20 w-full rounded-3xl text-xl font-black transition-all shadow-[0_15px_30px_rgba(0,171,78,0.3)] text-white active:scale-95"
                style={{ backgroundColor: TELEBIRR_COLORS.deepGreen }}
              >
                {hydrating ? (
                  <Loader2 className="w-7 h-7 mr-3 animate-spin" />
                ) : (
                  <Download className="w-7 h-7 mr-3" />
                )}
                Download E-Badge
              </Button>
            </div>
          </div>
        </div>

        <TelebirrRegFooter />
      </main>
    </TelebirrRegLayout>
  )
}

export default TelebirrRegistrationSuccessPage
