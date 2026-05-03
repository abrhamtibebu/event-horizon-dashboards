import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, ArrowLeft, Loader2 } from 'lucide-react';
import type { PaymentMethod } from '@/types/tickets';

interface PublicPaymentSelectorProps {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  onBack: () => void;
  onConfirm: () => void;
  totalAmount: number;
  loading?: boolean;
}

const paymentMethods: Array<{
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string;
}> = [
  {
    id: 'telebirr',
    name: 'Telebirr',
    description: 'Pay with Telebirr mobile wallet',
    icon: '📱',
  },
  {
    id: 'cbe_birr',
    name: 'CBE Birr',
    description: 'Commercial Bank of Ethiopia mobile banking',
    icon: '🏦',
  },
  {
    id: 'dashen_superapp',
    name: 'Dashen SuperApp',
    description: 'Pay with Dashen Bank SuperApp',
    icon: '💳',
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    description: 'Direct bank transfer',
    icon: '🏛️',
  },
];

export function PublicPaymentSelector({
  selected,
  onSelect,
  onBack,
  onConfirm,
  totalAmount,
  loading = false,
}: PublicPaymentSelectorProps) {
  return (
    <div className="min-w-0 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={onBack}
          disabled={loading}
          className="min-h-11 min-w-11 shrink-0 p-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <CreditCard className="w-5 h-5 shrink-0 text-yellow-600" />
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words">Select Payment Method</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Choose how you'd like to pay for your tickets
          </p>
        </div>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            role="button"
            tabIndex={0}
            onClick={() => !loading && onSelect(method.id)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !loading) {
                e.preventDefault();
                onSelect(method.id);
              }
            }}
            className={`bg-white rounded-xl shadow-sm border-2 p-4 sm:p-6 cursor-pointer transition-all min-h-[3.5rem] touch-manipulation max-w-full min-w-0 ${
              selected === method.id
                ? 'border-yellow-500 ring-2 ring-yellow-500 ring-opacity-50'
                : 'border-gray-200 hover:border-yellow-300'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="text-3xl sm:text-4xl shrink-0" aria-hidden>{method.icon}</div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-base sm:text-lg text-gray-900 break-words">
                  {method.name}
                </h4>
                <p className="text-sm text-gray-600 break-words">{method.description}</p>
              </div>
              {selected === method.id && (
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Payment Summary */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Payment Summary</h3>
            <p className="text-sm text-gray-600">
              {selected ? `Paying with ${paymentMethods.find(m => m.id === selected)?.name}` : 'Select a payment method'}
            </p>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">
              ETB {totalAmount.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">Total amount</div>
          </div>
        </div>

        <Button
          type="button"
          onClick={onConfirm}
          disabled={!selected || loading}
          className="w-full min-h-12 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 text-base sm:text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            'Confirm & Pay'
          )}
        </Button>

        <p className="text-xs text-center text-gray-500 mt-3">
          By confirming, you agree to our terms and conditions. Payment is secure and encrypted.
        </p>
      </div>
    </div>
  );
}

