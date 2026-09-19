import type { ReactNode } from 'react';
import { Ticket } from 'lucide-react';
import { SpinnerInline } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { formatDiscountLineLabel } from '@/lib/referralCode';

export interface OrderLine {
  ticketTypeId: number;
  name: string;
  unitPrice: number;
  quantity: number;
}

interface PurchaseOrderSummaryProps {
  ticketName?: string;
  /** Multi-tier carts (seat-first checkout) render one row per ticket type. */
  lines?: OrderLine[];
  unitPrice?: number;
  quantity: number;
  subtotal: number;
  discount?: number;
  discountPercent?: number | null;
  discountLabel?: string | null;
  total: number;
  calculating?: boolean;
  seatLabels?: string[];
  showQuantityControls?: boolean;
  onDecrease?: () => void;
  onIncrease?: () => void;
  footer?: ReactNode;
  variant?: 'card' | 'inline';
  className?: string;
}

function formatEtb(amount: number) {
  return `ETB ${amount.toLocaleString()}`;
}

export function PurchaseOrderSummary({
  ticketName,
  lines,
  unitPrice,
  quantity,
  subtotal,
  discount = 0,
  discountPercent,
  discountLabel,
  total,
  calculating,
  seatLabels,
  showQuantityControls,
  onDecrease,
  onIncrease,
  footer,
  variant = 'card',
  className,
}: PurchaseOrderSummaryProps) {
  const hasLines = Boolean(lines?.length);
  const hasSelection = Boolean(ticketName) || hasLines;

  const content = !hasSelection ? (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
        <Ticket className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">Select a ticket to see your total</p>
    </div>
  ) : (
    <div className="space-y-5">
      {hasLines ? (
        <div className="space-y-2.5">
          {lines!.map((line) => (
            <div key={line.ticketTypeId} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold tracking-tight text-foreground">
                  {line.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatEtb(line.unitPrice)} each
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                ×{line.quantity}
              </span>
            </div>
          ))}
        </div>
      ) : (
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold tracking-tight text-foreground">{ticketName}</p>
          {unitPrice != null && (
            <p className="mt-0.5 text-sm text-muted-foreground">{formatEtb(unitPrice)} each</p>
          )}
        </div>
        {showQuantityControls ? (
          <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/50 p-1">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={onDecrease}
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold hover:bg-muted"
            >
              −
            </button>
            <span className="min-w-[1.5rem] text-center text-sm font-bold tabular-nums">{quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={onIncrease}
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold hover:bg-muted"
            >
              +
            </button>
          </div>
        ) : (
          <span className="rounded-full bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            ×{quantity}
          </span>
        )}
      </div>
      )}

      {seatLabels && seatLabels.length > 0 && (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-2xl bg-muted/40 px-3 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Seats
          </span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {seatLabels.join(', ')}
          </span>
        </div>
      )}

      <div className="space-y-2.5 border-y border-border/40 py-4 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium tabular-nums">
            {calculating ? <SpinnerInline /> : formatEtb(subtotal)}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between gap-3 text-emerald-500">
            <span>{formatDiscountLineLabel(discountPercent, discountLabel)}</span>
            <span className="font-medium tabular-nums">−{formatEtb(discount)}</span>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Service fee</span>
          <span className="text-xs font-medium text-emerald-500">Covered</span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">Total</span>
        <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
          {calculating ? <SpinnerInline /> : formatEtb(total)}
        </span>
      </div>

      {footer}
    </div>
  );

  if (variant === 'inline') return <div className={className}>{content}</div>;

  return (
    <div
      className={cn(
        'rounded-3xl border border-border/40 bg-card/60 p-5 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6',
        className,
      )}
    >
      <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Order summary
      </h3>
      {content}
    </div>
  );
}
