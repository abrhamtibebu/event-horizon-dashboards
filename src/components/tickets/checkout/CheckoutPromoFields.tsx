import { ChevronDown, ChevronUp, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface CheckoutPromoFieldsProps {
  promoCode: string
  onPromoCodeChange: (value: string) => void
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  discountHint?: string | null
  error?: string | null
  className?: string
}

export function CheckoutPromoFields({
  promoCode,
  onPromoCodeChange,
  expanded,
  onExpandedChange,
  discountHint,
  error,
  className,
}: CheckoutPromoFieldsProps) {
  const hasCode = Boolean(promoCode.trim())

  return (
    <div className={cn('space-y-2', className)}>
      {hasCode && !expanded && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
          <Tag className="h-4 w-4 shrink-0" />
          <span>
            Referral code applied
            {discountHint && (
              <span className="ml-1 text-emerald-700">({discountHint})</span>
            )}
          </span>
          <button
            type="button"
            className="ml-auto text-xs font-medium underline underline-offset-2"
            onClick={() => onExpandedChange(true)}
          >
            Edit
          </button>
        </div>
      )}

      <button
        type="button"
        className="flex w-full items-center justify-between rounded-2xl border border-border/40 bg-card/30 px-3.5 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/20 hover:text-foreground"
        onClick={() => onExpandedChange(!expanded)}
      >
        <span>Have a referral code?</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="space-y-2 rounded-2xl border border-border/40 bg-card/20 p-3.5">
          <Label htmlFor="checkout-promo-code" className="text-xs text-muted-foreground">
            Referral code
          </Label>
          <Input
            id="checkout-promo-code"
            className="h-11 rounded-xl border-border/50 bg-background/50 font-mono text-sm"
            value={promoCode}
            onChange={(e) => onPromoCodeChange(e.target.value)}
            placeholder="Partner code, invitation, or sales agent mobile"
            autoComplete="off"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          {!error && discountHint && (
            <p className="text-xs text-emerald-500">{discountHint} discount will apply</p>
          )}
        </div>
      )}
    </div>
  )
}
