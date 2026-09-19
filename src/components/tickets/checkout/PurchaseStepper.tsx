import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CheckoutStep = 'select' | 'seats' | 'details' | 'payment';

const ALL_STEPS: { id: CheckoutStep; label: string }[] = [
  { id: 'select', label: 'Tickets' },
  { id: 'seats', label: 'Seats' },
  { id: 'details', label: 'Details' },
  { id: 'payment', label: 'Payment' },
];

interface PurchaseStepperProps {
  current: CheckoutStep;
  showSeats?: boolean;
  /** Seat-first checkout derives the cart from the map, so there is no ticket step. */
  showSelect?: boolean;
  className?: string;
}

export function PurchaseStepper({
  current,
  showSeats = false,
  showSelect = true,
  className,
}: PurchaseStepperProps) {
  const steps = ALL_STEPS.filter(
    (s) => (s.id !== 'seats' || showSeats) && (s.id !== 'select' || showSelect),
  );
  const currentIndex = steps.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Checkout steps" className={cn('w-full', className)}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isActive = index === currentIndex;
          const isDone = index < currentIndex;

          return (
            <li key={step.id} className={cn('flex items-center', index > 0 && 'flex-1')}>
              {index > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    'mx-2 h-px flex-1 transition-colors duration-300 sm:mx-3',
                    isDone || isActive ? 'bg-primary/60' : 'bg-border',
                  )}
                />
              )}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums transition-colors duration-300',
                    isDone && 'border-primary bg-primary text-primary-foreground',
                    isActive && 'border-primary bg-primary/10 text-primary',
                    !isDone && !isActive && 'border-border text-muted-foreground',
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium tracking-tight transition-colors duration-300',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                    !isActive && 'hidden sm:inline',
                  )}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
