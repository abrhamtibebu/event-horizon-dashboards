import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Loader2, Upload, FileText, Search,
  RefreshCw, CheckCircle2 as FileCheck, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import vendorApi from '@/lib/vendorApi';

interface VendorOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
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

export default function VendorOnboardingModal({ isOpen, onClose, initialData }: VendorOnboardingModalProps) {
  const [formData, setFormData] = React.useState({
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

  const [newService, setNewService] = React.useState('');
  const [newPortfolioItem, setNewPortfolioItem] = React.useState('');
  const [legalDocuments, setLegalDocuments] = React.useState<File[]>([]);
  const [isLookingUpTin, setIsLookingUpTin] = React.useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        website: initialData.website || '',
        address: initialData.address || '',
        services_provided: initialData.services_provided || [],
        pricing_model: initialData.pricing_model || '',
        portfolio_items: initialData.portfolio_items || [], // Assuming this column exists or is handled
        tax_id: initialData.tax_id || '',
        business_license: initialData.business_license || '',
        payment_terms: initialData.payment_terms || '',
        notes: initialData.notes || '',
        lifecycle_stage: initialData.lifecycle_stage || 'discovery',
        contact_person: initialData.contact_person || '',
        contact_phone: initialData.contact_phone || '',
        contact_email: initialData.contact_email || '',
      });
      // Clear documents as we don't show existing files in the file input (browser security)
      // Showing existing files is a separate UI task (list existing files).
      setLegalDocuments([]);
    } else if (isOpen && !initialData) {
      // Reset logic is in handleClose, but if we open without initialData (Create mode), we should probably ensure clear state.
      // However, handleClose calls reset, so we are fine.
    }
  }, [isOpen, initialData]);

  const createVendorMutation = useMutation({
    mutationFn: (data: any) => vendorApi.createVendor(data),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['vendors'], exact: false });
      await queryClient.refetchQueries({ queryKey: ['vendors'], exact: false });
      toast.success('Vendor created successfully!');
      handleClose();
    },
    onError: async (error: any) => {
      handleMutationError(error);
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: (data: any) => vendorApi.updateVendor(initialData.id, data),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['vendors'], exact: false });
      await queryClient.refetchQueries({ queryKey: ['vendors'], exact: false });
      toast.success('Vendor updated successfully!');
      handleClose();
    },
    onError: async (error: any) => {
      handleMutationError(error);
    },
  });

  const handleMutationError = (error: any) => {
    const errorData = error?.response?.data;
    let errorMessage = errorData?.message ||
      errorData?.error ||
      error?.message ||
      'Operation failed';

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
  };

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

    if (initialData) {
      // Edit Mode
      // For update, we currently only support JSON updates (no files)
      // due to API limitations in updateVendor
      const dataToSend = { ...formData };

      // Ensure services_provided is array (it is in state)
      // api.ts updateVendor will stringify it.

      updateVendorMutation.mutate(dataToSend);
    } else {
      // Create Mode
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
    }
  };

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

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
    setCurrentStep(1);
    onClose();
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return formData.name && formData.email && formData.phone && formData.services_provided.length > 0;
      case 2:
        return true; // Optional fields mostly
      case 3:
        return true;
      default:
        return false;
    }
  };

  const steps = [
    { id: 1, title: 'Business Profile', description: 'Core information' },
    { id: 2, title: 'Verification', description: 'TIN & Compliance' },
    { id: 3, title: 'Logistics', description: 'Terms & Documents' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background border-border shadow-2xl rounded-3xl">
        <DialogTitle className="sr-only">Vendor Onboarding</DialogTitle>
        <DialogDescription className="sr-only">Complete the steps to onboard a new vendor or edit existing profile.</DialogDescription>
        <div className="flex h-full max-h-[90vh]">
          {/* Sidebar - Desktop */}
          <div className="hidden md:flex flex-col w-64 bg-muted/30 border-r border-border p-8 shrink-0">
            <div className="mb-8">
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 mb-2 px-3">
                {initialData ? 'Edit Profile' : 'Onboarding'}
              </Badge>
              <h2 className="text-xl font-bold tracking-tight">{initialData ? 'Edit Vendor' : 'New Vendor'}</h2>
            </div>

            <div className="space-y-6 flex-1">
              {steps.map((step) => (
                <div key={step.id} className="relative flex items-start gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold border transition-all duration-300",
                    currentStep === step.id
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-110"
                      : currentStep > step.id
                        ? "bg-primary/20 text-primary border-transparent"
                        : "bg-card text-muted-foreground border-border"
                  )}>
                    {currentStep > step.id ? (
                      <FileCheck className="h-4 w-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div>
                    <p className={cn(
                      "text-sm font-bold transition-colors",
                      currentStep === step.id ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-8 border-t border-border">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-center">
                Procurement System v2
              </p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
            <DialogHeader className="p-6 md:p-8 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight">
                    {steps.find(s => s.id === currentStep)?.title}
                  </DialogTitle>
                  <DialogDescription className="text-sm font-medium">
                    Please provide the following details to proceed.
                  </DialogDescription>
                </div>
                <div className="md:hidden">
                  <Badge variant="secondary" className="font-bold">
                    Step {currentStep} of {totalSteps}
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 elegant-scrollbar">
              <form onSubmit={handleSubmit} id="vendor-onboarding-form">
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Business Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="e.g. Acme Services Co."
                            className="bg-muted/30 border-transparent focus:border-primary transition-all h-11 rounded-xl"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Business Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="contact@acme.com"
                            className="bg-muted/30 border-transparent focus:border-primary transition-all h-11 rounded-xl"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Business Phone *</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="+251 ..."
                            className="bg-muted/30 border-transparent focus:border-primary transition-all h-11 rounded-xl"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Website</Label>
                          <Input
                            id="website"
                            type="url"
                            value={formData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            placeholder="https://..."
                            className="bg-muted/30 border-transparent focus:border-primary transition-all h-11 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Services Provided *</Label>
                        <div className="flex gap-2">
                          <Select value={newService} onValueChange={setNewService}>
                            <SelectTrigger className="bg-muted/30 border-transparent focus:border-primary transition-all h-11 rounded-xl">
                              <SelectValue placeholder="Select a service category" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border">
                              {SERVICE_OPTIONS.map(service => (
                                <SelectItem key={service} value={service} className="rounded-lg">{service}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" onClick={handleAddService} variant="outline" className="h-11 w-11 p-0 rounded-xl border-border shrink-0 hover:text-primary transition-colors">
                            <Plus className="h-5 w-5" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.services_provided.map(service => (
                            <Badge key={service} variant="secondary" className="pl-3 pr-2 py-1 gap-2 rounded-lg bg-primary/10 text-primary border-transparent">
                              {service}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => handleRemoveService(service)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Headquarters Address</Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Full physical address or location details..."
                          className="bg-muted/30 border-transparent focus:border-primary transition-all min-h-[100px] rounded-xl resize-none p-4"
                        />
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      {/* TIN Discovery Tool - Redesigned */}
                      <div className="relative group overflow-hidden bg-primary/[0.03] border border-primary/10 rounded-[2rem] p-8">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />

                        <div className="flex items-center gap-4 mb-6 relative">
                          <div className="p-3 bg-primary/10 rounded-2xl shadow-inner">
                            <Search className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold tracking-tight">Business Discovery Tool</h3>
                            <p className="text-sm text-muted-foreground font-medium">Verify business records from Trade Registry.</p>
                          </div>
                        </div>

                        <div className="space-y-4 relative">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                              <Input
                                id="tax_id"
                                value={formData.tax_id}
                                onChange={(e) => handleInputChange('tax_id', e.target.value)}
                                placeholder="Enter TIN Number..."
                                className="h-12 bg-background border-border/50 focus:border-primary shadow-sm rounded-xl px-5"
                              />
                            </div>
                            <Button
                              type="button"
                              onClick={handleLookupByTin}
                              disabled={!formData.tax_id.trim() || isLookingUpTin}
                              className="h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                              {isLookingUpTin ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Fetching...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Lookup Record
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="text-[11px] font-medium text-muted-foreground px-1">
                            Supported for registered Ethiopian businesses. Auto-fills profile data on success.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="business_license" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Business License #</Label>
                          <Input
                            id="business_license"
                            value={formData.business_license}
                            onChange={(e) => handleInputChange('business_license', e.target.value)}
                            placeholder="e.g. BL-2024-X11"
                            className="bg-muted/30 border-transparent focus:border-primary transition-all h-11 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pricing_model" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Standard Pricing Model</Label>
                          <Select value={formData.pricing_model} onValueChange={(value) => handleInputChange('pricing_model', value)}>
                            <SelectTrigger className="bg-muted/30 border-transparent focus:border-primary transition-all h-11 rounded-xl">
                              <SelectValue placeholder="Select model" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {PRICING_MODELS.map(model => (
                                <SelectItem key={model} value={model}>
                                  {model.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sample Portfolio / Projects</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newPortfolioItem}
                            onChange={(e) => setNewPortfolioItem(e.target.value)}
                            placeholder="Add previous client or project name..."
                            className="h-11 bg-muted/30 border-transparent focus:border-primary transition-all rounded-xl"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddPortfolioItem();
                              }
                            }}
                          />
                          <Button type="button" onClick={handleAddPortfolioItem} variant="outline" className="h-11 w-11 p-0 rounded-xl border-border shrink-0">
                            <Plus className="h-5 w-5" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.portfolio_items.map(item => (
                            <Badge key={item} variant="outline" className="px-3 py-1 gap-2 rounded-lg border-muted-foreground/20 text-muted-foreground">
                              {item}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => handleRemovePortfolioItem(item)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="p-6 bg-accent/30 rounded-2xl border border-border/50">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">Contact Representative</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Input
                              value={formData.contact_person}
                              onChange={(e) => handleInputChange('contact_person', e.target.value)}
                              placeholder="Full Name"
                              className="h-11 bg-background border-border/50 rounded-xl px-4"
                            />
                          </div>
                          <div className="space-y-2">
                            <Input
                              value={formData.contact_phone}
                              onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                              placeholder="Phone Number"
                              className="h-11 bg-background border-border/50 rounded-xl px-4"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Input
                              type="email"
                              value={formData.contact_email}
                              onChange={(e) => handleInputChange('contact_email', e.target.value)}
                              placeholder="Direct Email Address"
                              className="h-11 bg-background border-border/50 rounded-xl px-4"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Compliance Documents</h3>
                          <Label htmlFor="documents" className="cursor-pointer">
                            <div className="flex items-center gap-2 text-xs font-bold text-primary hover:opacity-80 transition-opacity">
                              <Upload className="h-4 w-4" />
                              Add Files
                            </div>
                          </Label>
                        </div>
                        <Input
                          id="documents"
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          className="hidden"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {legalDocuments.length === 0 ? (
                            <div className="col-span-2 border-2 border-dashed border-border rounded-[2rem] py-10 flex flex-col items-center justify-center opacity-40">
                              <FileText className="h-10 w-10 mb-2" />
                              <p className="text-xs font-bold uppercase tracking-widest">No documents attached</p>
                            </div>
                          ) : (
                            legalDocuments.map((file, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-card border border-border rounded-2xl group shadow-sm">
                                <div className="p-2 bg-muted rounded-xl shrink-0">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate">{file.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                  onClick={() => handleRemoveDocument(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="payment_terms" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preferred Payment Terms</Label>
                          <Select value={formData.payment_terms} onValueChange={(value) => handleInputChange('payment_terms', value)}>
                            <SelectTrigger className="bg-muted/30 border-transparent focus:border-primary transition-all h-11 rounded-xl">
                              <SelectValue placeholder="Select terms" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="immediate">Immediate</SelectItem>
                              <SelectItem value="net_7">Net 7</SelectItem>
                              <SelectItem value="net_15">Net 15</SelectItem>
                              <SelectItem value="net_30">Net 30</SelectItem>
                              <SelectItem value="net_45">Net 45</SelectItem>
                              <SelectItem value="net_60">Net 60</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Internal Evaluation Notes</Label>
                          <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            placeholder="Vendor strengths, weaknesses, or special context..."
                            className="bg-muted/30 border-transparent focus:border-primary transition-all h-24 rounded-xl resize-none p-3"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>

            <div className="p-6 md:p-8 border-t border-border bg-card/10 flex justify-between items-center">
              <div className="hidden sm:block">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Progressing to lifecycle discovery
                </p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={currentStep === 1 ? handleClose : prevStep}
                  className="rounded-xl px-6 h-11 font-bold transition-all"
                >
                  {currentStep === 1 ? 'Cancel' : 'Back'}
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!isStepComplete(currentStep)}
                    className="flex-1 sm:flex-none rounded-xl px-8 h-11 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    form="vendor-onboarding-form"
                    disabled={createVendorMutation.isPending || updateVendorMutation.isPending || !isStepComplete(currentStep)}
                    className="flex-1 sm:flex-none rounded-xl px-8 h-11 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {(createVendorMutation.isPending || updateVendorMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {initialData ? 'Save Changes' : 'Complete Onboarding'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
