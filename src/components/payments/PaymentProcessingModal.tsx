import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import type { PaymentStatus } from '@/types/tickets';
import { cn } from '@/lib/utils';

interface PaymentProcessingModalProps {
  isOpen: boolean;
  status: PaymentStatus;
  message?: string;
  progress?: number;
  onClose?: () => void;
  onRetry?: () => void;
}

export function PaymentProcessingModal({
  isOpen,
  status,
  message,
  progress = 0,
  onClose,
  onRetry,
}: PaymentProcessingModalProps) {
  const isProcessing = status === 'pending';
  const isSuccess = status === 'success';
  const isFailed = status === 'failed' || status === 'cancelled';
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <Dialog open={isOpen} onOpenChange={isProcessing ? undefined : onClose}>
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-md">
        <div
          className={cn(
            'h-1 w-full',
            isProcessing && 'bg-primary/15',
            isSuccess && 'bg-green-500',
            isFailed && 'bg-destructive',
          )}
        />

        <div className="space-y-6 p-8">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              {isProcessing && 'Securing Your Tickets'}
              {isSuccess && 'Purchase Confirmed'}
              {isFailed && 'Payment Issue'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isProcessing && "Hang tight — we're verifying your transaction."}
              {isSuccess && 'Success! Your digital tickets are ready.'}
              {isFailed && 'Something went wrong with the transaction.'}
            </p>
          </div>

          {isProcessing ? (
            <div className="space-y-4 py-2">
              <div className="text-center">
                <motion.span
                  key={clampedProgress}
                  initial={{ opacity: 0.6, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-5xl font-bold tabular-nums tracking-tight text-primary"
                >
                  {clampedProgress}%
                </motion.span>
              </div>
              <Progress value={clampedProgress} className="h-2.5" />
              <p className="text-center text-xs text-muted-foreground">
                {clampedProgress < 30
                  ? 'Initiating secure payment…'
                  : clampedProgress < 70
                    ? 'Confirming with payment provider…'
                    : clampedProgress < 95
                      ? 'Issuing your tickets…'
                      : 'Almost done…'}
              </p>
            </div>
          ) : (
            <div className="flex justify-center py-4">
              <div
                className={cn(
                  'flex h-20 w-20 items-center justify-center rounded-full',
                  isSuccess ? 'bg-green-500/10' : 'bg-destructive/10',
                )}
              >
                {isSuccess && <CheckCircle className="h-11 w-11 text-green-500" />}
                {isFailed && <XCircle className="h-11 w-11 text-destructive" />}
              </div>
            </div>
          )}

          {message && (
            <div className="rounded-xl bg-muted/30 p-4 text-center">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Status
              </p>
              <p className="text-sm font-medium text-foreground">{message}</p>
            </div>
          )}

          {!isProcessing && (
            <div className="flex gap-3 pt-1">
              {isSuccess && (
                <Button onClick={onClose} className="h-12 w-full text-base font-semibold">
                  View My Tickets
                </Button>
              )}
              {isFailed && (
                <>
                  <Button onClick={onRetry} className="h-12 flex-1 text-base font-semibold">
                    Try Again
                  </Button>
                  <Button onClick={onClose} variant="ghost" className="h-12 flex-1 font-semibold">
                    Cancel
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
