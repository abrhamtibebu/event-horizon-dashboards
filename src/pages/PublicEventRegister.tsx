import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Calendar, MapPin, Users, Clock, Star, Sparkles, AlertCircle, Lamp, User, CheckCircle, Building, UserCog, Mail, Phone } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { PublicTicketSelector } from '@/components/public/PublicTicketSelector';
import { PublicPaymentSelector } from '@/components/public/PublicPaymentSelector';
import { PublicTicketDisplay } from '@/components/public/PublicTicketDisplay';
import { PaymentProcessingModal } from '@/components/payments/PaymentProcessingModal';
import DynamicFormRenderer from '@/components/public/DynamicFormRenderer';
import { usePublicEventTickets, useInitiateGuestPayment } from '@/lib/api/publicTickets';
import { useAuth } from '@/hooks/use-auth';
import type { PaymentMethod, PaymentStatus } from '@/types/tickets';
import type { PublicTicketType } from '@/types/publicTickets';
import { SpinnerInline } from '@/components/ui/spinner';

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
    age: '',
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
  const [useCustomForm, setUseCustomForm] = useState(false);
  const [selectedGuestTypeId, setSelectedGuestTypeId] = useState<number | null>(null);
  const [customFormParticipantType, setCustomFormParticipantType] = useState<string>('attendee'); // Deprecated - kept for backward compatibility
  const [existingGuestInfo, setExistingGuestInfo] = useState<any>(null);
  const [guestTypes, setGuestTypes] = useState<any[]>([]);

  const handleCustomFormSuccess = useCallback(() => {
    setSuccess(true);
    toast.success('Registration successful! Your e-badge is on its way.');
  }, []);

  const handleCustomFormError = useCallback((error: string) => {
    toast.error(error);
  }, []);

  const handleCustomFormFallback = useCallback(() => {
    setUseCustomForm(false);
  }, []);

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
        // Set guest types from event data
        if (eventData?.guestTypes) {
          setGuestTypes(Array.isArray(eventData.guestTypes) ? eventData.guestTypes : []);
        }
      })
      .catch(err => {
        console.error('[PublicEventRegister] Error fetching event:', err);
        setError('Event not found or not accepting registrations.');
      })
      .finally(() => setLoading(false));
  }, [eventUuid]);

  useEffect(() => {
    if (!event || !event.uuid) return;
    api.get(`/public/events/${event.uuid}/guest-types`).then(async (res) => {
      const guestTypesData = res.data?.data || res.data;
      if (!guestTypesData || guestTypesData.length === 0) return;

      setGuestTypes(guestTypesData);

      // Look for 'visitor' first, then 'regular', then use the first available guest type
      let guestType = guestTypesData.find((gt: any) => gt.name.toLowerCase() === 'visitor');
      if (!guestType) {
        guestType = guestTypesData.find((gt: any) => gt.name.toLowerCase() === 'regular');
      }
      if (!guestType && guestTypesData.length > 0) {
        guestType = guestTypesData[0];
      }

      if (guestType) {
        setVisitorGuestTypeId(guestType.id);
        setSelectedGuestTypeId(guestType.id);

        // Check if there's a custom form for this auto-selected guest type
        try {
          const formRes = await api.get(`/events/${event.id}/forms/by-guest-type/${guestType.id}`);
          if (formRes.data?.status === 'active') {
            setUseCustomForm(true);
          }
        } catch (err) {
          setUseCustomForm(false);
        }
      }
    }).catch(err => {
      console.error('Error fetching guest types:', err);
    });
  }, [event]);


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

    setSubmitting(true);
    try {
      // Check if we need FormData (for future file uploads)
      const needsFormData = false;

      if (needsFormData) {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('email', form.email);
        formData.append('phone', form.phone);
        formData.append('company', form.company || '');
        formData.append('job_title', form.job_title || '');
        formData.append('gender', form.gender || '');
        formData.append('country', form.country || '');
        formData.append('guest_type_id', (selectedGuestTypeId || visitorGuestTypeId)?.toString() || '');
        if (referralCode) formData.append('referral_code', referralCode);
        if (invitationCode) formData.append('invitation_code', invitationCode);

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
        guest_type_id: selectedGuestTypeId || visitorGuestTypeId,
        referral_code: referralCode,
        invitation_code: invitationCode,
      };

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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-10">
        {/* Top Logos Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-10 animate-fade-in transition-all duration-700">
          <Link to="/" className="inline-block group transition-transform hover:scale-105">
            <div className="flex items-center gap-3">
              <img src="/evella-logo.png" alt="Evella" className="w-10 h-10 object-contain shadow-lg shadow-primary/20 rounded-xl" />
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                  Evella
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Event Platform</span>
              </div>
            </div>
          </Link>

          {organizerName && (
            <div className="flex items-center gap-4 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl border border-white/20 shadow-sm transition-all hover:shadow-md hover:bg-white/60 w-full sm:w-auto justify-center sm:justify-start">
              <div className="flex flex-col items-center sm:items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Organized by</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white max-w-[180px] sm:max-w-[200px] truncate">{organizerName}</span>
              </div>
              {event.organizer?.logo ? (
                <img
                  src={getImageUrl(event.organizer.logo)}
                  alt={organizerName}
                  className="h-9 w-9 sm:h-10 sm:w-10 object-contain rounded-xl shadow-sm border border-white/50"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/evella-logo.png';
                  }}
                />
              ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Building className="w-5 h-5 text-primary" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden animate-scale-in transition-all duration-500">
          {/* Event Banner */}
          <div className="relative h-48 sm:h-80 overflow-hidden">
            {event.event_image ? (
              <img
                src={getImageUrl(event.event_image)}
                alt={event.name}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full relative group bg-slate-900">
                <img
                  src="/event-placeholder.png"
                  alt="Event Placeholder"
                  className="w-full h-full object-cover opacity-60 dark:opacity-50 blur-[1px]"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent to-black/40">
                  <Sparkles className="w-12 sm:w-20 h-12 sm:h-20 text-white/40 animate-pulse drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]" />
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex items-end p-5 sm:p-10">
              <div className="w-full">
                <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-md border border-primary/30 text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] mb-2 sm:mb-4">
                  <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400 fill-yellow-400" />
                  <span>{event.category?.name || 'Featured Event'}</span>
                </div>
                <h1 className="text-xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow-2xl leading-tight">
                  {event.name}
                </h1>
              </div>
            </div>
          </div>

          {/* Quick Info Grid - Responsive stacking */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200/50 dark:bg-slate-800 border-b border-white/10">
            <div className="bg-white/50 dark:bg-slate-900/50 p-4 sm:p-6 text-center group hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-primary/10 transition-colors">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Date</p>
              <p className="text-[11px] sm:text-sm font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1">
                {startDate ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
              </p>
            </div>
            <div className="bg-white/50 dark:bg-slate-900/50 p-4 sm:p-6 text-center group hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-primary/10 transition-colors">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Time</p>
              <p className="text-[11px] sm:text-sm font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1">
                {event.time || (startDate ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Flexible')}
              </p>
            </div>
            <div className="bg-white/50 dark:bg-slate-900/50 p-4 sm:p-6 text-center group hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-primary/10 transition-colors">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Venue</p>
              <p className="text-[11px] sm:text-sm font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1 truncate px-1" title={event.venue_name || event.location}>
                {event.venue_name || event.location || 'Online'}
              </p>
            </div>
            <div className="bg-white/50 dark:bg-slate-900/50 p-4 sm:p-6 text-center group hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 transition-colors">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Capacity</p>
              <p className="text-[11px] sm:text-sm font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1">
                {event.max_guests ? `${event.attendee_count || 0} / ${event.max_guests}` : 'Open'}
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-12">
            {/* Description Card */}
            {event.description && (
              <div className="mb-8 sm:mb-12 text-center max-w-2xl mx-auto">
                <div className="inline-block px-4 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-full text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-3 sm:mb-4 uppercase tracking-widest border border-slate-100 dark:border-slate-700">
                  About Event
                </div>
                <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 italic font-medium px-2 sm:px-0">
                  &ldquo;{event.description}&rdquo;
                </p>
              </div>
            )}

            {/* Registration/Ticket Flow */}
            <div className="max-w-2xl mx-auto">
              {useCustomForm && !isTicketedEvent && selectedGuestTypeId ? (
                <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-inner overflow-hidden">
                  <DynamicFormRenderer
                    eventId={Number(event?.id)}
                    guestTypeId={selectedGuestTypeId}
                    participantType={customFormParticipantType}
                    onSuccess={handleCustomFormSuccess}
                    onError={handleCustomFormError}
                    onFallback={handleCustomFormFallback}
                  />
                </div>
              ) : (
                <div className="space-y-6 sm:space-y-10">
                  {/* Ticketed Event View */}
                  {isTicketedEvent && (
                    <div className="animate-fade-in">
                      {purchaseStep === 'tickets' && (
                        <div className="space-y-6 sm:space-y-8">
                          <div className="text-center">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Select Your Tickets</h2>
                            <p className="text-xs sm:text-sm text-slate-500 mt-2">Choose the perfect pass for your experience</p>
                          </div>

                          <PublicTicketSelector
                            ticketTypes={ticketTypesData || []}
                            selectedTickets={selectedTickets}
                            onTicketChange={handleTicketChange}
                          />

                          <Button
                            onClick={() => setPurchaseStep('payment')}
                            disabled={selectedTickets.length === 0}
                            className="w-full h-12 sm:h-14 rounded-2xl bg-primary hover:bg-primary-hover text-white font-extrabold shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-4 text-sm sm:text-base"
                          >
                            Proceed to Checkout
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      )}

                      {purchaseStep === 'payment' && (
                        <PublicPaymentSelector
                          selected={selectedPaymentMethod}
                          onSelect={setSelectedPaymentMethod}
                          onBack={handleBackToTickets}
                          onConfirm={handlePaymentConfirm}
                          totalAmount={selectedTickets.reduce((sum, t) => sum + t.ticketType.price * t.quantity, 0)}
                          loading={isProcessingPayment}
                        />
                      )}

                      {purchaseStep === 'confirmation' && (
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
                    </div>
                  )}

                  {/* Free Event View */}
                  {!isTicketedEvent && (
                    <div className="animate-fade-in space-y-8 sm:space-y-12">
                      {/* Guest Type Selector */}
                      {guestTypes.length > 0 && (
                        <div className="space-y-4 sm:space-y-6">
                          <p className="text-[10px] sm:text-xs font-bold text-slate-500 text-center uppercase tracking-[0.2em]">
                            Joining as
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-2 sm:px-0">
                            {guestTypes.map((gt) => (
                              <button
                                key={gt.id}
                                type="button"
                                onClick={async () => {
                                  setSelectedGuestTypeId(gt.id);
                                  try {
                                    const res = await api.get(`/events/${event.id}/forms/by-guest-type/${gt.id}`);
                                    setUseCustomForm(res.data?.status === 'active');
                                  } catch {
                                    setUseCustomForm(false);
                                  }
                                }}
                                className={`px-4 py-4 rounded-xl sm:rounded-2xl text-sm font-bold border-2 transition-all duration-300 flex items-center justify-center text-center ${selectedGuestTypeId === gt.id
                                  ? 'bg-primary border-primary text-white shadow-xl shadow-primary/30 -translate-y-1'
                                  : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-primary/40'
                                  }`}
                              >
                                {gt.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-center px-4">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Secure Your Spot</h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">Registration is fast and takes less than a minute</p>
                      </div>

                      {/* Referral Badge */}
                      {referralCode && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 p-5 rounded-3xl flex items-center gap-5">
                          <div className="w-12 h-12 bg-white dark:bg-indigo-800 rounded-2xl flex items-center justify-center shadow-sm">
                            <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <p className="font-bold text-indigo-900 dark:text-indigo-100">Special Invitation</p>
                            <p className="text-xs text-indigo-700/70 dark:text-indigo-300/70">Referred by code: <span className="font-mono font-bold">{referralCode}</span></p>
                          </div>
                        </div>
                      )}

                      {/* Form */}
                      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                        <div className="space-y-2 sm:col-span-2 md:col-span-1">
                          <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</Label>
                          <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                              id="name"
                              value={form.name}
                              onChange={(e) => handleFieldChange('name', e.target.value)}
                              className={`pl-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-primary/10 transition-all ${touchedFields.name && fieldErrors.name ? 'ring-2 ring-red-500/20 bg-red-50/30' : ''}`}
                              placeholder="e.g. Abebe Bikila"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 sm:col-span-2 md:col-span-1">
                          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</Label>
                          <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                              id="email"
                              type="email"
                              value={form.email}
                              onChange={(e) => handleFieldChange('email', e.target.value)}
                              className={`pl-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-primary/10 transition-all ${touchedFields.email && fieldErrors.email ? 'ring-2 ring-red-500/20 bg-red-50/30' : ''}`}
                              placeholder="abebe@example.com"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone</Label>
                          <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                              id="phone"
                              value={form.phone}
                              onChange={(e) => handleFieldChange('phone', e.target.value)}
                              className={`pl-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-primary/10 transition-all ${touchedFields.phone && fieldErrors.phone ? 'ring-2 ring-red-500/20 bg-red-50/30' : ''}`}
                              placeholder="0911..."
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="company" className="text-xs font-bold uppercase tracking-wider text-slate-500">Organization</Label>
                          <div className="relative group">
                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                              id="company"
                              value={form.company}
                              onChange={(e) => handleFieldChange('company', e.target.value)}
                              className="pl-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-primary/10 transition-all"
                              placeholder="Company name"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="job_title" className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Role</Label>
                          <div className="relative group">
                            <UserCog className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                              id="job_title"
                              value={form.job_title}
                              onChange={(e) => handleFieldChange('job_title', e.target.value)}
                              className="pl-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-primary/10 transition-all"
                              placeholder="Position"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-xs font-bold uppercase tracking-wider text-slate-500">Country</Label>
                          <Select value={form.country} onValueChange={(v) => handleFieldChange('country', v)}>
                            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-transparent focus:ring-4 focus:ring-primary/10 transition-all">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800">
                              {countryOptions.map(c => <SelectItem key={c} value={c} className="rounded-xl">{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="sm:col-span-2 pt-6 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                            <Checkbox
                              id="agree"
                              checked={form.agree}
                              onCheckedChange={(v) => handleFieldChange('agree', v)}
                              className="mt-1 rounded-md border-slate-300"
                            />
                            <Label htmlFor="agree" className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed cursor-pointer select-none">
                              I certify that all information provided is accurate and I agree to the <a href="/terms" className="text-primary font-bold hover:underline">Terms of Service</a> and <a href="/privacy" className="text-primary font-bold hover:underline">Privacy Policy</a>.
                            </Label>
                          </div>
                          {touchedFields.agree && fieldErrors.agree && (
                            <p className="mt-2 text-xs text-red-500 font-bold px-4">{fieldErrors.agree}</p>
                          )}
                        </div>

                        <Button
                          type="submit"
                          disabled={submitting}
                          className="sm:col-span-2 h-14 bg-primary hover:bg-primary-hover text-white font-extrabold text-lg rounded-2xl shadow-2xl shadow-primary/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100"
                        >
                          {submitting ? (
                            <div className="flex items-center gap-3">
                              <SpinnerInline size="sm" />
                              <span>Confirming...</span>
                            </div>
                          ) : (
                            'Join Event'
                          )}
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Clean Footer */}
          <div className="bg-slate-50/80 dark:bg-slate-800/20 p-12 text-center backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-semibold mb-8">
              <AlertCircle className="w-4 h-4" />
              <span>Confirmation & E-Badge will be sent via email</span>
            </div>

            {/* Powered by Validity Section */}
            <div className="flex flex-col items-center gap-5 border-t border-slate-100 dark:border-slate-800 pt-8 mt-4">
              <div className="flex flex-col items-center gap-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-bold">Powered by</span>
                <div className="flex items-center gap-4">
                  <img
                    src="/Validity_logo.png"
                    alt="Validity logo"
                    className="h-10 object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                  />
                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400 tracking-tight">
                    Validity Event and Marketing
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400/40 uppercase tracking-widest font-bold mt-4">
                Professional Registration & Badge Management System
              </p>
            </div>
          </div>
        </div>

        {/* Support Links */}
        <div className="mt-12 flex flex-wrap justify-center gap-x-12 gap-y-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <a href="/help" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
            Online Support
          </a>
          <a href="/contact" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
            Contact Organizer
          </a>
          <a href="/privacy" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
            Data Policy
          </a>
        </div>
      </div>

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