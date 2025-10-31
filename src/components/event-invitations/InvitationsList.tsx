import { useState } from 'react';
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
import { Copy, QrCode, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { useInvitations, useRevokeInvitation } from '@/lib/api/invitations';
import { formatConversionRate } from '@/lib/invitationUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface InvitationsListProps {
  eventId: number;
  userId?: number;
  isOrganizer: boolean;
}

export function InvitationsList({ eventId, userId, isOrganizer }: InvitationsListProps) {
  const { data: invitations, isLoading } = useInvitations(eventId, userId);
  const revokeMutation = useRevokeInvitation();
  const [selectedQR, setSelectedQR] = useState<{ url: string; code: string } | null>(null);

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Invitation link copied!');
  };

  const handleRevoke = async (invitationId: number) => {
    if (!confirm('Are you sure you want to revoke this invitation? It will no longer be usable.')) {
      return;
    }

    try {
      await revokeMutation.mutateAsync(invitationId);
      toast.success('Invitation revoked successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to revoke invitation');
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">
          {isOrganizer ? 'All Invitations' : 'My Invitations'}
        </h3>

        {!invitations || invitations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No invitations generated yet.</p>
            <p className="text-sm mt-2">Generate your first invitation link above to start tracking!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  {isOrganizer && <TableHead>User</TableHead>}
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Clicks</TableHead>
                  <TableHead className="text-center">Shares</TableHead>
                  <TableHead className="text-center">Registrations</TableHead>
                  <TableHead className="text-center">Conv. Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-mono text-sm">
                      {invitation.invitation_code}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invitation.invitation_type === 'personalized' ? 'default' : 'secondary'}>
                        {invitation.invitation_type === 'personalized' ? 'Personalized' : 'Generic'}
                      </Badge>
                    </TableCell>
                    {isOrganizer && (
                      <TableCell className="text-sm">
                        {invitation.user_name}
                      </TableCell>
                    )}
                    <TableCell className="text-sm">
                      {format(parseISO(invitation.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          invitation.status === 'active' ? 'default' :
                          invitation.status === 'expired' ? 'secondary' :
                          'destructive'
                        }
                      >
                        {invitation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {invitation.stats.total_clicks}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {invitation.stats.total_shares}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-green-600">
                      {invitation.stats.total_registrations}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium">
                        {formatConversionRate(
                          invitation.stats.total_registrations,
                          invitation.stats.total_clicks
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyLink(invitation.invitation_url)}
                          title="Copy Link"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedQR({ 
                            url: invitation.qr_code_url, 
                            code: invitation.invitation_code 
                          })}
                          title="View QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(invitation.invitation_url, '_blank')}
                          title="Open Link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        {isOrganizer && invitation.status === 'active' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRevoke(invitation.id)}
                            title="Revoke Invitation"
                            disabled={revokeMutation.isPending}
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* QR Code Modal */}
      <Dialog open={!!selectedQR} onOpenChange={(open) => !open && setSelectedQR(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitation QR Code</DialogTitle>
          </DialogHeader>
          {selectedQR && (
            <div className="flex flex-col items-center gap-4">
              <img
                src={selectedQR.url}
                alt="Invitation QR Code"
                className="w-64 h-64 border rounded"
              />
              <p className="text-sm text-gray-600 font-mono">
                Code: {selectedQR.code}
              </p>
              <Button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = selectedQR.url;
                  link.download = `invitation-qr-${selectedQR.code}.png`;
                  link.click();
                  toast.success('QR code downloaded!');
                }}
              >
                Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

