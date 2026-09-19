import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn, getImageUrl } from '@/lib/utils';

interface CheckoutTopBarProps {
  eventName: string;
  imageUrl?: string | null;
  eventId?: number | string;
  startDate?: Date | null;
  onBack: () => void;
  className?: string;
}

export function CheckoutTopBar({
  eventName,
  imageUrl,
  eventId,
  startDate,
  onBack,
  className,
}: CheckoutTopBarProps) {
  const src = imageUrl ? getImageUrl(imageUrl, eventId) : null;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl',
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {src && (
          <img
            src={src}
            alt=""
            className="hidden h-9 w-9 shrink-0 rounded-xl object-cover sm:block"
            loading="eager"
          />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight text-foreground">
            {eventName}
          </p>
          {startDate && (
            <p className="truncate text-xs text-muted-foreground">
              {format(startDate, 'EEE, MMM d · h:mm a')}
            </p>
          )}
        </div>

        <span className="hidden rounded-full border border-border/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:inline">
          Secure checkout
        </span>
      </div>
    </header>
  );
}
