import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Calendar, DollarSign, Building, Mail, Download, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import vendorRequirementApi from '@/lib/vendorRequirementApi';
import { uploadProforma, getQuotationLineItems, createQuotationLineItem, updateQuotationLineItem, deleteQuotationLineItem, getVendorQuotations } from '@/lib/api';
import vendorApi from '@/lib/vendorApi';
import { usePermissionCheck } from '@/hooks/use-permission-check';
import { PermissionGuard } from '@/components/PermissionGuard';
import QuotationLineItems from './QuotationLineItems';
import UploadQuotationDialog from './UploadQuotationDialog';

interface RfqDetailsDialogProps {
  requirementId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RfqDetailsDialog({ requirementId, isOpen, onClose }: RfqDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadQuotationDialog, setUploadQuotationDialog] = useState<{
    isOpen: boolean;
    vendorId: number | null;
  }>({ isOpen: false, vendorId: null });
  const [expandedQuotations, setExpandedQuotations] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissionCheck();

  const { data: requirementResponse, isLoading } = useQuery({
    queryKey: ['vendor-requirement', requirementId],
    queryFn: () => requirementId ? vendorRequirementApi.getRequirement(requirementId) : null,
    enabled: isOpen && requirementId !== null,
  });

  const requirement = requirementResponse?.data;

  const { data: invitesResponse } = useQuery({
    queryKey: ['rfq-invites', requirementId],
    queryFn: () => requirementId ? vendorApi.getRfqInvites({ requirement_id: requirementId }) : null,
    enabled: isOpen && requirementId !== null,
  });

  const invites = Array.isArray(invitesResponse) ? invitesResponse : [];

  // Fetch quotations for this requirement
  const { data: quotationsResponse } = useQuery({
    queryKey: ['vendor-quotations', requirementId],
    queryFn: () => requirementId ? getVendorQuotations({ requirement_id: requirementId }) : null,
    enabled: isOpen && requirementId !== null,
  });

  // Extract quotations array from response - handle different response structures
  const quotations = (() => {
    if (!quotationsResponse) return [];
    const data = quotationsResponse.data || quotationsResponse;
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  })();
  
  // Map quotations to invites by vendor_id
  const invitesWithQuotations = invites.map((invite: any) => {
    const quotation = Array.isArray(quotations) 
      ? quotations.find((q: any) => q.vendor_id === invite.vendor_id && q.requirement_id === requirementId)
      : null;
    return { ...invite, quotation };
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ inviteId, status }: { inviteId: number; status: string }) =>
      vendorApi.updateRfqInvite(inviteId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfq-invites'] });
      toast.success('RFQ status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update status');
    },
  });

  const handleStatusChange = (inviteId: number, status: string) => {
    updateStatusMutation.mutate({ inviteId, status });
  };

  const handleDownloadPdf = async () => {
    if (!requirementId) return;
    try {
      const response = await vendorRequirementApi.downloadRfqDocument(requirementId, 'pdf');
      if (response.success && response.data.url) {
        window.open(response.data.url, '_blank');
        toast.success('PDF downloaded successfully');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to download PDF');
    }
  };

  const handleDownloadWord = async () => {
    if (!requirementId) return;
    try {
      const response = await vendorRequirementApi.downloadRfqDocument(requirementId, 'word');
      if (response.success && response.data.url) {
        window.open(response.data.url, '_blank');
        toast.success('Word document downloaded successfully');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to download Word document');
    }
  };

  // Check if user has permission to view RFQ
  if (!hasPermission('vendors.rfq.view')) {
    return null; // Don't render if no permission
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isLoading ? 'Loading...' : (requirement?.title || 'RFQ Details')}
          </DialogTitle>
          <DialogDescription>
            RFQ Details and Management
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !requirement ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Requirement not found</p>
          </div>
        ) : (
          <>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building className="h-4 w-4" />
                  Event
                </div>
                <p className="text-sm text-muted-foreground">
                  {requirement.event?.title || requirement.event?.name || 'N/A'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Deadline
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(requirement.deadline).toLocaleDateString()}
                </p>
              </div>

              {(requirement.budget_min || requirement.budget_max) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="h-4 w-4" />
                    Budget Range
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {requirement.budget_min && requirement.budget_max
                      ? `${requirement.budget_min.toLocaleString()} - ${requirement.budget_max.toLocaleString()} ETB`
                      : requirement.budget_min
                      ? `Min: ${requirement.budget_min.toLocaleString()} ETB`
                      : `Max: ${requirement.budget_max.toLocaleString()} ETB`}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  Status
                </div>
                <Badge variant={requirement.status === 'active' ? 'default' : 'secondary'}>
                  {requirement.status}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Description
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {requirement.description}
              </p>
            </div>

            {requirement.service_categories && requirement.service_categories.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Service Categories</div>
                <div className="flex flex-wrap gap-2">
                  {requirement.service_categories.map((cat: string, idx: number) => (
                    <Badge key={idx} variant="outline">{cat}</Badge>
                  ))}
                </div>
              </div>
            )}

            {requirement.special_requirements && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Special Requirements</div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {requirement.special_requirements}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium">Invited Vendors ({invites.length})</div>
              {invites.length === 0 ? (
                <p className="text-sm text-muted-foreground">No vendors invited yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite: any) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">{invite.vendor?.name || 'N/A'}</TableCell>
                        <TableCell>{invite.vendor?.email || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={
                            invite.status === 'quoted' ? 'default' :
                            invite.status === 'declined' ? 'destructive' :
                            invite.status === 'viewed' ? 'secondary' : 'outline'
                          }>
                            {invite.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invite.sent_at ? new Date(invite.sent_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Invited Vendors</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadWord}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Word
                  </Button>
                </div>
              </div>

              {invitesWithQuotations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No vendors invited yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Quotation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitesWithQuotations.map((invite: any) => (
                      <React.Fragment key={invite.id}>
                        <TableRow>
                          <TableCell className="font-medium">{invite.vendor?.name || 'N/A'}</TableCell>
                          <TableCell>{invite.vendor?.email || 'N/A'}</TableCell>
                          <TableCell>
                            <Select
                              value={invite.status}
                              onValueChange={(value) => handleStatusChange(invite.id, value)}
                              disabled={updateStatusMutation.isPending}
                            >
                              <SelectTrigger className="w-[150px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="viewed">Viewed</SelectItem>
                                <SelectItem value="quoted">Quoted</SelectItem>
                                <SelectItem value="declined">Declined</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {invite.quotation ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="default">Quotation #{invite.quotation.quotation_number}</Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newExpanded = new Set(expandedQuotations);
                                    if (newExpanded.has(invite.quotation.id)) {
                                      newExpanded.delete(invite.quotation.id);
                                    } else {
                                      newExpanded.add(invite.quotation.id);
                                    }
                                    setExpandedQuotations(newExpanded);
                                  }}
                                >
                                  {expandedQuotations.has(invite.quotation.id) ? 'Hide' : 'View'} Pricing
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">No quotation yet</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setUploadQuotationDialog({ isOpen: true, vendorId: invite.vendor_id })}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Quotation
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                        {invite.quotation && expandedQuotations.has(invite.quotation.id) && (
                          <TableRow>
                            <TableCell colSpan={4} className="p-4">
                              <QuotationLineItems quotationId={invite.quotation.id} />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>

      {requirement && uploadQuotationDialog.vendorId && (
        <UploadQuotationDialog
          isOpen={uploadQuotationDialog.isOpen}
          onClose={() => setUploadQuotationDialog({ isOpen: false, vendorId: null })}
          requirementId={requirement.id}
          vendorId={uploadQuotationDialog.vendorId}
          eventId={requirement.event_id}
          onSuccess={async (quotationId) => {
            // Update RFQ invite status to "quoted" when quotation is created
            const invite = invites.find((inv: any) => inv.vendor_id === uploadQuotationDialog.vendorId);
            if (invite) {
              try {
                await vendorApi.updateRfqInvite(invite.id, { status: 'quoted' });
                toast.success('RFQ status updated to "quoted"');
              } catch (error: any) {
                console.error('Failed to update RFQ status:', error);
                toast.error(error?.message || 'Failed to update RFQ status');
              }
            }
            
            // Expand the quotation row to show line items
            setExpandedQuotations(prev => new Set(prev).add(quotationId));
            
            queryClient.invalidateQueries({ queryKey: ['vendor-quotations', requirementId] });
            queryClient.invalidateQueries({ queryKey: ['rfq-invites', requirementId] });
            queryClient.invalidateQueries({ queryKey: ['vendor-requirement', requirementId] });
          }}
        />
      )}
    </Dialog>
  );
}

