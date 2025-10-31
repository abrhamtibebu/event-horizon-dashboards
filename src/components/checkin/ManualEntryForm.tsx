import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2, Keyboard } from 'lucide-react';

interface ManualEntryFormProps {
  onSubmit: (ticketNumber: string) => void;
  isLoading?: boolean;
}

export function ManualEntryForm({ onSubmit, isLoading }: ManualEntryFormProps) {
  const [ticketNumber, setTicketNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketNumber.trim()) {
      onSubmit(ticketNumber.trim());
      setTicketNumber('');
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ticket-number">Ticket Number</Label>
          <Input
            id="ticket-number"
            type="text"
            placeholder="Enter ticket number (e.g., TIX-ABC12345)"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
            disabled={isLoading}
            autoComplete="off"
            autoFocus
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Enter the ticket number exactly as it appears on the ticket
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!ticketNumber.trim() || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <Keyboard className="w-4 h-4 mr-2" />
              Validate Ticket
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}

