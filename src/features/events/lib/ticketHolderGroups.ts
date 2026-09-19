export type TicketHolderRow = {
  id: number
  attendee_ids?: number[]
  group_key?: string
  ticket_count?: number
  ticket_numbers?: string[]
  ticket_types_label?: string
  total_paid?: number
  checked_in?: boolean
  checked_in_count?: number
  checked_in_total?: number
  purchased_at?: string
  guest?: { name?: string; email?: string; phone?: string }
  ticketPurchase?: { purchased_at?: string; ticketType?: { name?: string }; quantity?: number; unit_price?: number }
  tickets?: Array<{ ticket_number?: string; price_paid?: number; ticket_type?: { name?: string }; ticketType?: { name?: string } }>
  guestType?: { name?: string }
  guest_type?: { name?: string }
}

export function getTicketHolderAttendeeIds(row: TicketHolderRow): number[] {
  if (Array.isArray(row.attendee_ids) && row.attendee_ids.length > 0) {
    return row.attendee_ids
  }

  return [row.id]
}

export function areAllTicketHolderIdsSelected(ids: number[], selected: Set<number>): boolean {
  return ids.length > 0 && ids.every((id) => selected.has(id))
}

export function areAnyTicketHolderIdsSelected(ids: number[], selected: Set<number>): boolean {
  return ids.some((id) => selected.has(id))
}

export function getTicketTypeLabel(row: TicketHolderRow): string {
  return (
    row.ticket_types_label
    || row.ticketPurchase?.ticketType?.name
    || row.tickets?.[0]?.ticket_type?.name
    || row.tickets?.[0]?.ticketType?.name
    || (row.guestType || row.guest_type)?.name
    || 'Ticket'
  )
}

export function getTicketNumbersLabel(row: TicketHolderRow): string {
  const numbers = row.ticket_numbers?.length
    ? row.ticket_numbers
    : (row.tickets?.map((ticket) => ticket.ticket_number).filter(Boolean) as string[] | undefined)

  if (!numbers?.length) {
    return '-'
  }

  if (numbers.length === 1) {
    return numbers[0]
  }

  return `${numbers[0]} (+${numbers.length - 1})`
}

export function getTicketQuantity(row: TicketHolderRow): number {
  return row.ticket_count ?? row.ticketPurchase?.quantity ?? row.tickets?.length ?? 1
}

export function getTicketPaidLabel(row: TicketHolderRow): string {
  if (row.total_paid != null && row.total_paid > 0) {
    return `ETB ${Number(row.total_paid).toLocaleString()}`
  }

  const firstTicketPaid = row.tickets?.[0]?.price_paid
  if (firstTicketPaid != null) {
    return `ETB ${Number(firstTicketPaid).toLocaleString()}`
  }

  if (row.ticketPurchase?.unit_price != null) {
    const qty = getTicketQuantity(row)
    return `ETB ${Number(row.ticketPurchase.unit_price * qty).toLocaleString()}`
  }

  return '-'
}

export function getPurchasedDate(row: TicketHolderRow): string {
  const raw =
    row.purchased_at
    || row.ticketPurchase?.purchased_at
    || row.tickets?.[0]?.purchased_at

  return raw ? new Date(raw).toLocaleDateString() : '-'
}
