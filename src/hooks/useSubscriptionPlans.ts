import { useQuery } from '@tanstack/react-query'
import { subscriptionsApi, type SubscriptionPlan } from '@/lib/api/subscriptions'

export function useSubscriptionPlans() {
  const {
    data: plans,
    isLoading,
    error,
    refetch,
  } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionsApi.getPlans(),
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    plans: plans || [],
    isLoading,
    error,
    refetch,
  }
}

export function useSubscriptionPlan(id: number) {
  const {
    data: plan,
    isLoading,
    error,
    refetch,
  } = useQuery<SubscriptionPlan>({
    queryKey: ['subscription-plan', id],
    queryFn: () => subscriptionsApi.getPlan(id),
    enabled: !!id,
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    plan,
    isLoading,
    error,
    refetch,
  }
}

