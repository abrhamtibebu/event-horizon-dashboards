import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  DoorOpen,
  Layers,
  Loader2,
  MapPin,
  Pencil,
  Printer,
  QrCode,
  Search,
  Settings,
  UserPlus,
} from 'lucide-react'
import { toast } from 'sonner'
import QRCode from 'react-qr-code'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge as UiBadge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  OnsiteAttendee,
  OnsiteConfigResponse,
  OnsiteGuestType,
  checkInOnsiteAttendee,
  createOnsiteAttendee,
  getOnsiteConfig,
  markOnsiteBadgePrinted,
  searchOnsiteAttendees,
  updateOnsiteAttendee,
  verifyOnsiteAccess,
} from '@/lib/api/onsite'

const SESSION_KEY = 'evella_onsite_kiosk_session'

type PrintingMode = 'legacy' | 'classic' | 'fast_track'
type OutputMediaType = 'badge' | 'label' | 'both'
type BadgeOrientation = 'single' | 'double_portrait' | 'double_landscape'

interface StoredSession {
  token: string
  expires_at: string
  access_id?: string
}

interface AddGuestForm {
  name: string
  email: string
  phone: string
  company: string
  jobtitle: string
  country: string
  guest_type_id: string
  check_in: boolean
}

interface EditGuestForm {
  name: string
  company: string
  jobtitle: string
}

interface BadgePrintConfig {
  badgeHeight: number
  labelHeight: number
  qrCodeSize: number
  barcodeType: 'qr'
  fontLarge: number
  fontSmall: number
  orgLarge: number
  orgSmall: number
  outputMediaType: OutputMediaType
  printCategory: boolean
  printCountry: boolean
  orientation: BadgeOrientation
  reverseTopMargin: number
  categoryFontLarge: number
  categoryFontSmall: number
  batchBadgeHeight: number
  batchFontLarge: number
  batchFontSmall: number
  batchOrgLarge: number
  batchOrgSmall: number
  batchDesignationLarge: number
  batchDesignationSmall: number
  batchCategoryLarge: number
  batchCategorySmall: number
  batchDoubleSideMargin: number
}

const emptyGuestForm: AddGuestForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  jobtitle: '',
  country: '',
  guest_type_id: '',
  check_in: true,
}

const defaultBadgeConfig: BadgePrintConfig = {
  badgeHeight: 140,
  labelHeight: 0,
  qrCodeSize: 2,
  barcodeType: 'qr',
  fontLarge: 22,
  fontSmall: 16,
  orgLarge: 16,
  orgSmall: 14,
  outputMediaType: 'badge',
  printCategory: true,
  printCountry: true,
  orientation: 'double_portrait',
  reverseTopMargin: 260,
  categoryFontLarge: 26,
  categoryFontSmall: 22,
  batchBadgeHeight: 40,
  batchFontLarge: 22,
  batchFontSmall: 18,
  batchOrgLarge: 20,
  batchOrgSmall: 16,
  batchDesignationLarge: 14,
  batchDesignationSmall: 12,
  batchCategoryLarge: 26,
  batchCategorySmall: 22,
  batchDoubleSideMargin: 120,
}

export default function OnsiteRegistration() {
  const { accessId } = useParams()
  const navigate = useNavigate()
  const [accessInput, setAccessInput] = useState(accessId ?? '')
  const [printingMode, setPrintingMode] = useState<PrintingMode>('legacy')
  const [session, setSession] = useState<StoredSession | null>(() => readStoredSession())
  const [config, setConfig] = useState<OnsiteConfigResponse | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const [search, setSearch] = useState('')
  const [attendees, setAttendees] = useState<OnsiteAttendee[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedAttendee, setSelectedAttendee] = useState<OnsiteAttendee | null>(null)
  const [guestDialogOpen, setGuestDialogOpen] = useState(false)
  const [badgeConfigOpen, setBadgeConfigOpen] = useState(false)
  const [guestForm, setGuestForm] = useState<AddGuestForm>(emptyGuestForm)
  const [isSavingGuest, setIsSavingGuest] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState<EditGuestForm>({ name: '', company: '', jobtitle: '' })
  const [attendeeBeingEdited, setAttendeeBeingEdited] = useState<OnsiteAttendee | null>(null)
  const [isUpdatingGuest, setIsUpdatingGuest] = useState(false)
  const [printAttendees, setPrintAttendees] = useState<OnsiteAttendee[]>([])
  const [badgeConfig, setBadgeConfig] = useState<BadgePrintConfig>(defaultBadgeConfig)
  const printRef = useRef<HTMLDivElement>(null)
  const directAccessAttempted = useRef(false)

  const isReady = Boolean(session?.token && config)
  const stationLabel = config?.access_code.label || 'Onsite Registration'
  const eventName = config?.event.name || 'Event'
  const activeGuestType = useMemo(
    () => config?.guest_types.find((type) => String(type.id) === guestForm.guest_type_id),
    [config?.guest_types, guestForm.guest_type_id],
  )

  useEffect(() => {
    if (accessId && !session && !directAccessAttempted.current) {
      directAccessAttempted.current = true
      void verifyAccess(accessId)
    }
  }, [accessId, session])

  useEffect(() => {
    if (!session?.token) return

    setIsLoadingConfig(true)
    getOnsiteConfig(session.token)
      .then((res) => {
        setConfig(res.data)
        setGuestForm((current) => ({
          ...current,
          guest_type_id: current.guest_type_id || String(res.data.guest_types[0]?.id ?? ''),
        }))
      })
      .catch(() => {
        toast.error('Your onsite session expired. Please enter the Access ID again.')
        clearSession()
      })
      .finally(() => setIsLoadingConfig(false))
  }, [session?.token])

  useEffect(() => {
    if (!config?.event.id) return
    setBadgeConfig(readBadgeConfig(config.event.id))
  }, [config?.event.id])

  const verifyAccess = async (code = accessInput) => {
    if (!code.trim()) {
      toast.error('Access ID required to continue')
      return
    }

    setIsVerifying(true)
    try {
      const res = await verifyOnsiteAccess(code.trim(), printingMode)
      const nextSession = {
        token: res.data.token,
        expires_at: res.data.expires_at,
        access_id: code.trim(),
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
      setSession(nextSession)
      setConfig({
        access_code: res.data.access_code,
        event: res.data.event,
        guest_types: res.data.guest_types,
        stats: res.data.stats,
      })
      setGuestForm((current) => ({
        ...current,
        guest_type_id: current.guest_type_id || String(res.data.guest_types[0]?.id ?? ''),
      }))
      if (!accessId) navigate(`/reg/${encodeURIComponent(code.trim())}`, { replace: true })
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid Access ID')
    } finally {
      setIsVerifying(false)
    }
  }

  const clearSession = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setSession(null)
    setConfig(null)
    setAttendees([])
    setSelectedAttendee(null)
    setSearch('')
    navigate('/reg', { replace: true })
  }

  const handleSearch = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!session?.token) return

    setIsSearching(true)
    try {
      const res = await searchOnsiteAttendees(session.token, search.trim())
      setAttendees(res.data)
      if (res.data.length === 1) {
        setSelectedAttendee(res.data[0])
      }
      if (search.trim() && res.data.length === 0) {
        toast.info('No matching attendee found.')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not search attendees')
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddGuest = async (event: FormEvent) => {
    event.preventDefault()
    if (!session?.token || !guestForm.guest_type_id) return

    setIsSavingGuest(true)
    try {
      const res = await createOnsiteAttendee(session.token, {
        name: guestForm.name,
        email: guestForm.email || undefined,
        phone: guestForm.phone || undefined,
        company: guestForm.company || undefined,
        jobtitle: guestForm.jobtitle || undefined,
        country: guestForm.country || undefined,
        guest_type_id: Number(guestForm.guest_type_id),
        check_in: guestForm.check_in,
      })
      setConfig((current) => current ? { ...current, stats: res.data.stats } : current)
      setSelectedAttendee(res.data.attendee)
      setAttendees((current) => [res.data.attendee, ...current])
      setGuestDialogOpen(false)
      setGuestForm({ ...emptyGuestForm, guest_type_id: guestForm.guest_type_id })
      toast.success('Guest registered successfully')
      if (config?.access_code.can_print) {
        await printBadge(res.data.attendee)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not register guest')
    } finally {
      setIsSavingGuest(false)
    }
  }

  const openEditGuest = (attendee: OnsiteAttendee) => {
    setAttendeeBeingEdited(attendee)
    setEditForm({
      name: attendee.guest?.name || '',
      company: attendee.guest?.company || '',
      jobtitle: attendee.guest?.jobtitle || attendee.guest?.job_title || '',
    })
    setEditDialogOpen(true)
  }

  const handleEditGuest = async (event: FormEvent) => {
    event.preventDefault()
    if (!session?.token || !attendeeBeingEdited) return

    setIsUpdatingGuest(true)
    try {
      const res = await updateOnsiteAttendee(session.token, attendeeBeingEdited.id, {
        name: editForm.name,
        company: editForm.company || undefined,
        jobtitle: editForm.jobtitle || undefined,
      })
      updateAttendee(res.data.attendee)
      setSelectedAttendee(res.data.attendee)
      setEditDialogOpen(false)
      toast.success('Guest badge data updated')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not update guest data')
    } finally {
      setIsUpdatingGuest(false)
    }
  }

  const checkIn = async (attendee: OnsiteAttendee) => {
    if (!session?.token) return
    try {
      const res = await checkInOnsiteAttendee(session.token, attendee.id)
      setConfig((current) => current ? { ...current, stats: res.data.stats } : current)
      updateAttendee(res.data.attendee)
      setSelectedAttendee(res.data.attendee)
      toast.success('Check-in successful')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not check in attendee')
    }
  }

  const printBadge = async (attendee = selectedAttendee) => {
    if (!session?.token || !attendee) {
      toast.info('Select an attendee before printing.')
      return
    }

    setPrintAttendees([normalizePrintAttendee(attendee)])

    window.setTimeout(async () => {
      if (!printRef.current) {
        toast.error('Print area not ready.')
        return
      }

      window.print()

      try {
        const res = await markOnsiteBadgePrinted(session.token, attendee.id)
        updateAttendee(res.data.attendee)
        setConfig((current) => current ? { ...current, stats: res.data.stats } : current)
      } catch {
        updateAttendee({ ...attendee, badge_printed_at: new Date().toISOString() })
      }

      window.setTimeout(() => setPrintAttendees([]), 1000)
    }, 100)
  }

  const batchPrint = async () => {
    if (!session?.token || !config?.access_code.can_print) return

    const selectedGuestTypeId = guestForm.guest_type_id ? Number(guestForm.guest_type_id) : undefined
    let printableAttendees = attendees.filter((attendee) => (
      selectedGuestTypeId ? attendee.guest_type_id === selectedGuestTypeId : true
    ))

    try {
      const res = await searchOnsiteAttendees(session.token, '', {
        guestTypeId: selectedGuestTypeId,
        limit: 500,
      })
      printableAttendees = res.data
      setAttendees(res.data)
    } catch {
      if (printableAttendees.length === 0) {
        toast.error('Could not load attendees for batch printing.')
        return
      }
    }

    if (printableAttendees.length === 0) {
      toast.info('Search or load attendees for this category before batch printing.')
      return
    }

    setPrintAttendees(printableAttendees.map(normalizePrintAttendee))

    window.setTimeout(async () => {
      window.print()

      await Promise.allSettled(
        printableAttendees.map((attendee) => markOnsiteBadgePrinted(session.token, attendee.id)),
      )
      setAttendees((current) => current.map((attendee) => (
        printableAttendees.some((printed) => printed.id === attendee.id)
          ? { ...attendee, badge_printed_at: new Date().toISOString() }
          : attendee
      )))
      setConfig((current) => current
        ? {
            ...current,
            stats: {
              ...current.stats,
              printed: current.stats.printed + printableAttendees.length,
            },
          }
        : current)
      window.setTimeout(() => setPrintAttendees([]), 1000)
    }, 100)
  }

  const updateAttendee = (attendee: OnsiteAttendee) => {
    setAttendees((current) => {
      const exists = current.some((item) => item.id === attendee.id)
      if (!exists) return [attendee, ...current]
      return current.map((item) => item.id === attendee.id ? attendee : item)
    })
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-950">
        <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 py-12">
          <img src="/evella-logo.png" alt="Evella" className="mb-6 h-16 object-contain" />
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void verifyAccess()
            }}
            className="w-full max-w-md rounded-sm border border-slate-200 bg-white p-8 shadow-sm"
          >
            <h1 className="text-xl font-semibold text-slate-950">Check-In & Print Badge</h1>
            <p className="mt-2 text-sm text-slate-500">Input Access ID to continue.</p>

            <div className="mt-6 space-y-2">
              <Label htmlFor="access-id" className="text-slate-700">Access ID</Label>
              <Input
                id="access-id"
                value={accessInput}
                onChange={(event) => setAccessInput(event.target.value)}
                placeholder="Enter access id here"
                className="bg-white"
                autoFocus
              />
            </div>

            <div className="mt-6 space-y-3">
              <Label className="text-slate-700">Select Printing Mode</Label>
              <div className="grid grid-cols-3 gap-3">
                <ModeButton mode="legacy" current={printingMode} onChange={setPrintingMode} icon={<Layers className="h-4 w-4" />} label="Legacy" />
                <ModeButton mode="classic" current={printingMode} onChange={setPrintingMode} icon={<Printer className="h-4 w-4" />} label="Classic" />
                <ModeButton mode="fast_track" current={printingMode} onChange={setPrintingMode} icon={<BadgeCheck className="h-4 w-4" />} label="Fast Track" />
              </div>
            </div>

            <Button type="submit" className="mt-6 h-11 w-full" disabled={isVerifying || isLoadingConfig}>
              {isVerifying || isLoadingConfig ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit
            </Button>
            <p className="mt-5 text-center text-xs text-slate-400">
              {accessInput.trim() ? 'Access ID will be verified securely' : 'Access ID required to continue'}
            </p>
          </form>
        </main>
        <KioskFooter />
      </div>
    )
  }

  return (
    <div className="onsite-registration-page min-h-screen bg-slate-100 text-slate-950">
      <div
        ref={printRef}
        className="printable-badge-container"
        style={{
          position: 'absolute',
          top: -9999,
          left: -9999,
          width: 1,
          height: 1,
          overflow: 'hidden',
        }}
      >
        <style>{`
          @media print {
            @page { size: 4in 4in; margin: 0; }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 4in !important;
              min-height: 4in !important;
              background: white !important;
              overflow: hidden !important;
            }
            .onsite-registration-page {
              width: 4in !important;
              min-height: 4in !important;
              height: auto !important;
              overflow: hidden !important;
              background: white !important;
            }
            .onsite-screen-content {
              display: none !important;
            }
            .printable-badge-container {
              display: block !important;
              position: static !important;
              width: 4in !important;
              height: auto !important;
              overflow: visible !important;
            }
            #onsite-print-area {
              position: static !important;
              width: 4in !important;
              height: auto !important;
              overflow: visible !important;
              background: white !important;
            }
            .printable-badge-batch {
              width: 4in !important;
              height: 4in !important;
              page-break-before: avoid !important;
              page-break-after: always !important;
              page-break-inside: avoid !important;
              break-before: avoid !important;
              break-after: page !important;
              break-inside: avoid !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              visibility: visible !important;
            }
            .printable-badge-batch:last-child {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
          }
        `}</style>
        <div id="onsite-print-area">
          {printAttendees.map((attendee) => (
            <div key={attendee.id} className="printable-badge-batch">
              <OnsiteConfiguredBadge
                attendee={attendee}
                eventName={eventName}
                config={badgeConfig}
              />
            </div>
          ))}
        </div>
      </div>

      <header className="onsite-screen-content border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <img src="/evella-logo.png" alt="Evella" className="h-10 object-contain" />
          <div className="flex items-center gap-3 text-right">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <BadgeCheck className="h-4 w-4" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs text-slate-500">{stationLabel}</p>
              <p className="text-sm font-semibold">Onsite Kiosk</p>
            </div>
          </div>
        </div>
      </header>

      <main className="onsite-screen-content mx-auto max-w-7xl px-6 py-8">
        <section className="mb-5">
          <h1 className="text-xl font-semibold">{eventName}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span>Station: <span className="font-medium text-primary">{stationLabel}</span></span>
            <UiBadge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Active
            </UiBadge>
            {config.event.venue_name || config.event.location ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {config.event.venue_name || config.event.location}
              </span>
            ) : null}
          </div>
        </section>

        <section className="mb-5 flex flex-wrap gap-3">
          <Button onClick={() => void batchPrint()} className="gap-2" disabled={!config.access_code.can_print || attendees.length === 0}>
            <Layers className="h-4 w-4" />
            Batch Print
          </Button>
          <Select
            value={guestForm.guest_type_id || String(config.guest_types[0]?.id ?? '')}
            onValueChange={(value) => setGuestForm((current) => ({ ...current, guest_type_id: value }))}
          >
            <SelectTrigger className="w-full bg-white sm:w-72">
              <SelectValue placeholder="Main Registration" />
            </SelectTrigger>
            <SelectContent>
              {config.guest_types.map((type) => (
                <SelectItem key={type.id} value={String(type.id)}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="secondary" className="gap-2" onClick={() => setGuestDialogOpen(true)} disabled={!config.access_code.can_register}>
            <UserPlus className="h-4 w-4" />
            Add Guest
          </Button>
          <Button variant="secondary" className="gap-2" onClick={() => setBadgeConfigOpen(true)}>
            <Settings className="h-4 w-4" />
            Configure Badges
          </Button>
          <Button variant="outline" className="ml-auto gap-2 bg-white" onClick={clearSession}>
            <DoorOpen className="h-4 w-4" />
            Sign Out
          </Button>
        </section>

        <section className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSearch}>
            <Label htmlFor="badge-search" className="text-slate-700">Scan Badge</Label>
            <div className="mt-3 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="badge-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Badge URN, REG number, name, email, phone, or QR UUID"
                  className="bg-white pl-9"
                />
              </div>
              <Button type="submit" disabled={isSearching} className="min-w-32">
                {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit
              </Button>
            </div>
          </form>
        </section>

        <StatsBar stats={config.stats} />

        <section className="mt-12">
          {attendees.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center text-center text-slate-500">
              <QrCode className="mb-3 h-10 w-10 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-800">Ready to Scan</h2>
              <p className="mt-1 text-sm">Enter URN or scan badge to begin</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {attendees.map((attendee) => (
                <AttendeeResult
                  key={attendee.id}
                  attendee={attendee}
                  selected={selectedAttendee?.id === attendee.id}
                  onSelect={() => setSelectedAttendee(attendee)}
                  onEdit={() => openEditGuest(attendee)}
                  onCheckIn={() => void checkIn(attendee)}
                  onPrint={() => void printBadge(attendee)}
                  canEdit={config.access_code.can_register}
                  canCheckIn={config.access_code.can_check_in}
                  canPrint={config.access_code.can_print}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleAddGuest}>
            <DialogHeader>
              <DialogTitle>Add Onsite Guest</DialogTitle>
              <DialogDescription>
                Register a walk-up guest for {eventName}. They can be checked in and printed immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" required value={guestForm.name} onChange={(value) => setGuestForm((current) => ({ ...current, name: value }))} />
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={guestForm.guest_type_id} onValueChange={(value) => setGuestForm((current) => ({ ...current, guest_type_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.guest_types.map((type: OnsiteGuestType) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Email" type="email" value={guestForm.email} onChange={(value) => setGuestForm((current) => ({ ...current, email: value }))} />
              <Field label="Phone" value={guestForm.phone} onChange={(value) => setGuestForm((current) => ({ ...current, phone: value }))} />
              <Field label="Company" value={guestForm.company} onChange={(value) => setGuestForm((current) => ({ ...current, company: value }))} />
              <Field label="Job Title" value={guestForm.jobtitle} onChange={(value) => setGuestForm((current) => ({ ...current, jobtitle: value }))} />
              <Field label="Country" value={guestForm.country} onChange={(value) => setGuestForm((current) => ({ ...current, country: value }))} />
              <label className="flex items-center gap-2 pt-8 text-sm">
                <input
                  type="checkbox"
                  checked={guestForm.check_in}
                  onChange={(event) => setGuestForm((current) => ({ ...current, check_in: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 accent-primary"
                />
                Check in immediately
              </label>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setGuestDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSavingGuest || !guestForm.name || !activeGuestType}>
                {isSavingGuest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Register & Print
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <BadgeConfigurationDialog
        open={badgeConfigOpen}
        onOpenChange={setBadgeConfigOpen}
        config={badgeConfig}
        onApply={(nextConfig) => {
          setBadgeConfig(nextConfig)
          if (config?.event.id) {
            saveBadgeConfig(config.event.id, nextConfig)
          }
          setBadgeConfigOpen(false)
          toast.success('Badge settings applied')
        }}
      />

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <form onSubmit={handleEditGuest}>
            <DialogHeader>
              <DialogTitle>Edit Badge Data</DialogTitle>
              <DialogDescription>
                Update the name, company, and delegation/job title that will appear on the printed badge.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5 grid gap-4">
              <Field label="Full Name" required value={editForm.name} onChange={(value) => setEditForm((current) => ({ ...current, name: value }))} />
              <Field label="Company" value={editForm.company} onChange={(value) => setEditForm((current) => ({ ...current, company: value }))} />
              <Field label="Delegation / Job Title" value={editForm.jobtitle} onChange={(value) => setEditForm((current) => ({ ...current, jobtitle: value }))} />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isUpdatingGuest || !editForm.name.trim()}>
                {isUpdatingGuest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="onsite-screen-content">
        <KioskFooter />
      </div>
    </div>
  )
}

function ModeButton({
  mode,
  current,
  onChange,
  icon,
  label,
}: {
  mode: PrintingMode
  current: PrintingMode
  onChange: (mode: PrintingMode) => void
  icon: ReactNode
  label: string
}) {
  const active = mode === current
  return (
    <button
      type="button"
      onClick={() => onChange(mode)}
      className={`flex h-10 items-center justify-center gap-2 rounded-sm border text-xs transition ${
        active ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-500 hover:border-primary/50'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function StatsBar({ stats }: { stats: OnsiteConfigResponse['stats'] }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <Stat label="Registered" value={stats.registered} />
      <Stat label="Checked In" value={stats.checked_in} />
      <Stat label="Printed" value={stats.printed} />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function BadgeConfigurationDialog({
  open,
  onOpenChange,
  config,
  onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: BadgePrintConfig
  onApply: (config: BadgePrintConfig) => void
}) {
  const [draft, setDraft] = useState<BadgePrintConfig>(config)

  useEffect(() => {
    if (open) setDraft(config)
  }, [config, open])

  const updateNumber = (key: keyof BadgePrintConfig, value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: Number(value) || 0,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Badge Configuration</DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          <section>
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Physical Dimensions</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <ConfigNumber label="Badge Height (px)" value={draft.badgeHeight} onChange={(value) => updateNumber('badgeHeight', value)} />
              <ConfigNumber label="Label Height (px)" value={draft.labelHeight} onChange={(value) => updateNumber('labelHeight', value)} />
              <ConfigNumber label="QR-Code Size" value={draft.qrCodeSize} onChange={(value) => updateNumber('qrCodeSize', value)} />
            </div>
            <div className="mt-4 max-w-xs space-y-2">
              <Label>Badge Barcode Type</Label>
              <Select value={draft.barcodeType} onValueChange={() => setDraft((current) => ({ ...current, barcodeType: 'qr' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qr">2D/QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Typography Settings</h3>
            <div className="grid gap-4 sm:grid-cols-4">
              <ConfigNumber label="Font Large" value={draft.fontLarge} onChange={(value) => updateNumber('fontLarge', value)} />
              <ConfigNumber label="Font Small" value={draft.fontSmall} onChange={(value) => updateNumber('fontSmall', value)} />
              <ConfigNumber label="Org Large" value={draft.orgLarge} onChange={(value) => updateNumber('orgLarge', value)} />
              <ConfigNumber label="Org Small" value={draft.orgSmall} onChange={(value) => updateNumber('orgSmall', value)} />
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Dimensions & Media Type</h3>
            <div className="grid gap-6 lg:grid-cols-3">
              <RadioOptionGroup
                label="Output Media Type"
                options={[
                  { label: 'Badge', value: 'badge' },
                  { label: 'Label', value: 'label' },
                  { label: 'Both', value: 'both' },
                ]}
                value={draft.outputMediaType}
                onChange={(value) => setDraft((current) => ({ ...current, outputMediaType: value as OutputMediaType }))}
              />
              <div className="space-y-3">
                <Label>Badge Content</Label>
                <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
                  <ToggleOption
                    label="Print Category"
                    checked={draft.printCategory}
                    onChange={(checked) => setDraft((current) => ({ ...current, printCategory: checked }))}
                  />
                  <ToggleOption
                    label="Print Country"
                    checked={draft.printCountry}
                    onChange={(checked) => setDraft((current) => ({ ...current, printCountry: checked }))}
                  />
                </div>
              </div>
              <RadioOptionGroup
                label="Badge Orientation"
                options={[
                  { label: 'Single-Sided', value: 'single' },
                  { label: 'Double (Portrait)', value: 'double_portrait' },
                  { label: 'Double (Landscape)', value: 'double_landscape' },
                ]}
                value={draft.orientation}
                onChange={(value) => setDraft((current) => ({ ...current, orientation: value as BadgeOrientation }))}
              />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <ConfigNumber label="Double-Side Top Margin (Reverse)" value={draft.reverseTopMargin} onChange={(value) => updateNumber('reverseTopMargin', value)} />
              <ConfigNumber label="Category. Font (Large)" value={draft.categoryFontLarge} onChange={(value) => updateNumber('categoryFontLarge', value)} />
              <ConfigNumber label="Category. Font (Small)" value={draft.categoryFontSmall} onChange={(value) => updateNumber('categoryFontSmall', value)} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-900">Batch Printing Configuration</h3>
            <p className="mt-1 text-xs text-slate-500">
              Settings applied specifically to bulk print operations.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <ConfigNumber label="Batch Badge Height (px)" value={draft.batchBadgeHeight} onChange={(value) => updateNumber('batchBadgeHeight', value)} />
              <ConfigNumber label="Font (L)" value={draft.batchFontLarge} onChange={(value) => updateNumber('batchFontLarge', value)} />
              <ConfigNumber label="Font (S)" value={draft.batchFontSmall} onChange={(value) => updateNumber('batchFontSmall', value)} />
              <ConfigNumber label="Org (L)" value={draft.batchOrgLarge} onChange={(value) => updateNumber('batchOrgLarge', value)} />
              <ConfigNumber label="Org (S)" value={draft.batchOrgSmall} onChange={(value) => updateNumber('batchOrgSmall', value)} />
              <ConfigNumber label="Desg (L)" value={draft.batchDesignationLarge} onChange={(value) => updateNumber('batchDesignationLarge', value)} />
              <ConfigNumber label="Desg (S)" value={draft.batchDesignationSmall} onChange={(value) => updateNumber('batchDesignationSmall', value)} />
              <ConfigNumber label="Category (L)" value={draft.batchCategoryLarge} onChange={(value) => updateNumber('batchCategoryLarge', value)} />
              <ConfigNumber label="Category (S)" value={draft.batchCategorySmall} onChange={(value) => updateNumber('batchCategorySmall', value)} />
              <ConfigNumber label="Double-Side Top/Side Margin" value={draft.batchDoubleSideMargin} onChange={(value) => updateNumber('batchDoubleSideMargin', value)} />
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onApply(draft)} className="w-full">
            Apply & Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ConfigNumber({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function RadioOptionGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ label: string; value: string }>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name={label}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="h-4 w-4 accent-primary"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  )
}

function ToggleOption({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-slate-700">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-primary' : 'bg-slate-200'}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </label>
  )
}

function AttendeeResult({
  attendee,
  selected,
  onSelect,
  onEdit,
  onCheckIn,
  onPrint,
  canEdit,
  canCheckIn,
  canPrint,
}: {
  attendee: OnsiteAttendee
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onCheckIn: () => void
  onPrint: () => void
  canEdit: boolean
  canCheckIn: boolean
  canPrint: boolean
}) {
  const guestType = attendee.guestType || attendee.guest_type
  return (
    <div
      className={`flex flex-col gap-4 rounded-sm border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
        selected ? 'border-primary ring-2 ring-primary/10' : 'border-slate-200'
      }`}
      onClick={onSelect}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900">{attendee.guest?.name || 'Unnamed Guest'}</h3>
          <UiBadge variant="outline">{guestType?.name || 'Guest'}</UiBadge>
          {attendee.checked_in ? (
            <UiBadge className="bg-emerald-600">Checked In</UiBadge>
          ) : (
            <UiBadge variant="secondary">Pending</UiBadge>
          )}
          {attendee.registration_type === 'onsite' ? (
            <UiBadge className="bg-orange-500 border-none text-white">Onsite</UiBadge>
          ) : (
            <UiBadge className="bg-blue-500 border-none text-white">Pre-Reg</UiBadge>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
          <span>REG-{String(attendee.id).padStart(8, '0')}</span>
          {attendee.guest?.company ? <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{attendee.guest.company}</span> : null}
          {attendee.guest?.email ? <span>{attendee.guest.email}</span> : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); onEdit() }} disabled={!canEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); onCheckIn() }} disabled={!canCheckIn || attendee.checked_in}>
          Check In
        </Button>
        <Button size="sm" onClick={(event) => { event.stopPropagation(); onPrint() }} disabled={!canPrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>
    </div>
  )
}

function normalizePrintAttendee(attendee: OnsiteAttendee): OnsiteAttendee {
  return {
    ...attendee,
    guest_type: attendee.guest_type || attendee.guestType,
    guest: attendee.guest
      ? {
          ...attendee.guest,
          jobtitle: attendee.guest.jobtitle || attendee.guest.job_title,
        }
      : attendee.guest,
  }
}

function OnsiteConfiguredBadge({
  attendee,
  eventName,
  config,
}: {
  attendee: OnsiteAttendee
  eventName: string
  config: BadgePrintConfig
}) {
  const guest = attendee.guest
  const guestType = attendee.guest_type || attendee.guestType
  const qrValue = guest?.uuid || attendee.qr_code || String(attendee.id)
  const displayId = String(qrValue).slice(0, 12)
  const designation = guest?.jobtitle || guest?.job_title
  const isDoublePortrait = config.orientation === 'double_portrait'
  const isDoubleLandscape = config.orientation === 'double_landscape'
  const copyCount = config.orientation === 'single' ? 1 : 2
  const pageWidth = 400
  const pageHeight = 400
  const landscapeGap = Math.min(140, Math.max(72, config.batchDoubleSideMargin * 0.5))
  const copyWidth = isDoubleLandscape ? (pageWidth - landscapeGap) / 2 : pageWidth
  const copyHeight = isDoublePortrait ? Math.min(150, Math.max(100, config.badgeHeight * 0.95)) : pageHeight
  const portraitTopOffset = isDoublePortrait ? Math.min(96, Math.max(40, config.badgeHeight * 0.45)) : 0
  const reverseCopyTop = isDoublePortrait
    ? Math.min(
        pageHeight - copyHeight,
        Math.max(portraitTopOffset + copyHeight + 16, config.reverseTopMargin),
      )
    : 0
  const scale = copyCount === 2 ? 0.58 : 1
  const qrSize = Math.max(28, config.qrCodeSize * 22 * scale)
  const showLabelDetails = config.outputMediaType === 'label' || config.outputMediaType === 'both'
  const showFullBadgeDetails = config.outputMediaType === 'badge' || config.outputMediaType === 'both'
  const copies = Array.from({ length: copyCount })
  const designationTop = copyCount === 2 ? 5 : 12
  const companyTop = copyCount === 2 ? 12 : 28
  const countryTop = copyCount === 2 ? 7 : 16
  const qrTop = copyCount === 2 ? 12 : 24
  const categoryTop = copyCount === 2 ? 13 : 28
  const labelTop = copyCount === 2 ? 5 : 8

  return (
    <div
      className={`bg-white text-black ${isDoubleLandscape ? 'flex flex-row' : isDoublePortrait ? 'relative' : 'flex flex-col'}`}
      style={{
        width: pageWidth,
        height: pageHeight,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: isDoubleLandscape ? 'center' : 'center',
        gap: isDoubleLandscape ? landscapeGap : 0,
        pageBreakAfter: 'avoid',
        pageBreakInside: 'avoid',
      }}
    >
      {copies.map((_, index) => (
        <div
          key={index}
          className="flex flex-col items-center justify-center bg-white px-5 text-center font-sans"
          style={{
            width: copyWidth,
            height: copyHeight,
            position: isDoublePortrait ? 'absolute' : undefined,
            left: isDoublePortrait ? 0 : undefined,
            top: isDoublePortrait
              ? index === 0
                ? portraitTopOffset
                : reverseCopyTop
              : undefined,
            pageBreakInside: 'avoid',
            transform: copyCount === 2 && index === 1 ? 'rotate(180deg)' : undefined,
            transformOrigin: 'center',
          }}
        >
          <h1
            className="m-0 max-w-full break-words font-extrabold uppercase leading-none"
            style={{ fontSize: config.fontLarge * scale }}
          >
            {guest?.name || 'UNNAMED GUEST'}
          </h1>

          {showFullBadgeDetails && designation ? (
            <p
              className="m-0 max-w-full break-words font-extrabold uppercase leading-none"
              style={{ marginTop: designationTop, fontSize: config.fontSmall * scale }}
            >
              {designation}
            </p>
          ) : null}

          {showFullBadgeDetails && guest?.company ? (
            <p
              className="m-0 max-w-full break-words font-extrabold uppercase leading-none"
              style={{ marginTop: companyTop, fontSize: config.orgLarge * scale }}
            >
              {guest.company}
            </p>
          ) : null}

          {config.printCountry && guest?.country ? (
            <p className="m-0 font-bold uppercase leading-none" style={{ marginTop: countryTop, fontSize: config.orgSmall * scale }}>
              {guest.country}
            </p>
          ) : null}

          <div className="flex flex-col items-center" style={{ marginTop: qrTop }}>
            <QRCode value={String(qrValue)} size={qrSize} />
            <p className="m-0 mt-2 font-medium leading-none text-slate-600" style={{ fontSize: Math.max(8, (config.orgSmall - 2) * scale) }}>
              {displayId}
            </p>
          </div>

          {config.printCategory ? (
            <p
              className="m-0 font-extrabold uppercase leading-none tracking-tight"
              style={{ marginTop: categoryTop, fontSize: config.categoryFontLarge * scale }}
            >
              {guestType?.name || 'VISITOR'}
            </p>
          ) : null}

          {showLabelDetails ? (
            <p
              className="m-0 max-w-full break-words font-bold uppercase leading-none text-slate-700"
              style={{ marginTop: labelTop, fontSize: config.batchDesignationSmall * scale }}
            >
              {guest?.company || designation || eventName}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </div>
  )
}

function KioskFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500">
      2026 © Evella. All rights reserved. A product of Evella.
    </footer>
  )
}

function readStoredSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSession
    if (!parsed.token || Date.parse(parsed.expires_at) <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return parsed
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
    return null
  }
}

function badgeConfigStorageKey(eventId: number) {
  return `evella_onsite_badge_config_${eventId}`
}

function readBadgeConfig(eventId: number): BadgePrintConfig {
  try {
    const raw = localStorage.getItem(badgeConfigStorageKey(eventId))
    if (!raw) return defaultBadgeConfig
    return {
      ...defaultBadgeConfig,
      ...(JSON.parse(raw) as Partial<BadgePrintConfig>),
    }
  } catch {
    return defaultBadgeConfig
  }
}

function saveBadgeConfig(eventId: number, config: BadgePrintConfig) {
  localStorage.setItem(badgeConfigStorageKey(eventId), JSON.stringify(config))
}
