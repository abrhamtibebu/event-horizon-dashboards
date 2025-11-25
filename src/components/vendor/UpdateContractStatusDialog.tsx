import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import vendorContractApi from '@/lib/vendorContractApi';

interface UpdateContractStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: number;
  currentStatus: string;
}

const CONTRACT_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_signature', label: 'Pending Signature' },
  { value: 'signed', label: 'Signed' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function UpdateContractStatusDialog({
  isOpen,
  onClose,
  contractId,
  currentStatus,
}: UpdateContractStatusDialogProps) {
  const [status, setStatus] = useState(currentStatus);
  const queryClient = useQueryClient();

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      return await vendorContractApi.updateContract(contractId, { status: newStatus as any });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-contracts'] });
      toast.success('Contract status updated successfully!');
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to update contract status');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!status) {
      toast.error('Please select a status');
      return;
    }

    updateStatusMutation.mutate(status);
  };

  const handleClose = () => {
    setStatus(currentStatus);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Contract Status</DialogTitle>
          <DialogDescription>
            Change the status of this contract
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={status} onValueChange={setStatus} required>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_STATUSES.map((statusOption) => (
                  <SelectItem key={statusOption.value} value={statusOption.value}>
                    {statusOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateStatusMutation.isPending || status === currentStatus}>
              {updateStatusMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Status
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


