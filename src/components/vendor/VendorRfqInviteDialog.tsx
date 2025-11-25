import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import vendorApi from '@/lib/vendorApi';
import vendorRequirementApi from '@/lib/vendorRequirementApi';
import { usePermissionCheck } from '@/hooks/use-permission-check';

interface VendorRfqInviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  requirementId: number;
}

export default function VendorRfqInviteDialog({ isOpen, onClose, requirementId }: VendorRfqInviteDialogProps) {
  const [selectedVendors, setSelectedVendors] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const { checkPermission } = usePermissionCheck();

  const { data: vendors } = useQuery({
    queryKey: ['vendors', searchTerm],
    queryFn: () => vendorApi.getVendors({ search: searchTerm }),
    enabled: isOpen,
  });

  const inviteMutation = useMutation({
    mutationFn: (vendorIds: number[]) => 
      vendorRequirementApi.inviteVendors(requirementId, vendorIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-rfq-invites'] });
      toast.success('RFQ invitations sent successfully!');
      setSelectedVendors([]);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to send invitations');
    },
  });

  const vendorList = Array.isArray(vendors) ? vendors : [];

  const handleToggleVendor = (vendorId: number) => {
    setSelectedVendors(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleSendInvites = () => {
    // Check permission before sending
    if (!checkPermission('vendors.rfq.invite', 'invite vendors to RFQ')) {
      return;
    }
    
    if (selectedVendors.length === 0) {
      toast.error('Please select at least one vendor');
      return;
    }
    inviteMutation.mutate(selectedVendors);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Vendors to RFQ</DialogTitle>
          <DialogDescription>
            Select vendors to send RFQ invitations for this requirement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="border rounded-lg max-h-[400px] overflow-y-auto">
            {vendorList.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No vendors found
              </div>
            ) : (
              <div className="divide-y">
                {vendorList.map((vendor: any) => (
                  <div
                    key={vendor.id}
                    className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleToggleVendor(vendor.id)}
                  >
                    <Checkbox
                      checked={selectedVendors.includes(vendor.id)}
                      onCheckedChange={() => handleToggleVendor(vendor.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-sm text-muted-foreground">{vendor.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {vendor.services_provided?.slice(0, 3).map((service: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedVendors.length} vendor(s) selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSendInvites}
                disabled={selectedVendors.length === 0 || inviteMutation.isPending}
              >
                {inviteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Send className="h-4 w-4 mr-2" />
                Send Invitations
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


