import type { LayoutSeat } from './types'

export type LabelScheme = 'row_number' | 'continuous' | 'odd' | 'even'

export interface LabelOptions {
  scheme: LabelScheme
  prefix?: string
  start?: number
  /** Number right-to-left instead of left-to-right. */
  reverse?: boolean
}

const ROW_TOLERANCE = 12

/** Groups seats into visual rows by y, then orders each row by x. */
function visualRows(seats: LayoutSeat[]): LayoutSeat[][] {
  const sorted = [...seats].sort((a, b) => a.y - b.y || a.x - b.x)
  const rows: LayoutSeat[][] = []

  for (const seat of sorted) {
    const row = rows[rows.length - 1]
    if (row && Math.abs(row[0].y - seat.y) <= ROW_TOLERANCE) row.push(seat)
    else rows.push([seat])
  }

  return rows.map((row) => row.sort((a, b) => a.x - b.x))
}

/**
 * Relabels a seat selection in reading order. Returns a sparse map so callers can
 * apply it straight to state.
 */
export function autoLabel(seats: LayoutSeat[], options: LabelOptions): Record<number, string> {
  const { scheme, prefix = '', start = 1, reverse = false } = options
  const rows = visualRows(seats)
  const out: Record<number, string> = {}
  let running = start

  rows.forEach((row, rowIndex) => {
    const ordered = reverse ? [...row].reverse() : row

    ordered.forEach((seat, indexInRow) => {
      if (scheme === 'row_number') {
        const rowLabel = seat.rowLabel || String.fromCharCode(65 + (rowIndex % 26))
        out[seat.id] = `${prefix}${rowLabel}-${start + indexInRow}`
        return
      }

      if (scheme === 'odd' || scheme === 'even') {
        const base = scheme === 'odd' ? 1 : 2
        out[seat.id] = `${prefix}${base + indexInRow * 2}`
        return
      }

      out[seat.id] = `${prefix}${running}`
      running += 1
    })
  })

  return out
}

export const LABEL_SCHEME_LABELS: Record<LabelScheme, string> = {
  row_number: 'Row letter + number (A-1)',
  continuous: 'Continuous numbering (1, 2, 3…)',
  odd: 'Odd numbers only (1, 3, 5…)',
  even: 'Even numbers only (2, 4, 6…)',
}
