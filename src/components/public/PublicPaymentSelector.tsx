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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={loading}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-yellow-600" />
            <h3 className="text-xl font-bold text-gray-900">Select Payment Method</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Choose how you'd like to pay for your tickets
          </p>
        </div>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            onClick={() => !loading && onSelect(method.id)}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all ${
              selected === method.id
                ? 'border-yellow-500 ring-2 ring-yellow-500 ring-opacity-50'
                : 'border-gray-200 hover:border-yellow-300'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">{method.icon}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg text-gray-900">
                  {method.name}
                </h4>
                <p className="text-sm text-gray-600">{method.description}</p>
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
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-600">
              ETB {totalAmount.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">Total amount</div>
          </div>
        </div>

        <Button
          onClick={onConfirm}
          disabled={!selected || loading}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 text-lg"
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

