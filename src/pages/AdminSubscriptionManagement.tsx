import { useState, useEffect } from 'react'
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
import { Search, Filter, Calendar, DollarSign, Building2 } from 'lucide-react'
import { format } from 'date-fns'
import type { Organizer } from '@/lib/api/subscriptions'

export default function AdminSubscriptionManagement() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')

  // Fetch all subscriptions
  const { data: subscriptions, isLoading } = useQuery<Subscription[]>({
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
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Fetch all subscription plans
  const { data: plans } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionsApi.getPlans(),
    retry: 1,
    staleTime: 10 * 60 * 1000,
  })

  // Fetch organizers
  const { data: organizers } = useQuery<Organizer[]>({
    queryKey: ['organizers'],
    queryFn: async () => {
      const response = await api.get('/organizers')
      return response.data || []
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, immediate }: { id: number; immediate?: boolean }) =>
      api.post(`/admin/subscriptions/${id}/cancel`, { immediate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      toast({
        title: 'Success',
        description: 'Subscription cancelled successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel subscription',
        variant: 'destructive',
      })
    },
  })

  const activateMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/subscriptions/${id}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      toast({
        title: 'Success',
        description: 'Subscription activated successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to activate subscription',
        variant: 'destructive',
      })
    },
  })

  const filteredSubscriptions = subscriptions?.filter((sub) => {
    if (searchTerm === '') return true
    
    const searchLower = searchTerm.toLowerCase()
    const organizerName = sub.organizer?.name?.toLowerCase() || getOrganizerName(sub.organizer_id).toLowerCase()
    const planName = sub.plan?.name?.toLowerCase() || ''
    
    return organizerName.includes(searchLower) || planName.includes(searchLower)
  }) || []

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-100 text-green-800 border-green-300',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
      expired: 'bg-red-100 text-red-800 border-red-300',
      past_due: 'bg-orange-100 text-orange-800 border-orange-300',
    }
    return variants[status] || variants.pending
  }

  const getOrganizerName = (organizerId: number) => {
    const organizer = organizers?.find((o) => o.id === organizerId)
    return organizer?.name || `Organizer #${organizerId}`
  }

  const stats = {
    total: subscriptions?.length || 0,
    active: subscriptions?.filter((s) => s.status === 'active').length || 0,
    pending: subscriptions?.filter((s) => s.status === 'pending').length || 0,
    cancelled: subscriptions?.filter((s) => s.status === 'cancelled').length || 0,
    expired: subscriptions?.filter((s) => s.status === 'expired').length || 0,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="md" text="Loading subscriptions..." />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
        <p className="text-muted-foreground">Manage all organizer subscriptions</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.cancelled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by organizer or plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {plans?.map((plan) => (
                  <SelectItem key={plan.id} value={plan.slug}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>
            {filteredSubscriptions.length} subscription{filteredSubscriptions.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organizer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Billing Cycle</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Period Start</TableHead>
                  <TableHead>Period End</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No subscriptions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {subscription.organizer?.name || getOrganizerName(subscription.organizer_id)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{subscription.plan?.name || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusBadge(subscription.status)}
                        >
                          {subscription.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{subscription.billing_cycle}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {subscription.billing_cycle === 'yearly'
                              ? subscription.plan?.price_yearly.toLocaleString()
                              : subscription.plan?.price_monthly.toLocaleString()}{' '}
                            ETB
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {subscription.current_period_start ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(new Date(subscription.current_period_start), 'MMM d, yyyy')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {subscription.current_period_end ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(new Date(subscription.current_period_end), 'MMM d, yyyy')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {subscription.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => activateMutation.mutate(subscription.id)}
                              disabled={activateMutation.isPending}
                            >
                              Activate
                            </Button>
                          )}
                          {subscription.status === 'active' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                cancelMutation.mutate({ id: subscription.id, immediate: false })
                              }
                              disabled={cancelMutation.isPending}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

