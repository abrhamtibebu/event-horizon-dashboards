import type {
  DecorationType,
  OrganizerDecoration,
  OrganizerSeatingChart,
  OrganizerSeatingSection,
  SeatingElementType,
  SeatingSectionConfig,
  TableShape,
} from '@/lib/api/seating'
import type {
  PublicDecoration,
  PublicSeatingMap,
  PublicSeatingSection,
} from '@/lib/api/publicSeating'

export type { DecorationType, SeatingElementType, SeatingSectionConfig, TableShape }

/** A decoration in chart coordinates: entrance, exit, restroom, bar, text label. */
export interface LayoutDecoration {
  id: number
  type: DecorationType
  label: string
  icon: string | null
  x: number
  y: number
  width: number | null
  height: number | null
  rotation: number
  zIndex: number
  color: string
  fontSize: number
}

export type SeatStatus = 'available' | 'held' | 'sold' | 'blocked'

/** Seat position is an offset from its element's origin, not a chart coordinate. */
export interface LayoutSeat {
  id: number
  label: string
  rowLabel: string
  seatNumber: number
  x: number
  y: number
  rotation: number
  status: SeatStatus
}

export interface LayoutElement {
  id: number
  name: string
  type: SeatingElementType
  ticketTypeId: number | null
  ticketTypeName?: string | null
  color: string
  x: number
  y: number
  width: number | null
  height: number | null
  rotation: number
  zIndex: number
  capacity: number | null
  config: SeatingSectionConfig
  path?: string | null
  seats: LayoutSeat[]
}

export interface LayoutChart {
  id: number
  width: number
  height: number
  backgroundUrl: string | null
  gridSize: number
  elements: LayoutElement[]
  decorations: LayoutDecoration[]
}

function decorationOf(row: OrganizerDecoration | PublicDecoration): LayoutDecoration {
  return {
    id: row.id,
    type: row.type,
    label: row.label ?? '',
    icon: row.icon ?? null,
    x: row.x ?? 0,
    y: row.y ?? 0,
    width: row.width ?? null,
    height: row.height ?? null,
    rotation: row.rotation ?? 0,
    zIndex: row.z_index ?? 0,
    color: row.color ?? '#64748b',
    fontSize: row.font_size ?? 14,
  }
}

export const DEFAULT_CHART_WIDTH = 1000
export const DEFAULT_CHART_HEIGHT = 800
export const DEFAULT_GRID_SIZE = 10

function normalizeConfig(config?: SeatingSectionConfig | null): SeatingSectionConfig {
  return config ?? {}
}

function organizerElement(section: OrganizerSeatingSection): LayoutElement {
  return {
    id: section.id,
    name: section.name,
    type: section.type ?? 'seating_group',
    ticketTypeId: section.ticket_type_id ?? null,
    ticketTypeName: section.ticket_type?.name ?? null,
    color: section.color ?? '#6366f1',
    x: section.x ?? 0,
    y: section.y ?? 0,
    width: section.width ?? null,
    height: section.height ?? null,
    rotation: section.rotation ?? 0,
    zIndex: section.z_index ?? 0,
    capacity: section.capacity ?? null,
    config: normalizeConfig(section.config),
    path: section.path ?? null,
    seats: (section.seats ?? []).map((seat) => ({
      id: seat.id,
      label: seat.label,
      rowLabel: seat.row_label,
      seatNumber: seat.seat_number,
      x: seat.x ?? 0,
      y: seat.y ?? 0,
      rotation: seat.rotation ?? 0,
      status: seat.status,
    })),
  }
}

/** Organizer designer data to the shared layout model. */
export function fromOrganizerChart(chart: OrganizerSeatingChart): LayoutChart {
  return {
    id: chart.id,
    width: chart.width ?? DEFAULT_CHART_WIDTH,
    height: chart.height ?? DEFAULT_CHART_HEIGHT,
    backgroundUrl: chart.background_url ?? null,
    gridSize: chart.grid_size ?? DEFAULT_GRID_SIZE,
    elements: (chart.sections ?? []).map(organizerElement),
    decorations: (chart.elements ?? []).map(decorationOf),
  }
}

function publicElement(section: PublicSeatingSection): LayoutElement {
  const seats = section.seats ?? section.rows.flatMap((row) => row.seats)
  return {
    id: section.id,
    name: section.name,
    type: section.type ?? 'seating_group',
    ticketTypeId: section.ticket_type_id ?? null,
    ticketTypeName: section.ticket_type_name ?? null,
    color: section.color ?? '#6366f1',
    x: section.x ?? 0,
    y: section.y ?? 0,
    width: section.width ?? null,
    height: section.height ?? null,
    rotation: section.rotation ?? 0,
    zIndex: section.z_index ?? 0,
    capacity: section.capacity ?? null,
    config: normalizeConfig(section.config),
    path: section.path ?? null,
    seats: seats.map((seat) => ({
      id: seat.id,
      label: seat.label,
      rowLabel: seat.row_label ?? '',
      seatNumber: seat.seat_number,
      x: seat.x ?? 0,
      y: seat.y ?? 0,
      rotation: seat.rotation ?? 0,
      status: seat.status,
    })),
  }
}

/** Buyer map data to the same layout model the designer renders. */
export function fromPublicMap(map: PublicSeatingMap): LayoutChart | null {
  if (!map.chart) return null
  return {
    id: map.chart.id,
    width: map.chart.width ?? DEFAULT_CHART_WIDTH,
    height: map.chart.height ?? DEFAULT_CHART_HEIGHT,
    backgroundUrl: map.chart.background_url ?? null,
    gridSize: map.chart.grid_size ?? DEFAULT_GRID_SIZE,
    elements: map.chart.sections.map(publicElement),
    decorations: (map.chart.elements ?? []).map(decorationOf),
  }
}
