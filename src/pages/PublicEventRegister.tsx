// Trigger HMR
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Calendar, MapPin, Users, Clock, Star, Sparkles, AlertCircle, Lamp, User, CheckCircle, Building, UserCog, Mail, Phone as PhoneIcon, X, Mic2, ArrowRight } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { PublicTicketSelector } from '@/components/public/PublicTicketSelector';
import { PublicPaymentSelector } from '@/components/public/PublicPaymentSelector';
import { PublicTicketDisplay } from '@/components/public/PublicTicketDisplay';
import { PaymentProcessingModal } from '@/components/payments/PaymentProcessingModal';
import DynamicFormRenderer from '@/components/public/DynamicFormRenderer';
import type { SubmissionResult } from '@/types/forms';
import { QRCodeSVG } from 'qrcode.react';
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
  const [invitationDetails, setInvitationDetails] = useState<any>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    gender: '',
    country: '',
    city: '',
    attendees: '1',
    dietary: '',
    agree: false,
    newsletter: false,
    age: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successGuestUuid, setSuccessGuestUuid] = useState<string | null>(null);
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

  // RSVP and Speaker states
  const [rsvpStatus, setRsvpStatus] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const profileImageObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (profileImageObjectUrlRef.current) {
        URL.revokeObjectURL(profileImageObjectUrlRef.current);
        profileImageObjectUrlRef.current = null;
      }
    };
  }, []);

  const handleCustomFormSuccess = useCallback((result?: SubmissionResult) => {
    setSuccess(true);
    const u =
      result?.attendee?.guest?.uuid?.trim() ||
      (result?.attendee as { guest_uuid?: string } | undefined)?.guest_uuid?.trim();
    setSuccessGuestUuid(u || null);
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
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState('');
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

  const genderOptions = ['Male', 'Female'];
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

  // Static city data for common countries
  const CITY_DATA: Record<string, string[]> = {
    'Ethiopia': ['Addis Ababa', 'Dire Dawa', 'Adama', 'Bahir Dar', 'Gondar', 'Mekele', 'Hawassa', 'Jimma', 'Dessie', 'Jijiga', 'Bishoftu', 'Arba Minch', 'Hosaena', 'Dilla', 'Nekemte', 'Debre Birhan', 'Asella'],
    'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'San Francisco', 'Charlotte', 'Indianapolis', 'Seattle', 'Denver', 'Washington D.C.'],
    'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Newcastle', 'Sheffield', 'Liverpool', 'Leeds', 'Bristol', 'Edinburgh', 'Leicester', 'Coventry', 'Belfast', 'Cardiff', 'Nottingham', 'Southampton', 'Reading'],
    'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
    'Kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale'],
    'Nigeria': ['Lagos', 'Kano', 'Ibadan', 'Benin City', 'Port Harcourt', 'Jos', 'Ilorin', 'Abuja', 'Kaduna', 'Enugu'],
    'South Africa': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London'],
    'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen'],
    'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Montpellier', 'Strasbourg', 'Bordeaux', 'Lille'],
    'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur'],
    'China': ['Shanghai', 'Beijing', 'Guangzhou', 'Shenzhen', 'Tianjin', 'Wuhan', 'Dongguan', 'Chengdu', 'Foshan', 'Chongqing'],
    'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Ottawa', 'Calgary', 'Edmonton', 'Quebec City', 'Winnipeg', 'Hamilton'],
  };

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
          
          // Fetch invitation details
          const response = await api.get(`/public/invitations/${invParam}`);
          const invData = response.data?.data || response.data;
          setInvitationDetails(invData);
          
          // Pre-fill form if recipient details are available
          if (invData.recipient_name) {
            setForm(prev => ({
              ...prev,
              name: invData.recipient_name || prev.name,
              email: invData.recipient_email || prev.email
            }));
          }

          // Auto-select guest type based on invitation type
          if (invData.invitation_type && guestTypes.length > 0) {
            const mapping: Record<string, string[]> = {
              'personalized': ['Regular', 'Standard'],
              'generic': ['Visitor', 'Guest'],
              'exhibitor': ['Exhibitor', 'Vendor', 'Sponsor', 'Booth'],
              'speaker': ['Speaker', 'Presenter', 'Keynote'],
              'vip': ['VIP', 'V.I.P', 'Very Important'],
              'media': ['Media', 'Press', 'Journalist', 'News'],
            };
            
            const variants = mapping[invData.invitation_type] || [invData.invitation_type];
            const matchingType = guestTypes.find((gt: any) => 
              variants.some(v => gt.name.toLowerCase().includes(v.toLowerCase()))
            );
            
            if (matchingType) {
              console.log('[Invitation] Auto-selecting guest type:', matchingType.name);
              setSelectedGuestTypeId(matchingType.id);
              
              // Check if this type has a custom form
              api.get(`/events/${event.id}/forms/by-guest-type/${matchingType.id}`)
                .then(formRes => {
                  if (formRes.data?.status === 'active') {
                    setUseCustomForm(true);
                  }
                })
                .catch(() => {});
            }
          }
        } catch (error) {
          console.warn('[Invitation] Failed to track click or fetch details:', error);
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
  
  // Sync selected guest type with invitation details when guest types are loaded
  useEffect(() => {
    if (invitationDetails?.invitation_type && guestTypes.length > 0) {
      const mapping: Record<string, string[]> = {
        'personalized': ['Regular', 'Standard'],
        'generic': ['Visitor', 'Guest'],
        'exhibitor': ['Exhibitor', 'Vendor', 'Sponsor', 'Booth'],
        'speaker': ['Speaker', 'Presenter', 'Keynote'],
        'vip': ['VIP', 'V.I.P', 'Very Important'],
        'media': ['Media', 'Press', 'Journalist', 'News'],
      };
      
      const variants = mapping[invitationDetails.invitation_type] || [invitationDetails.invitation_type];
      const matchingType = guestTypes.find((gt: any) => 
        variants.some(v => gt.name.toLowerCase().includes(v.toLowerCase()))
      );
      
      if (matchingType) {
        console.log('[Invitation Sync] Selecting guest type:', matchingType.name);
        setSelectedGuestTypeId(matchingType.id);
        
        // Also check for custom form
        api.get(`/events/${event.id}/forms/by-guest-type/${matchingType.id}`)
          .then(formRes => {
            if (formRes.data?.status === 'active') {
              setUseCustomForm(true);
            }
          })
          .catch(() => {});
      }
    }
  }, [invitationDetails, guestTypes, event?.id]);


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
    if (field === 'profile_picture') {
      const file = value as File | null | undefined;

      if (profileImageObjectUrlRef.current) {
        URL.revokeObjectURL(profileImageObjectUrlRef.current);
        profileImageObjectUrlRef.current = null;
      }

      if (!file) {
        setProfileImage(null);
        setProfileImagePreview(null);
        return;
      }

      setProfileImage(file);
      const objectUrl = URL.createObjectURL(file);
      profileImageObjectUrlRef.current = objectUrl;
      setProfileImagePreview(objectUrl);
      return;
    }

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

  const handleRsvp = async (status: 'accepted' | 'declined') => {
    if (!invitationCode) return;
    setRsvpLoading(true);
    try {
      await api.post('/invitations/rsvp', { 
        invitation_code: invitationCode,
        status 
      });
      setRsvpStatus(status);
      if (status === 'accepted') {
        toast.success("We're thrilled you can join us!");
      } else {
        toast.info("Thank you for letting us know.");
      }
    } catch (error) {
      console.error('RSVP error:', error);
      toast.error("Failed to update RSVP status.");
    } finally {
      setRsvpLoading(false);
    }
  };

  const validateField = (field: string, value: any): string => {
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const PHONE_CLEAN_REGEX = /[\s\-\(\)]/g;
    const ETH_PHONE_REGEX = /^(0[97]\d{8}|\+251[97]\d{8}|[97]\d{8})$/;

    switch (field) {
      case 'name':
        return !value.trim() ? 'Please enter your full name' : '';
      case 'email': {
        if (!value.trim()) return 'Please enter your email address';
        if (!EMAIL_REGEX.test(value.trim())) return 'Please enter a valid email address';
        return '';
      }
      case 'phone': {
        if (!value.trim()) return 'Please enter your phone number';
        const cleanPhone = value.replace(PHONE_CLEAN_REGEX, '');
        if (!ETH_PHONE_REGEX.test(cleanPhone)) {
          return 'Please enter a valid Ethiopian phone number (09, 07, +251 9, +251 7, 9, or 7 format)';
        }
        return '';
      }
      case 'company':
        return !value.trim() ? 'Please enter your company name' : '';
      case 'job_title':
        return !value.trim() ? 'Please enter your job title' : '';
      case 'gender':
        return !value.trim() ? 'Please select your gender' : '';
      case 'age': {
        if (!value.toString().trim()) return 'Please enter your age';
        const ageNum = parseInt(value);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) return 'Please enter a valid age';
        return '';
      }
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
    const requiredFields = ['name', 'email', 'phone', 'company', 'job_title', 'gender', 'age', 'country', 'agree'];
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
      const allFields = ['name', 'email', 'phone', 'company', 'job_title', 'gender', 'age', 'country', 'agree'];
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
      // Always use FormData to support potential file uploads (like speaker profile pics)
      const formData = new FormData();
      
      // Basic form fields
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('company', form.company || '');
      formData.append('job_title', form.job_title || '');
      formData.append('gender', form.gender || '');
      formData.append('country', form.country || '');
      formData.append('city', form.city || '');
      formData.append('age', form.age || '');
      formData.append('dietary', form.dietary || '');
      
      // Guest type and registration metadata
      formData.append('guest_type_id', (selectedGuestTypeId || visitorGuestTypeId)?.toString() || '');
      if (referralCode) formData.append('referral_code', referralCode);
      if (invitationCode) formData.append('invitation_code', invitationCode);
      formData.append('registration_type', searchParams.get('type') || 'prereg');

      // Add profile picture if present
      if (profileImage) {
        formData.append('profile_picture', profileImage);
      }

      const response = await api.post(`/public/events/${event.uuid}/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Track referral activity if referral code exists
      if (referralCode && response.data?.attendee) {
        try {
          await api.post('/vendor-referrals/track-activity', {
            referral_code: referralCode,
            activity_type: 'registration',
            guest_id: response.data.attendee.guest_id,
            attendee_id: response.data.attendee.id,
            metadata: {
              event_uuid: event.uuid,
              event_name: event.name,
              registration_date: new Date().toISOString(),
            }
          });
        } catch (err) {
          console.warn('Failed to track referral registration:', err);
        }
      }

      // Handle success response
      if (response.data?.attendee && response.data?.event) {
        const params = new URLSearchParams({
          attendeeId: response.data.attendee.id.toString(),
          eventId: response.data.event.id.toString(),
          eventUuid: response.data.event.uuid,
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
        toast.success('Registration successful!');
        navigate('/registration/success');
      }
    } catch (err: any) {
      const isAlreadyRegistered =
        err.response?.status === 409 &&
        err.response?.data?.duplicate_type === 'event_registration';

      if (isAlreadyRegistered && event?.uuid) {
        const identifier = form.email || form.phone;
        const params = new URLSearchParams();

        if (identifier) {
          params.set('identifier', identifier);
        }

        toast.info('You are already registered. Retrieve your e-badge here.');
        navigate(`/event/${event.uuid}/badge-retrieve${params.toString() ? `?${params.toString()}` : ''}`);
        return;
      }

      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 422) {
        const backendErrors: Record<string, string[] | string> | undefined = data?.errors;
        if (backendErrors && typeof backendErrors === 'object') {
          const flattened: Record<string, string> = {};
          Object.entries(backendErrors).forEach(([key, value]) => {
            if (Array.isArray(value)) flattened[key] = value[0] || '';
            else if (typeof value === 'string') flattened[key] = value;
          });
          if (Object.keys(flattened).length > 0) {
            setFieldErrors(prev => ({ ...prev, ...flattened }));
            setTouchedFields(prev => {
              const next = { ...prev };
              Object.keys(flattened).forEach(k => {
                next[k] = true;
              });
              return next;
            });
          }
        }
        toast.error(data?.error || 'Please check the highlighted fields.');
      } else {
        toast.error(data?.error || 'Registration failed.');
      }
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
        phone_number: paymentPhoneNumber,
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

  const handleRSVP = async (status: 'accepted' | 'declined') => {
    if (!invitationCode) return;
    
    setRsvpLoading(true);
    try {
      await api.post('/invitations/rsvp', {
        invitation_code: invitationCode,
        status
      });
      
      setInvitationDetails(prev => ({
        ...prev,
        rsvp_status: status,
        is_rsvp_completed: true
      }));

      if (status === 'accepted') {
        toast.success('Thank you for accepting the invitation! You can now complete your registration.');
      } else {
        toast.info('You have declined the invitation. We hope to see you at future events.');
      }
    } catch (err) {
      toast.error('Failed to update RSVP. Please try again.');
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleRetryPayment = () => {
    handleClosePaymentModal();
    setPurchaseStep('payment');
  };

  // Show redirecting message for all users (guests and authenticated) on ticketed events
  if (isTicketedEvent && event?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <SpinnerInline className="mx-auto" />
          <p className="mt-4 text-muted-foreground font-medium">Redirecting to ticket purchase...</p>
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

          {successGuestUuid ? (
            <div className="flex flex-col items-center mb-6">
              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Guest check-in QR</p>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <QRCodeSVG value={successGuestUuid.slice(0, 8)} size={160} level="M" includeMargin />
              </div>
              <p className="text-xs font-semibold text-gray-500 mt-4 mb-1 uppercase tracking-wide">Guest code</p>
              <p className="text-lg font-mono font-bold tracking-wider text-gray-900">
                {successGuestUuid.slice(0, 8)}
              </p>
            </div>
          ) : null}

          <div className="text-xs text-muted-foreground/70">
            You will receive a confirmation email shortly with all the event details.
          </div>
        </div>
      </div>
    );
  }

  // Helper functions
  const selectedGuestTypeName = guestTypes.find(gt => gt.id === selectedGuestTypeId)?.name?.toLowerCase() ?? '';
  const isSpeakerOrPanelist = selectedGuestTypeName.includes('speaker') || selectedGuestTypeName.includes('panelist');

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
    <div className="min-h-screen overflow-x-hidden bg-white sm:bg-slate-50 dark:bg-slate-950 sm:py-12 px-0 sm:px-6 lg:px-8" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="max-w-4xl mx-auto w-full min-w-0">
        {/* Main Event Card */}
        <div className="bg-white dark:bg-slate-900 rounded-none sm:rounded-[3rem] shadow-none sm:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] overflow-hidden border-none sm:border border-slate-100 dark:border-slate-800 mb-0 sm:mb-12">
          {/* Banner */}
          <div className="relative h-64 sm:h-96">
            {(event.event_image || event.image_url || event.image) ? (
              <img
                src={getImageUrl(event.image_url || event.event_image || event.image)}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-white/10" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-0 left-0 w-full p-6 sm:p-12">
              <div className="inline-flex items-center gap-2 bg-[#f97316] text-white px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 sm:mb-4 shadow-lg">
                <Star className="w-2.5 h-2.5 fill-white" />
                {event.category?.name || 'Featured Event'}
              </div>
              <h1 className="text-2xl sm:text-6xl font-black text-white tracking-tight leading-tight break-words hyphens-auto">
                {event.name}
              </h1>
            </div>
          </div>

          {/* Info bar - Responsive grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-50 dark:border-slate-800 min-w-0">
            {[
              { label: 'Date', value: startDate ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD', icon: Calendar },
              { label: 'Time', value: event.time || 'Flexible', icon: Clock },
              { label: 'Venue', value: event.venue_name || event.location || 'Online', icon: MapPin },
              { label: 'Guest Type', value: invitationDetails?.invitation_type || 'Attendee', icon: Users },
            ].map((item, i) => (
              <div key={i} className={`min-w-0 p-3 sm:p-6 text-center border-slate-50 dark:border-slate-800 ${i % 2 === 0 ? 'border-r' : 'md:border-r'} ${i < 2 ? 'border-b md:border-b-0' : ''}`}>
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#f97316] mx-auto mb-1.5 sm:mb-2 opacity-80 shrink-0" />
                <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">{item.label}</p>
                <p className="text-[11px] sm:text-sm font-bold text-slate-900 dark:text-white break-words hyphens-auto line-clamp-3 leading-snug">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Organizer — shown with event details (not in top header) */}
          {organizerName && (
            <div className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/50 px-4 py-5 sm:px-8 sm:py-6">
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 max-w-2xl mx-auto sm:mx-0 sm:max-w-none text-center sm:text-left">
                {event.organizer?.logo ? (
                  <img
                    src={getImageUrl(event.organizer.logo)}
                    alt=""
                    className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 object-contain rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1"
                  />
                ) : (
                  <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center border border-orange-100 dark:border-orange-800">
                    <Building className="w-7 h-7 sm:w-8 sm:h-8 text-[#f97316]" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Organizer</p>
                  <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white break-words">{organizerName}</p>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 sm:p-16">
            {/* Description & RSVP Area */}
            {event.description && (
              <div className="mb-8 sm:mb-12 text-center max-w-2xl mx-auto px-4">
                <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 font-medium italic leading-relaxed">
                  &ldquo;{event.description}&rdquo;
                </p>
              </div>
            )}

            {/* RSVP Section for Invitations */}
            {invitationCode && rsvpStatus === 'pending' && (
              <div className="max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 border-2 border-[#f97316]/20 shadow-xl text-center">
                  <div className="w-20 h-20 bg-[#f97316]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-10 h-10 text-[#f97316]" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3">You're Invited!</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                    Hello <span className="text-[#f97316] font-bold">{invitationDetails?.recipient_name || 'there'}</span>, 
                    we've sent you a special invitation to join us. Would you like to attend?
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                      onClick={() => handleRsvp('accepted')}
                      disabled={rsvpLoading}
                      className="h-14 px-10 rounded-2xl bg-[#f97316] hover:bg-[#ea580c] text-white font-black shadow-lg shadow-orange-500/20 w-full sm:w-auto min-w-[180px]"
                    >
                      {rsvpLoading ? <SpinnerInline /> : 'Yes, I\'ll attend!'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRsvp('declined')}
                      disabled={rsvpLoading}
                      className="h-14 px-10 rounded-2xl border-slate-200 dark:border-slate-800 text-slate-600 font-bold w-full sm:w-auto min-w-[180px]"
                    >
                      Declined
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Declined State */}
            {invitationCode && rsvpStatus === 'declined' && (
              <div className="max-w-2xl mx-auto mb-12 animate-in zoom-in duration-500">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 border border-slate-100 dark:border-slate-800 shadow-xl text-center">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-slate-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3">Response Received</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                    Thank you for letting us know. We've recorded your response. 
                    If you change your mind, you can still register below.
                  </p>
                  <Button
                    onClick={() => setRsvpStatus('accepted')}
                    variant="link"
                    className="text-[#f97316] font-black uppercase tracking-widest text-xs"
                  >
                    I changed my mind, I want to attend
                  </Button>
                </div>
              </div>
            )}

            {/* Registration Form Area */}
            {(!invitationCode || rsvpStatus === 'accepted') && (
              <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
                {/* Payment Step for Selected Tickets */}
                {purchaseStep === 'payment' && selectedTickets.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 border-2 border-slate-100 dark:border-slate-800 shadow-xl mb-8">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3">Select Payment Method</h2>
                      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                        Choose how you'd like to pay for your tickets
                      </p>
                    </div>

                    {/* Payment Methods Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-8">
                      {[
                        {
                          id: 'telebirr' as PaymentMethod,
                          name: 'Telebirr',
                          description: 'Pay with Telebirr mobile wallet',
                          icon: '/TeleBirr Logo.png',
                        },
                        {
                          id: 'cbe_birr' as PaymentMethod,
                          name: 'CBE Birr',
                          description: 'Commercial Bank of Ethiopia mobile banking',
                          icon: '/CBE Birr ( No background ) Logo.png',
                        },
                      ].map((method) => (
                        <div
                          key={method.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                          onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && !isProcessingPayment) {
                              e.preventDefault();
                              setSelectedPaymentMethod(method.id);
                            }
                          }}
                          className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border-2 p-4 sm:p-6 cursor-pointer transition-all min-h-[3.5rem] touch-manipulation max-w-full min-w-0 ${
                            selectedPaymentMethod === method.id
                              ? 'border-[#f97316] ring-2 ring-[#f97316] ring-opacity-50'
                              : 'border-slate-200 dark:border-slate-700 hover:border-[#f97316]/30'
                          } ${isProcessingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <img 
                              src={method.icon} 
                              alt={method.name}
                              className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'block';
                              }}
                            />
                            <div className="text-3xl sm:text-4xl shrink-0" style={{ display: 'none' }} aria-hidden>
                              {method.id === 'telebirr' ? '📱' : 
                               method.id === 'cbe_birr' ? '🏦' : '🏛️'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white break-words">
                                {method.name}
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400 break-words">{method.description}</p>
                            </div>
                            {selectedPaymentMethod === method.id && (
                              <div className="flex-shrink-0">
                                <div className="w-6 h-6 bg-[#f97316] rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Phone Number Input - Show when payment method is selected */}
                    {selectedPaymentMethod && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
                        <div className="flex items-center space-x-2 mb-3">
                          <PhoneIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100">Payment Phone Number</h4>
                        </div>
                        <Input
                          type="tel"
                          placeholder="Enter phone number for payment"
                          value={paymentPhoneNumber}
                          onChange={(e) => setPaymentPhoneNumber(e.target.value)}
                          className="w-full mb-2 h-14 text-lg font-bold"
                          disabled={isProcessingPayment}
                        />
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Enter phone number associated with your {selectedPaymentMethod === 'telebirr' ? 'Telebirr' : 'CBE Birr'} account
                        </p>
                      </div>
                    )}

                    {/* Payment Actions */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        type="button"
                        onClick={handleBackToTickets}
                        disabled={isProcessingPayment}
                        variant="outline"
                        className="flex-1 h-14 border-slate-200 dark:border-slate-700 text-slate-600 font-bold"
                      >
                        Back to Tickets
                      </Button>
                      <Button
                        type="button"
                        onClick={handlePaymentConfirm}
                        disabled={!selectedPaymentMethod || !paymentPhoneNumber || isProcessingPayment}
                        className="flex-1 h-14 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold shadow-lg shadow-orange-500/20"
                      >
                        {isProcessingPayment ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-transparent animate-spin rounded-full mr-2"></div>
                            Processing Payment...
                          </>
                        ) : (
                          'Confirm & Pay'
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {useCustomForm && !isTicketedEvent && selectedGuestTypeId ? (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-12 border border-slate-100 dark:border-slate-800 shadow-inner">
                    <DynamicFormRenderer
                      eventId={Number(event?.id)}
                      guestTypeId={selectedGuestTypeId}
                      invitationCode={invitationCode}
                      participantType={customFormParticipantType}
                      onSuccess={handleCustomFormSuccess}
                      onError={handleCustomFormError}
                      onFallback={handleCustomFormFallback}
                    />
                  </div>
                ) : purchaseStep !== 'payment' && (
                  <div className="space-y-8 sm:space-y-12">
                    <div className="text-center px-4">
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">Secure Your Spot</h2>
                      <p className="text-xs sm:text-sm text-slate-500 font-medium">Please fill in your details to complete registration</p>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 sm:gap-y-8">
                      <div className="space-y-2">
                        <Label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Profile Photo <span className="text-slate-300 dark:text-slate-600 font-black">(optional)</span>
                        </Label>
                        <Label className="cursor-pointer block">
                          <div className="relative w-full h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center px-4 overflow-hidden border border-slate-100 dark:border-slate-700 hover:border-[#f97316]/40 transition-colors group">
                            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 shadow-inner overflow-hidden flex items-center justify-center shrink-0">
                              {profileImagePreview ? (
                                <img src={profileImagePreview} alt="Profile preview" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-5 h-5 text-slate-300 group-hover:text-[#f97316] transition-colors" />
                              )}
                              {profileImagePreview ? (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#f97316] rounded-xl flex items-center justify-center shadow border-2 border-white dark:border-slate-900">
                                  <Sparkles className="w-3 h-3 text-white" />
                                </div>
                              ) : null}
                            </div>
                            <div className="ml-3 min-w-0">
                              <p className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">
                                {profileImage ? profileImage.name : 'Tap to upload'}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 truncate">
                                Used on your share banner
                                {isSpeakerOrPanelist ? ' • Required for speaker badges' : ''}
                              </p>
                            </div>
                          </div>
                          <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFieldChange('profile_picture', e.target.files?.[0])}
                          />
                        </Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</Label>
                        <Input
                          id="name"
                          value={form.name}
                          onChange={(e) => handleFieldChange('name', e.target.value)}
                          className={`h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-base ${touchedFields.name && fieldErrors.name ? 'ring-2 ring-red-500/20 bg-red-50/50' : ''}`}
                          placeholder="e.g. Abebe Bikila"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          className={`h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-base ${touchedFields.email && fieldErrors.email ? 'ring-2 ring-red-500/20 bg-red-50/50' : ''}`}
                          placeholder="abebe@example.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</Label>
                        <Input
                          id="phone"
                          value={form.phone}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                          className={`h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-base ${touchedFields.phone && fieldErrors.phone ? 'ring-2 ring-red-500/20 bg-red-50/50' : ''}`}
                          placeholder="0911..."
                        />
                      </div>

                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Country</Label>
                      <Select value={form.country} onValueChange={(v) => {
                        handleFieldChange('country', v);
                        handleFieldChange('city', ''); // Reset city on country change
                      }}>
                        <SelectTrigger className="h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-base">
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] rounded-2xl">
                          {countryOptions.map((c) => (
                            <SelectItem key={c} value={c} className="rounded-xl">
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">City</Label>
                      {form.country && CITY_DATA[form.country] ? (
                        <Select value={form.city} onValueChange={(v) => handleFieldChange('city', v)}>
                          <SelectTrigger className="h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-base">
                            <SelectValue placeholder="Select City" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] rounded-2xl">
                            {CITY_DATA[form.country].map(city => (
                              <SelectItem key={city} value={city} className="rounded-xl">{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="city"
                          value={form.city}
                          disabled={!form.country}
                          onChange={(e) => handleFieldChange('city', e.target.value)}
                          className="h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-base"
                          placeholder={form.country ? "Enter your city" : "Select country first"}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Organization</Label>
                      <Input
                        id="company"
                        value={form.company}
                        onChange={(e) => handleFieldChange('company', e.target.value)}
                        className="h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-base"
                        placeholder="Company name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="job_title" className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</Label>
                      <Input
                        id="job_title"
                        value={form.job_title}
                        onChange={(e) => handleFieldChange('job_title', e.target.value)}
                        className="h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-base"
                        placeholder="Position"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</Label>
                      <Select value={form.gender} onValueChange={(v) => handleFieldChange('gender', v)}>
                        <SelectTrigger className="h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-base">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {genderOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={form.age}
                        onChange={(e) => handleFieldChange('age', e.target.value)}
                        className="h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-base"
                        placeholder="Years"
                      />
                    </div>

                    <div className="sm:col-span-2 pt-4 sm:pt-6">
                      <div className="flex items-start gap-4 p-5 bg-orange-50/50 dark:bg-orange-900/10 rounded-[1.25rem] sm:rounded-2xl border border-orange-100/50 dark:border-orange-800/30">
                        <Checkbox
                          id="agree"
                          checked={form.agree}
                          onCheckedChange={(v) => handleFieldChange('agree', v)}
                          className="mt-1 border-orange-200 data-[state=checked]:bg-[#f97316] data-[state=checked]:border-[#f97316]"
                        />
                        <Label htmlFor="agree" className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                          I agree to the <Link to="/terms" className="text-[#f97316] font-bold">Terms of Service</Link> and <Link to="/privacy" className="text-[#f97316] font-bold">Privacy Policy</Link>. I certify that the information provided is accurate.
                        </Label>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="sm:col-span-2 h-14 sm:h-18 bg-[#f97316] hover:bg-[#ea580c] text-white font-black text-lg sm:text-xl rounded-xl sm:rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] mt-2 sm:mt-4"
                    >
                      {submitting ? <SpinnerInline size="sm" /> : 'Confirm Registration'}
                    </Button>

                  </form>
                </div>
              )}
            </div>
            )}
          </div>
          
          {/* Confirmation note inside card */}
          <div className="bg-slate-50 dark:bg-slate-800/30 p-8 sm:p-10 text-center border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500 font-medium italic">A confirmation email will be sent immediately upon successful registration.</p>
          </div>
        </div>

        {/* Support Links + platform branding */}
        <div className="flex flex-col items-center gap-6 px-4 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="/help" className="text-xs font-bold text-slate-400 hover:text-[#f97316] transition-colors min-h-11 inline-flex items-center">Support</a>
            <a href="/privacy" className="text-xs font-bold text-slate-400 hover:text-[#f97316] transition-colors min-h-11 inline-flex items-center">Privacy</a>
            <a href="/terms" className="text-xs font-bold text-slate-400 hover:text-[#f97316] transition-colors min-h-11 inline-flex items-center">Terms</a>
          </div>
          <div className="flex flex-col items-center gap-2 text-center pt-4 border-t border-slate-200 dark:border-slate-800 w-full max-w-md">
            <img src="/evella-logo.png" alt="" className="h-9 w-9 sm:h-10 sm:w-10 object-contain opacity-90 dark:opacity-95" />
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Powered by Validity</p>
          </div>
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