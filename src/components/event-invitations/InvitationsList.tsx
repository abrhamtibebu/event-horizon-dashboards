import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  QrCode, 
  ExternalLink, 
  Search, 
  Download, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Clock,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { useInvitations, useResendInvitationEmail, useRevokeInvitation } from '@/lib/api/invitations';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface InvitationsListProps {
  eventId: number;
  userId?: number;
  isOrganizer: boolean;
  filterType?: string | string[];
  showResponsesOnly?: boolean;
  title?: string;
}

export function InvitationsList({ 
  eventId, 
  userId, 
  isOrganizer, 
  filterType, 
  showResponsesOnly,
  title 
}: InvitationsListProps) {
  const { data: invitations, isLoading } = useInvitations(eventId, userId);
  const revokeMutation = useRevokeInvitation();
  const resendMutation = useResendInvitationEmail();
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [selectedQR, setSelectedQR] = useState<{ url: string; code: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Copied!');
  };

  const handleRevoke = async (invitationId: number) => {
    if (!confirm('Revoke this invitation?')) return;
    try {
      await revokeMutation.mutateAsync(invitationId);
      toast.success('Revoked');
    } catch (error: any) {
      toast.error('Failed to revoke');
    }
  };

  const handleResendEmail = async (invitationId: number, recipientEmail: string | null | undefined) => {
    if (!recipientEmail?.trim()) {
      toast.error('This invitation has no recipient email. Generate a new invitation with an email address.');
      return;
    }
    setResendingId(invitationId);
    try {
      await resendMutation.mutateAsync({ invitationId });
      toast.success(`Invitation email sent to ${recipientEmail.trim()}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to resend email');
    } finally {
      setResendingId(null);
    }
  };

  const filteredInvitations = useMemo(() => {
    if (!invitations) return [];
    return invitations.filter((inv) => {
      const matchesSearch = 
        inv.invitation_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.recipient_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (inv.recipient_email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (filterType) {
        const types = Array.isArray(filterType) ? filterType : [filterType];
        if (!types.includes(inv.invitation_type)) return false;
      }
      if (showResponsesOnly && inv.rsvp_status === 'pending') return false;
      return true;
    });
  }, [invitations, searchTerm, filterType, showResponsesOnly]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted': return <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Accepted</Badge>;
      case 'declined': return <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">Declined</Badge>;
      default: return <Badge variant="outline" className="text-slate-400 border-slate-200 bg-slate-50">Pending</Badge>;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">{title || 'Invitations'}</h3>
        <div className="relative w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs rounded-lg bg-muted/50 border-none focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-[11px] font-bold py-2">Guest / Code</TableHead>
              <TableHead className="text-[11px] font-bold py-2">Type</TableHead>
              <TableHead className="text-[11px] font-bold py-2">RSVP</TableHead>
              <TableHead className="text-[11px] font-bold py-2 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvitations.map((inv) => (
              <TableRow key={inv.id} className="group transition-colors">
                <TableCell className="py-3">
                  <p className="text-sm font-medium">{inv.recipient_name || 'Public Link'}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{inv.invitation_code}</p>
                  {inv.recipient_email ? (
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[200px]" title={inv.recipient_email}>
                      {inv.recipient_email}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="py-3">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">{inv.invitation_type}</span>
                </TableCell>
                <TableCell className="py-3">
                  {getStatusBadge(inv.rsvp_status)}
                </TableCell>
                <TableCell className="py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-lg shadow-lg">
                      <DropdownMenuItem onClick={() => handleCopyLink(inv.invitation_url)}>
                        <Copy className="w-3.5 h-3.5 mr-2" /> Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedQR({ url: inv.qr_code_url, code: inv.invitation_code })}>
                        <QrCode className="w-3.5 h-3.5 mr-2" /> QR Code
                      </DropdownMenuItem>
                      {isOrganizer && inv.status === 'active' && (
                        <DropdownMenuItem
                          disabled={resendingId === inv.id || !inv.recipient_email}
                          onClick={() => handleResendEmail(inv.id, inv.recipient_email)}
                        >
                          <Mail className="w-3.5 h-3.5 mr-2" />
                          {resendingId === inv.id ? 'Sending…' : 'Resend email'}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {isOrganizer && (
                        <DropdownMenuItem onClick={() => handleRevoke(inv.id)} className="text-rose-600">
                          <XCircle className="w-3.5 h-3.5 mr-2" /> Revoke
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredInvitations.length === 0 && (
          <div className="p-8 text-center text-xs text-muted-foreground">No records found.</div>
        )}
      </div>

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
              <Button size="sm" className="w-full text-xs h-9" onClick={() => {
                const a = document.createElement('a'); a.href = selectedQR.url; a.download = `qr-${selectedQR.code}.png`; a.click();
              }}>
                <Download className="w-3 h-3 mr-2" /> Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



