import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type SubscriptionPlan } from '@/lib/api/subscriptions';

interface PricingTableProps {
    plans: SubscriptionPlan[];
    currentPlanId?: number;
    onSelectPlan: (plan: SubscriptionPlan) => void;
    billingCycle: 'monthly' | 'yearly';
    isLoading?: boolean;
}

export const PricingTable: React.FC<PricingTableProps> = ({
    plans,
    currentPlanId,
    onSelectPlan,
    billingCycle,
    isLoading
}) => {
    const sorted = [...plans].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sorted.map((plan) => {
                const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
                const isCurrent = plan.id === currentPlanId;
                const currentPlan = sorted.find((item) => item.id === currentPlanId);
                const currentPrice = currentPlan
                    ? (billingCycle === 'yearly' ? currentPlan.price_yearly : currentPlan.price_monthly)
                    : null;
                let buttonText = 'Select plan';
                if (isCurrent) buttonText = 'Current plan';
                else if (currentPrice !== null && price > currentPrice) buttonText = 'Upgrade';
                else if (currentPrice !== null && price < currentPrice) buttonText = 'Downgrade';

                return (
                    <article
                        key={plan.id}
                        className={cn(
                            'flex flex-col rounded-xl border border-border bg-card p-5',
                            isCurrent && 'border-foreground',
                        )}
                    >
                        <h2 className="text-base font-semibold">{plan.name}</h2>
                        {plan.description && (
                            <p className="mt-1 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
                        )}
                        <p className="mt-4 text-3xl font-semibold tracking-tight">
                            {price.toLocaleString()}
                            <span className="ml-1 text-sm font-normal text-muted-foreground">
                                {plan.currency} / {billingCycle === 'yearly' ? 'year' : 'month'}
                            </span>
                        </p>
                        <ul className="mt-4 flex-1 space-y-2">
                            {plan.features?.map((feature) => (
                                <li key={feature} className="flex items-start gap-2 text-sm">
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
                                </li>
                            ))}
                            {plan.limits && Object.entries(plan.limits).map(([key, value]) => (
                                <li key={key} className="text-sm text-muted-foreground">
                                    <span className="capitalize">{key.replace(/_/g, ' ')}: </span>
                                    <span className="text-foreground">{value === -1 ? 'Unlimited' : value}</span>
                                </li>
                            ))}
                        </ul>
                        <Button
                            className="mt-5 w-full"
                            variant={isCurrent ? 'outline' : 'default'}
                            disabled={isCurrent || isLoading}
                            onClick={() => onSelectPlan(plan)}
                        >
                            {buttonText}
                        </Button>
                    </article>
                );
            })}
        </div>
    );
};
