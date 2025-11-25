import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketCard } from '@/components/tickets/TicketCard';
import { TicketQRCodeModal } from '@/components/tickets/TicketQRCodeModal';
import { Button } from '@/components/ui/button';
import { Ticket as TicketIcon, AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { getMyTickets, refundTicket, downloadTicketPDF } from '@/lib/api/tickets';
import { toast } from 'sonner';
import type { Ticket, TicketStatus } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function MyTicketsPage() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [refundTicketId, setRefundTicketId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'used' | 'expired' | 'refunded'>('all');
  
  const queryClient = useQueryClient();

  // Fetch user's tickets
  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: getMyTickets,
  });

  // Refund mutation
  const refundMutation = useMutation({
    mutationFn: refundTicket,
    onSuccess: () => {
      toast.success('Ticket refund requested successfully');
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      setRefundTicketId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to refund ticket');
    },
  });

  // Filter tickets based on active tab
  const filteredTickets = tickets?.data?.filter((ticket: Ticket) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ticket.status === 'confirmed';
    if (activeTab === 'used') return ticket.status === 'used';
    if (activeTab === 'refunded') return ticket.status === 'refunded';
    if (activeTab === 'expired') {
      return ticket.expires_at && new Date(ticket.expires_at) < new Date();
    }
    return true;
  }) || [];

  const handleViewQR = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowQRModal(true);
  };

  const handleDownload = async (ticket: Ticket) => {
    try {
      await downloadTicketPDF(ticket.id);
      toast.success('Ticket downloaded successfully');
    } catch (error) {
      toast.error('Failed to download ticket');
    }
  };

  const handleRefund = (ticket: Ticket) => {
    setRefundTicketId(ticket.id);
  };

  const confirmRefund = () => {
    if (refundTicketId) {
      refundMutation.mutate(refundTicketId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" variant="primary" text="Loading tickets..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-lg font-semibold">Failed to load tickets</p>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'An error occurred'}
        </p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['my-tickets'] })}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Tickets</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your event tickets
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <TicketIcon className="w-6 h-6 text-primary" />
          <span className="text-2xl font-bold">{filteredTickets.length}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets?.data?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {tickets?.data?.filter((t: Ticket) => t.status === 'confirmed').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">
              {tickets?.data?.filter((t: Ticket) => t.status === 'used').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ETB {tickets?.data?.reduce((sum: number, t: Ticket) => sum + t.price_paid, 0).toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Filter */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="used">Used</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="refunded">Refunded</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TicketIcon className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold">No tickets found</p>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'all'
                    ? 'You haven\'t purchased any tickets yet'
                    : `No ${activeTab} tickets`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTickets.map((ticket: Ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onViewQR={() => handleViewQR(ticket)}
                  onDownload={() => handleDownload(ticket)}
                  onRefund={() => handleRefund(ticket)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* QR Code Modal */}
      <TicketQRCodeModal
        ticket={selectedTicket}
        open={showQRModal}
        onOpenChange={setShowQRModal}
      />

      {/* Refund Confirmation Dialog */}
      <AlertDialog open={!!refundTicketId} onOpenChange={() => setRefundTicketId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Ticket Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to request a refund for this ticket? This action cannot be undone.
              The refund will be processed within 5-7 business days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRefund} disabled={refundMutation.isPending}>
              {refundMutation.isPending ? 'Processing...' : 'Confirm Refund'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

