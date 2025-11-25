import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import vendorApi from '@/lib/vendorApi';

interface VendorRfqStatusViewProps {
  requirementId: number;
}

export default function VendorRfqStatusView({ requirementId }: VendorRfqStatusViewProps) {
  const { data: invites, isLoading } = useQuery({
    queryKey: ['rfq-invites', requirementId],
    queryFn: () => vendorApi.getRfqInvites({ requirement_id: requirementId }),
  });

  const inviteList = Array.isArray(invites) ? invites : [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      sent: 'default',
      viewed: 'secondary',
      responded: 'default',
      declined: 'destructive',
      expired: 'secondary',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>RFQ Invitation Status</CardTitle>
        <CardDescription>Track the status of RFQ invitations sent to vendors</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : inviteList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No invitations sent yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Viewed At</TableHead>
                <TableHead>Responded At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inviteList.map((invite: any) => (
                <TableRow key={invite.id}>
                  <TableCell className="font-medium">
                    {invite.vendor?.name || 'N/A'}
                  </TableCell>
                  <TableCell>{getStatusBadge(invite.status)}</TableCell>
                  <TableCell>
                    {invite.sent_at ? new Date(invite.sent_at).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {invite.viewed_at ? new Date(invite.viewed_at).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>
                    {invite.responded_at ? new Date(invite.responded_at).toLocaleString() : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}


