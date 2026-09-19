import api from '@/lib/api'

export type PayoutMethod = 'bank_transfer' | 'telebirr'

export type PayoutStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'

export interface PayoutAccount {
  id: number
  organizer_id: number
  method: PayoutMethod
  bank_name?: string | null
  account_name: string
  masked_account_number?: string | null
  is_default: boolean
  verified_at?: string | null
  created_at?: string
}

export interface PayoutBalance {
  currency: string
  lifetime_gross: number
  platform_fees: number
  referral_commissions: number
  available: number
  pending_clearance: number
  in_review: number
  paid_out: number
  next_release_at?: string | null
  minimum_payout_amount: number
  platform_fee_rate: number
  hold_rule: string
}

export interface PayoutLedgerEntry {
  id: number
  event_id?: number | null
  order_id?: string | null
  gross_amount: string | number
  platform_fee_amount: string | number
  referral_commission_amount: string | number
  net_payable: string | number
  status: string
  available_at?: string | null
  event?: { id: number; name: string } | null
}

export interface PayoutRequestItem {
  id: number
  net_payable: string | number
  ledger_entry?: PayoutLedgerEntry | null
}

export interface PayoutRequest {
  id: number
  reference: string
  organizer_id: number
  payout_account_id?: number | null
  amount: string | number
  currency: string
  status: PayoutStatus
  rejection_reason?: string | null
  provider?: string | null
  provider_reference?: string | null
  receipt_path?: string | null
  notes?: string | null
  reviewed_at?: string | null
  paid_at?: string | null
  created_at?: string
  organizer?: { id: number; name: string; email?: string | null } | null
  payout_account?: PayoutAccount | null
  requester?: { id: number; name?: string | null; email?: string | null } | null
  reviewer?: { id: number; name?: string | null; email?: string | null } | null
  items?: PayoutRequestItem[]
}

export interface AdminPayoutStats {
  currency: string
  platform_fee_rate: number
  gross_collected: number
  platform_revenue: number
  owed_to_organizers: number
  paid_out: number
  pending_requests: number
  pending_amount: number
}

export interface Paginated<T> {
  data: T[]
  total?: number
  current_page?: number
  last_page?: number
}

export const payoutApi = {
  // Organizer
  balance: () => api.get<PayoutBalance>('/organizer/payouts/balance'),
  list: (params?: { status?: string; page?: number; per_page?: number }) =>
    api.get<Paginated<PayoutRequest>>('/organizer/payouts', { params }),
  show: (id: number) => api.get<PayoutRequest>(`/organizer/payouts/${id}`),
  request: (data: { amount: number; payout_account_id?: number | null; notes?: string }) =>
    api.post<PayoutRequest>('/organizer/payouts', data),
  cancel: (id: number) => api.post<PayoutRequest>(`/organizer/payouts/${id}/cancel`),

  // Organizer payout accounts
  accounts: () => api.get<PayoutAccount[]>('/organizer/payout-accounts'),
  createAccount: (data: {
    method: PayoutMethod
    bank_name?: string
    account_name: string
    account_number: string
    is_default?: boolean
  }) => api.post<PayoutAccount>('/organizer/payout-accounts', data),
  updateAccount: (id: number, data: Partial<{ method: PayoutMethod; bank_name: string; account_name: string; account_number: string; is_default: boolean }>) =>
    api.patch<PayoutAccount>(`/organizer/payout-accounts/${id}`, data),
  deleteAccount: (id: number) => api.delete(`/organizer/payout-accounts/${id}`),

  // Admin
  adminStats: () => api.get<AdminPayoutStats>('/admin/payouts/stats'),
  adminList: (params?: { search?: string; status?: string; organizer_id?: number; page?: number; per_page?: number }) =>
    api.get<Paginated<PayoutRequest>>('/admin/payouts', { params }),
  adminShow: (id: number) => api.get<PayoutRequest>(`/admin/payouts/${id}`),
  adminApprove: (id: number, notes?: string) => api.post<PayoutRequest>(`/admin/payouts/${id}/approve`, { notes }),
  adminReject: (id: number, reason: string) => api.post<PayoutRequest>(`/admin/payouts/${id}/reject`, { reason }),
  adminMarkPaid: (id: number, data: { reference: string; notes?: string; receipt?: File | null }) => {
    if (data.receipt) {
      const form = new FormData()
      form.append('reference', data.reference)
      if (data.notes) form.append('notes', data.notes)
      form.append('receipt', data.receipt)
      return api.post<PayoutRequest>(`/admin/payouts/${id}/mark-paid`, form)
    }
    return api.post<PayoutRequest>(`/admin/payouts/${id}/mark-paid`, {
      reference: data.reference,
      notes: data.notes,
    })
  },
  adminVerifyAccount: (accountId: number) => api.post(`/admin/payout-accounts/${accountId}/verify`),
}

export default payoutApi
