import { useQuery } from '@tanstack/react-query'
import { subscriptionsApi, type UsageStatistics } from '@/lib/api/subscriptions'
import { useSubscription } from './useSubscription'

export function useFeatureAccess() {
  const { subscription } = useSubscription()
  const {
    data: usage,
    isLoading,
    error,
    refetch,
  } = useQuery<UsageStatistics>({
    queryKey: ['subscription-usage'],
    queryFn: () => subscriptionsApi.getUsageStatistics(),
    retry: false, // Don't retry if endpoint doesn't exist
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error: any) => {
      // Silently handle 404 errors (endpoint might not be implemented yet)
      if (error?.response?.status !== 404) {
        console.error('Failed to fetch usage statistics:', error)
      }
    },
  })

  const hasFeature = (feature: string): boolean => {
    if (!subscription?.plan) return false
    return subscription.plan.features?.includes(feature) || false
  }

  const getLimit = (limitName: string): number | null => {
    if (!subscription?.plan) return null
    return subscription.plan.limits?.[limitName] ?? null
  }

  const isUnlimited = (limitName: string): boolean => {
    const limit = getLimit(limitName)
    return limit === -1 || limit === null
  }

  const canUseTicketing = (): boolean => {
    return hasFeature('ticketing')
  }

  const canUseVendors = (): boolean => {
    return hasFeature('vendor_workflow') || hasFeature('vendor_management')
  }

  const canUseMarketing = (): boolean => {
    return hasFeature('marketing_campaigns')
  }

  const canUseBadges = (): boolean => {
    return hasFeature('badge_generation') || hasFeature('badge_templates')
  }

  const canCreateEvent = (): { allowed: boolean; current?: number; limit?: number | null } => {
    if (!subscription) {
      return { allowed: false }
    }

    const eventsLimit = getLimit('events_per_month')
    if (isUnlimited('events_per_month')) {
      return { allowed: true }
    }

    const current = usage?.usage?.events?.current ?? 0
    const limit = eventsLimit

    return {
      allowed: limit === null || current < limit,
      current,
      limit,
    }
  }

  return {
    subscription,
    usage,
    isLoading,
    error,
    refetch,
    hasFeature,
    getLimit,
    isUnlimited,
    canUseTicketing,
    canUseVendors,
    canUseMarketing,
    canUseBadges,
    canCreateEvent,
  }
}

