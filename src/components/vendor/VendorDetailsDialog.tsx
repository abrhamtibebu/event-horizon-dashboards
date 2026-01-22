import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Edit,
  Trash2,
  Save,
  X,
  Mail,
  Phone,
  MapPin,
  Globe,
  Building,
  FileText,
  Star,
  Loader2,
  AlertCircle,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import vendorApi from '@/lib/vendorApi';
import { useAuth } from '@/hooks/use-auth';
import { usePermissionCheck } from '@/hooks/use-permission-check';
import { PermissionGuard } from '@/components/PermissionGuard';
import VendorLifecycleStageBadge from './VendorLifecycleStageBadge';
import { VENDOR_STATUSES, getStatusByValue, getPhases, getStatusesByPhase } from '@/lib/vendorStatusConstants';

interface VendorDetailsDialogProps {
  vendorId: number | null;
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

export default function VendorDetailsDialog({ vendorId, isOpen, onClose }: VendorDetailsDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    notes: '',
    status: 'pending_approval' as string,
  });
  const [newService, setNewService] = useState('');
  const { checkPermission } = usePermissionCheck();

  // Check if user can edit/delete based on permissions
  const canEdit = checkPermission('vendors.edit', 'edit vendors');
  const canDelete = checkPermission('vendors.delete', 'delete vendors');

  // Fetch vendor details
  const { data: vendor, isLoading, error } = useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: () => vendorApi.getVendor(vendorId!),
    enabled: !!vendorId && isOpen,
  });

  // Update form data when vendor is loaded
  useEffect(() => {
    if (vendor) {
      const services = Array.isArray(vendor.services_provided)
        ? vendor.services_provided
        : typeof vendor.services_provided === 'string'
        ? JSON.parse(vendor.services_provided || '[]')
        : [];

      setFormData({
        name: vendor.name || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        website: vendor.website || '',
        address: vendor.address || '',
        services_provided: services,
        tax_id: vendor.tax_id || '',
        business_license: vendor.business_license || '',
        payment_terms: vendor.payment_terms || '',
        contact_person: vendor.contact_person || '',
        contact_phone: vendor.contact_phone || '',
        contact_email: vendor.contact_email || '',
        notes: vendor.notes || '',
        status: vendor.status || 'pending_approval',
      });
    }
  }, [vendor]);

  // Update vendor mutation
  const updateVendorMutation = useMutation({
    mutationFn: (data: any) => vendorApi.updateVendor(vendorId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['vendor', vendorId] });
      toast.success('Vendor updated successfully!');
      setIsEditing(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to update vendor';
      toast.error(`Error: ${errorMessage}`);
    },
  });

  // Delete vendor mutation
  const deleteVendorMutation = useMutation({
    mutationFn: () => vendorApi.deleteVendor(vendorId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'], exact: false });
      toast.success('Vendor deleted successfully!');
      setShowDeleteDialog(false);
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to delete vendor';
      toast.error(`Error: ${errorMessage}`);
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => vendorApi.updateVendor(vendorId!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['vendor', vendorId] });
      toast.success('Vendor status updated successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to update vendor status';
      toast.error(`Error: ${errorMessage}`);
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

  const handleSave = () => {
    if (!checkPermission('vendors.edit', 'edit vendors')) {
      return;
    }

    if (formData.services_provided.length === 0) {
      toast.error('Please add at least one service');
      return;
    }

    const updateData = {
      ...formData,
      services_provided: JSON.stringify(formData.services_provided),
    };

    updateVendorMutation.mutate(updateData);
  };

  const handleStatusChange = (newStatus: string) => {
    if (!checkPermission('vendors.edit', 'edit vendor status')) {
      return;
    }
    updateStatusMutation.mutate(newStatus);
  };

  const handleDelete = () => {
    if (!checkPermission('vendors.delete', 'delete vendors')) {
      return;
    }
    deleteVendorMutation.mutate();
  };

  const handleClose = () => {
    setIsEditing(false);
    setShowDeleteDialog(false);
    onClose();
  };

  if (!vendorId) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold">
                  {vendor?.name || 'Vendor Details'}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-2">
                  {vendor?.name ? `Business Name: ${vendor.name}` : 'View and manage vendor information'}
                </DialogDescription>
              </div>
              {!isEditing && (
                <div className="flex items-center gap-2">
                  <PermissionGuard
                    permission="vendors.edit"
                    showToast={true}
                    actionName="edit vendors"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (checkPermission('vendors.edit', 'edit vendors')) {
                          setIsEditing(true);
                        }
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </PermissionGuard>
                  <PermissionGuard
                    permission="vendors.delete"
                    showToast={true}
                    actionName="delete vendors"
                  >
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (checkPermission('vendors.delete', 'delete vendors')) {
                          setShowDeleteDialog(true);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </PermissionGuard>
                </div>
              )}
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Error loading vendor details. Please try again.</p>
            </div>
          ) : vendor ? (
            <div className="space-y-6">
              {/* Status Badge and Quick Status Change */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge
                    className={`${getStatusByValue(vendor.status)?.bgColor || 'bg-gray-100'} ${getStatusByValue(vendor.status)?.textColor || 'text-gray-800'}`}
                  >
                    {getStatusByValue(vendor.status)?.label || vendor.status}
                  </Badge>
                  {vendor.lifecycle_stage && (
                    <VendorLifecycleStageBadge stage={vendor.lifecycle_stage} />
                  )}
                  {vendor.average_rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{vendor.average_rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({vendor.total_ratings || 0})</span>
                    </div>
                  )}
                </div>
                {canEdit && !isEditing && (
                  <Select
                    value={vendor.status}
                    onValueChange={handleStatusChange}
                    disabled={updateStatusMutation.isPending}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Change Status" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      {/* Only show Pre-Engagement / Discovery statuses */}
                      {(() => {
                        const discoveryStatuses = getStatusesByPhase('Pre-Engagement / Discovery');
                        return discoveryStatuses.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${status.bgColor}`} />
                              <span>{status.label}</span>
                            </div>
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {isEditing ? (
                /* Edit Mode */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        Add
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tax_id">Tax ID (TIN)</Label>
                      <Input
                        id="tax_id"
                        value={formData.tax_id}
                        onChange={(e) => handleInputChange('tax_id', e.target.value)}
                      />
                    </div>
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
                    <Select 
                      value={formData.payment_terms} 
                      onValueChange={(value) => handleInputChange('payment_terms', value)}
                    >
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact_person">Contact Person</Label>
                      <Input
                        id="contact_person"
                        value={formData.contact_person}
                        onChange={(e) => handleInputChange('contact_person', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">Contact Phone</Label>
                      <Input
                        id="contact_phone"
                        value={formData.contact_phone}
                        onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    />
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

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={updateVendorMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={updateVendorMutation.isPending}
                    >
                      {updateVendorMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="space-y-6">
                  {/* Business Name Section */}
                  <div className="pb-4 border-b">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Building className="h-6 w-6 text-primary" />
                      {vendor.name}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Business Name</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Basic Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{vendor.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{vendor.phone}</span>
                        </div>
                        {vendor.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a 
                              href={vendor.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              {vendor.website}
                            </a>
                          </div>
                        )}
                        {vendor.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="text-sm">{vendor.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Additional Information
                      </h3>
                      <div className="space-y-3">
                        {vendor.tax_id && (
                          <div>
                            <span className="text-sm font-medium">Tax ID:</span>
                            <span className="text-sm ml-2">{vendor.tax_id}</span>
                          </div>
                        )}
                        {vendor.business_license && (
                          <div>
                            <span className="text-sm font-medium">Business License:</span>
                            <span className="text-sm ml-2">{vendor.business_license}</span>
                          </div>
                        )}
                        {vendor.payment_terms && (
                          <div>
                            <span className="text-sm font-medium">Payment Terms:</span>
                            <span className="text-sm ml-2">{vendor.payment_terms.replace('_', ' ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Person Information Section */}
                  {(vendor.contact_person || vendor.contact_phone || vendor.contact_email) && (
                    <div className="space-y-4 border-t pt-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Contact Person Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {vendor.contact_person && (
                          <div>
                            <span className="text-sm font-medium">Name:</span>
                            <p className="text-sm text-muted-foreground mt-1">{vendor.contact_person}</p>
                          </div>
                        )}
                        {vendor.contact_phone && (
                          <div>
                            <span className="text-sm font-medium">Phone:</span>
                            <p className="text-sm text-muted-foreground mt-1">{vendor.contact_phone}</p>
                          </div>
                        )}
                        {vendor.contact_email && (
                          <div>
                            <span className="text-sm font-medium">Email:</span>
                            <p className="text-sm text-muted-foreground mt-1">{vendor.contact_email}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Legal Documents Section */}
                  {vendor.documents && vendor.documents.length > 0 && (
                    <div className="space-y-4 border-t pt-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Legal Documents ({vendor.documents.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {vendor.documents.map((doc: any, index: number) => (
                          <div key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                            <FileText className="h-5 w-5 text-primary" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{doc.file_name || doc.name || `Document ${index + 1}`}</p>
                              {doc.file_type && (
                                <p className="text-xs text-muted-foreground">{doc.file_type}</p>
                              )}
                            </div>
                            {doc.file_path && (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <a
                                  href={doc.file_path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs"
                                >
                                  View
                                </a>
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Services Provided</h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(vendor.services_provided) 
                        ? vendor.services_provided.map((service: string, idx: number) => (
                            <Badge key={idx} variant="outline">
                              {service}
                            </Badge>
                          ))
                        : typeof vendor.services_provided === 'string'
                        ? JSON.parse(vendor.services_provided || '[]').map((service: string, idx: number) => (
                            <Badge key={idx} variant="outline">
                              {service}
                            </Badge>
                          ))
                        : null
                      }
                    </div>
                  </div>

                  {vendor.notes && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Notes</h3>
                      <p className="text-sm text-muted-foreground">{vendor.notes}</p>
                    </div>
                  )}

                  {vendor.creator && (
                    <div className="pt-4 border-t text-sm text-muted-foreground">
                      <p>Created by: {vendor.creator.name || vendor.creator.email} on {new Date(vendor.created_at).toLocaleDateString()}</p>
                      {vendor.organizer && (
                        <p>Organizer: {vendor.organizer.name}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vendor
              "{vendor?.name}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteVendorMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteVendorMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteVendorMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

