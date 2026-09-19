import api from '../api'

export type SeatingMode = 'general_admission' | 'reserved_seating'

export interface OrganizerSeat {
  id: number
  section_id: number
  row_label: string
  seat_number: number
  label: string
  status: 'available' | 'blocked'
  x?: number | null
  y?: number | null
  rotation?: number
}

export type SeatingElementType = 'seating_group' | 'standing' | 'table'

export type TableShape = 'round' | 'square'

/** Element-specific settings; only the keys for a given type are meaningful. */
export interface SeatingSectionConfig {
  rows?: number
  cols?: number
  seat_gap?: number
  row_gap?: number
  curve?: number
  shape?: TableShape
  seat_count?: number
  radius?: number
}

export interface OrganizerSeatingSection {
  id: number
  name: string
  type: SeatingElementType
  ticket_type_id: number | null
  ticket_type?: { id: number; name: string } | null
  sort_order: number
  color?: string
  path?: string | null
  label_x?: number | null
  label_y?: number | null
  /** Element origin on the chart. Seat x/y are offsets from here. */
  x?: number
  y?: number
  width?: number | null
  height?: number | null
  rotation?: number
  z_index?: number
  capacity?: number | null
  config?: SeatingSectionConfig | null
  seats?: OrganizerSeat[]
}

export type DecorationType = 'poi' | 'text' | 'shape'

/** Wayfinding markers and text labels. Carries no inventory. */
export interface OrganizerDecoration {
  id: number
  type: DecorationType
  label?: string | null
  icon?: string | null
  x: number
  y: number
  width?: number | null
  height?: number | null
  rotation?: number
  z_index?: number
  color?: string
  font_size?: number
}

export interface OrganizerSeatingChart {
  id: number
  name: string
  is_published: boolean
  width?: number
  height?: number
  background_url?: string | null
  grid_size?: number
  sections: OrganizerSeatingSection[]
  elements?: OrganizerDecoration[]
}

export interface SeatingElementsPayload {
  sections?: Array<
    { id: number } & Partial<
      Pick<
        OrganizerSeatingSection,
        | 'name'
        | 'type'
        | 'ticket_type_id'
        | 'color'
        | 'x'
        | 'y'
        | 'width'
        | 'height'
        | 'rotation'
        | 'z_index'
        | 'capacity'
        | 'config'
        | 'path'
        | 'label_x'
        | 'label_y'
      >
    >
  >
  seats?: Array<{
    id: number
    x?: number
    y?: number
    rotation?: number
    label?: string
    status?: 'available' | 'blocked'
  }>
  decorations?: Array<{ id: number } & Partial<Omit<OrganizerDecoration, 'id' | 'type'>>>
}

export async function createDecoration(
  eventId: number,
  payload: { type: DecorationType } & Partial<Omit<OrganizerDecoration, 'id' | 'type'>>,
): Promise<OrganizerDecoration> {
  const { data } = await api.post(`/events/${eventId}/seating/decorations`, payload)
  return data
}

export async function deleteDecoration(eventId: number, elementId: number) {
  const { data } = await api.delete(`/events/${eventId}/seating/decorations/${elementId}`)
  return data
}

export interface OrganizerSeatingResponse {
  seating_mode: SeatingMode
  chart: OrganizerSeatingChart
}

export async function getEventSeating(eventId: number): Promise<OrganizerSeatingResponse> {
  const { data } = await api.get(`/events/${eventId}/seating`)
  return data
}

export async function updateSeatingMode(
  eventId: number,
  seating_mode: SeatingMode,
): Promise<{ seating_mode: SeatingMode }> {
  const { data } = await api.put(`/events/${eventId}/seating/mode`, { seating_mode })
  return data
}

export async function updateChartLayout(
  eventId: number,
  payload: {
    width?: number
    height?: number
    background_url?: string | null
    grid_size?: number
  },
) {
  const { data } = await api.put(`/events/${eventId}/seating/layout`, payload)
  return data as OrganizerSeatingChart
}

/** Uploads venue artwork (SVG kept as-is, or PNG/JPG/WebP) as the chart background. */
export async function uploadSeatingBackground(
  eventId: number,
  file: File,
): Promise<OrganizerSeatingChart> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post(`/events/${eventId}/seating/background`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data as OrganizerSeatingChart
}

export async function removeSeatingBackground(
  eventId: number,
): Promise<OrganizerSeatingChart> {
  const { data } = await api.delete(`/events/${eventId}/seating/background`)
  return data as OrganizerSeatingChart
}

export async function publishSeatingChart(
  eventId: number,
  is_published: boolean,
): Promise<OrganizerSeatingChart> {
  const { data } = await api.post(`/events/${eventId}/seating/publish`, { is_published })
  return data
}

type SectionWriteFields = Partial<
  Pick<
    OrganizerSeatingSection,
    | 'type'
    | 'ticket_type_id'
    | 'sort_order'
    | 'color'
    | 'path'
    | 'label_x'
    | 'label_y'
    | 'x'
    | 'y'
    | 'width'
    | 'height'
    | 'rotation'
    | 'z_index'
    | 'capacity'
    | 'config'
  >
>

export async function createSeatingSection(
  eventId: number,
  payload: { name: string } & SectionWriteFields,
): Promise<OrganizerSeatingSection> {
  const { data } = await api.post(`/events/${eventId}/seating/sections`, payload)
  return data
}

export async function updateSeatingSection(
  eventId: number,
  sectionId: number,
  payload: { name?: string } & SectionWriteFields,
): Promise<OrganizerSeatingSection> {
  const { data } = await api.put(`/events/${eventId}/seating/sections/${sectionId}`, payload)
  return data
}

/**
 * Batched designer save. Dragging produces far too many changes for one request
 * per gesture, so the designer accumulates them and flushes here.
 */
export async function saveSeatingElements(
  eventId: number,
  payload: SeatingElementsPayload,
): Promise<{ sections_updated: number; seats_updated: number }> {
  const { data } = await api.patch(`/events/${eventId}/seating/elements`, payload)
  return data
}

export async function deleteSeatingSection(eventId: number, sectionId: number) {
  const { data } = await api.delete(`/events/${eventId}/seating/sections/${sectionId}`)
  return data
}

export async function generateSectionSeats(
  eventId: number,
  sectionId: number,
  payload: {
    row_start: string
    row_end: string
    seats_per_row: number
    origin_x?: number
    origin_y?: number
    seat_gap?: number
    row_gap?: number
    curve?: number
    rotation?: number
    replace?: boolean
  },
) {
  const { data } = await api.post(
    `/events/${eventId}/seating/sections/${sectionId}/generate`,
    payload,
  )
  return data as { created: number; section: OrganizerSeatingSection }
}

/** Places seats around a table; offsets are relative to the table centre. */
export async function generateTableSeats(
  eventId: number,
  sectionId: number,
  payload: {
    seat_count: number
    shape?: TableShape
    radius?: number
    row_label?: string
  },
) {
  const { data } = await api.post(
    `/events/${eventId}/seating/sections/${sectionId}/generate-table`,
    payload,
  )
  return data as { created: number; section: OrganizerSeatingSection }
}

export async function updateSeatsStatus(
  eventId: number,
  seat_ids: number[],
  status: 'available' | 'blocked',
) {
  const { data } = await api.patch(`/events/${eventId}/seating/seats`, { seat_ids, status })
  return data
}

export async function updateSeatPositions(
  eventId: number,
  positions: Array<{ id: number; x: number; y: number; rotation?: number }>,
) {
  const { data } = await api.patch(`/events/${eventId}/seating/seats`, { positions })
  return data
}
