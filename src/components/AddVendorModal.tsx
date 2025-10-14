import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createVendor } from '@/lib/api';

interface AddVendorModalProps {
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

export default function AddVendorModal({ isOpen, onClose }: AddVendorModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    services_provided: [] as string[],
    tax_id: '',
    business_license: '',
    payment_terms: '',
    notes: '',
    documents: [] as File[]
  });

  const [newService, setNewService] = useState('');
  const queryClient = useQueryClient();

  const createVendorMutation = useMutation({
    mutationFn: createVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-statistics'] });
      toast.success('Vendor created successfully!');
      handleClose();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to create vendor';
      
      // Handle validation errors specifically
      if (error?.response?.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors).flat();
        toast.error(`Validation Error: ${validationErrors.join(', ')}`);
      } else {
        toast.error(`Error: ${errorMessage}`);
      }
      
      console.error('Create vendor error:', error);
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

  const handleSelectService = (service: string) => {
    if (!formData.services_provided.includes(service)) {
      setFormData(prev => ({
        ...prev,
        services_provided: [...prev.services_provided, service]
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} has an invalid type. Only PDF, JPEG, and PNG files are allowed.`);
        return false;
      }
      
      return true;
    });
    
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...validFiles]
    }));
  };

  const handleRemoveDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.services_provided.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    // Create FormData for file uploads
    const submitData = new FormData();
    
    // Add text fields
    Object.keys(formData).forEach(key => {
      if (key !== 'documents' && key !== 'services_provided') {
        submitData.append(key, (formData as any)[key]);
      }
    });
    
    // Add services as JSON
    submitData.append('services_provided', JSON.stringify(formData.services_provided));
    
    // Add files
    formData.documents.forEach((file, index) => {
      submitData.append(`documents[${index}]`, file);
    });

    createVendorMutation.mutate(submitData);
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
      payment_terms: '',
      notes: '',
      documents: []
    });
    setNewService('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>
            Fill in the vendor information below. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="vendor@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1234567890"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter full address"
                rows={3}
              />
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Services Provided *</h3>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select onValueChange={handleSelectService}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select from common services" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_OPTIONS.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Input
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  placeholder="Or add custom service"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddService())}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddService}
                  disabled={!newService.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.services_provided.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.services_provided.map((service) => (
                    <Badge key={service} variant="secondary" className="flex items-center gap-1">
                      {service}
                      <button
                        type="button"
                        onClick={() => handleRemoveService(service)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
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
                  placeholder="Tax identification number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_license">Business License</Label>
                <Input
                  id="business_license"
                  value={formData.business_license}
                  onChange={(e) => handleInputChange('business_license', e.target.value)}
                  placeholder="License number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Select onValueChange={(value) => handleInputChange('payment_terms', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="net_30">Net 30</SelectItem>
                  <SelectItem value="net_15">Net 15</SelectItem>
                  <SelectItem value="net_7">Net 7</SelectItem>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about the vendor"
                rows={3}
              />
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Documents</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="documents">Upload Documents</Label>
                <Input
                  id="documents"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload business license, tax documents, or other relevant files (PDF, JPG, PNG - Max 10MB each)
                </p>
              </div>

              {formData.documents.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Documents</Label>
                  <div className="space-y-2">
                    {formData.documents.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDocument(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createVendorMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createVendorMutation.isPending}
            >
              {createVendorMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Vendor'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


