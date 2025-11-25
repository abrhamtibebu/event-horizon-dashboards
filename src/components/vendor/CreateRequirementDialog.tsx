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
import vendorRequirementApi from '@/lib/vendorRequirementApi';
import vendorApi from '@/lib/vendorApi';
import { usePermissionCheck } from '@/hooks/use-permission-check';

interface CreateRequirementDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateRequirementDialog({ isOpen, onClose }: CreateRequirementDialogProps) {
  const [formData, setFormData] = useState({
    event_id: '',
    title: '',
    description: '',
    budget_min: '',
    budget_max: '',
    deadline: '',
    service_categories: [] as string[],
    special_requirements: '',
  });
  const queryClient = useQueryClient();
  const { checkPermission } = usePermissionCheck();

  const { data: events } = useQuery({
    queryKey: ['organizer-events'],
    queryFn: () => vendorApi.getOrganizerEvents(),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => vendorRequirementApi.createRequirement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-requirements'] });
      toast.success('Requirement created successfully!');
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create requirement');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check permission before submitting
    if (!checkPermission('vendors.requirements', 'create requirements') && 
        !checkPermission('vendors.rfq.create', 'create RFQs')) {
      return;
    }
    
    if (!formData.event_id || !formData.title || !formData.deadline) {
      toast.error('Please fill in all required fields');
      return;
    }

    createMutation.mutate({
      ...formData,
      event_id: Number(formData.event_id),
      budget_min: formData.budget_min ? Number(formData.budget_min) : null,
      budget_max: formData.budget_max ? Number(formData.budget_max) : null,
      status: 'draft',
    });
  };

  const handleClose = () => {
    setFormData({
      event_id: '',
      title: '',
      description: '',
      budget_min: '',
      budget_max: '',
      deadline: '',
      service_categories: [],
      special_requirements: '',
    });
    onClose();
  };

  // Filter and map events to ensure we only show active events with titles
  const eventList = Array.isArray(events) 
    ? events
        .filter((event: any) => event.status === 'active' || !event.status) // Include active events or events without status (assume active)
        .map((event: any) => ({
          id: event.id,
          title: event.title || event.name || 'Untitled Event', // Support both 'title' and 'name' fields
          name: event.name || event.title || 'Untitled Event',
          start_date: event.start_date,
          end_date: event.end_date,
          location: event.location,
        }))
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Vendor Requirement</DialogTitle>
          <DialogDescription>
            Define a new vendor requirement for an event
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event_id">Event *</Label>
            <Select
              value={formData.event_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, event_id: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {eventList.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No active events available
                  </div>
                ) : (
                  eventList.map((event: any) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.title || event.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Stage Lighting & Audio"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the vendor requirement in detail..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget_min">Budget Min (ETB)</Label>
              <Input
                id="budget_min"
                type="number"
                value={formData.budget_min}
                onChange={(e) => setFormData(prev => ({ ...prev, budget_min: e.target.value }))}
                placeholder="75000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_max">Budget Max (ETB)</Label>
              <Input
                id="budget_max"
                type="number"
                value={formData.budget_max}
                onChange={(e) => setFormData(prev => ({ ...prev, budget_max: e.target.value }))}
                placeholder="150000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deliverable Deadline *</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_requirements">Special Requirements</Label>
            <Textarea
              id="special_requirements"
              value={formData.special_requirements}
              onChange={(e) => setFormData(prev => ({ ...prev, special_requirements: e.target.value }))}
              placeholder="Any special requirements or constraints..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Requirement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


