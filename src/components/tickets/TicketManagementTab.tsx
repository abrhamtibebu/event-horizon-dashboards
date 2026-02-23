import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { TicketFormModal } from '@/pages/tickets/components/TicketFormModal';
import { TicketActionsMenu } from '@/pages/tickets/components/TicketActionsMenu';
import { getTicketSales } from '@/lib/api/tickets';
import { Plus, Search, DollarSign, Ticket, TrendingUp, AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import api from '@/lib/api';
import type { TicketType } from '@/types';

interface TicketManagementTabProps {
    eventId: number;
}

export function TicketManagementTab({ eventId }: TicketManagementTabProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTicketType, setEditingTicketType] = useState<TicketType | null>(null);

    const queryClient = useQueryClient();

    // Fetch ticket types for selected event
    const { data: ticketTypes, isLoading: ticketTypesLoading } = useQuery({
        queryKey: ['ticket-types', eventId],
        queryFn: async () => {
            if (!eventId) return [];
            const response = await api.get(`/events/${eventId}/ticket-types`);
            return response.data;
        },
        enabled: !!eventId,
    });

    // Fetch sales data
    const { data: salesData } = useQuery({
        queryKey: ['ticket-sales', eventId],
        queryFn: () => eventId ? getTicketSales(eventId) : null,
        enabled: !!eventId,
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
        queryClient.invalidateQueries({ queryKey: ['ticket-types', eventId] });
        queryClient.invalidateQueries({ queryKey: ['ticket-sales', eventId] });
        handleModalClose();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-foreground">Ticket Types</h3>
                    <p className="text-muted-foreground mt-1">
                        Create and manage ticket types for your event
                    </p>
                </div>
                <Button onClick={handleCreateTicket} className="bg-primary text-primary-foreground">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Ticket Type
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-sm border border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                            <DollarSign className="w-4 h-4 mr-2 text-success" />
                            Total Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ETB {stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                            <Ticket className="w-4 h-4 mr-2 text-info" />
                            Tickets Sold
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSold}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2 text-primary" />
                            Active Ticket Types
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeTypes}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card className="shadow-sm border border-border">
                <CardHeader>
                    <CardTitle>Ticket Types List</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search ticket types..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 border-border bg-background"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40 border-border bg-background">
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
                            <Spinner size="md" variant="primary" text="Loading ticket types..." />
                        </div>
                    ) : filteredTicketTypes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                            <p className="text-lg font-semibold">No ticket types found</p>
                            <p className="text-sm text-muted-foreground">
                                {ticketTypes?.length === 0
                                    ? 'Create your first ticket type to get started'
                                    : 'Try adjusting your filters'}
                            </p>
                        </div>
                    ) : (
                        <div className="border border-border rounded-lg min-w-0 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableHead className="font-semibold text-foreground">Name</TableHead>
                                        <TableHead className="font-semibold text-foreground">Price</TableHead>
                                        <TableHead className="font-semibold text-foreground">Available</TableHead>
                                        <TableHead className="font-semibold text-foreground">Sold</TableHead>
                                        <TableHead className="font-semibold text-foreground">Revenue</TableHead>
                                        <TableHead className="font-semibold text-foreground">Status</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTicketTypes.map((ticketType: TicketType) => {
                                        const salesInfo = salesData?.data?.find(
                                            (s: any) => s.ticket_type_id === ticketType.id
                                        );

                                        return (
                                            <TableRow key={ticketType.id} className="hover:bg-muted/50 border-border">
                                                <TableCell className="font-medium">
                                                    {ticketType.name}
                                                    {ticketType.description && (
                                                        <p className="text-xs text-muted-foreground max-w-sm truncate">
                                                            {ticketType.description}
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-foreground font-medium">ETB {Number(ticketType.price).toFixed(2)}</TableCell>
                                                <TableCell>
                                                    {ticketType.quantity ? (
                                                        <>
                                                            <span className="font-medium text-foreground">{ticketType.quantity - ticketType.sold_count}</span>
                                                            <span className="text-muted-foreground"> / {ticketType.quantity}</span>
                                                            {ticketType.sold_count >= ticketType.quantity && (
                                                                <span className="ml-2 text-xs text-destructive font-semibold">
                                                                    SOLD OUT
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-muted-foreground italic">Unlimited</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">{ticketType.sold_count}</TableCell>
                                                <TableCell className="text-success font-semibold">
                                                    ETB {salesInfo?.revenue?.toFixed(2) || '0.00'}
                                                </TableCell>
                                                <TableCell>
                                                    {ticketType.is_active ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-success/15 text-success border border-success/30">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-muted text-muted-foreground border border-border">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <TicketActionsMenu
                                                        ticketType={ticketType}
                                                        onEdit={() => handleEditTicket(ticketType)}
                                                        eventId={eventId}
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

            {/* Create/Edit Modal */}
            <TicketFormModal
                open={showCreateModal}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
                eventId={eventId}
                ticketType={editingTicketType}
            />
        </div>
    );
}
