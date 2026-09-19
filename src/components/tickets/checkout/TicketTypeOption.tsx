import { Check, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TicketAvailabilityStatus = 'available' | 'limited' | 'selling_fast' | 'sold_out';

interface TicketTypeOptionProps {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  benefits?: string[];
  isSoldOut: boolean;
  /** How many of this tier are in the cart (0 = not added). */
  quantity: number;
  maxQuantity?: number;
  remaining?: number | null;
  availabilityStatus?: TicketAvailabilityStatus;
  /** Colour of the matching seat-map tier, when the event has a seating chart. */
  tierColor?: string | null;
  onQuantityChange: (qty: number) => void;
}

function formatEtb(amount: number) {
  return amount === 0 ? 'Free' : `ETB ${amount.toLocaleString()}`;
}

function AvailabilityChip({
  status,
  remaining,
}: {
  status?: TicketAvailabilityStatus;
  remaining?: number | null;
}) {
  if (status === 'sold_out') {
    return (
      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
        Sold out
      </span>
    );
  }
  if (status === 'limited' || status === 'selling_fast') {
    return (
      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
        {remaining != null ? `Only ${remaining} left` : 'Selling fast'}
      </span>
    );
  }
  if (remaining != null) {
    return (
      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
        {remaining} available
      </span>
    );
  }
  return null;
}

export function TicketTypeOption({
  name,
  description,
  price,
  benefits,
  isSoldOut,
  quantity,
  maxQuantity = 10,
  remaining,
  availabilityStatus,
  tierColor,
  onQuantityChange,
}: TicketTypeOptionProps) {
  const inCart = quantity > 0;

  return (
    <div
      className={cn(
        'w-full rounded-2xl border p-4 transition-all duration-200 sm:p-5',
        inCart
          ? 'border-primary/50 bg-primary/[0.06] shadow-[0_0_0_1px_hsl(var(--primary)/0.25)]'
          : 'border-border/50 bg-card/40',
        isSoldOut && 'opacity-50',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {tierColor && (
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: tierColor }}
              />
            )}
            <h3 className="text-base font-semibold tracking-tight text-foreground">{name}</h3>
            <AvailabilityChip status={availabilityStatus} remaining={remaining} />
            {inCart && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                <Check className="h-3 w-3" /> In cart
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
          {benefits && benefits.length > 0 && (
            <ul className="space-y-1 pt-1">
              {benefits.slice(0, 4).map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-1.5 text-xs text-muted-foreground"
                >
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  {benefit}
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="shrink-0 text-right text-lg font-bold tabular-nums tracking-tight text-foreground">
          {formatEtb(price)}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
        <span className="text-sm text-muted-foreground">
          {isSoldOut ? 'Unavailable' : inCart ? 'Quantity' : 'Add to order'}
        </span>
        {inCart ? (
          <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/60 p-1">
            <button
              type="button"
              aria-label={`Remove one ${name}`}
              onClick={() => onQuantityChange(quantity - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[2rem] text-center text-sm font-bold tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              aria-label={`Add one ${name}`}
              disabled={quantity >= maxQuantity}
              onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isSoldOut}
            onClick={() => onQuantityChange(1)}
            className="rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add
          </button>
        )}
      </div>
    </div>
  );
}
