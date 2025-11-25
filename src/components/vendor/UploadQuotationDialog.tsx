import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { createVendorQuotation, uploadQuotationAttachment } from '@/lib/api';

interface UploadQuotationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  requirementId: number;
  vendorId: number;
  eventId: number;
  onSuccess?: (quotationId: number) => void;
}

export default function UploadQuotationDialog({
  isOpen,
  onClose,
  requirementId,
  vendorId,
  eventId,
  onSuccess,
}: UploadQuotationDialogProps) {
  const [quotationFile, setQuotationFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    terms_conditions: '',
    submission_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    notes: '',
  });
  const queryClient = useQueryClient();

  const createQuotationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await createVendorQuotation(data);
      return response.data;
    },
    onSuccess: async (quotation) => {
      // Upload file if provided
      if (quotationFile && quotation.id) {
        try {
          await uploadQuotationAttachment(quotation.id, quotationFile);
        } catch (error: any) {
          console.error('Failed to upload quotation file:', error);
          toast.warning('Quotation created but file upload failed');
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['vendor-quotations'] });
      queryClient.invalidateQueries({ queryKey: ['rfq-invites'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-requirement'] });
      toast.success('Quotation created successfully');
      
      if (onSuccess) {
        onSuccess(quotation.id);
      }
      
      // Reset form
      setFormData({
        amount: '',
        description: '',
        terms_conditions: '',
        submission_date: new Date().toISOString().split('T')[0],
        valid_until: '',
        notes: '',
      });
      setQuotationFile(null);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create quotation');
    },
  });

  const handleSubmit = () => {
    if (!formData.amount || !formData.description) {
      toast.error('Please fill in required fields (Amount and Description)');
      return;
    }

    const quotationData = {
      vendor_id: vendorId,
      event_id: eventId,
      requirement_id: requirementId,
      amount: parseFloat(formData.amount),
      description: formData.description,
      terms_conditions: formData.terms_conditions || null,
      submission_date: formData.submission_date,
      valid_until: formData.valid_until || null,
      notes: formData.notes || null,
    };

    createQuotationMutation.mutate(quotationData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Quotation</DialogTitle>
          <DialogDescription>
            Create a quotation for this vendor and upload the quotation document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Total Amount (ETB) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="submission_date">Submission Date *</Label>
              <Input
                id="submission_date"
                type="date"
                value={formData.submission_date}
                onChange={(e) => setFormData({ ...formData, submission_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the quotation details..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valid_until">Valid Until</Label>
            <Input
              id="valid_until"
              type="date"
              value={formData.valid_until}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms_conditions">Terms & Conditions</Label>
            <Textarea
              id="terms_conditions"
              value={formData.terms_conditions}
              onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
              placeholder="Enter terms and conditions..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quotation_file">Quotation Document (Optional)</Label>
            <div className="flex items-center gap-4">
              <Label htmlFor="quotation_file" className="cursor-pointer">
                <Button type="button" variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </span>
                </Button>
              </Label>
              <Input
                id="quotation_file"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setQuotationFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              {quotationFile && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  <span>{quotationFile.name}</span>
                  <span className="text-muted-foreground">
                    ({(quotationFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload PDF, DOC, DOCX, JPG, or PNG files (max 10MB)
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.amount || !formData.description || createQuotationMutation.isPending}
            >
              {createQuotationMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Quotation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

