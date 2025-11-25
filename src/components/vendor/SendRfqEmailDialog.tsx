import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Send, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import vendorApi from '@/lib/vendorApi';
import vendorRequirementApi from '@/lib/vendorRequirementApi';
import { usePermissionCheck } from '@/hooks/use-permission-check';

interface SendRfqEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  requirementId: number;
}

export default function SendRfqEmailDialog({ isOpen, onClose, requirementId }: SendRfqEmailDialogProps) {
  const [selectedVendors, setSelectedVendors] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const { checkPermission } = usePermissionCheck();

  const { data: vendors } = useQuery({
    queryKey: ['vendors', searchTerm],
    queryFn: () => vendorApi.getVendors({ search: searchTerm }),
    enabled: isOpen,
  });

  const sendEmailMutation = useMutation({
    mutationFn: (vendorIds: number[]) =>
      vendorRequirementApi.sendRfqEmail(requirementId, vendorIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rfq-invites'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-requirement', requirementId] });
      toast.success(data.message || 'RFQ emails sent successfully!');
      setSelectedVendors([]);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to send emails');
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

  const handleSendEmails = () => {
    // Check permission before sending
    if (!checkPermission('vendors.rfq.send', 'send RFQs')) {
      return;
    }
    
    if (selectedVendors.length === 0) {
      toast.error('Please select at least one vendor');
      return;
    }
    sendEmailMutation.mutate(selectedVendors);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send RFQ via Email
          </DialogTitle>
          <DialogDescription>
            Select vendors to send RFQ invitation emails to. All selected vendors will receive the email at once.
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
                onClick={handleSendEmails}
                disabled={selectedVendors.length === 0 || sendEmailMutation.isPending}
              >
                {sendEmailMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Send className="h-4 w-4 mr-2" />
                Send to All Selected
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

