import { useEffect, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RsvpLanding } from '@/components/public/RsvpLanding';
import { useInvitations, useRsvpPage, useUpdateRsvpPage } from '@/lib/api/invitations';
import { DEFAULT_RSVP_PAGE, guestFirstName, type RsvpPageSettings } from '@/types/invitations';

export interface RsvpEventPreview {
  name: string;
  description?: string | null;
  startDate?: string | null;
  venueName?: string | null;
  location?: string | null;
  imageUrl?: string | null;
  organizerName?: string | null;
  organizerLogo?: string | null;
}

interface RsvpPageSettingsCardProps {
  eventId: number;
  event: RsvpEventPreview;
  isOrganizer: boolean;
}

function samePage(a: RsvpPageSettings, b: RsvpPageSettings): boolean {
  return (
    a.headline === b.headline &&
    a.message === b.message &&
    a.accent_color.toLowerCase() === b.accent_color.toLowerCase() &&
    a.show_banner === b.show_banner &&
    a.show_details === b.show_details &&
    a.show_description === b.show_description
  );
}

export function RsvpPageSettingsCard({ eventId, event, isOrganizer }: RsvpPageSettingsCardProps) {
  const { data, isLoading } = useRsvpPage(eventId);
  const update = useUpdateRsvpPage(eventId);
  const { data: invitations } = useInvitations(eventId);
  const [draft, setDraft] = useState<RsvpPageSettings>(DEFAULT_RSVP_PAGE);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const saved = data ?? DEFAULT_RSVP_PAGE;
  const dirty = !samePage(draft, saved);
  const sampleLink = invitations?.find((row) => row.invitation_code)?.invitation_code;

  const set = <K extends keyof RsvpPageSettings>(key: K, value: RsvpPageSettings[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    const color = draft.accent_color.trim();
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      toast.error('Accent color must be a hex value like #f97316.');
      return;
    }
    try {
      const next = await update.mutateAsync({ ...draft, accent_color: color.toLowerCase() });
      setDraft(next);
      toast.success('Guest page saved');
    } catch {
      toast.error('Could not save the guest page.');
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Guest page</h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            One look for every guest. The form still follows the guest type you invite.
          </p>
        </div>
        {sampleLink && (
          <a
            href={`/event/rsvp/${sampleLink}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline shrink-0"
          >
            Open guest view <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-6">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading page settings…
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Welcome line</Label>
                <Input
                  value={draft.headline}
                  onChange={(e) => set('headline', e.target.value)}
                  maxLength={160}
                  placeholder={DEFAULT_RSVP_PAGE.headline}
                  disabled={!isOrganizer}
                  className="h-9"
                />
                <p className="text-[10px] text-muted-foreground">{'{name}'} becomes the guest&apos;s first name.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Short message</Label>
                <Textarea
                  value={draft.message}
                  onChange={(e) => set('message', e.target.value)}
                  maxLength={500}
                  rows={3}
                  disabled={!isOrganizer}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Accent color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label="Accent color"
                    value={/^#[0-9A-Fa-f]{6}$/.test(draft.accent_color) ? draft.accent_color : DEFAULT_RSVP_PAGE.accent_color}
                    onChange={(e) => set('accent_color', e.target.value)}
                    disabled={!isOrganizer}
                    className="h-9 w-12 rounded-md border border-input bg-transparent p-1 cursor-pointer"
                  />
                  <Input
                    value={draft.accent_color}
                    onChange={(e) => set('accent_color', e.target.value)}
                    maxLength={7}
                    disabled={!isOrganizer}
                    className="h-9 w-28 font-mono text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    ['show_banner', 'Banner'],
                    ['show_details', 'Date & venue'],
                    ['show_description', 'Description'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                    <span className="text-xs font-medium">{label}</span>
                    <Switch checked={draft[key]} onCheckedChange={(checked) => set(key, checked)} disabled={!isOrganizer} />
                  </label>
                ))}
              </div>
              {isOrganizer && (
                <Button type="button" size="sm" onClick={save} disabled={!dirty || update.isPending}>
                  {update.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save guest page'}
                </Button>
              )}
            </>
          )}
        </div>

        <div className="mx-auto w-[300px]">
          <div className="rounded-[1.75rem] border-[6px] border-slate-900 bg-white overflow-hidden shadow-xl h-[520px] overflow-y-auto">
            <RsvpLanding
              preview
              eventName={event.name || 'Your event'}
              description={event.description}
              startDate={event.startDate}
              venueName={event.venueName}
              location={event.location}
              imageUrl={event.imageUrl}
              organizerName={event.organizerName}
              organizerLogo={event.organizerLogo}
              guestTypeName="Guest"
              guestFirstName={guestFirstName('Alex')}
              settings={draft}
            >
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-[11px] text-slate-400">
                The guest&apos;s form appears here
              </div>
            </RsvpLanding>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-2">Preview updates as you type. Guests see it after you save.</p>
        </div>
      </div>
    </div>
  );
}
