import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subscriptionsApi, type Subscription, type SubscriptionPlan } from '@/lib/api/subscriptions'
import { PendingApprovalCard } from '@/components/subscription/PendingApprovalCard'
import { SubscriptionHistoryTimeline } from '@/components/subscription/SubscriptionHistoryTimeline'
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
  XCircle,
  FileText,
  Calendar,
  Settings,
  Package,
  Edit,
  Trash2
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { format } from 'date-fns'
import { toast as sonnerToast } from 'sonner'
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

export default function AdminSubscriptionManagement() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [showModifyDialog, setShowModifyDialog] = useState(false)
  const [modifyType, setModifyType] = useState<'trial' | 'extend' | 'assign' | null>(null)
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [planSearchTerm, setPlanSearchTerm] = useState('')

  // Fetch all subscriptions
  const { data: subscriptionsResponse, isLoading } = useQuery({
    queryKey: ['admin-subscriptions', statusFilter, planFilter],
    queryFn: async () => {
      const response = await subscriptionsApi.getAdminSubscriptions({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        plan: planFilter !== 'all' ? planFilter : undefined,
      })
      return response
    },
    retry: 1,
  })

  // Handle paginated response - data can be paginated or direct array
  const subscriptions = useMemo((): Subscription[] => {
    if (!subscriptionsResponse) return []
    
    // If subscriptionsResponse has a 'data' property
    if ('data' in subscriptionsResponse) {
      const responseData = subscriptionsResponse.data
      
      // If it's a paginated response (has 'data' property inside)
      if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray(responseData.data)) {
        return responseData.data as Subscription[]
      }
      
      // If it's a direct array
      if (Array.isArray(responseData)) {
        return responseData as Subscription[]
      }
    }
    
    // If it's the response itself that's an array (fallback)
    if (Array.isArray(subscriptionsResponse)) {
      return subscriptionsResponse as Subscription[]
    }
    
    return []
  }, [subscriptionsResponse])

  // Fetch pending approvals
  const { data: pendingApprovals = [], isLoading: isLoadingApprovals } = useQuery<Subscription[]>({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      try {
        return await subscriptionsApi.getPendingApprovals()
      } catch (error: any) {
        // Handle 500 errors gracefully - return empty array
        if (error?.response?.status === 500 || error?.response?.status === 404) {
          console.warn('Pending approvals endpoint not available:', error?.response?.status)
          return []
        }
        throw error
      }
    },
    retry: false, // Don't retry on server errors
  })

  // Fetch plans for assignment and management
  const { data: plans = [], isLoading: isLoadingPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionsApi.getPlans(),
  })

  // Summary statistics derived from subscriptions
  const stats = useMemo(() => {
    return {
      total: subscriptions.length,
      active: subscriptions.filter((s: Subscription) => s.status === 'active').length,
      pending: subscriptions.filter((s: Subscription) => s.status === 'pending').length,
      revenue: subscriptions.reduce((acc: number, s: Subscription) => {
        const planPrice = s.billing_cycle === 'yearly' 
          ? (s.plan?.price_yearly || 0) 
          : (s.plan?.price_monthly || 0)
        return acc + planPrice
      }, 0)
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

  const approveUpgradeMutation = useMutation({
    mutationFn: (id: number) => subscriptionsApi.approveUpgrade(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
      sonnerToast.success('Upgrade approved successfully')
    },
    onError: (error: any) => {
      sonnerToast.error(error.response?.data?.message || 'Failed to approve upgrade')
    },
  })

  const approveDowngradeMutation = useMutation({
    mutationFn: (id: number) => subscriptionsApi.approveDowngrade(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
      sonnerToast.success('Downgrade approved successfully')
    },
    onError: (error: any) => {
      sonnerToast.error(error.response?.data?.message || 'Failed to approve downgrade')
    },
  })

  const rejectRequestMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      subscriptionsApi.rejectRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
      sonnerToast.success('Request rejected successfully')
    },
    onError: (error: any) => {
      sonnerToast.error(error.response?.data?.message || 'Failed to reject request')
    },
  })

  const modifyTrialMutation = useMutation({
    mutationFn: ({ id, days }: { id: number; days: number }) =>
      subscriptionsApi.modifyTrial(id, days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      sonnerToast.success('Trial modified successfully')
      setShowModifyDialog(false)
    },
    onError: (error: any) => {
      sonnerToast.error(error.response?.data?.message || 'Failed to modify trial')
    },
  })

  const extendMutation = useMutation({
    mutationFn: ({ id, days }: { id: number; days: number }) =>
      subscriptionsApi.extendSubscription(id, days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      sonnerToast.success('Subscription extended successfully')
      setShowModifyDialog(false)
    },
    onError: (error: any) => {
      sonnerToast.error(error.response?.data?.message || 'Failed to extend subscription')
    },
  })

  const assignPlanMutation = useMutation({
    mutationFn: (data: { organizer_id: number; plan_id: number; trial_days?: number }) =>
      subscriptionsApi.assignPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      sonnerToast.success('Plan assigned successfully')
      setShowModifyDialog(false)
    },
    onError: (error: any) => {
      sonnerToast.error(error.response?.data?.message || 'Failed to assign plan')
    },
  })

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: (data: any) => {
      console.log('Creating plan with data:', data)
      return api.post('/subscription-plans', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      sonnerToast.success('Plan created successfully')
      setShowPlanDialog(false)
      setEditingPlan(null)
    },
    onError: (error: any) => {
      console.error('Plan creation error:', error.response?.data)
      const errorMessage = error.response?.data?.message || 'Failed to create plan'
      const validationErrors = error.response?.data?.errors
      if (validationErrors) {
        const errorDetails = Object.entries(validationErrors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n')
        sonnerToast.error(`${errorMessage}\n${errorDetails}`)
      } else {
        sonnerToast.error(errorMessage)
      }
    },
  })

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.put(`/subscription-plans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      sonnerToast.success('Plan updated successfully')
      setShowPlanDialog(false)
      setEditingPlan(null)
    },
    onError: (error: any) => {
      sonnerToast.error(error.response?.data?.message || 'Failed to update plan')
    },
  })

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/subscription-plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      sonnerToast.success('Plan deleted successfully')
    },
    onError: (error: any) => {
      sonnerToast.error(error.response?.data?.message || 'Failed to delete plan')
    },
  })

  // Toggle plan status mutation
  const togglePlanStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'inactive' }) =>
      api.put(`/subscription-plans/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      sonnerToast.success('Plan status updated successfully')
    },
    onError: (error: any) => {
      sonnerToast.error(error.response?.data?.message || 'Failed to update plan status')
    },
  })

  // Fetch subscription history
  const { data: subscriptionHistory = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['subscription-history', selectedSubscription?.id],
    queryFn: () => {
      if (!selectedSubscription) return Promise.resolve([])
      return subscriptionsApi.getSubscriptionHistoryAdmin(selectedSubscription.id)
    },
    enabled: !!selectedSubscription,
  })

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.organizer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name?.toLowerCase().includes(planSearchTerm.toLowerCase()) ||
      plan.slug?.toLowerCase().includes(planSearchTerm.toLowerCase()) ||
      plan.description?.toLowerCase().includes(planSearchTerm.toLowerCase())
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
      <Tabs defaultValue="subscriptions" className="space-y-6">
        <TabsList className="bg-card/40 backdrop-blur-xl border-white/10">
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="approvals">
            Pending Approvals
            {pendingApprovals.length > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white">{pendingApprovals.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions">
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
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="pending_upgrade">Pending Upgrade</SelectItem>
                  <SelectItem value="pending_downgrade">Pending Downgrade</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="grace_period">Grace Period</SelectItem>
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
          <div className="rounded-xl border border-white/5 min-w-0 overflow-x-auto overflow-hidden">
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
                            <span className="text-[10px] text-primary font-bold uppercase tracking-tight">
                              {sub.billing_cycle === 'yearly'
                                ? `${sub.plan?.price_yearly?.toLocaleString() || 0} ETB / year`
                                : `${sub.plan?.price_monthly?.toLocaleString() || 0} ETB / month`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "border-none px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight",
                              sub.status === 'active' && "bg-green-500/20 text-green-500",
                              sub.status === 'trial' && "bg-blue-500/20 text-blue-500",
                              sub.status === 'pending' && "bg-yellow-500/20 text-yellow-500",
                              sub.status === 'pending_upgrade' && "bg-purple-500/20 text-purple-500",
                              sub.status === 'pending_downgrade' && "bg-amber-500/20 text-amber-500",
                              sub.status === 'cancelled' && "bg-red-500/20 text-red-500",
                              sub.status === 'expired' && "bg-orange-500/20 text-orange-500",
                              sub.status === 'grace_period' && "bg-orange-500/20 text-orange-500",
                            )}
                          >
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 text-sm font-medium text-muted-foreground">
                          {sub.ends_at ? format(new Date(sub.ends_at), 'MMM dd, yyyy') : 
                           sub.current_period_end ? format(new Date(sub.current_period_end), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 rounded-lg transition-colors">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-card/90 backdrop-blur-xl border-white/10 shadow-2xl">
                              <DropdownMenuLabel>Subscription Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-white/5" />
                              <DropdownMenuItem 
                                className="focus:bg-primary/20 cursor-pointer"
                                onClick={() => {
                                  setSelectedSubscription(sub)
                                  setShowModifyDialog(true)
                                  setModifyType(null)
                                }}
                              >
                                <FileText className="mr-2 h-4 w-4" /> View History
                              </DropdownMenuItem>
                              <DropdownMenuItem className="focus:bg-primary/20 cursor-pointer">
                                <TrendingUp className="mr-2 h-4 w-4" /> View Usage
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/5" />
                              <DropdownMenuItem 
                                className="focus:bg-primary/20 cursor-pointer"
                                onClick={() => {
                                  setSelectedSubscription(sub)
                                  setModifyType('trial')
                                  setShowModifyDialog(true)
                                }}
                              >
                                <Calendar className="mr-2 h-4 w-4" /> Modify Trial
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="focus:bg-primary/20 cursor-pointer"
                                onClick={() => {
                                  setSelectedSubscription(sub)
                                  setModifyType('extend')
                                  setShowModifyDialog(true)
                                }}
                              >
                                <Settings className="mr-2 h-4 w-4" /> Extend Subscription
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
                                  <CheckCircle2 className="mr-2 h-4 w-4" /> Activate Plan
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
        </TabsContent>

        <TabsContent value="approvals">
          <DashboardCard
            title="Pending Approvals"
            className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl"
          >
            {isLoadingApprovals ? (
              <div className="flex items-center justify-center py-12">
                <Spinner text="Loading pending approvals..." />
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mb-3 opacity-50" />
                <p>No pending approvals</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingApprovals.map((subscription) => (
                  <PendingApprovalCard
                    key={subscription.id}
                    subscription={subscription}
                    onApprove={() => {
                      if (subscription.status === 'pending_upgrade') {
                        approveUpgradeMutation.mutate(subscription.id)
                      } else {
                        approveDowngradeMutation.mutate(subscription.id)
                      }
                    }}
                    onReject={() => {
                      rejectRequestMutation.mutate({ id: subscription.id })
                    }}
                    isApproving={
                      approveUpgradeMutation.isPending || approveDowngradeMutation.isPending
                    }
                    isRejecting={rejectRequestMutation.isPending}
                  />
                ))}
              </div>
            )}
          </DashboardCard>
        </TabsContent>

        <TabsContent value="plans">
          <DashboardCard
            title="Subscription Plans Management"
            className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl"
          >
            {/* Plans Header with Search and Create Button */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search plans..."
                  value={planSearchTerm}
                  onChange={(e) => setPlanSearchTerm(e.target.value)}
                  className="pl-10 h-10 bg-background/50 border-border/50 rounded-xl"
                />
              </div>
              <Dialog open={showPlanDialog} onOpenChange={(open) => {
                setShowPlanDialog(open)
                if (!open) setEditingPlan(null)
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    <Plus className="w-4 h-4 mr-2" /> New Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Subscription Plan'}</DialogTitle>
                    <DialogDescription>
                      {editingPlan ? 'Update plan details' : 'Create a new subscription plan for organizers'}
                    </DialogDescription>
                  </DialogHeader>
                  <PlanForm
                    plan={editingPlan}
                    onSubmit={(data) => {
                      // Prepare clean data for backend
                      const planData: any = {
                        name: data.name,
                        slug: data.slug,
                        description: data.description || null,
                        price_monthly: data.price_monthly,
                        currency: data.currency || 'ETB',
                        is_recurring: data.is_recurring || false,
                        status: data.status || 'active',
                        sort_order: data.sort_order || 0,
                        features: data.features || [],
                        limits: data.limits || {},
                      }
                      
                      // Only include price_yearly if provided (backend will auto-calculate if null/0)
                      if (data.price_yearly !== null && data.price_yearly !== undefined && data.price_yearly !== '' && data.price_yearly !== 0) {
                        planData.price_yearly = Number(data.price_yearly)
                      }
                      
                      // Only include duration_days if provided and valid
                      if (data.duration_days !== null && data.duration_days !== undefined) {
                        planData.duration_days = data.duration_days
                      }
                      
                      if (editingPlan) {
                        updatePlanMutation.mutate({ id: editingPlan.id, data: planData })
                      } else {
                        createPlanMutation.mutate(planData)
                      }
                    }}
                    isLoading={createPlanMutation.isPending || updatePlanMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Plans Table */}
            <div className="rounded-xl border border-white/5 min-w-0 overflow-x-auto overflow-hidden">
              <Table>
                <TableHeader className="bg-background/40">
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Plan Name</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Slug</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Pricing</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Duration</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {isLoadingPlans ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-64 text-center">
                          <Spinner text="Loading plans..." />
                        </TableCell>
                      </TableRow>
                    ) : filteredPlans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center opacity-50">
                            <Package className="w-12 h-12 mb-3" />
                            <p>No plans found.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPlans.map((plan) => (
                        <motion.tr
                          key={plan.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="group border-white/5 bg-background/10 hover:bg-background/20 transition-colors"
                        >
                          <TableCell className="py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{plan.name}</span>
                              {plan.description && (
                                <span className="text-xs text-muted-foreground mt-1 line-clamp-1">{plan.description}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <code className="text-xs bg-muted px-2 py-1 rounded">{plan.slug}</code>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold">{plan.price_monthly?.toLocaleString() || 0} {plan.currency}/mo</span>
                              <span className="text-xs text-muted-foreground">{plan.price_yearly?.toLocaleString() || 'Auto'} {plan.currency}/yr</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              variant="secondary"
                              className={cn(
                                "border-none px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight",
                                ((plan.status === 'active') || (plan.is_active !== undefined && plan.is_active)) && "bg-green-500/20 text-green-500",
                                ((plan.status === 'inactive') || (plan.is_active !== undefined && !plan.is_active)) && "bg-gray-500/20 text-gray-500",
                              )}
                            >
                              {(plan.status === 'active') || (plan.is_active !== undefined && plan.is_active) ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 text-sm text-muted-foreground">
                            {plan.duration_days ? `${plan.duration_days} days` : 'N/A'}
                            {plan.is_recurring && (
                              <Badge variant="outline" className="ml-2 text-xs">Recurring</Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 rounded-lg transition-colors">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 bg-card/90 backdrop-blur-xl border-white/10 shadow-2xl">
                                <DropdownMenuLabel>Plan Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem
                                  className="focus:bg-primary/20 cursor-pointer"
                                  onClick={() => {
                                    setEditingPlan(plan)
                                    setShowPlanDialog(true)
                                  }}
                                >
                                  <Settings className="mr-2 h-4 w-4" /> Edit Plan
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="focus:bg-primary/20 cursor-pointer"
                                  onClick={() => {
                                    const isCurrentlyActive = (plan.status === 'active') || (plan.is_active !== undefined && plan.is_active)
                                    const newStatus = isCurrentlyActive ? 'inactive' : 'active'
                                    togglePlanStatusMutation.mutate({ id: plan.id, status: newStatus })
                                  }}
                                  disabled={togglePlanStatusMutation.isPending}
                                >
                                  {(plan.status === 'active' || plan.is_active) ? (
                                    <>
                                      <XCircle className="mr-2 h-4 w-4" /> Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="mr-2 h-4 w-4" /> Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem
                                  className="text-destructive focus:bg-destructive/20 cursor-pointer"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete "${plan.name}"? This action cannot be undone.`)) {
                                      deletePlanMutation.mutate(plan.id)
                                    }
                                  }}
                                  disabled={deletePlanMutation.isPending}
                                >
                                  <XCircle className="mr-2 h-4 w-4" /> Delete Plan
                                </DropdownMenuItem>
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
        </TabsContent>
      </Tabs>

      {/* Modify Dialog */}
      <Dialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {modifyType === 'trial' && 'Modify Trial Days'}
              {modifyType === 'extend' && 'Extend Subscription'}
              {modifyType === 'assign' && 'Assign Plan'}
              {!modifyType && 'Subscription History'}
            </DialogTitle>
            <DialogDescription>
              {modifyType === 'trial' && 'Change the trial duration for this subscription'}
              {modifyType === 'extend' && 'Extend the subscription end date'}
              {modifyType === 'assign' && 'Assign a new plan to an organizer'}
              {!modifyType && 'View subscription history and audit trail'}
            </DialogDescription>
          </DialogHeader>

          {!modifyType && selectedSubscription && (
            <div className="max-h-[500px] overflow-y-auto">
              {isHistoryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner text="Loading history..." />
                </div>
              ) : (
                <SubscriptionHistoryTimeline history={subscriptionHistory} />
              )}
            </div>
          )}

          {modifyType === 'trial' && selectedSubscription && (
            <TrialModifyForm
              subscription={selectedSubscription}
              onSubmit={(days) => modifyTrialMutation.mutate({ id: selectedSubscription.id, days })}
              isLoading={modifyTrialMutation.isPending}
            />
          )}

          {modifyType === 'extend' && selectedSubscription && (
            <ExtendForm
              subscription={selectedSubscription}
              onSubmit={(days) => extendMutation.mutate({ id: selectedSubscription.id, days })}
              isLoading={extendMutation.isPending}
            />
          )}

          {modifyType === 'assign' && (
            <AssignPlanForm
              plans={plans}
              onSubmit={(data) => assignPlanMutation.mutate(data)}
              isLoading={assignPlanMutation.isPending}
            />
          )}

          {modifyType && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModifyDialog(false)}>
                Cancel
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper components for modify forms
function TrialModifyForm({
  subscription,
  onSubmit,
  isLoading,
}: {
  subscription: Subscription
  onSubmit: (days: number) => void
  isLoading: boolean
}) {
  const [days, setDays] = useState(subscription.trial_days || 30)

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="trial-days">Trial Days</Label>
        <Input
          id="trial-days"
          type="number"
          min="1"
          max="365"
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value) || 30)}
        />
        <p className="text-sm text-muted-foreground">
          Current trial days: {subscription.trial_days || 'N/A'}
        </p>
      </div>
      <Button onClick={() => onSubmit(days)} disabled={isLoading} className="w-full">
        {isLoading ? 'Modifying...' : 'Modify Trial'}
      </Button>
    </div>
  )
}

function ExtendForm({
  subscription,
  onSubmit,
  isLoading,
}: {
  subscription: Subscription
  onSubmit: (days: number) => void
  isLoading: boolean
}) {
  const [days, setDays] = useState(30)

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="extend-days">Extension Days</Label>
        <Input
          id="extend-days"
          type="number"
          min="1"
          max="365"
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value) || 30)}
        />
        <p className="text-sm text-muted-foreground">
          Current end date: {subscription.ends_at ? format(new Date(subscription.ends_at), 'PPp') : 'N/A'}
        </p>
      </div>
      <Button onClick={() => onSubmit(days)} disabled={isLoading} className="w-full">
        {isLoading ? 'Extending...' : 'Extend Subscription'}
      </Button>
    </div>
  )
}

function AssignPlanForm({
  plans,
  onSubmit,
  isLoading,
}: {
  plans: SubscriptionPlan[]
  onSubmit: (data: { organizer_id: number; plan_id: number; trial_days?: number }) => void
  isLoading: boolean
}) {
  const [organizerId, setOrganizerId] = useState('')
  const [planId, setPlanId] = useState('')
  const [trialDays, setTrialDays] = useState<number | undefined>(undefined)

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="organizer-id">Organizer ID</Label>
        <Input
          id="organizer-id"
          type="number"
          value={organizerId}
          onChange={(e) => setOrganizerId(e.target.value)}
          placeholder="Enter organizer ID"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="plan-select">Plan</Label>
        <Select value={planId} onValueChange={setPlanId}>
          <SelectTrigger id="plan-select">
            <SelectValue placeholder="Select a plan" />
          </SelectTrigger>
          <SelectContent>
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id.toString()}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="trial-days-optional">Trial Days (Optional)</Label>
        <Input
          id="trial-days-optional"
          type="number"
          min="0"
          max="365"
          value={trialDays || ''}
          onChange={(e) => setTrialDays(e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="Leave empty for no trial"
        />
      </div>
      <Button
        onClick={() =>
          onSubmit({
            organizer_id: parseInt(organizerId),
            plan_id: parseInt(planId),
            trial_days: trialDays,
          })
        }
        disabled={isLoading || !organizerId || !planId}
        className="w-full"
      >
        {isLoading ? 'Assigning...' : 'Assign Plan'}
      </Button>
    </div>
  )
}

function PlanForm({
  plan,
  onSubmit,
  isLoading,
}: {
  plan: SubscriptionPlan | null
  onSubmit: (data: any) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    slug: plan?.slug || '',
    description: plan?.description || '',
    price_monthly: plan?.price_monthly || '',
    price_yearly: plan?.price_yearly || '',
    currency: plan?.currency || 'ETB',
    duration_days: plan?.duration_days || null,
    is_recurring: plan?.is_recurring || false,
    status: plan?.status || (plan?.is_active !== undefined ? (plan.is_active ? 'active' : 'inactive') : 'active'),
    sort_order: plan?.sort_order || '',
    features: plan?.features || [],
    limits: plan?.limits || {},
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name || !formData.slug || formData.price_monthly === '') {
      return // Form validation will handle this
    }
    
    // Validate and convert data
    const priceMonthly = Number(formData.price_monthly)
    if (isNaN(priceMonthly) || priceMonthly < 0) {
      sonnerToast.error('Monthly price must be a valid number greater than or equal to 0')
      return
    }
    
    const sortOrder = formData.sort_order === '' ? 0 : Number(formData.sort_order)
    if (isNaN(sortOrder)) {
      sonnerToast.error('Sort order must be a valid number')
      return
    }
    
    // Convert empty strings to proper numeric values or null
    const submitData: any = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description?.trim() || null,
      price_monthly: priceMonthly,
      currency: (formData.currency || 'ETB').toUpperCase().substring(0, 3), // Ensure exactly 3 characters
      is_recurring: Boolean(formData.is_recurring),
      status: formData.status || 'active',
      sort_order: sortOrder,
    }
    
    // Only include optional fields if they have values
    if (formData.price_yearly !== '' && formData.price_yearly !== null && formData.price_yearly !== undefined) {
      const yearlyPrice = Number(formData.price_yearly)
      if (!isNaN(yearlyPrice) && yearlyPrice > 0) {
        submitData.price_yearly = yearlyPrice
      }
    }
    
    // duration_days must be one of: 30, 90, 180, 365 or null
    if (formData.duration_days !== null && formData.duration_days !== undefined) {
      const duration = Number(formData.duration_days)
      if (!isNaN(duration) && [30, 90, 180, 365].includes(duration)) {
        submitData.duration_days = duration
      }
    }
    
    // Always include features and limits (can be empty arrays/objects)
    submitData.features = Array.isArray(formData.features) ? formData.features : []
    submitData.limits = typeof formData.limits === 'object' && formData.limits !== null ? formData.limits : {}
    
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Plan Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price_monthly">Monthly Price (ETB) *</Label>
          <Input
            id="price_monthly"
            type="number"
            min="0"
            step="0.01"
            value={formData.price_monthly === '' ? '' : formData.price_monthly}
            onChange={(e) =>
              setFormData({ ...formData, price_monthly: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price_yearly">Yearly Price (ETB)</Label>
          <Input
            id="price_yearly"
            type="number"
            min="0"
            step="0.01"
            value={formData.price_yearly === '' ? '' : formData.price_yearly}
            onChange={(e) =>
              setFormData({ ...formData, price_yearly: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })
            }
            placeholder="Auto-calculated (Monthly × 12)"
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to auto-calculate (Monthly × 12) when client requests annually
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration_days">Duration (Days)</Label>
          <Select
            value={formData.duration_days?.toString() || 'none'}
            onValueChange={(value) =>
              setFormData({ ...formData, duration_days: value === 'none' ? null : parseInt(value) })
            }
          >
            <SelectTrigger id="duration_days">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="30">30 days (1 Month)</SelectItem>
              <SelectItem value="90">90 days (3 Months)</SelectItem>
              <SelectItem value="180">180 days (6 Months)</SelectItem>
              <SelectItem value="365">365 days (1 Year)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order === '' ? '' : formData.sort_order}
            onChange={(e) =>
              setFormData({ ...formData, sort_order: e.target.value === '' ? '' : parseInt(e.target.value) || '' })
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_recurring"
            checked={formData.is_recurring}
            onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
          />
          <Label htmlFor="is_recurring">Auto-renew (Recurring)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="status"
            checked={formData.status === 'active'}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, status: checked ? 'active' : 'inactive' })
            }
          />
          <Label htmlFor="status">Active</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (plan ? 'Updating...' : 'Creating...') : (plan ? 'Update Plan' : 'Create Plan')}
        </Button>
      </DialogFooter>
    </form>
  )
}
