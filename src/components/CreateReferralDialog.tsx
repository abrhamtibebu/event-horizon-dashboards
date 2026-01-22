import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { vendorReferralApi, CreateReferralRequest } from '@/lib/vendorReferralApi';

interface CreateReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateReferralDialog({ open, onOpenChange, onSuccess }: CreateReferralDialogProps) {
  const [formData, setFormData] = useState<CreateReferralRequest>({
    vendor_id: 0,
    event_id: 0,
    campaign_name: '',
    description: '',
    commission_rate: 0,
    commission_amount: 0,
    commission_type: 'percentage',
    expires_at: '',
    max_uses: undefined,
    tracking_params: {},
  });

  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  const createReferralMutation = useMutation({
    mutationFn: (data: CreateReferralRequest) => vendorReferralApi.createReferral(data),
    onSuccess: () => {
      onSuccess();
      resetForm();
    },
    onError: (error: any) => {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    },
  });

  const resetForm = () => {
    setFormData({
      vendor_id: 0,
      event_id: 0,
      campaign_name: '',
      description: '',
      commission_rate: 0,
      commission_amount: 0,
      commission_type: 'percentage',
      expires_at: '',
      max_uses: undefined,
      tracking_params: {},
    });
    setExpiryDate(undefined);
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.vendor_id) {
      newErrors.vendor_id = 'Vendor is required';
    }
    if (!formData.event_id) {
      newErrors.event_id = 'Event is required';
    }
    if (!formData.commission_rate && formData.commission_type === 'percentage') {
      newErrors.commission_rate = 'Commission rate is required';
    }
    if (!formData.commission_amount && formData.commission_type === 'fixed') {
      newErrors.commission_amount = 'Commission amount is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const submitData = {
      ...formData,
      expires_at: expiryDate ? expiryDate.toISOString() : undefined,
    };

    createReferralMutation.mutate(submitData);
  };

  const handleInputChange = (field: keyof CreateReferralRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-semibold">Create Vendor Referral Campaign</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            Create a new referral campaign for a vendor to promote an event and earn commissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vendor_id">Vendor ID *</Label>
              <Input
                id="vendor_id"
                type="number"
                value={formData.vendor_id || ''}
                onChange={(e) => handleInputChange('vendor_id', parseInt(e.target.value) || 0)}
                className={cn(errors.vendor_id && 'border-red-500')}
                placeholder="Enter vendor ID"
              />
              {errors.vendor_id && (
                <p className="text-sm text-red-600 mt-1">{errors.vendor_id}</p>
              )}
            </div>

            <div>
              <Label htmlFor="event_id">Event ID *</Label>
              <Input
                id="event_id"
                type="number"
                value={formData.event_id || ''}
                onChange={(e) => handleInputChange('event_id', parseInt(e.target.value) || 0)}
                className={cn(errors.event_id && 'border-red-500')}
                placeholder="Enter event ID"
              />
              {errors.event_id && (
                <p className="text-sm text-red-600 mt-1">{errors.event_id}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="campaign_name">Campaign Name</Label>
            <Input
              id="campaign_name"
              value={formData.campaign_name}
              onChange={(e) => handleInputChange('campaign_name', e.target.value)}
              placeholder="Enter campaign name (optional)"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter campaign description (optional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="commission_type">Commission Type *</Label>
              <Select
                value={formData.commission_type}
                onValueChange={(value: 'percentage' | 'fixed') => handleInputChange('commission_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select commission type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="commission_value">
                {formData.commission_type === 'percentage' ? 'Commission Rate (%) *' : 'Commission Amount (ETB) *'}
              </Label>
              <Input
                id="commission_value"
                type="number"
                step={formData.commission_type === 'percentage' ? '0.01' : '0.01'}
                min="0"
                max={formData.commission_type === 'percentage' ? '100' : undefined}
                value={formData.commission_type === 'percentage' ? formData.commission_rate : formData.commission_amount}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (formData.commission_type === 'percentage') {
                    handleInputChange('commission_rate', value);
                  } else {
                    handleInputChange('commission_amount', value);
                  }
                }}
                className={cn(
                  (errors.commission_rate || errors.commission_amount) && 'border-red-500'
                )}
                placeholder={formData.commission_type === 'percentage' ? 'e.g., 5.0' : 'e.g., 100.00'}
              />
              {(errors.commission_rate || errors.commission_amount) && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.commission_rate || errors.commission_amount}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expires_at">Expiry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !expiryDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, 'PPP') : 'Select expiry date (optional)'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="max_uses">Maximum Uses</Label>
              <Input
                id="max_uses"
                type="number"
                min="1"
                value={formData.max_uses || ''}
                onChange={(e) => handleInputChange('max_uses', parseInt(e.target.value) || undefined)}
                placeholder="Leave empty for unlimited"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-6 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createReferralMutation.isPending}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createReferralMutation.isPending}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {createReferralMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Referral
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


