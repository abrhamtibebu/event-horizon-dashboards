import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { SpinnerInline } from '@/components/ui/spinner';

export default function RegistrationSuccess() {
  const [searchParams] = useSearchParams();
  const [downloading, setDownloading] = useState(false);

  // Get registration data from URL params
  const attendeeId = searchParams.get('attendeeId');
  const eventId = searchParams.get('eventId');
  const eventName = searchParams.get('eventName');
  const guestUuid = searchParams.get('guestUuid')?.trim() ?? '';
  const qrValue = guestUuid.slice(0, 8);

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
        params: { guestUuid: guestUuid || undefined },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = qrValue.length > 0 ? `e-badge-${qrValue}.pdf` : 'e-badge.pdf';
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
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 font-['Outfit'] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="max-w-md w-full min-w-0"
      >
        <Card className="bg-white dark:bg-slate-900 border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-6 sm:p-12 text-center rounded-[2rem] sm:rounded-[3rem] overflow-hidden relative">
          {/* Subtle Orange Accent at top */}
          <div className="absolute top-0 left-0 w-full h-2 bg-[#f97316]" />
          
          <div className="w-24 h-24 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-10 border border-orange-100 dark:border-orange-800">
            <CheckCircle className="w-12 h-12 text-[#f97316]" />
          </div>
          
          <h1 className="text-4xl font-black mb-4 tracking-tight text-slate-900 dark:text-white">
            Success!
          </h1>
          
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium px-1 sm:px-4 break-words">
            You've successfully registered for <span className="text-[#f97316] font-bold">&ldquo;{eventName}&rdquo;</span>. 
            A confirmation email with your details has been sent to your inbox.
          </p>

          {guestUuid.length > 0 ? (
            <div className="flex flex-col items-center mb-10 px-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                Guest check-in QR
              </p>
              <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                <QRCodeSVG value={qrValue} size={176} level="M" includeMargin />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6 mb-1">Guest code</p>
              <p className="text-lg font-mono font-bold tracking-wider text-slate-900 dark:text-white">
                {qrValue}
              </p>
            </div>
          ) : null}

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
      </motion.div>
    </div>
  );
}
