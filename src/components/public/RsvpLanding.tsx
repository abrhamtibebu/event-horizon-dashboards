import type { ReactNode } from 'react';
import { ArrowLeft, Building, CalendarDays, Clock3, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpinnerInline } from '@/components/ui/spinner';
import { EventDescription } from '@/components/ui/event-description';
import { applyEventBannerFallback, getEventBannerUrl, getImageUrl } from '@/lib/utils';
import { applyRsvpHeadline, DEFAULT_RSVP_PAGE, resolveRsvpAccent, rsvpAccentForeground, type RsvpPageSettings } from '@/types/invitations';

export interface RsvpLandingProps {
  eventName: string;
  description?: string | null;
  startDate?: string | null;
  venueName?: string | null;
  location?: string | null;
  imageUrl?: string | null;
  organizerName?: string | null;
  organizerLogo?: string | null;
  guestTypeName: string;
  guestFirstName: string;
  settings?: RsvpPageSettings | null;
  declined?: boolean;
  accepted?: boolean;
  confirmed?: boolean;
  rsvpBusy?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onUndecline?: () => void;
  onBack?: () => void;
  children?: ReactNode;
  preview?: boolean;
}

export function RsvpLanding({
  eventName,
  description,
  startDate,
  venueName,
  location,
  imageUrl,
  organizerName,
  organizerLogo,
  guestTypeName,
  guestFirstName,
  settings,
  declined = false,
  accepted = false,
  confirmed = false,
  rsvpBusy = false,
  onAccept,
  onDecline,
  onUndecline,
  onBack,
  children,
  preview = false,
}: RsvpLandingProps) {
  const page = { ...DEFAULT_RSVP_PAGE, ...settings };
  const accent = resolveRsvpAccent(page.accent_color);
  const accentText = rsvpAccentForeground(page.accent_color);
  const when = startDate ? new Date(startDate) : null;
  const validDate = when && !Number.isNaN(when.getTime()) ? when : null;
  const host = organizerName || 'Event Organizer';
  const dateLabel = validDate ? validDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Date to be announced';
  const timeLabel = validDate ? validDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Time to be announced';
  const placeLabel = venueName || location || 'Location to be announced';

  return (
    <main className={`rsvp-light text-[#1c1917] ${preview ? 'overflow-x-hidden bg-[#f5f4f0] p-2' : 'flex min-h-screen w-full flex-col items-center overflow-x-hidden bg-[#f5f4f0] px-3 py-4 sm:px-6 sm:py-12'}`}>
      <article className={`${preview ? 'mx-auto max-w-none' : 'mx-auto w-full max-w-[576px]'} min-w-0 overflow-hidden rounded-[22px] border border-[#e7e1d8] bg-white shadow-lg shadow-black/5 sm:rounded-[26px]`}>
        <section className={`relative isolate overflow-hidden ${preview ? 'h-36' : 'aspect-[1.62] w-full'}`}>
          {page.show_banner && imageUrl ? (
            <img src={getEventBannerUrl(imageUrl, undefined, undefined)} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => applyEventBannerFallback(e.currentTarget)} />
          ) : <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}, #182235 82%)` }} />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#1c1917] sm:right-5 sm:top-5 sm:text-[10px]">
            {guestTypeName} invitation
          </div>
          {preview && <div className="absolute bottom-0 left-0 right-0 p-4"><h1 className="font-serif text-xl font-medium leading-tight text-white drop-shadow">{eventName}</h1></div>}
        </section>

        <div className={`${preview ? 'space-y-4 p-4' : 'space-y-6 px-6 py-7 sm:space-y-7 sm:px-10 sm:py-9'}`}>
          {!preview && <div className="flex min-w-0 items-center gap-2 text-xs text-[#766e66]">
            {organizerLogo ? <img src={getImageUrl(organizerLogo)} alt="" className="h-5 w-5 rounded-full object-contain" /> : <Building className="h-4 w-4" style={{ color: accent }} />}
            <span>Hosted by</span><span className="truncate font-medium text-[#1c1917]">{host}</span>
          </div>}

          {!preview && <h1 className="break-words font-serif text-[2rem] font-medium leading-[1.12] tracking-[-0.035em] text-[#1c1917] sm:text-[2.8rem]">{eventName}</h1>}

          {page.show_details && <div className="space-y-2 text-[13px] text-[#1c1917] sm:text-sm">
            {[
              { icon: CalendarDays, value: dateLabel },
              { icon: Clock3, value: timeLabel },
              { icon: MapPin, value: placeLabel },
            ].map(({ icon: Icon, value }) => <div key={value} className="flex min-w-0 items-start gap-2.5">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} /><span className="min-w-0 break-words">{value}</span>
            </div>)}
          </div>}

          {page.show_description && description && <EventDescription description={description} textClassName="text-sm leading-6 text-[#766e66]" />}

          {!preview && <div className="border-t border-[#e7e1d8]" />}

          {confirmed ? <div className="space-y-4">{children}</div> : declined ? <div className="space-y-3 py-1">
            <h2 className="font-serif text-2xl text-[#1c1917]">Your response is saved</h2>
            <p className="text-sm leading-6 text-[#766e66]">Thank you for letting {host} know. We hope to welcome you another time.</p>
            {onUndecline && <Button variant="outline" onClick={onUndecline} disabled={rsvpBusy} className="mt-1 rounded-full px-6" style={{ color: accent, borderColor: accent }}>{rsvpBusy ? <SpinnerInline size="sm" /> : 'I can attend after all'}</Button>}
          </div> : accepted ? <div className="space-y-4">
            {onBack && <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 h-8 px-2 text-xs font-normal" style={{ color: accent }}><ArrowLeft className="mr-1.5 h-3.5 w-3.5" />Back</Button>}
            <div>
              <h2 className="font-serif text-2xl text-[#1c1917]">Your details</h2>
              <p className="mt-1 text-sm text-[#766e66]">Prefilled from your invitation where available.</p>
            </div>
            {children}
          </div> : <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="font-serif text-[1.6rem] leading-tight text-[#1c1917]">{applyRsvpHeadline(page.headline, guestFirstName)}</h2>
              {page.message && <p className="text-sm leading-6 text-[#766e66]">{page.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <Button type="button" onClick={onAccept} disabled={rsvpBusy || (preview && !onAccept)} className="h-12 rounded-full px-3 text-xs font-medium shadow-none sm:text-sm" style={{ backgroundColor: accent, color: accentText }}>
                {rsvpBusy ? <SpinnerInline size="sm" /> : 'Accept invitation'}
              </Button>
              {(onDecline || preview) && <Button type="button" variant="outline" onClick={onDecline} disabled={rsvpBusy || (preview && !onDecline)} className="h-12 rounded-full border-[#e7e1d8] bg-transparent px-3 text-xs font-medium text-[#766e66] shadow-none hover:bg-[#f5f4f0] hover:text-[#1c1917] sm:text-sm">
                Decline
              </Button>}
            </div>
          </div>}
        </div>
      </article>
      {!preview && <footer className="mx-auto flex w-full max-w-[576px] items-center justify-between gap-4 px-2 py-5 text-[10px] text-[#766e66] sm:px-1 sm:py-6 sm:text-[11px]">
        <div className="flex items-center gap-1.5"><span>Powered by</span><a href="https://evella.et/" target="_blank" rel="noopener noreferrer" aria-label="Visit Evella"><img src="/evella-logo.png" alt="Evella" className="h-4 w-auto object-contain" /></a></div>
        <nav className="flex items-center gap-3 sm:gap-5"><a href="/help" className="hover:text-[#1c1917]">Support</a><a href="/privacy" className="hover:text-[#1c1917]">Privacy</a><a href="/terms" className="hover:text-[#1c1917]">Terms</a></nav>
      </footer>}
    </main>
  );
}
