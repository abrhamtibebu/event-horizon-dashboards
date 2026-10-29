import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  Loader2,
  Mail,
  MinusCircle,
  MoreVertical,
  QrCode,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModernConfirmationDialog } from '@/components/ui/ModernConfirmationDialog';
import { format, parseISO } from 'date-fns';
import { downloadInvitationsCsv, fetchInvitationResponse, useEventGuestTypes, useInvitations, useResendInvitationEmail, useRevokeInvitation, type InvitationResponse } from '@/lib/api/invitations';
import type { Invitation, InvitationEmailStatus, InvitationRsvpStatus } from '@/types/invitations';

interface InvitationsListProps {
  eventId: number;
  userId?: number;
  isOrganizer: boolean;
  title?: string;
}

const EMAIL_FILTERS: Array<{ value: 'all' | InvitationEmailStatus; label: string }> = [
  { value: 'all', label: 'All deliveries' },
  { value: 'sent', label: 'Sent' },
  { value: 'queued', label: 'Sending' },
  { value: 'failed', label: 'Failed' },
  { value: 'not_sent', label: 'Not sent' },
];

const RSVP_FILTERS: Array<{ value: 'all' | InvitationRsvpStatus; label: string }> = [
  { value: 'all', label: 'All RSVPs' },
  { value: 'accepted', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'declined', label: 'Rejected' },
];

function fmtDate(value: string | null | undefined, pattern = 'MMM d, HH:mm'): string {
  if (!value) return '';
  try {
    return format(parseISO(value), pattern);
  } catch {
    return '';
  }
}

export function EmailStatusBadge({ inv }: { inv: Invitation }) {
  const status = inv.email_status ?? 'not_sent';
  if (!inv.recipient_email) {
    return (
      <Badge variant="outline" className="text-slate-400 border-slate-200 bg-slate-50 gap-1 font-medium">
        <MinusCircle className="w-3 h-3" /> No email
      </Badge>
    );
  }
  switch (status) {
    case 'sent':
      return (
        <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 gap-1 font-medium" title={inv.email_sent_at ? `Sent ${fmtDate(inv.email_sent_at, 'PPpp')}` : undefined}>
          <CheckCircle2 className="w-3 h-3" /> Sent{inv.email_sent_at ? ` · ${fmtDate(inv.email_sent_at)}` : ''}
        </Badge>
      );
    case 'queued':
      return (
        <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50 gap-1 font-medium">
          <Loader2 className="w-3 h-3 animate-spin" /> Sending…
        </Badge>
      );
    case 'failed':
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-rose-700 border-rose-200 bg-rose-50 gap-1 font-medium cursor-help">
                <AlertTriangle className="w-3 h-3" /> Failed{inv.email_attempts > 1 ? ` (${inv.email_attempts}×)` : ''}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs break-words">
              {inv.email_error || 'Email provider rejected the message.'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    default:
      return (
        <Badge variant="outline" className="text-slate-500 border-slate-200 bg-slate-50 gap-1 font-medium">
          <Mail className="w-3 h-3" /> Not sent
        </Badge>
      );
  }
}

export function RsvpStatusBadge({ status, at }: { status: InvitationRsvpStatus; at?: string | null }) {
  const when = at && status !== 'pending' ? ` · ${fmtDate(at)}` : '';
  switch (status) {
    case 'accepted':
      return (
        <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 gap-1 font-medium whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3" /> Confirmed{when}
        </Badge>
      );
    case 'declined':
      return (
        <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50 gap-1 font-medium whitespace-nowrap">
          <XCircle className="w-3 h-3" /> Rejected{when}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-slate-400 border-slate-200 bg-slate-50 gap-1 font-medium">
          <Clock className="w-3 h-3" /> Pending
        </Badge>
      );
  }
}

export function InvitationsList({ eventId, userId, isOrganizer, title }: InvitationsListProps) {
  const { data: invitations, isLoading } = useInvitations(eventId, { userId });
  const { data: guestTypes = [] } = useEventGuestTypes(eventId);
  const revokeMutation = useRevokeInvitation();
  const resendMutation = useResendInvitationEmail();

  const [resendingId, setResendingId] = useState<number | null>(null);
  const [selectedQR, setSelectedQR] = useState<{ url: string; code: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [guestTypeFilter, setGuestTypeFilter] = useState<string>('all');
  const [emailFilter, setEmailFilter] = useState<'all' | InvitationEmailStatus>('all');
  const [rsvpFilter, setRsvpFilter] = useState<'all' | InvitationRsvpStatus>('all');
  const [exporting, setExporting] = useState(false);
  const [responseFor, setResponseFor] = useState<Invitation | null>(null);
  const [response, setResponse] = useState<InvitationResponse | null>(null);
  const [responseLoading, setResponseLoading] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<Invitation | null>(null);

  const openResponse = async (inv: Invitation) => {
    setResponseFor(inv);
    setResponse(null);
    setResponseLoading(true);
    try {
      setResponse(await fetchInvitationResponse(eventId, inv.id));
    } catch {
      toast.error('Could not load this guest’s response.');
      setResponseFor(null);
    } finally {
      setResponseLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadInvitationsCsv(eventId);
    } catch {
      toast.error('Could not export the guest list.');
    } finally {
      setExporting(false);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('RSVP link copied');
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeMutation.mutateAsync(revokeTarget.id);
      toast.success('Invitation revoked');
      setRevokeTarget(null);
    } catch {
      toast.error('Failed to revoke');
    }
  };

  const handleResendEmail = async (inv: Invitation) => {
    if (!inv.recipient_email?.trim()) {
      toast.error('This invitation has no recipient email.');
      return;
    }
    setResendingId(inv.id);
    try {
      const res = await resendMutation.mutateAsync({ invitationId: inv.id });
      if (res?.success === false) toast.error(res.message || 'Email failed');
      else toast.success(res?.message || `Email sent to ${inv.recipient_email}`);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to send email');
    } finally {
      setResendingId(null);
    }
  };

  const handleRetryAllFailed = async () => {
    const failed = (invitations ?? []).filter((i) => i.email_status === 'failed' && i.recipient_email && i.status === 'active');
    if (failed.length === 0) return;
    let ok = 0;
    for (const inv of failed) {
      try {
        const res = await resendMutation.mutateAsync({ invitationId: inv.id });
        if (res?.success !== false) ok++;
      } catch {
        /* keep going */
      }
    }
    if (ok === failed.length) toast.success(`Re-sent ${ok} email${ok === 1 ? '' : 's'}`);
    else toast.warning(`Re-sent ${ok} of ${failed.length}. Some still failed.`);
  };

  const filtered = useMemo(() => {
    if (!invitations) return [];
    const q = searchTerm.trim().toLowerCase();
    return invitations.filter((inv) => {
      if (q) {
        const hay = [inv.invitation_code, inv.recipient_name, inv.recipient_email, inv.recipient_phone, inv.guest_type?.name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (guestTypeFilter !== 'all' && String(inv.guest_type_id ?? '') !== guestTypeFilter) return false;
      if (emailFilter !== 'all' && (inv.email_status ?? 'not_sent') !== emailFilter) return false;
      if (rsvpFilter !== 'all' && inv.rsvp_status !== rsvpFilter) return false;
      return true;
    });
  }, [invitations, searchTerm, guestTypeFilter, emailFilter, rsvpFilter]);

  const failedCount = (invitations ?? []).filter((i) => i.email_status === 'failed' && i.status === 'active').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">{title || 'Invited guests'}</h3>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={handleExport} disabled={exporting || !(invitations && invitations.length)}>
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export CSV
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isOrganizer && failedCount > 0 && (
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50" onClick={handleRetryAllFailed} disabled={resendMutation.isPending}>
              <RefreshCw className={`w-3.5 h-3.5 ${resendMutation.isPending ? 'animate-spin' : ''}`} /> Retry {failedCount} failed
            </Button>
          )}
          <Select value={guestTypeFilter} onValueChange={setGuestTypeFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs rounded-lg">
              <SelectValue placeholder="Guest type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All guest types</SelectItem>
              {guestTypes.map((gt) => (
                <SelectItem key={gt.id} value={String(gt.id)}>
                  {gt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={emailFilter} onValueChange={(v) => setEmailFilter(v as typeof emailFilter)}>
            <SelectTrigger className="h-8 w-[140px] text-xs rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EMAIL_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={rsvpFilter} onValueChange={(v) => setRsvpFilter(v as typeof rsvpFilter)}>
            <SelectTrigger className="h-8 w-[130px] text-xs rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RSVP_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-44">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs rounded-lg bg-muted/50 border-none focus-visible:ring-1"
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-[11px] font-bold py-2">Guest</TableHead>
              <TableHead className="text-[11px] font-bold py-2">Guest type</TableHead>
              <TableHead className="text-[11px] font-bold py-2">Email delivery</TableHead>
              <TableHead className="text-[11px] font-bold py-2">RSVP</TableHead>
              <TableHead className="text-[11px] font-bold py-2 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((inv) => (
              <TableRow key={inv.id} className={`group transition-colors ${inv.status !== 'active' ? 'opacity-50' : ''}`}>
                <TableCell className="py-3">
                  <p className="text-sm font-medium">{inv.recipient_name || 'Public link'}</p>
                  {inv.recipient_email && (
                    <p className="text-[11px] text-muted-foreground truncate max-w-[220px]" title={inv.recipient_email}>
                      {inv.recipient_email}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {inv.recipient_phone ? `${inv.recipient_phone} · ` : ''}
                    {inv.invitation_code}
                    {inv.status !== 'active' ? ` · ${inv.status}` : ''}
                  </p>
                </TableCell>
                <TableCell className="py-3">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                    {inv.guest_type?.name || inv.invitation_type}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <EmailStatusBadge inv={inv} />
                </TableCell>
                <TableCell className="py-3 whitespace-nowrap">
                  <RsvpStatusBadge status={inv.rsvp_status} at={inv.rsvp_at} />
                </TableCell>
                <TableCell className="py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {isOrganizer && inv.status === 'active' && inv.recipient_email && (inv.email_status === 'failed' || inv.email_status === 'not_sent') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] gap-1"
                        disabled={resendingId === inv.id}
                        onClick={() => handleResendEmail(inv)}
                      >
                        {resendingId === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        {inv.email_status === 'failed' ? 'Retry' : 'Send'}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      title={inv.rsvp_status === 'pending' ? 'No response yet' : 'View response'}
                      onClick={() => openResponse(inv)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-lg shadow-lg">
                        <DropdownMenuItem onClick={() => handleCopyLink(inv.invitation_url)}>
                          <Copy className="w-3.5 h-3.5 mr-2" /> Copy RSVP link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelectedQR({ url: inv.qr_code_url, code: inv.invitation_code })}>
                          <QrCode className="w-3.5 h-3.5 mr-2" /> QR code
                        </DropdownMenuItem>
                        {isOrganizer && inv.status === 'active' && (
                          <DropdownMenuItem disabled={resendingId === inv.id || !inv.recipient_email} onClick={() => handleResendEmail(inv)}>
                            <Mail className="w-3.5 h-3.5 mr-2" />
                            {resendingId === inv.id ? 'Sending…' : 'Resend email'}
                          </DropdownMenuItem>
                        )}
                        {isOrganizer && inv.status === 'active' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setRevokeTarget(inv)} className="text-rose-600">
                              <XCircle className="w-3.5 h-3.5 mr-2" /> Revoke
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-xs text-muted-foreground">
            {invitations && invitations.length > 0 ? 'No guests match these filters.' : 'No guests invited yet.'}
          </div>
        )}
      </div>

      <ModernConfirmationDialog
        isOpen={!!revokeTarget}
        onClose={() => {
          if (!revokeMutation.isPending) setRevokeTarget(null);
        }}
        onConfirm={() => { void handleRevoke(); }}
        title="Revoke invitation"
        description={revokeTarget
          ? `${revokeTarget.recipient_name || 'This guest'} will no longer be able to RSVP with this link.`
          : undefined}
        confirmText="Revoke"
        cancelText="Keep invitation"
        variant="danger"
        isLoading={revokeMutation.isPending}
      />

      <Dialog open={!!responseFor} onOpenChange={(open) => { if (!open) { setResponseFor(null); setResponse(null); } }}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {responseFor?.recipient_name || 'Guest'} response
            </DialogTitle>
          </DialogHeader>
          {responseLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {response && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{response.recipient_email || 'No email'}</p>
                  {response.recipient_phone && <p className="text-xs text-muted-foreground">{response.recipient_phone}</p>}
                </div>
                <RsvpStatusBadge status={response.rsvp_status} at={response.rsvp_at} />
              </div>
              {response.answers.length > 0 ? (
                <dl className="divide-y divide-border rounded-lg border border-border">
                  {response.answers.map((answer) => (
                    <div key={answer.label} className="grid grid-cols-[140px_1fr] gap-3 px-3 py-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{answer.label}</dt>
                      <dd className="text-sm break-words">{answer.value || '—'}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {response.rsvp_status === 'pending'
                    ? 'This guest has not filled the form yet.'
                    : response.rsvp_status === 'declined'
                      ? 'This guest rejected the invitation. They did not submit the form.'
                      : 'No form answers were saved for this guest.'}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedQR} onOpenChange={(open) => !open && setSelectedQR(null)}>
        <DialogContent className="w-[95vw] max-w-xs max-h-[90vh] overflow-y-auto rounded-xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Invitation QR</DialogTitle>
          </DialogHeader>
          {selectedQR && (
            <div className="flex flex-col items-center gap-4 mt-2">
              <div className="p-3 bg-white border border-border rounded-lg shadow-sm">
                <img src={selectedQR.url} alt="QR" className="w-32 h-32" />
              </div>
              <p className="text-xs font-mono bg-muted px-2 py-1 rounded">{selectedQR.code}</p>
              <Button
                size="sm"
                className="w-full text-xs h-9"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = selectedQR.url;
                  a.download = `qr-${selectedQR.code}.png`;
                  a.click();
                }}
              >
                <Download className="w-3 h-3 mr-2" /> Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
