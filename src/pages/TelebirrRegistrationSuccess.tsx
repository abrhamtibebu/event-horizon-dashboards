import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import {
  CheckCircle,
  Download,
  Mail,
  Calendar,
  MapPin,
  Share2,
  Home,
  ArrowRight,
  Info
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { GuestShareBannerPanel } from '@/components/share/GuestShareBannerPanel';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const TelebirrRegistrationSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { registrationData, eventData } = location.state || {};

  const colors = {
    lightGreen: '#8DC63F',
    deepGreen: '#8DC63F',
    blue: '#005BAA',
    orange: '#F7941D',
    white: '#FFFFFF'
  };

  const guestUuid = registrationData?.guest_uuid || '';
  const qrValue = guestUuid; // Use full UUID for reliable check-in
  const eventUuid = eventData?.uuid || '094a5f9c-879c-468c-afd5-932521c50076';
  const eventName = eventData?.name || 'Tele birr 5th Year Anniversary Exhibition';

  const [showShareSection, setShowShareSection] = React.useState(false);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleDownloadBadge = async () => {
    if (!registrationData?.id || !eventData?.id) {
      toast.error('Missing registration data');
      return;
    }
    
    try {
      const response = await api.get(`/public/events/${eventData.id}/attendees/${registrationData.id}/badge`, {
        params: { guestUuid: guestUuid || undefined },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `telebirr-badge-${registrationData.registration_code || 'ticket'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Badge downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download badge');
    }
  };

  if (!registrationData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Info className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Registration Found</h2>
          <p className="text-gray-500 mb-6">It looks like you haven't completed the registration process yet.</p>
          <Button onClick={() => navigate('/')} style={{ backgroundColor: colors.deepGreen }}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10" style={{ colorScheme: 'light' }}>
      {/* Header */}
      <nav className="bg-white border-b-4 shadow-md sticky top-0 z-50" style={{ borderColor: colors.deepGreen }}>
        <div className="max-w-7xl mx-auto px-4 h-20 md:h-24 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/ethio_telecom_logo.png" alt="Ethio Telecom" className="h-8 md:h-12 w-auto object-contain" />
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden md:block text-right">
              <h1 className="text-xl font-bold text-gray-800 text-center">Registration Confirmed</h1>
            </div>
            <div className="hidden md:block h-10 w-[2px] bg-gray-200"></div>
            <img src="/telebirr5th year logo.png" alt="Telebirr" className="h-10 md:h-16 w-auto object-contain" />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden relative">
          {/* Top accent bar */}
          <div className="h-4 w-full" style={{ background: `linear-gradient(to right, ${colors.deepGreen}, ${colors.lightGreen})` }}></div>
          
          <div className="p-8 md:p-16">
            <div className="w-32 h-32 bg-[#8DC63F]/10 rounded-full flex items-center justify-center mx-auto mb-10 border-4 border-white shadow-inner">
              <CheckCircle className="w-16 h-16" style={{ color: colors.deepGreen }} />
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              You're Going!
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto font-medium">
              Your registration for <span className="font-bold text-gray-900">{eventData?.name || 'Tele birr 5th Year Anniversary Exhibition'}</span> is successfully confirmed.
            </p>


            {/* Guest Details */}
            <div className="mb-12">
              <p className="text-2xl font-bold text-gray-900">{registrationData.guest_name}</p>
              {(registrationData.guest_job_title || registrationData.guest_company) && (
                <p className="text-gray-500 font-medium">
                  {registrationData.guest_job_title} {registrationData.guest_job_title && registrationData.guest_company && 'at'} {registrationData.guest_company}
                </p>
              )}
            </div>


            {/* QR Code Section */}
            {guestUuid && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-12"
              >
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                  Entry QR Code
                </p>
                <div className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-xl inline-block relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-50"></div>
                  <div className="relative z-10">
                    <QRCodeSVG 
                      value={qrValue} 
                      size={200} 
                      level="H" 
                      includeMargin={false}
                      imageSettings={{
                        src: "/TeleBirr Logo.png",
                        x: undefined,
                        y: undefined,
                        height: 40,
                        width: 40,
                        excavate: true,
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#8DC63F] rounded-tl-2xl opacity-10 group-hover:opacity-30 transition-opacity"></div>
                </div>
              </motion.div>
            )}

            {/* Important Info */}
            <div className="bg-blue-50 border-2 border-blue-100 rounded-[2rem] p-6 mb-12 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 mb-1">Check your inbox!</h4>
                <p className="text-blue-700 text-sm leading-relaxed">
                  We've sent your digital eBadge to <span className="font-bold">{registrationData.guest_email || 'your email'}</span>. 
                  Present this QR code for entry.
                </p>
              </div>
            </div>

            {/* Share Section Reveal */}
            {!showShareSection && (
              <Button
                variant="outline"
                onClick={() => setShowShareSection(true)}
                className="w-full mb-8 h-14 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 font-bold transition-all"
              >
                <Share2 className="w-5 h-5 mr-2 text-blue-500" />
                Share your invitation banner
              </Button>
            )}

            {/* Share Banner Panel */}
            {showShareSection && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-12 overflow-hidden"
              >
                <GuestShareBannerPanel 
                  eventUuid={eventUuid}
                  eventName={eventName}
                  guestUuid={guestUuid}
                />
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-4">
              <Button
                type="button"
                onClick={handleDownloadBadge}
                className="h-20 w-full rounded-3xl text-xl font-black transition-all shadow-[0_15px_30px_rgba(0,171,78,0.3)] text-white active:scale-95"
                style={{ backgroundColor: colors.deepGreen }}
              >
                <Download className="w-7 h-7 mr-3" />
                Download E-Badge
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 text-gray-400">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Powered by</span>
            <a href="https://evella.et" target="_blank" rel="noopener noreferrer">
              <img src="/evella-logo.png" alt="Evella" className="h-6 transition-all cursor-pointer" />
            </a>
          </div>
          <p className="text-xs">© 2026 Ethio Telecom. All Rights Reserved.</p>
        </div>
      </main>
    </div>
  );
};

export default TelebirrRegistrationSuccess;
