import api from '../api'

export interface SubscriptionPlan {
  id: number
  name: string
  slug: string
  description: string | null
  price_monthly: number
  price_yearly: number
  currency: string
  features: string[]
  limits: Record<string, number>
  is_active?: boolean
  status?: 'active' | 'inactive'
  sort_order: number
  duration_days?: number | null
  is_recurring?: boolean
  created_at: string
  updated_at: string
}

export interface Organizer {
  id: number
  name: string
  email: string
  phone_number: string
  location?: string
}

export interface Subscription {
  id: number
  organizer_id: number
  subscription_plan_id: number
  requested_plan_id?: number | null
  scheduled_plan_id?: number | null
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'pending' | 'trial' | 'pending_upgrade' | 'pending_downgrade' | 'grace_period'
  billing_cycle: 'monthly' | 'yearly'
  starts_at: string | null
  ends_at: string | null
  cancelled_at: string | null
  trial_ends_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  payment_method: 'telebirr' | 'cbe_birr' | null
  metadata: Record<string, any> | null
  approved_by_admin?: boolean
  is_trial?: boolean
  trial_days?: number | null
  current_plan_snapshot?: Record<string, any> | null
  grace_days?: number
  grace_ends_at?: string | null
  plan?: SubscriptionPlan
  requestedPlan?: SubscriptionPlan
  scheduledPlan?: SubscriptionPlan
  organizer?: Organizer
  created_at: string
  updated_at: string
}

export interface SubscriptionHistory {
  id: number
  subscription_id: number
  action: string
  old_plan_id: number | null
  new_plan_id: number | null
  performed_by: 'admin' | 'system' | 'organizer'
  admin_id: number | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, any> | null
  oldPlan?: SubscriptionPlan | null
  newPlan?: SubscriptionPlan | null
  admin?: any | null
  created_at: string
  updated_at: string
}

export interface SubscriptionPayment {
  id: number
  subscription_id: number
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed'
  payment_method: 'telebirr' | 'cbe_birr' | null
  transaction_id: string | null
  payment_reference: string | null
  paid_at: string | null
  due_date: string | null
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface UsageStatistics {
  subscription: Subscription | null
  usage: {
    events?: {
      current: number
      limit: number | null
      unlimited: boolean
    }
    vendors?: {
      current: number
      limit: number | null
      unlimited: boolean
    }
    marketing_campaigns?: {
      current: number
      limit: number | null
      unlimited: boolean
    }
  }
}

export const subscriptionsApi = {
  // Subscription Plans
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await api.get('/subscription-plans')
    return response.data.data
  },

  async getPlan(id: number): Promise<SubscriptionPlan> {
    const response = await api.get(`/subscription-plans/${id}`)
    return response.data.data
  },

  // Subscriptions
  async getCurrentSubscription(): Promise<Subscription | null> {
    try {
      const response = await api.get('/subscriptions')
      return response.data?.data ?? null
    } catch (err: any) {
      if (err?.response?.status === 404) return null
      throw err
    }
  },

  async createSubscription(data: {
    subscription_plan_id: number
    billing_cycle: 'monthly' | 'yearly'
    trial_days?: number
  }): Promise<Subscription> {
    const response = await api.post('/subscriptions', data)
    return response.data.data
  },

  async getSubscription(id: number): Promise<Subscription> {
    const response = await api.get(`/subscriptions/${id}`)
    return response.data.data
  },

  async updateSubscription(
    id: number,
    data: {
      billing_cycle?: 'monthly' | 'yearly'
      payment_method?: 'telebirr' | 'cbe_birr'
    }
  ): Promise<Subscription> {
    const response = await api.put(`/subscriptions/${id}`, data)
    return response.data.data
  },

  async cancelSubscription(
    id: number,
    immediate: boolean = false
  ): Promise<Subscription> {
    const response = await api.post(`/subscriptions/${id}/cancel`, {
      immediate,
    })
    return response.data.data
  },

  async resumeSubscription(id: number): Promise<Subscription> {
    const response = await api.post(`/subscriptions/${id}/resume`)
    return response.data.data
  },

  async getUsageStatistics(): Promise<UsageStatistics> {
    const response = await api.get('/subscriptions/usage')
    return response.data.data
  },

  // Subscription Payments
  async initiatePayment(data: {
    subscription_id: number
    payment_method: 'telebirr' | 'cbe_birr'
    phone_number: string
  }): Promise<{
    payment_id: number
    payment_reference: string
    transaction_id: string
    amount: number
    currency: string
    payment_method: string
    phone_number: string
    expires_at: string
    message: string
  }> {
    const response = await api.post('/subscription-payments/initiate', data)
    return response.data.data
  },

  async confirmPayment(id: number): Promise<{
    success: boolean
    message: string
    payment: SubscriptionPayment
    subscription?: Subscription
  }> {
    const response = await api.post(`/subscription-payments/${id}/confirm`)
    return response.data
  },

  async getPayments(): Promise<SubscriptionPayment[]> {
    const response = await api.get('/subscription-payments')
    return response.data.data
  },

  async getPayment(id: number): Promise<SubscriptionPayment> {
    const response = await api.get(`/subscription-payments/${id}`)
    return response.data.data
  },

  async getUpcomingPayment(): Promise<SubscriptionPayment | null> {
    const response = await api.get('/subscription-payments/upcoming')
    return response.data.data
  },

  // Organizer subscription management
  async getOrganizerPlans(): Promise<SubscriptionPlan[]> {
    const response = await api.get('/organizer/plans')
    return response.data.data
  },

  async requestUpgrade(planId: number): Promise<Subscription> {
    const response = await api.post('/organizer/subscription/request-upgrade', {
      plan_id: planId,
    })
    return response.data.data
  },

  async requestDowngrade(planId: number): Promise<Subscription> {
    const response = await api.post('/organizer/subscription/request-downgrade', {
      plan_id: planId,
    })
    return response.data.data
  },

  async getSubscriptionHistory(): Promise<SubscriptionHistory[]> {
    const response = await api.get('/organizer/subscription/history')
    return response.data.data
  },

  // Admin subscription management
  async getAdminSubscriptions(params?: {
    status?: string
    plan?: string
    organizer_id?: number
    per_page?: number
  }): Promise<{ data: Subscription[] | { data: Subscription[]; [key: string]: any }; meta?: any }> {
    const response = await api.get('/admin/subscriptions', { params })
    // Backend returns { success: true, data: { data: [...], current_page, ... } } for paginated
    // or { success: true, data: [...] } for direct array
    return response.data
  },

  async getPendingApprovals(): Promise<Subscription[]> {
    const response = await api.get('/admin/subscriptions/pending-approvals')
    return response.data.data
  },

  async approveUpgrade(subscriptionId: number): Promise<Subscription> {
    const response = await api.post(`/admin/subscriptions/${subscriptionId}/approve-upgrade`)
    return response.data.data
  },

  async approveDowngrade(subscriptionId: number): Promise<Subscription> {
    const response = await api.post(`/admin/subscriptions/${subscriptionId}/approve-downgrade`)
    return response.data.data
  },

  async rejectRequest(subscriptionId: number, reason?: string): Promise<Subscription> {
    const response = await api.post(`/admin/subscriptions/${subscriptionId}/reject-request`, {
      reason,
    })
    return response.data.data
  },

  async modifyTrial(subscriptionId: number, days: number): Promise<Subscription> {
    const response = await api.post(`/admin/subscriptions/${subscriptionId}/modify-trial`, {
      days,
    })
    return response.data.data
  },

  async assignPlan(data: {
    organizer_id: number
    plan_id: number
    trial_days?: number
  }): Promise<Subscription> {
    const response = await api.post('/admin/subscriptions/assign-plan', data)
    return response.data.data
  },

  async extendSubscription(subscriptionId: number, days: number): Promise<Subscription> {
    const response = await api.post(`/admin/subscriptions/${subscriptionId}/extend`, {
      days,
    })
    return response.data.data
  },

  async cancelSubscriptionAdmin(subscriptionId: number, immediate: boolean = false): Promise<Subscription> {
    const response = await api.post(`/admin/subscriptions/${subscriptionId}/cancel`, {
      immediate,
    })
    return response.data.data
  },

  async getSubscriptionHistoryAdmin(subscriptionId: number): Promise<SubscriptionHistory[]> {
    const response = await api.get(`/admin/subscriptions/${subscriptionId}/history`)
    return response.data.data
  },

  async reactivateTrial(subscriptionId: number, days?: number): Promise<Subscription> {
    const response = await api.post(`/admin/subscriptions/${subscriptionId}/reactivate-trial`, {
      days,
    })
    return response.data.data
  },
}

