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
  Mail,
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
import { ModernConfirmationDialog } from '@/components/ui/ModernConfirmationDialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

import FormBuilderDialog from './FormBuilderDialog';
import CreateFormDialog from './CreateFormDialog';
import FormSubmissionsViewer from './FormSubmissionsViewer';

import { formApi } from '@/lib/api/forms';
import type { Form, GuestType } from '@/types/forms';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface FormsListProps {
  eventId: number;
  isTicketed?: boolean;
  onCreateForm?: () => void;
}

export const FormsList: React.FC<FormsListProps> = ({
  eventId,
  isTicketed = false,
  onCreateForm
}) => {
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [builderForm, setBuilderForm] = useState<Form | null>(null);
  const [showSubmissionsViewer, setShowSubmissionsViewer] = useState(false);
  const [showCreateFormDialog, setShowCreateFormDialog] = useState(false);
  const [formToDelete, setFormToDelete] = useState<Form | null>(null);
  const [formForRegistrationLink, setFormForRegistrationLink] = useState<Form | null>(null);
  const [createTypeId, setCreateTypeId] = useState<number | null>(null);

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

  const availableTypes: GuestType[] = isTicketed
    ? (eventData?.ticketTypes || [])
    : (eventData?.guestTypes || []);

  const typeLabel = isTicketed ? 'Ticket Type' : 'Guest Type';
  const typeLabelPlural = isTicketed ? 'Ticket Types' : 'Guest Types';

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
    setBuilderForm(form);
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

  const openCreateDialog = (guestTypeId: number | null = null) => {
    setCreateTypeId(guestTypeId);
    setShowCreateFormDialog(true);
  };

  // Each guest type has one form: open it if it exists, otherwise start a new one.
  const handleCreateFormForGuestType = (guestTypeId: number) => {
    const existingForm = forms?.find(f => f.guest_type_id === guestTypeId);
    if (existingForm) {
      setBuilderForm(existingForm);
    } else {
      openCreateDialog(guestTypeId);
    }
  };

  const takenTypeIds = (forms ?? [])
    .map((form) => form.guest_type_id)
    .filter((id): id is number => typeof id === 'number');

  // Group forms by guest type - only include guest types that have forms
  const formsByGuestType = React.useMemo(() => {
    const grouped: Record<number, { guestType: GuestType; forms: Form[] }> = {};

    // Only add guest types that have forms
    forms?.forEach(form => {
      if (form.guest_type_id) {
        const guestType = availableTypes.find(gt => gt.id === form.guest_type_id);
        if (guestType) {
          if (!grouped[form.guest_type_id]) {
            grouped[form.guest_type_id] = { guestType, forms: [] };
          }
          grouped[form.guest_type_id].forms.push(form);
        }
      }
    });

    return grouped;
  }, [forms, availableTypes]);

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
            onClick={() => openCreateDialog()}
            disabled={availableTypes.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Form Anyway
          </Button>
        </div>
        {availableTypes.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No {typeLabel.toLowerCase()}s found for this event. Please create {typeLabel.toLowerCase()}s first before creating forms.
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
            Create and manage custom registration forms for different {typeLabel.toLowerCase()}s
          </p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => openCreateDialog()}
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
                              <DropdownMenuItem
                                onSelect={() => {
                                  // Open after the menu has released focus, otherwise the
                                  // editor treats that focus return as a click away and closes.
                                  window.setTimeout(() => handleEditForm(form), 0);
                                }}
                              >
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
                onClick={() => openCreateDialog()}
                className="flex items-center gap-2 mx-auto"
                disabled={availableTypes.length === 0}
              >
                <Plus className="w-4 h-4" />
                Create New Form
              </Button>
              {availableTypes.length === 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  Please create {typeLabel.toLowerCase()}s for this event first.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Builder Dialog */}
      <FormBuilderDialog form={builderForm} eventId={eventId} onClose={() => setBuilderForm(null)} />

      {/* Submissions Viewer Dialog */}
      <Dialog open={showSubmissionsViewer} onOpenChange={setShowSubmissionsViewer}>
        <DialogContent className="w-[95vw] max-w-7xl max-h-[90vh] overflow-hidden p-4 sm:p-6">
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
      <ModernConfirmationDialog
        isOpen={!!formToDelete}
        onClose={() => {
          if (!deleteFormMutation.isPending) setFormToDelete(null);
        }}
        onConfirm={confirmDeleteForm}
        title="Delete form"
        description={formToDelete
          ? `Delete “${formToDelete.name}”? This cannot be undone.${formToDelete.formSubmissions_count ? ` This form has ${formToDelete.formSubmissions_count} submission${formToDelete.formSubmissions_count === 1 ? '' : 's'} that will also be deleted.` : ''}`
          : undefined}
        confirmText="Delete form"
        cancelText="Keep form"
        variant="danger"
        isLoading={deleteFormMutation.isPending}
      />

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
                      <div>{typeLabel}: {formForRegistrationLink.guest_type.name}</div>
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

      {/* Create Form Dialog */}
      <CreateFormDialog
        open={showCreateFormDialog}
        onOpenChange={setShowCreateFormDialog}
        eventId={eventId}
        types={availableTypes}
        typeLabel={isTicketed ? 'Ticket type' : 'Guest type'}
        takenTypeIds={takenTypeIds}
        defaultTypeId={createTypeId}
        onCreated={(form) => {
          setShowCreateFormDialog(false);
          setBuilderForm(form);
        }}
        onExisting={(form) => {
          setShowCreateFormDialog(false);
          setBuilderForm(form);
        }}
      />

    </div>
  );
};

export default FormsList;
