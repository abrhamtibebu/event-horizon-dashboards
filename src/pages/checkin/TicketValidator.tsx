import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QRScanner } from '@/components/checkin/QRScanner';
import { ManualEntryForm } from '@/components/checkin/ManualEntryForm';
import { ValidationResultCard } from '@/components/checkin/ValidationResultCard';
import { validateTicket, getEventValidationStats } from '@/lib/api/tickets';
import { ScanLine, Keyboard, BarChart3, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { ValidationResult } from '@/types/tickets';
import api from '@/lib/api';

interface ValidationHistory extends ValidationResult {
  timestamp: Date;
  ticket_number?: string;
}

export default function TicketValidator() {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [validationHistory, setValidationHistory] = useState<ValidationHistory[]>([]);
  const [currentResult, setCurrentResult] = useState<ValidationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'scanner' | 'manual'>('scanner');

  // Fetch events for dropdown
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await api.get('/events');
      return response.data;
    },
  });

  // Fetch validation stats for selected event
  const { data: stats } = useQuery({
    queryKey: ['validation-stats', selectedEventId],
    queryFn: () => selectedEventId ? getEventValidationStats(selectedEventId) : null,
    enabled: !!selectedEventId,
  });

  // Validation mutation
  const validateMutation = useMutation({
    mutationFn: validateTicket,
    onSuccess: (result) => {
      setCurrentResult(result);
      
      // Add to history
      setValidationHistory((prev) => [
        {
          ...result,
          timestamp: new Date(),
          ticket_number: result.ticket?.ticket_number,
        },
        ...prev.slice(0, 9), // Keep last 10 validations
      ]);

      // Show toast based on result
      if (result.validation_status === 'valid') {
        toast.success('Ticket validated successfully', {
          description: 'Access granted',
        });
        // Play success sound
        playSound('success');
      } else {
        toast.error('Validation failed', {
          description: result.message,
        });
        // Play error sound
        playSound('error');
      }
    },
    onError: (error: any) => {
      toast.error('Validation error', {
        description: error.response?.data?.message || 'Failed to validate ticket',
      });
      playSound('error');
    },
  });

  const handleScan = (ticketIdentifier: string) => {
    if (!selectedEventId) {
      toast.error('Please select an event first');
      return;
    }

    validateMutation.mutate({
      ticket_identifier: ticketIdentifier,
      event_id: selectedEventId,
    });
  };

  const playSound = (type: 'success' | 'error') => {
    // TODO: Implement sound playback
    console.log(`Playing ${type} sound`);
  };

  const validCount = validationHistory.filter((h) => h.validation_status === 'valid').length;
  const invalidCount = validationHistory.length - validCount;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Ticket Validator</h1>
        <p className="text-muted-foreground mt-1">
          Scan or manually validate event tickets
        </p>
      </div>

      {/* Event Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Event</CardTitle>
          <CardDescription>Choose the event to validate tickets for</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedEventId?.toString() || ''}
            onValueChange={(value) => setSelectedEventId(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events?.data?.map((event: any) => (
                <SelectItem key={event.id} value={event.id.toString()}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                Validated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.validated_tickets}</div>
              <p className="text-xs text-muted-foreground">
                {stats.validation_rate.toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="w-4 h-4 mr-2 text-blue-600" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.confirmed_tickets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Total Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_tickets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Session Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-green-600">✓ {validCount}</div>
                  <div className="text-xs text-muted-foreground">Valid</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-destructive">✗ {invalidCount}</div>
                  <div className="text-xs text-muted-foreground">Invalid</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Validation Interface */}
      {selectedEventId ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner/Manual Entry */}
          <Card>
            <CardHeader>
              <CardTitle>Validate Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="scanner">
                    <ScanLine className="w-4 h-4 mr-2" />
                    QR Scanner
                  </TabsTrigger>
                  <TabsTrigger value="manual">
                    <Keyboard className="w-4 h-4 mr-2" />
                    Manual Entry
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="scanner" className="space-y-4">
                  <QRScanner
                    onScan={handleScan}
                    isEnabled={!validateMutation.isPending}
                  />
                </TabsContent>

                <TabsContent value="manual" className="space-y-4">
                  <ManualEntryForm
                    onSubmit={handleScan}
                    isLoading={validateMutation.isPending}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Validation Result */}
          <Card>
            <CardHeader>
              <CardTitle>Validation Result</CardTitle>
            </CardHeader>
            <CardContent>
              {currentResult ? (
                <ValidationResultCard result={currentResult} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ScanLine className="w-12 h-12 mb-4" />
                  <p>Scan or enter a ticket number to validate</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold">No Event Selected</p>
            <p className="text-sm text-muted-foreground">Please select an event to start validating tickets</p>
          </CardContent>
        </Card>
      )}

      {/* Validation History */}
      {validationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Validations</CardTitle>
            <CardDescription>Last 10 validation attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validationHistory.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-medium">
                        {item.ticket_number || 'Unknown ticket'}
                      </p>
                      <p className="text-sm text-muted-foreground">{item.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {item.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

