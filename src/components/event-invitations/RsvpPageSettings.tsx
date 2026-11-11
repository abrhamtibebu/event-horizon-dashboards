import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown, ExternalLink, FileText, Loader2, Mail, MonitorSmartphone, Palette, Save, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

type MailPane = 'invite' | 'rsvp' | 'event' | 'pdfs';

function MailSection({ title, hint, open, onToggle, children }: { title: string; hint: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <Collapsible open={open} onOpenChange={onToggle} className={`rounded-xl border bg-card ${open ? 'border-primary/40' : 'border-border'}`}>
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 border-t border-border px-4 py-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function samePage(a: RsvpPageSettings, b: RsvpPageSettings): boolean {
  return a.headline === b.headline && a.message === b.message && a.email_message === b.email_message &&
    a.rsvp_reminder_message === b.rsvp_reminder_message && a.event_reminder_message === b.event_reminder_message &&
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
  const [openMail, setOpenMail] = useState<MailPane | null>('invite');
  const [previewMail, setPreviewMail] = useState<MailPane>('invite');
  const toggleMail = (pane: MailPane) => {
    setPreviewMail(pane);
    setOpenMail((current) => current === pane ? null : pane);
  };
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

  const fillPreview = (message: string) => message
    .replaceAll('{name}', 'Alex')
    .replaceAll('{event}', event.name || 'Your event')
    .replaceAll('{organizer}', event.organizerName || 'Your organizer')
    .replaceAll('{guest_type}', 'Guest')
    .replaceAll('{date}', 'Saturday, June 14, 2026')
    .replaceAll('{location}', event.location || 'The venue');
  const emailPreview = fillPreview(draft.email_message);
  const previewWhen = (() => {
    if (!event.startDate) return 'Saturday, June 14, 2026';
    const date = new Date(event.startDate);
    return Number.isNaN(date.getTime()) ? 'Saturday, June 14, 2026' : date.toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  })();
  const previewCopy = {
    invite: { title: 'Invitation email', subject: `You're invited: ${event.name || 'Your event'}`, heading: 'You\'re invited, Alex', body: emailPreview, action: true },
    rsvp: { title: 'RSVP reminder', subject: `Reminder: please respond to ${event.name || 'Your event'}`, heading: 'Please respond, Alex', body: fillPreview(draft.rsvp_reminder_message), action: true },
    event: { title: 'Event reminder', subject: `${event.name || 'Your event'} is one week away`, heading: 'See you soon, Alex', body: fillPreview(draft.event_reminder_message), action: false },
    pdfs: { title: 'Confirmation PDFs', subject: '', heading: '', body: '', action: false },
  }[previewMail];

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
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
              <div className="space-y-3">
              <p className="text-xs leading-5 text-muted-foreground">Open a section to edit it. The preview on the right follows that section. Use <code>{'{name}'}</code>, <code>{'{event}'}</code>, <code>{'{organizer}'}</code>, <code>{'{guest_type}'}</code>, <code>{'{date}'}</code>, and <code>{'{location}'}</code>.</p>
              <MailSection title="Invitation email" hint="Sent when you invite a guest and when you resend." open={openMail === 'invite'} onToggle={() => toggleMail('invite')}>
                <Label htmlFor="rsvp-email-message">Message</Label>
                <Textarea id="rsvp-email-message" value={draft.email_message} onChange={(e) => set('email_message', e.target.value)} maxLength={1000} rows={6} disabled={!isOrganizer} className="leading-6" />
                <div className="flex justify-between text-xs text-muted-foreground"><span>Plain text. Line breaks are kept.</span><span>{draft.email_message.length}/1000</span></div>
              </MailSection>
              <MailSection title="RSVP reminder" hint="Sent to guests who have not confirmed." open={openMail === 'rsvp'} onToggle={() => toggleMail('rsvp')}>
                <Label htmlFor="rsvp-reminder-message">Message</Label>
                <Textarea id="rsvp-reminder-message" value={draft.rsvp_reminder_message} onChange={(e) => set('rsvp_reminder_message', e.target.value)} maxLength={1000} rows={5} disabled={!isOrganizer} className="leading-6" />
                <div className="flex justify-end text-xs text-muted-foreground">{draft.rsvp_reminder_message.length}/1000</div>
              </MailSection>
              <MailSection title="Event reminder" hint="Sent to registered attendees a week before, or when you send it yourself." open={openMail === 'event'} onToggle={() => toggleMail('event')}>
                <Label htmlFor="event-reminder-message">Message</Label>
                <Textarea id="event-reminder-message" value={draft.event_reminder_message} onChange={(e) => set('event_reminder_message', e.target.value)} maxLength={1000} rows={5} disabled={!isOrganizer} className="leading-6" />
                <div className="flex justify-end text-xs text-muted-foreground">{draft.event_reminder_message.length}/1000</div>
              </MailSection>
              <MailSection title="Confirmation PDFs" hint={`${draft.confirmation_attachments.length + newAttachments.length} attached. Sent after a guest registers.`} open={openMail === 'pdfs'} onToggle={() => toggleMail('pdfs')}>
                <p className="text-xs text-muted-foreground">Choose which guest types receive each file. Leave every type unchecked to send it to all guests. The original file name is kept. Up to 5 files, 10 MB each.</p>
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
              </MailSection>
              </div>
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm xl:sticky xl:top-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Email preview</p>
                <p className="mt-1 text-xs text-muted-foreground">{previewCopy.title}</p>
                {previewMail === 'pdfs' ? (
                  <div className="mt-4 space-y-2">
                    {draft.confirmation_attachments.length + newAttachments.length === 0 ? (
                      <p className="text-sm text-slate-500">No PDFs yet. Files you add are attached to the confirmation email after a guest registers.</p>
                    ) : (
                      <>
                        {draft.confirmation_attachments.map((file) => (
                          <div key={file.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="min-w-0 flex-1 truncate">{file.name}</span>
                          </div>
                        ))}
                        {newAttachments.map((item, index) => (
                          <div key={`${item.file.name}-${index}`} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="min-w-0 flex-1 truncate">{item.file.name}</span>
                          </div>
                        ))}
                        <p className="pt-2 text-[11px] text-slate-400">Attached after registration, with the original file name.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="mt-3 flex items-center gap-3 border-b border-slate-100 pb-4">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${draft.accent_color}18`, color: draft.accent_color }}><Mail className="h-4 w-4" /></span>
                      <div>
                        <p className="text-xs text-slate-400">Subject</p>
                        <p className="text-sm font-semibold text-slate-800">{previewCopy.subject}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-base font-semibold text-slate-900">{previewCopy.heading}</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{previewCopy.body}</p>
                    <div className="mt-4 space-y-2 rounded-xl border border-slate-100 px-4 py-3 text-sm">
                      <div className="flex justify-between gap-3"><span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">When</span><span className="text-right font-medium text-slate-800">{previewWhen}</span></div>
                      <div className="flex justify-between gap-3"><span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Where</span><span className="text-right font-medium text-slate-800">{event.location || event.venueName || 'The venue'}</span></div>
                    </div>
                    {previewCopy.action && (
                      <div className="mt-5 rounded-xl px-4 py-3 text-center text-sm font-semibold" style={{ backgroundColor: draft.accent_color, color: '#fff' }}>Respond to RSVP</div>
                    )}
                    <p className="mt-3 text-center text-[11px] text-slate-400">
                      {previewMail === 'event' ? `This reminder was sent by ${event.organizerName || 'your organizer'} through Evella.` : 'The email also includes the event banner and organizer branding.'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>}
    </section>
  );
}
