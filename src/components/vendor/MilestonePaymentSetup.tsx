import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import vendorMilestoneApi from '@/lib/vendorMilestoneApi';
import vendorContractApi from '@/lib/vendorContractApi';
import { Card, CardContent } from '@/components/ui/card';
import MilestoneProgressBar from './MilestoneProgressBar';

interface MilestonePaymentSetupProps {
  contractId: number;
  onClose: () => void;
}

interface MilestoneFormData {
  id?: number; // For existing milestones
  milestone_name: string;
  trigger_event: string;
  trigger_date?: string;
  percentage: number;
  amount: number;
  description?: string;
  status?: string;
}

export default function MilestonePaymentSetup({ contractId, onClose }: MilestonePaymentSetupProps) {
  const [milestones, setMilestones] = useState<MilestoneFormData[]>([]);
  const queryClient = useQueryClient();

  const { data: contract } = useQuery({
    queryKey: ['vendor-contract', contractId],
    queryFn: () => vendorContractApi.getContract(contractId),
  });

  const { data: existingMilestones, isLoading: isLoadingMilestones } = useQuery({
    queryKey: ['payment-milestones', contractId],
    queryFn: () => vendorMilestoneApi.getMilestones(contractId),
  });

  const contractData = contract?.success ? contract.data : null;
  const milestonesList = existingMilestones?.success ? existingMilestones.data : [];

  // Load existing milestones into form when they're fetched
  useEffect(() => {
    if (milestonesList.length > 0 && milestones.length === 0) {
      const loadedMilestones: MilestoneFormData[] = milestonesList.map((m: any) => ({
        id: m.id,
        milestone_name: m.milestone_name || '',
        trigger_event: m.trigger_event || 'manual',
        trigger_date: m.trigger_date || '',
        percentage: Number(m.percentage || 0),
        amount: Number(m.amount || 0),
        description: m.description || '',
        status: m.status,
      }));
      setMilestones(loadedMilestones);
    }
  }, [milestonesList, milestones.length]);

  const addMilestone = () => {
    setMilestones([...milestones, {
      milestone_name: '',
      trigger_event: 'manual',
      percentage: 0,
      amount: 0,
    }]);
  };

  const updateMilestone = (index: number, field: string, value: any) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'percentage' && contractData) {
      updated[index].amount = (contractData.total_amount * value) / 100;
    }
    setMilestones(updated);
  };

  const removeMilestone = (index: number) => {
    const milestone = milestones[index];
    if (milestone.id) {
      // Delete existing milestone from backend
      deleteMilestoneMutation.mutate({ contractId, milestoneId: milestone.id, index });
    } else {
      // Remove from local state if not saved yet
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const deleteMilestoneMutation = useMutation({
    mutationFn: ({ contractId, milestoneId }: { contractId: number; milestoneId: number; index: number }) =>
      vendorMilestoneApi.deleteMilestone(contractId, milestoneId),
    onSuccess: (_, variables) => {
      setMilestones(milestones.filter((_, i) => i !== variables.index));
      queryClient.invalidateQueries({ queryKey: ['payment-milestones'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-milestones'] });
      toast.success('Milestone deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete milestone');
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Separate new and existing milestones
      const newMilestones = milestones.filter(m => !m.id);
      const existingMilestonesToUpdate = milestones.filter(m => m.id);

      // Update existing milestones
      const updatePromises = existingMilestonesToUpdate.map(milestone =>
        vendorMilestoneApi.updateMilestone(contractId, milestone.id!, {
          milestone_name: milestone.milestone_name,
          description: milestone.description,
          trigger_event: milestone.trigger_event,
          trigger_date: milestone.trigger_date,
          percentage: milestone.percentage,
          amount: milestone.amount,
        })
      );

      await Promise.all(updatePromises);

      // Create new milestones if any
      if (newMilestones.length > 0) {
        await vendorMilestoneApi.bulkCreateMilestones(
          contractId,
          newMilestones.map(m => ({
            milestone_name: m.milestone_name,
            description: m.description,
            trigger_event: m.trigger_event,
            trigger_date: m.trigger_date,
            percentage: m.percentage,
            amount: m.amount,
          }))
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-milestones'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-milestones'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-contracts'] });
      toast.success('Milestones saved successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to save milestones');
    },
  });

  const totalPercentage = milestones.reduce((sum, m) => sum + m.percentage, 0);

  return (
    <Dialog open={!!contractId} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Milestones</DialogTitle>
          <DialogDescription>
            Setup payment milestones for contract {contractData?.contract_number}
          </DialogDescription>
        </DialogHeader>

        {milestonesList.length > 0 && contractData && (
          <div className="mb-6">
            <MilestoneProgressBar
              milestones={milestonesList}
              totalAmount={contractData.total_amount}
            />
          </div>
        )}

        {isLoadingMilestones ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <Card key={milestone.id || index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {milestone.id && (
                        <span className="text-xs px-2 py-1 bg-muted rounded">
                          Existing
                        </span>
                      )}
                      {milestone.status && (
                        <span className="text-xs px-2 py-1 bg-secondary rounded capitalize">
                          {milestone.status}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMilestone(index)}
                      disabled={deleteMilestoneMutation.isPending}
                    >
                      {deleteMilestoneMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Milestone Name *</Label>
                      <Input
                        value={milestone.milestone_name}
                        onChange={(e) => updateMilestone(index, 'milestone_name', e.target.value)}
                        placeholder="e.g., Advance Payment"
                        disabled={milestone.status === 'paid'} // Don't allow editing paid milestones
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Trigger Event *</Label>
                      <Select
                        value={milestone.trigger_event}
                        onValueChange={(v) => updateMilestone(index, 'trigger_event', v)}
                        disabled={milestone.status === 'paid'}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contract_signing">Contract Signing</SelectItem>
                          <SelectItem value="deliverable_completion">Deliverable Completion</SelectItem>
                          <SelectItem value="date">Specific Date</SelectItem>
                          <SelectItem value="percentage_completion">Percentage Completion</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {milestone.trigger_event === 'date' && (
                      <div className="space-y-2">
                        <Label>Trigger Date</Label>
                        <Input
                          type="date"
                          value={milestone.trigger_date || ''}
                          onChange={(e) => updateMilestone(index, 'trigger_date', e.target.value)}
                          disabled={milestone.status === 'paid'}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Percentage *</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={milestone.percentage}
                        onChange={(e) => updateMilestone(index, 'percentage', Number(e.target.value))}
                        disabled={milestone.status === 'paid'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Amount ({contractData?.currency || 'ETB'})</Label>
                      <Input
                        type="number"
                        value={Number(milestone.amount || 0).toFixed(2)}
                        disabled
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={milestone.description || ''}
                        onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                        placeholder="Optional description..."
                        disabled={milestone.status === 'paid'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total: {totalPercentage}%
                </p>
                {totalPercentage !== 100 && (
                  <p className="text-xs text-destructive">
                    Total must equal 100%
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={addMilestone}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={totalPercentage !== 100 || milestones.length === 0 || saveMutation.isPending}
                >
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {milestonesList.length > 0 ? 'Update Milestones' : 'Save Milestones'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

