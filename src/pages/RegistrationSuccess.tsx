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

  // Get registration data from URL params
  const attendeeId = searchParams.get('attendeeId');
  const eventId = searchParams.get('eventId');
  const eventName = searchParams.get('eventName');
  const guestName = searchParams.get('guestName');
  const guestUuid = searchParams.get('guestUuid');

  useEffect(() => {
    if (!attendeeId || !eventId || !eventName) {
      toast.error('Registration data not found');
    }
  }, [attendeeId, eventId, eventName]);

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
      toast.success('E-badge downloaded successfully!');
    } catch (error: any) {
      toast.error('Failed to download badge. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 font-['Outfit']">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card className="bg-white dark:bg-slate-900 border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-12 text-center rounded-[3rem] overflow-hidden relative">
          {/* Subtle Orange Accent at top */}
          <div className="absolute top-0 left-0 w-full h-2 bg-[#f97316]" />
          
          <div className="w-24 h-24 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-10 border border-orange-100 dark:border-orange-800">
            <CheckCircle className="w-12 h-12 text-[#f97316]" />
          </div>
          
          <h1 className="text-4xl font-black mb-4 tracking-tight text-slate-900 dark:text-white">
            Success!
          </h1>
          
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium px-4">
            You've successfully registered for <span className="text-[#f97316] font-bold">"{eventName}"</span>. 
            A confirmation email with your details has been sent to your inbox.
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 mb-10 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Guest Name</p>
            <p className="text-slate-900 dark:text-white font-bold text-lg">{guestName}</p>
          </div>

          <div className="space-y-4">
            <Button
              type="button"
              onClick={handleDownloadBadge}
              disabled={downloading}
              className="w-full h-16 bg-[#f97316] hover:bg-[#ea580c] text-white font-black text-xl rounded-2xl shadow-[0_10px_20px_rgba(249,115,22,0.3)] transition-all active:scale-[0.98]"
            >
              {downloading ? (
                <SpinnerInline size="sm" />
              ) : (
                <div className="flex items-center justify-center">
                  <Download className="w-6 h-6 mr-3" />
                  Download E-Badge
                </div>
              )}
            </Button>
            
            <p className="text-xs text-slate-400 font-medium pt-4">
              Present your digital badge at the entrance for quick access.
            </p>
          </div>
        </Card>

        {/* Home Link */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.6 }}
          className="text-center mt-8"
        >
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-[#f97316] font-bold text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
