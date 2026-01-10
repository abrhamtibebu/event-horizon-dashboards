import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit,
  Copy,
  Trash2,
  Eye,
  MoreHorizontal,
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  X,
  Type,
  Mail,
  Phone,
  Calendar,
  List,
  CheckSquare,
  Hash,
  MapPin,
  Upload,
  GripVertical,
  Sparkles,
  Wand2,
  PlusCircle,
  Link2,
  Share2,
  ExternalLink,
  QrCode,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  MessageSquare,
  Send,
  Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

import FormBuilder from './FormBuilder';
import FormSubmissionsViewer from './FormSubmissionsViewer';

import { formApi, formFieldApi } from '@/lib/api/forms';
import type { Form, GuestType, CreateFormFieldRequest, FieldType } from '@/types/forms';
import api from '@/lib/api';
import { toast } from 'sonner';
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

interface FormsListProps {
  eventId: number;
  onCreateForm?: () => void;
}

export const FormsList: React.FC<FormsListProps> = ({
  eventId,
  onCreateForm
}) => {
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [showSubmissionsViewer, setShowSubmissionsViewer] = useState(false);
  const [showCreateFormDialog, setShowCreateFormDialog] = useState(false);
  const [formToDelete, setFormToDelete] = useState<Form | null>(null);
  const [formForRegistrationLink, setFormForRegistrationLink] = useState<Form | null>(null);
  const [selectedGuestTypeId, setSelectedGuestTypeId] = useState<number | null>(null);
  const [newFormName, setNewFormName] = useState('');
  const [newFormDescription, setNewFormDescription] = useState('');
  const [createFormStep, setCreateFormStep] = useState<1 | 2>(1);
  const [selectedFields, setSelectedFields] = useState<CreateFormFieldRequest[]>([]);

  const queryClient = useQueryClient();

  // Fetch event data to get guest types
  const { data: eventData } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}`);
      return response.data;
    },
    enabled: !!eventId,
  });

  const guestTypes: GuestType[] = eventData?.guestTypes || [];

  // Fetch forms for the event
  const {
    data: forms,
    isLoading,
    error
  } = useQuery({
    queryKey: ['event-forms', eventId],
    queryFn: async () => {
      try {
        const result = await formApi.getEventForms(eventId);
        // Ensure we always return an array
        return Array.isArray(result) ? result : [];
      } catch (err: any) {
        console.error('Error fetching forms:', err);
        // Log detailed error for debugging
        if (err?.response) {
          console.error('API Error Response:', {
            status: err.response.status,
            data: err.response.data,
            headers: err.response.headers
          });
        }
        throw err;
      }
    },
    enabled: !!eventId,
    retry: 1,
  });

  // Create form with fields mutation (for two-step wizard)
  const createFormWithFieldsMutation = useMutation({
    mutationFn: async (data: { 
      name: string; 
      description?: string; 
      guest_type_id: number;
      fields: CreateFormFieldRequest[];
    }) => {
      try {
        // First create the form
        const form = await formApi.createForm(eventId, {
          name: data.name,
          description: data.description,
          guest_type_id: data.guest_type_id,
        });

        // Then create all fields
        if (data.fields.length > 0) {
          const fieldPromises = data.fields.map((field, index) => {
            // Ensure all required fields are properly formatted
            const fieldData: CreateFormFieldRequest = {
              field_type: field.field_type,
              label: field.label,
              placeholder: field.placeholder || '',
              is_required: field.is_required || false,
              order: index + 1,
              page_number: field.page_number || 1,
            };
            
            // Only include options if they exist
            if (field.options && field.options.length > 0) {
              fieldData.options = field.options;
            }
            
            return formFieldApi.createField(form.id, fieldData);
          });
          
          await Promise.all(fieldPromises);
        }

        // Return the form with fields loaded
        return formApi.getForm(form.id);
      } catch (error: any) {
        // Log detailed error information
        console.error('Error in createFormWithFieldsMutation:', error);
        console.error('Error response:', error?.response?.data);
        console.error('Request data:', data);
        throw error;
      }
    },
    onSuccess: (newForm) => {
      queryClient.invalidateQueries({ queryKey: ['event-forms', eventId] });
      toast.success('Form created successfully with fields!');
      setShowCreateFormDialog(false);
      setCreateFormStep(1);
      setSelectedFields([]);
      setSelectedForm(newForm);
      setShowFormBuilder(true);
      setNewFormName('');
      setNewFormDescription('');
      setSelectedGuestTypeId(null);
    },
    onError: (error: any) => {
      console.error('Failed to create form:', error);
      console.error('Error response:', error?.response?.data);
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to create form';
      
      // Handle specific error cases
      if (errorMessage.includes('already exists') || errorMessage.includes('already exists for this guest type')) {
        toast.error('A form already exists for this guest type. Please edit the existing form instead.');
      } else if (errorMessage.includes('Integrity constraint') || errorMessage.includes('UNIQUE constraint')) {
        toast.error('A form with these details already exists. Please check for duplicate forms.');
      } else {
        toast.error(`Failed to create form: ${errorMessage}`);
      }
    }
  });

  // Delete form mutation
  const deleteFormMutation = useMutation({
    mutationFn: (formId: number) => formApi.deleteForm(formId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-forms', eventId] });
      toast.success('Form deleted successfully');
      setFormToDelete(null);
    },
    onError: (error: any) => {
      console.error('Failed to delete form:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to delete form';
      toast.error(errorMessage);
    }
  });

  // Activate form mutation
  const activateFormMutation = useMutation({
    mutationFn: (formId: number) => formApi.activateForm(formId),
    onSuccess: (updatedForm) => {
      queryClient.invalidateQueries({ queryKey: ['event-forms', eventId] });
      // Update the form in the dialog state
      if (formForRegistrationLink && formForRegistrationLink.id === updatedForm.id) {
        setFormForRegistrationLink(updatedForm);
      }
      toast.success('Form activated successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to activate form:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to activate form';
      toast.error(errorMessage);
    }
  });

  // Duplicate form mutation
  const duplicateFormMutation = useMutation({
    mutationFn: (formId: number) => formApi.duplicateForm(formId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-forms', eventId] });
    },
    onError: (error: any) => {
      console.error('Failed to duplicate form:', error);
    }
  });

  const handleEditForm = (form: Form) => {
    setSelectedForm(form);
    setShowFormBuilder(true);
  };

  const handleViewSubmissions = (form: Form) => {
    setSelectedForm(form);
    setShowSubmissionsViewer(true);
  };

  const handleDuplicateForm = (form: Form) => {
    duplicateFormMutation.mutate(form.id);
  };

  const handleDeleteForm = (form: Form) => {
    setFormToDelete(form);
  };

  const handleCreateFormForGuestType = (guestTypeId: number) => {
    const existingForm = forms?.find(f => f.guest_type_id === guestTypeId);
    if (existingForm) {
      // If form exists, open it for editing instead
      setSelectedForm(existingForm);
      setShowFormBuilder(true);
    } else {
      // If no form exists, open create dialog
      setSelectedGuestTypeId(guestTypeId);
      const guestType = guestTypes.find(gt => gt.id === guestTypeId);
      setNewFormName(`${guestType?.name || 'Guest'} Registration Form`);
      setShowCreateFormDialog(true);
    }
  };

  const handleCreateForm = () => {
    if (!selectedGuestTypeId || !newFormName.trim()) {
      return;
    }
    
    // If we're on step 2, create form with fields
    if (createFormStep === 2) {
      createFormWithFieldsMutation.mutate({
        name: newFormName.trim(),
        description: newFormDescription.trim() || undefined,
        guest_type_id: selectedGuestTypeId,
        fields: selectedFields,
      });
    } else {
      // Step 1: Move to step 2
      setCreateFormStep(2);
    }
  };

  const handleBackToStep1 = () => {
    setCreateFormStep(1);
  };

  const handleAddCommonField = (fieldType: FieldType, label: string, placeholder?: string) => {
    const newField: CreateFormFieldRequest = {
      field_type: fieldType,
      label,
      placeholder: placeholder || '',
      is_required: false,
      order: selectedFields.length + 1,
      page_number: 1,
      options: fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox' 
        ? [{ label: 'Option 1', value: 'option1' }]
        : undefined,
    };
    setSelectedFields([...selectedFields, newField]);
  };

  const handleAddCustomField = () => {
    const newField: CreateFormFieldRequest = {
      field_type: 'text',
      label: 'New Field',
      placeholder: '',
      is_required: false,
      order: selectedFields.length + 1,
      page_number: 1,
    };
    setSelectedFields([...selectedFields, newField]);
  };

  const handleUpdateField = (index: number, updates: Partial<CreateFormFieldRequest>) => {
    const updatedFields = [...selectedFields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setSelectedFields(updatedFields);
  };

  const handleAddOption = (fieldIndex: number) => {
    const updatedFields = [...selectedFields];
    const currentOptions = updatedFields[fieldIndex].options || [];
    updatedFields[fieldIndex] = {
      ...updatedFields[fieldIndex],
      options: [...currentOptions, { label: `Option ${currentOptions.length + 1}`, value: `option${currentOptions.length + 1}` }]
    };
    setSelectedFields(updatedFields);
  };

  const handleUpdateOption = (fieldIndex: number, optionIndex: number, updates: { label?: string; value?: string }) => {
    const updatedFields = [...selectedFields];
    const currentOptions = updatedFields[fieldIndex].options || [];
    currentOptions[optionIndex] = { ...currentOptions[optionIndex], ...updates };
    updatedFields[fieldIndex] = {
      ...updatedFields[fieldIndex],
      options: currentOptions
    };
    setSelectedFields(updatedFields);
  };

  const handleRemoveOption = (fieldIndex: number, optionIndex: number) => {
    const updatedFields = [...selectedFields];
    const currentOptions = updatedFields[fieldIndex].options || [];
    updatedFields[fieldIndex] = {
      ...updatedFields[fieldIndex],
      options: currentOptions.filter((_, i) => i !== optionIndex)
    };
    setSelectedFields(updatedFields);
  };

  const handleRemoveField = (index: number) => {
    setSelectedFields(selectedFields.filter((_, i) => i !== index));
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...selectedFields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newFields.length) {
      [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
      // Update order
      newFields.forEach((field, i) => {
        field.order = i + 1;
      });
      setSelectedFields(newFields);
    }
  };

  // Group forms by guest type - only include guest types that have forms
  const formsByGuestType = React.useMemo(() => {
    const grouped: Record<number, { guestType: GuestType; forms: Form[] }> = {};
    
    // Only add guest types that have forms
    forms?.forEach(form => {
      if (form.guest_type_id) {
        const guestType = guestTypes.find(gt => gt.id === form.guest_type_id);
        if (guestType) {
          if (!grouped[form.guest_type_id]) {
            grouped[form.guest_type_id] = { guestType, forms: [] };
          }
          grouped[form.guest_type_id].forms.push(form);
        }
      }
    });
    
    return grouped;
  }, [forms, guestTypes]);

  const confirmDeleteForm = () => {
    if (formToDelete) {
      deleteFormMutation.mutate(formToDelete.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'draft':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Draft</Badge>;
      case 'inactive':
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFormTypeIcon = (formType: string) => {
    switch (formType) {
      case 'attendee':
        return <Users className="w-4 h-4" />;
      case 'exhibitor':
        return <FileText className="w-4 h-4" />;
      case 'speaker':
        return <FileText className="w-4 h-4" />;
      case 'staff':
        return <Settings className="w-4 h-4" />;
      case 'sponsor':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="w-20 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const apiError = (error as any)?.response?.data?.error || (error as any)?.response?.data?.message;
    const statusCode = (error as any)?.response?.status;
    
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Failed to load forms</p>
              {apiError && (
                <p className="text-sm">Error: {apiError}</p>
              )}
              {statusCode && (
                <p className="text-xs text-muted-foreground">HTTP {statusCode}</p>
              )}
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-muted-foreground font-mono">{errorMessage}</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['event-forms', eventId] });
            }}
          >
            Retry
          </Button>
          <Button
            onClick={() => setShowCreateFormDialog(true)}
            disabled={guestTypes.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Form Anyway
          </Button>
        </div>
        {guestTypes.length === 0 && (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
              No guest types found for this event. Please create guest types first before creating forms.
        </AlertDescription>
      </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Registration Forms</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage custom registration forms for different guest types
          </p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setShowCreateFormDialog(true)}
        >
              <Plus className="w-4 h-4" />
              Create New Form
            </Button>
      </div>

      {/* Forms List - Only show created forms */}
      {forms && forms.length > 0 ? (
        <div className="space-y-6">
          {Object.values(formsByGuestType).map(({ guestType, forms: guestTypeForms }) => (
            <div key={guestType.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-semibold">{guestType.name}</h4>
                  {guestType.description && (
                    <p className="text-sm text-muted-foreground">{guestType.description}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateFormForGuestType(guestType.id)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Form
                </Button>
              </div>

        <div className="grid gap-4">
                {guestTypeForms.map((form) => (
            <Card key={form.id} className={`hover:shadow-md transition-shadow ${form.status === 'draft' ? 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20' : ''}`}>
              <CardContent className="p-6">
                {form.status === 'draft' && (
                  <Alert className="mb-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800 dark:text-orange-200">
                      This form is in draft status. Click "Activate" to enable public registration.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Form Icon */}
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4" />
                    </div>

                    {/* Form Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground truncate">
                          {form.name}
                        </h4>
                        {getStatusBadge(form.status)}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {form.formSubmissions_count !== undefined && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {form.formSubmissions_count} submissions
                          </span>
                        )}
                        {form.is_multi_page && (
                          <Badge variant="outline" className="text-xs">
                            Multi-page
                          </Badge>
                        )}
                        {form.expires_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expires: {new Date(form.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {form.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {form.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {form.status === 'draft' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => activateFormMutation.mutate(form.id)}
                        disabled={activateFormMutation.isPending}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                      >
                        {activateFormMutation.isPending ? (
                          <>
                            <Clock className="w-3 h-3 animate-spin" />
                            Activating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Activate
                          </>
                        )}
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSubmissions(form)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Submissions
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditForm(form)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Form
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormForRegistrationLink(form)}>
                          <Link2 className="w-4 h-4 mr-2" />
                          Get Registration Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateForm(form)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteForm(form)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State - Only show when no forms exist */
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No forms created yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first registration form to start collecting participant information.
                Forms can be customized for different guest types with custom input fields,
                validation rules, and badge field mapping.
              </p>
              <Button 
                onClick={() => setShowCreateFormDialog(true)} 
                className="flex items-center gap-2 mx-auto"
                disabled={guestTypes.length === 0}
              >
                <Plus className="w-4 h-4" />
                Create New Form
              </Button>
              {guestTypes.length === 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  Please create guest types for this event first.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Builder Dialog */}
      <Dialog open={showFormBuilder} onOpenChange={setShowFormBuilder}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {selectedForm ? `Edit: ${selectedForm.name}` : 'Create New Form'}
            </DialogTitle>
          </DialogHeader>
          {selectedForm && (
            <FormBuilder
              formId={selectedForm.id}
              eventId={eventId}
              onSave={() => {
                setShowFormBuilder(false);
                setSelectedForm(null);
                queryClient.invalidateQueries({ queryKey: ['event-forms', eventId] });
              }}
              onCancel={() => {
                setShowFormBuilder(false);
                setSelectedForm(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Submissions Viewer Dialog */}
      <Dialog open={showSubmissionsViewer} onOpenChange={setShowSubmissionsViewer}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {selectedForm ? `Submissions: ${selectedForm.name}` : 'Form Submissions'}
            </DialogTitle>
            <DialogDescription>
              View and manage form submissions
            </DialogDescription>
          </DialogHeader>
          {selectedForm && (
            <FormSubmissionsViewer
              formId={selectedForm.id}
              onClose={() => {
                setShowSubmissionsViewer(false);
                setSelectedForm(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!formToDelete} onOpenChange={() => setFormToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{formToDelete?.name}"? This action cannot be undone.
              {formToDelete?.formSubmissions_count && formToDelete.formSubmissions_count > 0 && (
                <span className="block mt-2 font-medium text-destructive">
                  Warning: This form has {formToDelete.formSubmissions_count} submissions that will also be deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteForm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteFormMutation.isPending}
            >
              {deleteFormMutation.isPending ? 'Deleting...' : 'Delete Form'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Registration Link Dialog */}
      <Dialog open={!!formForRegistrationLink} onOpenChange={(open) => !open && setFormForRegistrationLink(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Public Registration Link
            </DialogTitle>
            <DialogDescription>
              Share this registration link with potential attendees. The link allows public registration using your custom form fields.
            </DialogDescription>
          </DialogHeader>
          {formForRegistrationLink && formForRegistrationLink.status === 'active' ? (
            <div className="space-y-6">
              {/* Registration Link Section */}
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/30">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Registration Link
                </h3>
                <div className="flex items-center gap-2">
                  <Input
                    value={`${window.location.origin}/form/register/${formForRegistrationLink.id}`}
                    readOnly
                    className="text-sm bg-background border-primary/40 focus:border-primary"
                    onClick={e => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/form/register/${formForRegistrationLink.id}`);
                      toast.success('Registration link copied to clipboard!');
                    }}
                    variant="outline"
                    className="bg-background hover:bg-accent border-primary/40 text-primary"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="bg-gradient-to-r from-success/10 to-success/20 rounded-lg p-4 border border-success/30">
                <h3 className="text-sm font-semibold text-success dark:text-success mb-3 flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  QR Code
                </h3>
                <div className="flex items-center gap-4">
                  <div className="bg-background p-3 rounded-lg border border-success/30">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/form/register/${formForRegistrationLink.id}`)}&format=png&margin=10&color=1F2937&bgcolor=FFFFFF`} 
                      alt="QR Code for registration" 
                      className="w-24 h-24" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(`${window.location.origin}/form/register/${formForRegistrationLink.id}`)}&format=png&margin=10&color=1F2937&bgcolor=FFFFFF`;
                        link.download = `form-registration-qr-${formForRegistrationLink.name.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
                        link.click();
                        toast.success('QR code downloaded!');
                      }}
                      className="bg-background hover:bg-success/10 border-success/50 text-success dark:text-success"
                    >
                      Download QR
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/form/register/${formForRegistrationLink.id}`);
                        toast.success('Link copied! Scan the QR code or share the link.');
                      }}
                      className="bg-background hover:bg-success/10 border-success/50 text-success dark:text-success"
                    >
                      Copy Link
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Share Section */}
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/30">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Quick Share
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-background hover:bg-primary/10 border-primary/50 text-primary dark:text-primary"
                    onClick={() => {
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/form/register/${formForRegistrationLink.id}`)}&quote=${encodeURIComponent('Register using: ' + formForRegistrationLink.name)}`, '_blank');
                    }}
                  >
                    <Facebook className="w-4 h-4 mr-1" />
                    Facebook
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-background hover:bg-primary/10 border-primary/50 text-primary dark:text-primary"
                    onClick={() => {
                      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/form/register/${formForRegistrationLink.id}`)}&text=${encodeURIComponent('Register using: ' + formForRegistrationLink.name)}&hashtags=registration,form`, '_blank');
                    }}
                  >
                    <Twitter className="w-4 h-4 mr-1" />
                    Twitter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-background hover:bg-success/10 border-success/50 text-success dark:text-success"
                    onClick={() => {
                      window.open(`https://wa.me/?text=${encodeURIComponent('Register using: ' + formForRegistrationLink.name + ': ' + window.location.origin + '/form/register/' + formForRegistrationLink.id)}`, '_blank');
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-background hover:bg-destructive/10 border-destructive/50 text-destructive dark:text-destructive"
                    onClick={() => {
                      const emailBody = `Hi,\n\nYou're invited to register using this form: ${formForRegistrationLink.name}\n\nRegistration Link: ${window.location.origin}/form/register/${formForRegistrationLink.id}\n\nBest regards`;
                      window.open(`mailto:?subject=${encodeURIComponent('Registration Invitation: ' + formForRegistrationLink.name)}&body=${encodeURIComponent(emailBody)}`);
                    }}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-background hover:bg-primary/10 border-primary/50 text-primary dark:text-primary"
                    onClick={() => {
                      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}/form/register/${formForRegistrationLink.id}`)}`, '_blank');
                    }}
                  >
                    <Linkedin className="w-4 h-4 mr-1" />
                    LinkedIn
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-background hover:bg-muted border-border text-muted-foreground"
                    onClick={() => {
                      const text = `Register using: ${formForRegistrationLink.name}: ${window.location.origin}/form/register/${formForRegistrationLink.id}`;
                      navigator.clipboard.writeText(text);
                      toast.success('Registration message copied to clipboard!');
                    }}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Text
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-background hover:bg-warning/10 border-warning/50 text-warning dark:text-warning"
                    onClick={() => {
                      const smsText = `Register using: ${formForRegistrationLink.name}: ${window.location.origin}/form/register/${formForRegistrationLink.id}`;
                      window.open(`sms:?body=${encodeURIComponent(smsText)}`);
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    SMS
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-background hover:bg-primary/10 border-primary/50 text-primary dark:text-primary"
                    onClick={() => {
                      window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '/form/register/' + formForRegistrationLink.id)}&text=${encodeURIComponent('Register using: ' + formForRegistrationLink.name)}`, '_blank');
                    }}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Telegram
                  </Button>
                </div>
              </div>

              {/* Embeddable Section */}
              <div className="bg-gradient-to-r from-warning/10 to-primary/10 rounded-lg p-4 border border-warning/30">
                <h3 className="text-sm font-semibold text-warning dark:text-warning mb-3 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Embed on Website
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">HTML Embed Code:</label>
                    <Input
                      value={`<iframe src='${window.location.origin}/form/register/${formForRegistrationLink.id}' width='100%' height='600' style='border:none; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);'></iframe>`}
                      readOnly
                      className="text-xs bg-background font-mono border-warning/30"
                      onClick={e => (e.target as HTMLInputElement).select()}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Direct Link:</label>
                    <Input
                      value={`${window.location.origin}/form/register/${formForRegistrationLink.id}`}
                      readOnly
                      className="text-xs bg-background font-mono border-warning/30"
                      onClick={e => (e.target as HTMLInputElement).select()}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const embedCode = `<iframe src='${window.location.origin}/form/register/${formForRegistrationLink.id}' width='100%' height='600' style='border:none; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);'></iframe>`;
                        navigator.clipboard.writeText(embedCode);
                        toast.success('Embed code copied to clipboard!');
                      }}
                      className="bg-background hover:bg-warning/10 border-warning/50 text-warning dark:text-warning"
                    >
                      Copy Embed Code
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const link = `${window.location.origin}/form/register/${formForRegistrationLink.id}`;
                        navigator.clipboard.writeText(link);
                        toast.success('Direct link copied to clipboard!');
                      }}
                      className="bg-background hover:bg-warning/10 border-warning/50 text-warning dark:text-warning"
                    >
                      Copy Direct Link
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 <strong>Tip:</strong> Copy the HTML code and paste it into your website to embed the registration form directly.
                  </p>
                </div>
              </div>

              {/* Form Details */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1">Form Details</div>
                  <div className="text-sm text-muted-foreground">
                    <div>Form: {formForRegistrationLink.name}</div>
                    {formForRegistrationLink.guest_type && (
                      <div>Guest Type: {formForRegistrationLink.guest_type.name}</div>
                    )}
                    <div>Status: {formForRegistrationLink.status}</div>
                    {formForRegistrationLink.formFields && (
                      <div>Fields: {formForRegistrationLink.formFields.length} custom field(s)</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This form is currently {formForRegistrationLink?.status || 'inactive'}. Only active forms can accept public registrations.
                </AlertDescription>
              </Alert>
              
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Activate Form</h3>
                    <p className="text-sm text-muted-foreground">
                      Activate this form to enable public registration. Once activated, you can share the registration link.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      if (formForRegistrationLink) {
                        activateFormMutation.mutate(formForRegistrationLink.id);
                      }
                    }}
                    disabled={activateFormMutation.isPending}
                    className="ml-4"
                  >
                    {activateFormMutation.isPending ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Activating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Activate Form
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Show registration link preview even when inactive */}
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/30">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Registration Link (Preview)
                </h3>
                <div className="flex items-center gap-2">
                  <Input
                    value={`${window.location.origin}/form/register/${formForRegistrationLink?.id}`}
                    readOnly
                    className="text-sm bg-background border-primary/40 focus:border-primary opacity-60"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/form/register/${formForRegistrationLink?.id}`);
                      toast.success('Registration link copied to clipboard!');
                    }}
                    className="bg-background hover:bg-accent border-primary/40 text-primary"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This link will be active once you activate the form.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Form Dialog - Two Step Wizard */}
      <Dialog open={showCreateFormDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateFormDialog(false);
          setCreateFormStep(1);
          setSelectedFields([]);
          setSelectedGuestTypeId(null);
          setNewFormName('');
          setNewFormDescription('');
        } else {
          setShowCreateFormDialog(open);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Create New Registration Form
            </DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-2 mt-2">
                <div className={`flex items-center gap-2 ${createFormStep === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${createFormStep === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    1
                  </div>
                  <span className="text-sm font-medium">Form Details</span>
                </div>
                <div className="h-px w-8 bg-border" />
                <div className={`flex items-center gap-2 ${createFormStep === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${createFormStep === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    2
                  </div>
                  <span className="text-sm font-medium">Add Fields</span>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {createFormStep === 1 ? (
              /* Step 1: Form Details */
              <div className="space-y-4">
                <div>
                  <Label htmlFor="guest-type">Guest Type *</Label>
                  <Select
                    value={selectedGuestTypeId?.toString() || ''}
                    onValueChange={(value) => setSelectedGuestTypeId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a guest type" />
                    </SelectTrigger>
                    <SelectContent>
                      {guestTypes.map(gt => {
                        const existingForm = forms?.find(f => f.guest_type_id === gt.id);
                        return (
                          <SelectItem key={gt.id} value={gt.id.toString()}>
                            {gt.name}
                            {existingForm && (
                              <span className="text-xs text-muted-foreground ml-2">(Form exists)</span>
                            )}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {selectedGuestTypeId && forms?.some(f => f.guest_type_id === selectedGuestTypeId) && (
                    <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ A form already exists for this guest type. You can edit the existing form or create a new one (which will require deleting the existing form first).
                      </p>
                    </div>
                  )}
                  {guestTypes.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      No guest types found. Please create guest types for this event first.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="form-name">Form Name *</Label>
                  <Input
                    id="form-name"
                    value={newFormName}
                    onChange={(e) => setNewFormName(e.target.value)}
                    placeholder="e.g., Speaker Registration Form"
                  />
                </div>
                <div>
                  <Label htmlFor="form-description">Description</Label>
                  <Textarea
                    id="form-description"
                    value={newFormDescription}
                    onChange={(e) => setNewFormDescription(e.target.value)}
                    placeholder="Optional description for this form"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              /* Step 2: Add Fields - Modern Redesign */
              <div className="space-y-6">
                {/* Header Section */}
                <div className="border-b pb-4">
                  <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Add Form Fields
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Build your registration form by selecting common fields or creating custom ones
                  </p>
                </div>

                {/* Common Fields Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Quick Add Fields</Label>
                    <Badge variant="secondary" className="text-xs">
                      Click to add
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { type: 'text' as FieldType, label: 'Full Name', icon: Type, placeholder: 'Enter full name', color: 'bg-blue-500' },
                      { type: 'email' as FieldType, label: 'Email', icon: Mail, placeholder: 'Enter email address', color: 'bg-green-500' },
                      { type: 'phone' as FieldType, label: 'Phone', icon: Phone, placeholder: 'Enter phone number', color: 'bg-purple-500' },
                      { type: 'text' as FieldType, label: 'Company', icon: FileText, placeholder: 'Enter company name', color: 'bg-orange-500' },
                      { type: 'text' as FieldType, label: 'Job Title', icon: FileText, placeholder: 'Enter job title', color: 'bg-pink-500' },
                      { type: 'date' as FieldType, label: 'Date of Birth', icon: Calendar, placeholder: 'Select date', color: 'bg-indigo-500' },
                      { type: 'address' as FieldType, label: 'Address', icon: MapPin, placeholder: 'Enter address', color: 'bg-red-500' },
                      { type: 'textarea' as FieldType, label: 'Bio/Notes', icon: FileText, placeholder: 'Enter bio or notes', color: 'bg-teal-500' },
                    ].map((field, idx) => {
                      const IconComponent = field.icon;
                      const isAdded = selectedFields.some(f => f.label === field.label && f.field_type === field.type);
                      return (
                        <Card
                          key={idx}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                            isAdded 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:border-primary/50 border-2'
                          }`}
                          onClick={() => !isAdded && handleAddCommonField(field.type, field.label, field.placeholder)}
                        >
                          <CardContent className="p-4">
                            <div className="flex flex-col items-center text-center gap-2">
                              <div className={`w-12 h-12 ${field.color} rounded-xl flex items-center justify-center shadow-sm`}>
                                <IconComponent className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 w-full">
                                <h4 className="font-medium text-sm mb-1">{field.label}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {field.type}
                                </Badge>
                              </div>
                              {isAdded ? (
                                <div className="flex items-center gap-1 text-primary text-xs mt-1">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Added</span>
                                </div>
                              ) : (
                                <Plus className="w-4 h-4 text-muted-foreground mt-1" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Fields List */}
                {selectedFields.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        Form Fields
                        <Badge variant="secondary" className="ml-2">
                          {selectedFields.length}
                        </Badge>
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddCustomField}
                          className="flex items-center gap-2"
                        >
                          <PlusCircle className="w-4 h-4" />
                          Add Custom Field
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {selectedFields.map((field, index) => (
                        <Card 
                          key={index}
                          className="group hover:shadow-md transition-all duration-200 border-2 hover:border-primary/30"
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                              {/* Drag Handle */}
                              <div className="flex flex-col items-center gap-1 pt-1">
                                <GripVertical className="w-5 h-5 text-muted-foreground cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Badge variant="outline" className="text-xs font-mono">
                                  {index + 1}
                                </Badge>
                              </div>

                              {/* Field Content */}
                              <div className="flex-1 space-y-3">
                                {/* Label and Type Row */}
                                <div className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <Label className="text-xs text-muted-foreground mb-1 block">Field Label</Label>
                                    <Input
                                      value={field.label}
                                      onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                                      placeholder="Enter field label"
                                      className="font-medium"
                                    />
                                  </div>
                                  <div className="w-32">
                                    <Label className="text-xs text-muted-foreground mb-1 block">Type</Label>
                                    <Select
                                      value={field.field_type}
                                      onValueChange={(value) => {
                                        const updates: Partial<CreateFormFieldRequest> = { field_type: value as FieldType };
                                        // Initialize options if changing to select/radio/checkbox
                                        if ((value === 'select' || value === 'radio' || value === 'checkbox') && !field.options) {
                                          updates.options = [{ label: 'Option 1', value: 'option1' }];
                                        }
                                        // Remove options if changing away from select/radio/checkbox
                                        if (!['select', 'radio', 'checkbox'].includes(value) && field.options) {
                                          updates.options = undefined;
                                        }
                                        handleUpdateField(index, updates);
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="textarea">Textarea</SelectItem>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="phone">Phone</SelectItem>
                                        <SelectItem value="date">Date</SelectItem>
                                        <SelectItem value="select">Dropdown</SelectItem>
                                        <SelectItem value="radio">Radio</SelectItem>
                                        <SelectItem value="checkbox">Checkbox</SelectItem>
                                        <SelectItem value="number">Number</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Placeholder Row */}
                                <div>
                                  <Label className="text-xs text-muted-foreground mb-1 block">Placeholder Text</Label>
                                  <Input
                                    value={field.placeholder || ''}
                                    onChange={(e) => handleUpdateField(index, { placeholder: e.target.value })}
                                    placeholder="Enter placeholder text (optional)"
                                    className="text-sm"
                                  />
                                </div>

                                {/* Options for Select/Dropdown/Radio/Checkbox */}
                                {(field.field_type === 'select' || field.field_type === 'radio' || field.field_type === 'checkbox') && (
                                  <div className="space-y-2 pt-2 border-t">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-xs text-muted-foreground">Options</Label>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAddOption(index)}
                                        className="h-7 text-xs"
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add Option
                                      </Button>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {(field.options || []).map((option, optIndex) => (
                                        <div key={optIndex} className="flex items-center gap-2">
                                          <Input
                                            value={option.label}
                                            onChange={(e) => handleUpdateOption(index, optIndex, { label: e.target.value })}
                                            placeholder="Option label"
                                            className="flex-1 text-sm"
                                          />
                                          <Input
                                            value={option.value}
                                            onChange={(e) => handleUpdateOption(index, optIndex, { value: e.target.value })}
                                            placeholder="Option value"
                                            className="flex-1 text-sm"
                                          />
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveOption(index, optIndex)}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                            disabled={(field.options || []).length <= 1}
                                          >
                                            <X className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      ))}
                                      {(!field.options || field.options.length === 0) && (
                                        <p className="text-xs text-muted-foreground text-center py-2">
                                          No options added. Click "Add Option" to add choices.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Options Row */}
                                <div className="flex items-center justify-between pt-2 border-t">
                                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={field.is_required || false}
                                      onChange={(e) => handleUpdateField(index, { is_required: e.target.checked })}
                                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="font-medium">Required field</span>
                                  </label>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMoveField(index, 'up')}
                                      disabled={index === 0}
                                      className="h-8 w-8 p-0"
                                      title="Move up"
                                    >
                                      <ArrowUp className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMoveField(index, 'down')}
                                      disabled={index === selectedFields.length - 1}
                                      className="h-8 w-8 p-0"
                                      title="Move down"
                                    >
                                      <ArrowDown className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveField(index)}
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      title="Remove field"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        ))}
                    </div>
                    
                    {/* Add Custom Field Button at Bottom */}
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        onClick={handleAddCustomField}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Add Another Custom Field
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Card className="border-2 border-dashed">
                    <CardContent className="p-12">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h4 className="font-semibold mb-2">No fields added yet</h4>
                        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                          Start building your form by selecting quick-add fields above or create a custom field
                        </p>
                        <Button
                          variant="outline"
                          onClick={handleAddCustomField}
                          className="flex items-center gap-2 mx-auto"
                        >
                          <Wand2 className="w-4 h-4" />
                          Create Custom Field
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                if (createFormStep === 1) {
                  setShowCreateFormDialog(false);
                  setCreateFormStep(1);
                  setSelectedFields([]);
                  setSelectedGuestTypeId(null);
                  setNewFormName('');
                  setNewFormDescription('');
                } else {
                  handleBackToStep1();
                }
              }}
            >
              {createFormStep === 1 ? 'Cancel' : (
                <>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </>
              )}
            </Button>
            <div className="flex gap-2">
              {createFormStep === 2 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    // Skip fields and create form with no fields
                    createFormWithFieldsMutation.mutate({
                      name: newFormName.trim(),
                      description: newFormDescription.trim() || undefined,
                      guest_type_id: selectedGuestTypeId!,
                      fields: [],
                    });
                  }}
                  disabled={!selectedGuestTypeId || !newFormName.trim() || createFormWithFieldsMutation.isPending}
                >
                  Skip & Create Empty Form
                </Button>
              )}
              <Button
                onClick={handleCreateForm}
                disabled={
                  !selectedGuestTypeId || 
                  !newFormName.trim() || 
                  (createFormStep === 2 && createFormWithFieldsMutation.isPending)
                }
              >
                {createFormStep === 1 ? (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  createFormWithFieldsMutation.isPending ? 'Creating...' : 'Create Form'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default FormsList;
