import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronUp, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpinnerInline } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface CheckoutActionDockProps {
  total: number;
  calculating?: boolean;
  label: string;
  helper?: string | null;
  disabled?: boolean;
  loading?: boolean;
  isPayStep?: boolean;
  onAction: () => void;
  onBack?: () => void;
  /** Expanded breakdown, revealed by the chevron. */
  details?: ReactNode;
  className?: string;
}

function formatEtb(amount: number) {
  return `ETB ${amount.toLocaleString()}`;
}

/**
 * One persistent action surface for every breakpoint: totals and the primary CTA stay
 * pinned to the bottom, with the full price breakdown a tap away.
 */
export function CheckoutActionDock({
  total,
  calculating,
  label,
  helper,
  disabled,
  loading,
  isPayStep,
  onAction,
  onBack,
  details,
  className,
}: CheckoutActionDockProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-background/90 backdrop-blur-xl',
        'shadow-[0_-24px_48px_-32px_rgba(0,0,0,0.55)]',
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AnimatePresence initial={false}>
          {open && details && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-b border-border/40 py-4">{details}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => details && setOpen((v) => !v)}
            className={cn('min-w-0 text-left', details ? 'cursor-pointer' : 'cursor-default')}
            aria-expanded={open}
          >
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Total
              {details && (
                <ChevronUp
                  className={cn(
                    'h-3 w-3 transition-transform duration-200',
                    open && 'rotate-180',
                  )}
                />
              )}
            </p>
            <p className="text-xl font-bold tabular-nums tracking-tight text-foreground">
              {calculating ? '…' : formatEtb(total)}
            </p>
            {helper && (
              <p className="truncate text-[11px] font-medium text-muted-foreground">{helper}</p>
            )}
          </button>

          <div className="ml-auto flex items-center gap-2">
            {onBack && (
              <Button
                variant="ghost"
                onClick={onBack}
                className="hidden rounded-2xl text-muted-foreground sm:inline-flex"
              >
                Back
              </Button>
            )}
            <Button
              size="lg"
              disabled={disabled || loading}
              onClick={onAction}
              className={cn(
                'h-12 rounded-2xl px-6 text-base font-semibold',
                isPayStep && 'bg-brand-gradient text-primary-foreground hover:opacity-95',
              )}
            >
              {loading ? (
                <>
                  <SpinnerInline className="mr-2" />
                  Processing…
                </>
              ) : isPayStep ? (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  {label}
                </>
              ) : (
                <>
                  {label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        <p className="hidden items-center justify-center gap-1.5 pb-2 text-[10px] text-muted-foreground sm:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Secure checkout · tickets emailed after payment
        </p>
      </div>
    </div>
  );
}
