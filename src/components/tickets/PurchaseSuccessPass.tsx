import { useState } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { downloadGuestPurchasePass, type PurchasePassInfo } from '@/lib/api/guestTicketPurchase';

interface PurchaseSuccessPassProps {
  paymentId: number;
  purchasePass: PurchasePassInfo;
  ticketCount: number;
}

export function PurchaseSuccessPass({
  paymentId,
  purchasePass,
  ticketCount,
}: PurchaseSuccessPassProps) {
  const [downloading, setDownloading] = useState(false);
  const qrValue = purchasePass.qr_value;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const suffix = purchasePass.order_id.replace(/-/g, '').slice(0, 8);
      await downloadGuestPurchasePass(paymentId, `e-ticket-${suffix}.pdf`);
      toast.success('E-ticket downloaded');
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Failed to download e-ticket. Please try again.';
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="mx-auto mt-6 flex w-full max-w-xs flex-col items-center"
    >
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Event pass QR
      </p>

      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        {qrValue ? (
          <QRCode
            value={qrValue}
            size={176}
            level="M"
            fgColor="#000000"
            bgColor="#FFFFFF"
            className="mx-auto h-auto w-full max-w-[176px]"
          />
        ) : purchasePass.qr_code_base64 ? (
          <img
            src={purchasePass.qr_code_base64}
            alt="Event pass QR code"
            className="mx-auto h-auto w-full max-w-[176px]"
          />
        ) : (
          <div className="flex h-[176px] w-[176px] items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">
            QR unavailable
          </div>
        )}
      </div>

      {purchasePass.guest_name && (
        <p className="mt-3 text-center text-xs font-medium text-muted-foreground">
          {purchasePass.guest_name}
        </p>
      )}

      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        {ticketCount} ticket{ticketCount === 1 ? '' : 's'}
        {purchasePass.event_name ? ` · ${purchasePass.event_name}` : ''}
      </p>

      <Button
        type="button"
        className="mt-5 h-12 w-full rounded-xl font-semibold"
        onClick={handleDownload}
        disabled={downloading}
      >
        {downloading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Download e-ticket
      </Button>
    </motion.div>
  );
}
