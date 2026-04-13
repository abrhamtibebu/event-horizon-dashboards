import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
import { getTicketSales, getOrganizerSalesSummary } from '@/lib/api/tickets';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Plus, Search, DollarSign, Ticket, TrendingUp, AlertCircle, Edit, Sparkles, Trash2, Download, Users } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { DashboardCard } from '@/components/DashboardCard';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import type { TicketType } from '@/types';

export default function OrganizerTicketsPage() {
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTicketType, setEditingTicketType] = useState<TicketType | null>(null);
  const [activeTab, setActiveTab] = useState('active-tickets');

  const queryClient = useQueryClient();

  // Fetch organizer's ticketed events (all statuses including draft)
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['organizer-ticketed-events'],
    queryFn: async () => {
      const response = await api.get('/events', {
        params: {
          event_type: 'ticketed',
        }
      });
      return response.data;
    },
  });

  const eventsList = useMemo(() => {
    return Array.isArray(events) ? events : events?.data || [];
  }, [events]);

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

  // Fetch sales summary for the overview
  const { data: salesSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['organizer-sales-summary'],
    queryFn: getOrganizerSalesSummary,
  });

  const { data: salesData } = useQuery({
    queryKey: ['ticket-sales', selectedEventId],
    queryFn: () => selectedEventId ? getTicketSales(selectedEventId) : null,
    enabled: !!selectedEventId,
  });

  // Presets State (Local Storage for now)
  const [presets, setPresets] = useState<any[]>(() => {
    const saved = localStorage.getItem('ticket-presets');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Early Bird', price: 500, quantity: 100, description: 'Limited early access tickets' },
      { id: '2', name: 'Standard', price: 1000, quantity: 500, description: 'General admission tickets' },
      { id: '3', name: 'VIP', price: 2500, quantity: 50, description: 'All-inclusive premium experience' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('ticket-presets', JSON.stringify(presets));
  }, [presets]);

  const handleSavePreset = (ticketType: any) => {
    const newPreset = {
      id: Math.random().toString(36).substr(2, 9),
      name: ticketType.name,
      price: ticketType.price,
      quantity: ticketType.quantity,
      description: ticketType.description
    };
    setPresets([...presets, newPreset]);
    toast.success('Ticket preset saved successfully');
  };

  const handleApplyPreset = (preset: any) => {
    if (!selectedEventId) {
      toast.error('Please select an event first');
      return;
    }
    setEditingTicketType({
      ...preset,
      is_active: true,
      sold_count: 0
    });
    setShowCreateModal(true);
  };

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
    <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Ticketing Hub</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Strategize, manage, and scale your event revenue streams.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden md:flex">
            <TrendingUp className="w-4 h-4 mr-2" /> Global Stats
          </Button>
          <Button onClick={handleCreateTicket} disabled={!selectedEventId} size="lg" className="bg-primary hover:bg-primary/90">
            <Plus className="w-5 h-5 mr-2" />
            Create Ticket Type
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-background/50 backdrop-blur-md p-1 border">
          <TabsTrigger value="active-tickets" className="px-6">Active Tickets</TabsTrigger>
          <TabsTrigger value="sales-overview" className="px-6">Sales Overview</TabsTrigger>
          <TabsTrigger value="presets" className="px-6">Presets & Templates</TabsTrigger>
          <TabsTrigger value="usher-management" className="px-6 text-warning">Usher Management</TabsTrigger>
        </TabsList>

        <TabsContent value="active-tickets" className="space-y-6">
          {/* Event Selector */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                Select Event
              </CardTitle>
              <CardDescription>
                Choose an event to manage its specific ticketing configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner size="md" variant="primary" text="Loading events..." />
                </div>
              ) : eventsList.length > 0 ? (
                <Select
                  value={selectedEventId?.toString() || ''}
                  onValueChange={(value) => setSelectedEventId(Number(value))}
                >
                  <SelectTrigger className="w-full h-12 text-lg">
                    <SelectValue placeholder="Which event are we managing today?" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventsList.map((event: any) => (
                      <SelectItem key={event.id} value={event.id.toString()} className="h-12">
                        <div className="flex items-center justify-between w-full min-w-[300px]">
                          <span className="font-semibold">{event.name}</span>
                          <Badge variant="outline" className="ml-2 uppercase text-[10px] font-bold">
                            {event.status || 'Draft'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                  <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <h3 className="text-xl font-bold mb-2">Start Your First Ticketed Event</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    You haven't created any ticketed events yet. Ready to launch?
                  </p>
                  <Button onClick={() => navigate('/dashboard/events/create/ticketed')} size="lg">
                    Create Ticketed Event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedEventId && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-5 duration-700">
              <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">Revenue Scored</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">ETB {stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">+12% from last week</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-500">Tickets Distributed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{stats.totalSold} / {ticketTypes?.reduce((acc: number, t: any) => acc + (t.quantity || 0), 0) || '∞'}</div>
                  <p className="text-xs text-muted-foreground mt-1">Utilization: {Math.round((stats.totalSold / (ticketTypes?.reduce((acc: number, t: any) => acc + (t.quantity || 0), 0) || 1)) * 100)}%</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-500">Inventory Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{stats.activeTypes} Active</div>
                  <p className="text-xs text-muted-foreground mt-1">{filteredTicketTypes.filter(t => t.sold_count >= (t.quantity || Infinity)).length} Sold out</p>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedEventId && (
            <Card className="border-2 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Ticket Variants</CardTitle>
                  <CardDescription>Manage your inventory and pricing models</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tickets..."
                      className="pl-9 w-[200px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="sold_out">Sold Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {ticketTypesLoading ? (
                  <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
                ) : filteredTicketTypes.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground opacity-20" />
                    <p className="text-xl font-bold">No tickets found</p>
                    <Button onClick={handleCreateTicket} variant="outline">Create Your First Ticket</Button>
                  </div>
                ) : (
                  <div className="border rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="py-5">Name & Description</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Inventory</TableHead>
                          <TableHead>Sold</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTicketTypes.map((ticketType: TicketType) => (
                          <TableRow key={ticketType.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell className="py-4 font-bold">
                              {ticketType.name}
                              {ticketType.description && (
                                <p className="text-xs font-normal text-muted-foreground mt-0.5 line-clamp-1">
                                  {ticketType.description}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm">ETB {Number(ticketType.price).toFixed(2)}</TableCell>
                            <TableCell>
                              {ticketType.quantity ? (
                                <div className="space-y-1.5 min-w-[120px]">
                                  <div className="flex justify-between text-[10px] font-bold uppercase">
                                    <span>{ticketType.quantity - ticketType.sold_count} Left</span>
                                    <span className="text-muted-foreground">{Math.round((ticketType.sold_count / ticketType.quantity) * 100)}%</span>
                                  </div>
                                  <Progress value={(ticketType.sold_count / ticketType.quantity) * 100} className="h-1.5" />
                                </div>
                              ) : (
                                <span className="text-xs uppercase font-bold text-muted-foreground">Unlimited</span>
                              )}
                            </TableCell>
                            <TableCell className="font-bold text-lg">{ticketType.sold_count}</TableCell>
                            <TableCell>
                              <Badge
                                variant={ticketType.is_active ? "default" : "secondary"}
                                className={cn(
                                  "uppercase text-[10px] font-black tracking-widest px-2 py-0.5",
                                  ticketType.is_active ? "bg-green-500/10 text-green-600 border-green-200" : ""
                                )}
                              >
                                {ticketType.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEditTicket(ticketType)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleSavePreset(ticketType)} title="Save as Preset">
                                  <Sparkles className="w-4 h-4 text-amber-500" />
                                </Button>
                                <TicketActionsMenu
                                  ticketType={ticketType}
                                  onEdit={() => handleEditTicket(ticketType)}
                                  eventId={selectedEventId}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sales-overview">
          {summaryLoading ? (
            <div className="py-20 flex justify-center items-center flex-col gap-4">
              <Spinner size="lg" />
              <p className="text-muted-foreground animate-pulse">Aggregating your ecosystem data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Summary Stats */}
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-brand-gradient text-foreground border-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-80">Total Ecosystem Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">ETB {salesSummary?.total_revenue?.toLocaleString() || 0}</div>
                  </CardContent>
                </Card>
                <Card className="bg-muted border-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tickets Sold (Global)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">{salesSummary?.total_tickets_sold?.toLocaleString() || 0}</div>
                  </CardContent>
                </Card>
                <Card className="bg-muted border-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Campaigns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">{salesSummary?.sales_by_event?.length || 0}</div>
                  </CardContent>
                </Card>
                <Card className="bg-muted border-2 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">Avg. Revenue / Event</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">
                      ETB {salesSummary?.sales_by_event?.length
                        ? Math.round(salesSummary.total_revenue / salesSummary.sales_by_event.length).toLocaleString()
                        : 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sales Chart */}
              <Card className="border-2 lg:col-span-2 shadow-xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/30">
                  <div>
                    <CardTitle className="text-xl">Network Performance</CardTitle>
                    <CardDescription>Daily automated sales tracking (last 30 days)</CardDescription>
                  </div>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[350px] w-full">
                    {salesSummary?.daily_sales?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesSummary.daily_sales}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--color-primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--color-primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--color-muted-foreground)/0.1)" />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10 }}
                            tickFormatter={(str) => {
                              const date = new Date(str);
                              return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                            }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10 }}
                            tickFormatter={(value) => `ETB ${value.toLocaleString()}`}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--color-card))',
                              borderColor: 'hsl(var(--color-border))',
                              borderRadius: '12px',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="hsl(var(--color-primary))"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            animationDuration={1500}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
                        <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
                        <p>No sales trends recorded in the last 30 days.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Sidebar Info */}
              <div className="space-y-6">
                <DashboardCard title="Performance Leaderboard" className="border-2 shadow-sm">
                  <div className="space-y-4 pt-2">
                    {salesSummary?.sales_by_event?.length > 0 ? (
                      salesSummary.sales_by_event.slice(0, 5).map((event: any, idx: number) => (
                        <div key={event.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors border border-transparent hover:border-border">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-black text-muted-foreground/30 w-5">{idx + 1}</span>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm truncate max-w-[150px]">{event.name}</span>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">{event.tickets_sold} sold</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-primary">ETB {event.revenue.toLocaleString()}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-center text-muted-foreground py-8">No events with sales found.</p>
                    )}
                  </div>
                </DashboardCard>

                <DashboardCard title="Real-time Indicators" className="border-2 shadow-sm">
                  <div className="space-y-4 pt-2">
                    {salesSummary?.total_revenue > 0 ? (
                      <>
                        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-4">
                          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-sm text-primary">High Performing</p>
                            <p className="text-xs text-muted-foreground mt-1">Global ecosystem revenue is reaching new peaks today.</p>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 flex items-start gap-4">
                          <TrendingUp className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-sm text-blue-900 dark:text-blue-100">Market Traction</p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Average ticket price is holding steady at ETB {Math.round(salesSummary.total_revenue / (salesSummary.total_tickets_sold || 1))}.</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-center text-muted-foreground py-4">Waiting for transaction data...</p>
                    )}
                  </div>
                </DashboardCard>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="usher-management">
          <Card className="border-2 shadow-xl">
            <CardHeader>
              <CardTitle>Redemption & Usher Management</CardTitle>
              <CardDescription>Monitor ushers and ticket redemption activity</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-warning/10 rounded-full flex items-center justify-center">
                <Users className="w-10 h-10 text-warning" />
              </div>
              <h3 className="text-2xl font-bold">Usher Management Hub coming soon</h3>
              <p className="text-muted-foreground max-w-lg">
                Track scan rates, manage usher permissions, and monitor entry traffic in real-time.
              </p>
              <div className="flex gap-4">
                <Button variant="outline">Assign Ushers</Button>
                <Button className="bg-warning text-warning-foreground hover:bg-warning/90" onClick={() => navigate('/dashboard/usher/redemption')}>
                  Open Validator
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presets" className="animate-in slide-in-from-right-5 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-dashed border-2 flex flex-col items-center justify-center p-8 hover:border-primary/50 transition-colors cursor-pointer" onClick={handleCreateTicket}>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold">New Custom Template</h3>
              <p className="text-xs text-muted-foreground text-center mt-2">Design a ticket structure from scratch</p>
            </Card>

            {presets.map((preset) => (
              <Card key={preset.id} className="group hover:shadow-xl transition-all duration-300 border-2 overflow-hidden">
                <div className="h-2 bg-primary/20 group-hover:bg-primary transition-colors" />
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{preset.name}</CardTitle>
                    <Badge variant="outline" className="font-mono">ETB {preset.price}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{preset.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground uppercase font-bold tracking-tighter">
                    <span>Default Capacity: {preset.quantity || '∞'}</span>
                    <span>Shared: No</span>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 pt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleApplyPreset(preset)}>
                    <Download className="w-3 h-3 mr-1.5" /> Apply
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setPresets(presets.filter(p => p.id !== preset.id))}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

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

