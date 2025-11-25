import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, CheckCircle2, Star, DollarSign, Clock, AlertCircle, Loader2, Eye } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import vendorContractApi from '@/lib/vendorContractApi';
import vendorMilestoneApi from '@/lib/vendorMilestoneApi';
import vendorApi from '@/lib/vendorApi';
import VendorReviewForm from './VendorReviewForm';
import VendorReliabilityScore from './VendorReliabilityScore';

export default function PaymentSettlementView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState<number | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: contractsResponse, isLoading } = useQuery({
    queryKey: ['vendor-contracts', searchTerm, 'completed'],
    queryFn: () => vendorContractApi.getContracts({ 
      search: searchTerm,
      status: 'completed',
      per_page: 1000
    }),
  });

  const contracts = contractsResponse?.success
    ? (() => {
        const data = contractsResponse.data;
        if (data?.data && Array.isArray(data.data)) return data.data;
        if (Array.isArray(data)) return data;
        return [];
      })()
    : [];

  // Fetch milestones for selected contract
  const { data: milestonesResponse } = useQuery({
    queryKey: ['payment-milestones', selectedContract],
    queryFn: () => vendorMilestoneApi.getMilestones(selectedContract!),
    enabled: !!selectedContract,
  });

  const milestones = milestonesResponse?.success ? milestonesResponse.data : [];

  // Fetch reviews for selected contract
  const { data: reviewsResponse } = useQuery({
    queryKey: ['vendor-reviews', selectedContract],
    queryFn: () => vendorApi.getReviews({ contract_id: selectedContract }),
    enabled: !!selectedContract,
  });

  const reviews = Array.isArray(reviewsResponse) ? reviewsResponse : [];

  // Calculate payment status for a contract
  const getPaymentStatus = (contract: any, contractMilestones: any[]) => {
    if (!contractMilestones || contractMilestones.length === 0) {
      return { status: 'no_milestones', label: 'No Milestones', variant: 'secondary' as const };
    }

    const paidCount = contractMilestones.filter((m: any) => m.status === 'paid').length;
    const totalCount = contractMilestones.length;
    const approvedCount = contractMilestones.filter((m: any) => m.status === 'approved').length;
    const triggeredCount = contractMilestones.filter((m: any) => m.status === 'triggered').length;

    if (paidCount === totalCount) {
      return { status: 'fully_paid', label: 'Fully Paid', variant: 'default' as const };
    } else if (paidCount > 0) {
      return { status: 'partially_paid', label: `Partially Paid (${paidCount}/${totalCount})`, variant: 'default' as const };
    } else if (approvedCount > 0) {
      return { status: 'approved_pending', label: 'Approved, Pending Payment', variant: 'secondary' as const };
    } else if (triggeredCount > 0) {
      return { status: 'pending_approval', label: 'Pending Approval', variant: 'secondary' as const };
    } else {
      return { status: 'pending', label: 'Pending', variant: 'secondary' as const };
    }
  };

  // Approve milestone mutation
  const approveMilestoneMutation = useMutation({
    mutationFn: ({ contractId, milestoneId }: { contractId: number; milestoneId: number }) =>
      vendorMilestoneApi.updateMilestone(contractId, milestoneId, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-milestones'] });
      toast.success('Milestone approved successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to approve milestone');
    },
  });

  // Process payment mutation (mark as paid)
  const processPaymentMutation = useMutation({
    mutationFn: ({ contractId, milestoneId }: { contractId: number; milestoneId: number }) =>
      vendorMilestoneApi.updateMilestone(contractId, milestoneId, { status: 'paid' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-milestones'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-contracts'] });
      toast.success('Payment processed successfully!');
      setIsPaymentDialogOpen(false);
      setSelectedMilestone(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to process payment');
    },
  });

  const handleApproveMilestone = (contractId: number, milestoneId: number) => {
    approveMilestoneMutation.mutate({ contractId, milestoneId });
  };

  const handleProcessPayment = (contractId: number, milestoneId: number) => {
    setSelectedMilestone(milestoneId);
    setIsPaymentDialogOpen(true);
  };

  const confirmProcessPayment = () => {
    if (selectedContract && selectedMilestone) {
      processPaymentMutation.mutate({ contractId: selectedContract, milestoneId: selectedMilestone });
    }
  };

  const selectedContractData = contracts.find((c: any) => c.id === selectedContract);
  const contractMilestones = selectedContract ? milestones : [];
  const contractReview = reviews.length > 0 ? reviews[0] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Settlement & Review</h2>
          <p className="text-muted-foreground">Process final payments and review vendor performance</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No completed contracts found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Review Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract: any) => {
                  // Get milestones for this contract (we'll need to fetch them separately or include in contract)
                  const contractMilestonesData = contract.milestones || [];
                  const paymentStatus = getPaymentStatus(contract, contractMilestonesData);
                  
                  return (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">{contract.contract_number}</TableCell>
                      <TableCell>{contract.vendor?.name || 'N/A'}</TableCell>
                      <TableCell>{contract.event?.name || contract.event?.title || 'N/A'}</TableCell>
                      <TableCell>{Number(contract.total_amount).toLocaleString()} {contract.currency || 'ETB'}</TableCell>
                      <TableCell>
                        <Badge variant={paymentStatus.variant}>
                          {paymentStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {contract.reviews && contract.reviews.length > 0 ? (
                          <Badge variant="outline">
                            <Star className="h-3 w-3 mr-1" />
                            Reviewed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedContract(contract.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedContract && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Milestones</CardTitle>
              <CardDescription>
                Manage payment milestones for contract {selectedContractData?.contract_number}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No payment milestones found</p>
                  <p className="text-sm mt-2">Create milestones in the Contract Management section</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {milestones.map((milestone: any) => (
                    <Card key={milestone.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{milestone.milestone_name}</h4>
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                          )}
                        </div>
                        <Badge
                          variant={
                            milestone.status === 'paid'
                              ? 'default'
                              : milestone.status === 'approved'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {milestone.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>{Number(milestone.amount).toLocaleString()} {selectedContractData?.currency || 'ETB'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{milestone.percentage}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {milestone.status === 'triggered' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveMilestone(selectedContract, milestone.id)}
                              disabled={approveMilestoneMutation.isPending}
                            >
                              {approveMilestoneMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Approve'
                              )}
                            </Button>
                          )}
                          {milestone.status === 'approved' && (
                            <Button
                              size="sm"
                              onClick={() => handleProcessPayment(selectedContract, milestone.id)}
                              disabled={processPaymentMutation.isPending}
                            >
                              <DollarSign className="h-3 w-3 mr-1" />
                              Process Payment
                            </Button>
                          )}
                          {milestone.status === 'paid' && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              Paid
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {contractReview ? (
              <Card>
                <CardHeader>
                  <CardTitle>Existing Review</CardTitle>
                  <CardDescription>Review already submitted for this contract</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-2xl font-bold">
                        {contractReview.overall_score?.toFixed(1) || 'N/A'}
                      </span>
                      <span className="text-muted-foreground">/ 5.0</span>
                    </div>
                    {contractReview.comments && (
                      <div>
                        <p className="text-sm font-medium mb-1">Comments:</p>
                        <p className="text-sm text-muted-foreground">{contractReview.comments}</p>
                      </div>
                    )}
                    {contractReview.would_recommend && (
                      <Badge variant="default">Would Recommend</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <VendorReviewForm
                contractId={selectedContract}
                onClose={() => setSelectedContract(null)}
              />
            )}
            <VendorReliabilityScore contractId={selectedContract} />
          </div>
        </div>
      )}

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Confirm that payment has been processed for this milestone
            </DialogDescription>
          </DialogHeader>
          {selectedMilestone && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Milestone</p>
                <p className="font-medium">
                  {milestones.find((m: any) => m.id === selectedMilestone)?.milestone_name}
                </p>
                <p className="text-sm text-muted-foreground mt-2">Amount</p>
                <p className="font-medium text-lg">
                  {Number(milestones.find((m: any) => m.id === selectedMilestone)?.amount).toLocaleString()}{' '}
                  {selectedContractData?.currency || 'ETB'}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={confirmProcessPayment}
                  disabled={processPaymentMutation.isPending}
                >
                  {processPaymentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirm Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
