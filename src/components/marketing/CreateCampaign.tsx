import { useState, useEffect } from 'react';
import { X, Mail, MessageSquare, Users, Layout, Calendar, Sparkles, Loader2, AlertCircle } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import api from '@/lib/api';

interface CreateCampaignProps {
  open: boolean;
  onClose: () => void;
}

interface Event {
  id: number;
  title: string;
  start_date: string;
  status: string;
}

interface Template {
  id: number;
  name: string;
  description: string;
  type: string;
  subject: string;
  email_body: string;
  sms_body: string;
}

interface Segment {
  id: number;
  name: string;
  description: string;
  recipient_count: number;
  is_dynamic: boolean;
}

export function CreateCampaign({ open, onClose }: CreateCampaignProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'email' as 'email' | 'sms' | 'both',
    event_id: undefined as string | undefined,
    template_id: undefined as string | undefined,
    segment_id: undefined as string | undefined,
    subject: '',
    email_content: '',
    sms_content: '',
    scheduled_at: '',
    is_automated: false,
  });

  // Options
  const [events, setEvents] = useState<Event[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);

  useEffect(() => {
    if (open) {
      fetchOptions();
    }
  }, [open]);

  const fetchOptions = async () => {
    try {
      setFetchingData(true);
      setFetchError(null);
      
      // Fetch all required data in parallel
      const [eventsRes, templatesRes, segmentsRes] = await Promise.all([
        api.get('/events'),
        api.get('/marketing/templates'),
        api.get('/marketing/segments'),
      ]);
      
      // Handle events data
      const eventsData = eventsRes.data.data || eventsRes.data;
      const processedEvents = Array.isArray(eventsData) 
        ? eventsData.filter((event: any) => event.status === 'active')
        : [];
      setEvents(processedEvents);
      
      // Handle templates data
      const templatesData = templatesRes.data.data || templatesRes.data;
      const processedTemplates = Array.isArray(templatesData) ? templatesData : [];
      setTemplates(processedTemplates);
      
      // Handle segments data
      const segmentsData = segmentsRes.data.data || segmentsRes.data;
      const processedSegments = Array.isArray(segmentsData) ? segmentsData : [];
      setSegments(processedSegments);
      
      console.log('Fetched data:', {
        events: processedEvents.length,
        templates: processedTemplates.length,
        segments: processedSegments.length
      });
      
    } catch (error: any) {
      console.error('Error fetching options:', error);
      setFetchError('Failed to load campaign data. Please try again.');
      toast.error('Failed to load campaign data');
      
      // Set empty arrays on error
      setEvents([]);
      setTemplates([]);
      setSegments([]);
    } finally {
      setFetchingData(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTemplateSelect = async (templateId: string) => {
    handleChange('template_id', templateId === '' ? undefined : templateId);
    
    if (templateId) {
      try {
        const response = await api.get(`/marketing/templates/${templateId}`);
        const template = response.data.template || response.data;
        
        if (template) {
          handleChange('subject', template.subject || '');
          handleChange('email_content', template.email_body || '');
          handleChange('sms_content', template.sms_body || '');
          toast.success('Template loaded successfully');
        }
      } catch (error) {
        console.error('Error loading template:', error);
        toast.error('Failed to load template details');
      }
    }
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.name.trim()) errors.push('Campaign name is required');
    if (!formData.segment_id) errors.push('Audience segment is required');
    if (formData.type !== 'sms' && !formData.subject.trim()) errors.push('Email subject is required');
    if (formData.type !== 'sms' && !formData.email_content.trim()) errors.push('Email content is required');
    if (formData.type !== 'email' && !formData.sms_content.trim()) errors.push('SMS content is required');
    
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        event_id: formData.event_id || null,
        template_id: formData.template_id || null,
        scheduled_at: formData.scheduled_at || null,
      };

      const response = await api.post('/marketing/campaigns', payload);
      
      toast.success('Campaign created successfully!');
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        type: 'email',
        event_id: undefined,
        template_id: undefined,
        segment_id: undefined,
        subject: '',
        email_content: '',
        sms_content: '',
        scheduled_at: '',
        is_automated: false,
      });
      setStep(1);
      setFetchError(null);
      
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to create campaign';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}
      
      <div>
        <Label htmlFor="name">Campaign Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Event Registration Confirmation"
          disabled={fetchingData}
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Brief description of this campaign"
          rows={3}
          disabled={fetchingData}
        />
      </div>

      <div>
        <Label htmlFor="type">Campaign Type *</Label>
        <Select 
          value={formData.type} 
          onValueChange={(value) => handleChange('type', value)}
          disabled={fetchingData}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Only
              </div>
            </SelectItem>
            <SelectItem value="sms">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                SMS Only
              </div>
            </SelectItem>
            <SelectItem value="both">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Email + SMS
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="event">Related Event (Optional)</Label>
        <Select 
          value={formData.event_id || ''} 
          onValueChange={(value) => handleChange('event_id', value === '' ? undefined : value)}
          disabled={fetchingData}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an event (optional)" />
          </SelectTrigger>
          <SelectContent>
            {events.length === 0 ? (
              <SelectItem value="no-events" disabled>
                {fetchingData ? 'Loading events...' : 'No active events found'}
              </SelectItem>
            ) : (
              events.map((event) => (
                <SelectItem key={event.id} value={event.id.toString()}>
                  <div className="flex flex-col">
                    <span>{event.title}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.start_date).toLocaleDateString()}
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="segment">Audience Segment *</Label>
        <Select 
          value={formData.segment_id || ''} 
          onValueChange={(value) => handleChange('segment_id', value === '' ? undefined : value)}
          disabled={fetchingData}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select audience segment" />
          </SelectTrigger>
          <SelectContent>
            {segments.length === 0 ? (
              <SelectItem value="no-segments" disabled>
                {fetchingData ? 'Loading segments...' : 'No segments found. Create a segment first.'}
              </SelectItem>
            ) : (
              segments.map((segment) => (
                <SelectItem key={segment.id} value={segment.id.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span>{segment.name}</span>
                      <span className="text-xs text-gray-500">{segment.description}</span>
                    </div>
                    <span className="text-sm text-gray-500 ml-4">
                      {segment.recipient_count.toLocaleString()} recipients
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="template">Choose Template (Optional)</Label>
        <Select 
          value={formData.template_id || ''} 
          onValueChange={handleTemplateSelect}
          disabled={fetchingData}
        >
          <SelectTrigger>
            <SelectValue placeholder="Start from scratch or select template" />
          </SelectTrigger>
          <SelectContent>
            {templates.length === 0 ? (
              <SelectItem value="no-templates" disabled>
                {fetchingData ? 'Loading templates...' : 'No templates found. Create a template first.'}
              </SelectItem>
            ) : (
              templates.map((template) => (
                <SelectItem key={template.id} value={template.id.toString()}>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Layout className="w-4 h-4" />
                      <span>{template.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 ml-6">{template.description}</span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="email" value={formData.type === 'sms' ? 'sms' : 'email'}>
        <TabsList className="grid w-full grid-cols-2">
          {formData.type !== 'sms' && <TabsTrigger value="email">Email Content</TabsTrigger>}
          {formData.type !== 'email' && <TabsTrigger value="sms">SMS Content</TabsTrigger>}
        </TabsList>

        {formData.type !== 'sms' && (
          <TabsContent value="email" className="space-y-4">
            <div>
              <Label htmlFor="subject">Email Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                placeholder="e.g., You're registered for {{event_name}}!"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use variables: {'{{first_name}}, {{last_name}}, {{event_name}}, {{event_date}}'}
              </p>
            </div>

            <div>
              <Label htmlFor="email_content">Email Body *</Label>
              <Textarea
                id="email_content"
                value={formData.email_content}
                onChange={(e) => handleChange('email_content', e.target.value)}
                placeholder="Dear {{first_name}},&#10;&#10;Thank you for registering for {{event_name}}..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </TabsContent>
        )}

        {formData.type !== 'email' && (
          <TabsContent value="sms" className="space-y-4">
            <div>
              <Label htmlFor="sms_content">SMS Message *</Label>
              <Textarea
                id="sms_content"
                value={formData.sms_content}
                onChange={(e) => handleChange('sms_content', e.target.value)}
                placeholder="Hi {{first_name}}, you're registered for {{event_name}} on {{event_date}}. See you there!"
                rows={5}
                maxLength={320}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.sms_content.length}/320 characters
              </p>
            </div>
          </TabsContent>
        )}
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm mb-2">Available Variables:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <code className="bg-white px-2 py-1 rounded">{'{{first_name}}'}</code>
            <code className="bg-white px-2 py-1 rounded">{'{{last_name}}'}</code>
            <code className="bg-white px-2 py-1 rounded">{'{{email}}'}</code>
            <code className="bg-white px-2 py-1 rounded">{'{{event_name}}'}</code>
            <code className="bg-white px-2 py-1 rounded">{'{{event_date}}'}</code>
            <code className="bg-white px-2 py-1 rounded">{'{{event_location}}'}</code>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="scheduled_at">Schedule Send (Optional)</Label>
        <Input
          id="scheduled_at"
          type="datetime-local"
          value={formData.scheduled_at}
          onChange={(e) => handleChange('scheduled_at', e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">
          Leave empty to send immediately, or select a future date and time
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3">Campaign Summary</h4>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Name:</dt>
              <dd className="font-medium">{formData.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Type:</dt>
              <dd className="font-medium capitalize">{formData.type}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Recipients:</dt>
              <dd className="font-medium">
                {segments.find((s: any) => s.id.toString() === formData.segment_id)?.recipient_count || 0}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Scheduled:</dt>
              <dd className="font-medium">
                {formData.scheduled_at ? new Date(formData.scheduled_at).toLocaleString() : 'Send immediately'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Important:</strong> Once sent, campaigns cannot be edited. Please review all details carefully.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Create Marketing Campaign
          </DialogTitle>
          <DialogDescription>
            Step {step} of 3: {step === 1 ? 'Basic Information' : step === 2 ? 'Content' : 'Review & Schedule'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`h-1 w-24 ${s < step ? 'bg-blue-600' : 'bg-gray-200'}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {step > 1 && (
                <Button 
                  variant="outline" 
                  onClick={() => setStep(step - 1)}
                  disabled={loading || fetchingData}
                >
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              {step < 3 ? (
                <Button 
                  onClick={() => setStep(step + 1)}
                  disabled={fetchingData}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || fetchingData}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Campaign'
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

