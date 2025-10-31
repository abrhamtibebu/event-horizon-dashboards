import React from 'react';
import { Edit2, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { TicketSelection, PublicEvent } from '@/types/publicTickets';

interface OrderSummaryProps {
  event: PublicEvent;
  selections: TicketSelection[];
  onEdit?: () => void;
  serviceFeePercentage?: number;
  showEditButton?: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  event,
  selections,
  onEdit,
  serviceFeePercentage = 5,
  showEditButton = true,
}) => {
  // Calculate totals
  const subtotal = selections.reduce(
    (sum, selection) => sum + Number(selection.ticketType.price) * selection.quantity,
    0
  );

  const serviceFee = (subtotal * serviceFeePercentage) / 100;
  const total = subtotal + serviceFee;

  const totalTickets = selections.reduce((sum, selection) => sum + selection.quantity, 0);

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">Order Summary</CardTitle>
          {showEditButton && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Event Info */}
        <div className="pb-4 border-b">
          <div className="text-sm font-semibold text-gray-900 mb-1">
            {event.name}
          </div>
          <div className="text-xs text-gray-600">
            {new Date(event.start_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          {event.location && (
            <div className="text-xs text-gray-600 mt-1">
              {event.location}
            </div>
          )}
        </div>

        {/* Tickets List */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-700">
            Tickets ({totalTickets})
          </div>
          {selections.map((selection) => (
            <div key={selection.ticket_type_id} className="space-y-1">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {selection.ticketType.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {selection.quantity} × {Number(selection.ticketType.price).toFixed(2)} ETB
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {(Number(selection.ticketType.price) * selection.quantity).toFixed(2)} ETB
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">
              {subtotal.toFixed(2)} ETB
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Service Fee ({serviceFeePercentage}%)</span>
            <span className="font-medium text-gray-900">
              {serviceFee.toFixed(2)} ETB
            </span>
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-base font-bold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-gray-900">
            {total.toFixed(2)} ETB
          </span>
        </div>

        {/* Secure Checkout Badge */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
            <Shield className="w-4 h-4 text-green-600" />
            <span>Secure Checkout</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderSummary;







