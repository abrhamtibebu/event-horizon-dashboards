import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  CheckCircle,
  Download,
  Share2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { downloadPublicAttendeeBadgeWithToast } from '@/lib/publicBadgeDownload';
import { SpinnerInline } from '@/components/ui/spinner';
import { GuestShareBannerPanel } from '@/components/share/GuestShareBannerPanel'

type PublicEventHydration = {
  id: number;
  uuid: string;
  title: string;
  image?: string | null;
  event_type?: string | null;
};

function decodeQueryParam(raw: string | null): string | null {
  if (raw === null || raw === '') return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default function RegistrationSuccess() {
  const [searchParams] = useSearchParams();
  const [downloading, setDownloading] = useState(false);
  const [showShareSection, setShowShareSection] = useState(false)

  const attendeeId = searchParams.get('attendeeId');
  const eventIdParam = searchParams.get('eventId');
  const eventNameParam = searchParams.get('eventName');
  const guestUuid = searchParams.get('guestUuid')?.trim() ?? '';
  const qrValue = guestUuid.slice(0, 8);

  const displayNameRaw = decodeQueryParam(eventNameParam) ?? '';
  const [hydratedEvent, setHydratedEvent] = useState<PublicEventHydration | null>(null);

  useEffect(() => {
    if (!attendeeId || !eventIdParam || !eventNameParam) {
      toast.error('Registration data not found');
    }
  }, [attendeeId, eventIdParam, eventNameParam]);

  const eventNumericId = useMemo(() => {
    const n = parseInt(eventIdParam ?? '', 10);
    return Number.isFinite(n) ? n : null;
  }, [eventIdParam]);

  useEffect(() => {
    const id = eventNumericId;
    if (!id) return;

    const ac = new AbortController();
    (async () => {
      try {
        const { data } = await api.get<PublicEventHydration>(`/public/events/id/${id}`, {
          signal: ac.signal,
        });
        setHydratedEvent(data);
      } catch (_e: unknown) {
        if (!ac.signal.aborted) {
          setHydratedEvent(null);
        }
      }
    })();

    return () => ac.abort();
  }, [eventNumericId]);

  const displayName = hydratedEvent?.title?.trim() || displayNameRaw;

  const handleDownloadBadge = async () => {
    if (!attendeeId || !eventIdParam) return;
    setDownloading(true);
    try {
      await downloadPublicAttendeeBadgeWithToast({
        eventId: eventIdParam,
        attendeeId,
        guestUuid,
        downloadFilename: qrValue.length > 0 ? `e-badge-${qrValue}.pdf` : 'e-badge.pdf',
      });
    } finally {
      setDownloading(false);
    }
  };

  const canShowPersonalShare =
    Boolean(hydratedEvent?.uuid?.trim()) && Boolean(guestUuid?.trim()) && Boolean(displayName?.trim())

  const handleRevealShare = useCallback(() => {
    setShowShareSection(true)
    // Scroll after next paint so the section exists.
    setTimeout(() => {
      document.getElementById('share-with-friends')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 font-['Outfit'] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full min-w-0"
      >
        <Card className="bg-white dark:bg-slate-900 border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] text-center rounded-[2rem] sm:rounded-[3rem] overflow-hidden relative p-0 gap-0">
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#f97316] z-10" />

          <div className="p-6 sm:p-10 pt-8">
            <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-100 dark:border-orange-800">
              <CheckCircle className="w-10 h-10 text-[#f97316]" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight text-slate-900 dark:text-white">
              Success!
            </h1>

            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium px-1 sm:px-2 break-words">
              You&apos;ve successfully registered for{' '}
              <span className="text-[#f97316] font-bold">&ldquo;{displayName || eventNameParam}&rdquo;</span>. A
              confirmation email with your details has been sent to your inbox.
            </p>

            {guestUuid.length > 0 ? (
              <div className="flex flex-col items-center mb-10 px-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Guest check-in QR
                </p>
                <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                  <QRCodeSVG value={qrValue} size={176} level="M" includeMargin />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6 mb-1">
                  Guest code
                </p>
                <p className="text-lg font-mono font-bold tracking-wider text-slate-900 dark:text-white">
                  {qrValue}
                </p>
              </div>
            ) : null}

            <div className="space-y-4 mb-8">
              {eventNumericId != null && attendeeId ? (
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-xl font-bold border-slate-200 dark:border-slate-700"
                    onClick={handleRevealShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share with your friends
                  </Button>
                </div>
              ) : null}
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

              <p className="text-xs text-slate-400 font-medium pt-2">
                Present your digital badge at the entrance for quick access.
              </p>
            </div>

            {canShowPersonalShare && showShareSection ? (
              <div className="mb-8">
                <div id="share-with-friends" className="scroll-mt-24" />
                <GuestShareBannerPanel eventUuid={hydratedEvent!.uuid} eventName={displayName} guestUuid={guestUuid} />
              </div>
            ) : null}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
