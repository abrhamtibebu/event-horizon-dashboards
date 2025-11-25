import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import vendorContractApi from '@/lib/vendorContractApi';

interface AddPODialogProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: number;
}

export default function AddPODialog({ isOpen, onClose, contractId }: AddPODialogProps) {
  const [poNumber, setPoNumber] = useState('');
  const [poFile, setPoFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const addPOMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await vendorContractApi.addPO(contractId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-contracts'] });
      toast.success('PO added successfully!');
      handleClose();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to add PO';
      const errorDetails = error?.response?.data?.errors;
      
      if (errorDetails) {
        const errorText = Object.values(errorDetails).flat().join(', ');
        toast.error(`${errorMessage}: ${errorText}`);
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!poNumber.trim()) {
      toast.error('Please enter a PO number');
      return;
    }

    const submitData = new FormData();
    submitData.append('po_number', poNumber.trim());
    
    if (poFile && poFile.size > 0) {
      submitData.append('po_file', poFile);
    }

    addPOMutation.mutate(submitData);
  };

  const handleClose = () => {
    setPoNumber('');
    setPoFile(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Purchase Order</DialogTitle>
          <DialogDescription>
            Add a PO number and optionally upload the PO document
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="po_number">PO Number *</Label>
            <Input
              id="po_number"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="e.g., PO-2025-0001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="po_file">PO Document (Optional)</Label>
            <div className="flex items-center gap-4">
              <Label htmlFor="po_file" className="cursor-pointer">
                <Button type="button" variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload PO
                  </span>
                </Button>
              </Label>
              <Input
                id="po_file"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setPoFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              {poFile && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  <span>{poFile.name}</span>
                  <span className="text-muted-foreground">
                    ({(poFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload PDF, DOC, DOCX, JPG, JPEG, or PNG files (max 20MB)
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={addPOMutation.isPending}>
              {addPOMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add PO
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


