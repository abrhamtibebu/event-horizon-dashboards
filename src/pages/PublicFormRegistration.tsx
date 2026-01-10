import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FormFieldRenderer } from '@/components/public/FormFieldRenderer';
import { formApi, formSubmissionApi } from '@/lib/api/forms';
import type { Form, FormSubmissionRequest } from '@/types/forms';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

export default function PublicFormRegistration() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Fetch form data
  const { data: form, isLoading, error } = useQuery({
    queryKey: ['public-form', formId],
    queryFn: async () => {
      try {
        const formIdNum = parseInt(formId!);
        console.log('Fetching form with ID:', formIdNum);
        console.log('API URL will be:', `/api/forms/${formIdNum}`);
        const result = await formApi.getForm(formIdNum);
        console.log('Form fetched successfully:', result);
        // Normalize field names - handle both snake_case and camelCase
        if (result && (result as any).form_fields && !result.formFields) {
          (result as any).formFields = (result as any).form_fields;
        }
        console.log('Form fields after normalization:', (result as any).formFields || (result as any).form_fields);
        return result;
      } catch (err: any) {
        console.error('Error fetching form:', err);
        console.error('Error response:', err?.response);
        console.error('Error response data:', err?.response?.data);
        console.error('Error response status:', err?.response?.status);
        console.error('Request URL:', err?.config?.url);
        throw err;
      }
    },
    enabled: !!formId,
    retry: 1
  });

  // Fetch event data
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', form?.event_id],
    queryFn: async () => {
      if (!form?.event_id) return null;
      const response = await api.get(`/events/${form.event_id}`);
      return response.data;
    },
    enabled: !!form?.event_id,
    retry: 1
  });

  // Submit form mutation
  const submitMutation = useMutation({
    mutationFn: (data: FormSubmissionRequest) => 
      formSubmissionApi.submitForm(parseInt(formId!), data),
    onSuccess: (response) => {
      toast.success('Registration submitted successfully!');
      
      // Extract attendee and guest data from response
      const attendee = response.data?.attendee || response.attendee;
      const guest = attendee?.guest || response.data?.guest || response.guest;
      const submission = response.data?.submission || response.submission;
      
      // Build success page URL with attendee data
      const params = new URLSearchParams();
      if (attendee?.id) params.set('attendeeId', attendee.id.toString());
      if (form?.event_id) params.set('eventId', form.event_id.toString());
      if (form?.name) params.set('eventName', form.name);
      if (guest?.name) params.set('guestName', guest.name);
      if (guest?.email) params.set('guestEmail', guest.email);
      if (guest?.phone) params.set('guestPhone', guest.phone || '');
      if (guest?.company) params.set('guestCompany', guest.company);
      if (guest?.jobtitle) params.set('guestJobTitle', guest.jobtitle);
      if (guest?.gender) params.set('guestGender', guest.gender);
      if (guest?.country) params.set('guestCountry', guest.country);
      if (form?.guest_type?.name) params.set('guestTypeName', form.guest_type.name);
      if (form?.guest_type?.price !== undefined) params.set('guestTypePrice', form.guest_type.price.toString());
      
      navigate(`/form/register/${formId}/success?${params.toString()}`);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to submit registration';
      toast.error(errorMessage);
      setSubmitting(false);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setSubmitting(true);

    try {
      const submissionData: FormSubmissionRequest = {
        participant_type: form.guest_type?.name || 'guest',
        submission_data: formData,
      };

      submitMutation.mutate(submissionData);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitting(false);
    }
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const handleCheckboxChange = (fieldKey: string, optionValue: string, checked: boolean) => {
    setFormData(prev => {
      const currentValue = prev[fieldKey] || [];
      const valueArray = Array.isArray(currentValue) ? currentValue : [];
      
      if (checked) {
        return {
          ...prev,
          [fieldKey]: [...valueArray, optionValue]
        };
      } else {
        return {
          ...prev,
          [fieldKey]: valueArray.filter((v: string) => v !== optionValue)
        };
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
        {/* Modern Loading Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-center">
              {/* Enhanced Evella Logo */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden bg-background">
                    <img 
                      src="/evella-logo.png" 
                      alt="Evella Logo" 
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        // Fallback to text if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        if (!target.nextElementSibling) {
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center text-white font-bold';
                          fallback.textContent = 'E';
                          target.parentElement?.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xl text-foreground">
                    Evella
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    Event Management Platform
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="min-h-[80vh] flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-lg">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-warning/20 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
            <Card className="relative bg-card/80 backdrop-blur-xl border-0 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary via-warning to-primary"></div>
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-lg bg-background overflow-hidden">
                      <img 
                        src="/evella-logo.png" 
                        alt="Evella Logo" 
                        className="w-full h-full object-contain p-3 animate-pulse"
                        onError={(e) => {
                          // Fallback to text if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          if (!target.nextElementSibling) {
                            const fallback = document.createElement('div');
                            fallback.className = 'w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-2xl';
                            fallback.textContent = 'E';
                            target.parentElement?.appendChild(fallback);
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="text-center space-y-2 sm:space-y-3">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">Loading Registration Form</h2>
                    <p className="text-muted-foreground animate-pulse text-sm sm:text-base">Please wait while we prepare your form...</p>
                  </div>

                  {/* Loading Progress Bar */}
                  <div className="w-full max-w-xs">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-warning rounded-full animate-pulse" style={{width: '60%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
        {/* Error Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-destructive/20 to-destructive/10 rounded-xl flex items-center justify-center shadow-lg">
                    <AlertCircle className="w-6 h-6 text-destructive" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xl text-foreground">
                    Registration Error
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    Unable to load form
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="min-h-[80vh] flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-lg">
            <div className="absolute -inset-4 bg-gradient-to-r from-destructive/20 via-destructive/10 to-destructive/20 rounded-3xl blur-xl opacity-50"></div>
            <Card className="relative bg-card/80 backdrop-blur-xl border-0 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-destructive via-destructive to-destructive"></div>
              <CardContent className="p-6 sm:p-8">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-destructive/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">Form Unavailable</h2>
                      <p className="text-muted-foreground text-sm sm:text-base">We couldn't load the registration form</p>
                    </div>
                  </div>

                  <Alert className="border-destructive/20 bg-destructive/5">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                    <AlertDescription className="text-destructive text-sm sm:text-base">
                      {error instanceof Error
                        ? error.message
                        : (error as any)?.response?.data?.message || 'Form not found or has been removed'}
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4">
                    <Button
                      variant="outline"
                      className="flex-1 border-2 hover:bg-muted/50 transition-all duration-300 rounded-xl py-2.5 sm:py-3"
                      onClick={() => navigate(-1)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Go Back
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl py-2.5 sm:py-3"
                      onClick={() => window.location.reload()}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Helper functions for event data
  const startDate = event?.start_date ? new Date(event.start_date) : null;
  const endDate = event?.end_date ? new Date(event.end_date) : null;
  const organizerName = event?.organizer?.name || 'Event Organizer';
  const organizerLogo = event?.organizer?.logo ? getImageUrl(event.organizer.logo) : null;
  const eventImage = event?.event_image ? getImageUrl(event.event_image) : null;

  if (form.status !== 'active') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
        {/* Status Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-warning/20 to-warning/10 rounded-xl flex items-center justify-center shadow-lg">
                    <Clock className="w-6 h-6 text-warning" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xl text-foreground">
                    Form Unavailable
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    Registration temporarily closed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="min-h-[80vh] flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-lg">
            <div className="absolute -inset-4 bg-gradient-to-r from-warning/20 via-warning/10 to-warning/20 rounded-3xl blur-xl opacity-50"></div>
            <Card className="relative bg-card/80 backdrop-blur-xl border-0 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-warning via-warning to-warning"></div>
              <CardContent className="p-6 sm:p-8">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-warning/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">Registration Closed</h2>
                      <p className="text-muted-foreground text-sm sm:text-base">This form is temporarily unavailable</p>
                    </div>
                  </div>

                  <Alert className="border-warning/20 bg-warning/5">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                    <AlertDescription className="text-foreground text-sm sm:text-base">
                      This registration form is currently <span className="font-semibold text-warning">{form.status}</span> and is not accepting new submissions at this time.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-muted/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-info/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-info" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">Need Help?</p>
                        <p className="text-xs text-muted-foreground">Contact the event organizer for more information</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-2 hover:bg-muted/50 transition-all duration-300 rounded-xl py-2.5 sm:py-3"
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Return to Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Modern Header with Enhanced Branding */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between min-h-[60px] sm:min-h-[64px]">
            {/* Enhanced Evella Logo */}
            <div className="flex items-center gap-2 sm:gap-4 group flex-shrink-0">
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all duration-300 bg-background overflow-hidden">
                  <img 
                    src="/evella-logo.png" 
                    alt="Evella Logo" 
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      // Fallback to text if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (!target.nextElementSibling) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-full h-full bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center text-white font-bold';
                        fallback.textContent = 'E';
                        target.parentElement?.appendChild(fallback);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-lg sm:text-xl text-foreground group-hover:text-primary transition-colors duration-300 truncate">
                  Evella
                </span>
                <span className="text-xs text-muted-foreground font-medium hidden xs:block sm:block">
                  Event Management Platform
                </span>
              </div>
            </div>

            {/* Organizer Logo with Enhanced Styling */}
            {organizerLogo && (
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="text-xs sm:text-sm text-muted-foreground hidden md:block font-medium">
                  Powered by
                </div>
                <div className="relative">
                  <img
                    src={organizerLogo}
                    alt={organizerName}
                    className="h-8 sm:h-10 max-w-[100px] sm:max-w-[140px] object-contain rounded-lg bg-card/50 p-1 sm:p-2 shadow-sm border border-border/50 hover:shadow-md transition-all duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modern Hero Section with Event Details */}
      {event && (
        <div className="relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_70%)]"></div>

          <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            <div className="text-center space-y-6 sm:space-y-8">
              {/* Event Image with Modern Styling */}
              {eventImage && (
                <div className="flex justify-center mb-6 sm:mb-8">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary via-primary to-warning rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-3xl overflow-hidden shadow-2xl border-4 border-card/80 backdrop-blur-sm bg-card/20">
                      <img
                        src={eventImage}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Event Name with Animation */}
              <div className="space-y-3 sm:space-y-4 animate-fade-in px-2 sm:px-0">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent leading-tight">
                  {event.name}
                </h1>

                {/* Event Description with Better Typography */}
                {event.description && (
                  <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium px-2 sm:px-0">
                    {event.description}
                  </p>
                )}
              </div>

              {/* Modern Event Details Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12 max-w-5xl mx-auto px-2 sm:px-0">
                {/* Date Card */}
                {startDate && (
                  <div className="group relative bg-card/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl"></div>
                    <div className="relative flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Event Date
                        </div>
                        <div className="text-base sm:text-lg font-bold text-foreground leading-tight">
                          {startDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                          {endDate && endDate.getTime() !== startDate.getTime() && (
                            <span className="text-muted-foreground font-normal block sm:inline sm:ml-1">
                              {' - '}{endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Location Card */}
                {event.location && (
                  <div className="group relative bg-card/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-info/5 to-transparent rounded-2xl"></div>
                    <div className="relative flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-info/20 to-info/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <MapPin className="w-6 h-6 sm:w-7 sm:h-7 text-info" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Location
                        </div>
                        <div className="text-base sm:text-lg font-bold text-foreground line-clamp-2 leading-tight">
                          {event.location}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Guest Type Card */}
                {form.guest_type && (
                  <div className="group relative bg-card/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent rounded-2xl"></div>
                    <div className="relative flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-success/20 to-success/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <Users className="w-6 h-6 sm:w-7 sm:h-7 text-success" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Guest Type
                        </div>
                        <div className="text-base sm:text-lg font-bold text-foreground leading-tight">
                          {form.guest_type.name}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Registration Form Section */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Form Container with Glassmorphism */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-warning/20 rounded-3xl blur-xl opacity-50"></div>
          <Card className="relative bg-card/80 backdrop-blur-xl border-0 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden">
            {/* Decorative Top Border */}
            <div className="h-1 bg-gradient-to-r from-primary via-warning to-primary"></div>

            <CardHeader className="bg-gradient-to-r from-card/50 to-card/30 border-b border-border/30 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg bg-background overflow-hidden">
                    <img 
                      src="/evella-logo.png" 
                      alt="Evella Logo" 
                      className="w-full h-full object-contain p-3"
                      onError={(e) => {
                        // Fallback to text if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        if (!target.nextElementSibling) {
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-xl';
                          fallback.textContent = 'E';
                          target.parentElement?.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                    {form.name}
                  </CardTitle>
                  {form.description && (
                    <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                      {form.description}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                {(() => {
                  // Handle both snake_case (form_fields) and camelCase (formFields) from API
                  const fields = (form as any).formFields || (form as any).form_fields || [];
                  console.log('Fields to render:', fields);
                  console.log('Fields count:', fields.length);
                  return fields.length > 0 ? (
                    <div className="space-y-6 sm:space-y-8">
                      {/* Form Introduction */}
                      <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-primary/10">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                          </div>
                          <div className="space-y-1 sm:space-y-2 min-w-0">
                            <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                              Registration Information
                            </h3>
                            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                              Please fill out all required fields below to complete your registration.
                              Make sure to provide accurate information for a smooth check-in process.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Form Fields Container */}
                      <div className="bg-card/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-border/30 space-y-6 sm:space-y-8">
                        {fields.map((field: any, index: number) => (
                          <div
                            key={field.id}
                            className="animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <FormFieldRenderer
                              field={field}
                              value={formData[field.field_key] || (field.field_type === 'checkbox' ? [] : '')}
                              onChange={(fieldKey, value) => handleFieldChange(fieldKey, value)}
                              onCheckboxChange={handleCheckboxChange}
                              error={undefined}
                              formData={formData}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-dashed border-border/50">
                      <Alert className="border-0 bg-transparent">
                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                        <AlertDescription className="text-muted-foreground text-base sm:text-lg">
                          This form has no fields configured yet. Please check back later or contact the event organizer.
                        </AlertDescription>
                      </Alert>
                    </div>
                  );
                })()}

                {/* Action Buttons */}
                <div className="pt-6 sm:pt-8 border-t border-border/30">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 border-2 hover:bg-muted/50 transition-all duration-300 rounded-xl"
                      size="lg"
                    >
                      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Back
                    </Button>

                    <Button
                      type="submit"
                      disabled={submitting || !((form as any).formFields || (form as any).form_fields) || ((form as any).formFields || (form as any).form_fields || []).length === 0}
                      className="w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary/95 hover:to-primary shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 rounded-xl text-white font-semibold text-base sm:text-lg"
                      size="lg"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 animate-spin" />
                          <span className="hidden sm:inline">Processing Registration...</span>
                          <span className="sm:hidden">Processing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                          <span className="hidden sm:inline">Complete Registration</span>
                          <span className="sm:hidden">Complete</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-6 sm:mt-8 text-center px-2 sm:px-0">
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      By submitting this form, you agree to our{' '}
                      <a href="/privacy" className="text-primary hover:text-primary/80 underline font-medium transition-colors duration-200">
                        Privacy Policy
                      </a>
                      {' '}and{' '}
                      <a href="/terms" className="text-primary hover:text-primary/80 underline font-medium transition-colors duration-200">
                        Terms of Service
                      </a>
                    </p>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Footer */}
        <div className="mt-12 sm:mt-16 text-center space-y-4 px-4 sm:px-0">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-background overflow-hidden">
              <img 
                src="/evella-logo.png" 
                alt="Evella Logo" 
                className="w-full h-full object-contain p-1.5"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (!target.nextElementSibling) {
                    const fallback = document.createElement('div');
                    fallback.className = 'w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-xs';
                    fallback.textContent = 'E';
                    target.parentElement?.appendChild(fallback);
                  }
                }}
              />
            </div>
            <span className="font-semibold text-foreground text-base sm:text-lg">Evella</span>
          </div>
          <p className="text-muted-foreground font-medium text-sm sm:text-base">
            Event Management Platform
          </p>
          {organizerName && (
            <p className="text-sm text-muted-foreground mt-3 sm:mt-4">
              Organized by <span className="font-semibold text-foreground">{organizerName}</span>
            </p>
          )}

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-xs sm:text-sm">Secure & Encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-info rounded-full"></div>
              <span className="text-xs sm:text-sm">24/7 Support</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-warning rounded-full"></div>
              <span className="text-xs sm:text-sm">GDPR Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

