import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2, Upload, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';
import vendorApi from '@/lib/vendorApi';

interface VendorOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SERVICE_OPTIONS = [
  'Catering',
  'Audio/Visual',
  'Photography',
  'Videography',
  'Decorations',
  'Transportation',
  'Security',
  'Entertainment',
  'Venue Management',
  'Event Planning',
  'Technical Support',
  'Cleaning Services',
  'Equipment Rental',
  'Staffing',
  'Marketing',
  'Printing',
  'Floral Arrangements',
  'Lighting',
  'Sound System',
  'Stage Setup'
];

const PRICING_MODELS = [
  'per_event',
  'package',
  'hourly',
  'unit_based'
];

export default function VendorOnboardingModal({ isOpen, onClose }: VendorOnboardingModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    services_provided: [] as string[],
    pricing_model: '',
    portfolio_items: [] as string[],
    tax_id: '',
    business_license: '',
    payment_terms: '',
    notes: '',
    lifecycle_stage: 'discovery' as const,
    contact_person: '',
    contact_phone: '',
    contact_email: '',
  });

  const [newService, setNewService] = useState('');
  const [newPortfolioItem, setNewPortfolioItem] = useState('');
  const [legalDocuments, setLegalDocuments] = useState<File[]>([]);
  const [isLookingUpTin, setIsLookingUpTin] = useState(false);
  const queryClient = useQueryClient();

  const createVendorMutation = useMutation({
    mutationFn: (data: any) => vendorApi.createVendor(data),
    onSuccess: async (data) => {
      console.log('Vendor created successfully:', data);
      
      // Invalidate all vendor queries regardless of filters
      await queryClient.invalidateQueries({ queryKey: ['vendors'], exact: false });
      
      // Force refetch to ensure the new vendor appears
      await queryClient.refetchQueries({ queryKey: ['vendors'], exact: false });
      
      toast.success('Vendor created successfully!');
      handleClose();
    },
    onError: async (error: any) => {
      const errorData = error?.response?.data;
      let errorMessage = errorData?.message || 
                        errorData?.error || 
                        error?.message || 
                        'Failed to create vendor';
      
      // Show validation errors if available
      if (errorData?.errors) {
        const validationErrors = Object.entries(errorData.errors)
          .map(([field, messages]: [string, any]) => {
            const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
          })
          .join('\n');
        errorMessage = `Validation failed:\n${validationErrors}`;
      }
      
      toast.error(errorMessage);
      
      // Even on error, try to refresh the vendor list in case mock data was created
      await queryClient.invalidateQueries({ queryKey: ['vendors'], exact: false });
      await queryClient.refetchQueries({ queryKey: ['vendors'], exact: false });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLookupByTin = async () => {
    if (!formData.tax_id.trim()) {
      toast.error('Please enter a TIN number first');
      return;
    }

    // Validate TIN format (numeric only)
    if (!/^\d+$/.test(formData.tax_id.trim())) {
      toast.error('TIN number must contain only digits');
      return;
    }

    setIsLookingUpTin(true);
    try {
      const businessInfo = await vendorApi.lookupByTin(formData.tax_id.trim());
      
      if (businessInfo) {
        // Map business info to form fields (only fill if field is empty)
        const updates: any = {};
        
        if (!formData.name && (businessInfo.businessName || businessInfo.name)) {
          updates.name = businessInfo.businessName || businessInfo.name;
        }
        
        if (!formData.address && (businessInfo.address || businessInfo.location)) {
          updates.address = businessInfo.address || businessInfo.location;
        }
        
        if (!formData.email && businessInfo.email) {
          updates.email = businessInfo.email;
        }
        
        if (!formData.phone && (businessInfo.phone || businessInfo.phoneNumber)) {
          updates.phone = businessInfo.phone || businessInfo.phoneNumber;
        }
        
        if (!formData.website && businessInfo.website) {
          updates.website = businessInfo.website;
        }
        
        if (!formData.business_license && (businessInfo.licenseNumber || businessInfo.businessLicense)) {
          updates.business_license = businessInfo.licenseNumber || businessInfo.businessLicense;
        }
        
        if (!formData.contact_person && (businessInfo.contactPerson || businessInfo.contactName)) {
          updates.contact_person = businessInfo.contactPerson || businessInfo.contactName;
        }
        
        if (!formData.contact_email && businessInfo.contactEmail) {
          updates.contact_email = businessInfo.contactEmail;
        }
        
        if (!formData.contact_phone && businessInfo.contactPhone) {
          updates.contact_phone = businessInfo.contactPhone;
        }

        if (Object.keys(updates).length > 0) {
          setFormData(prev => ({ ...prev, ...updates }));
          toast.success(`Fetched business information! Filled ${Object.keys(updates).length} field(s).`);
        } else {
          toast.info('Business information retrieved, but all fields are already filled.');
        }
      } else {
        toast.warning('No business information found for this TIN number');
      }
    } catch (error: any) {
      console.error('TIN lookup error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to lookup business information';
      toast.error(errorMessage);
    } finally {
      setIsLookingUpTin(false);
    }
  };

  const handleAddService = () => {
    if (newService.trim() && !formData.services_provided.includes(newService.trim())) {
      setFormData(prev => ({
        ...prev,
        services_provided: [...prev.services_provided, newService.trim()]
      }));
      setNewService('');
    }
  };

  const handleRemoveService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services_provided: prev.services_provided.filter(s => s !== service)
    }));
  };

  const handleAddPortfolioItem = () => {
    if (newPortfolioItem.trim() && !formData.portfolio_items.includes(newPortfolioItem.trim())) {
      setFormData(prev => ({
        ...prev,
        portfolio_items: [...prev.portfolio_items, newPortfolioItem.trim()]
      }));
      setNewPortfolioItem('');
    }
  };

  const handleRemovePortfolioItem = (item: string) => {
    setFormData(prev => ({
      ...prev,
      portfolio_items: prev.portfolio_items.filter(i => i !== item)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setLegalDocuments(prev => [...prev, ...files]);
    }
  };

  const handleRemoveDocument = (index: number) => {
    setLegalDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.services_provided.length === 0) {
      toast.error('Please add at least one service');
      return;
    }

    // Create FormData if files are present, otherwise use regular object
    if (legalDocuments.length > 0) {
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'services_provided') {
          formDataToSend.append(key, JSON.stringify(value));
        } else if (value) {
          formDataToSend.append(key, value as string);
        }
      });
      
      // Enable auto-fill from TIN if tax_id is provided
      if (formData.tax_id && formData.tax_id.trim()) {
        formDataToSend.append('auto_fill_from_tin', 'true');
      }
      
      // Add files
      legalDocuments.forEach((file, index) => {
        formDataToSend.append(`documents[${index}]`, file);
      });
      
      createVendorMutation.mutate(formDataToSend);
    } else {
      // For non-FormData submission, add auto_fill_from_tin flag
      const dataToSend = { ...formData };
      if (formData.tax_id && formData.tax_id.trim()) {
        (dataToSend as any).auto_fill_from_tin = true;
      }
      createVendorMutation.mutate(dataToSend);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      services_provided: [],
      pricing_model: '',
      portfolio_items: [],
      tax_id: '',
      business_license: '',
      payment_terms: '',
      notes: '',
      lifecycle_stage: 'discovery',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
    });
    setNewService('');
    setNewPortfolioItem('');
    setLegalDocuments([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>
            Onboard a new vendor to your system. Fill in the required information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TIN Lookup Section - Moved to Top */}
          <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">Business Registration Lookup</h3>
            </div>
            <p className="text-sm text-blue-700 mb-4">
              Enter a TIN (Tax Identification Number) to automatically fetch business information from the Ethiopian Trade Registry.
            </p>
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="tax_id">Tax ID (TIN) Number</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => handleInputChange('tax_id', e.target.value)}
                  placeholder="Enter TIN number (e.g., 1234567890)"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleLookupByTin}
                  disabled={!formData.tax_id.trim() || isLookingUpTin}
                  variant="outline"
                  className="min-w-[140px]"
                >
                  {isLookingUpTin ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Looking up...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Fetch Info
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Services Provided *</Label>
            <div className="flex gap-2">
              <Select value={newService} onValueChange={setNewService}>
                <SelectTrigger>
                  <SelectValue placeholder="Select or type a service" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_OPTIONS.map(service => (
                    <SelectItem key={service} value={service}>{service}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={handleAddService} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.services_provided.map(service => (
                <Badge key={service} variant="secondary" className="flex items-center gap-1">
                  {service}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleRemoveService(service)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricing_model">Pricing Model</Label>
            <Select value={formData.pricing_model} onValueChange={(value) => handleInputChange('pricing_model', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select pricing model" />
              </SelectTrigger>
              <SelectContent>
                {PRICING_MODELS.map(model => (
                  <SelectItem key={model} value={model}>
                    {model.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Portfolio Items</Label>
            <div className="flex gap-2">
              <Input
                value={newPortfolioItem}
                onChange={(e) => setNewPortfolioItem(e.target.value)}
                placeholder="Add portfolio item (e.g., past event, project)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPortfolioItem();
                  }
                }}
              />
              <Button type="button" onClick={handleAddPortfolioItem} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.portfolio_items.map(item => (
                <Badge key={item} variant="outline" className="flex items-center gap-1">
                  {item}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleRemovePortfolioItem(item)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_license">Business License</Label>
              <Input
                id="business_license"
                value={formData.business_license}
                onChange={(e) => handleInputChange('business_license', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_terms">Payment Terms</Label>
            <Select value={formData.payment_terms} onValueChange={(value) => handleInputChange('payment_terms', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="net_7">Net 7</SelectItem>
                <SelectItem value="net_15">Net 15</SelectItem>
                <SelectItem value="net_30">Net 30</SelectItem>
                <SelectItem value="net_45">Net 45</SelectItem>
                <SelectItem value="net_60">Net 60</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contact Person Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Contact Person Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person Name</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => handleInputChange('contact_person', e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder="Email address"
                />
              </div>
            </div>
          </div>

          {/* Legal Documents Upload */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Legal Documents</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="documents" className="cursor-pointer">
                  <Button type="button" variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Documents
                    </span>
                  </Button>
                </Label>
                <Input
                  id="documents"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="text-sm text-muted-foreground">
                  Upload TIN certificate, business license, contracts, etc. (PDF, DOC, DOCX, JPG, PNG)
                </span>
              </div>
              
              {legalDocuments.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Documents ({legalDocuments.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {legalDocuments.map((file, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-2 px-3 py-1">
                        <FileText className="h-3 w-3" />
                        <span className="text-xs max-w-[200px] truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-destructive" 
                          onClick={() => handleRemoveDocument(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this vendor..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createVendorMutation.isPending}>
              {createVendorMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Vendor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


