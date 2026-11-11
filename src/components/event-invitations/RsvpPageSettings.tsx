import { useEffect, useState } from 'react';
import { ExternalLink, FileText, Loader2, Mail, MonitorSmartphone, Palette, Save, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RsvpLanding } from '@/components/public/RsvpLanding';
import { useEventGuestTypes, useInvitations, useRsvpPage, useUpdateRsvpPage } from '@/lib/api/invitations';
import { DEFAULT_RSVP_PAGE, guestFirstName, isPlatformRsvpAccent, rsvpAccentForeground, type InvitationGuestType, type RsvpPageSettings } from '@/types/invitations';

type PendingPdf = { file: File; guestTypeIds: number[] };

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
  return a.headline === b.headline && a.message === b.message && a.email_message === b.email_message &&
    a.accent_color.toLowerCase() === b.accent_color.toLowerCase() && a.show_banner === b.show_banner &&
    a.show_details === b.show_details && a.show_description === b.show_description;
}

function normalizeSettings(value?: Partial<RsvpPageSettings> | null): RsvpPageSettings {
  const page = { ...DEFAULT_RSVP_PAGE, ...value };
  if (isPlatformRsvpAccent(value?.accent_color)) page.accent_color = DEFAULT_RSVP_PAGE.accent_color;
  page.confirmation_attachments = (value?.confirmation_attachments ?? []).map((file) => ({
    id: file.id,
    name: file.name,
    size: file.size,
    guest_type_ids: Array.isArray(file.guest_type_ids)
      ? [...new Set(file.guest_type_ids.map(Number).filter((id) => Number.isFinite(id)))]
      : [],
  }));
  return page;
}

function PdfAudience({
  guestTypes,
  selected,
  disabled,
  loading,
  onChange,
}: {
  guestTypes: InvitationGuestType[];
  selected: number[];
  disabled: boolean;
  loading: boolean;
  onChange: (ids: number[]) => void;
}) {
  if (loading) {
    return <p className="mt-2 text-xs text-muted-foreground">Loading guest types…</p>;
  }
  if (guestTypes.length === 0) {
    return <p className="text-xs text-muted-foreground">Sent to every guest. Add guest types on this event to limit who receives this PDF.</p>;
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {guestTypes.map((type) => {
        const checked = selected.includes(type.id);
        return (
          <label key={type.id} className="flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1 text-xs">
            <Checkbox
              checked={checked}
              disabled={disabled}
              onCheckedChange={(value) => onChange(value ? [...new Set([...selected, type.id])] : selected.filter((id) => id !== type.id))}
            />
            {type.name}
          </label>
        );
      })}
      <span className="text-xs text-muted-foreground">{selected.length === 0 ? 'All guest types' : 'Only the selected guest types'}</span>
    </div>
  );
}

export function RsvpPageSettingsCard({ eventId, event, isOrganizer }: RsvpPageSettingsCardProps) {
  const { data, isLoading } = useRsvpPage(eventId);
  const update = useUpdateRsvpPage(eventId);
  const { data: invitations } = useInvitations(eventId);
  const { data: guestTypes = [], isLoading: guestTypesLoading } = useEventGuestTypes(eventId);
  const [draft, setDraft] = useState<RsvpPageSettings>(DEFAULT_RSVP_PAGE);
  const [view, setView] = useState('landing');
  const [newAttachments, setNewAttachments] = useState<PendingPdf[]>([]);

  useEffect(() => { if (data) setDraft(normalizeSettings(data)); }, [data]);

  const saved = normalizeSettings(data);
  const dirty = !samePage(draft, saved) || newAttachments.length > 0 ||
    JSON.stringify(draft.confirmation_attachments) !== JSON.stringify(saved.confirmation_attachments);
  const sampleLink = invitations?.find((row) => row.invitation_code)?.invitation_code;
  const set = <K extends keyof RsvpPageSettings>(key: K, value: RsvpPageSettings[K]) => setDraft((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(draft.accent_color.trim())) {
      toast.error('Choose a six-digit hex accent color.');
      return;
    }
    try {
      const next = await update.mutateAsync({ ...draft, accent_color: draft.accent_color.trim().toLowerCase(), new_attachments: newAttachments });
      setDraft(normalizeSettings(next));
      setNewAttachments([]);
      toast.success('Guest experience saved');
    } catch {
      toast.error('Could not save your guest experience.');
    }
  };

  const emailPreview = draft.email_message
    .replaceAll('{name}', 'Alex')
    .replaceAll('{event}', event.name || 'Your event')
    .replaceAll('{organizer}', event.organizerName || 'Your organizer')
    .replaceAll('{guest_type}', 'Guest');

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><MonitorSmartphone className="h-5 w-5" /></span>
          <div><h2 className="font-semibold tracking-tight">Guest experience</h2><p className="text-xs text-muted-foreground">One place to edit the RSVP page and invitation email.</p></div>
        </div>
        <div className="flex items-center gap-2">
          {sampleLink && <Button asChild variant="outline" size="sm"><a href={`/event/rsvp/${sampleLink}`} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Preview live page</a></Button>}
          {isOrganizer && <Button size="sm" onClick={save} disabled={isLoading || !dirty || update.isPending}>{update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{update.isPending ? 'Saving…' : 'Save changes'}</Button>}
        </div>
      </header>

      {isLoading ? <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading your guest experience…</div> : <div className="p-4 sm:p-6">
        <Tabs value={view} onValueChange={setView}>
          <TabsList className="mb-5 grid h-auto w-full grid-cols-2 rounded-xl bg-muted/60 p-1 sm:w-fit">
            <TabsTrigger value="landing" className="gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm"><Palette className="h-4 w-4" />RSVP page</TabsTrigger>
            <TabsTrigger value="email" className="gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm"><Mail className="h-4 w-4" />Invitation email</TabsTrigger>
          </TabsList>

          <TabsContent value="landing" className="mt-0">
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-5">
                <div className="space-y-2"><Label>Welcome headline</Label><Input value={draft.headline} onChange={(e) => set('headline', e.target.value)} maxLength={160} disabled={!isOrganizer} placeholder={DEFAULT_RSVP_PAGE.headline} /><p className="text-xs text-muted-foreground">Use {'{name}'} to greet each guest by first name.</p></div>
                <div className="space-y-2"><Label>Welcome message</Label><Textarea value={draft.message} onChange={(e) => set('message', e.target.value)} maxLength={500} rows={3} disabled={!isOrganizer} /></div>
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2"><Palette className="h-4 w-4 text-primary" /><Label>Page branding</Label></div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <input type="color" aria-label="Accent color" value={/^#[0-9A-Fa-f]{6}$/.test(draft.accent_color) ? draft.accent_color : DEFAULT_RSVP_PAGE.accent_color} onChange={(e) => set('accent_color', e.target.value)} disabled={!isOrganizer} className="h-10 w-12 cursor-pointer rounded-lg border border-input bg-transparent p-1" />
                    <Input value={draft.accent_color} onChange={(e) => set('accent_color', e.target.value)} maxLength={7} disabled={!isOrganizer} className="w-28 font-mono" />
                    <span className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: draft.accent_color, color: rsvpAccentForeground(draft.accent_color) }}>Invitation accent</span>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {([['show_banner', 'Event cover'], ['show_details', 'Event details'], ['show_description', 'Description']] as const).map(([key, label]) => <label key={key} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2.5 text-xs font-medium"><span>{label}</span><Switch checked={draft[key]} onCheckedChange={(value) => set(key, value)} disabled={!isOrganizer} /></label>)}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">The event cover and organizer logo come from the event profile.</p>
                </div>
              </div>
              <div className="mx-auto w-full max-w-[320px]">
                <div className="mx-auto h-[520px] max-w-[300px] overflow-y-auto rounded-[1.75rem] border-[6px] border-slate-900 bg-[#f5f4f0] shadow-xl">
                  <RsvpLanding preview eventName={event.name || 'Your event'} description={event.description} startDate={event.startDate} venueName={event.venueName} location={event.location} imageUrl={event.imageUrl} organizerName={event.organizerName} organizerLogo={event.organizerLogo} guestTypeName="Guest" guestFirstName={guestFirstName('Alex')} settings={draft}>
                    <div className="rounded-xl bg-white p-5 text-center text-[11px] text-slate-500">Registration form preview</div>
                  </RsvpLanding>
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">Live preview · changes apply after saving</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="email" className="mt-0">
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
              <div className="space-y-4">
                <div><h3 className="font-semibold">Initial RSVP email</h3><p className="mt-1 text-sm text-muted-foreground">This message is sent when you invite a guest and when you resend their invitation.</p></div>
                <div className="space-y-2"><Label htmlFor="rsvp-email-message">Email body message</Label><Textarea id="rsvp-email-message" value={draft.email_message} onChange={(e) => set('email_message', e.target.value)} maxLength={1000} rows={8} disabled={!isOrganizer} className="leading-6" /><div className="flex justify-between text-xs text-muted-foreground"><span>Plain text is supported. Line breaks are preserved.</span><span>{draft.email_message.length}/1000</span></div></div>
                <div className="rounded-xl bg-muted/40 p-4"><p className="text-xs font-semibold">Personalization fields</p><p className="mt-1 text-xs leading-5 text-muted-foreground"><code>{'{name}'}</code> guest name · <code>{'{event}'}</code> event title · <code>{'{organizer}'}</code> organizer · <code>{'{guest_type}'}</code> guest category</p></div>
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <div><Label>Confirmation email PDFs</Label><p className="mt-1 text-xs text-muted-foreground">These PDFs are attached after an invited guest completes registration. Choose which guest types receive each file. Leave every type unchecked to send it to all guests. The original file name is kept in the email. Up to 5 files, 10 MB each.</p></div>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm font-medium hover:bg-muted/40">
                    <Upload className="h-4 w-4" /> Add PDF files
                    <input type="file" accept="application/pdf,.pdf" multiple className="sr-only" disabled={!isOrganizer} onChange={(e) => {
                      const selected = Array.from(e.target.files ?? []);
                      const invalid = selected.find((file) => file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'));
                      if (invalid) toast.error('Only PDF files can be attached.');
                      else if (draft.confirmation_attachments.length + newAttachments.length + selected.length > 5) toast.error('You can attach up to 5 PDFs.');
                      else if (selected.some((file) => file.size > 10 * 1024 * 1024)) toast.error('Each PDF must be 10 MB or smaller.');
                      else setNewAttachments((files) => [...files, ...selected.map((file) => ({ file, guestTypeIds: [] }))]);
                      e.target.value = '';
                    }} />
                  </label>
                  {draft.confirmation_attachments.map((file) => (
                    <div key={`saved-${file.id}`} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-primary" /><span className="min-w-0 flex-1 truncate">{file.name}</span><span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                        {isOrganizer && <Button type="button" size="icon" variant="ghost" aria-label={`Remove ${file.name}`} className="h-8 w-8" onClick={() => setDraft((prev) => ({ ...prev, confirmation_attachments: prev.confirmation_attachments.filter((item) => item.id !== file.id) }))}><Trash2 className="h-4 w-4" /></Button>}
                      </div>
                      <PdfAudience guestTypes={guestTypes} selected={file.guest_type_ids} disabled={!isOrganizer} loading={guestTypesLoading} onChange={(ids) => setDraft((prev) => ({ ...prev, confirmation_attachments: prev.confirmation_attachments.map((item) => item.id === file.id ? { ...item, guest_type_ids: ids } : item) }))} />
                    </div>
                  ))}
                  {newAttachments.map((item, index) => (
                    <div key={`new-${item.file.name}-${index}`} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-primary" /><span className="min-w-0 flex-1 truncate">{item.file.name}</span><span className="text-xs text-muted-foreground">{(item.file.size / 1024 / 1024).toFixed(1)} MB</span>
                        {isOrganizer && <Button type="button" size="icon" variant="ghost" aria-label={`Remove ${item.file.name}`} className="h-8 w-8" onClick={() => setNewAttachments((files) => files.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button>}
                      </div>
                      <PdfAudience guestTypes={guestTypes} selected={item.guestTypeIds} disabled={!isOrganizer} loading={guestTypesLoading} onChange={(ids) => setNewAttachments((files) => files.map((entry, i) => i === index ? { ...entry, guestTypeIds: ids } : entry))} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Email preview</p>
                <div className="mt-3 flex items-center gap-3 border-b border-slate-100 pb-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${draft.accent_color}18`, color: draft.accent_color }}><Mail className="h-4 w-4" /></span><div><p className="text-xs text-slate-400">Subject</p><p className="text-sm font-semibold text-slate-800">You&apos;re invited: {event.name || 'Your event'}</p></div></div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{emailPreview}</p>
                <div className="mt-5 rounded-xl px-4 py-3 text-center text-sm font-semibold" style={{ backgroundColor: draft.accent_color, color: '#fff' }}>Respond to RSVP</div>
                <p className="mt-3 text-center text-[11px] text-slate-400">The email also includes event details and organizer branding.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>}
    </section>
  );
}
