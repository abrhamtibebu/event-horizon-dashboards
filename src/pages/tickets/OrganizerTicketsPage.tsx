import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TicketFormModal } from './components/TicketFormModal';
import { TicketActionsMenu } from './components/TicketActionsMenu';
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge';
import { getEventTickets, getTicketSales } from '@/lib/api/tickets';
import { Loader2, Plus, Search, DollarSign, Ticket, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { TicketType } from '@/types';

export default function OrganizerTicketsPage() {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTicketType, setEditingTicketType] = useState<TicketType | null>(null);

  const queryClient = useQueryClient();

  // Fetch organizer's ticketed events only
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['organizer-ticketed-events'],
    queryFn: async () => {
      const response = await api.get('/events', {
        params: {
          event_type: 'ticketed',
          status: 'active', // Only show active events
        }
      });
      return response.data;
    },
  });

  // Fetch ticket types for selected event
  const { data: ticketTypes, isLoading: ticketTypesLoading } = useQuery({
    queryKey: ['ticket-types', selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return [];
      const response = await api.get(`/events/${selectedEventId}/ticket-types`);
      return response.data;
    },
    enabled: !!selectedEventId,
  });

  // Fetch sales data
  const { data: salesData } = useQuery({
    queryKey: ['ticket-sales', selectedEventId],
    queryFn: () => selectedEventId ? getTicketSales(selectedEventId) : null,
    enabled: !!selectedEventId,
  });

  // Calculate stats
  const stats = {
    totalRevenue: salesData?.data?.reduce((sum: number, item: any) => sum + item.revenue, 0) || 0,
    totalSold: salesData?.data?.reduce((sum: number, item: any) => sum + item.total_sold, 0) || 0,
    activeTypes: ticketTypes?.filter((t: TicketType) => t.is_active).length || 0,
  };

  // Filter ticket types
  const filteredTicketTypes = ticketTypes?.filter((ticketType: TicketType) => {
    const matchesSearch = ticketType.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && ticketType.is_active) ||
      (statusFilter === 'inactive' && !ticketType.is_active) ||
      (statusFilter === 'sold_out' && ticketType.sold_count >= (ticketType.quantity || Infinity));
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleCreateTicket = () => {
    if (!selectedEventId) {
      toast.error('Please select an event first');
      return;
    }
    setEditingTicketType(null);
    setShowCreateModal(true);
  };

  const handleEditTicket = (ticketType: TicketType) => {
    setEditingTicketType(ticketType);
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingTicketType(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['ticket-types', selectedEventId] });
    queryClient.invalidateQueries({ queryKey: ['ticket-sales', selectedEventId] });
    handleModalClose();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ticket Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage ticket types for your events
          </p>
        </div>
        <Button onClick={handleCreateTicket} disabled={!selectedEventId}>
          <Plus className="w-4 h-4 mr-2" />
          Create Ticket Type
        </Button>
      </div>

      {/* Event Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Event</CardTitle>
          <CardDescription>
            Choose an event to manage its tickets (showing active ticketed events only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (() => {
              // Handle both array and paginated response structures
              const eventsList = Array.isArray(events) ? events : events?.data || [];
              
              // Filter for ticketed events using the event_type_column field (the actual DB column value)
              const filteredEvents = eventsList.filter((e: any) => {
                const eventType = e.event_type_column || e.event_type;
                // Handle both cases: string value or object (relationship)
                const eventTypeValue = typeof eventType === 'string' ? eventType : 'free';
                return eventTypeValue === 'ticketed' && e.status === 'active';
              });
              
              return filteredEvents.length > 0 ? (
                <Select
                  value={selectedEventId?.toString() || ''}
                  onValueChange={(value) => setSelectedEventId(Number(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEvents.map((event: any) => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {event.name} {event.event_type && `(${event.event_type})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
            <div className="text-center py-8">
              <Ticket className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Ticketed Events Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You don't have any active ticketed events yet. Create a ticketed event first to manage tickets.
              </p>
              <Button 
                onClick={() => window.location.href = '/dashboard/events/create-ticketed'}
                variant="outline"
              >
                Create Ticketed Event
              </Button>
            </div>
              );
            })()}
        </CardContent>
      </Card>

      {selectedEventId ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ETB {stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Ticket className="w-4 h-4 mr-2 text-blue-600" />
                  Tickets Sold
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSold}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
                  Active Ticket Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeTypes}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search ticket types..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="sold_out">Sold Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ticket Types Table */}
              {ticketTypesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredTicketTypes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold">No ticket types found</p>
                  <p className="text-sm text-muted-foreground">
                    {ticketTypes?.length === 0
                      ? 'Create your first ticket type to get started'
                      : 'Try adjusting your filters'}
                  </p>
                  {ticketTypes?.length === 0 && (
                    <Button onClick={handleCreateTicket} className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Ticket Type
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Sold</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTicketTypes.map((ticketType: TicketType) => {
                        const salesInfo = salesData?.data?.find(
                          (s: any) => s.ticket_type_id === ticketType.id
                        );
                        
                        return (
                          <TableRow key={ticketType.id}>
                            <TableCell className="font-medium">
                              {ticketType.name}
                              {ticketType.description && (
                                <p className="text-xs text-muted-foreground">
                                  {ticketType.description}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>ETB {Number(ticketType.price).toFixed(2)}</TableCell>
                            <TableCell>
                              {ticketType.quantity ? (
                                <>
                                  {ticketType.quantity - ticketType.sold_count} / {ticketType.quantity}
                                  {ticketType.sold_count >= ticketType.quantity && (
                                    <span className="ml-2 text-xs text-red-600 font-semibold">
                                      SOLD OUT
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-muted-foreground">Unlimited</span>
                              )}
                            </TableCell>
                            <TableCell>{ticketType.sold_count}</TableCell>
                            <TableCell>
                              ETB {salesInfo?.revenue?.toFixed(2) || '0.00'}
                            </TableCell>
                            <TableCell>
                              {ticketType.is_active ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Inactive
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <TicketActionsMenu
                                ticketType={ticketType}
                                onEdit={() => handleEditTicket(ticketType)}
                                eventId={selectedEventId}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold">No Event Selected</p>
            <p className="text-sm text-muted-foreground">
              Select an event above to manage its ticket types
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <TicketFormModal
        open={showCreateModal}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        eventId={selectedEventId}
        ticketType={editingTicketType}
      />
    </div>
  );
}

