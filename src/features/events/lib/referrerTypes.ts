export const REFERRER_TYPES = [
  { value: 'sales_agent', label: 'Sales agent' },
  { value: 'usher', label: 'Usher' },
  { value: 'shop', label: 'Shop / retail partner' },
  { value: 'food_vendor', label: 'Food vendor' },
  { value: 'souvenir_vendor', label: 'Souvenir vendor' },
  { value: 'booth_holder', label: 'Booth holder' },
  { value: 'event_vendor', label: 'Event vendor' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'other', label: 'Other partner' },
] as const

export type ReferrerType = (typeof REFERRER_TYPES)[number]['value']

export function getReferrerTypeLabel(type?: string | null): string {
  return REFERRER_TYPES.find((t) => t.value === type)?.label ?? 'Partner'
}

export function getPartnerDisplayName(referral: {
  partner_name?: string | null
  campaign_name?: string | null
  vendor?: { name?: string } | null
  usher?: { name?: string } | null
}): string {
  return referral.partner_name || referral.usher?.name || referral.vendor?.name || referral.campaign_name || 'Partner'
}
