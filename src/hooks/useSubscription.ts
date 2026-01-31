import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subscriptionsApi, type Subscription, type SubscriptionPlan } from '@/lib/api/subscriptions'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

export function useSubscription() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Only fetch subscription for organizers (backend /subscriptions is for organizer context)
  const isOrganizer = user?.role === 'organizer' || user?.role === 'organizer_admin'

  const {
    data: subscription,
    isLoading,
    error,
    refetch,
  } = useQuery<Subscription | null>({
    queryKey: ['subscription'],
    queryFn: () => subscriptionsApi.getCurrentSubscription(),
    enabled: !!user && isOrganizer,
    retry: (failureCount, error: any) => failureCount < 1 && error?.response?.status !== 404,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const createMutation = useMutation({
    mutationFn: (data: {
      subscription_plan_id: number
      billing_cycle: 'monthly' | 'yearly'
      trial_days?: number
    }) => subscriptionsApi.createSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      toast({
        title: 'Subscription created',
        description: 'Your subscription has been created successfully.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create subscription',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { billing_cycle?: 'monthly' | 'yearly'; payment_method?: 'telebirr' | 'cbe_birr' } }) =>
      subscriptionsApi.updateSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      toast({
        title: 'Subscription updated',
        description: 'Your subscription has been updated successfully.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update subscription',
        variant: 'destructive',
      })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, immediate }: { id: number; immediate?: boolean }) =>
      subscriptionsApi.cancelSubscription(id, immediate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      toast({
        title: 'Subscription cancelled',
        description: 'Your subscription has been cancelled.',
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

  const resumeMutation = useMutation({
    mutationFn: (id: number) => subscriptionsApi.resumeSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      toast({
        title: 'Subscription resumed',
        description: 'Your subscription has been resumed.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to resume subscription',
        variant: 'destructive',
      })
    },
  })

  const requestUpgradeMutation = useMutation({
    mutationFn: (planId: number) => subscriptionsApi.requestUpgrade(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      toast({
        title: 'Upgrade requested',
        description: 'Your upgrade request has been submitted and is pending admin approval.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to request upgrade',
        variant: 'destructive',
      })
    },
  })

  const requestDowngradeMutation = useMutation({
    mutationFn: (planId: number) => subscriptionsApi.requestDowngrade(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      toast({
        title: 'Downgrade requested',
        description: 'Your downgrade request has been submitted and is pending admin approval.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to request downgrade',
        variant: 'destructive',
      })
    },
  })

  return {
    subscription,
    isLoading,
    error,
    refetch,
    createSubscription: createMutation.mutate,
    updateSubscription: updateMutation.mutate,
    cancelSubscription: cancelMutation.mutate,
    resumeSubscription: resumeMutation.mutate,
    requestUpgrade: requestUpgradeMutation.mutate,
    requestDowngrade: requestDowngradeMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isResuming: resumeMutation.isPending,
    isRequestingUpgrade: requestUpgradeMutation.isPending,
    isRequestingDowngrade: requestDowngradeMutation.isPending,
  }
}

