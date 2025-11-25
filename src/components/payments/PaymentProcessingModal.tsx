import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { PaymentStatus } from '@/types/tickets';

interface PaymentProcessingModalProps {
  open: boolean;
  status: PaymentStatus;
  message?: string;
  progress?: number;
  onClose?: () => void;
  onRetry?: () => void;
}

export function PaymentProcessingModal({
  open,
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" hideClose={isProcessing}>
        <DialogHeader>
          <DialogTitle>
            {isProcessing && 'Processing Payment'}
            {isSuccess && 'Payment Successful'}
            {isFailed && 'Payment Failed'}
          </DialogTitle>
          <DialogDescription>
            {isProcessing && 'Please wait while we process your payment...'}
            {isSuccess && 'Your payment has been processed successfully'}
            {isFailed && 'We encountered an error processing your payment'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Status Icon */}
          <div className="flex justify-center">
            {isProcessing && (
              <Spinner size="xl" variant="primary" />
            )}
            {isSuccess && (
              <CheckCircle className="w-16 h-16 text-green-500" />
            )}
            {isFailed && (
              <XCircle className="w-16 h-16 text-destructive" />
            )}
          </div>

          {/* Progress Bar (only for processing) */}
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                {progress}% complete
              </p>
            </div>
          )}

          {/* Message */}
          {message && (
            <p className="text-sm text-center text-muted-foreground">
              {message}
            </p>
          )}

          {/* Action Buttons */}
          {!isProcessing && (
            <div className="flex gap-2 justify-center">
              {isSuccess && onClose && (
                <Button onClick={onClose} className="w-full">
                  Continue
                </Button>
              )}
              {isFailed && (
                <>
                  {onRetry && (
                    <Button onClick={onRetry} variant="default">
                      Try Again
                    </Button>
                  )}
                  {onClose && (
                    <Button onClick={onClose} variant="outline">
                      Cancel
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

