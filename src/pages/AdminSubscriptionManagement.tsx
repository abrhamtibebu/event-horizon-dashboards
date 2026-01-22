import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subscriptionsApi, type Subscription, type SubscriptionPlan } from '@/lib/api/subscriptions'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  ShieldCheck,
  AlertCircle,
  MoreVertical,
  Download,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  XCircle
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { Organizer } from '@/lib/api/subscriptions'
import { MetricCard } from '@/components/MetricCard'
import { DashboardCard } from '@/components/DashboardCard'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast as sonnerToast } from 'sonner'

export default function AdminSubscriptionManagement() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')

  // Fetch all subscriptions
  const { data: subscriptions = [], isLoading } = useQuery<Subscription[]>({
    queryKey: ['admin-subscriptions', statusFilter, planFilter],
    queryFn: async () => {
      const response = await api.get('/admin/subscriptions', {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          plan: planFilter !== 'all' ? planFilter : undefined,
        },
      })
      return response.data.data || []
    },
    retry: 1,
  })

  // Summary statistics derived from subscriptions
  const stats = useMemo(() => {
    return {
      total: subscriptions.length,
      active: subscriptions.filter(s => s.status === 'active').length,
      pending: subscriptions.filter(s => s.status === 'pending').length,
      revenue: subscriptions.reduce((acc, s) => acc + (s.price || 0), 0)
    }
  }, [subscriptions])

  const cancelMutation = useMutation({
    mutationFn: ({ id, immediate }: { id: number; immediate?: boolean }) =>
      api.post(`/admin/subscriptions/${id}/cancel`, { immediate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      sonnerToast.success('Subscription cancelled successfully')
    }
  })

  const activateMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/subscriptions/${id}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      sonnerToast.success('Subscription activated successfully')
    }
  })

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.organizer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary/80">SaaS Operations</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Subscription Engine</h1>
          <p className="text-muted-foreground mt-1">Manage platform tiers, billing cycles, and subscriber health.</p>
        </motion.div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-card/50 backdrop-blur-md border-border/50">
            <Download className="w-4 h-4 mr-2" /> Export Audit
          </Button>
          <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> New Enterprise Plan
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <MetricCard
          title="Total Subscribers"
          value={stats.total.toString()}
          icon={<Users className="w-4 h-4" />}
          trend={{ value: 12, isPositive: true }}
          className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl"
        />
        <MetricCard
          title="Active Plans"
          value={stats.active.toString()}
          icon={<CheckCircle2 className="w-4 h-4" />}
          className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl"
        />
        <MetricCard
          title="Pending Verification"
          value={stats.pending.toString()}
          icon={<Clock className="w-4 h-4" />}
          className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl text-warning"
        />
        <MetricCard
          title="Monthly Recurring Revenue"
          value={`$${stats.revenue.toLocaleString()}`}
          icon={<TrendingUp className="w-4 h-4" />}
          trend={{ value: 8, isPositive: true }}
          className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl"
        />
      </motion.div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-8">
        <DashboardCard
          title="Subscribers Ledger"
          className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by organizer or plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-background/50 border-border/50 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-background/50 border-border/50 rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[140px] bg-background/50 border-border/50 rounded-xl">
                  <SelectValue placeholder="All Plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-background/40">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Organizer</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Plan & Tier</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Renewal Date</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                        <Spinner text="Fetching ledger..." />
                      </TableCell>
                    </TableRow>
                  ) : filteredSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center opacity-50">
                          <Search className="w-12 h-12 mb-3" />
                          <p>No subscriptions matching your criteria.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions.map((sub) => (
                      <motion.tr
                        key={sub.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group border-white/5 bg-background/10 hover:bg-background/20 transition-colors"
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {sub.organizer?.name?.[0] || 'O'}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{sub.organizer?.name || 'Unknown Organizer'}</span>
                              <span className="text-[10px] text-muted-foreground uppercase font-semibold">ID: #{sub.organizer?.id}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">{sub.plan?.name || 'Custom Plan'}</span>
                            <span className="text-[10px] text-primary font-bold uppercase tracking-tight">${sub.price || 0} / month</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "border-none px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight",
                              sub.status === 'active' && "bg-green-500/20 text-green-500",
                              sub.status === 'pending' && "bg-yellow-500/20 text-yellow-500",
                              sub.status === 'cancelled' && "bg-red-500/20 text-red-500",
                              sub.status === 'expired' && "bg-orange-500/20 text-orange-500",
                            )}
                          >
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 text-sm font-medium text-muted-foreground">
                          {sub.end_date ? format(parseISO(sub.end_date), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 rounded-lg transition-colors">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-card/90 backdrop-blur-xl border-white/10 shadow-2xl">
                              <DropdownMenuLabel>Subscription Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-white/5" />
                              <DropdownMenuItem className="focus:bg-primary/20 cursor-pointer">
                                <TrendingUp className="mr-2 h-4 w-4" /> View Usage
                              </DropdownMenuItem>
                              <DropdownMenuItem className="focus:bg-primary/20 cursor-pointer">
                                <Download className="mr-2 h-4 w-4" /> Billing History
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/5" />
                              {sub.status === 'active' ? (
                                <DropdownMenuItem
                                  className="text-destructive focus:bg-destructive/20 cursor-pointer"
                                  onClick={() => cancelMutation.mutate({ id: sub.id })}
                                >
                                  <XCircle className="mr-2 h-4 w-4" /> Terminate Plan
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="text-green-500 focus:bg-green-500/20 cursor-pointer"
                                  onClick={() => activateMutation.mutate(sub.id)}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" /> Reactive Plan
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </DashboardCard>
      </div>
    </div>
  )
}
