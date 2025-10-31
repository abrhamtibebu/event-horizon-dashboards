import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2, AlertCircle, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TicketTierCard } from './TicketTierCard';
import { usePublicEventTickets } from '@/lib/api/publicTickets';
import type { TicketSelection, PublicTicketType } from '@/types/publicTickets';

interface TicketSelectionStepProps {
  eventUuid: string;
  onContinue: (selections: TicketSelection[]) => void;
  initialSelections?: TicketSelection[];
}

export const TicketSelectionStep: React.FC<TicketSelectionStepProps> = ({
  eventUuid,
  onContinue,
  initialSelections = [],
}) => {
  // Fetch ticket types
  const { data, isLoading, error, refetch } = usePublicEventTickets(eventUuid);

  // Track selected quantities
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  // Initialize quantities from initial selections
  useEffect(() => {
    if (initialSelections.length > 0) {
      const initialQuantities: Record<number, number> = {};
      initialSelections.forEach((selection) => {
        initialQuantities[selection.ticket_type_id] = selection.quantity;
      });
      setQuantities(initialQuantities);
    }
  }, [initialSelections]);

  // Handle quantity change for a ticket type
  const handleQuantityChange = (ticketTypeId: number, newQuantity: number) => {
    setQuantities((prev) => ({
      ...prev,
      [ticketTypeId]: newQuantity,
    }));
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!data?.ticket_types) return { totalTickets: 0, totalAmount: 0 };

    let totalTickets = 0;
    let totalAmount = 0;

    data.ticket_types.forEach((ticketType) => {
      const quantity = quantities[ticketType.id] || 0;
      totalTickets += quantity;
      totalAmount += quantity * Number(ticketType.price);
    });

    return { totalTickets, totalAmount };
  };

  const { totalTickets, totalAmount } = calculateTotals();

  // Build selections array
  const buildSelections = (): TicketSelection[] => {
    if (!data?.ticket_types) return [];

    return data.ticket_types
      .filter((ticketType) => (quantities[ticketType.id] || 0) > 0)
      .map((ticketType) => ({
        ticket_type_id: ticketType.id,
        quantity: quantities[ticketType.id],
        ticketType: ticketType,
      }));
  };

  // Handle continue button click
  const handleContinue = () => {
    const selections = buildSelections();
    if (selections.length > 0) {
      onContinue(selections);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-600">Loading available tickets...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load tickets. Please try again.
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="ml-4"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No tickets available
  if (!data?.ticket_types || data.ticket_types.length === 0) {
    return (
      <div className="py-12">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tickets are currently available for this event.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const allSoldOut = data.ticket_types.every(
    (tt) => tt.availability_status === 'sold_out' || tt.available_for_sale <= 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Select Your Tickets
        </h2>
        <p className="text-gray-600">
          Choose the ticket type and quantity that works best for you
        </p>
      </div>

      {/* All sold out message */}
      {allSoldOut && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            All tickets for this event are currently sold out.
          </AlertDescription>
        </Alert>
      )}

      {/* Ticket Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.ticket_types.map((ticketType) => (
          <TicketTierCard
            key={ticketType.id}
            ticketType={ticketType}
            quantity={quantities[ticketType.id] || 0}
            onQuantityChange={(newQuantity) =>
              handleQuantityChange(ticketType.id, newQuantity)
            }
          />
        ))}
      </div>

      {/* Summary Card */}
      {totalTickets > 0 && (
        <Card className="sticky bottom-4 border-2 border-blue-500 shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Summary */}
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">
                    {totalTickets} {totalTickets === 1 ? 'Ticket' : 'Tickets'} Selected
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {totalAmount.toFixed(2)} ETB
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <Button
                size="lg"
                onClick={handleContinue}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                Continue to Registration
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            {/* Selected Tickets Breakdown */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Your Selection:
              </div>
              <div className="space-y-1">
                {buildSelections().map((selection) => (
                  <div
                    key={selection.ticket_type_id}
                    className="flex justify-between text-sm text-gray-600"
                  >
                    <span>
                      {selection.quantity}x {selection.ticketType.name}
                    </span>
                    <span className="font-medium">
                      {(selection.quantity * Number(selection.ticketType.price)).toFixed(2)} ETB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No selection message */}
      {totalTickets === 0 && !allSoldOut && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            Select at least one ticket to continue
          </p>
        </div>
      )}
    </div>
  );
};

export default TicketSelectionStep;







