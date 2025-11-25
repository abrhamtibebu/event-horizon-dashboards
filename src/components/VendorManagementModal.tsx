import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  FileText,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
  Loader2,
  Save,
  Eye,
  Calendar,
  User,
  Phone,
  Mail,
  Globe,
  MapPin,
  Building,
  CreditCard,
  FileCheck,
  AlertTriangle,
  XCircle,
  Play,
} from 'lucide-react';
import vendorApi from '@/lib/vendorApi';
import { paymentApi } from '@/lib/paymentApi';
import { PaymentManagementModal } from './PaymentManagementModal';
import { VendorReferralCampaigns } from './VendorReferralCampaigns';

// Utility function to handle services_provided as either array or JSON string
const parseServicesProvided = (services: any): string[] => {
  if (typeof services === 'string') {
    try {
      const parsed = JSON.parse(services);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return Array.isArray(services) ? services : [];
};

interface VendorManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: any;
  onVendorUpdated?: () => void;
}

interface VendorFormData {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  services_provided: string[];
  tax_id: string;
  business_license: string;
  payment_terms: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  notes: string;
  status: string;
}

interface DeliverableData {
  title: string;
  description: string;
  due_date: string;
  amount: string;
  priority: number;
}

interface QuotationFormData {
  event_id: string;
  service_type: string;
  description: string;
  amount: string;
  valid_until: string;
  terms_conditions: string;
  submission_date: string;
  notes: string;
  deliverables: DeliverableData[];
}

const SERVICE_TYPES = [
  'Catering',
  'Photography',
  'Videography',
  'Audio Equipment',
  'Lighting',
  'Floral Arrangements',
  'Event Planning',
  'Transportation',
  'Security',
  'Entertainment',
  'Decoration',
  'Venue Management',
  'Ticketing',
  'Marketing',
  'Other',
];

const PAYMENT_TERMS = [
  'immediate',
  'net_7',
  'net_15',
  'net_30',
  'net_45',
  'net_60',
  'custom',
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'pending_approval', label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-800' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
];

export default function VendorManagementModal({ 
  open, 
  onOpenChange, 
  vendor, 
  onVendorUpdated 
}: VendorManagementModalProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState<VendorFormData>({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    services_provided: [],
    tax_id: '',
    business_license: '',
    payment_terms: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    notes: '',
    status: 'pending_approval',
  });

  const [quotationForm, setQuotationForm] = useState<QuotationFormData>({
    event_id: '',
    service_type: '',
    description: '',
    amount: '',
    valid_until: '',
    terms_conditions: '',
    submission_date: new Date().toISOString().split('T')[0], // Today's date
    notes: '',
    deliverables: [],
  });

  const [quotations, setQuotations] = useState<any[]>([]);
  const [newService, setNewService] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [quotationErrors, setQuotationErrors] = useState<Record<string, string>>({});
  const [showPaymentManagement, setShowPaymentManagement] = useState(false);
  const [organizerEvents, setOrganizerEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Initialize form data when vendor changes
  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        website: vendor.website || '',
        address: vendor.address || '',
        services_provided: parseServicesProvided(vendor.services_provided),
        tax_id: vendor.tax_id || '',
        business_license: vendor.business_license || '',
        payment_terms: vendor.payment_terms || '',
        contact_person: vendor.contact_person || '',
        contact_phone: vendor.contact_phone || '',
        contact_email: vendor.contact_email || '',
        notes: vendor.notes || '',
        status: vendor.status || 'pending_approval',
      });
      
      // Load quotations and payments for this vendor
      loadQuotations();
      loadPayments();
    }
  }, [vendor]);

  // Fetch organizer events when component mounts
  useEffect(() => {
    const fetchOrganizerEvents = async () => {
      setLoadingEvents(true);
      try {
        const events = await vendorApi.getOrganizerEvents();
        setOrganizerEvents(events);
      } catch (error) {
        console.error('Failed to fetch organizer events:', error);
        setOrganizerEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };

    if (open) {
      fetchOrganizerEvents();
    }
  }, [open]);


  const loadQuotations = async () => {
    if (vendor?.id) {
      try {
        const vendorQuotations = await vendorApi.getQuotations({ vendor_id: vendor.id });
        setQuotations(vendorQuotations);
      } catch (error) {
        console.error('Failed to load quotations:', error);
        setQuotations([]);
      }
    }
  };

  const loadPayments = async () => {
    if (vendor?.id) {
      try {
        const result = await paymentApi.getPayments({ vendor_id: vendor.id });
        setPayments(result.data);
      } catch (error) {
        console.error('Failed to load payments:', error);
        setPayments([]);
      }
    }
  };


  const handleInputChange = (field: keyof VendorFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleQuotationInputChange = (field: keyof QuotationFormData, value: string) => {
    setQuotationForm(prev => ({ ...prev, [field]: value }));
    if (quotationErrors[field]) {
      setQuotationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleServiceAdd = () => {
    if (newService.trim() && !formData.services_provided.includes(newService.trim())) {
      setFormData(prev => ({
        ...prev,
        services_provided: [...prev.services_provided, newService.trim()]
      }));
      setNewService('');
    }
  };

  const handleServiceRemove = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services_provided: prev.services_provided.filter(s => s !== service)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Vendor name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (formData.services_provided.length === 0) newErrors.services_provided = 'At least one service is required';
    if (formData.website && formData.website.trim()) {
      const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(\.[a-zA-Z]{2,})(\/.*)?$/;
      if (!urlPattern.test(formData.website.trim())) {
        newErrors.website = 'Please enter a valid website URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateQuotationForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!quotationForm.event_id.trim()) newErrors.event_id = 'Event ID is required';
    if (!quotationForm.description.trim()) newErrors.description = 'Description is required';
    if (!quotationForm.amount.trim()) newErrors.amount = 'Amount is required';
    else if (isNaN(Number(quotationForm.amount)) || Number(quotationForm.amount) <= 0) {
      newErrors.amount = 'Amount must be a valid positive number';
    }
    if (!quotationForm.submission_date.trim()) newErrors.submission_date = 'Submission date is required';
    if (quotationForm.valid_until.trim() && quotationForm.submission_date.trim()) {
      const submissionDate = new Date(quotationForm.submission_date);
      const validUntilDate = new Date(quotationForm.valid_until);
      if (validUntilDate <= submissionDate) {
        newErrors.valid_until = 'Valid until date must be after submission date';
      }
    }

    setQuotationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateVendorMutation = useMutation({
    mutationFn: async (data: VendorFormData) => {
      return vendorApi.updateVendor(vendor.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors-revamped'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-statistics-revamped'] });
      toast.success('Vendor updated successfully!');
      onVendorUpdated?.();
    },
    onError: (error: any) => {
      console.error('Update vendor error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update vendor';
      toast.error(errorMessage);
    },
  });

  const createQuotationMutation = useMutation({
    mutationFn: async (data: QuotationFormData) => {
      return vendorApi.createQuotation({
        vendor_id: vendor.id,
        event_id: data.event_id,
        amount: Number(data.amount),
        description: data.description,
        terms_conditions: data.terms_conditions,
        submission_date: data.submission_date,
        valid_until: data.valid_until || null,
        notes: data.notes,
        deliverables: data.deliverables.map(deliverable => ({
          title: deliverable.title,
          description: deliverable.description,
          due_date: deliverable.due_date || null,
          amount: deliverable.amount ? Number(deliverable.amount) : null,
          priority: deliverable.priority,
        })),
      });
    },
    onSuccess: (data) => {
      toast.success('Quotation created successfully and is pending approval!');
      setQuotationForm({
        event_id: '',
        service_type: '',
        description: '',
        amount: '',
        valid_until: '',
        terms_conditions: '',
        submission_date: new Date().toISOString().split('T')[0],
        notes: '',
        deliverables: [],
      });
      loadQuotations();
      // Invalidate all quotation-related queries to refresh all pages
      queryClient.invalidateQueries({ queryKey: ['quotations-revamped'] });
      queryClient.invalidateQueries({ queryKey: ['quotations-new'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-quotations'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-statistics-revamped'] });
      queryClient.invalidateQueries({ queryKey: ['vendors-revamped'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
    onError: (error: any) => {
      console.error('Create quotation error:', error);
      
      if (error?.response?.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors).flat();
        toast.error(`Validation Error: ${validationErrors.join(', ')}`);
        setQuotationErrors(error.response.data.errors);
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create quotation';
        toast.error(errorMessage);
      }
    },
  });

  const handleSubmit = () => {
    if (validateForm()) {
      updateVendorMutation.mutate(formData);
    }
  };

  const handleQuotationSubmit = () => {
    if (validateQuotationForm()) {
      createQuotationMutation.mutate(quotationForm);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setFormData(prev => ({ ...prev, status: newStatus }));
    updateVendorMutation.mutate({ ...formData, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return (
      <Badge className={statusOption?.color || 'bg-gray-100 text-gray-800'}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount);
  };

  const getQuotationStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!vendor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Manage Vendor: {vendor.name}
          </DialogTitle>
          <DialogDescription>
            Manage vendor details, quotations, and services
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="quotations">Quotations</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Vendor Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Basic Information
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Vendor Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter vendor name"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://example.com"
                      className={errors.website ? 'border-red-500' : ''}
                    />
                    {errors.website && <p className="text-sm text-red-500">{errors.website}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Business Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter business address"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Business Information
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tax_id">Tax ID</Label>
                    <Input
                      id="tax_id"
                      value={formData.tax_id}
                      onChange={(e) => handleInputChange('tax_id', e.target.value)}
                      placeholder="Enter tax ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_license">Business License</Label>
                    <Input
                      id="business_license"
                      value={formData.business_license}
                      onChange={(e) => handleInputChange('business_license', e.target.value)}
                      placeholder="Enter business license number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_terms">Payment Terms</Label>
                    <Select value={formData.payment_terms} onValueChange={(value) => handleInputChange('payment_terms', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment terms" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_TERMS.map((term) => (
                          <SelectItem key={term} value={term}>
                            {term.replace('_', ' ').toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <div className="flex items-center gap-2">
                      <Select value={formData.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {getStatusBadge(formData.status)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => handleInputChange('contact_person', e.target.value)}
                    placeholder="Enter contact person name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="Enter contact phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="Enter contact email"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter any additional notes about this vendor"
                rows={4}
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSubmit} 
                disabled={updateVendorMutation.isPending}
                className="flex items-center gap-2"
              >
                {updateVendorMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </TabsContent>

          {/* Quotations Tab */}
          <TabsContent value="quotations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quotations
              </h3>
              <Button 
                onClick={() => setActiveTab('quotations')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Quotation
              </Button>
            </div>

            {/* Create New Quotation Form */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Create New Quotation</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_id">Event *</Label>
                  <Select
                    value={quotationForm.event_id}
                    onValueChange={(value) => handleQuotationInputChange('event_id', value)}
                  >
                    <SelectTrigger className={quotationErrors.event_id ? 'border-error' : ''}>
                      <SelectValue
                        placeholder={loadingEvents ? "Loading events..." : "Select an event"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {organizerEvents.map((event) => {
                        // Prefer API name if provided, fallback to title
                        const eventTitle = event.name || event.title || "Untitled Event";
                        const eventDate = event.start_date
                          ? new Date(event.start_date).toLocaleDateString()
                          : "";
                        const eventLocation = event.location || "";
                        return (
                          <SelectItem key={event.id} value={event.id.toString()}>
                            <div className="flex flex-col">
                              {/* Main line: only event title */}
                              <span className="font-medium">{eventTitle}</span>
                              {/* Subtext: event title + date + location */}
                              <span className="text-xs text-gray-500">
                                {`${eventDate ? ` ${eventDate}` : ""}${eventLocation ? ` - ${eventLocation}` : ""}`}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {quotationErrors.event_id && <p className="text-sm text-red-500">{quotationErrors.event_id}</p>}
                  <p className="text-xs text-gray-500">
                    Select an event from your organizer's active events
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (ETB) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={quotationForm.amount}
                    onChange={(e) => handleQuotationInputChange('amount', e.target.value)}
                    placeholder="Enter amount"
                    className={quotationErrors.amount ? 'border-red-500' : ''}
                  />
                  {quotationErrors.amount && <p className="text-sm text-red-500">{quotationErrors.amount}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="submission_date">Submission Date *</Label>
                  <Input
                    id="submission_date"
                    type="date"
                    value={quotationForm.submission_date}
                    onChange={(e) => handleQuotationInputChange('submission_date', e.target.value)}
                    className={quotationErrors.submission_date ? 'border-red-500' : ''}
                  />
                  {quotationErrors.submission_date && <p className="text-sm text-red-500">{quotationErrors.submission_date}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={quotationForm.valid_until}
                    onChange={(e) => handleQuotationInputChange('valid_until', e.target.value)}
                    className={quotationErrors.valid_until ? 'border-red-500' : ''}
                  />
                  {quotationErrors.valid_until && <p className="text-sm text-red-500">{quotationErrors.valid_until}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={quotationForm.description}
                  onChange={(e) => handleQuotationInputChange('description', e.target.value)}
                  placeholder="Enter quotation description"
                  rows={3}
                  className={quotationErrors.description ? 'border-red-500' : ''}
                />
                {quotationErrors.description && <p className="text-sm text-red-500">{quotationErrors.description}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms_conditions">Terms & Conditions</Label>
                <Textarea
                  id="terms_conditions"
                  value={quotationForm.terms_conditions}
                  onChange={(e) => handleQuotationInputChange('terms_conditions', e.target.value)}
                  placeholder="Enter terms and conditions"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={quotationForm.notes}
                  onChange={(e) => handleQuotationInputChange('notes', e.target.value)}
                  placeholder="Enter any additional notes"
                  rows={2}
                />
              </div>

              {/* Deliverables Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Deliverables</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuotationForm(prev => ({
                        ...prev,
                        deliverables: [...prev.deliverables, {
                          title: '',
                          description: '',
                          due_date: '',
                          amount: '',
                          priority: 1
                        }]
                      }));
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Deliverable
                  </Button>
                </div>

                {quotationForm.deliverables.length > 0 && (
                  <div className="space-y-3">
                    {quotationForm.deliverables.map((deliverable, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-sm">Deliverable {index + 1}</h5>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setQuotationForm(prev => ({
                                ...prev,
                                deliverables: prev.deliverables.filter((_, i) => i !== index)
                              }));
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`deliverable-title-${index}`}>Title *</Label>
                            <Input
                              id={`deliverable-title-${index}`}
                              value={deliverable.title}
                              onChange={(e) => {
                                const newDeliverables = [...quotationForm.deliverables];
                                newDeliverables[index].title = e.target.value;
                                setQuotationForm(prev => ({ ...prev, deliverables: newDeliverables }));
                              }}
                              placeholder="Enter deliverable title"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`deliverable-amount-${index}`}>Amount (ETB)</Label>
                            <Input
                              id={`deliverable-amount-${index}`}
                              type="number"
                              value={deliverable.amount}
                              onChange={(e) => {
                                const newDeliverables = [...quotationForm.deliverables];
                                newDeliverables[index].amount = e.target.value;
                                setQuotationForm(prev => ({ ...prev, deliverables: newDeliverables }));
                              }}
                              placeholder="Enter amount"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`deliverable-due-date-${index}`}>Due Date</Label>
                            <Input
                              id={`deliverable-due-date-${index}`}
                              type="date"
                              value={deliverable.due_date}
                              onChange={(e) => {
                                const newDeliverables = [...quotationForm.deliverables];
                                newDeliverables[index].due_date = e.target.value;
                                setQuotationForm(prev => ({ ...prev, deliverables: newDeliverables }));
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`deliverable-priority-${index}`}>Priority</Label>
                            <Select
                              value={deliverable.priority.toString()}
                              onValueChange={(value) => {
                                const newDeliverables = [...quotationForm.deliverables];
                                newDeliverables[index].priority = parseInt(value);
                                setQuotationForm(prev => ({ ...prev, deliverables: newDeliverables }));
                              }}
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

                        <div className="space-y-2">
                          <Label htmlFor={`deliverable-description-${index}`}>Description</Label>
                          <Textarea
                            id={`deliverable-description-${index}`}
                            value={deliverable.description}
                            onChange={(e) => {
                              const newDeliverables = [...quotationForm.deliverables];
                              newDeliverables[index].description = e.target.value;
                              setQuotationForm(prev => ({ ...prev, deliverables: newDeliverables }));
                            }}
                            placeholder="Enter deliverable description"
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {quotationForm.deliverables.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No deliverables added yet</p>
                    <p className="text-xs text-gray-400">Click "Add Deliverable" to define what needs to be delivered</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleQuotationSubmit} 
                  disabled={createQuotationMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {createQuotationMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Create Quotation
                </Button>
              </div>
            </div>

            {/* Existing Quotations */}
            <div className="space-y-4">
              <h4 className="font-medium">Existing Quotations</h4>
              {quotations.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Valid Until</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotations.map((quotation) => (
                        <TableRow key={quotation.id}>
                          <TableCell className="font-medium">QUO-{quotation.id}</TableCell>
                          <TableCell>{quotation.service_type}</TableCell>
                          <TableCell>{formatCurrency(quotation.amount)}</TableCell>
                          <TableCell>
                            <Badge className={getQuotationStatusColor(quotation.status)}>
                              {quotation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(quotation.valid_until).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-green-600">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <X className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No quotations found for this vendor</p>
                </div>
              )}
            </div>

            {/* Recent Quotations */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Recent Quotations</h4>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
              
              {quotations.length > 0 ? (
                <div className="grid gap-3">
                  {quotations.slice(0, 3).map((quotation) => (
                    <div key={quotation.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">QUO-{quotation.id}</span>
                            <Badge className={getQuotationStatusColor(quotation.status)}>
                              {quotation.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{quotation.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{formatCurrency(quotation.amount)}</span>
                            <span>Valid until: {new Date(quotation.valid_until).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-green-600">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent quotations</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Star className="h-5 w-5" />
              Services Provided
            </h3>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  placeholder="Add new service"
                  onKeyPress={(e) => e.key === 'Enter' && handleServiceAdd()}
                />
                <Button onClick={handleServiceAdd} disabled={!newService.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {errors.services_provided && (
                <p className="text-sm text-red-500">{errors.services_provided}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {formData.services_provided.map((service) => (
                  <Badge key={service} variant="secondary" className="flex items-center gap-1">
                    {service}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-red-100"
                      onClick={() => handleServiceRemove(service)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>

              {formData.services_provided.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No services added yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Payment Management Tab */}
          <TabsContent value="payments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Management
              </h3>
              <Button
                onClick={() => setShowPaymentManagement(true)}
                className="flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Manage Payments
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Total Payments</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{payments.length}</p>
                <p className="text-sm text-blue-700">
                  {payments.reduce((sum, payment) => sum + (payment.amount || 0), 0).toLocaleString()} ETB
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-900">Pending</span>
                </div>
                <p className="text-2xl font-bold text-yellow-900">
                  {payments.filter(p => p.status === 'pending').length}
                </p>
                <p className="text-sm text-yellow-700">
                  {payments.filter(p => p.status === 'pending').reduce((sum, payment) => sum + (payment.amount || 0), 0).toLocaleString()} ETB
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">Paid</span>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {payments.filter(p => p.status === 'paid').length}
                </p>
                <p className="text-sm text-green-700">
                  {payments.filter(p => p.status === 'paid').reduce((sum, payment) => sum + (payment.amount || 0), 0).toLocaleString()} ETB
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Recent Payments</h4>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>

              <div className="border rounded-lg">
                {loadingPayments ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading payments...</p>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="p-8 text-center">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No payments found</p>
                    <p className="text-sm text-gray-400">
                      Create payments for quotations or set up referral commissions
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {payments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              payment.status === 'paid' ? 'bg-green-500' :
                              payment.status === 'pending' ? 'bg-yellow-500' :
                              payment.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'
                            }`}></div>
                            <div>
                              <p className="font-medium">{payment.reference_number || `Payment #${payment.id}`}</p>
                              <p className="text-sm text-gray-500">
                                {payment.payment_type?.replace('_', ' ')} • {payment.payment_method?.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{payment.amount?.toLocaleString()} {payment.currency || 'ETB'}</p>
                            <p className="text-sm text-gray-500">
                              {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 
                               payment.due_date ? `Due: ${new Date(payment.due_date).toLocaleDateString()}` : 
                               'No date'}
                            </p>
                          </div>
                        </div>
                        {payment.notes && (
                          <p className="text-sm text-gray-600 mt-2 pl-6">{payment.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Referral System Section */}
            {(parseServicesProvided(vendor.services_provided).includes('marketing') || parseServicesProvided(vendor.services_provided).includes('sales')) && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Referral System</h4>
                  <Button variant="outline" size="sm">
                    <Globe className="h-4 w-4 mr-2" />
                    Generate Links
                  </Button>
                </div>

                <div className="border rounded-lg p-4 bg-purple-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-900">Marketing & Sales Commission</span>
                  </div>
                  <p className="text-sm text-purple-700 mb-3">
                    This vendor provides marketing/sales services and can earn commission through referral links.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Commission Rate:</strong> 5%</p>
                      <p><strong>Total Referrals:</strong> 0</p>
                    </div>
                    <div>
                      <p><strong>Commission Earned:</strong> ETB 0.00</p>
                      <p><strong>Active Campaigns:</strong> 0</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Referral Management
              </h3>
            </div>

            <div className="space-y-4">
              <VendorReferralCampaigns vendorId={vendor?.id} vendorName={vendor?.name} />
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Activity History
            </h3>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Vendor Created</span>
                  <span className="text-sm text-gray-500">
                    {new Date(vendor.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Vendor "{vendor.name}" was added to the system
                </p>
              </div>

              {vendor.updated_at !== vendor.created_at && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Edit className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Last Updated</span>
                    <span className="text-sm text-gray-500">
                      {new Date(vendor.updated_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Vendor information was last modified
                  </p>
                </div>
              )}

              {quotations.length > 0 && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Quotations</span>
                    <span className="text-sm text-gray-500">
                      {quotations.length} quotation(s) created
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Total quotations: {quotations.length}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Payment Management Modal */}
      <PaymentManagementModal
        vendor={vendor}
        isOpen={showPaymentManagement}
        onClose={() => setShowPaymentManagement(false)}
        onPaymentUpdated={() => {
          loadPayments();
        }}
      />

    </Dialog>
  );
}
