import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ticket, Plus, Minus, Users, CheckCircle, AlertCircle } from 'lucide-react';
import type { PublicTicketType } from '@/types/publicTickets';

interface TicketSelectionItem {
  ticket_type_id: number;
  quantity: number;
  ticketType: PublicTicketType;
}

interface PublicTicketSelectorProps {
  ticketTypes: PublicTicketType[];
  selections: TicketSelectionItem[];
  onSelectionsChange: (selections: TicketSelectionItem[]) => void;
  guestInfo: {
    name: string;
    email: string;
    phone: string;
  };
  onGuestInfoChange: (info: { name: string; email: string; phone: string }) => void;
  onContinue: () => void;
  loading?: boolean;
}

export function PublicTicketSelector({
  ticketTypes,
  selections,
  onSelectionsChange,
  guestInfo,
  onGuestInfoChange,
  onContinue,
  loading = false,
}: PublicTicketSelectorProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getQuantity = (ticketTypeId: number) => {
    const selection = selections.find((s) => s.ticket_type_id === ticketTypeId);
    return selection?.quantity || 0;
  };

  const handleQuantityChange = (ticketType: PublicTicketType, newQuantity: number) => {
    const maxAvailable = ticketType.available_for_sale;
    const validQuantity = Math.max(0, Math.min(newQuantity, maxAvailable));

    const existingIndex = selections.findIndex((s) => s.ticket_type_id === ticketType.id);

    if (validQuantity === 0) {
      // Remove if quantity is 0
      if (existingIndex !== -1) {
        onSelectionsChange(selections.filter((s) => s.ticket_type_id !== ticketType.id));
      }
    } else {
      // Update or add selection
      if (existingIndex !== -1) {
        const updated = [...selections];
        updated[existingIndex] = {
          ticket_type_id: ticketType.id,
          quantity: validQuantity,
          ticketType,
        };
        onSelectionsChange(updated);
      } else {
        onSelectionsChange([
          ...selections,
          {
            ticket_type_id: ticketType.id,
            quantity: validQuantity,
            ticketType,
          },
        ]);
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!guestInfo.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!guestInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!guestInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const cleanPhone = guestInfo.phone.replace(/[\s\-\(\)]/g, '');
      const ethiopianPhoneRegex = /^(0[97]\d{8}|\+251[97]\d{8}|[97]\d{8})$/;
      if (!ethiopianPhoneRegex.test(cleanPhone)) {
        newErrors.phone = 'Please enter a valid Ethiopian phone number';
      }
    }

    if (selections.length === 0) {
      newErrors.tickets = 'Please select at least one ticket';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      onContinue();
    }
  };

  const totalAmount = selections.reduce(
    (sum, sel) => sum + sel.ticketType.price * sel.quantity,
    0
  );
  const totalQuantity = selections.reduce((sum, sel) => sum + sel.quantity, 0);

  const getAvailabilityBadge = (ticketType: PublicTicketType) => {
    switch (ticketType.availability_status) {
      case 'sold_out':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Sold Out
          </span>
        );
      case 'selling_fast':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Selling Fast
          </span>
        );
      case 'limited':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Limited
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Ticket Types */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Ticket className="w-5 h-5 text-yellow-600" />
          <h3 className="text-xl font-bold text-gray-900">Select Tickets</h3>
        </div>

        {ticketTypes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Ticket className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No tickets available for this event</p>
          </div>
        ) : (
          ticketTypes.map((ticketType) => {
            const quantity = getQuantity(ticketType.id);
            const isSoldOut = ticketType.availability_status === 'sold_out';

            return (
              <div
                key={ticketType.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all ${
                  quantity > 0 ? 'ring-2 ring-yellow-500 border-yellow-500' : ''
                } ${isSoldOut ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-lg text-gray-900">
                        {ticketType.name}
                      </h4>
                      {getAvailabilityBadge(ticketType)}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {ticketType.description}
                    </p>
                    
                    {ticketType.benefits && ticketType.benefits.length > 0 && (
                      <ul className="space-y-1 mb-3">
                        {ticketType.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {ticketType.available_for_sale} available
                      </span>
                      {ticketType.percent_remaining < 50 && ticketType.percent_remaining > 0 && (
                        <span className="text-orange-600 font-medium">
                          Only {ticketType.percent_remaining}% left!
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 md:min-w-[200px]">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-600">
                        ETB {Number(ticketType.price).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">per ticket</div>
                    </div>

                    {!isSoldOut && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(ticketType, quantity - 1)}
                          disabled={quantity === 0 || loading}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          max={ticketType.available_for_sale}
                          value={quantity}
                          onChange={(e) =>
                            handleQuantityChange(ticketType, parseInt(e.target.value) || 0)
                          }
                          disabled={loading}
                          className="w-16 text-center"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(ticketType, quantity + 1)}
                          disabled={quantity >= ticketType.available_for_sale || loading}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {quantity > 0 && (
                      <div className="text-sm font-medium text-gray-700">
                        Subtotal: ETB {(ticketType.price * quantity).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {errors.tickets && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            {errors.tickets}
          </div>
        )}
      </div>

      {/* Guest Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Your Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Full Name*
            </Label>
            <Input
              id="name"
              value={guestInfo.name}
              onChange={(e) => onGuestInfoChange({ ...guestInfo, name: e.target.value })}
              disabled={loading}
              placeholder="Enter your full name"
              className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address*
            </Label>
            <Input
              id="email"
              type="email"
              value={guestInfo.email}
              onChange={(e) => onGuestInfoChange({ ...guestInfo, email: e.target.value })}
              disabled={loading}
              placeholder="your.email@example.com"
              className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Phone Number*
            </Label>
            <Input
              id="phone"
              value={guestInfo.phone}
              onChange={(e) => onGuestInfoChange({ ...guestInfo, phone: e.target.value })}
              disabled={loading}
              placeholder="+251912345678"
              className={`mt-1 ${errors.phone ? 'border-red-500' : ''}`}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Order Summary & Continue */}
      {selections.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Order Summary</h3>
              <p className="text-sm text-gray-600">
                {totalQuantity} {totalQuantity === 1 ? 'ticket' : 'tickets'} selected
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
            onClick={handleContinue}
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 text-lg"
          >
            Continue to Payment
          </Button>
        </div>
      )}
    </div>
  );
}

