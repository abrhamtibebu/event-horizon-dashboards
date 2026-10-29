import { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FilePenLine,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useBulkGenerateInvitations, useEventGuestTypes } from '@/lib/api/invitations';
import { formApi } from '@/lib/api/forms';
import FormBuilder from '@/components/forms/FormBuilder';
import { downloadSampleGuestCsv, parseGuestCsv, type ParsedInviteRow } from '@/lib/invitationUtils';
import type { BulkInvitationResult } from '@/types/invitations';

interface InvitationGeneratorProps {
  eventId: number;
  eventUuid: string;
  eventName: string;
  isOrganizer: boolean;
  onSent?: (result: BulkInvitationResult) => void;
}

type ManualRow = { id: number; name: string; email: string; phone: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let rowSeq = 1;
const newRow = (): ManualRow => ({ id: rowSeq++, name: '', email: '', phone: '' });

export function InvitationGenerator({ eventId, isOrganizer, onSent }: InvitationGeneratorProps) {
  const { data: guestTypes = [], isLoading: guestTypesLoading } = useEventGuestTypes(eventId);
  const bulkMutation = useBulkGenerateInvitations();

  const [guestTypeId, setGuestTypeId] = useState<string>('');
  const [mode, setMode] = useState<'manual' | 'csv'>('manual');
  const [rows, setRows] = useState<ManualRow[]>([newRow()]);
  const [csvRows, setCsvRows] = useState<ParsedInviteRow[] | null>(null);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [builderForm, setBuilderForm] = useState<{ id: number; name: string } | null>(null);
  const [creatingForm, setCreatingForm] = useState(false);

  const guestTypeNumeric = guestTypeId ? Number(guestTypeId) : 0;
  const formQuery = useQuery({
    queryKey: ['event-form-by-guest-type', eventId, guestTypeNumeric],
    queryFn: () => formApi.getFormByGuestType(eventId, guestTypeNumeric),
    enabled: guestTypeNumeric > 0,
    retry: false,
  });
  const formMissing =
    formQuery.isError && isAxiosError(formQuery.error) && formQuery.error.response?.status === 404;

  const selectedGuestType = guestTypes.find((g) => String(g.id) === guestTypeId) ?? null;

  const createGuestForm = async () => {
    if (!selectedGuestType) return;
    setCreatingForm(true);
    try {
      const created = await formApi.createForm(eventId, {
        event_id: eventId,
        name: `${selectedGuestType.name} form`,
        guest_type_id: selectedGuestType.id,
        status: 'active',
      });
      if (created.status !== 'active') {
        await formApi.activateForm(created.id);
      }
      await queryClient.invalidateQueries({ queryKey: ['event-form-by-guest-type', eventId, selectedGuestType.id] });
      await queryClient.invalidateQueries({ queryKey: ['event-forms', eventId] });
      setBuilderForm({ id: created.id, name: created.name });
    } catch (error: unknown) {
      const message = isAxiosError(error) ? String(error.response?.data?.message || error.response?.data?.error || '') : '';
      if (message.includes('already exists')) {
        try {
          const existing = await formApi.getFormByGuestType(eventId, selectedGuestType.id);
          setBuilderForm({ id: existing.id, name: existing.name });
          toast.info('This guest type already has a form. Opening it to edit.');
          return;
        } catch {
          // Fall through to the generic error.
        }
      }
      toast.error(message || 'Could not create the form.');
    } finally {
      setCreatingForm(false);
    }
  };

  const manualValidation = useMemo(() => {
    const seen = new Set<string>();
    return rows.map((r) => {
      const email = r.email.trim().toLowerCase();
      const name = r.name.trim();
      const empty = !name && !email && !r.phone.trim();
      let error: string | undefined;
      if (!empty) {
        if (!name) error = 'Name required';
        else if (!email) error = 'Email required';
        else if (!EMAIL_RE.test(email)) error = 'Invalid email';
        else if (seen.has(email)) error = 'Duplicate email';
      }
      if (email) seen.add(email);
      return { empty, error };
    });
  }, [rows]);

  const manualReady = rows.filter((_, i) => !manualValidation[i].empty && !manualValidation[i].error);
  const manualHasErrors = manualValidation.some((v) => v.error);

  const csvValid = (csvRows ?? []).filter((r) => !r.error);
  const csvInvalid = (csvRows ?? []).filter((r) => r.error);

  const readyCount = mode === 'manual' ? manualReady.length : csvValid.length;
  const canSend =
    Boolean(guestTypeId) &&
    readyCount > 0 &&
    !bulkMutation.isPending &&
    (mode === 'csv' || !manualHasErrors);

  const updateRow = (id: number, patch: Partial<ManualRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const removeRow = (id: number) =>
    setRows((prev) => (prev.length === 1 ? [newRow()] : prev.filter((r) => r.id !== id)));

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseGuestCsv(String(ev.target?.result ?? ''));
      setCsvRows(parsed);
      const ok = parsed.filter((r) => !r.error).length;
      if (parsed.length === 0) toast.error('The file is empty.');
      else toast.success(`Parsed ${ok} valid guest${ok === 1 ? '' : 's'}${parsed.length - ok ? `, ${parsed.length - ok} skipped` : ''}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSend = async () => {
    if (!canSend) return;
    const payload =
      mode === 'manual'
        ? manualReady.map((r) => ({ name: r.name.trim(), email: r.email.trim().toLowerCase(), phone: r.phone.trim() || undefined }))
        : csvValid.map((r) => ({
            name: r.name,
            email: r.email,
            phone: r.phone || undefined,
            company: r.company || undefined,
            job_title: r.jobTitle || undefined,
            location: r.location || undefined,
          }));

    try {
      const result = await bulkMutation.mutateAsync({
        eventId,
        guestTypeId: Number(guestTypeId),
        invitations: payload,
      });
      const { sent, failed, queued } = result.summary ?? { sent: 0, failed: 0, queued: 0 };
      if (failed > 0 && sent === 0 && queued === 0) {
        toast.error(`Could not send ${failed} email${failed === 1 ? '' : 's'}. Check the delivery status for details.`);
      } else if (failed > 0) {
        toast.warning(`${sent + queued} sent, ${failed} failed. Retry failed ones from the list.`);
      } else {
        toast.success(result.message || `${payload.length} RSVP invitation${payload.length === 1 ? '' : 's'} sent`);
      }
      setRows([newRow()]);
      setCsvRows(null);
      setCsvFileName('');
      onSent?.(result);
    } catch (error: unknown) {
      const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      const msg = data?.message || Object.values(data?.errors ?? {}).flat()[0] || 'Failed to send invitations';
      toast.error(String(msg));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Send RSVP invitations</h3>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
        {/* Step 1: guest type */}
        <div className="p-5 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center">1</span>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Guest type</Label>
          </div>
          <Select value={guestTypeId} onValueChange={setGuestTypeId} disabled={guestTypesLoading}>
            <SelectTrigger className="h-10 rounded-lg">
              <SelectValue placeholder={guestTypesLoading ? 'Loading guest types…' : 'Choose who you are inviting'} />
            </SelectTrigger>
            <SelectContent>
              {guestTypes.map((gt) => (
                <SelectItem key={gt.id} value={String(gt.id)}>
                  {gt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!guestTypesLoading && guestTypes.length === 0 && (
            <p className="text-[11px] text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> This event has no guest types yet. Add one in the Guest Types tab first.
            </p>
          )}
          {selectedGuestType && formQuery.isLoading && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Checking the {selectedGuestType.name} form…
            </p>
          )}
          {selectedGuestType && formQuery.data && (
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <p className="text-muted-foreground">
                Guests fill the <span className="font-semibold text-foreground">{formQuery.data.name}</span> form
                {' · '}
                {formQuery.data.formFields?.length ?? 0} field{(formQuery.data.formFields?.length ?? 0) === 1 ? '' : 's'}
              </p>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-[11px] gap-1"
                onClick={() => setBuilderForm({ id: formQuery.data.id, name: formQuery.data.name })}
              >
                <FilePenLine className="w-3 h-3" /> Edit form
              </Button>
            </div>
          )}
          {selectedGuestType && formMissing && (
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <p className="text-amber-600">Guests will use the standard registration form.</p>
              {isOrganizer && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-[11px] gap-1"
                  disabled={creatingForm}
                  onClick={() => void createGuestForm()}
                >
                  {creatingForm ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Create form
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Step 2: guests */}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center">2</span>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Guests</Label>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as 'manual' | 'csv')}>
            <TabsList className="grid grid-cols-2 h-9">
              <TabsTrigger value="manual" className="text-xs gap-1.5">
                <UserPlus className="w-3.5 h-3.5" /> Add manually
              </TabsTrigger>
              <TabsTrigger value="csv" className="text-xs gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Upload CSV
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-3 space-y-2">
              {rows.map((row, i) => {
                const v = manualValidation[i];
                return (
                  <div key={row.id} className="space-y-1">
                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                      <Input
                        placeholder="Full name"
                        value={row.name}
                        onChange={(e) => updateRow(row.id, { name: e.target.value })}
                        className="h-9 rounded-lg text-xs"
                      />
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={row.email}
                        onChange={(e) => updateRow(row.id, { email: e.target.value })}
                        className={`h-9 rounded-lg text-xs ${v.error && /email/i.test(v.error) ? 'border-rose-300' : ''}`}
                      />
                      <Input
                        type="tel"
                        placeholder="Phone (optional)"
                        value={row.phone}
                        onChange={(e) => updateRow(row.id, { phone: e.target.value })}
                        className="h-9 rounded-lg text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-rose-600"
                        onClick={() => removeRow(row.id)}
                        aria-label="Remove guest"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    {v.error && <p className="text-[10px] text-rose-600 pl-1">{v.error}</p>}
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setRows((prev) => [...prev, newRow()])}
              >
                <Plus className="w-3.5 h-3.5" /> Add another guest
              </Button>
            </TabsContent>

            <TabsContent value="csv" className="mt-3 space-y-3">
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} onChange={handleCsvUpload} accept=".csv,text/csv,text/plain" className="hidden" />
                <FileText className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">{csvFileName || 'Click to upload CSV'}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Name and email are required. Phone, company, job title, and location are optional.</p>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Not sure about the format?</span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-[11px] gap-1"
                  onClick={() => downloadSampleGuestCsv()}
                >
                  <Download className="w-3 h-3" /> Download sample CSV
                </Button>
              </div>

              {csvRows && csvRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {csvValid.length} ready
                    </span>
                    {csvInvalid.length > 0 && (
                      <span className="flex items-center gap-1 text-rose-600">
                        <AlertCircle className="w-3.5 h-3.5" /> {csvInvalid.length} will be skipped
                      </span>
                    )}
                  </div>
                  <div className="max-h-48 overflow-auto rounded-lg border border-border text-[11px]">
                    <table className="w-full">
                      <thead className="bg-muted/40 sticky top-0">
                        <tr className="text-left">
                          <th className="px-2 py-1.5 font-semibold">Name</th>
                          <th className="px-2 py-1.5 font-semibold">Email</th>
                          <th className="px-2 py-1.5 font-semibold">Phone</th>
                          <th className="px-2 py-1.5 font-semibold">Company</th>
                          <th className="px-2 py-1.5 font-semibold">Job title</th>
                          <th className="px-2 py-1.5 font-semibold">Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.slice(0, 200).map((r) => (
                          <tr key={r.line} className={r.error ? 'bg-rose-50/70 dark:bg-rose-950/20 text-rose-700' : ''} title={r.error ? `Line ${r.line}: ${r.error}` : undefined}>
                            <td className="px-2 py-1 truncate max-w-[120px]">{r.name || '—'}</td>
                            <td className="px-2 py-1 truncate max-w-[160px]">{r.email || '—'}</td>
                            <td className="px-2 py-1 truncate max-w-[120px]">{r.error ? <span className="font-medium">{r.error}</span> : r.phone || '—'}</td>
                            <td className="px-2 py-1 truncate max-w-[120px]">{r.company || '—'}</td>
                            <td className="px-2 py-1 truncate max-w-[120px]">{r.jobTitle || '—'}</td>
                            <td className="px-2 py-1 truncate max-w-[120px]">{r.location || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvRows.length > 200 && (
                      <p className="px-2 py-1.5 text-muted-foreground border-t border-border">…and {csvRows.length - 200} more</p>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Step 3: send */}
        <div className="p-5 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center">3</span>
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Send</Label>
          </div>
          <Button onClick={handleSend} disabled={!canSend} className="w-full h-10 rounded-lg font-semibold gap-2">
            {bulkMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send RSVP {readyCount > 0 ? `to ${readyCount} guest${readyCount === 1 ? '' : 's'}` : ''}
              </>
            )}
          </Button>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            Each guest gets a branded email with a personal RSVP link. Delivery status appears in the list.
          </p>
        </div>
      </div>

      <Dialog modal={false} open={builderForm !== null} onOpenChange={(open) => { if (!open) setBuilderForm(null); }}>
        <DialogContent
          className="flex h-[90vh] w-[95vw] max-w-6xl flex-col gap-0 overflow-hidden p-0"
          onPointerDownOutside={(event) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest('[data-radix-popper-content-wrapper]')) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest('[data-radix-popper-content-wrapper]')) event.preventDefault();
          }}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{builderForm ? `Edit: ${builderForm.name}` : 'Edit form'}</DialogTitle>
          </DialogHeader>
          {builderForm && (
            <FormBuilder
              formId={builderForm.id}
              eventId={eventId}
              onSave={() => {
                const id = builderForm.id;
                setBuilderForm(null);
                void queryClient.invalidateQueries({ queryKey: ['event-form-by-guest-type', eventId, guestTypeNumeric] });
                void queryClient.invalidateQueries({ queryKey: ['form', id] });
              }}
              onCancel={() => setBuilderForm(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
