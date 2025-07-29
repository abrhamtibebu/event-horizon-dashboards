import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Calendar, MapPin, Users, Clock, Star, Sparkles } from 'lucide-react';

export default function PublicEventRegister() {
  const { eventUuid } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const genderOptions = ['Male', 'Female', 'Other'];
  const countryOptions = [
    'Ethiopia', 'United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'India', 'China', 'Japan', 'Australia', 'Other',
  ];
  const attendeeOptions = ['1 Person', '2 People', '3 People', '4+ People'];

  useEffect(() => {
    if (!eventUuid) return;
    setLoading(true);
    api.get(`/events/uuid/${eventUuid}`)
      .then(res => setEvent(res.data))
      .catch(() => setError('Event not found or not accepting registrations.'))
      .finally(() => setLoading(false));
  }, [eventUuid]);

  useEffect(() => {
    if (!event || !event.id) return;
    api.get(`/events/${event.id}/guest-types`).then(res => {
      const visitorType = res.data.find((gt: any) => gt.name.toLowerCase() === 'visitor');
      if (visitorType) setVisitorGuestTypeId(visitorType.id);
    });
  }, [event]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm(f => ({ ...f, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorGuestTypeId || !form.agree) {
      toast.error('You must agree to the Terms and Conditions.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/events/${event.id}/register`, {
        ...form,
        guest_type_id: visitorGuestTypeId,
      });
      setSuccess(true);
      toast.success('Registration successful!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading event...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  if (success) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
        <p className="text-gray-600 mb-4">Thank you for registering for <strong>{event?.name}</strong></p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold text-blue-800">Check Your Email</span>
          </div>
          <p className="text-blue-700 text-sm">
            We've sent you a confirmation email with your digital visitor badge attached. 
            Please check your inbox and save the badge for the event.
          </p>
        </div>
        <div className="text-sm text-gray-500">
          <p>If you don't see the email, please check your spam folder.</p>
          <p className="mt-2">We look forward to seeing you at the event!</p>
        </div>
      </div>
    </div>
  );

  // Organizer logo logic
  let organizerLogo = '/placeholder-avatar.png';
  if (event?.organizer?.logo) {
    organizerLogo = event.organizer.logo.startsWith('http')
      ? event.organizer.logo
      : `${import.meta.env.VITE_API_URL?.replace('/api','') || ''}/storage/${event.organizer.logo}`;
  }
  const organizerName = event?.organizer?.name || 'Organizer';

  // Event date logic
  const startDate = event?.start_date ? new Date(event.start_date) : null;
  const endDate = event?.end_date ? new Date(event.end_date) : null;
  // Countdown logic
  let countdown = '';
  if (startDate) {
    const now = new Date();
    const diff = startDate.getTime() - now.getTime();
    if (diff > 0) {
      const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
      if (months > 0) countdown = `${months} month${months > 1 ? 's' : ''}`;
      else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days > 0) countdown = `${days} day${days > 1 ? 's' : ''}`;
        else countdown = 'soon';
      }
    } else {
      countdown = 'ongoing';
    }
  }

  // What's included (placeholder or from event)
  const whatsIncluded = [
    'All-access event pass',
    'Networking lunch & coffee breaks',
    'Exclusive event materials',
    'Certificate of attendance',
  ];

  // Badges/tags (minimal, single accent color)

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-center border-b border-border py-2 px-2 bg-background">
        <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2 shadow-sm border border-border">
          <img src="/Validity_logo.png" alt="Platform Logo" className="h-8 w-8 object-contain" />
          <a href="http://validity.et/" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary text-sm">Evella</a>
          <span className="mx-2 text-gray-300">|</span>
          <img src={organizerLogo} alt="Organizer Logo" className="h-8 w-8 rounded-full object-cover border border-border bg-card" />
          <span className="font-semibold text-foreground text-sm">{organizerName}</span>
          <span className="text-xs text-muted-foreground ml-2">Innovation Conference</span>
        </div>
      </div>
      {/* Header Section */}
      <div className="w-full flex flex-col items-center pt-8 pb-4 px-2">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-2">
          <span className="block text-primary">Welcome to</span>
          <span className="block text-foreground">{event?.name}</span>
        </h1>
        <div className="text-lg text-muted-foreground text-center mb-3">
          Join us for an <span className="text-primary font-semibold underline underline-offset-2">unforgettable experience</span> that will transform your perspective on data validation and testing methodologies.
        </div>
        <div className="flex flex-wrap gap-2 justify-center mb-4">
        </div>
      </div>
      {/* Main Content: Two-column layout */}
      <div className="flex flex-col md:flex-row gap-10 items-start justify-center px-2 pb-10 max-w-6xl mx-auto">
        {/* Left: Event Info Card */}
        <div className="w-full md:w-[370px] max-w-full mb-8 md:mb-0 flex flex-col gap-4">
          {/* Event Info Card */}
          <div className="rounded-2xl bg-card shadow border border-border p-0 overflow-hidden">
            {/* Subtle primary header */}
            <div className="bg-primary/10 px-6 py-4 border-b border-border">
              <div className="text-lg font-bold text-primary">{event?.name}</div>
              <div className="text-xs text-muted-foreground mt-1">An exclusive gathering for professionals in data validation, quality assurance, and testing excellence.</div>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {/* Event details with icons */}
              <div className="flex flex-col gap-3">
                {startDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">Event Date</div>
                      <div className="text-xs text-muted-foreground">{startDate.toLocaleDateString()} - {endDate ? endDate.toLocaleDateString() : ''}</div>
                      <div className="text-xs text-muted-foreground">{startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate ? endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                    </div>
                  </div>
                )}
                {event?.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-primary/70" />
            <div>
                      <div className="font-medium text-foreground">Location</div>
                      <div className="text-xs text-muted-foreground">{event.location}</div>
                    </div>
            </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-primary/70" />
            <div>
                    <div className="font-medium text-foreground">Expected Attendees</div>
                    <div className="text-xs text-muted-foreground">500+ Industry Professionals</div>
                  </div>
            </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary/70" />
            <div>
                    <div className="font-medium text-foreground">Duration</div>
                    <div className="text-xs text-muted-foreground">2 Full Days</div>
                    <div className="text-xs text-muted-foreground">Workshops & Networking</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* What's Included Card */}
          <div className="rounded-2xl bg-card shadow border border-border p-6">
            <div className="font-semibold text-primary mb-2 text-sm flex items-center"><Star className="w-4 h-4 mr-1 text-primary/70" />What's Included:</div>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
              {whatsIncluded.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          {/* Countdown Card */}
          <div className="rounded-2xl bg-primary/10 text-primary text-center py-6 px-4 shadow text-lg font-bold border border-border">
            {countdown && <span>Starting in <span className="text-2xl font-extrabold">{countdown}</span></span>}
          </div>
        </div>
        {/* Right: Registration Form Card */}
        <div className="flex-1 w-full max-w-xl">
          <div className="rounded-2xl bg-card shadow-2xl border border-border p-8 relative overflow-hidden">
            <div className="mb-4">
              <div className="text-2xl font-bold text-primary mb-1">Register for <span className="text-foreground">{event?.name}</span></div>
              <div className="text-muted-foreground text-sm">Secure your spot at this exclusive industry event. Limited seats available for this premium experience.</div>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1">
                <Label htmlFor="name">Full Name <span className="text-pink-500">*</span></Label>
                <Input id="name" name="name" value={form.name} onChange={handleChange} required disabled={submitting} placeholder="Enter your full name" />
              </div>
              <div className="col-span-1">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} disabled={submitting} placeholder="Enter your email" />
              </div>
              <div className="col-span-1">
                <Label htmlFor="phone">Phone Number <span className="text-pink-500">*</span></Label>
                <Input id="phone" name="phone" value={form.phone} onChange={handleChange} required disabled={submitting} placeholder="Enter your phone number" />
              </div>
              <div className="col-span-1">
                <Label htmlFor="company">Company <span className="text-pink-500">*</span></Label>
                <Input id="company" name="company" value={form.company} onChange={handleChange} required disabled={submitting} placeholder="Enter your company name" />
              </div>
              <div className="col-span-1">
                <Label htmlFor="job_title">Job Title <span className="text-pink-500">*</span></Label>
                <Input id="job_title" name="job_title" value={form.job_title} onChange={handleChange} required disabled={submitting} placeholder="Enter your job title" />
              </div>
              <div className="col-span-1">
                <Label htmlFor="gender">Gender <span className="text-pink-500">*</span></Label>
              <select id="gender" name="gender" value={form.gender} onChange={handleChange} required disabled={submitting} className="w-full border rounded px-3 py-2">
                <option value="">Select gender</option>
                  {genderOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
              <div className="col-span-1">
                <Label htmlFor="country">Country <span className="text-pink-500">*</span></Label>
              <select id="country" name="country" value={form.country} onChange={handleChange} required disabled={submitting} className="w-full border rounded px-3 py-2">
                <option value="">Select country</option>
                  {countryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
              {/* <div className="col-span-1">
                <Label htmlFor="attendees">Number of Attendees</Label>
                <select id="attendees" name="attendees" value={form.attendees} onChange={handleChange} required disabled={submitting} className="w-full border rounded px-3 py-2">
                  {attendeeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div> */}
              {/* <div className="col-span-1 md:col-span-2">
                <Label htmlFor="dietary">Dietary Restrictions</Label>
                <textarea id="dietary" name="dietary" value={form.dietary} onChange={handleChange} disabled={submitting} className="w-full border rounded px-3 py-2 min-h-[40px]" placeholder="Please specify any dietary restrictions or allergies..." />
              </div> */}
              <div className="col-span-1 md:col-span-2 flex flex-col gap-2 mt-2">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} required disabled={submitting} className="accent-primary" />
                  I agree to the <a href="/terms" className="underline hover:text-primary">Terms and Conditions</a> and <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a> <span className="text-pink-500">*</span>
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" name="newsletter" checked={form.newsletter} onChange={handleChange} disabled={submitting} className="accent-primary" />
                  Subscribe to our newsletter for event updates and future announcements
                </label>
              </div>
              <div className="col-span-1 md:col-span-2 mt-2">
                <Button type="submit" className="w-full py-3 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow flex items-center justify-center gap-2" disabled={submitting || !visitorGuestTypeId}>
                  <Sparkles className="w-5 h-5" /> {submitting ? 'Registering...' : 'Register Now'} <Sparkles className="w-5 h-5" />
            </Button>
              </div>
          </form>
            <div className="text-xs text-muted-foreground text-center mt-4">
              By registering, you agree to our <a href="/terms" className="underline hover:text-primary">Terms and Conditions</a> and <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 