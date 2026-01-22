import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Calendar,
  DollarSign,
  Target,
  Users,
  Clock,
  Settings,
  Info,
  Sparkles,
  TrendingUp,
  Link2,
  Copy,
  QrCode,
  Share2,
  Globe,
  Smartphone,
  Mail,
  MessageSquare,
  ExternalLink,
  Percent,
  Hash,
} from 'lucide-react';
import { vendorReferralApi, CreateReferralRequest } from '@/lib/vendorReferralApi';
import api from '@/lib/api';

interface CreateReferralCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId?: number;
  onSuccess?: () => void;
}

interface Event {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  event_type: string | { id: number; name: string; description: string; created_at: string; updated_at: string; deleted_at?: string };
  max_guests: number;
}

export function CreateReferralCampaignDialog({
  open,
  onOpenChange,
  vendorId,
  onSuccess,
}: CreateReferralCampaignDialogProps) {
  const [formData, setFormData] = useState({
    vendor_id: vendorId || 0,
    event_id: '',
    campaign_name: '',
    description: '',
    commission_rate: 10,
    commission_amount: 0,
    commission_type: 'percentage' as 'percentage' | 'fixed',
    expires_at: '',
    max_uses: '',
    tracking_params: {
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      utm_term: '',
    },
  });

  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch events for the vendor
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['vendor-events', vendorId],
    queryFn: async () => {
      const response = await api.get('/events');
      return response.data.data || response.data;
    },
    enabled: !!vendorId && open,
  });

  // Create referral mutation
  const createReferralMutation = useMutation({
    mutationFn: (data: CreateReferralRequest) => vendorReferralApi.createReferral(data),
    onSuccess: (newReferral) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-referrals'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-referral-analytics'] });
      
      // Generate the referral link
      const link = vendorReferralApi.generateReferralLink(newReferral.referral_code, newReferral.event_id);
      setGeneratedLink(link);
      
      toast({
        title: "Campaign Created Successfully!",
        description: `Your referral campaign "${newReferral.campaign_name}" has been created.`,
      });
      
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Campaign",
        description: error.response?.data?.message || "Failed to create referral campaign",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('tracking_params.')) {
      const trackingField = field.replace('tracking_params.', '');
      setFormData(prev => ({
        ...prev,
        tracking_params: {
          ...prev.tracking_params,
          [trackingField]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData: CreateReferralRequest = {
        vendor_id: formData.vendor_id,
        event_id: parseInt(formData.event_id),
        campaign_name: formData.campaign_name,
        description: formData.description,
        commission_rate: formData.commission_rate,
        commission_type: formData.commission_type,
        expires_at: formData.expires_at || undefined,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : undefined,
        tracking_params: Object.values(formData.tracking_params).some(v => v) ? formData.tracking_params : undefined,
      };

      if (formData.commission_type === 'fixed') {
        submitData.commission_amount = formData.commission_amount;
      }

      await createReferralMutation.mutateAsync(submitData);
    } catch (error) {
      console.error('Error creating referral:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await vendorReferralApi.copyToClipboard(text);
      toast({
        title: "Copied to Clipboard",
        description: "Referral link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const selectedEvent = eventsData?.find((event: Event) => event.id === parseInt(formData.event_id));

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        vendor_id: vendorId || 0,
        event_id: '',
        campaign_name: '',
        description: '',
        commission_rate: 10,
        commission_amount: 0,
        commission_type: 'percentage',
        expires_at: '',
        max_uses: '',
        tracking_params: {
          utm_source: '',
          utm_medium: '',
          utm_campaign: '',
          utm_content: '',
          utm_term: '',
        },
      });
      setGeneratedLink('');
      setIsAdvancedMode(false);
    }
  }, [open, vendorId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/20 rounded-xl flex items-center justify-center border-2 border-purple-200 dark:border-purple-800">
              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            Create Referral Campaign
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            Set up a new referral campaign to track and reward vendor referrals for event registrations.
          </DialogDescription>
        </DialogHeader>

        {generatedLink ? (
          /* Success State */
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Campaign Created Successfully!
                </CardTitle>
                <CardDescription className="text-green-700">
                  Your referral campaign is now active and ready to use.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-gray-700">Referral Link</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedLink)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border font-mono text-sm break-all">
                    {generatedLink}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => window.open(generatedLink, '_blank')}
                    className="flex items-center justify-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Test Link
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Generate QR code or share functionality
                      toast({
                        title: "Share Options",
                        description: "Share options will be available soon.",
                      });
                    }}
                    className="flex items-center justify-center"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Campaign
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setGeneratedLink('');
                  onOpenChange(false);
                }}
              >
                Create Another Campaign
              </Button>
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Campaign Information
                </CardTitle>
                <CardDescription>
                  Basic details about your referral campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="campaign_name">Campaign Name *</Label>
                    <Input
                      id="campaign_name"
                      value={formData.campaign_name}
                      onChange={(e) => handleInputChange('campaign_name', e.target.value)}
                      placeholder="e.g., Summer Event 2025"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="event_id">Event *</Label>
                    <Select
                      value={formData.event_id}
                      onValueChange={(value) => handleInputChange('event_id', value)}
                      disabled={eventsLoading}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventsData?.filter((event: Event) => event.name && event.name.trim() !== '').map((event: Event) => (
                          <SelectItem key={event.id} value={String(event.id)}>
                            <div className="flex flex-col">
                              <span className="font-medium">{event.name}</span>
                              <span className="text-sm text-gray-500">
                                {new Date(event.start_date).toLocaleDateString()}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your referral campaign..."
                    rows={3}
                  />
                </div>

                {selectedEvent && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Selected Event</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700 font-medium">Event:</span>
                        <span className="text-blue-600 ml-2">{selectedEvent.name || 'Unknown Event'}</span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Type:</span>
                        <span className="text-blue-600 ml-2">
                          {typeof selectedEvent.event_type === 'object' 
                            ? selectedEvent.event_type?.name || 'Unknown' 
                            : selectedEvent.event_type || 'Unknown'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Date:</span>
                        <span className="text-blue-600 ml-2">
                          {selectedEvent.start_date ? new Date(selectedEvent.start_date).toLocaleDateString() : 'Unknown Date'}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Max Guests:</span>
                        <span className="text-blue-600 ml-2">{selectedEvent.max_guests || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Commission Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Commission Settings
                </CardTitle>
                <CardDescription>
                  Configure how much commission the vendor will earn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="commission_type">Commission Type *</Label>
                    <Select
                      value={formData.commission_type}
                      onValueChange={(value: 'percentage' | 'fixed') => handleInputChange('commission_type', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">
                          <div className="flex items-center gap-2">
                            <Percent className="w-4 h-4" />
                            Percentage
                          </div>
                        </SelectItem>
                        <SelectItem value="fixed">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            Fixed Amount
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="commission_rate">
                      {formData.commission_type === 'percentage' ? 'Commission Rate (%) *' : 'Commission Amount (ETB) *'}
                    </Label>
                    <Input
                      id="commission_rate"
                      type="number"
                      min="0"
                      max={formData.commission_type === 'percentage' ? 100 : undefined}
                      step={formData.commission_type === 'percentage' ? 0.1 : 1}
                      value={formData.commission_type === 'percentage' ? formData.commission_rate : formData.commission_amount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        if (formData.commission_type === 'percentage') {
                          handleInputChange('commission_rate', value);
                        } else {
                          handleInputChange('commission_amount', value);
                        }
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-900">Commission Preview</span>
                  </div>
                  <div className="text-sm text-green-700">
                    {formData.commission_type === 'percentage' ? (
                      <span>
                        Vendor will earn <strong>{formData.commission_rate}%</strong> of each successful registration
                        {selectedEvent && selectedEvent.max_guests && (
                          <span> (estimated: {new Intl.NumberFormat('en-ET', {
                            style: 'currency',
                            currency: 'ETB',
                            minimumFractionDigits: 0,
                          }).format((selectedEvent.max_guests * 1000 * formData.commission_rate) / 100)} for full event)</span>
                        )}
                      </span>
                    ) : (
                      <span>
                        Vendor will earn <strong>{new Intl.NumberFormat('en-ET', {
                          style: 'currency',
                          currency: 'ETB',
                          minimumFractionDigits: 0,
                        }).format(formData.commission_amount)}</strong> per successful registration
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Campaign Limits
                </CardTitle>
                <CardDescription>
                  Optional limits for your campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max_uses">Maximum Uses</Label>
                    <Input
                      id="max_uses"
                      type="number"
                      min="1"
                      value={formData.max_uses}
                      onChange={(e) => handleInputChange('max_uses', e.target.value)}
                      placeholder="Leave empty for unlimited"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum number of times this referral can be used
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="expires_at">Expiration Date</Label>
                    <Input
                      id="expires_at"
                      type="datetime-local"
                      value={formData.expires_at}
                      onChange={(e) => handleInputChange('expires_at', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Campaign will automatically expire after this date
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Advanced Settings
                    </CardTitle>
                    <CardDescription>
                      UTM parameters and tracking options
                    </CardDescription>
                  </div>
                  <Switch
                    checked={isAdvancedMode}
                    onCheckedChange={setIsAdvancedMode}
                  />
                </div>
              </CardHeader>
              
              {isAdvancedMode && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="utm_source">UTM Source</Label>
                      <Input
                        id="utm_source"
                        value={formData.tracking_params.utm_source}
                        onChange={(e) => handleInputChange('tracking_params.utm_source', e.target.value)}
                        placeholder="e.g., email, social, website"
                      />
                    </div>
                    <div>
                      <Label htmlFor="utm_medium">UTM Medium</Label>
                      <Input
                        id="utm_medium"
                        value={formData.tracking_params.utm_medium}
                        onChange={(e) => handleInputChange('tracking_params.utm_medium', e.target.value)}
                        placeholder="e.g., newsletter, facebook, banner"
                      />
                    </div>
                    <div>
                      <Label htmlFor="utm_campaign">UTM Campaign</Label>
                      <Input
                        id="utm_campaign"
                        value={formData.tracking_params.utm_campaign}
                        onChange={(e) => handleInputChange('tracking_params.utm_campaign', e.target.value)}
                        placeholder="e.g., summer2025, launch"
                      />
                    </div>
                    <div>
                      <Label htmlFor="utm_content">UTM Content</Label>
                      <Input
                        id="utm_content"
                        value={formData.tracking_params.utm_content}
                        onChange={(e) => handleInputChange('tracking_params.utm_content', e.target.value)}
                        placeholder="e.g., header, sidebar, footer"
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Form Actions */}
            <DialogFooter className="flex-col sm:flex-row gap-3 pt-6 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.campaign_name || !formData.event_id}
                className="w-full sm:w-auto order-1 sm:order-2 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Campaign...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
