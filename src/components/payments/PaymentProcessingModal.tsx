import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { motion } from 'framer-motion';
import type { PaymentStatus } from '@/types/tickets';

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

  return (
    <Dialog open={isOpen} onOpenChange={isProcessing ? undefined : onClose}>
      <DialogContent className="sm:max-w-md border-none shadow-2xl overflow-hidden p-0">
        <div className={`h-1.5 w-full ${isProcessing ? 'bg-primary/20' : isSuccess ? 'bg-green-500/20' : 'bg-destructive/20'}`}>
          {isProcessing && (
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          )}
          {!isProcessing && <div className={`h-full ${isSuccess ? 'bg-green-500' : 'bg-destructive'} w-full`} />}
        </div>

        <div className="p-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black tracking-tighter">
              {isProcessing && 'Securing Your Tickets'}
              {isSuccess && 'Purchase Confirmed'}
              {isFailed && 'Payment Issue'}
            </h2>
            <p className="text-muted-foreground text-sm font-medium">
              {isProcessing && 'Hang tight! We\'re verifying your transaction.'}
              {isSuccess && 'Success! Your digital tickets are ready.'}
              {isFailed && 'Something went wrong with the transaction.'}
            </p>
          </div>

          <div className="flex justify-center py-4">
            <div className={`relative flex items-center justify-center w-24 h-24 rounded-full ${isProcessing ? 'bg-primary/5' : isSuccess ? 'bg-green-500/5' : 'bg-destructive/5'}`}>
              {isProcessing && <Spinner size="xl" variant="primary" />}
              {isSuccess && <CheckCircle className="w-12 h-12 text-green-500" />}
              {isFailed && <XCircle className="w-12 h-12 text-destructive" />}
            </div>
          </div>

          {message && (
            <div className="bg-muted/30 p-4 rounded-xl text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Status Update</p>
              <p className="text-sm font-medium text-foreground">{message}</p>
            </div>
          )}

          {!isProcessing && (
            <div className="flex gap-3 pt-2">
              {isSuccess && (
                <Button onClick={onClose} className="w-full h-12 font-bold text-base">
                  View My Tickets
                </Button>
              )}
              {isFailed && (
                <>
                  <Button onClick={onRetry} className="flex-1 h-12 font-bold text-base">
                    Try Again
                  </Button>
                  <Button onClick={onClose} variant="ghost" className="flex-1 h-12 font-bold">
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
