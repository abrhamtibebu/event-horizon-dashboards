import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { PaymentMethod } from '@/types/tickets';
import { getPaymentMethods } from '@/lib/api/payments';

interface PaymentMethodSelectorProps {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  className?: string;
}

export function PaymentMethodSelector({
  selected,
  onSelect,
  className,
}: PaymentMethodSelectorProps) {
  const paymentMethods = getPaymentMethods();

  return (
    <div className={className}>
      <RadioGroup value={selected || ''} onValueChange={(value) => onSelect(value as PaymentMethod)}>
        <div className="grid gap-4">
          {paymentMethods.map((method) => (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all ${
                selected === method.id
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:border-primary/50'
              } ${!method.is_available ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => method.is_available && onSelect(method.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={method.id}
                    id={method.id}
                    disabled={!method.is_available}
                  />
                  <div className="flex-1 flex items-center space-x-3">
                    <span className="text-3xl">{method.icon}</span>
                    <div className="flex-1">
                      <Label
                        htmlFor={method.id}
                        className="text-base font-semibold cursor-pointer"
                      >
                        {method.name}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {method.description}
                      </p>
                      {method.processing_fee && method.processing_fee > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Processing fee: ETB {method.processing_fee.toFixed(2)}
                        </p>
                      )}
                    </div>
                    {!method.is_available && (
                      <span className="text-xs text-destructive">Unavailable</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}

