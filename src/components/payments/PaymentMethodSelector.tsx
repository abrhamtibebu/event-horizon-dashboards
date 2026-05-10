import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Phone } from 'lucide-react';
import type { PaymentMethod } from '@/types/tickets';
import { getPaymentMethods } from '@/lib/api/payments';

interface PaymentMethodSelectorProps {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  onPhoneNumberChange?: (phoneNumber: string) => void;
  className?: string;
}

export function PaymentMethodSelector({
  selected,
  onSelect,
  onPhoneNumberChange,
  className,
}: PaymentMethodSelectorProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const paymentMethods = getPaymentMethods();

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value);
    onPhoneNumberChange?.(value);
  };

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
                    <img 
                      src={method.icon} 
                      alt={method.name}
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        // Fallback to emoji if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'block';
                      }}
                    />
                    <span className="text-3xl" style={{ display: 'none' }}>
                      {method.id === 'telebirr' ? '📱' : 
                       method.id === 'cbe_birr' ? '🏦' : 
                       method.id === 'chapa' ? '💳' : 
                       method.id === 'm_pesa' ? '�' : '🏛️'}
                    </span>
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
      
      {/* Phone Number Input - Show when payment method is selected */}
      {selected && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center space-x-2 mb-2">
            <Phone className="w-4 h-4 text-gray-600" />
            <Label htmlFor="payment-phone" className="text-sm font-medium text-gray-700">
              Payment Phone Number
            </Label>
          </div>
          <Input
            id="payment-phone"
            type="tel"
            placeholder="Enter phone number for payment"
            value={phoneNumber}
            onChange={(e) => handlePhoneNumberChange(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the phone number associated with your {paymentMethods.find(m => m.id === selected)?.name} account
          </p>
        </div>
      )}
    </div>
  );
}

