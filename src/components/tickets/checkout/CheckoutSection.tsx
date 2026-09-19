import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CheckoutSectionProps {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function CheckoutSection({ label, description, children, className }: CheckoutSectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{label}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </header>
      {children}
    </section>
  );
}
