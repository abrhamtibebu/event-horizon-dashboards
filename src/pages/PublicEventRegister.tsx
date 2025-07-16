import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { toast } from 'sonner';

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
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [visitorGuestTypeId, setVisitorGuestTypeId] = useState<string | null>(null);
  const genderOptions = ['Male', 'Female', 'Other'];
  const countryOptions = [
    'Ethiopia', 'United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'India', 'China', 'Japan', 'Australia', 'Other',
  ];

  useEffect(() => {
    if (!eventUuid) return;
    setLoading(true);
    api.get(`/events/uuid/${eventUuid}`)
      .then(res => setEvent(res.data))
      .catch(() => setError('Event not found or not accepting registrations.'))
      .finally(() => setLoading(false));
  }, [eventUuid]);

  // Fetch guest types for the event and find the Visitor type
  useEffect(() => {
    if (!event || !event.id) return;
    api.get(`/events/${event.id}/guest-types`).then(res => {
      const visitorType = res.data.find((gt: any) => gt.name.toLowerCase() === 'visitor');
      if (visitorType) setVisitorGuestTypeId(visitorType.id);
    });
  }, [event]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorGuestTypeId) {
      toast.error('Registration is not available for this event.');
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
  if (success) return <div className="min-h-screen flex items-center justify-center text-green-600">Thank you for registering for {event?.name}!</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-900 text-center">
            Register for {event?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} required disabled={submitting} />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required disabled={submitting} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required disabled={submitting} />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" value={form.company} onChange={handleChange} required disabled={submitting} />
            </div>
            <div>
              <Label htmlFor="job_title">Job Title</Label>
              <Input id="job_title" name="job_title" value={form.job_title} onChange={handleChange} required disabled={submitting} />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <select id="gender" name="gender" value={form.gender} onChange={handleChange} required disabled={submitting} className="w-full border rounded px-3 py-2">
                <option value="">Select gender</option>
                {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <select id="country" name="country" value={form.country} onChange={handleChange} required disabled={submitting} className="w-full border rounded px-3 py-2">
                <option value="">Select country</option>
                {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={submitting || !visitorGuestTypeId}>
              {submitting ? 'Registering...' : 'Register'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 