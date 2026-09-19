import type { LayoutElement, LayoutSeat, SeatingSectionConfig } from '../types'

export const SEAT_W = 18
export const SEAT_H = 20
export const DEFAULT_SEAT_GAP = 24
export const DEFAULT_ROW_GAP = 28
/** Elements need a footprint even before seats exist, so drags have something to grab. */
export const MIN_ELEMENT_W = 80
export const MIN_ELEMENT_H = 60

export interface Point {
  x: number
  y: number
}

export interface Box extends Point {
  width: number
  height: number
}

export function snap(value: number, gridSize: number): number {
  if (!gridSize || gridSize <= 1) return Math.round(value)
  return Math.round(value / gridSize) * gridSize
}

export function rotatePoint(point: Point, origin: Point, degrees: number): Point {
  if (!degrees) return point
  const rad = (degrees * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = point.x - origin.x
  const dy = point.y - origin.y
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  }
}

/** Local bounds of an element's contents, in its own (unrotated) coordinate space. */
export function localBounds(element: LayoutElement): Box {
  if (element.seats.length === 0) {
    return {
      x: 0,
      y: 0,
      width: element.width ?? MIN_ELEMENT_W,
      height: element.height ?? MIN_ELEMENT_H,
    }
  }

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const seat of element.seats) {
    minX = Math.min(minX, seat.x - SEAT_W / 2)
    minY = Math.min(minY, seat.y - SEAT_H / 2)
    maxX = Math.max(maxX, seat.x + SEAT_W / 2)
    maxY = Math.max(maxY, seat.y + SEAT_H / 2)
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  }
}

/** Where a seat sits on the chart once its element's origin and rotation apply. */
export function seatToChart(element: LayoutElement, seat: LayoutSeat): Point {
  const local = { x: element.x + seat.x, y: element.y + seat.y }
  return rotatePoint(local, { x: element.x, y: element.y }, element.rotation)
}

/** Axis-aligned chart bounds of an element, accounting for rotation of its corners. */
export function chartBounds(element: LayoutElement): Box {
  const local = localBounds(element)
  const origin = { x: element.x, y: element.y }
  const corners: Point[] = [
    { x: element.x + local.x, y: element.y + local.y },
    { x: element.x + local.x + local.width, y: element.y + local.y },
    { x: element.x + local.x, y: element.y + local.y + local.height },
    { x: element.x + local.x + local.width, y: element.y + local.y + local.height },
  ].map((point) => rotatePoint(point, origin, element.rotation))

  const xs = corners.map((c) => c.x)
  const ys = corners.map((c) => c.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)

  return {
    x: minX,
    y: minY,
    width: Math.max(...xs) - minX,
    height: Math.max(...ys) - minY,
  }
}

export function boxesIntersect(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
  )
}

/** Normalizes a drag rectangle so width/height are always positive. */
export function boxFromPoints(a: Point, b: Point): Box {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  }
}

export interface GridSeatSlot {
  rowIndex: number
  colIndex: number
  x: number
  y: number
}

/** Row/column offsets for a seating group, optionally bowed toward the stage. */
export function gridSeatOffsets(
  rows: number,
  cols: number,
  config: SeatingSectionConfig = {},
): GridSeatSlot[] {
  const seatGap = config.seat_gap ?? DEFAULT_SEAT_GAP
  const rowGap = config.row_gap ?? DEFAULT_ROW_GAP
  const curve = config.curve ?? 0
  const slots: GridSeatSlot[] = []

  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    for (let colIndex = 0; colIndex < cols; colIndex++) {
      const t = cols <= 1 ? 0 : (colIndex - (cols - 1) / 2) / ((cols - 1) / 2)
      slots.push({
        rowIndex,
        colIndex,
        x: colIndex * seatGap,
        y: rowIndex * rowGap - curve * t * t,
      })
    }
  }

  return slots
}

/** Seat offsets around a table, evenly spaced on a circle or the square's perimeter. */
export function tableSeatOffsets(config: SeatingSectionConfig = {}): Point[] {
  const count = Math.max(1, config.seat_count ?? 8)
  const radius = config.radius ?? 46
  const shape = config.shape ?? 'round'
  const out: Point[] = []

  if (shape === 'round') {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2
      out.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius })
    }
    return out
  }

  // Square tables distribute seats side by side, starting on the top edge.
  const perSide = Math.ceil(count / 4)
  const step = (radius * 2) / (perSide + 1)
  for (let i = 0; i < count; i++) {
    const side = Math.floor(i / perSide)
    const indexOnSide = (i % perSide) + 1
    const offset = -radius + step * indexOnSide
    if (side === 0) out.push({ x: offset, y: -radius })
    else if (side === 1) out.push({ x: radius, y: offset })
    else if (side === 2) out.push({ x: -offset, y: radius })
    else out.push({ x: -radius, y: -offset })
  }

  return out
}

/** Fits a chart into a viewport box, returning the scale that shows all of it. */
export function fitScale(
  chartWidth: number,
  chartHeight: number,
  viewWidth: number,
  viewHeight: number,
): number {
  if (!chartWidth || !chartHeight || !viewWidth || !viewHeight) return 1
  return Math.min(viewWidth / chartWidth, viewHeight / chartHeight)
}
