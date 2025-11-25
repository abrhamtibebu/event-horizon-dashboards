import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createDeliverable } from '@/lib/api';
import vendorApi from '@/lib/vendorApi';

interface CreateDeliverableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contractId?: number;
  requirementId?: number;
}

export default function CreateDeliverableDialog({ isOpen, onClose, contractId, requirementId }: CreateDeliverableDialogProps) {
  const [formData, setFormData] = useState({
    contract_id: contractId?.toString() || '',
    requirement_id: requirementId?.toString() || '',
    vendor_id: '',
    event_id: '',
    title: '',
    description: '',
    due_date: '',
    amount: '',
    priority: '1',
    owner: '',
    owner_type: 'vendor',
  });
  const queryClient = useQueryClient();

  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorApi.getVendors(),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createDeliverable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliverables'] });
      toast.success('Deliverable created successfully!');
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create deliverable');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vendor_id || !formData.event_id || !formData.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    createMutation.mutate({
      ...formData,
      contract_id: formData.contract_id ? Number(formData.contract_id) : null,
      requirement_id: formData.requirement_id ? Number(formData.requirement_id) : null,
      vendor_id: Number(formData.vendor_id),
      event_id: Number(formData.event_id),
      amount: formData.amount ? Number(formData.amount) : null,
      priority: Number(formData.priority),
    });
  };

  const handleClose = () => {
    setFormData({
      contract_id: contractId?.toString() || '',
      requirement_id: requirementId?.toString() || '',
      vendor_id: '',
      event_id: '',
      title: '',
      description: '',
      due_date: '',
      amount: '',
      priority: '1',
      owner: '',
      owner_type: 'vendor',
    });
    onClose();
  };

  const vendorList = Array.isArray(vendors) ? vendors : [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Deliverable</DialogTitle>
          <DialogDescription>
            Add a new deliverable to track vendor work
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor_id">Vendor *</Label>
              <Select
                value={formData.vendor_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, vendor_id: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendorList.map((vendor: any) => (
                    <SelectItem key={vendor.id} value={vendor.id.toString()}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_id">Event *</Label>
              <Input
                id="event_id"
                type="number"
                value={formData.event_id}
                onChange={(e) => setFormData(prev => ({ ...prev, event_id: e.target.value }))}
                placeholder="Event ID"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Stage Setup"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the deliverable..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (ETB)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_type">Owner Type</Label>
              <Select
                value={formData.owner_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, owner_type: value }))}
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
            <Label htmlFor="owner">Owner Name</Label>
            <Input
              id="owner"
              value={formData.owner}
              onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
              placeholder="Name of the person responsible"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Deliverable
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


