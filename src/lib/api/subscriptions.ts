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
  is_active: boolean
  sort_order: number
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
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'pending'
  billing_cycle: 'monthly' | 'yearly'
  starts_at: string | null
  ends_at: string | null
  cancelled_at: string | null
  trial_ends_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  payment_method: 'telebirr' | 'cbe_birr' | null
  metadata: Record<string, any> | null
  plan?: SubscriptionPlan
  organizer?: Organizer
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
    const response = await api.get('/subscriptions')
    return response.data.data
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
}

