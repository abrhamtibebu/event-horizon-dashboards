import React from 'react';
import { Check, Crown, Star, Ticket } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuantitySelector } from './QuantitySelector';
import { AvailabilityIndicator } from './AvailabilityIndicator';
import type { PublicTicketType } from '@/types/publicTickets';

interface TicketTierCardProps {
  ticketType: PublicTicketType;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
}

export const TicketTierCard: React.FC<TicketTierCardProps> = ({
  ticketType,
  quantity,
  onQuantityChange,
  disabled = false,
}) => {
  const isSoldOut = ticketType.availability_status === 'sold_out' || ticketType.available_for_sale <= 0;
  const isDisabled = disabled || isSoldOut;

  // Determine card styling based on tier
  const getCardStyles = () => {
    if (ticketType.is_featured) {
      return 'border-2 border-blue-500 shadow-lg relative overflow-hidden';
    }
    return 'border border-gray-200 hover:shadow-md transition-shadow';
  };

  // Get icon based on ticket type
  const getIcon = () => {
    if (ticketType.name.toLowerCase().includes('vip')) {
      return <Crown className="w-6 h-6 text-yellow-500" />;
    }
    if (ticketType.is_featured) {
      return <Star className="w-6 h-6 text-blue-500" />;
    }
    return <Ticket className="w-6 h-6 text-gray-500" />;
  };

  return (
    <Card className={`${getCardStyles()} ${isDisabled ? 'opacity-60' : ''}`}>
      {/* Featured Badge */}
      {ticketType.is_featured && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
          Most Popular
        </div>
      )}

      {/* Sold Out Overlay */}
      {isSoldOut && (
        <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-lg">
          <Badge variant="destructive" className="text-lg px-6 py-2">
            Sold Out
          </Badge>
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <CardTitle className="text-xl">{ticketType.name}</CardTitle>
              {ticketType.description && (
                <CardDescription className="mt-1">
                  {ticketType.description}
                </CardDescription>
              )}
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="mt-4">
          <div className="text-3xl font-bold text-gray-900">
            {Number(ticketType.price).toFixed(2)} <span className="text-lg text-gray-600">ETB</span>
          </div>
          <div className="text-sm text-gray-500">per ticket</div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Benefits */}
        {ticketType.benefits && ticketType.benefits.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-700">Includes:</div>
            <ul className="space-y-1">
              {ticketType.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Availability */}
        <AvailabilityIndicator
          remaining={ticketType.available_for_sale}
          total={ticketType.quantity}
          availabilityStatus={ticketType.availability_status}
          showProgressBar={true}
          size="sm"
        />

        {/* Quantity Selector */}
        {!isSoldOut && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">Quantity:</div>
              <QuantitySelector
                value={quantity}
                onChange={onQuantityChange}
                min={0}
                max={Math.min(10, ticketType.available_for_sale)}
                disabled={isDisabled}
                size="md"
              />
            </div>

            {quantity > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-900">Subtotal:</span>
                  <span className="text-lg font-bold text-blue-900">
                    {(Number(ticketType.price) * quantity).toFixed(2)} ETB
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TicketTierCard;







