import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Upload, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import vendorApi from '@/lib/vendorApi';

interface DeliverableUpdateModalProps {
  deliverableId: number;
  onClose: () => void;
}

export default function DeliverableUpdateModal({ deliverableId, onClose }: DeliverableUpdateModalProps) {
  const [status, setStatus] = useState('in_progress');
  const [notes, setNotes] = useState('');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return vendorApi.addDeliverableUpdate(deliverableId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliverables'] });
      toast.success('Deliverable update added successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update deliverable');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProofFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setProofFiles(proofFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('status', status);
    formData.append('notes', notes);
    formData.append('completion_percentage', completionPercentage.toString());
    proofFiles.forEach((file) => {
      formData.append('proof_files[]', file);
    });

    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={!!deliverableId} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Deliverable</DialogTitle>
          <DialogDescription>
            Update the status and add proof of work for this deliverable
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Status *</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Completion Percentage</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={completionPercentage}
              onChange={(e) => setCompletionPercentage(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add update notes..."
            />
          </div>

          <div className="space-y-2">
            <Label>Proof Files</Label>
            <div className="border-2 border-dashed rounded-lg p-4">
              <Input
                type="file"
                multiple
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {proofFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {proofFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Deliverable
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


