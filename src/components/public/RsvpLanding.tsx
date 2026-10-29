import type { ReactNode } from 'react';
import { Building, Calendar, CheckCircle, Clock, MapPin, Users, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpinnerInline } from '@/components/ui/spinner';
import { EventDescription } from '@/components/ui/event-description';
import { applyEventBannerFallback, getEventBannerUrl, getImageUrl } from '@/lib/utils';
import { applyRsvpHeadline, DEFAULT_RSVP_PAGE, type RsvpPageSettings } from '@/types/invitations';

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
  rsvpBusy?: boolean;
  onDecline?: () => void;
  onUndecline?: () => void;
  /** Form (or a preview placeholder) rendered under the welcome copy. */
  children?: ReactNode;
  /** Dashboard phone frame: tighter type, no site footer. */
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
  rsvpBusy = false,
  onDecline,
  onUndecline,
  children,
  preview = false,
}: RsvpLandingProps) {
  const page = { ...DEFAULT_RSVP_PAGE, ...settings };
  const accent = page.accent_color || DEFAULT_RSVP_PAGE.accent_color;
  const when = startDate ? new Date(startDate) : null;
  const validDate = when && !Number.isNaN(when.getTime()) ? when : null;
  const host = organizerName || 'Event Organizer';

  const infoItems = [
    { label: 'Date', value: validDate ? validDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD', icon: Calendar },
    { label: 'Time', value: validDate ? validDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'TBD', icon: Clock },
    { label: 'Venue', value: venueName || location || 'Online', icon: MapPin },
    { label: 'Attending as', value: guestTypeName || 'Guest', icon: Users },
  ];

  return (
    <div
      className={preview ? 'bg-white text-slate-900' : 'min-h-screen overflow-x-hidden bg-white sm:bg-slate-50 dark:bg-slate-950 sm:py-12 px-0 sm:px-6 lg:px-8'}
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <div className={preview ? 'w-full' : 'max-w-4xl mx-auto w-full min-w-0'}>
        <div className={preview ? 'bg-white overflow-hidden' : 'bg-white dark:bg-slate-900 rounded-none sm:rounded-[3rem] shadow-none sm:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] overflow-hidden border-none sm:border border-slate-100 dark:border-slate-800 mb-0 sm:mb-12'}>
          {page.show_banner && (
            <div className={preview ? 'relative h-36' : 'relative h-64 sm:h-96'}>
              <img
                src={getEventBannerUrl(imageUrl, undefined, undefined)}
                alt={eventName}
                className="w-full h-full object-cover"
                onError={(e) => applyEventBannerFallback(e.currentTarget)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
              <div className={preview ? 'absolute bottom-0 left-0 w-full p-4' : 'absolute bottom-0 left-0 w-full p-6 sm:p-12'}>
                <div
                  className="inline-flex items-center gap-2 text-white px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 shadow-lg"
                  style={{ backgroundColor: accent }}
                >
                  {guestTypeName || 'Guest'} invitation
                </div>
                <h1 className={preview ? 'text-xl font-black text-white tracking-tight leading-tight' : 'text-2xl sm:text-6xl font-black text-white tracking-tight leading-tight break-words hyphens-auto'}>
                  {eventName}
                </h1>
              </div>
            </div>
          )}

          {!page.show_banner && (
            <div className={preview ? 'px-4 pt-5' : 'px-6 sm:px-12 pt-8 sm:pt-12'}>
              <div
                className="inline-flex items-center gap-2 text-white px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-3"
                style={{ backgroundColor: accent }}
              >
                {guestTypeName || 'Guest'} invitation
              </div>
              <h1 className={preview ? 'text-xl font-black text-slate-900 tracking-tight' : 'text-2xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight'}>
                {eventName}
              </h1>
            </div>
          )}

          {page.show_details && (
            <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-100 dark:border-slate-800 min-w-0">
              {infoItems.map((item, i) => (
                <div key={item.label} className={`min-w-0 text-center border-slate-100 dark:border-slate-800 ${preview ? 'p-2' : 'p-3 sm:p-6'} ${i % 2 === 0 ? 'border-r' : 'md:border-r'} ${i < 2 ? 'border-b md:border-b-0' : ''}`}>
                  <item.icon className={`${preview ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-5 sm:h-5'} mx-auto mb-1 opacity-80 shrink-0`} style={{ color: accent }} />
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                  <p className={`${preview ? 'text-[10px]' : 'text-[11px] sm:text-sm'} font-bold text-slate-900 dark:text-white break-words line-clamp-3 leading-snug`}>{item.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className={`border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/50 ${preview ? 'px-4 py-3' : 'px-4 py-5 sm:px-8 sm:py-6'}`}>
            <div className="flex items-center gap-3 text-left">
              {organizerLogo ? (
                <img src={getImageUrl(organizerLogo)} alt="" className={`${preview ? 'h-9 w-9' : 'h-14 w-14 sm:h-16 sm:w-16'} shrink-0 object-contain rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1`} />
              ) : (
                <div className={`${preview ? 'h-9 w-9' : 'h-14 w-14 sm:h-16 sm:w-16'} shrink-0 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700`}>
                  <Building className={preview ? 'w-4 h-4' : 'w-7 h-7 sm:w-8 sm:h-8'} style={{ color: accent }} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Invited by</p>
                <p className={`${preview ? 'text-sm' : 'text-lg sm:text-xl'} font-bold text-slate-900 dark:text-white break-words`}>{host}</p>
              </div>
            </div>
          </div>

          <div className={preview ? 'p-4 space-y-4' : 'p-4 sm:p-16'}>
            {page.show_description && description && (
              <div className={preview ? 'text-center' : 'mb-8 sm:mb-12 text-center max-w-2xl mx-auto px-4'}>
                <EventDescription description={description} textClassName={preview ? 'text-xs text-slate-600 font-medium leading-relaxed line-clamp-4' : 'text-base sm:text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed'} />
              </div>
            )}

            {declined ? (
              <div className="text-center">
                <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-slate-400" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Response recorded</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Thanks for letting {host} know you can't attend. We hope to see you at a future event.
                </p>
                {onUndecline && (
                  <Button onClick={onUndecline} disabled={rsvpBusy} variant="link" className="font-black uppercase tracking-widest text-xs" style={{ color: accent }}>
                    {rsvpBusy ? <SpinnerInline size="sm" /> : 'I changed my mind, I want to attend'}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className={preview ? 'text-base font-black text-slate-900 mb-1' : 'text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2'}>
                    {applyRsvpHeadline(page.headline, guestFirstName)}
                  </h2>
                  {page.message && (
                    <p className={preview ? 'text-[11px] text-slate-500' : 'text-xs sm:text-sm text-slate-500 font-medium'}>{page.message}</p>
                  )}
                </div>
                {children}
                {onDecline && (
                  <p className="text-center text-xs text-slate-400 font-medium">
                    Can't make it?{' '}
                    <button type="button" onClick={onDecline} disabled={rsvpBusy} className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 underline underline-offset-2 font-bold">
                      <XCircle className="w-3 h-3" /> Let the organizer know
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>

          {!preview && (
            <div className="bg-slate-50 dark:bg-slate-800/30 p-8 sm:p-10 text-center border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 font-medium italic">Your e-badge is emailed immediately after you confirm.</p>
            </div>
          )}
        </div>

        {!preview && (
          <div className="flex flex-col items-center gap-6 px-4 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <a href="/help" className="text-xs font-bold min-h-11 inline-flex items-center opacity-70 hover:opacity-100" style={{ color: accent }}>Support</a>
              <a href="/privacy" className="text-xs font-bold min-h-11 inline-flex items-center opacity-70 hover:opacity-100" style={{ color: accent }}>Privacy</a>
              <a href="/terms" className="text-xs font-bold min-h-11 inline-flex items-center opacity-70 hover:opacity-100" style={{ color: accent }}>Terms</a>
            </div>
            <div className="flex flex-col items-center gap-2 text-center pt-4 border-t border-slate-200 dark:border-slate-800 w-full max-w-md">
              <img src="/evella-logo.png" alt="" className="h-9 w-9 sm:h-10 sm:w-10 object-contain opacity-90 dark:opacity-95" />
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Powered by Validity</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
