import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Star,
  Sparkles,
  AlertCircle,
  User,
  CheckCircle,
  Upload,
  FileText,
  X,
  Loader2,
  Building,
  Globe,
  Phone,
  Mail,
  CreditCard,
  Camera,
  IdCard,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import api from '@/lib/api';

interface EventData {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  max_guests: number;
  event_type: string;
  event_image?: string;
  organizer?: {
    id: number;
    name: string;
    logo?: string;
  };
  formatted_address?: string;
  latitude?: number;
  longitude?: number;
  venue_name?: string;
}

interface FormData {
  fullName: string;
  nationality: string;
  passportNumber: string;
  email: string;
  phoneNumber: string;
  organization: string;
  jobTitle: string;
  joiningAs: string;
  otherExplanation: string;
  requiresVisaSupport: boolean;
  needsAccommodationSupport: boolean;
  passportBioData: File | null;
  passportPhoto: File | null;
}

const CustomEventRegistration: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    nationality: '',
    passportNumber: '',
    email: '',
    phoneNumber: '',
    organization: '',
    jobTitle: '',
    joiningAs: '',
    otherExplanation: '',
    requiresVisaSupport: false,
    needsAccommodationSupport: false,
    passportBioData: null,
    passportPhoto: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Fetch event data
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await api.get(`/events/${eventId}`);
        setEventData(response.data);
      } catch (error: any) {
        console.error('Failed to fetch event data:', error);
        if (error.response?.status === 404) {
          setErrors({ submit: 'Event not found. Please check the event ID.' });
        }
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventData();
    } else {
      setLoading(false);
      setErrors({ submit: 'Event ID is required.' });
    }
  }, [eventId]);

  const registerMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!eventId) {
        throw new Error('Event ID is required');
      }

      const formDataToSend = new FormData();

      // Add basic fields
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'passportBioData' || key === 'passportPhoto') {
          if (value) {
            formDataToSend.append(key, value);
          }
        } else if (typeof value === 'boolean') {
          formDataToSend.append(key, value ? '1' : '0');
        } else {
          formDataToSend.append(key, value as string);
        }
      });

      const url = `/events/${eventId}/register/custom`;
      const fullUrl = `${api.defaults.baseURL}${url}`;
      console.log('Submitting registration to:', url);
      console.log('Full URL:', fullUrl);
      console.log('API Base URL:', api.defaults.baseURL);
      console.log('Form data keys:', Array.from(formDataToSend.keys()));

      return api.post(url, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: (data) => {
      // Handle successful registration - show confirmation message
      setRegistrationSuccess(true);
      // Note: submitting will be reset in handleSubmit's finally block
    },
    onError: (error: any) => {
      console.error('Registration failed:', error);
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 404) {
          errorMessage = 'Event not found. Please check the event ID.';
        } else if (status === 403) {
          errorMessage = data?.message || 'Custom registration is not available for this event.';
        } else if (status === 422) {
          errorMessage = data?.message || 'Please check your form data and try again.';
          // Set field-specific errors if provided
          if (data?.errors) {
            const fieldErrors: Record<string, string> = {};
            Object.keys(data.errors).forEach(key => {
              fieldErrors[key] = Array.isArray(data.errors[key]) 
                ? data.errors[key][0] 
                : data.errors[key];
            });
            setErrors(prev => ({ ...prev, ...fieldErrors }));
          }
        } else if (data?.message) {
          errorMessage = data.message;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrors({ submit: errorMessage });
      // Note: submitting will be reset in handleSubmit's finally block
    },
  });

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touchedFields[field]) {
      validateField(field, value);
    }
  };

  const handleFileChange = (field: 'passportBioData' | 'passportPhoto', file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    if (file && touchedFields[field]) {
      validateField(field, file);
    }
  };

  const handleFieldBlur = (field: keyof FormData) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateField = (field: keyof FormData, value: any) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'fullName':
        if (!value || value.trim().length < 2) {
          newErrors.fullName = 'Full name is required and must be at least 2 characters';
        } else {
          delete newErrors.fullName;
        }
        break;

      case 'nationality':
        if (!value) {
          newErrors.nationality = 'Nationality is required';
        } else {
          delete newErrors.nationality;
        }
        break;

      case 'passportNumber':
        if (!value || value.trim().length < 5) {
          newErrors.passportNumber = 'Passport number is required (minimum 5 characters)';
        } else {
          delete newErrors.passportNumber;
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value || !emailRegex.test(value)) {
          newErrors.email = 'Valid email address is required';
        } else {
          delete newErrors.email;
        }
        break;

      case 'phoneNumber':
        if (!value || value.trim().length < 7) {
          newErrors.phoneNumber = 'Phone number with country code is required';
        } else {
          delete newErrors.phoneNumber;
        }
        break;

      case 'jobTitle':
        if (!value || value.trim().length < 2) {
          newErrors.jobTitle = 'Job title/role is required';
        } else {
          delete newErrors.jobTitle;
        }
        break;

      case 'joiningAs':
        if (!value) {
          newErrors.joiningAs = 'Please select how you will be joining';
        } else {
          delete newErrors.joiningAs;
        }
        break;

      case 'otherExplanation':
        if (formData.joiningAs === 'other' && (!value || value.trim().length < 5)) {
          newErrors.otherExplanation = 'Please explain how you will be joining (minimum 5 characters)';
        } else {
          delete newErrors.otherExplanation;
        }
        break;

      case 'passportBioData':
        if (!value) {
          newErrors.passportBioData = 'Passport bio-data page upload is required';
        } else if (value.size > 10 * 1024 * 1024) { // 10MB
          newErrors.passportBioData = 'File size must be less than 10MB';
        } else {
          delete newErrors.passportBioData;
        }
        break;

      case 'passportPhoto':
        if (!value) {
          newErrors.passportPhoto = 'HD passport photo upload is required';
        } else if (value.size > 10 * 1024 * 1024) { // 10MB
          newErrors.passportPhoto = 'File size must be less than 10MB';
        } else {
          delete newErrors.passportPhoto;
        }
        break;
    }

    setErrors(newErrors);
  };

  const validateForm = () => {
    const requiredFields: (keyof FormData)[] = [
      'fullName', 'nationality', 'passportNumber', 'email',
      'phoneNumber', 'jobTitle', 'joiningAs', 'passportBioData', 'passportPhoto'
    ];

    requiredFields.forEach(field => {
      handleFieldBlur(field);
    });

    if (formData.joiningAs === 'other') {
      handleFieldBlur('otherExplanation');
    }

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!eventId) {
      setErrors({ submit: 'Event ID is required.' });
      return;
    }

    if (!eventData) {
      setErrors({ submit: 'Event data not loaded. Please refresh the page.' });
      return;
    }

    setSubmitting(true);
    setErrors({}); // Clear previous errors
    try {
      await registerMutation.mutateAsync(formData);
    } catch (error) {
      // Error is already handled in onError callback
      console.error('Submit error:', error);
    } finally {
      // Always reset submitting state to allow resubmission
      setSubmitting(false);
    }
  };

  const calculateProgress = () => {
    const requiredFields = [
      'fullName', 'nationality', 'passportNumber', 'email',
      'phoneNumber', 'jobTitle', 'joiningAs'
    ];

    if (formData.joiningAs === 'other') {
      requiredFields.push('otherExplanation');
    }

    requiredFields.push('passportBioData', 'passportPhoto');

    const filledFields = requiredFields.filter(field => {
      const value = formData[field as keyof FormData];
      return value && (typeof value === 'string' ? value.trim() !== '' : true);
    });

    return (filledFields.length / requiredFields.length) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading registration form...</p>
        </div>
      </div>
    );
  }

  if (eventId !== '33') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Alert className="max-w-md border-2 border-slate-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Custom registration is only available for specific events.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show registration confirmation
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-slate-50" style={{ colorScheme: 'light' }}>
        {/* Header Section */}
        <header className="bg-white border-b-2 border-primary shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {eventData?.organizer?.logo && (
                  <div className="w-16 h-16 bg-white rounded-lg border-2 border-slate-300 flex items-center justify-center p-2 shadow-sm">
                    <img
                      src={eventData.organizer.logo}
                      alt={eventData.organizer.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{eventData?.name || 'Event Registration'}</h1>
                  <p className="text-sm text-slate-700">Registration Confirmation</p>
                </div>
              </div>
              <div className="flex items-center">
                <img
                  src="/Validity-Event & Marketing.png"
                  alt="Validity Event & Marketing"
                  className="h-12 w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Confirmation Section */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg border-2 border-success shadow-lg p-8 md:p-12">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-success" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Registration Successful!</h2>
                <p className="text-lg text-slate-700">
                  Thank you for registering for <span className="font-semibold text-primary">{eventData?.name}</span>
                </p>
              </div>

              <div className="border-2 border-slate-200 rounded-lg p-6 mb-6 bg-slate-50">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Your eBadge Will Be Sent by Email</h3>
                    <p className="text-slate-700 mb-3">
                      Your registration has been successfully submitted. Your digital eBadge will be sent to:
                    </p>
                    <div className="bg-white border-2 border-primary/20 rounded-lg p-4 mb-3">
                      <p className="font-semibold text-primary">{formData.email}</p>
                    </div>
                    <p className="text-sm text-slate-600">
                      Please check your email inbox (and spam folder) for your eBadge. If you don't receive it within 24 hours, please contact the event organizers.
                    </p>
                  </div>
                </div>
              </div>

              {eventData && (
                <div className="border-2 border-slate-300 rounded-lg p-6 bg-white">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Date & Time</p>
                        <p className="text-sm text-gray-900">
                          {new Date(eventData.start_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-slate-600">
                          {new Date(eventData.start_date).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-success" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Location</p>
                        <p className="text-sm text-gray-900">{eventData.venue_name || eventData.location || 'Venue TBA'}</p>
                        {eventData.formatted_address && (
                          <p className="text-xs text-slate-600">{eventData.formatted_address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 text-center">
                <p className="text-sm text-slate-600">
                  We look forward to seeing you at the event!
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ colorScheme: 'light' }}>
      {/* Header Section - Clean and Minimal */}
      <header className="bg-white border-b-2 border-primary shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {eventData?.organizer?.logo && (
                <div className="w-16 h-16 bg-white rounded-lg border-2 border-slate-300 flex items-center justify-center p-2 shadow-sm">
                  <img
                    src={eventData.organizer.logo}
                    alt={eventData.organizer.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{eventData?.name || 'Event Registration'}</h1>
                <p className="text-sm text-slate-700">Complete your registration below</p>
              </div>
            </div>
            <div className="flex items-center">
              <img
                src="/Validity-Event & Marketing.png"
                alt="Validity Event & Marketing"
                className="h-12 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Simple and Clean */}
      <section className="bg-primary py-12 border-b-4 border-primary/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg mb-6">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-semibold text-gray-900">
                {eventData ? new Date(eventData.start_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                }) : 'TBA'}
              </span>
              <span className="text-slate-500">•</span>
              <MapPin className="w-5 h-5 text-primary" />
              <span className="font-semibold text-gray-900">{eventData?.location || 'Location TBA'}</span>
            </div>
            <div className="mt-4">
              <span className="inline-block bg-white text-primary font-bold px-4 py-2 rounded-lg shadow-md">
              Delegate Registration Form
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Event Info Sidebar - Compact */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border-2 border-slate-300 p-6 shadow-sm sticky top-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b-2 border-primary">Event Details</h3>

                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-primary" />
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Date & Time</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900 ml-6">
                      {eventData ? new Date(eventData.start_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'TBA'}
                    </p>
                    <p className="text-xs text-slate-600 ml-6">
                      {eventData ? new Date(eventData.start_date).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : ''}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-success" />
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Location</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900 ml-6">{eventData?.venue_name || eventData?.location || 'Venue TBA'}</p>
                    {eventData?.formatted_address && (
                      <p className="text-xs text-slate-600 ml-6">{eventData.formatted_address}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-primary" />
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Event Type</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900 ml-6 capitalize">{eventData?.event_type || 'Professional Event'}</p>
                    <p className="text-xs text-slate-600 ml-6">Capacity: {eventData?.max_guests || 'TBA'} attendees</p>
                  </div>

                  {eventData?.organizer && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Building className="w-4 h-4 text-primary" />
                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Organized by</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900 ml-6">{eventData.organizer.name}</p>
                    </div>
                  )}

                  {eventData?.description && (
                    <div className="pt-4 border-t border-slate-300">
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">About</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{eventData.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg border-2 border-slate-300 shadow-sm">
                {/* Form Header */}
                <div className="border-b-2 border-primary bg-primary/5 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Registration Form</h2>
                      <p className="text-sm text-slate-700 mt-1">Complete all required fields to register</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Progress</div>
                      <div className="text-lg font-bold text-primary">{Math.round(calculateProgress())}%</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${calculateProgress()}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="p-6">

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div className="border-2 border-slate-300 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-slate-300">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                          <p className="text-xs text-slate-600">Basic details about yourself</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="fullName" className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                            Full Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="fullName"
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            onBlur={() => handleFieldBlur('fullName')}
                            className={`h-11 border-2 bg-white text-gray-900 placeholder:text-slate-500 ${errors.fullName ? 'border-destructive focus:border-destructive' : 'border-slate-400 focus:border-primary'} rounded-lg transition-colors`}
                            placeholder="Enter your full name"
                          />
                          {errors.fullName && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.fullName}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="nationality" className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                            Nationality <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="nationality"
                            type="text"
                            value={formData.nationality}
                            onChange={(e) => handleInputChange('nationality', e.target.value)}
                            onBlur={() => handleFieldBlur('nationality')}
                            className={`h-11 border-2 bg-white text-gray-900 placeholder:text-slate-500 ${errors.nationality ? 'border-destructive focus:border-destructive' : 'border-slate-400 focus:border-primary'} rounded-lg transition-colors`}
                            placeholder="e.g., Ethiopian, American, etc."
                          />
                          {errors.nationality && <p className="text-sm text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.nationality}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="passportNumber" className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                            Passport Number <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="passportNumber"
                            type="text"
                            value={formData.passportNumber}
                            onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                            onBlur={() => handleFieldBlur('passportNumber')}
                            className={`h-11 border-2 bg-white text-gray-900 placeholder:text-slate-500 ${errors.passportNumber ? 'border-destructive focus:border-destructive' : 'border-slate-400 focus:border-primary'} rounded-lg transition-colors`}
                            placeholder="Enter passport number"
                          />
                          {errors.passportNumber && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.passportNumber}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                            Email Address <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            onBlur={() => handleFieldBlur('email')}
                            className={`h-11 border-2 bg-white text-gray-900 placeholder:text-slate-500 ${errors.email ? 'border-destructive focus:border-destructive' : 'border-slate-400 focus:border-primary'} rounded-lg transition-colors`}
                            placeholder="your.email@example.com"
                          />
                          {errors.email && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                            Phone Number <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="phoneNumber"
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                            onBlur={() => handleFieldBlur('phoneNumber')}
                            className={`h-11 border-2 bg-white text-gray-900 placeholder:text-slate-500 ${errors.phoneNumber ? 'border-destructive focus:border-destructive' : 'border-slate-400 focus:border-primary'} rounded-lg transition-colors`}
                            placeholder="+251 911 123 456"
                          />
                          {errors.phoneNumber && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phoneNumber}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="organization" className="text-sm font-semibold text-gray-900">
                            Organization/Company Name
                          </Label>
                          <Input
                            id="organization"
                            type="text"
                            value={formData.organization}
                            onChange={(e) => handleInputChange('organization', e.target.value)}
                            className="h-11 border-2 border-slate-400 focus:border-primary bg-white text-gray-900 placeholder:text-slate-500 rounded-lg transition-colors"
                            placeholder="Enter organization name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="jobTitle" className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                            Job Title/Role <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="jobTitle"
                            type="text"
                            value={formData.jobTitle}
                            onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                            onBlur={() => handleFieldBlur('jobTitle')}
                            className={`h-11 border-2 bg-white text-gray-900 placeholder:text-slate-500 ${errors.jobTitle ? 'border-destructive focus:border-destructive' : 'border-slate-400 focus:border-primary'} rounded-lg transition-colors`}
                            placeholder="e.g., Director, Producer, CEO, etc."
                          />
                          {errors.jobTitle && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.jobTitle}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Participation Details */}
                    <div className="border-2 border-slate-300 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-slate-300">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                          <Building className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Participation Details</h3>
                          <p className="text-xs text-slate-600">How will you be participating?</p>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div>
                            <Label className="text-sm font-semibold text-gray-900 flex items-center gap-1 mb-3">
                            Tell us how you'll be joining: <span className="text-destructive">*</span>
                          </Label>
                          <RadioGroup
                            value={formData.joiningAs}
                            onValueChange={(value) => handleInputChange('joiningAs', value)}
                            className="grid grid-cols-1 md:grid-cols-2 gap-3"
                          >
                            <Label 
                              htmlFor="filmmaker"
                              className={`flex items-center space-x-3 p-3 border-2 rounded-lg transition-colors cursor-pointer ${
                                formData.joiningAs === 'filmmaker' 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-slate-300 hover:border-primary hover:bg-primary/5'
                              }`}
                            >
                              <RadioGroupItem value="filmmaker" id="filmmaker" />
                              <span className="flex-1 font-medium text-gray-900">Filmmaker</span>
                            </Label>
                            <Label 
                              htmlFor="investor"
                              className={`flex items-center space-x-3 p-3 border-2 rounded-lg transition-colors cursor-pointer ${
                                formData.joiningAs === 'investor' 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-slate-300 hover:border-primary hover:bg-primary/5'
                              }`}
                            >
                              <RadioGroupItem value="investor" id="investor" />
                              <span className="flex-1 font-medium text-gray-900">Investor</span>
                            </Label>
                            <Label 
                              htmlFor="distributor"
                              className={`flex items-center space-x-3 p-3 border-2 rounded-lg transition-colors cursor-pointer ${
                                formData.joiningAs === 'distributor' 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-slate-300 hover:border-primary hover:bg-primary/5'
                              }`}
                            >
                              <RadioGroupItem value="distributor" id="distributor" />
                              <span className="flex-1 font-medium text-gray-900">Distributor</span>
                            </Label>
                            <Label 
                              htmlFor="media"
                              className={`flex items-center space-x-3 p-3 border-2 rounded-lg transition-colors cursor-pointer ${
                                formData.joiningAs === 'media' 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-slate-300 hover:border-primary hover:bg-primary/5'
                              }`}
                            >
                              <RadioGroupItem value="media" id="media" />
                              <span className="flex-1 font-medium text-gray-900">Media Representative</span>
                            </Label>
                            <Label 
                              htmlFor="policy"
                              className={`flex items-center space-x-3 p-3 border-2 rounded-lg transition-colors cursor-pointer ${
                                formData.joiningAs === 'policy' 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-slate-300 hover:border-primary hover:bg-primary/5'
                              }`}
                            >
                              <RadioGroupItem value="policy" id="policy" />
                              <span className="flex-1 font-medium text-gray-900">Policy Maker</span>
                            </Label>
                            <Label 
                              htmlFor="other"
                              className={`flex items-center space-x-3 p-3 border-2 rounded-lg transition-colors cursor-pointer ${
                                formData.joiningAs === 'other' 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-slate-300 hover:border-primary hover:bg-primary/5'
                              }`}
                            >
                              <RadioGroupItem value="other" id="other" />
                              <span className="flex-1 font-medium text-gray-900">Other</span>
                            </Label>
                          </RadioGroup>
                          {errors.joiningAs && <p className="text-xs text-destructive mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.joiningAs}</p>}
                        </div>

                        {formData.joiningAs === 'other' && (
                          <div className="space-y-2">
                            <Label htmlFor="otherExplanation" className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                              If other, please explain <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                              id="otherExplanation"
                              value={formData.otherExplanation}
                              onChange={(e) => handleInputChange('otherExplanation', e.target.value)}
                              onBlur={() => handleFieldBlur('otherExplanation')}
                              className={`border-2 bg-white text-gray-900 placeholder:text-slate-500 ${errors.otherExplanation ? 'border-destructive focus:border-destructive' : 'border-slate-400 focus:border-primary'} rounded-lg resize-none transition-colors`}
                              placeholder="Please explain how you will be joining..."
                              rows={4}
                            />
                            {errors.otherExplanation && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.otherExplanation}</p>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Support Requirements */}
                    <div className="border-2 border-slate-300 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-slate-300">
                        <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center">
                          <HelpCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Support Requirements</h3>
                          <p className="text-xs text-slate-600">Additional assistance options</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label 
                          htmlFor="visaSupport"
                          className={`flex items-start space-x-3 p-4 border-2 rounded-lg transition-colors cursor-pointer ${
                            formData.requiresVisaSupport 
                              ? 'border-primary bg-primary/10' 
                              : 'border-slate-300 hover:border-primary hover:bg-primary/5'
                          }`}
                        >
                          <Checkbox
                            id="visaSupport"
                            checked={formData.requiresVisaSupport}
                            onCheckedChange={(checked) => handleInputChange('requiresVisaSupport', checked)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <span className="font-semibold text-gray-900 block">
                              Visa Support Letter
                            </span>
                            <p className="text-xs text-slate-600 mt-1">
                              Do you require a visa support letter for your visa application?
                            </p>
                          </div>
                        </Label>

                        <Label 
                          htmlFor="accommodationSupport"
                          className={`flex items-start space-x-3 p-4 border-2 rounded-lg transition-colors cursor-pointer ${
                            formData.needsAccommodationSupport 
                              ? 'border-primary bg-primary/10' 
                              : 'border-slate-300 hover:border-primary hover:bg-primary/5'
                          }`}
                        >
                          <Checkbox
                            id="accommodationSupport"
                            checked={formData.needsAccommodationSupport}
                            onCheckedChange={(checked) => handleInputChange('needsAccommodationSupport', checked)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <span className="font-semibold text-gray-900 block">
                              Accommodation Support
                            </span>
                            <p className="text-xs text-slate-600 mt-1">
                              Would you need assistance with identifying accommodation options?
                            </p>
                          </div>
                        </Label>
                      </div>
                    </div>

                    {/* Document Uploads */}
                    <div className="border-2 border-slate-300 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-slate-300">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                          <Upload className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Document Uploads</h3>
                          <p className="text-xs text-slate-600">Required documents (Max 10MB each)</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Passport Bio-Data Upload - Hidden */}
                        <div className="space-y-3 hidden">
                          <Label className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                            Passport Bio-Data Page <span className="text-destructive">*</span>
                          </Label>
                          <div>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => handleFileChange('passportBioData', e.target.files?.[0] || null)}
                              className="hidden"
                              id="passportBioData"
                            />
                            <Label htmlFor="passportBioData" className="cursor-pointer block">
                              <div className={`border-2 border-dashed rounded-lg p-5 text-center transition-all duration-200 ${
                                formData.passportBioData
                                  ? 'border-success bg-success/10'
                                  : 'border-slate-400 hover:border-primary hover:bg-primary/5'
                              }`}>
                                {formData.passportBioData ? (
                                  <div className="flex items-center justify-center gap-3">
                                    <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                                      <FileText className="w-6 h-6 text-success" />
                                    </div>
                                    <div className="text-left flex-1">
                                      <p className="text-sm font-semibold text-gray-900 truncate">{formData.passportBioData.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {(formData.passportBioData.size / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleFileChange('passportBioData', null);
                                      }}
                                      className="text-destructive hover:text-destructive/80"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                      <IdCard className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 mb-1">Upload Passport Bio-Data</p>
                                    <p className="text-xs text-slate-600">PNG, JPG, PDF up to 10MB</p>
                                  </div>
                                )}
                              </div>
                            </Label>
                          </div>
                          {errors.passportBioData && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.passportBioData}</p>}
                        </div>

                        {/* Passport Photo Upload - Hidden */}
                        <div className="space-y-3 hidden">
                          <Label className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                            HD Passport Photo <span className="text-destructive">*</span>
                          </Label>
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange('passportPhoto', e.target.files?.[0] || null)}
                              className="hidden"
                              id="passportPhoto"
                            />
                            <Label htmlFor="passportPhoto" className="cursor-pointer block">
                              <div className={`border-2 border-dashed rounded-lg p-5 text-center transition-all duration-200 ${
                                formData.passportPhoto
                                  ? 'border-success bg-success/10'
                                  : 'border-slate-400 hover:border-primary hover:bg-primary/5'
                              }`}>
                                {formData.passportPhoto ? (
                                  <div className="flex items-center justify-center gap-3">
                                    <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                                      <Camera className="w-6 h-6 text-success" />
                                    </div>
                                    <div className="text-left flex-1">
                                      <p className="text-sm font-semibold text-gray-900 truncate">{formData.passportPhoto.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {(formData.passportPhoto.size / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleFileChange('passportPhoto', null);
                                      }}
                                      className="text-destructive hover:text-destructive/80"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                      <Camera className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 mb-1">Upload HD Passport Photo</p>
                                    <p className="text-xs text-slate-600">PNG, JPG up to 10MB</p>
                                  </div>
                                )}
                              </div>
                            </Label>
                          </div>
                          {errors.passportPhoto && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.passportPhoto}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Submit Section */}
                    <div className="border-t-2 border-slate-300 pt-6 mt-6">
                      {errors.submit && (
                        <Alert className="mb-4 border-2 border-destructive bg-destructive/10">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <AlertDescription className="text-destructive text-sm">
                            {errors.submit}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="text-center">
                        <Button
                          type="submit"
                          disabled={submitting || calculateProgress() < 100}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-lg text-base transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Processing Registration...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              Complete Registration
                            </>
                          )}
                        </Button>

                        {calculateProgress() < 100 && (
                          <p className="text-xs text-slate-600 mt-3 flex items-center justify-center gap-2">
                            <AlertCircle className="w-3 h-3" />
                            Please complete all required fields to submit
                          </p>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
    );
  };

export default CustomEventRegistration;
