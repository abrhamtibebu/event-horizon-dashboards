import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Calendar, MapPin, Users, Clock, Star, Sparkles, AlertCircle, Lamp, User, CheckCircle } from 'lucide-react';
import { PublicTicketSelector } from '@/components/public/PublicTicketSelector';
import { PublicPaymentSelector } from '@/components/public/PublicPaymentSelector';
import { PublicTicketDisplay } from '@/components/public/PublicTicketDisplay';
import { PaymentProcessingModal } from '@/components/payments/PaymentProcessingModal';
import { usePublicEventTickets, useInitiateGuestPayment } from '@/lib/api/publicTickets';
import { useAuth } from '@/hooks/use-auth';
import type { PaymentMethod, PaymentStatus } from '@/types/tickets';
import type { PublicTicketType } from '@/types/publicTickets';
import { SpinnerInline } from '@/components/ui/spinner';
import { CustomFieldsRenderer } from '@/components/registration/CustomFieldsRenderer';
import { getPublicEventCustomFields } from '@/lib/customFieldsApi';
import type { CustomField, CustomFieldResponseFormData } from '@/types/customFields';

export default function PublicEventRegister() {
  const { eventUuid } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    gender: '',
    country: '',
    attendees: '1',
    dietary: '',
    agree: false,
    newsletter: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [visitorGuestTypeId, setVisitorGuestTypeId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [validationStatus, setValidationStatus] = useState<{
    email: 'idle' | 'checking' | 'valid' | 'invalid' | 'duplicate';
    phone: 'idle' | 'checking' | 'valid' | 'invalid' | 'duplicate';
  }>({
    email: 'idle',
    phone: 'idle'
  });
  const [existingGuestInfo, setExistingGuestInfo] = useState<any>(null);
  
  // Ticketing state
  const { isAuthenticated } = useAuth();
  const [purchaseStep, setPurchaseStep] = useState<'tickets' | 'payment' | 'confirmation'>('tickets');
  const [selectedTickets, setSelectedTickets] = useState<Array<{
    ticket_type_id: number;
    quantity: number;
    ticketType: PublicTicketType;
  }>>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [purchasedTickets, setPurchasedTickets] = useState<any[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentProgress, setPaymentProgress] = useState(0);
  const [ticketGuestInfo, setTicketGuestInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Custom fields state
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldResponses, setCustomFieldResponses] = useState<Record<number, CustomFieldResponseFormData>>({});
  const [customFieldErrors, setCustomFieldErrors] = useState<Record<number, string>>({});

  // Check if event is ticketed
  const isTicketedEvent = event?.event_type === 'ticketed';

  // Fetch ticket types for ticketed events
  const { data: ticketTypesData, isLoading: ticketTypesLoading } = usePublicEventTickets(
    (isTicketedEvent && eventUuid) ? eventUuid : ''
  );

  // Redirect all users (authenticated or not) to the public ticket purchase page for ticketed events
  useEffect(() => {
    if (isTicketedEvent && event?.id) {
      // Preserve invitation code in URL if present
      const invCode = searchParams.get('inv');
      const redirectUrl = invCode 
        ? `/tickets/purchase/${event.id}?inv=${invCode}`
        : `/tickets/purchase/${event.id}`;
      navigate(redirectUrl, { replace: true });
    }
  }, [isTicketedEvent, event, navigate, searchParams]);
  
  const genderOptions = ['Male', 'Female', 'Other'];
  const countryOptions = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
    'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
    'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
    'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
    'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
    'Haiti', 'Honduras', 'Hungary',
    'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast',
    'Jamaica', 'Japan', 'Jordan',
    'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
    'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
    'Oman',
    'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Qatar',
    'Romania', 'Russia', 'Rwanda',
    'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
    'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
    'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
    'Yemen',
    'Zambia', 'Zimbabwe'
  ];
  const attendeeOptions = ['1 Person', '2 People', '3 People', '4+ People'];

  // Extract referral code from URL parameters and track click
  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setReferralCode(refParam);
      console.log('Referral code detected:', refParam);
      
      // Track referral link click
      const trackClick = async () => {
        try {
          await api.post('/vendor-referrals/track-activity', {
            referral_code: refParam,
            activity_type: 'link_click',
            metadata: {
              event_uuid: eventUuid,
              user_agent: navigator.userAgent,
              timestamp: new Date().toISOString(),
              referrer: document.referrer,
            }
          });
          console.log('Referral click tracked successfully');
        } catch (error) {
          console.warn('Failed to track referral click:', error);
        }
      };
      
      trackClick();
    }
  }, [searchParams, eventUuid]);

  // Extract invitation code from URL parameters and track click
  useEffect(() => {
    const invParam = searchParams.get('inv');
    if (invParam) {
      setInvitationCode(invParam);
      console.log('[Invitation] Invitation code detected:', invParam);
      
      // Track invitation link click
      const trackInvitationClick = async () => {
        try {
          await api.post('/invitations/track-click', {
            invitation_code: invParam,
            user_agent: navigator.userAgent,
            ip_address: '', // Will be captured on backend
            referrer: document.referrer
          });
          console.log('[Invitation] Click tracked successfully');
        } catch (error) {
          console.warn('[Invitation] Failed to track click:', error);
        }
      };
      
      trackInvitationClick();
    }
  }, [searchParams, eventUuid]);

  useEffect(() => {
    if (!eventUuid) return;
    setLoading(true);
    api.get(`/public/events/${eventUuid}`)
      .then(res => {
        // Handle both data and data.data response structures
        const eventData = res.data?.data || res.data;
        console.log('[PublicEventRegister] Event data received:', eventData);
        setEvent(eventData);
      })
      .catch(err => {
        console.error('[PublicEventRegister] Error fetching event:', err);
        setError('Event not found or not accepting registrations.');
      })
      .finally(() => setLoading(false));
  }, [eventUuid]);

  useEffect(() => {
    if (!event || !event.uuid) return;
    api.get(`/public/events/${event.uuid}/guest-types`).then(res => {
      // Handle both data and data.data response structures
      const guestTypes = res.data?.data || res.data;
      console.log('[PublicEventRegister] Guest types received:', guestTypes);
      
      // Look for 'visitor' first, then 'regular', then use the first available guest type
      let guestType = guestTypes.find((gt: any) => gt.name.toLowerCase() === 'visitor');
      if (!guestType) {
        guestType = guestTypes.find((gt: any) => gt.name.toLowerCase() === 'regular');
      }
      if (!guestType && guestTypes.length > 0) {
        guestType = guestTypes[0]; // Use first available guest type
      }
      if (guestType) setVisitorGuestTypeId(guestType.id);
    }).catch(err => {
      console.error('Error fetching guest types:', err);
    });
  }, [event]);

  // Fetch custom fields when event and guest type are available
  useEffect(() => {
    if (!event?.uuid || !visitorGuestTypeId) return;
    
    getPublicEventCustomFields(event.uuid, Number(visitorGuestTypeId), 'registration')
      .then(fields => {
        setCustomFields(fields);
      })
      .catch(err => {
        console.error('Error fetching custom fields:', err);
        setCustomFields([]);
      });
  }, [event?.uuid, visitorGuestTypeId]);

  const checkExistingGuest = async (email: string, phone: string) => {
    if (!event?.uuid || (!email && !phone)) return;
    
    try {
      setValidationStatus(prev => ({ ...prev, email: 'checking', phone: 'checking' }));
      
      const response = await api.post(`/public/events/${event.uuid}/check-guest`, {
        email: email || '',
        phone: phone || ''
      });
      
      const { exists, already_registered, has_conflict, conflict_message, guest_info } = response.data;
      
      if (exists) {
        if (already_registered) {
          setValidationStatus(prev => ({ ...prev, email: 'duplicate', phone: 'duplicate' }));
          setFieldErrors(prev => ({ 
            ...prev, 
            email: 'You are already registered for this event.',
            phone: 'You are already registered for this event.'
          }));
        } else if (has_conflict) {
          setValidationStatus(prev => ({ ...prev, email: 'invalid', phone: 'invalid' }));
          setFieldErrors(prev => ({ 
            ...prev, 
            email: conflict_message,
            phone: conflict_message
          }));
        } else {
          // Guest exists but not registered for this event - allow registration silently
          setValidationStatus(prev => ({ ...prev, email: 'valid', phone: 'valid' }));
          setExistingGuestInfo(guest_info);
          setFieldErrors(prev => ({ 
            ...prev, 
            email: '', 
            phone: '' 
          }));
        }
      } else {
        setValidationStatus(prev => ({ ...prev, email: 'valid', phone: 'valid' }));
        setExistingGuestInfo(null);
        setFieldErrors(prev => ({ 
          ...prev, 
          email: '', 
          phone: '' 
        }));
      }
    } catch (error) {
      console.error('Error checking existing guest:', error);
      setValidationStatus(prev => ({ ...prev, email: 'idle', phone: 'idle' }));
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Debounced validation for email and phone
    if (field === 'email' || field === 'phone') {
      const timeoutId = setTimeout(() => {
        if (value.trim()) {
          checkExistingGuest(
            field === 'email' ? value : form.email,
            field === 'phone' ? value : form.phone
          );
        }
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'name':
        return !value.trim() ? 'Please enter your full name' : '';
      case 'email':
        if (!value.trim()) return 'Please enter your email address';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) return 'Please enter a valid email address';
        return '';
      case 'phone':
        if (!value.trim()) return 'Please enter your phone number';
        // Ethiopian phone validation - 09, 07, +251 9, +251 7, 9, 7 (9 digits total)
        const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
        const ethiopianPhoneRegex = /^(0[97]\d{8}|\+251[97]\d{8}|[97]\d{8})$/;
        if (!ethiopianPhoneRegex.test(cleanPhone)) {
          return 'Please enter a valid Ethiopian phone number (09, 07, +251 9, +251 7, 9, or 7 format)';
        }
        return '';
      case 'company':
        return !value.trim() ? 'Please enter your company name' : '';
      case 'job_title':
        return !value.trim() ? 'Please enter your job title' : '';
      case 'gender':
        return !value.trim() ? 'Please select your gender' : '';
      case 'country':
        return !value.trim() ? 'Please select your country' : '';
      case 'agree':
        return !value ? 'You must agree to the terms and conditions' : '';
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate all required fields including email
    const requiredFields = ['name', 'email', 'phone', 'company', 'job_title', 'gender', 'country', 'agree'];
    requiredFields.forEach(field => {
      const error = validateField(field, form[field as keyof typeof form]);
      if (error) {
        errors[field] = error;
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      // Mark all fields as touched to show errors
      const allFields = ['name', 'email', 'phone', 'company', 'job_title', 'gender', 'country', 'agree'];
      setTouchedFields(prev => {
        const newTouched = { ...prev };
        allFields.forEach(field => {
          newTouched[field] = true;
        });
        return newTouched;
      });
      return;
    }

    if (!event?.uuid || !visitorGuestTypeId) {
      toast.error('Registration not available for this event.');
      return;
    }

    // Validate custom fields
    const customFieldErrors: Record<number, string> = {};
    customFields.forEach(field => {
      const response = customFieldResponses[field.id!];
      if (field.is_required) {
        if (field.field_type === 'file') {
          if (!response?.file) {
            customFieldErrors[field.id!] = `${field.field_label} is required`;
          }
        } else {
          if (!response?.value || response.value.trim() === '') {
            customFieldErrors[field.id!] = `${field.field_label} is required`;
          }
        }
      }
    });

    if (Object.keys(customFieldErrors).length > 0) {
      setCustomFieldErrors(customFieldErrors);
      toast.error('Please fill in all required custom fields');
      return;
    }

    setSubmitting(true);
    try {
      // Check if we have file uploads
      const hasFileUploads = Object.values(customFieldResponses).some(r => r.file);
      
      if (hasFileUploads) {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('email', form.email);
        formData.append('phone', form.phone);
        formData.append('company', form.company || '');
        formData.append('job_title', form.job_title || '');
        formData.append('gender', form.gender || '');
        formData.append('country', form.country || '');
        formData.append('guest_type_id', visitorGuestTypeId);
        if (referralCode) formData.append('referral_code', referralCode);
        if (invitationCode) formData.append('invitation_code', invitationCode);
        
        // Add custom field responses
        Object.values(customFieldResponses).forEach((response, index) => {
          formData.append(`custom_field_responses[${index}][field_id]`, response.field_id.toString());
          if (response.value) {
            formData.append(`custom_field_responses[${index}][value]`, response.value);
          }
          if (response.file) {
            formData.append(`custom_field_responses[${index}][file]`, response.file);
          }
        });

        const response = await api.post(`/public/events/${event.uuid}/register`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // Handle success response (same as below)
        if (response.data?.attendee && response.data?.event) {
          const params = new URLSearchParams({
            attendeeId: response.data.attendee.id.toString(),
            eventId: response.data.event.id.toString(),
            eventName: response.data.event.name,
            eventDate: response.data.event.start_date || '',
            eventTime: response.data.event.start_date || '',
            eventLocation: response.data.event.venue_name || response.data.event.location || '',
            guestName: response.data.attendee.guest_name,
            guestEmail: response.data.attendee.guest_email,
            guestPhone: response.data.attendee.guest_phone,
            guestCompany: response.data.attendee.guest_company,
            guestJobTitle: response.data.attendee.guest_job_title,
            guestGender: response.data.attendee.guest_gender,
            guestCountry: response.data.attendee.guest_country,
            guestUuid: response.data.attendee.guest_uuid || '',
            guestTypeName: response.data.attendee.guest_type_name,
          });
          navigate(`/registration/success?${params.toString()}`);
        } else {
          toast.success('Registration successful!');
          navigate('/registration/success');
        }
        return;
      }

      // No file uploads, use regular JSON
      const registrationData: any = {
        ...form,
        guest_type_id: visitorGuestTypeId,
        referral_code: referralCode,
        invitation_code: invitationCode,
      };

      // Add custom field responses
      if (Object.keys(customFieldResponses).length > 0) {
        registrationData.custom_field_responses = Object.values(customFieldResponses).map(response => ({
          field_id: response.field_id,
          value: response.value || '',
        }));
      }

      const response = await api.post(`/public/events/${event.uuid}/register`, registrationData);
      
      // Track referral activity if referral code exists
      if (referralCode) {
        try {
          await api.post('/vendor-referrals/track-activity', {
            referral_code: referralCode,
            activity_type: 'registration',
            guest_id: response.data?.attendee?.guest_id,
            attendee_id: response.data?.attendee?.id,
            metadata: {
              event_uuid: event.uuid,
              event_name: event.name,
              registration_date: new Date().toISOString(),
            }
          });
          console.log('Referral activity tracked successfully');
        } catch (trackingError) {
          console.warn('Failed to track referral activity:', trackingError);
          // Don't fail the registration if tracking fails
        }
      }
      
      // Navigate to confirmation page with registration data
      if (response.data?.attendee && response.data?.event) {
        const params = new URLSearchParams({
          attendeeId: response.data.attendee.id.toString(),
          eventId: response.data.event.id.toString(),
          eventName: response.data.event.name,
          eventDate: response.data.event.start_date || '',
          eventTime: response.data.event.start_date || '',
          eventLocation: response.data.event.venue_name || response.data.event.location || '',
          guestName: response.data.attendee.guest_name,
          guestEmail: response.data.attendee.guest_email,
          guestPhone: response.data.attendee.guest_phone,
          guestCompany: response.data.attendee.guest_company,
          guestJobTitle: response.data.attendee.guest_job_title,
          guestGender: response.data.attendee.guest_gender,
          guestCountry: response.data.attendee.guest_country,
          guestUuid: response.data.attendee.guest_uuid || '',
          guestTypeName: response.data.attendee.guest_type_name,
          guestTypePrice: response.data.attendee.guest_type_price?.toString() || '0',
        });
        
        navigate(`/registration/success?${params.toString()}`);
      } else {
        // Fallback to old success state if backend doesn't return expected data
        setSuccess(true);
        toast.success('Registration successful! Check your email for confirmation and your e-badge.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Ticketing handlers
  const handleContinueToPayment = () => {
    setPurchaseStep('payment');
  };

  const handleBackToTickets = () => {
    setPurchaseStep('tickets');
    setSelectedPaymentMethod(null);
  };

  const handlePaymentConfirm = async () => {
    if (!selectedPaymentMethod || !event?.uuid || selectedTickets.length === 0) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentStatus('pending');
    setPaymentMessage('Processing your payment...');
    setPaymentProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setPaymentProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Initiate payment
      const paymentResponse = await api.post('/guest/payments/initiate', {
        event_uuid: event.uuid,
        tickets: selectedTickets.map(t => ({
          ticket_type_id: t.ticket_type_id,
          quantity: t.quantity,
        })),
        attendee_details: {
          name: ticketGuestInfo.name,
          email: ticketGuestInfo.email,
          phone: ticketGuestInfo.phone,
          agreed_to_terms: true,
        },
        payment_method: selectedPaymentMethod,
      });

      if (!paymentResponse.data?.success) {
        throw new Error('Payment initiation failed');
      }

      const paymentId = paymentResponse.data.data.payment_id;

      // Poll payment status (simulating payment processing)
      let attempts = 0;
      const maxAttempts = 10;
      
      const checkStatus = async (): Promise<void> => {
        attempts++;
        
        try {
          const statusResponse = await api.get(`/guest/payments/${paymentId}`);
          const payment = statusResponse.data.data;

          if (payment.status === 'success') {
            clearInterval(progressInterval);
            setPaymentProgress(100);
            setPaymentStatus('success');
            setPaymentMessage('Payment successful! Your tickets have been generated.');

            // Confirm payment to get tickets
            const confirmResponse = await api.post(`/guest/payments/${paymentId}/confirm`);
            if (confirmResponse.data?.success) {
              setPurchasedTickets(confirmResponse.data.data.tickets || []);
              setPurchaseStep('confirmation');
            }
            return;
          }

          if (payment.status === 'failed' || payment.status === 'cancelled') {
            clearInterval(progressInterval);
            setPaymentStatus('failed');
            setPaymentMessage('Payment failed. Please try again.');
            return;
          }

          // Still pending, check again
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 2000);
          } else {
            clearInterval(progressInterval);
            setPaymentStatus('failed');
            setPaymentMessage('Payment timeout. Please check your email or contact support.');
          }
        } catch (error) {
          clearInterval(progressInterval);
          setPaymentStatus('failed');
          setPaymentMessage('Payment verification failed. Please try again.');
        }
      };

      // Start checking status after 2 seconds
      setTimeout(checkStatus, 2000);

    } catch (error: any) {
      setIsProcessingPayment(false);
      setPaymentStatus('failed');
      setPaymentMessage(error.response?.data?.message || 'Payment failed. Please try again.');
      toast.error('Payment failed');
    }
  };

  const handleClosePaymentModal = () => {
    setIsProcessingPayment(false);
    setPaymentProgress(0);
    setPaymentStatus('pending');
  };

  const handleRetryPayment = () => {
    handleClosePaymentModal();
    setPurchaseStep('payment');
  };

  // Show redirecting message for authenticated users on ticketed events
  if (isTicketedEvent && isAuthenticated && event?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <SpinnerInline className="mx-auto" />
          <p className="mt-4 text-muted-foreground">Redirecting to ticket purchase...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <SpinnerInline className="mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Event Not Found</h1>
          <p className="text-muted-foreground">{error || 'This event is not available for registration.'}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
          <p className="text-gray-600 mb-6">Thank you for registering for {event.name}.</p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="font-semibold">E-Badge Sent!</span>
            </div>
            <p className="text-blue-700 text-sm">
              Your digital visitor badge has been sent to your email. Please save it to your device or print it for easy access during the event.
            </p>
          </div>
          
          <div className="text-xs text-muted-foreground/70">
            You will receive a confirmation email shortly with all the event details.
          </div>
        </div>
      </div>
    );
  }

  // Helper functions
  const startDate = event.start_date ? new Date(event.start_date) : null;
  const endDate = event.end_date ? new Date(event.end_date) : null;
  const organizerName = event.organizer?.name || 'Event Organizer';
  const organizerLogo = event.organizer?.logo || '/default-organizer-logo.png';

  const getEventDuration = () => {
    if (!startDate || !endDate) return 'TBD';
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 Day' : `${diffDays} Days`;
  };

  const getAttendeeInfo = () => {
    const current = event.attendees_count || 0;
    const max = event.max_attendees || 'Unlimited';
    return `${current}/${max}`;
  };

  const getWhatsIncluded = () => {
    const included = ['Premium event access', 'Digital certificate', 'Resource materials', 'Networking opportunities'];
    if (event.whats_included) {
      return event.whats_included.split(',').map((item: string) => item.trim());
    }
    return included;
  };

  const getDaysRemaining = () => {
    if (!startDate) return null;
    const now = new Date();
    const diffTime = startDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-semibold text-gray-900">Evella</span>
          </div>
          <span className="text-gray-500 text-sm">{organizerName}</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-card py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          {/* Event Tag */}
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-3 py-1 rounded-full text-sm font-medium mb-4">
            <Lamp className="w-4 h-4" />
            <span>{event.category?.name || 'Tech Conference'} • Premium Event</span>
          </div>
          
          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            <span className="block">Welcome to</span>
            <span className="block text-yellow-600">{event.name}</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {event.description || 'An exclusive industry gathering designed for visionary professionals. Limited seats available for this premium experience.'}
          </p>
        </div>
      </div>

      {/* Key Event Details Cards */}
      <div className="bg-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Event Date Card */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6 text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-muted-foreground text-sm font-medium mb-1">Event Date</h3>
              <p className="text-card-foreground font-bold text-lg">
                {startDate ? startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'TBD'}
                {endDate && startDate && endDate.getTime() !== startDate.getTime() && 
                  ` - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                }
              </p>
              <p className="text-muted-foreground/70 text-sm">
                {startDate ? startDate.getFullYear() : ''}
              </p>
            </div>

            {/* Location Card */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6 text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-muted-foreground text-sm font-medium mb-1">Location</h3>
              <p className="text-card-foreground font-bold text-lg">
                {event.venue_name || event.location || 'TBD'}
              </p>
            </div>

            {/* Attendees Card */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6 text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-muted-foreground text-sm font-medium mb-1">Attendees</h3>
              <p className="text-card-foreground font-bold text-lg">{getAttendeeInfo()}</p>
              <p className="text-muted-foreground/70 text-sm">Still accepting</p>
            </div>

            {/* Duration Card */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6 text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-muted-foreground text-sm font-medium mb-1">Duration</h3>
              <p className="text-card-foreground font-bold text-lg">{getEventDuration()}</p>
              <p className="text-muted-foreground/70 text-sm">Full Event</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Informational Blocks */}
          <div className="lg:col-span-1 space-y-6">
            {/* Event Organizer Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">Event Organizer</h3>
              </div>
              <p className="font-semibold text-gray-900">{organizerName}</p>
              <p className="text-muted-foreground/70 text-sm">Professional Event Management</p>
            </div>

            {/* What's Included Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">What's Included</h3>
              </div>
              <ul className="space-y-2">
                {getWhatsIncluded().map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Event Countdown Card */}
            {daysRemaining !== null && (
              <div className="bg-card rounded-xl shadow-sm border border-border p-6 text-center">
                <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm mb-1">Event starts in</p>
                <p className="text-3xl font-bold text-yellow-600 mb-1">{daysRemaining}</p>
                <p className="text-muted-foreground/70 text-sm">days remaining</p>
              </div>
            )}
          </div>

          {/* Right Column - Ticketing or Registration Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 lg:p-8">
              {/* Ticketed Event Flow */}
              {isTicketedEvent && purchaseStep === 'tickets' && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Purchase Tickets</h2>
                    <p className="text-gray-600">
                      Select your tickets and provide your information to complete your purchase.
                    </p>
                  </div>
                  <PublicTicketSelector
                    ticketTypes={ticketTypesData?.ticket_types || []}
                    selections={selectedTickets}
                    onSelectionsChange={setSelectedTickets}
                    guestInfo={ticketGuestInfo}
                    onGuestInfoChange={setTicketGuestInfo}
                    onContinue={handleContinueToPayment}
                    loading={ticketTypesLoading}
                  />
                </>
              )}

              {isTicketedEvent && purchaseStep === 'payment' && (
                <PublicPaymentSelector
                  selected={selectedPaymentMethod}
                  onSelect={setSelectedPaymentMethod}
                  onBack={handleBackToTickets}
                  onConfirm={handlePaymentConfirm}
                  totalAmount={selectedTickets.reduce((sum, t) => sum + t.ticketType.price * t.quantity, 0)}
                  loading={isProcessingPayment}
                />
              )}

              {isTicketedEvent && purchaseStep === 'confirmation' && (
                <PublicTicketDisplay
                  tickets={purchasedTickets}
                  event={{
                    name: event.name,
                    start_date: event.start_date,
                    location: event.location || event.venue_name || 'TBD',
                  }}
                  guestInfo={{
                    name: ticketGuestInfo.name,
                    email: ticketGuestInfo.email,
                  }}
                />
              )}

              {/* Free Event Registration Form */}
              {!isTicketedEvent && (
                <>
                  {/* Form Header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <h2 className="text-2xl font-bold text-gray-900">Register for {event.name}</h2>
                    </div>
                    <p className="text-gray-600">
                      Secure your spot at this exclusive industry event. Complete the form below to join this premium experience with limited availability.
                    </p>
                    
                    {/* Referral Indicator */}
                    {referralCode && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                            <Star className="w-3 h-3 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-purple-800">
                              You were referred to this event!
                            </p>
                            <p className="text-xs text-purple-600">
                              Referral Code: <span className="font-mono font-semibold">{referralCode}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Full Name*
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      disabled={submitting}
                      placeholder="Enter your full name"
                      className={`mt-1 ${touchedFields.name && fieldErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {touchedFields.name && fieldErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address*
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      disabled={submitting}
                      placeholder="Enter your email address"
                      className={`mt-1 ${touchedFields.email && fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {touchedFields.email && fieldErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone Number*
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      disabled={submitting}
                      placeholder="Enter your phone number"
                      className={`mt-1 ${touchedFields.phone && fieldErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {touchedFields.phone && fieldErrors.phone && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
                    )}
                  </div>

                  {/* Company */}
                  <div>
                    <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                      Company*
                    </Label>
                    <Input
                      id="company"
                      name="company"
                      value={form.company}
                      onChange={(e) => handleFieldChange('company', e.target.value)}
                      disabled={submitting}
                      placeholder="Enter your company name"
                      className={`mt-1 ${touchedFields.company && fieldErrors.company ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {touchedFields.company && fieldErrors.company && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.company}</p>
                    )}
                  </div>

                  {/* Job Title */}
                  <div>
                    <Label htmlFor="job_title" className="text-sm font-medium text-gray-700">
                      Job Title*
                    </Label>
                    <Input
                      id="job_title"
                      name="job_title"
                      value={form.job_title}
                      onChange={(e) => handleFieldChange('job_title', e.target.value)}
                      disabled={submitting}
                      placeholder="Enter your job title"
                      className={`mt-1 ${touchedFields.job_title && fieldErrors.job_title ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {touchedFields.job_title && fieldErrors.job_title && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.job_title}</p>
                    )}
                  </div>

                  {/* Age */}
                  <div>
                    <Label htmlFor="age" className="text-sm font-medium text-gray-700">
                      Age*
                    </Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      min="18"
                      max="120"
                      value={form.age || ''}
                      onChange={(e) => handleFieldChange('age', e.target.value)}
                      disabled={submitting}
                      placeholder="Enter your age"
                      className="mt-1"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                      Gender*
                    </Label>
                    <Select value={form.gender} onValueChange={(value) => handleFieldChange('gender', value)} disabled={submitting}>
                      <SelectTrigger className={`mt-1 ${touchedFields.gender && fieldErrors.gender ? 'border-error focus:border-error focus:ring-error/20' : ''}`}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {genderOptions.map((gender) => (
                          <SelectItem key={gender} value={gender}>
                            {gender}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {touchedFields.gender && fieldErrors.gender && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.gender}</p>
                    )}
                  </div>

                  {/* Country */}
                  <div>
                    <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                      Country*
                    </Label>
                    <Select value={form.country} onValueChange={(value) => handleFieldChange('country', value)} disabled={submitting}>
                      <SelectTrigger className={`mt-1 ${touchedFields.country && fieldErrors.country ? 'border-error focus:border-error focus:ring-error/20' : ''}`}>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countryOptions.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {touchedFields.country && fieldErrors.country && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.country}</p>
                    )}
                  </div>
                </div>

                {/* Consent and Newsletter */}
                <div className="space-y-3 pt-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="agree"
                      checked={form.agree}
                      onCheckedChange={(checked) => handleFieldChange('agree', checked)}
                      disabled={submitting}
                      className="mt-1"
                    />
                    <Label htmlFor="agree" className="text-sm text-gray-700 leading-relaxed">
                      I agree to the{' '}
                      <a href="/terms" target="_blank" className="text-yellow-600 hover:underline">
                        Terms and Conditions
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" target="_blank" className="text-yellow-600 hover:underline">
                        Privacy Policy
                      </a>
                      .*
                    </Label>
                  </div>
                  {touchedFields.agree && fieldErrors.agree && (
                    <p className="text-sm text-red-600">{fieldErrors.agree}</p>
                  )}

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="newsletter"
                      checked={form.newsletter}
                      onCheckedChange={(checked) => handleFieldChange('newsletter', checked)}
                      disabled={submitting}
                      className="mt-1"
                    />
                    <Label htmlFor="newsletter" className="text-sm text-gray-700 leading-relaxed">
                      Subscribe to our newsletter for event updates and future announcements
                    </Label>
                  </div>
                </div>

                {/* Custom Fields */}
                {customFields.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <CustomFieldsRenderer
                      fields={customFields}
                      values={customFieldResponses}
                      onChange={(fieldId, value) => {
                        setCustomFieldResponses(prev => ({
                          ...prev,
                          [fieldId]: value,
                        }))
                        // Clear error when user starts typing
                        if (customFieldErrors[fieldId]) {
                          setCustomFieldErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors[fieldId]
                            return newErrors
                          })
                        }
                      }}
                      errors={customFieldErrors}
                    />
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-colors"
                >
                  {submitting ? 'Registering...' : 'Register Now'}
                </Button>

                {/* Footer Text */}
                <p className="text-center text-xs text-gray-500">
                  Secure registration protected by{' '}
                  <a href="/privacy" target="_blank" className="text-yellow-600 hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </form>
              </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Processing Modal */}
      <PaymentProcessingModal
        open={isProcessingPayment}
        status={paymentStatus}
        message={paymentMessage}
        progress={paymentProgress}
        onClose={handleClosePaymentModal}
        onRetry={handleRetryPayment}
      />
    </div>
  );
} 