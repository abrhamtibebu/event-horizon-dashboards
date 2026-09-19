import { cn } from '@/lib/utils'
import { SEAT_H, SEAT_W } from './geometry'

export type SeatVisual = 'available' | 'taken' | 'selected'

export const NEUTRAL_AVAILABLE = '#cbd5e1'
export const TAKEN = '#41505a'
export const SELECTED = '#eab308'
export const SELECTED_EDGE = '#ca8a04'

/** Stable colours for tiers the organizer never explicitly coloured. */
export const TIER_PALETTE = [
  '#6366f1',
  '#0ea5e9',
  '#f97316',
  '#10b981',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
  '#f43f5e',
]

interface SeatGlyphProps {
  /** Centre of the seat, not its top-left corner. */
  cx?: number
  cy?: number
  rotation?: number
  visual: SeatVisual
  accent: string
  selectable?: boolean
  dimmed?: boolean
  outlined?: boolean
  title?: string
  onClick?: (event: React.MouseEvent) => void
  onPointerDown?: (event: React.PointerEvent) => void
}

/**
 * The one seat glyph used by the designer and the buyer map, so a seat looks
 * identical on both sides of the product.
 */
export function SeatGlyph({
  cx = SEAT_W / 2,
  cy = SEAT_H / 2,
  rotation = 0,
  visual,
  accent,
  selectable = false,
  dimmed = false,
  outlined = false,
  title,
  onClick,
  onPointerDown,
}: SeatGlyphProps) {
  const fill = visual === 'selected' ? SELECTED : visual === 'taken' ? TAKEN : accent
  const stroke = visual === 'selected' ? SELECTED_EDGE : visual === 'taken' ? TAKEN : accent
  const fillOpacity = visual === 'available' ? 0.22 : 1
  const x = cx - SEAT_W / 2
  const y = cy - SEAT_H / 2

  return (
    <g
      transform={
        rotation
          ? `translate(${x}, ${y}) rotate(${rotation}, ${SEAT_W / 2}, ${SEAT_H / 2})`
          : `translate(${x}, ${y})`
      }
      opacity={dimmed ? 0.35 : 1}
      className={cn(
        selectable ? 'cursor-pointer hover:opacity-80' : onClick && 'cursor-not-allowed',
      )}
      onClick={onClick}
      onPointerDown={onPointerDown}
    >
      {title && <title>{title}</title>}
      <rect
        x={2}
        y={0}
        width={SEAT_W - 4}
        height={12}
        rx={3.5}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={1.2}
      />
      <rect
        x={0}
        y={12.5}
        width={SEAT_W}
        height={7}
        rx={2.5}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={1.2}
      />
      {outlined && (
        <rect
          x={-2.5}
          y={-2.5}
          width={SEAT_W + 5}
          height={SEAT_H + 3}
          rx={5}
          fill="none"
          stroke={SELECTED_EDGE}
          strokeWidth={1.5}
          strokeDasharray="3 2"
        />
      )}
    </g>
  )
}

export function LegendGlyph({ visual, accent }: { visual: SeatVisual; accent: string }) {
  return (
    <svg width={16} height={18} viewBox={`0 0 ${SEAT_W} ${SEAT_H}`} aria-hidden>
      <SeatGlyph visual={visual} accent={accent} />
    </svg>
  )
}
