import React, { useState } from 'react';
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
import {
  Upload,
  X,
  FileText,
  Image,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Search,
} from 'lucide-react';
import vendorApi from '@/lib/vendorApi';

interface AddVendorModalEnhancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorCreated?: () => void;
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
}

const SERVICE_OPTIONS = [
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

export default function AddVendorModalEnhanced({ open, onOpenChange, onVendorCreated }: AddVendorModalEnhancedProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<VendorFormData>({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    services_provided: [],
    tax_id: '',
    business_license: '',
    payment_terms: 'net_30',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    notes: '',
  });

  const [logo, setLogo] = useState<File | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [newService, setNewService] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLookingUpTin, setIsLookingUpTin] = useState(false);

  const createVendorMutation = useMutation({
    mutationFn: async (data: any) => {
      const formDataToSend = new FormData();
      
      // Add all form fields with validation
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'services_provided') {
          // Ensure services_provided is always sent as JSON string
          formDataToSend.append(key, JSON.stringify(value));
        } else if (key === 'website' && value) {
          // Ensure website has proper protocol
          let website = value as string;
          if (!website.startsWith('http://') && !website.startsWith('https://')) {
            website = 'https://' + website;
          }
          formDataToSend.append(key, website);
        } else if (key === 'tax_id' && value) {
          // Generate unique tax_id if using default value
          let taxId = value as string;
          if (taxId === '00000000000') {
            taxId = 'TAX' + Date.now() + Math.floor(Math.random() * 1000);
          }
          formDataToSend.append(key, taxId);
        } else if (key === 'business_license' && value) {
          // Generate unique business_license if using default value
          let businessLicense = value as string;
          if (businessLicense === '0000000') {
            businessLicense = 'LIC' + Date.now() + Math.floor(Math.random() * 1000);
          }
          formDataToSend.append(key, businessLicense);
        } else {
          formDataToSend.append(key, value as string);
        }
      });

      // Always set status to pending_approval for new vendors
      formDataToSend.append('status', 'pending_approval');
      
      // Enable auto-fill from TIN if tax_id is provided
      if (data.tax_id && data.tax_id.trim()) {
        formDataToSend.append('auto_fill_from_tin', 'true');
      }

      // Add files
      if (logo) {
        formDataToSend.append('logo', logo);
      }
      
      documents.forEach((doc, index) => {
        formDataToSend.append(`documents[${index}]`, doc);
      });

      return vendorApi.createVendor(formDataToSend);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors-revamped'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-statistics-revamped'] });
      toast.success('Vendor created successfully!');
      handleClose();
      // Call the callback to refresh the parent component
      onVendorCreated?.();
    },
    onError: (error: any) => {
      console.error('Create vendor error:', error);
      
      const errorMessage = error?.response?.data?.message ||
                          error?.response?.data?.error ||
                          error?.message ||
                          'Failed to create vendor';

      if (error?.response?.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors).flat();
        toast.error(`Validation Error: ${validationErrors.join(', ')}`);
        setErrors(error.response.data.errors);
      } else {
        toast.error(`Error: ${errorMessage}`);
      }
    },
  });

  const handleInputChange = (field: keyof VendorFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
        const updates: Partial<VendorFormData> = {};
        
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

  const handleServiceAdd = (service: string) => {
    if (service && !formData.services_provided.includes(service)) {
      setFormData(prev => ({
        ...prev,
        services_provided: [...prev.services_provided, service]
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

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('Logo file size must be less than 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Logo must be an image file');
        return;
      }
      setLogo(file);
    }
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`File ${file.name} is too large (max 5MB)`);
        return false;
      }
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} has unsupported format`);
        return false;
      }
      return true;
    });

    setDocuments(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 documents
  };

  const handleDocumentRemove = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Vendor name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (formData.services_provided.length === 0) newErrors.services_provided = 'At least one service is required';
    if (formData.website && formData.website.trim()) {
      // Enhanced URL validation to accept various formats
      const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(\.[a-zA-Z]{2,})(\/.*)?$/;
      if (!urlPattern.test(formData.website.trim())) {
        newErrors.website = 'Please enter a valid website URL (e.g., x.com, https://x.com, http://www.x.com)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    createVendorMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      services_provided: [],
      tax_id: '',
      business_license: '',
      payment_terms: 'net_30',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      notes: '',
    });
    setLogo(null);
    setDocuments([]);
    setNewService('');
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Vendor
          </DialogTitle>
          <DialogDescription>
            Create a new vendor account with complete information and documentation
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
                  className={errors.tax_id ? 'border-red-500' : ''}
                />
                {errors.tax_id && <p className="text-sm text-red-500">{errors.tax_id}</p>}
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

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="email">Email Address *</Label>
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
                <Label htmlFor="phone">Phone Number *</Label>
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
                  placeholder="x.com, https://x.com, http://www.x.com"
                  className={errors.website ? 'border-red-500' : ''}
                />
                {errors.website && <p className="text-sm text-red-500">{errors.website}</p>}
                <p className="text-xs text-gray-500">
                  Accepts: x.com, https://x.com, http://www.x.com, or any valid domain
                </p>
              </div>
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

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Services Provided *</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Select value={newService} onValueChange={setNewService}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_OPTIONS.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={() => handleServiceAdd(newService)}
                  disabled={!newService}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.services_provided.map((service) => (
                  <Badge key={service} variant="secondary" className="flex items-center gap-1">
                    {service}
                    <button
                      type="button"
                      onClick={() => handleServiceRemove(service)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {errors.services_provided && <p className="text-sm text-red-500">{errors.services_provided}</p>}
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_id">Tax ID</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => handleInputChange('tax_id', e.target.value)}
                  placeholder="Enter tax identification number"
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
                    <SelectValue />
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

            </div>
          </div>

          {/* Status Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">Vendor Status</h4>
                <p className="text-sm text-blue-700">
                  New vendors will be created with "Pending Approval" status. You can change the status later in the vendor management page.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Enter contact phone number"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder="Enter contact email address"
                />
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Documents & Logo</h3>
            
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label htmlFor="logo">Company Logo</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="flex-1"
                />
                {logo && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {logo.name}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">Max 2MB, JPG/PNG/GIF formats</p>
            </div>

            {/* Documents Upload */}
            <div className="space-y-2">
              <Label htmlFor="documents">Business Documents</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="documents"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleDocumentUpload}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500">
                  {documents.length}/5 files
                </span>
              </div>
              <p className="text-xs text-gray-500">Max 5 files, 5MB each. PDF, DOC, DOCX, JPG, PNG formats</p>
              
              {documents.length > 0 && (
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{doc.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(doc.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDocumentRemove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter any additional notes or comments"
              rows={4}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createVendorMutation.isPending}
              className="min-w-[120px]"
            >
              {createVendorMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Vendor
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
