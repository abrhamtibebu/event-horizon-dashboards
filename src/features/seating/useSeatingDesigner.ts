import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { saveSeatingElements, type SeatingElementsPayload } from '@/lib/api/seating'
import type { LayoutChart, LayoutDecoration, LayoutElement, LayoutSeat } from './types'
import { snap as snapTo } from './render/geometry'

type DirtyMap = Record<number, true>

interface Snapshot {
  chart: LayoutChart
  dirtySections: DirtyMap
  dirtySeats: DirtyMap
  dirtyDecorations: DirtyMap
}

export interface DesignerState extends Snapshot {
  selectedElementIds: number[]
  selectedSeatIds: number[]
  selectedDecorationIds: number[]
  snapEnabled: boolean
  showGrid: boolean
  past: Snapshot[]
  future: Snapshot[]
}

export type ElementPatch = Partial<
  Pick<
    LayoutElement,
    | 'name'
    | 'type'
    | 'ticketTypeId'
    | 'color'
    | 'x'
    | 'y'
    | 'width'
    | 'height'
    | 'rotation'
    | 'zIndex'
    | 'capacity'
    | 'config'
  >
>

export type SeatPatch = Partial<Pick<LayoutSeat, 'x' | 'y' | 'rotation' | 'label' | 'status'>>

export type DecorationPatch = Partial<
  Pick<
    LayoutDecoration,
    'label' | 'icon' | 'x' | 'y' | 'width' | 'height' | 'rotation' | 'zIndex' | 'color' | 'fontSize'
  >
>

type Action =
  | { type: 'hydrate'; chart: LayoutChart }
  | { type: 'selectElements'; ids: number[]; additive?: boolean }
  | { type: 'selectSeats'; ids: number[]; additive?: boolean }
  | { type: 'clearSelection' }
  | { type: 'moveElements'; ids: number[]; dx: number; dy: number; commit?: boolean }
  | { type: 'moveSeats'; ids: number[]; dx: number; dy: number; commit?: boolean }
  | { type: 'patchElement'; id: number; patch: ElementPatch }
  | { type: 'patchSeats'; ids: number[]; patch: SeatPatch }
  | { type: 'labelSeats'; labels: Record<number, string> }
  | { type: 'addElement'; element: LayoutElement }
  | { type: 'replaceElement'; element: LayoutElement }
  | { type: 'removeElement'; id: number }
  | { type: 'selectDecorations'; ids: number[]; additive?: boolean }
  | { type: 'moveDecorations'; ids: number[]; dx: number; dy: number; commit?: boolean }
  | { type: 'patchDecoration'; id: number; patch: DecorationPatch }
  | { type: 'addDecoration'; decoration: LayoutDecoration }
  | { type: 'removeDecoration'; id: number }
  | { type: 'undo' }
  | { type: 'redo' }
  | {
      type: 'markSaved'
      sectionIds: number[]
      seatIds: number[]
      decorationIds: number[]
    }
  | { type: 'toggleSnap' }
  | { type: 'toggleGrid' }

const MAX_HISTORY = 50

const emptyChart: LayoutChart = {
  id: 0,
  width: 1000,
  height: 800,
  backgroundUrl: null,
  gridSize: 10,
  elements: [],
  decorations: [],
}

function snapshotOf(state: DesignerState): Snapshot {
  return {
    chart: state.chart,
    dirtySections: state.dirtySections,
    dirtySeats: state.dirtySeats,
    dirtyDecorations: state.dirtyDecorations,
  }
}

function pushHistory(state: DesignerState): Pick<DesignerState, 'past' | 'future'> {
  return {
    past: [...state.past.slice(-MAX_HISTORY), snapshotOf(state)],
    future: [],
  }
}

function markDirty(map: DirtyMap, ids: number[]): DirtyMap {
  if (ids.length === 0) return map
  const next = { ...map }
  for (const id of ids) next[id] = true
  return next
}

function mapElements(
  chart: LayoutChart,
  ids: number[],
  fn: (element: LayoutElement) => LayoutElement,
): LayoutChart {
  const set = new Set(ids)
  return {
    ...chart,
    elements: chart.elements.map((element) => (set.has(element.id) ? fn(element) : element)),
  }
}

function mapSeats(
  chart: LayoutChart,
  ids: number[],
  fn: (seat: LayoutSeat, element: LayoutElement) => LayoutSeat,
): LayoutChart {
  const set = new Set(ids)
  return {
    ...chart,
    elements: chart.elements.map((element) => {
      if (!element.seats.some((seat) => set.has(seat.id))) return element
      return {
        ...element,
        seats: element.seats.map((seat) => (set.has(seat.id) ? fn(seat, element) : seat)),
      }
    }),
  }
}

function toggleIds(current: number[], ids: number[], additive?: boolean): number[] {
  if (!additive) return ids
  const set = new Set(current)
  for (const id of ids) {
    if (set.has(id)) set.delete(id)
    else set.add(id)
  }
  return [...set]
}

function reducer(state: DesignerState, action: Action): DesignerState {
  switch (action.type) {
    case 'hydrate': {
      // Server data wins, but keep selections that still point at live objects.
      const elementIds = new Set(action.chart.elements.map((e) => e.id))
      const seatIds = new Set(action.chart.elements.flatMap((e) => e.seats.map((s) => s.id)))
      const decorationIds = new Set(action.chart.decorations.map((d) => d.id))
      return {
        ...state,
        chart: action.chart,
        selectedElementIds: state.selectedElementIds.filter((id) => elementIds.has(id)),
        selectedSeatIds: state.selectedSeatIds.filter((id) => seatIds.has(id)),
        selectedDecorationIds: state.selectedDecorationIds.filter((id) => decorationIds.has(id)),
        past: [],
        future: [],
        dirtySections: {},
        dirtySeats: {},
        dirtyDecorations: {},
      }
    }

    case 'selectElements':
      return {
        ...state,
        selectedElementIds: toggleIds(state.selectedElementIds, action.ids, action.additive),
        selectedSeatIds: action.additive ? state.selectedSeatIds : [],
        selectedDecorationIds: [],
      }

    case 'selectSeats':
      return {
        ...state,
        selectedSeatIds: toggleIds(state.selectedSeatIds, action.ids, action.additive),
        selectedDecorationIds: [],
      }

    case 'clearSelection':
      return {
        ...state,
        selectedElementIds: [],
        selectedSeatIds: [],
        selectedDecorationIds: [],
      }

    case 'moveElements': {
      const chart = mapElements(state.chart, action.ids, (element) => ({
        ...element,
        x: element.x + action.dx,
        y: element.y + action.dy,
      }))
      return {
        ...state,
        ...(action.commit ? pushHistory(state) : {}),
        chart,
        dirtySections: markDirty(state.dirtySections, action.ids),
      }
    }

    case 'moveSeats': {
      const chart = mapSeats(state.chart, action.ids, (seat) => ({
        ...seat,
        x: seat.x + action.dx,
        y: seat.y + action.dy,
      }))
      return {
        ...state,
        ...(action.commit ? pushHistory(state) : {}),
        chart,
        dirtySeats: markDirty(state.dirtySeats, action.ids),
      }
    }

    case 'patchElement': {
      const chart = mapElements(state.chart, [action.id], (element) => ({
        ...element,
        ...action.patch,
      }))
      return {
        ...state,
        ...pushHistory(state),
        chart,
        dirtySections: markDirty(state.dirtySections, [action.id]),
      }
    }

    case 'patchSeats': {
      const chart = mapSeats(state.chart, action.ids, (seat) => ({ ...seat, ...action.patch }))
      return {
        ...state,
        ...pushHistory(state),
        chart,
        dirtySeats: markDirty(state.dirtySeats, action.ids),
      }
    }

    case 'labelSeats': {
      const ids = Object.keys(action.labels).map(Number)
      const chart = mapSeats(state.chart, ids, (seat) => ({
        ...seat,
        label: action.labels[seat.id] ?? seat.label,
      }))
      return {
        ...state,
        ...pushHistory(state),
        chart,
        dirtySeats: markDirty(state.dirtySeats, ids),
      }
    }

    case 'addElement':
      return {
        ...state,
        ...pushHistory(state),
        chart: { ...state.chart, elements: [...state.chart.elements, action.element] },
        selectedElementIds: [action.element.id],
        selectedSeatIds: [],
      }

    case 'replaceElement':
      return {
        ...state,
        chart: {
          ...state.chart,
          elements: state.chart.elements.map((element) =>
            element.id === action.element.id ? action.element : element,
          ),
        },
      }

    case 'removeElement':
      return {
        ...state,
        ...pushHistory(state),
        chart: {
          ...state.chart,
          elements: state.chart.elements.filter((element) => element.id !== action.id),
        },
        selectedElementIds: state.selectedElementIds.filter((id) => id !== action.id),
      }

    case 'selectDecorations':
      return {
        ...state,
        selectedDecorationIds: toggleIds(
          state.selectedDecorationIds,
          action.ids,
          action.additive,
        ),
        selectedElementIds: [],
        selectedSeatIds: [],
      }

    case 'moveDecorations': {
      const ids = new Set(action.ids)
      return {
        ...state,
        ...(action.commit ? pushHistory(state) : {}),
        chart: {
          ...state.chart,
          decorations: state.chart.decorations.map((decoration) =>
            ids.has(decoration.id)
              ? { ...decoration, x: decoration.x + action.dx, y: decoration.y + action.dy }
              : decoration,
          ),
        },
        dirtyDecorations: markDirty(state.dirtyDecorations, action.ids),
      }
    }

    case 'patchDecoration':
      return {
        ...state,
        ...pushHistory(state),
        chart: {
          ...state.chart,
          decorations: state.chart.decorations.map((decoration) =>
            decoration.id === action.id ? { ...decoration, ...action.patch } : decoration,
          ),
        },
        dirtyDecorations: markDirty(state.dirtyDecorations, [action.id]),
      }

    case 'addDecoration':
      return {
        ...state,
        ...pushHistory(state),
        chart: {
          ...state.chart,
          decorations: [...state.chart.decorations, action.decoration],
        },
        selectedDecorationIds: [action.decoration.id],
        selectedElementIds: [],
        selectedSeatIds: [],
      }

    case 'removeDecoration':
      return {
        ...state,
        ...pushHistory(state),
        chart: {
          ...state.chart,
          decorations: state.chart.decorations.filter(
            (decoration) => decoration.id !== action.id,
          ),
        },
        selectedDecorationIds: state.selectedDecorationIds.filter((id) => id !== action.id),
      }

    case 'undo': {
      const previous = state.past[state.past.length - 1]
      if (!previous) return state
      return {
        ...state,
        chart: previous.chart,
        // Whatever the undo changed still has to reach the server.
        dirtySections: { ...state.dirtySections, ...previous.dirtySections },
        dirtySeats: { ...state.dirtySeats, ...previous.dirtySeats },
        dirtyDecorations: { ...state.dirtyDecorations, ...previous.dirtyDecorations },
        past: state.past.slice(0, -1),
        future: [snapshotOf(state), ...state.future],
      }
    }

    case 'redo': {
      const next = state.future[0]
      if (!next) return state
      return {
        ...state,
        chart: next.chart,
        dirtySections: { ...state.dirtySections, ...next.dirtySections },
        dirtySeats: { ...state.dirtySeats, ...next.dirtySeats },
        dirtyDecorations: { ...state.dirtyDecorations, ...next.dirtyDecorations },
        past: [...state.past, snapshotOf(state)],
        future: state.future.slice(1),
      }
    }

    case 'markSaved': {
      const dirtySections = { ...state.dirtySections }
      const dirtySeats = { ...state.dirtySeats }
      const dirtyDecorations = { ...state.dirtyDecorations }
      for (const id of action.sectionIds) delete dirtySections[id]
      for (const id of action.seatIds) delete dirtySeats[id]
      for (const id of action.decorationIds) delete dirtyDecorations[id]
      return { ...state, dirtySections, dirtySeats, dirtyDecorations }
    }

    case 'toggleSnap':
      return { ...state, snapEnabled: !state.snapEnabled }

    case 'toggleGrid':
      return { ...state, showGrid: !state.showGrid }

    default:
      return state
  }
}

const SAVE_DEBOUNCE_MS = 700

interface Options {
  eventId: number
  chart: LayoutChart | null
  onSaveError?: (error: unknown) => void
}

/**
 * Designer state with undo/redo and batched persistence. Dragging mutates local
 * state on every frame and only the settled result is flushed to the API.
 */
export function useSeatingDesigner({ eventId, chart, onSaveError }: Options) {
  const [state, dispatch] = useReducer(reducer, {
    chart: chart ?? emptyChart,
    selectedElementIds: [],
    selectedSeatIds: [],
    selectedDecorationIds: [],
    snapEnabled: true,
    showGrid: true,
    past: [],
    future: [],
    dirtySections: {},
    dirtySeats: {},
    dirtyDecorations: {},
  } satisfies DesignerState)

  const chartRef = useRef(state.chart)
  chartRef.current = state.chart
  const savingRef = useRef(false)

  // Re-hydrating on every server response would fight in-flight edits, so only
  // adopt server data when nothing local is pending.
  const hasPending =
    Object.keys(state.dirtySections).length > 0 ||
    Object.keys(state.dirtySeats).length > 0 ||
    Object.keys(state.dirtyDecorations).length > 0
  // Seat counts belong in the key: generating seats changes them without adding elements.
  const serverVersion = chart
    ? [
        chart.id,
        `${chart.width}x${chart.height}`,
        chart.backgroundUrl,
        chart.elements.map((element) => `${element.id}#${element.seats.length}`).join(','),
        chart.decorations.map((decoration) => decoration.id).join(','),
      ].join('|')
    : null

  useEffect(() => {
    if (!chart || hasPending || savingRef.current) return
    dispatch({ type: 'hydrate', chart })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverVersion])

  const flush = useCallback(async () => {
    const sectionIds = Object.keys(state.dirtySections).map(Number)
    const seatIds = Object.keys(state.dirtySeats).map(Number)
    const decorationIds = Object.keys(state.dirtyDecorations).map(Number)
    if (sectionIds.length === 0 && seatIds.length === 0 && decorationIds.length === 0) return

    const current = chartRef.current
    const payload: SeatingElementsPayload = {}

    if (sectionIds.length) {
      const byId = new Map(current.elements.map((element) => [element.id, element]))
      payload.sections = sectionIds
        .map((id) => byId.get(id))
        .filter((element): element is LayoutElement => Boolean(element))
        .map((element) => ({
          id: element.id,
          name: element.name,
          type: element.type,
          ticket_type_id: element.ticketTypeId,
          color: element.color,
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          rotation: element.rotation,
          z_index: element.zIndex,
          capacity: element.capacity,
          config: element.config,
        }))
    }

    if (seatIds.length) {
      const seatById = new Map<number, LayoutSeat>()
      for (const element of current.elements) {
        for (const seat of element.seats) seatById.set(seat.id, seat)
      }
      payload.seats = seatIds
        .map((id) => seatById.get(id))
        .filter((seat): seat is LayoutSeat => Boolean(seat))
        .map((seat) => ({
          id: seat.id,
          x: seat.x,
          y: seat.y,
          rotation: seat.rotation,
          label: seat.label,
          status: seat.status === 'blocked' ? ('blocked' as const) : ('available' as const),
        }))
    }

    if (decorationIds.length) {
      const byId = new Map(current.decorations.map((decoration) => [decoration.id, decoration]))
      payload.decorations = decorationIds
        .map((id) => byId.get(id))
        .filter((decoration): decoration is LayoutDecoration => Boolean(decoration))
        .map((decoration) => ({
          id: decoration.id,
          label: decoration.label,
          icon: decoration.icon,
          x: decoration.x,
          y: decoration.y,
          width: decoration.width,
          height: decoration.height,
          rotation: decoration.rotation,
          z_index: decoration.zIndex,
          color: decoration.color,
          font_size: decoration.fontSize,
        }))
    }

    savingRef.current = true
    try {
      await saveSeatingElements(eventId, payload)
      dispatch({ type: 'markSaved', sectionIds, seatIds, decorationIds })
    } catch (error) {
      onSaveError?.(error)
    } finally {
      savingRef.current = false
    }
  }, [eventId, state.dirtySections, state.dirtySeats, state.dirtyDecorations, onSaveError])

  useEffect(() => {
    if (!hasPending) return
    const timer = setTimeout(() => void flush(), SAVE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [hasPending, flush])

  const snapValue = useCallback(
    (value: number) => (state.snapEnabled ? snapTo(value, state.chart.gridSize) : Math.round(value)),
    [state.snapEnabled, state.chart.gridSize],
  )

  const selectedElements = useMemo(() => {
    const set = new Set(state.selectedElementIds)
    return state.chart.elements.filter((element) => set.has(element.id))
  }, [state.chart.elements, state.selectedElementIds])

  return {
    state,
    dispatch,
    flush,
    snapValue,
    selectedElements,
    hasPending,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  }
}
