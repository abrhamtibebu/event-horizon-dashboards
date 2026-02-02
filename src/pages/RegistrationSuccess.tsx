import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Download, ArrowLeft, Calendar, Clock, Mail, User, Building, Briefcase, Users, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import api, { resendRegistrationEmail, getBadgePreview } from '@/lib/api';
import Badge from '@/components/Badge';
import { SpinnerInline } from '@/components/ui/spinner';

export default function RegistrationSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [badgeData, setBadgeData] = useState<any>(null);
  const [loadingBadge, setLoadingBadge] = useState(false);

  // Get registration data from URL params
  const attendeeId = searchParams.get('attendeeId');
  const eventId = searchParams.get('eventId');
  const eventName = searchParams.get('eventName');
  const eventDate = searchParams.get('eventDate');
  const eventTime = searchParams.get('eventTime');
  const eventLocation = searchParams.get('eventLocation');
  const guestName = searchParams.get('guestName');
  const guestEmail = searchParams.get('guestEmail');
  const guestCompany = searchParams.get('guestCompany');
  const guestJobTitle = searchParams.get('guestJobTitle');
  const guestUuid = searchParams.get('guestUuid');
  const eventUuid = searchParams.get('eventUuid');
  const guestTypeName = searchParams.get('guestTypeName');

  useEffect(() => {
    if (!attendeeId || !eventId || !eventName) {
      toast.error('Registration data not found');
    }
  }, [attendeeId, eventId, eventName]);

  useEffect(() => {
    if (showConfirmation && attendeeId && eventId && !badgeData && !loadingBadge) {
      loadBadgePreview();
    }
  }, [showConfirmation, attendeeId, eventId]);

  const loadBadgePreview = async () => {
    if (!attendeeId || !eventId) return;
    setLoadingBadge(true);
    try {
      const response = await getBadgePreview(Number(eventId), Number(attendeeId));
      setBadgeData(response.data);
    } catch (error: any) {
      console.error('Failed to load badge preview:', error);
    } finally {
      setLoadingBadge(false);
    }
  };

  const handleResendEmail = async () => {
    if (!attendeeId || !eventId) return;
    setResendingEmail(true);
    try {
      await resendRegistrationEmail(Number(eventId), Number(attendeeId));
      toast.success('Confirmation email sent.');
    } catch (error: any) {
      toast.error('Failed to resend email.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleDownloadBadge = async () => {
    if (!attendeeId || !eventId) return;
    setDownloading(true);
    try {
      const response = await api.get(`/public/events/${eventId}/attendees/${attendeeId}/badge`, {
        params: { guestUuid },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${guestName?.replace(/\s+/g, '-') || 'badge'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('E-badge downloaded.');
    } catch (error: any) {
      toast.error('Failed to download badge.');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (!showConfirmation) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6 text-slate-900 dark:text-slate-100 font-['Outfit']">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
          <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl p-10 text-center rounded-[2.5rem]">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-black mb-3 tracking-tight">Success!</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-2 leading-relaxed font-medium">
              We've sent your e-badge to your inbox.
            </p>
            <p className="text-slate-900 dark:text-white font-black text-lg mb-10">
              See you at the venue!
            </p>
            <div className="space-y-4">
              <Button
                type="button"
                onClick={() => setShowConfirmation(true)}
                className="w-full h-14 bg-slate-950 dark:bg-white text-white dark:text-slate-900 font-black text-lg rounded-2xl shadow-xl hover:opacity-90 transition-opacity"
              >
                View My E-Badge
              </Button>
              <Button
                type="button"
                onClick={handleDownloadBadge}
                disabled={downloading}
                variant="outline"
                className="w-full h-14 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black text-lg rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {downloading ? <SpinnerInline size="sm" /> : <Download className="w-5 h-5 mr-3" />}
                Download E-Badge
              </Button>
              <Button
                type="button"
                onClick={() => navigate(eventUuid ? `/e/${eventUuid}` : '/')}
                variant="ghost"
                className="w-full h-12 text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold"
              >
                Register Another Guest
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-6 font-['Outfit']">
      <div className="max-w-4xl mx-auto">
        {/* Navigation & Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-5">
            <Button onClick={() => setShowConfirmation(false)} variant="outline" className="w-14 h-14 rounded-2xl border-slate-200 dark:border-slate-800 p-0 shadow-sm bg-white dark:bg-slate-900">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Registration Details</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Attendee ID: {attendeeId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleResendEmail}
              disabled={resendingEmail}
              variant="outline"
              className="rounded-2xl px-6 h-14 font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            >
              {resendingEmail ? <SpinnerInline size="sm" /> : <Mail className="w-5 h-5 mr-3" />} Email Badge
            </Button>
            <Button
              type="button"
              onClick={handleDownloadBadge}
              disabled={downloading}
              className="bg-slate-950 dark:bg-white text-white dark:text-slate-900 rounded-2xl px-8 h-14 font-black shadow-xl"
            >
              {downloading ? <SpinnerInline size="sm" /> : <Download className="w-5 h-5 mr-3" />} Download PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Badge Display */}
          <Card className="bg-white dark:bg-slate-900 border-none shadow-2xl rounded-[3rem] p-12 flex flex-col items-center justify-center min-h-[550px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-100 dark:bg-slate-800" />
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-10">Official Entry Pass</div>

            {loadingBadge ? (
              <SpinnerInline size="md" />
            ) : badgeData?.badge ? (
              <div className="shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden scale-105">
                <Badge
                  attendee={{
                    id: Number(attendeeId),
                    guest: {
                      name: badgeData.badge?.name || guestName || '',
                      email: guestEmail || '',
                      company: badgeData.badge?.company || guestCompany || '',
                      jobtitle: badgeData.badge?.jobTitle || guestJobTitle || '',
                      uuid: badgeData.badge?.uuid || guestUuid || '',
                    },
                    guest_type: { name: badgeData.badge?.guestType || guestTypeName || 'Visitor' }
                  } as any}
                />
              </div>
            ) : (
              <div className="w-72 h-[450px] bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex flex-col items-center justify-between p-10 border border-slate-100 dark:border-slate-800">
                <div className="w-full flex justify-center">
                  <img src="/evella-logo.png" alt="Logo" className="h-6 opacity-20" />
                </div>
                <div className="text-center w-full">
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm inline-block mb-8 border border-slate-50 dark:border-slate-800">
                    <QRCodeSVG value={guestUuid || attendeeId || ''} size={140} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white truncate mb-1">{guestName}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{guestTypeName || 'Visitor'}</p>
                </div>
                <p className="text-[10px] font-mono font-bold text-slate-300">{attendeeId}</p>
              </div>
            )}
          </Card>

          {/* Info Side */}
          <div className="space-y-8">
            <Card className="bg-white dark:bg-slate-900 border-none shadow-xl rounded-[2.5rem] p-10">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-slate-900 dark:text-white" />
                </div>
                Event Details
              </h2>
              <div className="space-y-8">
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Event Title</p>
                  <p className="text-slate-900 dark:text-white font-bold text-xl leading-tight">{eventName}</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Date</p>
                    <p className="text-slate-900 dark:text-white font-bold">{formatDate(eventDate)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Time</p>
                    <p className="text-slate-900 dark:text-white font-bold">{eventTime || 'Start of Event'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Location / Venue</p>
                  <p className="text-slate-900 dark:text-white font-bold">{eventLocation || 'Details sent to email'}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-none shadow-xl rounded-[2.5rem] p-10">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-900 dark:text-white" />
                </div>
                Attendee Profile
              </h2>
              <div className="grid grid-cols-2 gap-y-8 gap-x-6">
                {[
                  { label: 'Full Name', value: guestName, icon: User },
                  { label: 'Organization', value: guestCompany || 'Personal', icon: Building },
                  { label: 'Position', value: guestJobTitle || 'Participant', icon: Briefcase },
                  { label: 'Category', value: guestTypeName, icon: Users },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
                    <p className="text-slate-900 dark:text-white font-black truncate text-lg" title={item.value?.toString()}>{item.value || '—'}</p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex items-center gap-5 p-6 bg-slate-100 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <ShieldCheck className="w-6 h-6 text-slate-900 dark:text-white shrink-0" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">This digital entry pass is required for event access. Please keep the QR code visible for scanning upon arrival.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
