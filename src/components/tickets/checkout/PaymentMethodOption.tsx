import { Check, CreditCard, Smartphone, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaymentMethod } from '@/types/tickets';

interface PaymentMethodOptionProps {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
}

function FallbackIcon({ id }: { id: PaymentMethod }) {
  if (id === 'telebirr' || id === 'm_pesa') return <Smartphone className="h-5 w-5" />;
  if (id === 'chapa') return <CreditCard className="h-5 w-5" />;
  return <Wallet className="h-5 w-5" />;
}

export function PaymentMethodOption({
  id,
  label,
  description,
  icon,
  selected,
  onClick,
}: PaymentMethodOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200',
        selected
          ? 'border-primary/50 bg-primary/[0.06] shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]'
          : 'border-border/50 bg-card/40 hover:border-primary/25 hover:bg-card/70',
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/80">
        <img
          src={icon}
          alt=""
          className="h-8 w-8 object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <div className="hidden h-8 w-8 items-center justify-center text-muted-foreground">
          <FallbackIcon id={id} />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold tracking-tight text-foreground">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors',
          selected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border/70 text-transparent',
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </div>
    </button>
  );
}
