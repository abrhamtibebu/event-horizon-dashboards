export const REFERRAL_CODE_PREFIX = 'REF-'

export function extractReferralSuffix(code?: string | null): string {
  if (!code) return ''
  const upper = code.trim().toUpperCase()
  if (upper.startsWith(REFERRAL_CODE_PREFIX)) {
    return upper.slice(REFERRAL_CODE_PREFIX.length).replace(/[^A-Z0-9]/g, '').slice(0, 8)
  }
  return upper.replace(/[^A-Z0-9]/g, '').slice(0, 8)
}

export function toFullReferralCode(suffixOrFull: string): string {
  const trimmed = suffixOrFull.trim()
  if (!trimmed) return ''

  const upper = trimmed.toUpperCase()
  if (upper.startsWith(REFERRAL_CODE_PREFIX)) {
    const suffix = extractReferralSuffix(upper)
    return suffix ? `${REFERRAL_CODE_PREFIX}${suffix}` : ''
  }

  const suffix = upper.replace(/[^A-Z0-9]/g, '').slice(0, 8)
  return suffix ? `${REFERRAL_CODE_PREFIX}${suffix}` : ''
}

export function looksLikePhoneInput(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 9 && digits.length <= 13
}

/** Normalize URL/query value into what we show in the single promo field. */
export function promoCodeFromUrlParam(param: string, type: 'ref' | 'inv'): string {
  const trimmed = param.trim()
  if (!trimmed) return ''
  if (type === 'inv') return trimmed
  return extractReferralSuffix(trimmed) || trimmed
}

export function isPromoInputReadyForValidation(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (looksLikePhoneInput(trimmed)) return true
  return trimmed.replace(/[^A-Za-z0-9]/g, '').length >= 4
}

/** Value sent to the API: sales-agent phone or full REF- code. */
export function buildReferralApiValue(suffix: string, salesAgentPhone: string): string {
  const phone = salesAgentPhone.trim()
  if (phone) return phone
  return toFullReferralCode(suffix)
}

export function formatReferralSuffixInput(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
}

export function formatDiscountLineLabel(
  discountPercent?: number | null,
  discountLabel?: string | null,
): string {
  if (discountPercent != null && discountPercent > 0) {
    const pct = Number.isInteger(discountPercent) ? String(discountPercent) : String(discountPercent)
    return `Discount (${pct}%)`
  }
  if (discountLabel) {
    return `Discount (${discountLabel})`
  }
  return 'Discount'
}
