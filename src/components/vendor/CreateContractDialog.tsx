import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, Plus, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import vendorContractApi from '@/lib/vendorContractApi';
import { getVendorQuotations } from '@/lib/api';
import vendorApi from '@/lib/vendorApi';

interface CreateContractDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quotationId?: number;
}

interface Deliverable {
  title: string;
  description: string;
  due_date: string;
  amount: string;
  priority: string;
  owner: string;
  owner_type: 'vendor' | 'organizer';
}

export default function CreateContractDialog({ isOpen, onClose, quotationId }: CreateContractDialogProps) {
  const [formData, setFormData] = useState({
    quotation_id: quotationId?.toString() || '',
    vendor_id: '',
    event_id: '',
    total_amount: '',
    currency: 'ETB',
    start_date: '',
    end_date: '',
    terms_conditions: '',
  });
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const queryClient = useQueryClient();

  const { data: quotations } = useQuery({
    queryKey: ['approved-quotations'],
    queryFn: async () => {
      const response = await getVendorQuotations({ status: 'approved' });
      return response.data;
    },
    enabled: isOpen && !quotationId,
  });

  const quotationList = Array.isArray(quotations?.data?.data)
    ? quotations.data.data
    : Array.isArray(quotations?.data)
    ? quotations.data
    : Array.isArray(quotations)
    ? quotations
    : [];

  const selectedQuotation = quotationId
    ? null
    : quotationList.find((q: any) => q.id === Number(formData.quotation_id));

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await vendorContractApi.createContract(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['deliverables'] });
      toast.success('Contract created successfully!');
      handleClose();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create contract';
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
    
    if (!formData.quotation_id || !formData.vendor_id || !formData.event_id || !formData.total_amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Create FormData for file upload
    const submitData = new FormData();
    submitData.append('vendor_id', selectedQuotation?.vendor_id?.toString() || formData.vendor_id);
    submitData.append('quotation_id', formData.quotation_id);
    submitData.append('event_id', selectedQuotation?.event_id?.toString() || formData.event_id);
    submitData.append('total_amount', formData.total_amount);
    submitData.append('currency', formData.currency);
    
    if (formData.start_date) {
      submitData.append('start_date', formData.start_date);
    }
    if (formData.end_date) {
      submitData.append('end_date', formData.end_date);
    }
    if (formData.terms_conditions) {
      submitData.append('terms_conditions', formData.terms_conditions);
    }
    if (selectedQuotation?.requirement_id) {
      submitData.append('requirement_id', selectedQuotation.requirement_id.toString());
    }
    
    // Add contract file if provided
    if (contractFile && contractFile.size > 0) {
      submitData.append('contract_file', contractFile);
    }
    
    // Add deliverables if any
    if (deliverables.length > 0) {
      deliverables.forEach((deliverable, index) => {
        if (deliverable.title) {
          submitData.append(`deliverables[${index}][title]`, deliverable.title);
          if (deliverable.description) {
            submitData.append(`deliverables[${index}][description]`, deliverable.description);
          }
          if (deliverable.due_date) {
            submitData.append(`deliverables[${index}][due_date]`, deliverable.due_date);
          }
          if (deliverable.amount) {
            submitData.append(`deliverables[${index}][amount]`, deliverable.amount);
          }
          if (deliverable.priority) {
            submitData.append(`deliverables[${index}][priority]`, deliverable.priority);
          }
          if (deliverable.owner) {
            submitData.append(`deliverables[${index}][owner]`, deliverable.owner);
          }
          if (deliverable.owner_type) {
            submitData.append(`deliverables[${index}][owner_type]`, deliverable.owner_type);
          }
        }
      });
    }

    createMutation.mutate(submitData);
  };

  const handleClose = () => {
    setFormData({
      quotation_id: quotationId?.toString() || '',
      vendor_id: '',
      event_id: '',
      total_amount: '',
      currency: 'ETB',
      start_date: '',
      end_date: '',
      terms_conditions: '',
    });
    setContractFile(null);
    setDeliverables([]);
    onClose();
  };

  const addDeliverable = () => {
    setDeliverables([...deliverables, {
      title: '',
      description: '',
      due_date: '',
      amount: '',
      priority: '1',
      owner: '',
      owner_type: 'vendor',
    }]);
  };

  const removeDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const updateDeliverable = (index: number, field: keyof Deliverable, value: string) => {
    const updated = [...deliverables];
    updated[index] = { ...updated[index], [field]: value };
    setDeliverables(updated);
  };

  // Auto-fill from quotation if selected
  React.useEffect(() => {
    if (selectedQuotation) {
      setFormData(prev => ({
        ...prev,
        vendor_id: selectedQuotation.vendor_id?.toString() || '',
        event_id: selectedQuotation.event_id?.toString() || '',
        total_amount: selectedQuotation.amount?.toString() || '',
      }));
    }
  }, [selectedQuotation]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Contract</DialogTitle>
          <DialogDescription>
            Generate a new contract from an approved quotation
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!quotationId && (
            <div className="space-y-2">
              <Label htmlFor="quotation_id">Quotation *</Label>
              <Select
                value={formData.quotation_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, quotation_id: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an approved quotation" />
                </SelectTrigger>
                <SelectContent>
                  {quotationList.map((quotation: any) => (
                    <SelectItem key={quotation.id} value={quotation.id.toString()}>
                      {quotation.quotation_number} - {quotation.vendor?.name} - {Number(quotation.amount).toLocaleString()} ETB
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_amount">Total Amount (ETB) *</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, total_amount: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                maxLength={3}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                min={formData.start_date || undefined}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms_conditions">Terms & Conditions</Label>
            <Textarea
              id="terms_conditions"
              value={formData.terms_conditions}
              onChange={(e) => setFormData(prev => ({ ...prev, terms_conditions: e.target.value }))}
              placeholder="Contract terms and conditions..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract_file">Contract Document (Optional)</Label>
            <div className="flex items-center gap-4">
              <Label htmlFor="contract_file" className="cursor-pointer">
                <Button type="button" variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Contract
                  </span>
                </Button>
              </Label>
              <Input
                id="contract_file"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              {contractFile && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  <span>{contractFile.name}</span>
                  <span className="text-muted-foreground">
                    ({(contractFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload PDF, DOC, or DOCX files (max 10MB)
            </p>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Deliverables</Label>
                <p className="text-sm text-muted-foreground">
                  Add deliverables to track vendor work
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addDeliverable}>
                <Plus className="h-4 w-4 mr-2" />
                Add Deliverable
              </Button>
            </div>

            {deliverables.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No deliverables added. Click "Add Deliverable" to add one.
              </p>
            ) : (
              <div className="space-y-4">
                {deliverables.map((deliverable, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Deliverable {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDeliverable(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input
                          value={deliverable.title}
                          onChange={(e) => updateDeliverable(index, 'title', e.target.value)}
                          placeholder="Deliverable title"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={deliverable.due_date}
                          onChange={(e) => updateDeliverable(index, 'due_date', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={deliverable.description}
                        onChange={(e) => updateDeliverable(index, 'description', e.target.value)}
                        placeholder="Deliverable description"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Amount (ETB)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={deliverable.amount}
                          onChange={(e) => updateDeliverable(index, 'amount', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select
                          value={deliverable.priority}
                          onValueChange={(value) => updateDeliverable(index, 'priority', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Low</SelectItem>
                            <SelectItem value="2">Medium</SelectItem>
                            <SelectItem value="3">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Owner Type</Label>
                        <Select
                          value={deliverable.owner_type}
                          onValueChange={(value) => updateDeliverable(index, 'owner_type', value as 'vendor' | 'organizer')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vendor">Vendor</SelectItem>
                            <SelectItem value="organizer">Organizer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Owner Name</Label>
                      <Input
                        value={deliverable.owner}
                        onChange={(e) => updateDeliverable(index, 'owner', e.target.value)}
                        placeholder="Owner name (optional)"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Contract
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
