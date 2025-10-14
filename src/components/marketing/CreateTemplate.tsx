import { useState } from 'react';
import { X, Layout, Mail, MessageSquare, Sparkles, Save, Eye, Code, Copy, Monitor } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import api from '@/lib/api';

interface CreateTemplateProps {
  open: boolean;
  onClose: () => void;
}

export function CreateTemplate({ open, onClose }: CreateTemplateProps) {
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    type: 'email' as 'email' | 'sms' | 'both',
    subject: '',
    email_body: '',
    sms_body: '',
    html_body: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    return matches ? [...new Set(matches.map(match => match.slice(2, -2)))] : [];
  };

  const getAvailableVariables = (): string[] => {
    const emailVars = extractVariables(formData.email_body);
    const htmlVars = extractVariables(formData.html_body);
    const smsVars = extractVariables(formData.sms_body);
    return [...new Set([...emailVars, ...htmlVars, ...smsVars])];
  };

  const copyHtmlCode = async () => {
    try {
      await navigator.clipboard.writeText(formData.html_body);
      toast.success('HTML code copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy HTML code:', error);
      toast.error('Failed to copy HTML code');
    }
  };

  const generateSampleHtmlTemplate = () => {
    const sampleHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Registration Confirmation</title>
  <style>
    /* General resets */
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    body { margin:0; padding:0; width:100% !important; font-family: Arial, Helvetica, sans-serif; background-color:#f3f4f6; color:#111827; }

    /* Container */
    .email-wrapper { width:100%; background-color:#f3f4f6; padding:24px 12px; }
    .email-content { max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 30px rgba(17,24,39,0.06); }

    /* Header */
    .email-header { padding:22px 28px; background: linear-gradient(90deg,#f59e0b 0%, #fbbf24 100%); color:#fff; }
    .brand { font-weight:700; font-size:20px; letter-spacing:0.2px; }
    .preheader { font-size:12px; opacity:0.95; margin-top:6px; }

    /* Body */
    .email-body { padding:28px; }
    .greeting { font-size:20px; margin:0 0 8px 0; }
    .lead { margin:0 0 18px 0; color:#374151; font-size:15px; line-height:1.5; }

    /* eBadge card */
    .ebadge-card { display:flex; gap:16px; align-items:center; padding:14px; border-radius:10px; background:#f8fafc; border:1px solid #eef2f7; }
    .ebadge-img { width:92px; height:92px; object-fit:cover; border-radius:8px; background:#e6eef2; display:block; }
    .ebadge-info { font-size:14px; color:#0f172a; }
    .ebadge-info .name { font-weight:700; font-size:16px; margin-bottom:4px; }
    .ebadge-info .meta { color:#475569; font-size:13px; }

    /* Details table */
    .details { width:100%; border-collapse:collapse; margin-top:18px; }
    .details td { padding:10px 0; border-bottom:1px dashed #eef2f7; font-size:14px; color:#334155; }
    .label { width:38%; color:#6b7280; font-weight:600; padding-right:12px; }

    /* Buttons */
    .btn { display:inline-block; text-decoration:none; padding:12px 18px; border-radius:8px; font-weight:700; font-size:14px; }
    .btn-primary { background-color:#f59e0b; color:#fff; }
    .btn-outline { border:1px solid #e6eef2; color:#0f172a; background:#fff; }

    /* Footer */
    .email-footer { font-size:12px; color:#6b7280; padding:20px 28px; text-align:center; border-top:1px solid #f1f5f9; }
    .small { font-size:12px; color:#94a3b8; }

    /* Responsive */
    @media screen and (max-width:420px){
      .email-body { padding:18px; }
      .ebadge-card { flex-direction:row; gap:12px; }
      .label { display:block; width:100%; padding-right:0; }
    }
  </style>
</head>
<body>
  <center class="email-wrapper">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center">
          <!-- Content container -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="email-content" width="100%">
            <!-- Header -->
            <tr>
              <td class="email-header" style="padding:22px 28px;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                  <div style="display:flex;gap:12px;align-items:center;">
                    <img src="{{brand_logo_url}}" alt="{{brand_name}}" width="40" style="display:block;border-radius:6px;">
                    <div class="brand" style="color:#fff;">{{brand_name}}</div>
                  </div>
                </div>
                <div class="preheader" style="color:rgba(255,255,255,0.9)">{{event_name}} — Registration Confirmed</div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td class="email-body" style="padding:28px;">
                <h1 class="greeting" style="margin:0 0 6px 0;">Hi {{guest_name}},</h1>
                <p class="lead" style="margin:0 0 18px 0;">
                  Your registration for <strong>{{event_name}}</strong> on <strong>{{event_date}}</strong> is confirmed. Below are your details and your unique eBadge — please save or print this confirmation.
                </p>

                <!-- eBadge + quick actions -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                  <tr>
                    <td>
                      <div class="ebadge-card" style="display:flex;align-items:center;">
                        <img src="{{ebadge_url}}" alt="eBadge" class="ebadge-img" style="width:92px;height:92px;border-radius:8px;">
                        <div class="ebadge-info">
                          <div class="name">{{guest_name}}</div>
                          <div class="meta">Registration: <strong>#{{registration_id}}</strong></div>
                          <div class="meta" style="margin-top:6px;">Ticket type: <strong>{{ticket_type}}</strong></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Details -->
                <table class="details" role="presentation">
                  <tr>
                    <td class="label">Event</td>
                    <td>{{event_name}}</td>
                  </tr>
                  <tr>
                    <td class="label">Date & Time</td>
                    <td>{{event_date}} · {{event_time}} ({{event_timezone}})</td>
                  </tr>
                  <tr>
                    <td class="label">Location</td>
                    <td>{{venue_name}} — {{venue_address}}</td>
                  </tr>
                  <tr>
                    <td class="label">Attendee</td>
                    <td>{{guest_name}} • {{guest_email}}</td>
                  </tr>
                  <tr>
                    <td class="label">Phone</td>
                    <td>{{guest_phone}}</td>
                  </tr>
                  <tr>
                    <td class="label">Notes</td>
                    <td style="color:#475569;">{{additional_notes}}</td>
                  </tr>
                </table>

                <!-- Action buttons -->
                <table role="presentation" width="100%" style="margin-top:18px;">
                  <tr>
                    <td align="left" style="padding-top:8px;">
                      <a href="{{pdf_url}}" class="btn btn-primary" style="background-color:#f59e0b;color:#fff;border-radius:8px;padding:12px 18px;display:inline-block;">
                        Download Confirmation (PDF)
                      </a>
                      &nbsp;
                      <a href="{{view_event_url}}" class="btn btn-outline" style="border:1px solid #e6eef2;color:#0f172a;background:#fff;border-radius:8px;padding:12px 18px;display:inline-block;">
                        View Event
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td align="left" style="padding-top:12px;">
                      <a href="{{add_to_calendar_url}}" style="font-size:13px;color:#f59e0b;text-decoration:none;font-weight:600;">+ Add to calendar</a>
                    </td>
                  </tr>
                </table>

                <!-- Helpful reminder -->
                <p style="margin:22px 0 0 0;color:#475569;font-size:13px;">
                  Please bring a copy of this confirmation (digital or printed) to the event entry desk. If you have any questions, reply to this email or contact <a href="mailto:{{support_email}}" style="color:#f59e0b;text-decoration:none;">{{support_email}}</a>.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td class="email-footer" style="padding:20px 28px;">
                <div style="margin-bottom:8px;">
                  <strong>{{brand_name}}</strong> — {{brand_tagline}}
                </div>
                <div class="small" style="margin-bottom:10px;">
                  {{brand_address}} · <a href="{{unsubscribe_url}}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
                </div>
                <div class="small">
                  © {{year}} {{brand_name}}. All rights reserved.
                </div>
              </td>
            </tr>

          </table>
          <!-- End content container -->
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
        
        setFormData(prev => ({ ...prev, html_body: sampleHtml }));
        toast.success('Professional HTML template loaded!');
      };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.name.trim()) errors.push('Template name is required');
    if (!formData.category.trim()) errors.push('Category is required');
    if (formData.type !== 'sms' && !formData.subject.trim()) errors.push('Email subject is required');
    if (formData.type !== 'sms' && !formData.email_body.trim() && !formData.html_body.trim()) {
      errors.push('Email content or HTML content is required');
    }
    if (formData.type !== 'email' && !formData.sms_body.trim()) errors.push('SMS content is required');
    
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
        available_variables: getAvailableVariables(),
      };

      console.log('Sending template data:', JSON.stringify(payload, null, 2));
      
      // Test database connection first
      try {
        const dbTest = await api.get('/marketing/test/db');
        console.log('Database test:', dbTest.data);
      } catch (dbError) {
        console.error('Database test error:', dbError);
      }
      
      const response = await api.post('/marketing/templates', payload);
      
      toast.success('Template created successfully!');
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'general',
        type: 'email',
        subject: '',
        email_body: '',
        sms_body: '',
        html_body: '',
      });
      setPreviewMode(false);
      setActiveTab('text');
      
    } catch (error: any) {
      console.error('Error creating template:', error);
      
      // Handle validation errors
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat();
        toast.error(`Validation failed: ${errorMessages.join(', ')}`);
      } else {
        const errorMessage = error.response?.data?.error || 
                            error.response?.data?.message || 
                            'Failed to create template';
        console.error('Full error response:', error.response?.data);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    if (!validateForm()) return;
    setPreviewMode(true);
  };

  const renderPreview = () => {
    const sampleData = {
      guest_name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      guest_email: 'john.doe@example.com',
      guest_phone: '+1 (555) 123-4567',
      event_name: 'Tech Conference 2024',
      event_date: 'March 15, 2024',
      event_time: '9:00 AM',
      event_timezone: 'EST',
      event_location: 'Convention Center',
      venue_name: 'Grand Convention Center',
      venue_address: '123 Main Street, New York, NY 10001',
      company: 'Acme Corp',
      job_title: 'Software Engineer',
      registration_id: 'REG-2024-001234',
      ticket_type: 'VIP Pass',
      brand_name: 'Evella',
      brand_logo_url: 'https://via.placeholder.com/40x40/f59e0b/ffffff?text=E',
      brand_tagline: 'Connecting People Through Events',
      brand_address: '123 Event Street, Event City, EC 12345',
      ebadge_url: 'https://via.placeholder.com/92x92/f59e0b/ffffff?text=EB',
      pdf_url: '#',
      view_event_url: '#',
      add_to_calendar_url: '#',
      support_email: 'support@evella.com',
      unsubscribe_url: '#',
      additional_notes: 'Please arrive 15 minutes early for check-in.',
      year: new Date().getFullYear(),
    };

    const replaceVariables = (text: string) => {
      let result = text;
      Object.entries(sampleData).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
      return result;
    };

    return (
      <div className="space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between sticky top-0 bg-white pb-2 border-b">
          <h3 className="text-lg font-semibold">Template Preview</h3>
          <Button variant="outline" onClick={() => setPreviewMode(false)}>
            <X className="w-4 h-4 mr-2" />
            Close Preview
          </Button>
        </div>

        {formData.type !== 'sms' && (
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="font-medium text-sm text-gray-600">Subject: {replaceVariables(formData.subject)}</div>
                
                {formData.html_body ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium">HTML Rendering:</span>
                    </div>
                    <div className="border rounded-lg overflow-hidden bg-white">
                      <iframe
                        srcDoc={replaceVariables(formData.html_body)}
                        className="w-full h-[600px] border-0"
                        title="HTML Email Preview"
                        style={{ minHeight: '600px' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <pre className="whitespace-pre-wrap text-sm">
                      {replaceVariables(formData.email_body)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {formData.type !== 'email' && (
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">SMS Preview</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border rounded-lg p-4 bg-gray-50">
                <pre className="whitespace-pre-wrap text-sm">
                  {replaceVariables(formData.sms_body)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderForm = () => (
    <div className="space-y-4 min-h-0">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Template Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Event Registration Confirmation"
          />
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="registration">Registration</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="follow-up">Follow-up</SelectItem>
              <SelectItem value="promotional">Promotional</SelectItem>
              <SelectItem value="newsletter">Newsletter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Brief description of this template"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="type">Template Type *</Label>
        <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
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

      {formData.type !== 'sms' && (
        <div>
          <Label htmlFor="subject">Email Subject *</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            placeholder="e.g., Welcome to {{event_name}}!"
          />
        </div>
      )}

      {formData.type !== 'sms' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="email_body">Email Content *</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={generateSampleHtmlTemplate}
                className="text-xs"
              >
                <Code className="w-3 h-3 mr-1" />
                Professional Template
              </Button>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">Text Content</TabsTrigger>
              <TabsTrigger value="html">HTML Content</TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="space-y-2">
              <Textarea
                id="email_body"
                value={formData.email_body}
                onChange={(e) => handleChange('email_body', e.target.value)}
                placeholder="Dear {{first_name}},&#10;&#10;Thank you for registering for {{event_name}}..."
                rows={8}
                className="font-mono text-sm"
              />
            </TabsContent>
            
            <TabsContent value="html" className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">HTML Email Template</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyHtmlCode}
                  disabled={!formData.html_body}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy HTML
                </Button>
              </div>
              <Textarea
                id="html_body"
                value={formData.html_body}
                onChange={(e) => handleChange('html_body', e.target.value)}
                placeholder="<html>...</html>"
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Enter your HTML email template. Use variables like {'{{first_name}}'} for dynamic content.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {formData.type !== 'email' && (
        <div>
          <Label htmlFor="sms_body">SMS Content *</Label>
          <Textarea
            id="sms_body"
            value={formData.sms_body}
            onChange={(e) => handleChange('sms_body', e.target.value)}
            placeholder="Hi {{first_name}}, you're registered for {{event_name}} on {{event_date}}. See you there!"
            rows={4}
            maxLength={320}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.sms_body.length}/320 characters
          </p>
        </div>
      )}

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
            <code className="bg-white px-2 py-1 rounded">{'{{company}}'}</code>
            <code className="bg-white px-2 py-1 rounded">{'{{job_title}}'}</code>
          </div>
        </CardContent>
      </Card>

      {getAvailableVariables().length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-2">Detected Variables:</h4>
            <div className="flex flex-wrap gap-2">
              {getAvailableVariables().map((variable) => (
                <Badge key={variable} variant="secondary" className="text-xs">
                  {`{{${variable}}}`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${previewMode ? 'max-w-6xl max-h-[95vh]' : 'max-w-4xl max-h-[90vh]'} flex flex-col`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-blue-600" />
            Create Marketing Template
          </DialogTitle>
          <DialogDescription>
            Create reusable email and SMS templates for your marketing campaigns
          </DialogDescription>
        </DialogHeader>

        <div className={`${previewMode ? 'overflow-hidden' : 'overflow-y-auto flex-1'} py-4`}>
          {previewMode ? renderPreview() : renderForm()}
        </div>

        <DialogFooter className="flex-shrink-0 border-t bg-white">
          <div className="flex justify-between w-full">
            <div>
              {previewMode && (
                <Button variant="outline" onClick={() => setPreviewMode(false)}>
                  Back to Edit
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              {!previewMode && (
                <Button variant="outline" onClick={handlePreview}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              )}
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Template
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
