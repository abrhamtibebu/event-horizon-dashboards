import React from 'react';
import { Check, X, Zap, Shield, Sparkles, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    const getPlanIcon = (slug: string) => {
        switch (slug) {
            case 'starter': return <Zap className="w-5 h-5 text-blue-500" />;
            case 'professional': return <Star className="w-5 h-5 text-purple-500" />;
            case 'business': return <Shield className="w-5 h-5 text-amber-500" />;
            case 'ultimate': return <Sparkles className="w-5 h-5 text-pink-500" />;
            default: return <Zap className="w-5 h-5" />;
        }
    };

    const getPlanColor = (slug: string) => {
        switch (slug) {
            case 'starter': return 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20';
            case 'professional': return 'border-purple-200 bg-purple-50/50 dark:bg-purple-950/20';
            case 'business': return 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20';
            case 'ultimate': return 'border-pink-200 bg-pink-50/50 dark:bg-pink-950/20 shadow-lg scale-105 z-10';
            default: return '';
        }
    };

    const getButtonText = (plan: SubscriptionPlan) => {
        if (plan.id === currentPlanId) return 'Current Plan';
        if (plan.slug === 'starter' && !currentPlanId) return 'Get Started';
        return 'Select Plan';
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-8">
            {plans.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((plan) => (
                <Card
                    key={plan.id}
                    className={cn(
                        "relative flex flex-col transition-all duration-300 hover:shadow-xl border-2",
                        getPlanColor(plan.slug),
                        plan.id === currentPlanId && "ring-2 ring-primary ring-offset-2"
                    )}
                >
                    {plan.slug === 'ultimate' && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-none py-1 px-3">
                                Most Powerful
                            </Badge>
                        </div>
                    )}

                    <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            {getPlanIcon(plan.slug)}
                            <CardTitle className="text-xl capitalize">{plan.name}</CardTitle>
                        </div>
                        <CardDescription className="min-h-[40px]">
                            {plan.description}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1">
                        <div className="mb-6">
                            <span className="text-4xl font-bold">
                                {billingCycle === 'yearly'
                                    ? plan.price_yearly.toLocaleString()
                                    : plan.price_monthly.toLocaleString()
                                }
                            </span>
                            <span className="text-muted-foreground ml-1">
                                {plan.currency} / {billingCycle === 'yearly' ? 'yr' : 'mo'}
                            </span>
                            {billingCycle === 'yearly' && plan.price_yearly > 0 && (
                                <p className="text-xs text-green-600 font-medium mt-1">
                                    Save approx. 17% yearly
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-foreground/80">Key Features:</p>
                            <ul className="space-y-2">
                                {plan.features?.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                        <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
                                    </li>
                                ))}
                            </ul>

                            <Separator className="my-4" />

                            <p className="text-sm font-semibold text-foreground/80">Limits:</p>
                            <ul className="space-y-2">
                                {plan.limits && Object.entries(plan.limits).map(([key, value]) => (
                                    <li key={key} className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                        <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                                        <span className="font-medium text-foreground">
                                            {value === -1 ? 'Unlimited' : value}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>

                    <CardFooter>
                        <Button
                            className={cn(
                                "w-full",
                                plan.slug === 'ultimate' ? "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600" : ""
                            )}
                            variant={plan.id === currentPlanId ? "outline" : "default"}
                            disabled={plan.id === currentPlanId || isLoading}
                            onClick={() => onSelectPlan(plan)}
                        >
                            {getButtonText(plan)}
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
};

import { Separator } from '@/components/ui/separator';
