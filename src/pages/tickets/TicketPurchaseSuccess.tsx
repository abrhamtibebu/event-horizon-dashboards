import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
  Ticket,
  XCircle,
} from 'lucide-react';
import { PurchaseSuccessPass } from '@/components/tickets/PurchaseSuccessPass';
import {
  confirmGuestPayment,
  fetchGuestPaymentStatus,
  type PurchasePassInfo,
} from '@/lib/api/guestTicketPurchase';

type PageStatus = 'processing' | 'completed' | 'failed';

export default function TicketPurchaseSuccess() {
  const [searchParams] = useSearchParams();
  const paymentId = Number(searchParams.get('paymentId') || '');
  const failedHint = searchParams.get('failed') === '1';

  const [status, setStatus] = useState<PageStatus>(
    // Only hard-fail immediately when we have no payment to recover
    failedHint && !(Number.isFinite(paymentId) && paymentId > 0) ? 'failed' : 'processing',
  );
  const [purchasePass, setPurchasePass] = useState<PurchasePassInfo | null>(null);
  const [ticketCount, setTicketCount] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(paymentId) || paymentId <= 0) {
      setStatus('failed');
      return;
    }

    // If Chapa bounced us with failed=1 but we still have paymentId, re-check with the API
    // (charge may have succeeded while the bridge lookup previously failed).
    let cancelled = false;
    let intervalId: number | undefined;

    const pollStatus = async () => {
      try {
        const result = await fetchGuestPaymentStatus(paymentId);
        if (cancelled) return;

        if (result.payment_status === 'failed') {
          setStatus('failed');
          if (intervalId) window.clearInterval(intervalId);
          return;
        }

        if (
          result.payment_status === 'success' &&
          (result.tickets_issued || result.purchase_pass)
        ) {
          setPurchasePass(result.purchase_pass ?? null);
          setTicketCount(result.ticket_count ?? result.tickets?.length ?? 0);
          setStatus('completed');
          if (intervalId) window.clearInterval(intervalId);
          return;
        }

        setStatus('processing');
      } catch {
        if (!cancelled) {
          setStatus('processing');
        }
      }
    };

    void confirmGuestPayment(paymentId).catch(() => {});
    void pollStatus();
    intervalId = window.setInterval(pollStatus, 2500);

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [paymentId]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <motion.div
        className="max-w-xl w-full relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="h-2 w-full bg-brand-gradient" />
          <CardContent className="p-8 md:p-10 text-center space-y-6">
            {status === 'processing' && (
              <>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Loader2 className="h-10 w-10 animate-spin" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tighter mb-2">
                    Finalizing your purchase
                  </h1>
                  <p className="text-muted-foreground">
                    Confirming payment and issuing your event pass…
                  </p>
                </div>
              </>
            )}

            {status === 'completed' && (
              <>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tighter mb-2">
                    Purchase confirmed
                  </h1>
                  <p className="text-muted-foreground">
                    Show the pass QR below at entry. One scan covers all tickets in this order.
                  </p>
                </div>

                {purchasePass && paymentId > 0 && (
                  <PurchaseSuccessPass
                    paymentId={paymentId}
                    purchasePass={purchasePass}
                    ticketCount={ticketCount}
                  />
                )}

                <div className="rounded-2xl border border-border bg-muted/30 p-5 text-left space-y-4">
                  <div className="flex gap-3">
                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      A confirmation email with your e-ticket has been sent to your inbox.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Ticket className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Download the PDF for offline access. Page 2 lists each ticket holder.
                    </p>
                  </div>
                </div>
              </>
            )}

            {status === 'failed' && (
              <>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <XCircle className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tighter mb-2">
                    Payment not completed
                  </h1>
                  <p className="text-muted-foreground">
                    We could not confirm your payment. Please try again or contact support.
                  </p>
                </div>
              </>
            )}

            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
              <ShieldCheck className="h-4 w-4" /> Secure ticketing
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
