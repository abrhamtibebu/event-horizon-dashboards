import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { createTicketType, updateTicketType } from '@/lib/api/tickets';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import type { TicketType } from '@/types';
import { useState } from 'react';

const ticketTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  quantity: z.coerce.number().min(1).optional().nullable(),
  unlimited: z.boolean().default(false),
  sales_end_date: z.string().optional(),
  is_active: z.boolean().default(true),
  min_group_size: z.coerce.number().min(1).optional().nullable(),
  max_group_size: z.coerce.number().min(1).optional().nullable(),
  benefits: z.array(z.string()).optional(),
});

type TicketTypeFormData = z.infer<typeof ticketTypeSchema>;

interface TicketFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId: number | null;
  ticketType?: TicketType | null;
}

export function TicketFormModal({
  open,
  onClose,
  onSuccess,
  eventId,
  ticketType,
}: TicketFormModalProps) {
  const [benefitInput, setBenefitInput] = useState('');
  const isEditing = !!ticketType;

  const form = useForm<TicketTypeFormData>({
    resolver: zodResolver(ticketTypeSchema),
    defaultValues: {
      name: ticketType?.name || '',
      description: ticketType?.description || '',
      price: ticketType?.price || 0,
      quantity: ticketType?.quantity || null,
      unlimited: !ticketType?.quantity,
      sales_end_date: ticketType?.sales_end_date || '',
      is_active: ticketType?.is_active ?? true,
      min_group_size: ticketType?.min_group_size || null,
      max_group_size: ticketType?.max_group_size || null,
      benefits: ticketType?.benefits || [],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createTicketType(eventId!, data),
    onSuccess: () => {
      toast.success('Ticket type created successfully');
      form.reset();
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create ticket type');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateTicketType(ticketType!.id, data),
    onSuccess: () => {
      toast.success('Ticket type updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update ticket type');
    },
  });

  const onSubmit = (data: TicketTypeFormData) => {
    const submitData = {
      ...data,
      quantity: data.unlimited ? null : data.quantity,
    };

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const unlimited = form.watch('unlimited');
  const benefits = form.watch('benefits') || [];

  const addBenefit = () => {
    if (benefitInput.trim()) {
      form.setValue('benefits', [...benefits, benefitInput.trim()]);
      setBenefitInput('');
    }
  };

  const removeBenefit = (index: number) => {
    form.setValue(
      'benefits',
      benefits.filter((_, i) => i !== index)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Ticket Type' : 'Create Ticket Type'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the ticket type details below'
              : 'Create a new ticket type for your event'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., VIP, General Admission, Early Bird" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of what's included"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (ETB) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Unlimited Toggle */}
            <FormField
              control={form.control}
              name="unlimited"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Unlimited Quantity</FormLabel>
                    <FormDescription>
                      Allow unlimited ticket sales
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Quantity (if not unlimited) */}
            {!unlimited && (
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Available *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>Total number of tickets available</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Sales End Date */}
            <FormField
              control={form.control}
              name="sales_end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sales End Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormDescription>When ticket sales should close</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Group Size */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_group_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Group Size</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_group_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Group Size</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <FormLabel>Benefits</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a benefit (e.g., Priority entry)"
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                />
                <Button type="button" variant="outline" onClick={addBenefit}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {benefits.length > 0 && (
                <div className="space-y-2 mt-2">
                  {benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-sm">• {benefit}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBenefit(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Status */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Make this ticket type available for purchase
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>{isEditing ? 'Update' : 'Create'} Ticket Type</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

